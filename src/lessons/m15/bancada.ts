/*
 * Lesson 15.2: a box of loose parts, some good and some bad, and the tests a
 * multimeter (and the eyes) can do on each one, always out of the circuit
 * and de-energized. Each part has its tests and, for each condition, what
 * the meter shows. Readings are typical of a 3½-digit meter: the display
 * uses a point, as the real ones do.
 */

export type MeterFn = 'ohm' | 'cont' | 'diode' | 'cap' | 'visual';

export interface Reading {
  /** What the display shows ('OL' above the range); empty for a visual test. */
  digits: string;
  unit: string;
  /** The continuity beeper sounds. */
  beep?: boolean;
  /** What happens or what is seen, in pt-BR. */
  note?: string;
}

export interface BenchTest {
  id: string;
  label: string;
  fn: MeterFn;
}

export interface Condition {
  id: string;
  good: boolean;
  /** Name of the condition, shown after the verdict. */
  name: string;
  readings: Record<string, Reading>;
  explain: string;
}

export interface BenchPart {
  id: string;
  name: string;
  tests: BenchTest[];
  conditions: Condition[];
}

export const FN_LABEL: Record<MeterFn, string> = {
  ohm: 'Ω',
  cont: 'Continuidade',
  diode: 'Diodo',
  cap: 'Capacitância',
  visual: 'Inspeção visual',
};

const OL = (unit: string, note?: string): Reading => ({ digits: 'OL', unit, note });

