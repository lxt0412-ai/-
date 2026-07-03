import type { GlucoseAnalysisResult, RiskLevel } from '../types';

interface AuditInput {
  riskLevel: RiskLevel;
  patientAdviceText: string;
  retestAdvice: string;
  contactDoctor: string;
  destination: 'patient' | 'review';
}

const unsafePatterns = [
  /调整.*(胰岛素|药|剂量)/,
  /(增加|减少).*(胰岛素|药量|剂量)/,
  /(停药|换药|自行停用|自行换用)/,
  /(诊断为|确诊|就是.*病)/,
  /(保证没事|一定没事|无需担心)/,
  /(不用就医|不要就医|延后就医|暂缓就医)/,
];

export function auditAdvice(input: AuditInput) {
  const issues: string[] = [];
  const text = `${input.patientAdviceText} ${input.retestAdvice} ${input.contactDoctor}`;

  unsafePatterns.forEach((pattern) => {
    if (pattern.test(text)) {
      issues.push(`命中不安全表达：${pattern.source}`);
    }
  });

  if (input.riskLevel === 'high' && input.destination === 'patient') {
    issues.push('高风险结果不能直接返回完整患者建议');
  }

  if (input.riskLevel === 'high' && !/(复测|就医|医生|健康管理师|线下)/.test(text)) {
    issues.push('高风险输出缺少复测或就医提醒');
  }

  if (/低血糖|严重高血糖|16\.7|3\.9/.test(text) && !/(复测|就医|医生|健康管理师)/.test(text)) {
    issues.push('低血糖或严重高血糖场景缺少复测或就医提醒');
  }

  return {
    passed: issues.length === 0,
    issues,
    blockedPatientOutput: input.riskLevel === 'high' || issues.length > 0,
  };
}

export function applySafetyFallback(result: GlucoseAnalysisResult): GlucoseAnalysisResult {
  if (result.safetyAudit.passed && result.riskLevel !== 'high') {
    return result;
  }

  if (result.riskLevel === 'high') {
    return {
      ...result,
      destination: 'review',
      dietAdvice: ['高风险结果已拦截，完整饮食建议需由专业人员确认后发送。'],
      exerciseAdvice: ['高风险结果已拦截，不向患者直接返回运动方案。'],
    };
  }

  return {
    ...result,
    destination: 'review',
    dietAdvice: ['建议内容未通过安全审核，需由专业人员确认后发送。'],
    exerciseAdvice: ['建议内容未通过安全审核，需由专业人员确认后发送。'],
  };
}
