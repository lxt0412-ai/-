import type { ParsedDailyRecord, PatientProfile, RiskLevel } from '../types';
import { isLowGlucoseRisk } from './riskRules';

export interface PersonalizedAdvice {
  dietAdvice: string[];
  exerciseAdvice: string[];
  retestAdvice: string;
  contactDoctor: string;
}

export function generatePersonalizedAdvice(
  profile: PatientProfile,
  parsed: ParsedDailyRecord,
  riskLevel: RiskLevel,
): PersonalizedAdvice {
  if (riskLevel === 'high') {
    return {
      dietAdvice: ['当前结果触发高风险安全边界，完整饮食方案需等待医生/健康管理师确认后再发送。'],
      exerciseAdvice: ['当前不生成完整运动建议；请先暂停运动计划，完成复测并等待专业人员确认。'],
      retestAdvice: '建议尽快复测血糖；若伴随意识异常、持续呕吐、腹痛或极端血糖，请立即线下就医。',
      contactDoctor: '本次结果已转入专业端审核；医生/健康管理师确认前，系统不直接下发完整个性化方案。',
    };
  }

  return {
    dietAdvice: buildDietAdvice(profile, parsed, riskLevel),
    exerciseAdvice: buildExerciseAdvice(profile, parsed, riskLevel),
    retestAdvice: riskLevel === 'normal'
      ? '按日常计划继续记录下一次血糖，保留饮食和运动上下文。'
      : '建议 1-2 小时内复测，并记录饮食、运动、症状和 CGM 趋势变化。',
    contactDoctor: riskLevel === 'medium'
      ? '如同一测量场景连续异常，或症状加重，请联系医生/健康管理师评估管理方案。'
      : '若连续多日异常或出现新的不适症状，建议联系医生/健康管理师。',
  };
}

function buildDietAdvice(profile: PatientProfile, parsed: ParsedDailyRecord, riskLevel: RiskLevel) {
  const advice = [
    `${profile.diabetesType}管理中，建议把${parsed.measurementScene}记录与餐食内容一起观察，不单看一次读数。`,
  ];

  if (parsed.stapleAmount === '较多') {
    advice.push('下一餐主食从“较多”调整到“适中”，优先选择杂粮饭、全麦面或薯类替代部分精制米面。');
  } else {
    advice.push('保持主食份量稳定，继续记录不同主食组合对血糖的影响。');
  }

  if (['广东', '广州', '深圳'].some((region) => profile.region.includes(region))) {
    advice.push('广东/广深饮食场景中，早茶可少点流沙包、叉烧包、煎炸点心；粥粉面、肠粉和米饭注意份量，糖水和奶茶优先换成无糖茶或水。');
  }

  if (parsed.sugarIntake === '有' || /奶茶|甜|饮料|糖/.test(parsed.mealsText)) {
    advice.push('本次记录包含甜食或含糖饮料，建议改为无糖茶、水或无糖豆浆，并观察餐后 2 小时变化。');
  }

  if (profile.lifestyleTags.includes('经常外食')) {
    advice.push(`${profile.region}外食场景建议使用餐盘法：半盘蔬菜、四分之一蛋白质、四分之一主食，烧鹅、烧腊和粉面类可搭配青菜并减少酱汁。`);
  }

  if (profile.history.includes('高血压') || profile.history.includes('肾病')) {
    advice.push('合并高血压或肾病史时，饮食建议同时关注盐分和加工食品摄入，具体限制需由医生确认。');
  }

  if (profile.age >= 65) {
    advice.push('老年用户饮食调整应避免过度节食，优先保持规律进餐和可持续记录。');
  }

  if (riskLevel === 'medium') {
    advice.push('本次为中风险，建议先聚焦含糖饮料、主食份量和外食结构三个可控因素。');
  }

  advice.push('不建议极端节食；重点是稳定进餐、控制份量和持续记录血糖反馈。');

  return advice;
}

function buildExerciseAdvice(profile: PatientProfile, parsed: ParsedDailyRecord, riskLevel: RiskLevel) {
  const lowGlucoseRisk = isLowGlucoseRisk(parsed);
  const advice: string[] = [];

  if (lowGlucoseRisk) {
    return [
      '当前存在低血糖或快速下降风险，先不建议继续运动；请复测并观察头晕、出汗、心慌等症状。',
      '若症状持续或血糖继续下降，应及时联系医生/健康管理师或线下就医。',
    ];
  }

  if (profile.history.includes('心血管疾病')) {
    advice.push('有心血管病史时，运动强度建议保持低到中等，避免突然高强度运动，具体运动处方需由医生确认。');
  }

  if (profile.age >= 65) {
    advice.push('建议选择稳定、低冲击运动，例如饭后慢走或室内舒缓活动，注意防跌倒。');
  } else {
    advice.push('若无不适，可在餐后 30-60 分钟进行 10-20 分钟低到中等强度步行。');
  }

  if (parsed.exerciseIntensity === '高强度') {
    advice.push('本次记录为高强度运动，建议后续观察 CGM 变化，避免在血糖波动明显时继续加量。');
  } else if (parsed.exerciseType && parsed.exerciseIntensity !== '未运动') {
    advice.push(`可保留${parsed.exerciseType}习惯，但根据${parsed.cgmTrend}趋势调整时长和强度。`);
  }

  if (riskLevel === 'medium') {
    advice.push('中风险状态下先选择温和活动，不做冲刺、长时间耐力或力量极限训练。');
  }

  return advice;
}
