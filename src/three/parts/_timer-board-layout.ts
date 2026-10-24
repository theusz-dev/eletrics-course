/**
 * Layout of the course's 12 V relay timer board (`relay-timer-board.tsx`),
 * shared with the lessons that draw the same board in 2D (module 14). A
 * 90 × 55 mm double-sided FR-4 board, the size of the cheap timer modules
 * sold for automation: a 555 with a trimpot sets the time, a transistor
 * drives a 12 V relay, and the relay contacts leave through a 3-way terminal
 * block (NA, C, NF). The circuit is the one of
 * `src/lessons/m14/temporizador-jumper.circuit.ts`.
 *
 * Coordinates are layout millimetres (origin at the top-left corner, y down),
 * like `pcb/layout.ts`. Rotations are degrees, counter-clockwise as seen from
 * the top, like the gate board.
 */
import type { PcbLayout, PcbPad, PcbSilk, PcbTrace, PcbVia, Point } from '../pcb/layout';
import { RELAY_PINS } from './relay';

export const TIMER_BOARD = { width: 90, height: 55, thickness: 1.6 };

export type TimerPartKind =
  | 'borne'
  | 'fusivel'
  | 'diodo'
  | 'eletrolitico'
  | 'ceramico'
  | 'led'
  | 'resistor'
  | 'conector'
  | 'botao'
  | 'trimpot'
  | 'ci'
  | 'jumper'
  | 'dip'
  | 'transistor'
  | 'rele'
  | 'buzzer';

export interface TimerPart {
  /** Reference designator, as printed on the silkscreen and in the schematic. */
  ref: string;
  kind: TimerPartKind;
  /** What it is, in pt-BR: "Resistor de 1 kΩ". */
  name: string;
  /** What it does on this board, in pt-BR. */
  role: string;
  at: Point;
  /** Rotation (degrees, counter-clockwise from the top). */
  deg: number;
  /** Footprint size before rotation (layout mm), for 2D outlines and hit areas. */
  size: Point;
  /** Height of the body top above the board (mm), for annotations. */
  height: number;
}

/** A local point (x, z) of a part placed at `at`, turned `deg`. */
export function localPoint(at: Point, deg: number, [lx, lz]: readonly [number, number]): Point {
  const a = (deg * Math.PI) / 180;
  return [at[0] + lx * Math.cos(a) + lz * Math.sin(a), at[1] - lx * Math.sin(a) + lz * Math.cos(a)];
}

/** Footprint size as seen on the board (after the rotation). */
export function boardSize(part: TimerPart): Point {
  const quarter = Math.round(part.deg / 90) % 2 !== 0;
  return quarter ? [part.size[1], part.size[0]] : part.size;
}

