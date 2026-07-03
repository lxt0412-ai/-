import { Bot, CalendarCheck } from 'lucide-react';
import type { DailyRecord } from '../types';
import { cgmTrends, intensityOptions, measurementScenes, stapleOptions, sugarOptions, symptomOptions } from '../data/options';
import { ChipGroup, Field, SelectField, getTextValue } from './FormBits';

interface Props {
  record: DailyRecord;
  onChange: (record: DailyRecord) => void;
  onAnalyze: () => void;
}

export function DailyRecordForm({ record, onChange, onAnalyze }: Props) {
  const update = <K extends keyof DailyRecord>(key: K, value: DailyRecord[K]) => {
    onChange({ ...record, [key]: value });
  };

  return (
    <section className="content-grid">
      <div className="module-header">
        <p className="eyebrow">Module 02</p>
        <h2>日常记录</h2>
        <p>采集血糖、CGM 趋势、饮食、运动和症状，模拟真实 AI 分析前的数据结构化入口。</p>
      </div>

      <div className="card form-card">
        <div className="form-grid">
          <Field label="记录日期">
            <input type="date" value={record.date} onChange={(event) => update('date', getTextValue(event))} />
          </Field>
          <Field label="血糖值">
            <input type="number" step="0.1" value={record.glucoseValue} onChange={(event) => update('glucoseValue', Number(event.target.value))} />
          </Field>
          <SelectField label="单位" value={record.unit} options={['mmol/L', 'mg/dL']} onChange={(value) => update('unit', value as DailyRecord['unit'])} />
          <SelectField label="测量场景" value={record.measurementScene} options={measurementScenes} onChange={(value) => update('measurementScene', value)} />
          <SelectField label="CGM 趋势" value={record.cgmTrend} options={cgmTrends} onChange={(value) => update('cgmTrend', value)} />
          <SelectField label="主食量" value={record.stapleAmount} options={stapleOptions} onChange={(value) => update('stapleAmount', value)} />
          <SelectField label="甜食/含糖饮料" value={record.sugarIntake} options={sugarOptions} onChange={(value) => update('sugarIntake', value)} />
          <Field label="运动类型">
            <input value={record.exercise.type} onChange={(event) => update('exercise', { ...record.exercise, type: getTextValue(event) })} />
          </Field>
          <Field label="运动时长">
            <input value={record.exercise.duration} onChange={(event) => update('exercise', { ...record.exercise, duration: getTextValue(event) })} />
          </Field>
          <SelectField label="运动强度" value={record.exercise.intensity} options={intensityOptions} onChange={(value) => update('exercise', { ...record.exercise, intensity: value })} />
          <Field label="运动发生时间">
            <input value={record.exercise.timing} onChange={(event) => update('exercise', { ...record.exercise, timing: getTextValue(event) })} />
          </Field>
          <Field label="早餐">
            <input value={record.meals.breakfast} onChange={(event) => update('meals', { ...record.meals, breakfast: getTextValue(event) })} />
          </Field>
          <Field label="午餐">
            <input value={record.meals.lunch} onChange={(event) => update('meals', { ...record.meals, lunch: getTextValue(event) })} />
          </Field>
          <Field label="晚餐">
            <input value={record.meals.dinner} onChange={(event) => update('meals', { ...record.meals, dinner: getTextValue(event) })} />
          </Field>
          <Field label="加餐">
            <input value={record.meals.snack} onChange={(event) => update('meals', { ...record.meals, snack: getTextValue(event) })} />
          </Field>
          <ChipGroup label="症状" options={symptomOptions} values={record.symptoms} onChange={(values) => update('symptoms', values)} />
          <Field label="用户补充描述">
            <textarea value={record.note} onChange={(event) => update('note', getTextValue(event))} rows={4} />
          </Field>
        </div>

        <div className="form-actions">
          <button className="secondary-button" type="button">
            <CalendarCheck size={17} />
            记录已保存本地
          </button>
          <button className="primary-button" type="button" onClick={onAnalyze}>
            开始分析
            <Bot size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
