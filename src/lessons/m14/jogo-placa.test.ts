import { describe, expect, it } from 'vitest';
import { TIMER_PARTS } from '../../three/parts/_timer-board-layout';
import { makeRounds } from './jogo-placa';

describe('m14 "what is it?" game', () => {
  it('asks about different kinds, each with four distinct options including the answer', () => {
    for (const seed of [1, 2, 3, 42, 1234]) {
      const rounds = makeRounds(seed);
      expect(rounds).toHaveLength(8);
      expect(new Set(rounds.map((r) => r.answer)).size).toBe(8);
      for (const r of rounds) {
        expect(r.options).toHaveLength(4);
        expect(new Set(r.options).size).toBe(4);
        expect(r.options).toContain(r.answer);
        expect(TIMER_PARTS.find((p) => p.ref === r.ref)?.kind).toBe(r.answer);
      }
    }
  });

  it('is deterministic for a seed', () => {
    expect(makeRounds(7)).toEqual(makeRounds(7));
  });
});