export const PARTS: BenchPart[] = [
  {
    id: 'fusivel',
    name: 'Fusível de vidro de 2 A',
    tests: [
      { id: 'olhar', label: 'Olhar o filamento contra a luz', fn: 'visual' },
      { id: 'cont', label: 'Continuidade entre as duas tampas', fn: 'cont' },
    ],
    conditions: [
      {
        id: 'bom',
        good: true,
        name: 'Bom',
        readings: {
          olhar: { digits: '', unit: '', note: 'Filamento inteiro, vidro limpo.' },
          cont: { digits: '0.3', unit: 'Ω', beep: true },
        },
        explain: 'Continuidade com bip e quase 0 Ω entre as tampas: o elo está inteiro.',
      },
      {
        id: 'aberto',
        good: false,
        name: 'Aberto (queimado)',
        readings: {
          olhar: {
            digits: '',
            unit: '',
            note: 'O filamento parece inteiro. Às vezes ele rompe dentro da tampa, onde não dá para ver.',
          },
          cont: OL('Ω', 'Sem bip.'),
        },
        explain:
          'OL entre as tampas: o elo rompeu, mesmo parecendo inteiro. Por isso o fusível se testa com o multímetro, e não só no olho.',
      },
    ],
  },
  {
    id: 'resistor',
    name: 'Resistor de 1 kΩ, 5 % (marrom, preto, vermelho, dourado)',
    tests: [
      { id: 'olhar', label: 'Olhar o corpo', fn: 'visual' },
      { id: 'ohm', label: 'Resistência entre os terminais (escala de 2 kΩ)', fn: 'ohm' },
    ],
    conditions: [
      {
        id: 'bom',
        good: true,
        name: 'Bom',
        readings: {
          olhar: { digits: '', unit: '', note: 'Corpo limpo, faixas nítidas.' },
          ohm: { digits: '0.987', unit: 'kΩ' },
        },
        explain:
          '987 Ω está dentro da tolerância de 5 % (de 950 Ω a 1.050 Ω): o resistor está bom.',
      },
      {
        id: 'aberto',
        good: false,
        name: 'Aberto (queimado)',
        readings: {
          olhar: { digits: '', unit: '', note: 'Corpo escurecido no meio, com uma rachadura.' },
          ohm: OL('kΩ'),
        },
        explain:
          'OL: o resistor abriu. Um resistor queimado é sintoma: alguma coisa fez passar por ele mais corrente que o normal.',
      },
      {
        id: 'alterado',
        good: false,
        name: 'Valor alterado',
        readings: {
          olhar: { digits: '', unit: '', note: 'Aparência normal, talvez um pouco mais escuro.' },
          ohm: { digits: '1.462', unit: 'kΩ' },
        },
        explain:
          '1.462 Ω está muito acima da faixa de 950 Ω a 1.050 Ω. O resistor esquentou demais por muito tempo e mudou de valor: troque.',
      },
    ],
  },
  {
    id: 'capacitor',
    name: 'Capacitor eletrolítico de 470 µF, 25 V',
    tests: [
      { id: 'olhar', label: 'Olhar o topo e a base', fn: 'visual' },
      {
        id: 'ohm',
        label: 'Resistência, já descarregado (escala de 20 kΩ)',
        fn: 'ohm',
      },
      { id: 'cap', label: 'Capacitância (capacitímetro ou escala de µF)', fn: 'cap' },
    ],
    conditions: [
      {
        id: 'bom',
        good: true,
        name: 'Bom',
        readings: {
          olhar: { digits: '', unit: '', note: 'Topo reto, sem vazamento.' },
          ohm: OL(
            'kΩ',
            'A leitura começa baixa e sobe sozinha até OL: o multímetro está carregando o capacitor.',
          ),
          cap: { digits: '452', unit: 'µF' },
        },
        explain:
          'A resistência que sobe até OL mostra que ele carrega e não tem fuga; 452 µF está dentro da tolerância de 20 % de um eletrolítico.',
      },
      {
        id: 'seco',
        good: false,
        name: 'Seco (perdeu capacitância)',
        readings: {
          olhar: { digits: '', unit: '', note: 'Topo reto. Aparência normal.' },
          ohm: OL('kΩ', 'A leitura sobe até OL bem mais depressa do que num capacitor bom.'),
          cap: { digits: '88', unit: 'µF' },
        },
        explain:
          'Só 88 µF de 470 µF: o eletrólito secou com o calor e a idade. Na fonte, isso aparece como ondulação e falhas. Por fora ele parece perfeito.',
      },
      {
        id: 'curto',
        good: false,
        name: 'Em curto',
        readings: {
          olhar: { digits: '', unit: '', note: 'Topo levemente abaulado.' },
          ohm: { digits: '0.00', unit: 'kΩ', note: 'A leitura não sobe: fica em zero.' },
          cap: { digits: '', unit: '', note: 'O capacitímetro não consegue medir: indica curto.' },
        },
        explain:
          'Resistência zero entre os terminais: o dielétrico furou e o capacitor virou um fio. Num circuito, ele queima o fusível.',
      },
      {
        id: 'estufado',
        good: false,
        name: 'Estufado',
        readings: {
          olhar: {
            digits: '',
            unit: '',
            note: 'Topo abaulado, com a cruz de alívio aberta e um resíduo marrom.',
          },
          ohm: OL('kΩ', 'A leitura sobe até OL depressa.'),
          cap: { digits: '196', unit: 'µF' },
        },
        explain:
          'O topo estufou: a pressão de dentro abriu o alívio. Capacitor estufado se troca sem nem medir. Os 196 µF só confirmam.',
      },
    ],
  },
  {
    id: 'diodo',
    name: 'Diodo retificador 1N4007',
    tests: [
      { id: 'direto', label: 'Teste de diodo, vermelha no ânodo, preta na faixa', fn: 'diode' },
      { id: 'reverso', label: 'Teste de diodo, vermelha na faixa, preta no ânodo', fn: 'diode' },
    ],
    conditions: [
      {
        id: 'bom',
        good: true,
        name: 'Bom',
        readings: {
          direto: { digits: '0.562', unit: 'V' },
          reverso: OL('V'),
        },
        explain:
          'Cerca de 0,56 V num sentido e OL no outro: o diodo conduz só para um lado, como deve.',
      },
      {
        id: 'curto',
        good: false,
        name: 'Em curto',
        readings: {
          direto: { digits: '0.003', unit: 'V', beep: true },
          reverso: { digits: '0.003', unit: 'V', beep: true },
        },
        explain:
          'Quase zero nos dois sentidos, com bip: a junção derreteu e o diodo virou um fio. É o defeito mais comum de um retificador.',
      },
      {
        id: 'aberto',
        good: false,
        name: 'Aberto',
        readings: {
          direto: OL('V'),
          reverso: OL('V'),
        },
        explain: 'OL nos dois sentidos: o diodo não conduz para lado nenhum.',
      },
    ],
  },
  {
    id: 'transistor',
    name: 'Transistor NPN BC548 (pinos E, B, C)',
    tests: [
      { id: 'be', label: 'Diodo: vermelha na base, preta no emissor', fn: 'diode' },
      { id: 'bc', label: 'Diodo: vermelha na base, preta no coletor', fn: 'diode' },
      { id: 'eb', label: 'Diodo: vermelha no emissor, preta na base', fn: 'diode' },
      { id: 'cb', label: 'Diodo: vermelha no coletor, preta na base', fn: 'diode' },
      { id: 'ce', label: 'Diodo: vermelha no coletor, preta no emissor', fn: 'diode' },
    ],
    conditions: [
      {
        id: 'bom',
        good: true,
        name: 'Bom',
        readings: {
          be: { digits: '0.684', unit: 'V' },
          bc: { digits: '0.672', unit: 'V' },
          eb: OL('V'),
          cb: OL('V'),
          ce: OL('V'),
        },
        explain:
          'Um NPN se comporta como dois diodos com os ânodos na base: conduz de B para E e de B para C, e nada nos outros sentidos nem entre C e E.',
      },
      {
        id: 'curto-ce',
        good: false,
        name: 'Em curto entre coletor e emissor',
        readings: {
          be: { digits: '0.001', unit: 'V', beep: true },
          bc: { digits: '0.001', unit: 'V', beep: true },
          eb: { digits: '0.001', unit: 'V', beep: true },
          cb: { digits: '0.001', unit: 'V', beep: true },
          ce: { digits: '0.000', unit: 'V', beep: true },
        },
        explain:
          'Zero entre coletor e emissor: o transistor está em curto, como uma chave sempre fechada. Num circuito de relé, o relé fica ligado o tempo todo.',
      },
      {
        id: 'aberto-be',
        good: false,
        name: 'Junção base-emissor aberta',
        readings: {
          be: OL('V'),
          bc: { digits: '0.671', unit: 'V' },
          eb: OL('V'),
          cb: OL('V'),
          ce: OL('V'),
        },
        explain:
          'A base conduz para o coletor (0,67 V), mas não para o emissor: a junção base-emissor abriu, e o transistor não liga mais.',
      },
    ],
  },
  {
    id: 'rele',
    name: 'Relé de 12 V (bobina A1 e A2; contatos COM, NF e NA)',
    tests: [
      { id: 'bobina', label: 'Resistência da bobina, A1–A2 (escala de 2 kΩ)', fn: 'ohm' },
      { id: 'nf', label: 'Continuidade COM–NF, em repouso', fn: 'cont' },
      { id: 'na', label: 'Continuidade COM–NA, em repouso', fn: 'cont' },
      {
        id: 'na-ligado',
        label: 'Continuidade COM–NA, com 12 V da fonte de bancada na bobina',
        fn: 'cont',
      },
    ],
    conditions: [
      {
        id: 'bom',
        good: true,
        name: 'Bom',
        readings: {
          bobina: { digits: '0.398', unit: 'kΩ' },
          nf: { digits: '0.2', unit: 'Ω', beep: true },
          na: OL('Ω'),
          'na-ligado': { digits: '0.2', unit: 'Ω', beep: true, note: 'O relé dá um clique.' },
        },
        explain:
          'Bobina com cerca de 400 Ω, NF fechado em repouso e NA fechando com a bobina ligada: tudo como deve.',
      },
      {
        id: 'bobina-aberta',
        good: false,
        name: 'Bobina aberta',
        readings: {
          bobina: OL('kΩ'),
          nf: { digits: '0.2', unit: 'Ω', beep: true },
          na: OL('Ω'),
          'na-ligado': OL('Ω', 'Nenhum clique.'),
        },
        explain:
          'OL na bobina: o fio de cobre fino rompeu (ou o terminal soltou). O relé não arma, e os contatos ficam sempre em repouso.',
      },
      {
        id: 'contato-gasto',
        good: false,
        name: 'Contato NA carbonizado',
        readings: {
          bobina: { digits: '0.401', unit: 'kΩ' },
          nf: { digits: '0.3', unit: 'Ω', beep: true },
          na: OL('Ω'),
          'na-ligado': {
            digits: '38.6',
            unit: 'Ω',
            note: 'O relé dá um clique, mas o multímetro não apita.',
          },
        },
        explain:
          'A bobina e o clique estão normais, mas o contato NA fechado tem 38,6 Ω em vez de quase zero: a superfície carbonizou de tanto faiscar. Com carga, ele esquenta e falha.',
      },
    ],
  },
  {
    id: 'motor',
    name: 'Motor CC de 12 V com escovas',
    tests: [
      { id: 'ohm', label: 'Resistência entre os terminais (escala de 200 Ω)', fn: 'ohm' },
      {
        id: 'girar',
        label: 'Resistência girando o eixo devagar com a mão',
        fn: 'ohm',
      },
    ],
    conditions: [
      {
        id: 'bom',
        good: true,
        name: 'Bom',
        readings: {
          ohm: { digits: '3.2', unit: 'Ω' },
          girar: { digits: '3.4', unit: 'Ω', note: 'A leitura varia pouco, entre 2,9 Ω e 3,6 Ω.' },
        },
        explain:
          'Alguns ohms, estáveis ao girar: o enrolamento e as escovas estão bons. A leitura varia um pouco porque as escovas passam de uma lâmina do comutador para a outra.',
      },
      {
        id: 'escova',
        good: false,
        name: 'Escova gasta',
        readings: {
          ohm: OL('Ω'),
          girar: {
            digits: '3.3',
            unit: 'Ω',
            note: 'A leitura pula entre OL e uns 3 Ω conforme a posição do eixo.',
          },
        },
        explain:
          'A leitura some em algumas posições: uma escova gasta (ou uma lâmina do comutador queimada) perde o contato. É o motor que "às vezes não parte" e volta a funcionar com uma batidinha.',
      },
      {
        id: 'curto',
        good: false,
        name: 'Enrolamento em curto',
        readings: {
          ohm: { digits: '0.4', unit: 'Ω' },
          girar: { digits: '0.4', unit: 'Ω', note: 'A leitura quase não muda.' },
        },
        explain:
          'Só 0,4 Ω, bem abaixo dos 3 Ω normais: o verniz das espiras derreteu e parte do enrolamento está em curto. O motor puxa corrente demais e esquenta.',
      },
    ],
  },
];

export const partById = (id: string): BenchPart => PARTS.find((p) => p.id === id) ?? PARTS[0]!;

/** The condition of each part in the box for a given seed (about half are good). */
export function conditionFor(part: BenchPart, seed: number): Condition {
  const k = PARTS.indexOf(part) + 1;
  const x = Math.abs(Math.sin((seed * 31 + k) * 12.9898) * 43758.5453) % 1;
  if (x < 0.4) return part.conditions[0]!;
  const bad = part.conditions.slice(1);
  return bad[Math.floor(((x - 0.4) / 0.6) * bad.length)]!;
}

/** The display text as read aloud and in the log: comma, unit, OL. */
export function spoken(r: Reading): string {
  if (!r.digits) return r.note ?? '';
  if (r.digits === 'OL') return 'OL';
  return `${r.digits.replace('.', ',')} ${r.unit}`;
}
