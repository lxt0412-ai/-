import { ArrowRight, CheckCircle2, CircleDashed, Lock, Play, UserCheck } from 'lucide-react';
import type { AnalysisResult, WorkflowNode } from '../types';
import { RiskBadge } from './common';

interface Props {
  nodes: WorkflowNode[];
  result: AnalysisResult;
  isAnalyzing: boolean;
  hasAnalysis: boolean;
  onStart: () => void;
  onRoute: () => void;
}

export function WorkflowPanel({ nodes, result, isAnalyzing, hasAnalysis, onStart, onRoute }: Props) {
  return (
    <section className="content-grid">
      <div className="module-header">
        <p className="eyebrow">Module 03</p>
        <h2>AI 工作流分析</h2>
        <p>用节点状态展示从数据读取、规则检索、建议生成到安全审核和条件分流的模拟 AI 流程。</p>
      </div>

      <div className="workflow-layout">
        <div className="card workflow-card">
          {nodes.map((node, index) => (
            <div className={`workflow-node ${statusClass(node.status)}`} key={node.id}>
              <div className="node-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="node-icon">{iconFor(node.status)}</div>
              <div>
                <strong>{node.label}</strong>
                <p>{node.description}</p>
              </div>
              <span className="node-status">{node.status}</span>
            </div>
          ))}
        </div>

        <aside className="card decision-card">
          <p className="eyebrow">条件分流结果</p>
          <RiskBadge level={result.riskLevel} />
          <h3>{isAnalyzing ? '工作流正在运行' : result.destination === 'review' ? '进入医生/健康管理师确认' : '可生成患者端结果卡片'}</h3>
          <p>{isAnalyzing ? '系统正在依次执行解析、知识检索、风险分层、建议生成和安全审核。' : result.explanation}</p>
          <div className="evidence-list">
            {(isAnalyzing ? ['节点状态将实时更新，最终根据规则引擎分流。'] : result.triggers.slice(0, 4)).map((trigger) => (
              <span key={trigger}>{trigger}</span>
            ))}
          </div>
          <button className="secondary-button full-width" type="button" onClick={onStart} disabled={isAnalyzing}>
            <Play size={17} />
            {isAnalyzing ? '分析中' : hasAnalysis ? '重新开始分析' : '开始分析'}
          </button>
          <button className="primary-button full-width" type="button" onClick={onRoute}>
            {result.destination === 'review' ? '进入专业端审核台' : '查看患者端结果'}
            <ArrowRight size={17} />
          </button>
        </aside>
      </div>
    </section>
  );
}

function statusClass(status: string) {
  if (status === '已拦截') return 'blocked';
  if (status === '进入人工确认') return 'manual';
  if (status === '已完成') return 'done';
  if (status === '运行中') return 'running';
  return 'idle';
}

function iconFor(status: string) {
  if (status === '已拦截') return <Lock size={18} />;
  if (status === '进入人工确认') return <UserCheck size={18} />;
  if (status === '已完成') return <CheckCircle2 size={18} />;
  return <CircleDashed size={18} />;
}