export const TIMER_PARTS: TimerPart[] = [
  part(
    'J1',
    'borne',
    'Borne de parafuso de 2 vias',
    'Entrada da alimentação de 12 V: +12V e GND',
    [4.3, 15],
    -90,
    [10.2, 7.6],
    10,
  ),
  part(
    'F1',
    'fusivel',
    'Fusível de vidro 5 × 20 mm, 1 A, nos clipes',
    'Protege a placa e a fonte: rompe num curto ou numa sobrecarga',
    [24, 6.5],
    0,
    [24, 6],
    8,
  ),
  part(
    'D1',
    'diodo',
    'Diodo retificador 1N4007',
    'Proteção contra inversão: com a fonte ligada ao contrário, ele não conduz',
    [24, 14],
    180,
    [12, 3],
    4,
  ),
  part(
    'C1',
    'eletrolitico',
    'Capacitor eletrolítico de 470 µF, 25 V',
    'Filtro da alimentação: segura os 12 V quando o relé liga',
    [41, 12],
    0,
    [10.4, 10.4],
    21,
  ),
  part(
    'LD1',
    'led',
    'LED verde de 3 mm',
    'Indica que a placa está alimentada',
    [14, 25],
    0,
    [3.6, 3.6],
    6,
  ),
  part(
    'R1',
    'resistor',
    'Resistor de 1 kΩ (marrom, preto, vermelho)',
    'Limita a corrente do LED LD1',
    [14, 31],
    0,
    [12, 2.6],
    3.6,
  ),
  part(
    'CN1',
    'conector',
    'Conector KK de 3 pinos',
    'Entrada para um sensor ou botão externo: +12V, DISP e GND',
    [4.5, 32],
    90,
    [7.7, 5],
    8,
  ),
  part(
    'R2',
    'resistor',
    'Resistor de 10 kΩ (marrom, preto, laranja)',
    'Pull-up: segura a entrada de disparo em nível alto até o botão ser apertado',
    [16, 36],
    0,
    [12, 2.6],
    3.6,
  ),
  part(
    'S1',
    'botao',
    'Botão tátil de 6 mm',
    'DISPARO: começa a contagem do tempo',
    [10, 44],
    0,
    [6.2, 6.2],
    5,
  ),
  part(
    'R3',
    'resistor',
    'Resistor de 1 kΩ (marrom, preto, vermelho)',
    'Parte da rede de tempo, com RV1 e C2',
    [30, 22],
    0,
    [12, 2.6],
    3.6,
  ),
  part(
    'RV1',
    'trimpot',
    'Trimpot de 1 MΩ',
    'TEMPO: ajusta quanto tempo o relé fica ligado',
    [34, 31],
    0,
    [6.8, 6.8],
    5,
  ),
  part(
    'C2',
    'eletrolitico',
    'Capacitor eletrolítico de 10 µF, 25 V',
    'Capacitor de tempo: o 555 mede quanto ele demora para carregar',
    [40, 40],
    0,
    [5.4, 5.4],
    12,
  ),
  part(
    'C3',
    'eletrolitico',
    'Capacitor eletrolítico de 100 µF, 25 V',
    'Capacitor extra de tempo, ligado pela chave 1 da DIP (LONGO)',
    [30, 40],
    0,
    [6.8, 6.8],
    12,
  ),
  part(
    'SW1',
    'dip',
    'Chave DIP de 2 posições',
    'Chave 1 (LONGO): liga C3 e o tempo fica cerca de 11 vezes maior; chave 2 (BIP): liga o buzzer',
    [35, 48],
    -90,
    [10, 6.6],
    5,
  ),
  part(
    'BZ1',
    'buzzer',
    'Buzzer ativo de 12 mm',
    'Apita enquanto a saída está ligada, se a chave 2 da DIP (BIP) estiver ligada',
    [22, 48.6],
    180,
    [12, 12],
    9.5,
  ),
  part(
    'U1',
    'ci',
    'Circuito integrado NE555 (DIP-8) no soquete',
    'Temporizador: liga a saída pelo tempo que a rede de tempo define',
    [48, 30],
    0,
    [11, 8.6],
    7,
  ),
  part(
    'C4',
    'ceramico',
    'Capacitor cerâmico de 10 nF',
    'Desacopla o pino de controle do 555 contra ruído',
    [55, 24],
    90,
    [5, 3],
    9,
  ),
  part(
    'JP1',
    'jumper',
    'Barra de 3 pinos com jumper',
    'MODO: jumper nos pinos 1 e 2 (MONO) dá um pulso a cada disparo; nos pinos 2 e 3 (PISCA), liga e desliga sem parar',
    [47, 47],
    0,
    [7.8, 2.6],
    8.5,
  ),
  part(
    'D2',
    'diodo',
    'Diodo de sinal 1N4148',
    'Diodo de roda livre: absorve o pico da bobina do relé quando ela desliga',
    [59, 18],
    90,
    [9.6, 2],
    3,
  ),
  part(
    'R4',
    'resistor',
    'Resistor de 1 kΩ (marrom, preto, vermelho)',
    'Limita a corrente da base do transistor Q1',
    [67, 24],
    0,
    [12, 2.6],
    3.6,
  ),
  part(
    'Q1',
    'transistor',
    'Transistor NPN BC337 (TO-92)',
    'Chave da bobina do relé, comandada pela saída do 555',
    [67, 31],
    0,
    [5.6, 4],
    8,
  ),
  part(
    'K1',
    'rele',
    'Relé de 12 V com um contato reversível',
    'Liga a carga externa pelos contatos NA, C e NF',
    [73, 11],
    0,
    [19.4, 15.6],
    15.5,
  ),
  part(
    'LD2',
    'led',
    'LED vermelho de 3 mm',
    'Acende quando a bobina do relé está ligada',
    [76, 40],
    0,
    [3.6, 3.6],
    6,
  ),
  part(
    'R5',
    'resistor',
    'Resistor de 1 kΩ (marrom, preto, vermelho)',
    'Limita a corrente do LED LD2',
    [76, 47],
    0,
    [12, 2.6],
    3.6,
  ),
  part(
    'J2',
    'borne',
    'Borne de parafuso de 3 vias',
    'Saída dos contatos do relé: NA, C e NF (contato seco)',
    [85.7, 30],
    90,
    [15.3, 7.6],
    10,
  ),
];

