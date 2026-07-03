import type { RiskLevel } from '../types';

export function RiskBadge({ level }: { level: RiskLevel }) {
  const text = level === 'normal' ? '正常' : level === 'low' ? '低风险' : level === 'medium' ? '中风险' : '高风险';
  return <span className={`risk-badge ${level}`}>{text}</span>;
}
