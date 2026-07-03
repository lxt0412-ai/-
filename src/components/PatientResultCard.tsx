import { Activity, AlertTriangle, CheckCircle2, ClipboardCheck, Salad, ShieldAlert, TimerReset } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AnalysisResult, DailyRecord, PatientProfile, ReviewCase } from '../types';
import { RiskBadge } from './common';

interface Props {
  profile: PatientProfile;
  record: DailyRecord;
  result: AnalysisResult;
  reviewTask?: ReviewCase;
}

export function PatientResultCard({ profile, record, result, reviewTask }: Props) {
  const confirmedTask = reviewTask && ['approved', 'modified', 'escalated'].includes(reviewTask.status)
    ? reviewTask
    : undefined;

  return (
    <section className="content-grid">
      <div className="module-header">
        <p className="eyebrow">Module 04</p>
        <h2>患者端结果卡片</h2>
        <p>低中风险展示完整健康管理建议；高风险仅展示安全提示和专业端确认状态。</p>
      </div>

      {result.destination === 'review' ? (
        <HighRiskCard result={result} record={record} reviewTask={reviewTask} />
      ) : (
        <FullPatientCard profile={profile} record={record} result={result} />
      )}

      {confirmedTask && <ConfirmedAdviceCard task={confirmedTask} />}
    </section>
  );
}

function FullPatientCard({ profile, record, result }: { profile: PatientProfile; record: DailyRecord; result: AnalysisResult }) {
  return (
    <div className="patient-result">
      <div className={`card result-hero ${result.riskLevel}`}>
        <div>
          <p className="eyebrow">{profile.patientId} · {record.date}</p>
          <h3>{record.measurementScene}血糖 {result.normalizedGlucose} mmol/L</h3>
          <p>{result.explanation}</p>
        </div>
        <div className="result-meta">
          <RiskBadge level={result.riskLevel} />
          <span>CGM 趋势：{record.cgmTrend}</span>
          <span>原始值：{result.originalDisplayValue}</span>
        </div>
      </div>

      <InfoCard
        title="血糖异常解释"
        icon={<AlertTriangle size={19} />}
        items={[
          result.explanation,
          ...result.factors,
          `测量时间：${record.measurementScene}；运动：${record.exercise.type || '未记录'} ${record.exercise.duration || ''}；病史：${profile.history.join('、')}`,
        ]}
      />
      <InfoCard title="饮食个性化建议" icon={<Salad size={19} />} items={result.dietAdvice} />
      <InfoCard title="运动个性化建议" icon={<Activity size={19} />} items={result.exerciseAdvice} />

      <div className="card split-card">
        <div>
          <div className="section-title">
            <TimerReset size={19} />
            <h3>复测与记录建议</h3>
          </div>
          <p>{result.retestAdvice}</p>
          <p>建议记录：测量时间、餐食明细、主食量、含糖饮料、运动时间/强度、症状和 CGM 趋势，便于下次就诊给医生查看。</p>
        </div>
        <div>
          <div className="section-title">
            <ShieldAlert size={19} />
            <h3>联系医生条件</h3>
          </div>
          <p>{result.contactDoctor}</p>
          <p>若出现意识不清、无法吞咽、持续呕吐、腹痛、明显乏力、呼吸异常或血糖持续异常，请尽快线下就医。</p>
        </div>
      </div>

      <div className="safety-disclaimer">
        <strong>安全免责声明</strong>
        <span>{result.safetyNotice}</span>
      </div>
    </div>
  );
}

function HighRiskCard({ result, record, reviewTask }: { result: AnalysisResult; record: DailyRecord; reviewTask?: ReviewCase }) {
  return (
    <div className="patient-result">
      <div className="card high-risk-card">
        <div className="high-risk-top">
          <div>
            <p className="eyebrow">High Risk Safety Card</p>
            <h3>高风险结果已拦截</h3>
            <p>{record.measurementScene} · {result.originalDisplayValue} · CGM {record.cgmTrend}</p>
          </div>
          <RiskBadge level="high" />
        </div>

        <InfoCard title="触发原因" icon={<AlertTriangle size={19} />} items={result.triggers} />
        <InfoCard
          title="安全提示"
          icon={<ShieldAlert size={19} />}
          items={[
            '不要根据本结果自行调整胰岛素或其他药物剂量。',
            '当前不建议继续运动，需先确认血糖和症状安全状态。',
            '如出现意识不清、无法吞咽、持续呕吐、腹痛、明显乏力、呼吸异常等情况，请立即寻求线下医疗帮助。',
          ]}
        />

        <div className="case-status">
          <ClipboardCheck size={20} />
          <div>
            <strong>状态：已提交医生/健康管理师确认</strong>
            <span>case_id：{reviewTask?.case_id ?? result.reviewCaseId ?? '待生成'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmedAdviceCard({ task }: { task: ReviewCase }) {
  return (
    <div className="card confirmed-card">
      <div className="section-title">
        <CheckCircle2 size={20} />
        <h3>专业端确认版建议</h3>
      </div>
      <div className="confirmed-grid">
        <span>已由医生/健康管理师确认</span>
        <span>确认时间：{task.reviewed_at ? formatDateTime(task.reviewed_at) : '待记录'}</span>
      </div>
      <p>{task.reviewer_note || task.ai_draft}</p>
      <small>该建议仍不能替代线下诊疗；如症状持续或加重，请及时寻求线下医疗帮助。</small>
    </div>
  );
}

function InfoCard({ title, icon, items }: { title: string; icon: ReactNode; items: string[] }) {
  return (
    <div className="card info-card">
      <div className="section-title">
        {icon}
        <h3>{title}</h3>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}