function part(
  ref: string,
  kind: TimerPartKind,
  name: string,
  role: string,
  at: Point,
  deg: number,
  size: Point,
  height: number,
): TimerPart {
  return { ref, kind, name, role, at, deg, size, height };
}

export const TIMER_REFS = TIMER_PARTS.map((p) => p.ref);

export function timerPart(ref: string): TimerPart | undefined {
  return TIMER_PARTS.find((p) => p.ref === ref);
}

/** Electrolytic sizes used here (match `electrolyticSize` of the kit). */
export const CAP_SIZES = {
  C1: { farads: 470e-6, voltage: 25, D: 10, pitch: 5 },
  C2: { farads: 10e-6, voltage: 25, D: 5, pitch: 2 },
  C3: { farads: 100e-6, voltage: 25, D: 6.3, pitch: 2.5 },
} as const;

/** Terminal labels, in the order of the ways (`J2` turned 90°: way 0 is the lowest). */
export const J1_LABELS = ['+12V', 'GND'];
export const J2_LABELS = ['NF', 'C', 'NA'];

/** Where the cold solder joint of `defect: 'solda-fria'` is: the C way of J2. */
export const COLD_JOINT_PAD = 'J2.2';

/** Pads of one part, with ids "<ref>.<pin>" (pins numbered from 1). */
function padsOf(part: TimerPart): PcbPad[] {
  const { at, deg, ref } = part;
  const p = (
    n: number,
    local: readonly [number, number],
    drill: number,
    size: number,
    extra = {},
  ) => ({
    id: `${ref}.${n}`,
    at: localPoint(at, deg, local),
    drill,
    size,
    solder: true,
    ...extra,
  });
  const sq = { shape: 'square' as const };
  switch (part.kind) {
    case 'borne': {
      const n = ref === 'J1' ? 2 : 3;
      return Array.from({ length: n }, (_, i) =>
        p(i + 1, [(i - (n - 1) / 2) * 5.08, -1.75], 1.3, 2.6, i === 0 ? sq : {}),
      );
    }
    case 'fusivel':
      return [-9, -6.2, 6.2, 9].map((x, i) => p(i + 1, [x, 0], 1.2, 2.4));
    case 'diodo': {
      const half = ref === 'D1' ? 5.08 : 3.81;
      return [p(1, [half, 0], 1, 2, sq), p(2, [-half, 0], 1, 2)];
    }
    case 'resistor':
      return [p(1, [-5.08, 0], 0.9, 1.8), p(2, [5.08, 0], 0.9, 1.8)];
    case 'eletrolitico': {
      const size = CAP_SIZES[ref as keyof typeof CAP_SIZES];
      return [p(1, [size.pitch / 2, 0], 0.9, 1.8, sq), p(2, [-size.pitch / 2, 0], 0.9, 1.8)];
    }
    case 'ceramico':
      return [p(1, [-1.27, 0], 0.8, 1.6), p(2, [1.27, 0], 0.8, 1.6)];
    case 'led':
      return [p(1, [1.27, 0], 0.8, 1.5, sq), p(2, [-1.27, 0], 0.8, 1.5)];
    case 'conector':
      return [-2.54, 0, 2.54].map((x, i) => p(i + 1, [x, 0], 1, 1.7, i === 0 ? sq : {}));
    case 'botao':
      return [
        [-3.25, -2.25],
        [3.25, -2.25],
        [-3.25, 2.25],
        [3.25, 2.25],
      ].map((l, i) => p(i + 1, l as [number, number], 1, 1.8));
    case 'trimpot':
      return [
        [-2.5, 2.5],
        [0, -2.5],
        [2.5, 2.5],
      ].map((l, i) => p(i + 1, l as [number, number], 1, 1.9));
    case 'ci': {
      // Pin 1 at the bottom left (notch on the left), counter-clockwise.
      const out: PcbPad[] = [];
      for (let i = 0; i < 4; i++)
        out.push(p(i + 1, [(i - 1.5) * 2.54, 3.81], 0.9, 1.6, i === 0 ? sq : {}));
      for (let i = 0; i < 4; i++) out.push(p(i + 5, [(1.5 - i) * 2.54, -3.81], 0.9, 1.6));
      return out;
    }
    case 'jumper':
      return [-2.54, 0, 2.54].map((x, i) => p(i + 1, [x, 0], 1, 1.7, sq));
    case 'dip':
      return [
        [-1.27, -3.81],
        [-1.27, 3.81],
        [1.27, -3.81],
        [1.27, 3.81],
      ].map((l, i) => p(i + 1, l as [number, number], 0.9, 1.6));
    case 'transistor':
      return [-2.54, 0, 2.54].map((x, i) => p(i + 1, [x, 0], 0.8, 1.5));
    case 'rele':
      return [RELAY_PINS.coil1, RELAY_PINS.coil2, RELAY_PINS.com, RELAY_PINS.no, RELAY_PINS.nc].map(
        (l, i) => p(i + 1, l, 1.3, 2.6),
      );
    case 'buzzer':
      return [p(1, [-3.8, 0], 0.9, 1.7, sq), p(2, [3.8, 0], 0.9, 1.7)];
  }
}

