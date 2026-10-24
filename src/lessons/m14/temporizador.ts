/*
 * Module 14: timing of the 555 on the timer board, from the part values of
 * the lesson circuit (temporizador-jumper.circuit.ts), for the widgets.
 */
import { TIMER } from './temporizador-jumper.circuit';

export type JumperMode = 'mono' | 'pisca' | 'sem-jumper';

export interface TimerSettings {
  mode: JumperMode;
  longo: boolean;
  /** RV1 (Ω). */
  rv1: number;
}

/** Timing capacitance: C2, plus C3 with DIP key 1 (LONGO) on. */
export const timingCapacitance = (longo: boolean) => TIMER.c2 + (longo ? TIMER.c3 : 0);

/** Monostable pulse: t = 1,1 × (R3 + RV1) × C. */
export function monoPulse({ longo, rv1 }: Pick<TimerSettings, 'longo' | 'rv1'>): number {
  return 1.1 * (TIMER.r3 + rv1) * timingCapacitance(longo);
}

/** Astable: on for 0,693 × (R3 + RV1) × C, off for 0,693 × RV1 × C. */
export function blink({ longo, rv1 }: Pick<TimerSettings, 'longo' | 'rv1'>) {
  const c = timingCapacitance(longo);
  return { on: 0.693 * (TIMER.r3 + rv1) * c, off: 0.693 * rv1 * c };
}

export const RV1_MIN = 10_000;
export const RV1_MAX = 1_000_000;
