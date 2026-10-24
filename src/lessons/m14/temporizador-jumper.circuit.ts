import { defineCircuit } from '../../engine';

/**
 * 14.4: the 12 V relay timer board of the module (the same circuit as the
 * 3D part `relay-timer-board`). A 555 drives the relay through Q1. Jumper
 * JP1 picks where the trigger (pin 2) comes from: the DISPARO button
 * (MONO, one timed pulse per press) or the timing capacitor itself (PISCA,
 * the 555 runs free and the relay blinks). DIP switch SW1 adds C3 to the
 * timing capacitor (key 1, LONGO) and connects the buzzer to the 555
 * output (key 2, BIP). LD2 lights with the coil; the relay contacts (J2 on
 * the board) switch an external 12 V lamp. With RV1 at 100 kΩ: MONO lasts 1,1 × 101 kΩ × 10 µF ≈ 1,1 s,
 * or about 12 s with LONGO; PISCA stays on about 0,7 s and off about 0,7 s
 * (the first pulse lasts 1,1 s, from the empty capacitor). The timing the
 * lesson quotes is checked in ./temporizador.test.ts.
 */
export const TIMER = {
  r3: 1000,
  rv1: 100_000,
  c2: 10e-6,
  c3: 100e-6,
};

export default defineCircuit({
  id: 'm14/temporizador-jumper',
  title: 'Placa temporizadora: jumper de modo e chave DIP',
  description:
    'Uma fonte de 12 V alimenta a placa temporizadora do módulo. O CI 555 (U1) comanda o relé K1 pelo transistor Q1, com o diodo D2 em paralelo com a bobina e o LED LD2 (com R5) aceso enquanto a bobina está ligada. O resistor R3 e o trimpot RV1, de 100 kΩ, carregam o capacitor de tempo C2, de 10 µF. O jumper JP1 escolhe de onde vem o disparo do pino 2: na posição MONO, do botão DISPARO (S1), com o resistor R2 de 10 kΩ segurando a entrada em nível alto; na posição PISCA, do próprio capacitor de tempo, e o 555 oscila sozinho. A chave 1 da DIP SW1 (LONGO) liga o capacitor C3, de 100 µF, em paralelo com C2, e o tempo fica cerca de 11 vezes maior. A chave 2 (BIP) liga o buzzer BZ1 na saída do 555. O contato NA do relé, no borne J2, liga a carga: uma lâmpada de 12 V e 5 W. Em MONO, cada aperto do botão liga o relé por cerca de 1,1 s (12 s com LONGO); em PISCA, o relé liga e desliga a cada 0,7 s.',
  analysis: { kind: 'transient', dt: 1e-3, speed: 1 },
  elements: [
    {
      id: 'V1',
      type: 'dc-voltage',
      a: [4, 0],
      b: [4, 40],
      label: '12 V',
      params: { voltage: 12 },
    },
    {
      id: 'W1',
      type: 'wire',
      points: [
        [4, 0],
        [24, 0],
        [45, 0],
        [50, 0],
        [56, 0],
        [63, 0],
        [69, 0],
        [80, 0],
      ],
    },
    {
      id: 'W2',
      type: 'wire',
      points: [
        [4, 40],
        [24, 40],
        [36, 40],
        [43, 40],
        [45, 40],
        [50, 40],
        [56, 40],
        [69, 40],
        [73, 40],
      ],
    },
    { id: 'G', type: 'ground', at: [4, 40] },

    // 555 and its supply, reset and control pins.
    { id: 'U1', type: 'timer-555', at: [44, 20], label: 'U1' },
    {
      id: 'W3',
      type: 'wire',
      points: [
        [45, 15],
        [45, 12],
        [45, 0],
      ],
    },
    {
      id: 'W4',
      type: 'wire',
      points: [
        [43, 15],
        [43, 12],
        [45, 12],
      ],
    },
    {
      id: 'W5',
      type: 'wire',
      points: [
        [43, 25],
        [43, 40],
      ],
    },
    {
      id: 'C4',
      type: 'capacitor',
      a: [45, 25],
      b: [45, 40],
      label: 'C4',
      params: { capacitance: 10e-9, voltage: 50 },
    },

    // Timing network: R3, RV1 and C2 (+ C3 through SW1 key 1).
    {
      id: 'R3',
      type: 'resistor',
      a: [24, 0],
      b: [24, 8],
      label: 'R3',
      params: { resistance: TIMER.r3 },
    },
    {
      id: 'W6',
      type: 'wire',
      points: [
        [24, 8],
        [24, 10],
        [24, 12],
      ],
    },
    {
      id: 'W7',
      type: 'wire',
      points: [
        [24, 10],
        [38, 10],
        [38, 18],
        [40, 18],
      ],
    },
    {
      id: 'RV1',
      type: 'resistor',
      a: [24, 12],
      b: [24, 19],
      label: 'RV1',
      params: { resistance: TIMER.rv1 },
      control: {
        param: 'resistance',
        label: 'Trimpot RV1 (TEMPO)',
        kind: 'slider',
        min: 10_000,
        max: 1_000_000,
        step: 10_000,
        unit: 'Ω',
      },
    },
    {
      id: 'W8',
      type: 'wire',
      points: [
        [24, 19],
        [24, 20],
        [24, 22],
        [24, 26],
      ],
    },
    {
      id: 'W9',
      type: 'wire',
      points: [
        [24, 20],
        [38, 20],
        [40, 20],
      ],
    },
    {
      id: 'C2',
      type: 'capacitor',
      a: [24, 26],
      b: [24, 40],
      label: 'C2',
      params: { capacitance: TIMER.c2, voltage: 25, polarized: true },
    },
    {
      id: 'W10',
      type: 'wire',
      points: [
        [24, 22],
        [27, 22],
      ],
    },
    {
      id: 'SW1A',
      type: 'dip-switch',
      at: [29, 22],
      label: 'SW1-1',
      params: { positions: 1, s1: false },
      control: { param: 's1', label: 'SW1, chave 1 (LONGO)', kind: 'toggle' },
    },
    {
      id: 'W11',
      type: 'wire',
      points: [
        [31, 22],
        [36, 22],
        [36, 26],
      ],
    },
    {
      id: 'C3',
      type: 'capacitor',
      a: [36, 26],
      b: [36, 40],
      label: 'C3',
      params: { capacitance: TIMER.c3, voltage: 25, polarized: true },
    },

    // JP1: trigger from the button (MONO) or from the capacitor (PISCA).
    {
      id: 'JP1',
      type: 'switch-spdt',
      at: [40, 27],
      rot: 90,
      label: 'JP1',
      params: { actuated: false },
      control: {
        param: 'actuated',
        label: 'Jumper JP1 (MODO)',
        kind: 'select',
        options: [
          { value: false, label: 'MONO: disparo pelo botão' },
          { value: true, label: 'PISCA: o 555 oscila sozinho' },
        ],
      },
    },
    {
      id: 'W12',
      type: 'wire',
      points: [
        [40, 22],
        [40, 24],
      ],
    },
    {
      id: 'W13',
      type: 'wire',
      points: [
        [38, 30],
        [38, 20],
      ],
    },

    // DISPARO: pull-up R2 and button S1.
    {
      id: 'R2',
      type: 'resistor',
      a: [50, 0],
      b: [50, 8],
      label: 'R2',
      params: { resistance: 10_000 },
    },
    {
      id: 'W14',
      type: 'wire',
      points: [
        [50, 8],
        [50, 30],
        [50, 32],
      ],
    },
    {
      id: 'W15',
      type: 'wire',
      points: [
        [42, 30],
        [50, 30],
      ],
    },
    {
      id: 'S1',
      type: 'push-button',
      a: [50, 32],
      b: [50, 40],
      label: 'S1',
      control: { param: 'pressed', label: 'Botão DISPARO (S1)', kind: 'momentary' },
    },

    // Output: R4, Q1, relay K1 with the flywheel diode D2.
    {
      id: 'W16',
      type: 'wire',
      points: [
        [48, 20],
        [52, 20],
        [52, 24],
        [54, 24],
      ],
    },
    {
      id: 'R4',
      type: 'resistor',
      a: [54, 24],
      b: [60, 24],
      label: 'R4',
      params: { resistance: 1000 },
    },
    {
      id: 'W17',
      type: 'wire',
      points: [
        [60, 24],
        [66, 24],
      ],
    },
    { id: 'Q1', type: 'npn', at: [68, 24], label: 'Q1' },
    {
      id: 'W18',
      type: 'wire',
      points: [
        [69, 26],
        [69, 40],
      ],
    },
    {
      id: 'K1',
      type: 'relay-spdt',
      at: [71, 14],
      label: 'K1',
      params: { coilVoltage: 12, coilResistance: 400 },
    },
    {
      id: 'W19',
      type: 'wire',
      points: [
        [69, 12],
        [69, 0],
      ],
    },
    {
      id: 'W20',
      type: 'wire',
      points: [
        [69, 16],
        [69, 19],
        [69, 22],
      ],
    },
    {
      id: 'W21',
      type: 'wire',
      points: [
        [69, 19],
        [63, 19],
      ],
    },
    {
      id: 'D2',
      type: 'diode',
      a: [63, 19],
      b: [63, 6],
      label: 'D2',
      params: { model: 'signal' },
    },
    {
      id: 'W22',
      type: 'wire',
      points: [
        [63, 6],
        [63, 0],
      ],
    },
    {
      id: 'W23',
      type: 'wire',
      points: [
        [73, 16],
        [73, 40],
      ],
    },

    // LD2 and R5 across the coil: the LED lights while the coil is on.
    {
      id: 'R5',
      type: 'resistor',
      a: [56, 0],
      b: [56, 6],
      label: 'R5',
      params: { resistance: 1000 },
    },
    {
      id: 'LD2',
      type: 'led',
      a: [56, 6],
      b: [56, 12],
      label: 'LD2',
      params: { color: 'red' },
    },
    {
      id: 'W24',
      type: 'wire',
      points: [
        [56, 12],
        [56, 19],
        [63, 19],
      ],
    },

    // Buzzer on the 555 output, through SW1 key 2 (BIP).
    {
      id: 'W25',
      type: 'wire',
      points: [
        [52, 24],
        [52, 27],
        [56, 27],
        [56, 29],
      ],
    },
    {
      id: 'SW1B',
      type: 'dip-switch',
      at: [56, 31],
      rot: 90,
      label: 'SW1-2',
      params: { positions: 1, s1: false },
      control: { param: 's1', label: 'SW1, chave 2 (BIP)', kind: 'toggle' },
    },
    {
      id: 'W26',
      type: 'wire',
      points: [
        [56, 33],
        [56, 34],
      ],
    },
    {
      id: 'BZ1',
      type: 'buzzer',
      a: [56, 34],
      b: [56, 40],
      label: 'BZ1',
      params: { voltage: 12, current: 0.02 },
    },

    // Load on J2: a 12 V lamp between +12 V and the NA contact (C goes to GND).
    {
      id: 'W27',
      type: 'wire',
      points: [
        [74, 12],
        [80, 12],
      ],
    },
    {
      id: 'LP1',
      type: 'lamp',
      a: [80, 0],
      b: [80, 12],
      label: 'Carga',
      params: { voltage: 12, power: 5 },
    },
  ],
  probes: [
    { id: 'VC', kind: 'voltage', plus: 'C2.a', minus: 'GND', label: 'Capacitor de tempo' },
    { id: 'VS', kind: 'voltage', plus: 'U1.out', minus: 'GND', label: 'Saída do 555' },
  ],
  goals: [
    {
      id: 'disparo',
      description: 'Aperte o botão DISPARO: o relé liga e a carga acende.',
      check: { readout: 'LP1.brightness', op: '>', value: 0.5 },
      solution: { 'S1.pressed': true },
      at: 0.5,
    },
    {
      id: 'pisca-liga',
      description: 'Ponha o jumper JP1 em PISCA: o relé liga sozinho.',
      check: { readout: 'K1.energized', op: '==', value: true },
      solution: { 'JP1.actuated': true },
      at: 0.5,
    },
    {
      id: 'bip',
      description:
        'Ligue a chave 2 da DIP (BIP) e aperte o botão: o buzzer apita enquanto a saída do 555 está ligada.',
      check: { readout: 'BZ1.sounding', op: '==', value: true },
      solution: { 'S1.pressed': true, 'SW1B.s1': true },
      at: 0.5,
    },
  ],
});
