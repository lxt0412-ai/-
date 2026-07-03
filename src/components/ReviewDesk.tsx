import { Check, Edit3, PhoneCall, Siren, XCircle, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReviewCase, ReviewStatus } from '../types';
import { RiskBadge } from './common';

interface Props {
  cases: ReviewCase[];
  onChange: (cases: ReviewCase[]) => void;
}

const actions: Array<{ label: string; status: ReviewStatus; icon: LucideIcon }> = [
  { label: '确认发送', status: 'approved', icon: Check },
  { label: '修改后发送', status: 'modified', icon: Edit3 },
  { label: '升级线下就医提醒', status: 'escalated', icon: Siren },
  { label: '电话随访', status: 'escalated', icon: PhoneCall },
  { label: '关闭任务', status: 'closed', icon: XCircle },
];

export function ReviewDesk({ cases, onChange }: Props) {
  const sortedCases = useMemo(
    () => [...cases].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [cases],
  );
  const [selectedCaseId, setSelectedCaseId] = useState(sortedCases[0]?.case_id ?? '');
  const selectedCase = sortedCases.find((item) => item.case_id === selectedCaseId) ?? sortedCases[0];
  const [draft, setDraft] = useState(selectedCase?.reviewer_note || selectedCase?.ai_draft || '');

  useEffect(() => {
    if (!selectedCaseId && sortedCases[0]) {
      setSelectedCaseId(sortedCases[0].case_id);
    }
  }, [selectedCaseId, sortedCases]);

  useEffect(() => {
    setDraft(selectedCase?.reviewer_note || selectedCase?.ai_draft || '');
  }, [selectedCase?.case_id]);

  const updateStatus = (status: ReviewStatus) => {
    if (!selectedCase) return;
    onChange(cases.map((item) => (
      item.case_id === selectedCase.case_id
        ? {
          ...item,
          status,
          reviewed_at: new Date().toISOString(),
          reviewer_note: draft,
        }
        : item
    )));
  };

  return (
    <section className="content-grid">
      <div className="module-header">
        <p className="eyebrow">Module 05</p>
        <h2>医生/健康管理师审核台</h2>
        <p>承接高风险和安全审核未通过的任务，完成确认、修改、升级、随访或关闭。</p>
      </div>

      <div className="review-console">
        <aside className="card task-list">
          <div className="task-list-header">
            <p className="eyebrow">待审核任务列表</p>
            <strong>{cases.filter((item) => item.status === 'pending').length} 个待处理</strong>
          </div>
          {sortedCases.map((reviewCase) => (
            <button
              type="button"
              key={reviewCase.case_id}
              className={`task-item ${reviewCase.case_id === selectedCase?.case_id ? 'active' : ''}`}
              onClick={() => setSelectedCaseId(reviewCase.case_id)}
            >
              <span>{reviewCase.case_id}</span>
              <strong>{reviewCase.patient_id}</strong>
              <small>{statusText(reviewCase.status)} · {formatDateTime(reviewCase.created_at)}</small>
            </button>
          ))}
        </aside>

        {selectedCase && (
          <article className="card review-case">
            <div className="review-topline">
              <div>
                <p className="eyebrow">case_id</p>
                <h3>{selectedCase.case_id}</h3>
              </div>
              <div className="review-badges">
                <RiskBadge level={selectedCase.risk_level} />
                <span className="status-pill">{statusText(selectedCase.status)}</span>
              </div>
            </div>

            <div className="review-grid">
              <ReviewBlock title="患者档案" lines={[
                selectedCase.patient_summary,
                `用药：${selectedCase.patient_profile.medications.join('、')}｜生活方式：${selectedCase.patient_profile.lifestyleTags.join('、')}`,
              ]} />
              <ReviewBlock title="日常记录" lines={[
                selectedCase.daily_record_summary,
                `用户补充：${selectedCase.daily_record.note || '无'}`,
              ]} />
              <ReviewBlock title="AI 分析过程" lines={[
                selectedCase.analysis_result.explanation,
                `安全审核：${selectedCase.safety_audit_result.passed ? '通过' : '未通过'}；输出去向：${selectedCase.analysis_result.destination === 'review' ? '专业端确认' : '患者端'}`,
              ]} />
              <ReviewBlock title="高风险原因" lines={selectedCase.risk_reason} />
              <ReviewBlock title="命中知识库" lines={selectedCase.knowledge_evidence.length ? selectedCase.knowledge_evidence : ['暂无命中证据']} />
              <ReviewBlock title="安全审核结果" lines={selectedCase.safety_audit_result.issues.length ? selectedCase.safety_audit_result.issues : ['未发现不安全表达；高风险仍需人工确认']} />
            </div>

            <label className="review-editor">
              <span>可编辑 AI 建议</span>
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={7} />
            </label>

            <div className="review-actions">
              {actions.map(({ label, status, icon: Icon }) => (
                <button type="button" key={label} onClick={() => updateStatus(status)}>
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

function ReviewBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="review-block">
      <strong>{title}</strong>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

function statusText(status: ReviewStatus) {
  const map: Record<ReviewStatus, string> = {
    pending: '待确认',
    approved: '已确认发送',
    modified: '已修改发送',
    escalated: '已升级处理',
    closed: '已关闭',
  };
  return map[status];
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}
