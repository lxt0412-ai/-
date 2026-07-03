import type { ParsedDailyRecord, PatientProfile, RiskLevel } from '../types';

export interface RiskAssessment {
  riskLevel: RiskLevel;
  triggers: string[];
}

const riskRank: Record<RiskLevel, number> = {
  normal: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export function assessRisk(profile: PatientProfile, parsed: ParsedDailyRecord): RiskAssessment {
  const glucose = parsed.glucoseMmol;
  const triggers: string[] = [];
  let level: RiskLevel = 'normal';

  if (glucose < 3.0) {
    level = 'high';
    triggers.push('血糖低于 3.0 mmol/L，按高风险低血糖处理');
  } else if (glucose >= 3.0 && glucose < 3.9) {
    level = 'medium';
    triggers.push('血糖处于 3.0-3.9 mmol/L，存在低血糖风险');
    if (hasAny(parsed.symptoms, ['头晕', '出汗', '心慌', '意识模糊', '意识异常'])) {
      level = 'high';
      triggers.push('低血糖伴随头晕/出汗/心慌/意识异常，风险升级为高风险');
    }
  } else if (glucose >= 16.7) {
    level = 'high';
    triggers.push('血糖达到或超过 16.7 mmol/L，按高风险高血糖处理');
  } else if (glucose >= 13.9 && hasAny(parsed.symptoms, ['恶心', '呕吐', '腹痛', '明显乏力', '意识异常', '意识模糊'])) {
    level = 'high';
    triggers.push('血糖达到 13.9 mmol/L 以上并伴随急症相关症状');
  } else if (parsed.measurementScene === '餐后 2 小时' && glucose >= 10) {
    level = 'medium';
    triggers.push('餐后 2 小时血糖明显升高但未记录急症症状');
  } else if (parsed.measurementScene === '空腹' && glucose >= 6.1) {
    level = 'low';
    triggers.push('空腹血糖轻度升高且无明显症状');
  } else if (glucose >= 10) {
    level = 'low';
    triggers.push(`${parsed.measurementScene}血糖高于常见管理目标，需观察趋势`);
  }

  if (parsed.cgmTrend === '快速下降' && glucose < 4.5) {
    level = maxRisk(level, 'medium');
    triggers.push('CGM 快速下降且当前血糖低于 4.5 mmol/L');
    if (glucose < 3.9) {
      level = 'high';
      triggers.push('CGM 快速下降且血糖低于 3.9 mmol/L，升级高风险');
    }
  }

  if (parsed.cgmTrend === '快速上升' && glucose >= 10) {
    level = maxRisk(level, 'medium');
    triggers.push('CGM 快速上升且血糖偏高');
  }

  const specialGroups = profile.specialGroups.filter((group) => ['孕期', '儿童', '老年', '肾病患者'].includes(group));
  if (specialGroups.length && level !== 'normal') {
    level = upgrade(level);
    triggers.push(`特殊人群（${specialGroups.join('、')}）出现明显异常，风险等级上调一级`);
  }

  const hypoMedication = profile.medications.some((medication) => ['胰岛素', '磺脲类'].includes(medication));
  if (hypoMedication && glucose < 3.9) {
    level = upgrade(level);
    triggers.push('使用胰岛素或磺脲类药物后出现低血糖，风险等级上调一级');
  }

  return {
    riskLevel: level,
    triggers: triggers.length ? triggers : ['当前血糖正常或接近目标范围，未触发明显异常规则'],
  };
}

export function isLowGlucoseRisk(parsed: ParsedDailyRecord) {
  return parsed.glucoseMmol < 4.5
    || (parsed.cgmTrend.includes('下降') && parsed.glucoseMmol <= 5.0)
    || hasAny(parsed.symptoms, ['头晕', '出汗', '心慌']);
}

function hasAny(source: string[], targets: string[]) {
  return source.some((item) => targets.includes(item));
}

function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return riskRank[a] >= riskRank[b] ? a : b;
}

function upgrade(level: RiskLevel): RiskLevel {
  if (level === 'normal') return 'low';
  if (level === 'low') return 'medium';
  return 'high';
}
