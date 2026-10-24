/*
 * Lesson 14.3: rounds of the "what is it?" game on the timer board. Each
 * round highlights one part and offers four kinds of component; the right
 * one and three distractors that look alike or sit nearby.
 */
import { TIMER_PARTS, type TimerPartKind } from '../../three/parts/_timer-board-layout';
import { SYMBOL_INFO } from './simbolos';

export interface Round {
  ref: string;
  answer: TimerPartKind;
  options: TimerPartKind[];
  /** What gives the part away (pt-BR), shown after the answer. */
  clue: string;
}

/** Look-alikes that make good distractors for each kind. */
const CONFUSED: Record<TimerPartKind, TimerPartKind[]> = {
  resistor: ['diodo', 'ceramico', 'fusivel'],
  diodo: ['resistor', 'led', 'fusivel'],
  eletrolitico: ['buzzer', 'ceramico', 'trimpot'],
  ceramico: ['eletrolitico', 'led', 'resistor'],
  led: ['diodo', 'ceramico', 'transistor'],
  transistor: ['led', 'ci', 'trimpot'],
  ci: ['dip', 'conector', 'rele'],
  rele: ['ci', 'borne', 'buzzer'],
  borne: ['conector', 'rele', 'jumper'],
  conector: ['borne', 'jumper', 'dip'],
  fusivel: ['resistor', 'diodo', 'borne'],
  botao: ['dip', 'trimpot', 'rele'],
  dip: ['jumper', 'ci', 'botao'],
  jumper: ['conector', 'dip', 'borne'],
  trimpot: ['botao', 'eletrolitico', 'transistor'],
  buzzer: ['eletrolitico', 'rele', 'botao'],
};

export const CLUES: Record<TimerPartKind, string> = {
  resistor:
    'corpo cilíndrico pequeno com faixas coloridas, duas pernas: o código de cores dá o valor',
  diodo: 'corpo preto ou vidro com uma faixa numa ponta: a faixa marca o catodo',
  eletrolitico:
    'cilindro alto com uma faixa clara de "−" de um lado e um X no topo, a válvula de alívio',
  ceramico: 'pastilha pequena e redonda, laranja ou azul, com um código de três números',
  led: 'cúpula transparente ou colorida; a perna maior é o anodo e o lado chanfrado é o catodo',
  transistor: 'corpo preto em forma de D (TO-92) com três pernas e o código impresso na face plana',
  ci: 'corpo preto retangular com duas fileiras de pinos e uma marca do pino 1',
  rele: 'caixa plástica grande com a tensão da bobina e os valores dos contatos impressos',
  borne: 'bloco plástico com parafusos no alto e entradas laterais para o fio',
  conector: 'pinos dentro de uma moldura plástica com trava: encaixa um plugue',
  fusivel: 'tubinho de vidro com tampas metálicas e um fio fino dentro, preso em clipes',
  botao: 'quadradinho com um pino no meio que afunda, quatro pernas',
  dip: 'caixinha com alavancas numeradas e a palavra ON',
  jumper: 'barra de pinos com uma capinha plástica ligando dois deles',
  trimpot: 'peça pequena com uma fenda de chave no meio para ajustar com a chave',
  buzzer: 'cilindro preto baixo com um furo no meio e um "+" ao lado',
};

/** Deterministic shuffle (so the server and the browser agree). */
function shuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** The rounds of one game: `count` parts of different kinds, in a shuffled order. */
export function makeRounds(seed: number, count = 8): Round[] {
  const seen = new Set<TimerPartKind>();
  const picks = shuffle(TIMER_PARTS, seed).filter((p) => {
    if (seen.has(p.kind)) return false;
    seen.add(p.kind);
    return true;
  });
  return picks.slice(0, count).map((p, i) => ({
    ref: p.ref,
    answer: p.kind,
    options: shuffle([p.kind, ...CONFUSED[p.kind]], seed + i * 7 + 3),
    clue: CLUES[p.kind],
  }));
}

export const kindName = (kind: TimerPartKind) => SYMBOL_INFO[kind].name;
