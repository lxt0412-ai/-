import type { DailyRecord, ParsedDailyRecord } from '../types';

export function parseDailyRecord(record: DailyRecord): ParsedDailyRecord {
  const glucoseMmol = record.unit === 'mg/dL'
    ? Number((record.glucoseValue / 18).toFixed(1))
    : Number(record.glucoseValue.toFixed(1));
  const mealItems = [
    record.meals.breakfast,
    record.meals.lunch,
    record.meals.dinner,
    record.meals.snack,
  ].filter(Boolean);

  return {
    glucoseMmol,
    originalGlucoseValue: record.glucoseValue,
    originalUnit: record.unit,
    originalDisplayValue: `${record.glucoseValue} ${record.unit}`,
    measurementScene: record.measurementScene,
    symptoms: record.symptoms,
    mealsText: mealItems.join('；'),
    mealItems,
    stapleAmount: record.stapleAmount,
    sugarIntake: record.sugarIntake,
    exerciseType: record.exercise.type,
    exerciseDuration: record.exercise.duration,
    exerciseIntensity: record.exercise.intensity,
    exerciseTiming: record.exercise.timing,
    cgmTrend: record.cgmTrend,
    note: record.note,
  };
}
