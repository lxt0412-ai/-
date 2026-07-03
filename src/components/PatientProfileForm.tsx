import { ArrowRight, Save } from 'lucide-react';
import type { PatientProfile } from '../types';
import { diseaseTypes, durations, genders, historyOptions, lifestyleOptions, medicationOptions, specialGroupOptions } from '../data/options';
import { ChipGroup, Field, SelectField, getTextValue } from './FormBits';

interface Props {
  profile: PatientProfile;
  onChange: (profile: PatientProfile) => void;
  onNext: () => void;
}

export function PatientProfileForm({ profile, onChange, onNext }: Props) {
  const update = <K extends keyof PatientProfile>(key: K, value: PatientProfile[K]) => {
    onChange({ ...profile, [key]: value });
  };

  return (
    <section className="content-grid">
      <div className="module-header">
        <p className="eyebrow">Module 01</p>
        <h2>患者建档</h2>
        <p>用结构化档案表达 AI 分析前置上下文：疾病类型、生活地区、病史、用药与特殊人群安全边界。</p>
      </div>

      <div className="card form-card">
        <div className="form-grid">
          <Field label="姓名或患者编号">
            <input value={profile.patientId} onChange={(event) => update('patientId', getTextValue(event))} />
          </Field>
          <SelectField label="疾病类型" value={profile.diabetesType} options={diseaseTypes} onChange={(value) => update('diabetesType', value)} />
          <Field label="年龄">
            <input type="number" min="1" max="120" value={profile.age} onChange={(event) => update('age', Number(event.target.value))} />
          </Field>
          <SelectField label="性别" value={profile.gender} options={genders} onChange={(value) => update('gender', value)} />
          <Field label="生活地区">
            <input value={profile.region} onChange={(event) => update('region', getTextValue(event))} placeholder="广州、深圳、杭州" />
          </Field>
          <SelectField label="病程" value={profile.duration} options={durations} onChange={(value) => update('duration', value)} />
          <ChipGroup label="既往病史" options={historyOptions} values={profile.history} onChange={(values) => update('history', values)} />
          <ChipGroup label="用药情况" options={medicationOptions} values={profile.medications} onChange={(values) => update('medications', values)} />
          <ChipGroup label="是否特殊人群" options={specialGroupOptions} values={profile.specialGroups} onChange={(values) => update('specialGroups', values)} />
          <ChipGroup label="生活方式标签" options={lifestyleOptions} values={profile.lifestyleTags} onChange={(values) => update('lifestyleTags', values)} />
        </div>

        <div className="form-actions">
          <button className="secondary-button" type="button">
            <Save size={17} />
            已自动保存本地
          </button>
          <button className="primary-button" type="button" onClick={onNext}>
            进入日常记录
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
