import type { DailyRecord, GlucoseAnalysisResult, PatientProfile, ReviewTask, WorkflowNode, WorkflowNodeStatus } from '../types';
import { analyzeGlucose, createReviewTask } from './analyzeGlucose';

export const workflowLabels = [
  ['profile', '患者档案读取', '识别疾病类型、特殊人群、病史和用药边界'],
  ['parse', '日常数据解析', '结构化血糖、饮食、运动、症状与补充描述'],
  ['unit', '单位标准化', '统一换算为 mmol/L 并标记测量场景'],
  ['kb', '知识库检索', '检索血糖阈值、特殊人群和安全规则'],
  ['explain', '血糖异常解释', '解释当前读数与餐食、运动、症状的关系'],
  ['risk', '风险分层', '输出 normal/low/medium/high 风险与触发原因'],
  ['diet', '饮食建议生成', '生成主食、加餐、饮品与外食建议'],
  ['exercise', '运动建议生成', '结合血糖水平、症状和运动习惯生成建议'],
  ['safety', '安全审核', '拦截高风险、调药表述和延误就医风险'],
  ['route', '条件分流', '低中风险返回患者端，高风险进入专业端确认'],
] as const;

export function createInitialWorkflow(): WorkflowNode[] {
  return workflowLabels.map(([id, label, description]) => ({
    id,
    label,
    description,
    status: '未开始',
  }));
}

export function setWorkflowNodeStatus(nodes: WorkflowNode[], id: string, status: WorkflowNodeStatus) {
  return nodes.map((node) => (node.id === id ? { ...node, status } : node));
}

export function buildWorkflow(result: GlucoseAnalysisResult): WorkflowNode[] {
  return workflowLabels.map(([id, label, description]) => ({
    id,
    label,
    description,
    status: finalStatusForNode(id, result),
  }));
}

export function analyzeRecord(profile: PatientProfile, record: DailyRecord): GlucoseAnalysisResult {
  return analyzeGlucose(profile, record);
}

export function normalizeGlucose(record: DailyRecord) {
  return record.unit === 'mg/dL' ? Number((record.glucoseValue / 18).toFixed(1)) : Number(record.glucoseValue.toFixed(1));
}

export function createReviewCase(profile: PatientProfile, record: DailyRecord, result: GlucoseAnalysisResult): ReviewTask {
  return createReviewTask(profile, record, result);
}

export function finalStatusForNode(id: string, result: GlucoseAnalysisResult): WorkflowNodeStatus {
  if (result.riskLevel === 'high' && ['diet', 'exercise'].includes(id)) {
    return '已拦截';
  }
  if (!result.safetyAudit.passed && id === 'safety') {
    return '已拦截';
  }
  if (result.destination === 'review' && id === 'route') {
    return '进入人工确认';
  }
  return '已完成';
}
