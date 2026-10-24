import { describe, expect, it } from 'vitest';
import {
  FAULTS,
  brightness,
  faultById,
  loopCurrent,
  measure,
  pickFault,
  potentials,
} from './caca-defeito';

describe('lesson 15.1 fault hunt', () => {
  it('an open part takes the whole 12 V across it, the good parts take none', () => {
    for (const fault of FAULTS.filter((f) => !Number.isFinite(f.ohms))) {
      const v = potentials(fault, true);
      const at = ['F1', 'S1', 'X1', 'L1', 'W2'].indexOf(fault.part);
      for (let i = 0; i < 5; i++) {
        const drop = v[i]! - v[i + 1]!;
        expect(drop).toBeCloseTo(i === at ? 12 : 0, 6);
      }
      expect(loopCurrent(fault, true)).toBe(0);
      expect(brightness(fault, true)).toBe(0);
    }
  });

  it('with the open return wire, the lamp reads 0 V and the wire 12 V', () => {
    const fault = faultById('retorno-rompido');
    expect(measure(fault, true, 'TP3', 'TP4')).toBe(0);
    expect(measure(fault, true, 'TP4', 'TP5')).toBe(12);
    // Measured against the battery −, every point before the gap shows 12 V.
    expect(measure(fault, true, 'TP4', 'TP5')).toBe(measure(fault, true, 'TP1', 'TP5'));
  });

  it('a loose terminal leaves the lamp dim, with about half the voltage lost in it', () => {
    const fault = faultById('borne-frouxo');
    expect(loopCurrent(fault, true)).toBeCloseTo(0.81, 2);
    expect(measure(fault, true, 'TP2', 'TP3')).toBeCloseTo(6.45, 1);
    expect(measure(fault, true, 'TP3', 'TP4')).toBeCloseTo(5.53, 1);
    expect(brightness(fault, true)).toBeGreaterThan(0.15);
    expect(brightness(fault, true)).toBeLessThan(0.3);
  });

  it('with the switch off, the switch takes the 12 V', () => {
    const fault = faultById('lampada-queimada');
    expect(measure(fault, false, 'TP1', 'TP2')).toBe(12);
    expect(measure(fault, false, 'TP3', 'TP4')).toBe(0);
  });

  it('swapping the probes flips the sign', () => {
    const fault = faultById('borne-frouxo');
    expect(measure(fault, true, 'TP5', 'TP0')).toBeCloseTo(-12, 6);
  });

  it('picks a different fault for the next round', () => {
    for (let seed = 1; seed < 40; seed++) {
      const a = pickFault(seed);
      expect(pickFault(seed + 1, a.id).id).not.toBe(a.id);
    }
  });
});