/** Pads on the ground net (they join the bottom ground pour). */
const GROUND_PADS = new Set([
  'J1.2',
  'C1.2',
  'R1.2',
  'C2.2',
  'C3.2',
  'U1.1',
  'C4.2',
  'S1.3',
  'S1.4',
  'CN1.1',
  'Q1.3',
  'BZ1.2',
]);

const W = (points: Point[], width: number, side: 'top' | 'bottom' = 'top'): PcbTrace => ({
  points,
  width,
  side,
});

/** The relay's NA contact to the NA way of J2: the wide trace that `trilha-rompida` breaks. */
const NA_TRACE: Point[] = [
  [80.8, 5],
  [84.6, 8.6],
  [84.6, 20],
  [83.95, 24.92],
];

/** Centre of the break in the NA trace (layout mm). */
export const BREAK_AT: Point = [84.6, 13.4];

function traces(broken: boolean): PcbTrace[] {
  const na: PcbTrace[] = broken
    ? [
        W([...NA_TRACE.slice(0, 2), [84.6, BREAK_AT[1] - 0.8]], 2),
        W([[84.6, BREAK_AT[1] + 0.8], ...NA_TRACE.slice(2)], 2),
      ]
    : [W(NA_TRACE, 2)];
  return [
    // 12 V in: J1, F1, D1, then the rail along y = 19.
    W(
      [
        [6.05, 12.46],
        [10, 8.6],
        [15, 6.5],
      ],
      1.5,
    ),
    W(
      [
        [33, 6.5],
        [33, 10],
        [29.08, 14],
      ],
      1.5,
    ),
    W(
      [
        [18.92, 14],
        [18.92, 19],
        [53.2, 19],
      ],
      1.2,
    ),
    W(
      [
        [43.5, 12],
        [43.5, 19],
      ],
      1.2,
    ),
    W(
      [
        [43.5, 19],
        [44.19, 20.4],
        [44.19, 26.19],
      ],
      0.5,
    ),
    W(
      [
        [18.92, 19],
        [15.27, 22.2],
        [15.27, 25],
      ],
      0.5,
    ),
    W(
      [
        [12.73, 25],
        [8.92, 28.6],
        [8.92, 31],
      ],
      0.5,
    ),
    W(
      [
        [21.08, 36],
        [22.6, 34.4],
        [22.6, 19],
      ],
      0.5,
    ),
    W(
      [
        [4.5, 29.46],
        [8.4, 25.6],
        [8.4, 16],
        [10.4, 14],
        [18.92, 14],
      ],
      0.5,
      'bottom',
    ),
    // DISPARO: CN1, R2 (pull-up), S1 and pin 1 of JP1 (MONO).
    W(
      [
        [4.5, 32],
        [7.6, 35],
        [10.92, 36],
      ],
      0.5,
      'bottom',
    ),
    W(
      [
        [10.92, 36],
        [8.6, 38.4],
        [6.75, 40.2],
        [6.75, 41.75],
      ],
      0.5,
    ),
    W(
      [
        [13.25, 41.75],
        [15.2, 43.4],
        [15.2, 52.6],
        [42.6, 52.6],
        [44.46, 50.6],
        [44.46, 47],
      ],
      0.5,
    ),
    // Timing: R3 to pin 7 and the wiper of RV1; pin 6 to RV1 and C2.
    W(
      [
        [24.92, 22],
        [24.92, 19],
      ],
      0.5,
    ),
    W(
      [
        [35.08, 22],
        [38, 25],
        [42, 28.6],
        [45.4, 28.6],
        [46.73, 27.2],
        [46.73, 26.19],
      ],
      0.5,
    ),
    W(
      [
        [38, 25],
        [36, 26.5],
        [34, 28.5],
      ],
      0.5,
    ),
    W(
      [
        [49.27, 26.19],
        [49.27, 27.4],
        [47.6, 31],
        [42, 31],
        [38.4, 33.5],
        [36.5, 33.5],
      ],
      0.5,
    ),
    W(
      [
        [36.5, 33.5],
        [38.6, 35.6],
        [41, 38],
        [41, 40],
      ],
      0.5,
    ),
    // Pin 3 of JP1 (PISCA) and key 1 of SW1 (C3) to the timing capacitor.
    W(
      [
        [49.54, 47],
        [49.54, 44.4],
        [43.2, 44.4],
        [41, 42.2],
        [41, 40],
      ],
      0.5,
      'bottom',
    ),
    W(
      [
        [38.81, 46.73],
        [40.4, 45],
        [41, 42.2],
      ],
      0.5,
      'bottom',
    ),
    W(
      [
        [31.25, 40],
        [31.25, 46.73],
        [31.19, 46.73],
      ],
      0.5,
    ),
    // Trigger: pin 2 to the middle pin of JP1.
    W(
      [
        [46.73, 33.81],
        [47, 35.4],
        [47, 47],
      ],
      0.5,
    ),
    // Control (C4) and reset (to 12 V, through the bottom).
    W(
      [
        [51.81, 26.19],
        [53.6, 25.27],
        [55, 25.27],
      ],
      0.5,
    ),
    W(
      [
        [51.81, 33.81],
        [53.2, 32.4],
        [53.2, 19],
      ],
      0.5,
      'bottom',
    ),
    // Output: pin 3 to R4, and through key 2 of SW1 to the buzzer.
    W(
      [
        [49.27, 33.81],
        [49.27, 36],
        [58.4, 36],
        [60.6, 33.8],
        [60.6, 25.4],
        [61.92, 24],
      ],
      0.5,
    ),
    W(
      [
        [49.27, 33.81],
        [51.2, 35.8],
        [51.2, 50.4],
        [40.2, 50.4],
        [38.81, 49.27],
      ],
      0.5,
      'bottom',
    ),
    W(
      [
        [31.19, 49.27],
        [25.8, 48.6],
      ],
      0.5,
    ),
    // Relay: 12 V to the coil and D2, Q1 on the other end of the coil.
    W(
      [
        [53.2, 19],
        [53.2, 10],
        [56, 7],
        [59, 7],
      ],
      0.8,
    ),
    W(
      [
        [59, 14.19],
        [59, 7],
        [62, 5],
        [68, 5],
      ],
      0.8,
    ),
    W(
      [
        [59, 21.81],
        [64.46, 21.81],
      ],
      0.8,
    ),
    W(
      [
        [64.46, 31],
        [64.46, 20.4],
        [68, 17],
      ],
      0.8,
    ),
    W(
      [
        [72.08, 24],
        [72.08, 27],
        [67, 29.4],
        [67, 31],
      ],
      0.5,
    ),
    // LD2 and R5, across the coil.
    W(
      [
        [81.08, 47],
        [81.08, 43.2],
        [77.27, 40],
      ],
      0.5,
    ),
    W(
      [
        [74.73, 40],
        [70.6, 36.4],
        [66.2, 36.4],
        [64.46, 34.4],
        [64.46, 31],
      ],
      0.5,
    ),
    W(
      [
        [53.2, 19],
        [56.6, 22.4],
        [56.6, 38],
        [62.4, 43.8],
        [68.6, 43.8],
        [70.92, 47],
      ],
      0.5,
      'bottom',
    ),
    // Relay contacts to J2: NA and C on top, NF on the bottom.
    ...na,
    W(
      [
        [65.6, 11],
        [70, 13.4],
        [76.6, 20],
        [78.4, 28],
        [83.95, 30],
      ],
      2,
    ),
    W(
      [
        [80.8, 17],
        [81.2, 18.4],
        [81.2, 33.6],
        [83.95, 35.08],
      ],
      2,
      'bottom',
    ),
  ];
}

