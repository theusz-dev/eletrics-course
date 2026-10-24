import { describe, expect, it } from 'vitest';
import { Simulator } from '../../engine/analysis/simulator';
import timer, { TIMER } from './temporizador-jumper.circuit';

/** Runs until `t` and returns whether the relay coil is energized. */
function runTo(sim: Simulator, t: number): void {
  sim.refresh();
  while (sim.t < t - sim.dt * 1e-6) sim.step();
}

function energized(sim: Simulator): boolean {
  return sim.frame({ samples: false }).readouts['K1.energized'] === true;
}

/** Presses DISPARO for 0,1 s at t = 0,2 s and returns how long the relay stays on. */
function pulseLength(longo: boolean): number {
  const sim = new Simulator(timer);
  if (longo) sim.setParam('SW1A', 's1', true);
  runTo(sim, 0.2);
  sim.setParam('S1', 'pressed', true);
  runTo(sim, 0.3);
  sim.setParam('S1', 'pressed', false);
  let on: number | undefined;
  while (sim.t < 30) {
    sim.step();
    const e = energized(sim);
    if (e && on === undefined) on = sim.t;
    if (!e && on !== undefined) return sim.t - 0.2;
  }
  return Infinity;
}

describe('m14/temporizador-jumper', () => {
  const rc = TIMER.r3 + TIMER.rv1;

  it('MONO: without a press the relay stays off', () => {
    const sim = new Simulator(timer);
    runTo(sim, 1);
    expect(energized(sim)).toBe(false);
  });

  it('MONO: one press keeps the relay on for about 1,1 × R × C', () => {
    const expected = 1.1 * rc * TIMER.c2;
    expect(expected).toBeCloseTo(1.11, 2);
    expect(pulseLength(false)).toBeGreaterThan(expected * 0.9);
    expect(pulseLength(false)).toBeLessThan(expected * 1.1);
  });

  it('LONGO: C3 in parallel makes the pulse about 11 times longer (about 12 s)', () => {
    const expected = 1.1 * rc * (TIMER.c2 + TIMER.c3);
    expect(expected).toBeCloseTo(12.2, 1);
    const t = pulseLength(true);
    expect(t).toBeGreaterThan(expected * 0.9);
    expect(t).toBeLessThan(expected * 1.1);
  });

  it('PISCA: the relay blinks about 0,7 s on and 0,7 s off', () => {
    const sim = new Simulator(timer);
    sim.setParam('JP1', 'actuated', true);
    sim.refresh();
    const edges: number[] = [];
    let last = energized(sim);
    while (sim.t < 6) {
      sim.step();
      const e = energized(sim);
      if (e !== last) edges.push(sim.t);
      last = e;
    }
    // Skip the first, longer pulse (from the empty capacitor).
    const on = edges[2]! - edges[1]!;
    const off = edges[3]! - edges[2]!;
    const tOn = 0.693 * rc * TIMER.c2;
    const tOff = 0.693 * TIMER.rv1 * TIMER.c2;
    expect(tOn).toBeCloseTo(0.7, 1);
    expect(tOff).toBeCloseTo(0.69, 1);
    // Which edge is "on" depends on the starting state; the two half periods match anyway.
    for (const half of [on, off]) {
      expect(half).toBeGreaterThan(0.6);
      expect(half).toBeLessThan(0.8);
    }
  });
});

describe('m14 timer formulas (widgets)', () => {
  it('match the circuit: 1,1 s, 12 s and 0,7 s / 0,7 s with RV1 at 100 kΩ', async () => {
    const { blink, monoPulse } = await import('./temporizador');
    expect(monoPulse({ longo: false, rv1: TIMER.rv1 })).toBeCloseTo(1.11, 2);
    expect(monoPulse({ longo: true, rv1: TIMER.rv1 })).toBeCloseTo(12.2, 1);
    const b = blink({ longo: false, rv1: TIMER.rv1 });
    expect(b.on).toBeCloseTo(0.7, 1);
    expect(b.off).toBeCloseTo(0.69, 1);
  });
});

describe('m14/temporizador-jumper: values quoted in lesson 14.1', () => {
  it('LD2 carries about 10 mA and the coil about 30 mA while the relay is on', () => {
    const sim = new Simulator(timer);
    runTo(sim, 0.1);
    sim.setParam('S1', 'pressed', true);
    runTo(sim, 0.3);
    const r = sim.frame({ samples: false }).readouts;
    expect(r['K1.energized']).toBe(true);
    expect(Number(r['LD2.current'])).toBeGreaterThan(0.0089);
    expect(Number(r['LD2.current'])).toBeLessThan(0.0109);
    expect(Number(r['K1.coilCurrent'])).toBeGreaterThan(0.027);
    expect(Number(r['K1.coilCurrent'])).toBeLessThan(0.031);
  });
});

describe('m14/temporizador-jumper: values quoted in lesson 14.4', () => {
  const vc = (sim: Simulator) => {
    const f = sim.frame({ samples: false });
    return Number(f.readouts['C2.voltage']);
  };

  it('MONO ends when the timing capacitor reaches two thirds of 12 V', () => {
    const sim = new Simulator(timer);
    runTo(sim, 0.1);
    sim.setParam('S1', 'pressed', true);
    runTo(sim, 0.15);
    sim.setParam('S1', 'pressed', false);
    let peak = 0;
    while (sim.t < 2) {
      sim.step();
      peak = Math.max(peak, vc(sim));
    }
    expect(peak).toBeGreaterThan(7.6);
    expect(peak).toBeLessThan(8.4);
  });

  it('PISCA keeps the timing capacitor between about 4 V and 8 V', () => {
    const sim = new Simulator(timer);
    sim.setParam('JP1', 'actuated', true);
    runTo(sim, 2);
    let lo = Infinity;
    let hi = 0;
    while (sim.t < 5) {
      sim.step();
      lo = Math.min(lo, vc(sim));
      hi = Math.max(hi, vc(sim));
    }
    expect(lo).toBeGreaterThan(3.6);
    expect(lo).toBeLessThan(4.4);
    expect(hi).toBeGreaterThan(7.6);
    expect(hi).toBeLessThan(8.4);
  });
});
