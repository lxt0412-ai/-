export type RiskLevel = 'normal' | 'low' | 'medium' | 'high';
export type WorkflowNodeStatus = '未开始' | '运行中' | '已完成' | '已拦截' | '进入人工确认';
export type ReviewStatus = 'pending' | 'approved' | 'modified' | 'escalated' | 'closed';
export type SourceType = '指南规则' | '患教规则' | '运营 SOP' | '安全边界';

export interface PatientProfile {
  patientId: string;
  diabetesType: string;
  age: number;
  gender: string;
  region: string;
  duration: string;
  history: string[];
  medications: string[];
  specialGroups: string[];
  lifestyleTags: string[];
}

export interface DailyRecord {
  date: string;
  glucoseValue: number;
  unit: 'mmol/L' | 'mg/dL';
  measurementScene: string;
  cgmTrend: string;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snack: string;
  };
  stapleAmount: string;
  sugarIntake: string;
  exercise: {
    type: string;
    duration: string;
    intensity: string;
    timing: string;
  };
  symptoms: string[];
  note: string;
}

export interface ParsedDailyRecord {
  glucoseMmol: number;
  originalGlucoseValue: number;
  originalUnit: DailyRecord['unit'];
  originalDisplayValue: string;
  measurementScene: string;
  symptoms: string[];
  mealsText: string;
  mealItems: string[];
  stapleAmount: string;
  sugarIntake: string;
  exerciseType: string;
  exerciseDuration: string;
  exerciseIntensity: string;
  exerciseTiming: string;
  cgmTrend: string;
  note: string;
}

export interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  condition: string;
  content: string;
  riskHint: RiskLevel;
  sourceType: SourceType;
  version: string;
  keywords?: string[];
}

export interface WorkflowNode {
  id: string;
  label: string;
  description: string;
  status: WorkflowNodeStatus;
}

export interface SafetyAuditResult {
  passed: boolean;
  issues: string[];
  blockedPatientOutput: boolean;
}

export interface GlucoseAnalysisResult {
  riskLevel: RiskLevel;
  normalizedGlucose: number;
  originalDisplayValue: string;
  measurementScene: string;
  explanation: string;
  factors: string[];
  dietAdvice: string[];
  exerciseAdvice: string[];
  retestAdvice: string;
  contactDoctor: string;
  safetyNotice: string;
  triggers: string[];
  evidence: string[];
  matchedKnowledge: KnowledgeItem[];
  safetyAudit: SafetyAuditResult;
  destination: 'patient' | 'review';
  draftAdvice: string;
  reviewCaseId?: string;
}

export interface ReviewTask {
  case_id: string;
  patient_id: string;
  patient_summary: string;
  daily_record_summary: string;
  risk_level: RiskLevel;
  risk_reason: string[];
  knowledge_evidence: string[];
  ai_draft: string;
  safety_audit_result: SafetyAuditResult;
  status: ReviewStatus;
  created_at: string;
  reviewed_at?: string;
  reviewer_note: string;
  patient_profile: PatientProfile;
  daily_record: DailyRecord;
  analysis_result: GlucoseAnalysisResult;
}

export type WorkflowStatus = WorkflowNodeStatus;
export type AnalysisResult = GlucoseAnalysisResult;
export type ReviewCase = ReviewTask;