const VIAS: PcbVia[] = [{ at: [53.2, 19] }];

function silk(): PcbSilk[] {
  const text = (
    at: Point,
    value: string,
    size = 1.1,
    extra: Partial<Extract<PcbSilk, { kind: 'text' }>> = {},
  ): PcbSilk => ({ kind: 'text', at, text: value, size, ...extra });
  return [
    text([61.5, 50.6], 'TEMPORIZADOR 12 V', 1.7),
    text([61.5, 53], 'PLACA DE ESTUDO', 1),
    // Reference designators.
    text([6.6, 8.2], 'J1', 1.2),
    text([24, 2.4], 'F1  1 A', 1.2),
    text([24, 17.2], 'D1', 1.2),
    text([47.8, 7.4], 'C1', 1.2),
    text([11.2, 22.6], 'LD1'),
    text([14, 33.2], 'R1'),
    text([4.5, 26.2], 'CN1'),
    text([16, 38.8], 'R2'),
    text([10, 39.4], 'S1', 1.2),
    text([10, 49.4], 'DISPARO', 1),
    text([29, 24.6], 'R3'),
    text([34, 36], 'RV1'),
    text([30.2, 31], 'TEMPO', 1, { align: 'right' }),
    text([43.4, 42.6], 'C2'),
    text([25, 38], 'C3'),
    text([35, 44.6], 'SW1: 1 LONGO  2 BIP', 0.85),
    text([22, 41.4], 'BZ1'),
    text([48, 24.4], 'U1', 1.2),
    text([57.6, 24], 'C4'),
    text([47, 51.2], 'JP1'),
    text([43, 47], 'MONO', 0.85, { align: 'right' }),
    text([51, 47], 'PISCA', 0.85, { align: 'left' }),
    text([61.6, 18], 'D2', 1, { rotation: 90 }),
    text([67, 21.6], 'R4'),
    text([71.4, 31], 'Q1'),
    text([73, 1.8], 'K1  12 V', 1.2),
    text([76, 43.4], 'LD2'),
    text([76, 50.4], 'R5'),
    text([88, 20.2], 'J2', 1.2),
    // Polarity marks.
    text([47.2, 12], '+', 1.4),
    text([43.6, 39.4], '+', 1.1),
    text([34.4, 40], '+', 1.1),
    text([16.6, 26.8], '+', 1),
    text([78.6, 38.4], '+', 1),
    text([28.8, 47.4], '+', 1),
    text([7.8, 29.46], '+', 1.1, { align: 'left' }),
    text([7.8, 32], 'DISP', 0.85, { align: 'left' }),
    text([7.8, 34.54], '−', 1.1, { align: 'left' }),
    // Footprint outlines and the notch of U1.
    { kind: 'rect', at: [73, 11], size: [19.6, 16.1], width: 0.2 },
    { kind: 'rect', at: [48, 30], size: [11.4, 8.8], width: 0.2 },
    { kind: 'circle', at: [42.6, 30], r: 0.9, width: 0.2 },
    { kind: 'circle', at: [41, 12], r: 5.4, width: 0.2 },
    { kind: 'circle', at: [40, 40], r: 2.9, width: 0.2 },
    { kind: 'circle', at: [30, 40], r: 3.55, width: 0.2 },
    { kind: 'circle', at: [22, 48.6], r: 6.3, width: 0.2 },
    { kind: 'rect', at: [34, 31], size: [7, 7], width: 0.2 },
    { kind: 'rect', at: [10, 44], size: [6.6, 6.6], width: 0.2 },
    { kind: 'rect', at: [47, 47], size: [8, 2.8], width: 0.2 },
    { kind: 'rect', at: [35, 48], size: [10.4, 6.6], width: 0.2 },
  ];
}

