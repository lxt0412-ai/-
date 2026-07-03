import type { ChangeEvent, ReactNode } from 'react';

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </Field>
  );
}

interface ChipGroupProps {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}

export function ChipGroup({ label, options, values, onChange }: ChipGroupProps) {
  const toggle = (option: string) => {
    if (option === '无' || option === '未知' || option === '无症状') {
      onChange([option]);
      return;
    }
    const next = values.includes(option)
      ? values.filter((item) => item !== option)
      : [...values.filter((item) => !['无', '未知', '无症状'].includes(item)), option];
    onChange(next.length ? next : [options.includes('无') ? '无' : options[0]]);
  };

  return (
    <div className="field span-2">
      <span>{label}</span>
      <div className="chip-grid">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`chip ${values.includes(option) ? 'selected' : ''}`}
            onClick={() => toggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function getTextValue(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
  return event.target.value;
}
