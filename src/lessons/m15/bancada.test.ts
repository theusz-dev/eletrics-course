import { describe, expect, it } from 'vitest';
import { PARTS, conditionFor, spoken } from './bancada';

describe('lesson 15.2 component bench', () => {
  it('every condition has a reading for every test of its part', () => {
    for (const part of PARTS) {
      expect(part.conditions[0]!.good).toBe(true);
      expect(part.conditions.slice(1).every((c) => !c.good)).toBe(true);
      for (const c of part.conditions)
        for (const t of part.tests)
          expect(c.readings[t.id], `${part.id}/${c.id}/${t.id}`).toBeDefined();
    }
  });

  it('a bad part differs from the good one in at least one test', () => {
    for (const part of PARTS) {
      const good = part.conditions[0]!;
      for (const bad of part.conditions.slice(1)) {
        const differs = part.tests.some(
          (t) => spoken(bad.readings[t.id]!) !== spoken(good.readings[t.id]!),
        );
        expect(differs, `${part.id}/${bad.id}`).toBe(true);
      }
    }
  });

  it('the good readings agree with the lessons', () => {
    const r = (part: string, test: string) =>
      PARTS.find((p) => p.id === part)!.conditions[0]!.readings[test]!;
    // A 5 % 1 kΩ resistor reads between 950 Ω and 1.050 Ω.
    const ohms = Number(r('resistor', 'ohm').digits) * 1000;
    expect(ohms).toBeGreaterThanOrEqual(950);
    expect(ohms).toBeLessThanOrEqual(1050);
    // A 470 µF electrolytic, 20 %: 376 µF to 564 µF.
    const uf = Number(r('capacitor', 'cap').digits);
    expect(uf).toBeGreaterThanOrEqual(376);
    expect(uf).toBeLessThanOrEqual(564);
    // Silicon junctions read 0,5 V to 0,8 V in the diode test.
    for (const [part, test] of [
      ['diodo', 'direto'],
      ['transistor', 'be'],
      ['transistor', 'bc'],
    ] as const) {
      const v = Number(r(part, test).digits);
      expect(v).toBeGreaterThan(0.5);
      expect(v).toBeLessThan(0.8);
    }
  });

  it('the box mixes good and bad parts', () => {
    let good = 0;
    let total = 0;
    for (let seed = 1; seed <= 30; seed++)
      for (const part of PARTS) {
        total++;
        if (conditionFor(part, seed).good) good++;
      }
    expect(good / total).toBeGreaterThan(0.25);
    expect(good / total).toBeLessThan(0.55);
  });

  it('reads the display aloud with a comma', () => {
    expect(spoken({ digits: '0.562', unit: 'V' })).toBe('0,562 V');
    expect(spoken({ digits: 'OL', unit: 'kΩ' })).toBe('OL');
  });
});