export interface TimerLayoutOptions {
  /** The NA trace of J2 cracked through (defect "trilha rompida"). */
  brokenTrace?: boolean;
  /** The C pad of J2 left without its proper fillet (the cold joint is drawn by the part). */
  coldJoint?: boolean;
}

/** The board layout, for `<PrintedCircuitBoard>` and the lessons' 2D drawings. */
export function timerBoardLayout({
  brokenTrace = false,
  coldJoint = false,
}: TimerLayoutOptions = {}): PcbLayout {
  const pads = TIMER_PARTS.flatMap(padsOf).map((pad) => ({
    ...pad,
    ...(GROUND_PADS.has(pad.id!) ? { net: 'GND' } : {}),
    ...(coldJoint && pad.id === COLD_JOINT_PAD ? { solder: false } : {}),
  }));
  return {
    ...TIMER_BOARD,
    corner: 2.5,
    copper: 'both',
    mask: 'azul',
    finish: 'hasl',
    pads,
    traces: traces(brokenTrace),
    vias: VIAS,
    holes: [
      { at: [3.5, 3.5], drill: 3.2 },
      { at: [86.5, 3.5], drill: 3.2 },
      { at: [3.5, 51.5], drill: 3.2 },
      { at: [86.5, 51.5], drill: 3.2 },
    ],
    pours: [
      {
        outline: [
          [1.2, 1.2],
          [88.8, 1.2],
          [88.8, 53.8],
          [1.2, 53.8],
        ],
        side: 'bottom',
        net: 'GND',
        clearance: 0.5,
      },
    ],
    silk: silk(),
  };
}

/** Pad position by id ("J2.2"). */
export function timerPad(id: string): Point | undefined {
  const [ref] = id.split('.');
  const part = timerPart(ref!);
  return part ? padsOf(part).find((p) => p.id === id)?.at : undefined;
}
