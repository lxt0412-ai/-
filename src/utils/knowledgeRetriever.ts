import { knowledgeBase } from '../data/knowledgeBase';
import type { KnowledgeItem, ParsedDailyRecord, PatientProfile } from '../types';

export function retrieveKnowledge(profile: PatientProfile, parsed: ParsedDailyRecord): KnowledgeItem[] {
  const text = [
    profile.diabetesType,
    profile.region,
    profile.duration,
    ...profile.history,
    ...profile.medications,
    ...profile.specialGroups,
    ...profile.lifestyleTags,
    parsed.measurementScene,
    parsed.cgmTrend,
    parsed.mealsText,
    parsed.stapleAmount,
    parsed.sugarIntake,
    parsed.exerciseType,
    parsed.exerciseIntensity,
    ...parsed.symptoms,
    parsed.note,
  ].join(' ');

  const glucose = parsed.glucoseMmol;
  const matches = knowledgeBase.filter((item) => {
    if (item.category === '低血糖规则' && glucose < 4.5) return true;
    if (item.category === '高血糖规则' && glucose >= 13.9) return true;
    if (item.category === '餐后血糖异常规则' && parsed.measurementScene.includes('餐后') && glucose >= 10) return true;
    if (item.category === '空腹血糖异常规则' && parsed.measurementScene === '空腹' && glucose >= 6.1) return true;
    if (item.category === 'CGM 趋势异常规则' && parsed.cgmTrend.includes('快速')) return true;
    if (item.category === '饮食建议规则' && (parsed.stapleAmount === '较多' || parsed.sugarIntake === '有' || profile.lifestyleTags.includes('经常外食'))) return true;
    if (item.category === '运动建议规则' && (parsed.exerciseType || parsed.exerciseIntensity || parsed.cgmTrend.includes('下降'))) return true;
    if (item.category === '高风险转人工 SOP' && isHighRiskCandidate(profile, parsed)) return true;
    if (item.category === '安全输出边界规则') return true;
    return item.keywords?.some((keyword) => text.includes(keyword)) ?? false;
  });

  return dedupeById(matches);
}

function isHighRiskCandidate(profile: PatientProfile, parsed: ParsedDailyRecord) {
  const urgentSymptoms = ['恶心', '呕吐', '腹痛', '意识模糊', '意识异常', '明显乏力'];
  const specialGroups = ['孕期', '儿童', '老年', '肾病患者'];
  return parsed.glucoseMmol < 3.9
    || parsed.glucoseMmol >= 13.9
    || parsed.symptoms.some((symptom) => urgentSymptoms.includes(symptom))
    || profile.specialGroups.some((group) => specialGroups.includes(group));
}

function dedupeById(items: KnowledgeItem[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}
