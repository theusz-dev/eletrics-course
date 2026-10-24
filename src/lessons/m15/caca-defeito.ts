/*
 * Lesson 15.1: a 12 V lamp circuit with one hidden fault. The loop is
 * battery + → F1 → S1 → X1 (terminal block) → L1 (lamp) → return wire → battery −,
 * with six test points between the parts. The student measures the voltage
 * between any two points and names the faulty part. The circuit is a plain
 * series loop, so the solution is exact: one current, one drop per part.
 */

export const SUPPLY = 12;

/** Test points, in loop order. TP0 is the battery +, TP5 the battery −. */
export const POINTS = [
  { id: 'TP0', label: 'TP0: positivo da bateria' },
  { id: 'TP1', label: 'TP1: entre o fusível e o interruptor' },
  { id: 'TP2', label: 'TP2: entre o interruptor e o borne' },
  { id: 'TP3', label: 'TP3: entre o borne e a lâmpada' },
  { id: 'TP4', label: 'TP4: entre a lâmpada e o fio de retorno' },
  { id: 'TP5', label: 'TP5: negativo da bateria' },
] as const;

export type PointId = (typeof POINTS)[number]['id'];

/** Parts of the loop; part i sits between point i and point i + 1. */
export const PARTS = [
  { id: 'F1', name: 'Fusível F1', ohms: 0.02 },
  { id: 'S1', name: 'Interruptor S1', ohms: 0.01 },
  { id: 'X1', name: 'Borne X1', ohms: 0.005 },
  { id: 'L1', name: 'Lâmpada L1 (12 V, 21 W)', ohms: (SUPPLY * SUPPLY) / 21 },
  { id: 'W2', name: 'Fio de retorno', ohms: 0.01 },
] as const;

export type PartId = (typeof PARTS)[number]['id'];

export interface Fault {
  id: string;
  part: PartId;
  /** Resistance of the faulty part (Ω); Infinity is open. */
  ohms: number;
  /** What the student sees before measuring. */
  symptom: string;
  /** Why, once found. */
  cause: string;
}

export const FAULTS: Fault[] = [
  {
    id: 'fusivel-aberto',
    part: 'F1',
    ohms: Infinity,
    symptom: 'A lâmpada não acende.',
    cause:
      'O fusível F1 rompeu. Antes de trocar, procure por que ele rompeu: um curto ou uma peça puxando corrente demais.',
  },
  {
    id: 'interruptor-aberto',
    part: 'S1',
    ohms: Infinity,
    symptom: 'A lâmpada não acende.',
    cause:
      'O contato do interruptor S1 não fecha: a lâmina gastou ou quebrou por dentro. Troque o interruptor.',
  },
  {
    id: 'lampada-queimada',
    part: 'L1',
    ohms: Infinity,
    symptom: 'A lâmpada não acende.',
    cause: 'O filamento da lâmpada L1 rompeu. Troque por outra de mesma tensão e potência.',
  },
  {
    id: 'retorno-rompido',
    part: 'W2',
    ohms: Infinity,
    symptom: 'A lâmpada não acende.',
    cause:
      'O fio de retorno está rompido (ou solto num terminal). Sem ele, a corrente não volta para a bateria.',
  },
  {
    id: 'borne-frouxo',
    part: 'X1',
    ohms: 8,
    symptom: 'A lâmpada acende fraca, e o borne X1 está morno.',
    cause:
      'O parafuso do borne X1 está frouxo: o mau contato tem alguns ohms e fica com boa parte da tensão. Reaperte (ou troque o borne, se esquentou demais) e meça de novo.',
  },
];

export const faultById = (id: string): Fault => FAULTS.find((f) => f.id === id) ?? FAULTS[0]!;

/** Resistance of each part, with the fault and the switch position. */
function resistances(fault: Fault, switchOn: boolean): number[] {
  return PARTS.map((p) => {
    if (p.id === 'S1' && !switchOn) return Infinity;
    return p.id === fault.part ? fault.ohms : p.ohms;
  });
}

/** Loop current (A). */
export function loopCurrent(fault: Fault, switchOn: boolean): number {
  const total = resistances(fault, switchOn).reduce((a, b) => a + b, 0);
  return Number.isFinite(total) ? SUPPLY / total : 0;
}

/**
 * Potential of each test point relative to the battery − (V). With the loop
 * open, every point on the + side of the gap sits at 12 V and every point on
 * the − side at 0 V: no current, so no drop across the good parts.
 */
export function potentials(fault: Fault, switchOn: boolean): number[] {
  const r = resistances(fault, switchOn);
  const gap = r.findIndex((x) => !Number.isFinite(x));
  if (gap >= 0) return POINTS.map((_, i) => (i <= gap ? SUPPLY : 0));
  const i = loopCurrent(fault, switchOn);
  const out = [SUPPLY];
  for (const ohms of r) out.push(out[out.length - 1]! - i * ohms);
  out[out.length - 1] = 0;
  return out;
}

const index = (p: PointId) => POINTS.findIndex((x) => x.id === p);

/** Voltage the meter shows with the red probe on `red` and the black on `black`. */
export function measure(fault: Fault, switchOn: boolean, red: PointId, black: PointId): number {
  const v = potentials(fault, switchOn);
  return v[index(red)]! - v[index(black)]!;
}

/** Lamp brightness, 0 to 1 (power over the rated 21 W). */
export function brightness(fault: Fault, switchOn: boolean): number {
  const i = loopCurrent(fault, switchOn);
  const lamp = PARTS.find((p) => p.id === 'L1')!.ohms;
  return Math.min((i * i * lamp) / 21, 1);
}

/** A fault picked from the seed, never the same as `not`. */
export function pickFault(seed: number, not?: string): Fault {
  const pool = FAULTS.filter((f) => f.id !== not);
  const x = Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
  return pool[Math.floor(x * pool.length)]!;
}
