import type { DailyRecord, PatientProfile } from '../types';

export interface DemoExample {
  id: string;
  title: string;
  expected: string;
  profile: PatientProfile;
  record: DailyRecord;
}

const today = new Date().toISOString().slice(0, 10);

export const demoExamples: DemoExample[] = [
  {
    id: 'post-meal-medium',
    title: '示例 1：中风险餐后高血糖',
    expected: '预期：中风险，返回饮食和运动建议',
    profile: {
      patientId: 'DEMO-001',
      diabetesType: '2 型糖尿病',
      age: 45,
      gender: '女性',
      region: '广州',
      duration: '1-5 年',
      history: ['高血脂'],
      medications: ['二甲双胍'],
      specialGroups: ['无'],
      lifestyleTags: ['经常外食', '饮食不规律'],
    },
    record: {
      date: today,
      glucoseValue: 13.2,
      unit: 'mmol/L',
      measurementScene: '餐后 2 小时',
      cgmTrend: '缓慢上升',
      meals: {
        breakfast: '无糖豆浆、鸡蛋',
        lunch: '米饭、烧鹅、青菜、奶茶',
        dinner: '',
        snack: '',
      },
      stapleAmount: '较多',
      sugarIntake: '有',
      exercise: {
        type: '步行',
        duration: '10 分钟',
        intensity: '低强度',
        timing: '餐后 60 分钟',
      },
      symptoms: ['口渴'],
      note: '午餐在外面吃，奶茶半糖。',
    },
  },
  {
    id: 'hypo-high',
    title: '示例 2：高风险低血糖',
    expected: '预期：高风险，不返回完整建议，进入医生确认',
    profile: {
      patientId: 'DEMO-002',
      diabetesType: '2 型糖尿病',
      age: 68,
      gender: '男性',
      region: '杭州',
      duration: '5 年以上',
      history: ['高血压'],
      medications: ['胰岛素'],
      specialGroups: ['老年'],
      lifestyleTags: ['饮食不规律'],
    },
    record: {
      date: today,
      glucoseValue: 2.8,
      unit: 'mmol/L',
      measurementScene: 'CGM 当前值',
      cgmTrend: '缓慢下降',
      meals: {
        breakfast: '粥、青菜',
        lunch: '',
        dinner: '',
        snack: '',
      },
      stapleAmount: '少量',
      sugarIntake: '无',
      exercise: {
        type: '未运动',
        duration: '0 分钟',
        intensity: '未运动',
        timing: '无',
      },
      symptoms: ['头晕', '出汗', '心慌'],
      note: '早餐吃得少，上午使用胰岛素后出现不适。',
    },
  },
  {
    id: 'fasting-low',
    title: '示例 3：轻度空腹异常',
    expected: '预期：低风险或轻度异常，返回生活方式建议',
    profile: {
      patientId: 'DEMO-003',
      diabetesType: '糖耐量异常/糖前期',
      age: 32,
      gender: '女性',
      region: '深圳',
      duration: '新诊断',
      history: ['无'],
      medications: ['暂未用药'],
      specialGroups: ['无'],
      lifestyleTags: ['久坐', '夜班'],
    },
    record: {
      date: today,
      glucoseValue: 6.4,
      unit: 'mmol/L',
      measurementScene: '空腹',
      cgmTrend: '平稳',
      meals: {
        breakfast: '',
        lunch: '',
        dinner: '米饭、炒菜、汤',
        snack: '夜间加餐小面包',
      },
      stapleAmount: '适中',
      sugarIntake: '无',
      exercise: {
        type: '未运动',
        duration: '0 分钟',
        intensity: '未运动',
        timing: '无',
      },
      symptoms: ['无症状'],
      note: '昨晚睡得晚，最近久坐较多。',
    },
  },
  {
    id: 'cgm-drop-high',
    title: '示例 4：CGM 快速下降',
    expected: '预期：高风险或中高风险，拦截运动建议',
    profile: {
      patientId: 'DEMO-004',
      diabetesType: '1 型糖尿病',
      age: 25,
      gender: '男性',
      region: '广州',
      duration: '5 年以上',
      history: ['无'],
      medications: ['胰岛素'],
      specialGroups: ['无'],
      lifestyleTags: ['运动规律'],
    },
    record: {
      date: today,
      glucoseValue: 3.6,
      unit: 'mmol/L',
      measurementScene: 'CGM 当前值',
      cgmTrend: '快速下降',
      meals: {
        breakfast: '全麦面包、鸡蛋',
        lunch: '米饭、鸡胸肉、青菜',
        dinner: '',
        snack: '',
      },
      stapleAmount: '适中',
      sugarIntake: '无',
      exercise: {
        type: '跑步',
        duration: '计划 40 分钟',
        intensity: '高强度',
        timing: '准备运动',
      },
      symptoms: ['头晕'],
      note: '准备去跑步，CGM 提示快速下降。',
    },
  },
];
