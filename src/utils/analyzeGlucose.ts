import type { DailyRecord, GlucoseAnalysisResult, PatientProfile, ReviewTask } from '../types';
import { parseDailyRecord } from './glucoseParser';
import { retrieveKnowledge } from './knowledgeRetriever';
import { generatePersonalizedAdvice } from './personalizedAdvice';
import { assessRisk, isLowGlucoseRisk } from './riskRules';
import { applySafetyFallback, auditAdvice } from './safetyAudit';

export function analyzeGlucose(profile: PatientProfile, record: DailyRecord): GlucoseAnalysisResult {
  const parsed = parseDailyRecord(record);
  const matchedKnowledge = retrieveKnowledge(profile, parsed);
  const risk = assessRisk(profile, parsed);
  const advice = generatePersonalizedAdvice(profile, parsed, risk.riskLevel);
  const destination = risk.riskLevel === 'high' ? 'review' : 'patient';
  const factors = buildFactors(profile, parsed);
  const explanation = buildExplanation(parsed, risk.riskLevel);
  const evidence = matchedKnowledge.slice(0, 6).map((item) => `${item.title}｜${item.sourceType}｜${item.version}`);
  const draftAdvice = buildDraftAdvice(risk.riskLevel, advice.dietAdvice, advice.exerciseAdvice, advice.retestAdvice);
  const safetyAudit = auditAdvice({
    riskLevel: risk.riskLevel,
    patientAdviceText: [...advice.dietAdvice, ...advice.exerciseAdvice].join(' '),
    retestAdvice: advice.retestAdvice,
    contactDoctor: advice.contactDoctor,
    destination,
  });

  return applySafetyFallback({
    riskLevel: risk.riskLevel,
    normalizedGlucose: parsed.glucoseMmol,
    originalDisplayValue: parsed.originalDisplayValue,
    measurementScene: parsed.measurementScene,
    explanation,
    factors,
    dietAdvice: advice.dietAdvice,
    exerciseAdvice: advice.exerciseAdvice,
    retestAdvice: advice.retestAdvice,
    contactDoctor: advice.contactDoctor,
    safetyNotice: '本结果仅用于健康管理参考，不能替代医生诊断和治疗建议。请勿根据本结果自行调整药物剂量。',
    triggers: risk.triggers,
    evidence,
    matchedKnowledge,
    safetyAudit,
    destination,
    draftAdvice,
  });
}

export function createReviewTask(profile: PatientProfile, record: DailyRecord, result: GlucoseAnalysisResult): ReviewTask {
  const caseId = result.reviewCaseId ?? `CASE-${Date.now().toString().slice(-6)}`;
  return {
    case_id: caseId,
    patient_id: profile.patientId,
    patient_summary: `${profile.patientId}｜${profile.diabetesType}｜${profile.age}岁｜${profile.region}｜特殊人群：${profile.specialGroups.join('、')}｜病史：${profile.history.join('、')}`,
    daily_record_summary: `${record.measurementScene} ${result.originalDisplayValue}（标准化 ${result.normalizedGlucose} mmol/L）｜CGM ${record.cgmTrend}｜症状：${record.symptoms.join('、')}｜饮食：${Object.values(record.meals).filter(Boolean).join('；')}`,
    risk_level: result.riskLevel,
    risk_reason: result.triggers,
    knowledge_evidence: result.evidence,
    ai_draft: result.draftAdvice,
    safety_audit_result: result.safetyAudit,
    status: 'pending',
    created_at: new Date().toISOString(),
    reviewer_note: result.draftAdvice,
    patient_profile: profile,
    daily_record: record,
    analysis_result: {
      ...result,
      reviewCaseId: caseId,
    },
  };
}

function buildExplanation(parsed: ReturnType<typeof parseDailyRecord>, riskLevel: GlucoseAnalysisResult['riskLevel']) {
  if (riskLevel === 'high') {
    return `本次${parsed.measurementScene}血糖标准化为 ${parsed.glucoseMmol} mmol/L，已触发高风险规则，系统将结果转入专业端确认。`;
  }
  if (isLowGlucoseRisk(parsed)) {
    return `本次血糖标准化为 ${parsed.glucoseMmol} mmol/L，结合症状或 CGM 趋势，系统提示低血糖相关风险。`;
  }
  if (parsed.glucoseMmol >= 10) {
    return `本次${parsed.measurementScene}血糖标准化为 ${parsed.glucoseMmol} mmol/L，结合饮食、运动和 CGM 趋势，提示血糖升高需要关注。`;
  }
  if (riskLevel === 'normal') {
    return `本次${parsed.measurementScene}血糖标准化为 ${parsed.glucoseMmol} mmol/L，当前未触发明显异常规则。`;
  }
  return `本次${parsed.measurementScene}血糖标准化为 ${parsed.glucoseMmol} mmol/L，属于轻度异常，建议继续观察趋势。`;
}

function buildFactors(profile: PatientProfile, parsed: ReturnType<typeof parseDailyRecord>) {
  return [
    parsed.stapleAmount === '较多' ? '主食量偏多可能推动餐后血糖上升' : '主食量未见明显过量信号',
    parsed.sugarIntake === '有' ? '甜食或含糖饮料是本次异常的重要候选因素' : '未记录甜食或含糖饮料摄入',
    profile.lifestyleTags.includes('经常外食') ? `${profile.region}外食场景下油盐、酱汁和隐形糖更难估计` : '生活方式标签未提示明显外食风险',
    parsed.exerciseIntensity === '未运动' ? '餐后活动不足可能延长高血糖持续时间' : `${parsed.exerciseTiming}的${parsed.exerciseType}可能影响血糖回落速度`,
    parsed.cgmTrend !== '未知' ? `CGM 趋势为${parsed.cgmTrend}，提示需要结合短期趋势判断` : 'CGM 趋势未知，建议补充连续监测信息',
  ];
}

function buildDraftAdvice(riskLevel: GlucoseAnalysisResult['riskLevel'], dietAdvice: string[], exerciseAdvice: string[], retestAdvice: string) {
  if (riskLevel === 'high') {
    return `AI 初稿：高风险已拦截。建议专业端确认触发原因，向患者发送复测、症状观察和必要线下就医提醒。复测建议：${retestAdvice}`;
  }
  return `AI 初稿：${dietAdvice[0]} ${exerciseAdvice[0]} ${retestAdvice}`;
}
