/*
 * Module 14: schematic symbols of the parts of the timer board, drawn in a
 * 64 × 40 box with `currentColor`, plus what each designator letter means.
 * Used by the symbol table (figure of lesson 14.1) and by the widgets that
 * pair the schematic with the board.
 */
import type { TimerPartKind } from '../../three/parts/_timer-board-layout';

export interface SymbolInfo {
  /** Designator letters used on boards and in schematics. */
  letters: string;
  /** Name of the part (pt-BR). */
  name: string;
  /** How to recognise the symbol (pt-BR). */
  hint: string;
}

export const SYMBOL_INFO: Record<TimerPartKind, SymbolInfo> = {
  resistor: {
    letters: 'R',
    name: 'Resistor',
    hint: 'Retângulo (norma IEC) ou zigue-zague (norma americana) entre dois fios',
  },
  trimpot: {
    letters: 'RV, VR ou TR',
    name: 'Trimpot (resistor ajustável)',
    hint: 'Resistor com uma seta apontando para ele: o cursor',
  },
  eletrolitico: {
    letters: 'C',
    name: 'Capacitor eletrolítico',
    hint: 'Duas placas, uma reta e outra curva ou cheia, com o sinal + no lado positivo',
  },
  ceramico: {
    letters: 'C',
    name: 'Capacitor cerâmico',
    hint: 'Duas placas paralelas iguais, sem polaridade',
  },
  diodo: {
    letters: 'D',
    name: 'Diodo',
    hint: 'Triângulo apontando para uma barra: a barra é o catodo, a faixa do corpo',
  },
  led: {
    letters: 'LED, LD ou DL',
    name: 'LED',
    hint: 'O símbolo do diodo com duas setas saindo: a luz',
  },
  transistor: {
    letters: 'Q ou T',
    name: 'Transistor',
    hint: 'Círculo com base, coletor e emissor; a seta no emissor diz se é NPN (saindo) ou PNP',
  },
  ci: {
    letters: 'U ou CI (IC)',
    name: 'Circuito integrado',
    hint: 'Retângulo com os pinos numerados, às vezes com o nome das funções',
  },
  rele: {
    letters: 'K ou RL',
    name: 'Relé',
    hint: 'Bobina (retângulo) e o contato que ela move, ligados por uma linha tracejada',
  },
  borne: {
    letters: 'J, X ou CN',
    name: 'Borne ou conector',
    hint: 'Círculos ou quadradinhos na borda do desenho, um por via',
  },
  conector: {
    letters: 'J, CN ou P',
    name: 'Conector de pinos',
    hint: 'Fileira de pinos numerados; muitas vezes com o nome de cada sinal',
  },
  fusivel: {
    letters: 'F',
    name: 'Fusível',
    hint: 'Retângulo atravessado por uma linha (IEC) ou uma onda dentro de um retângulo',
  },
  botao: {
    letters: 'S, SW ou B',
    name: 'Botão (push-button)',
    hint: 'Contato aberto com um "T" em cima: o botão que empurra',
  },
  dip: {
    letters: 'SW ou S',
    name: 'Chave DIP',
    hint: 'Várias chaves pequenas lado a lado, numeradas, dentro de um retângulo',
  },
  jumper: {
    letters: 'JP ou J',
    name: 'Jumper',
    hint: 'Pinos numerados com a ligação entre dois deles desenhada',
  },
  buzzer: {
    letters: 'BZ ou BUZ',
    name: 'Buzzer',
    hint: 'Meia-lua ou um pequeno alto-falante com + no terminal positivo',
  },
};

const lead = (x1: number, x2: number) => <line x1={x1} y1={20} x2={x2} y2={20} />;

/** The symbol of one kind of part, in a 64 × 40 user-unit box. */
export function SymbolGlyph({ kind }: { kind: TimerPartKind }) {
  switch (kind) {
    case 'resistor':
      return (
        <g>
          {lead(4, 18)}
          <rect x={18} y={14} width={28} height={12} rx={1} />
          {lead(46, 60)}
        </g>
      );
    case 'trimpot':
      return (
        <g>
          {lead(4, 18)}
          <rect x={18} y={14} width={28} height={12} rx={1} />
          {lead(46, 60)}
          <line x1={32} y1={38} x2={32} y2={28} />
          <path d="M28 30 L32 26 L36 30" />
        </g>
      );
    case 'eletrolitico':
      return (
        <g>
          {lead(4, 29)}
          <line x1={29} y1={8} x2={29} y2={32} />
          <path d="M37 8 Q33 20 37 32" />
          {lead(35, 60)}
          <text x={21} y={11} className="sym__mark">
            +
          </text>
        </g>
      );
    case 'ceramico':
      return (
        <g>
          {lead(4, 29)}
          <line x1={29} y1={8} x2={29} y2={32} />
          <line x1={35} y1={8} x2={35} y2={32} />
          {lead(35, 60)}
        </g>
      );
    case 'diodo':
      return (
        <g>
          {lead(4, 24)}
          <path d="M24 9 L24 31 L40 20 Z" />
          <line x1={40} y1={9} x2={40} y2={31} />
          {lead(40, 60)}
        </g>
      );
    case 'led':
      return (
        <g>
          {lead(4, 24)}
          <path d="M24 9 L24 31 L40 20 Z" />
          <line x1={40} y1={9} x2={40} y2={31} />
          {lead(40, 60)}
          <path d="M33 8 L39 2 M36 2 L39 2 L39 5" />
          <path d="M39 11 L45 5 M42 5 L45 5 L45 8" />
        </g>
      );
    case 'transistor':
      return (
        <g>
          <circle cx={36} cy={20} r={14} />
          {lead(4, 30)}
          <line x1={30} y1={11} x2={30} y2={29} />
          <path d="M30 15 L42 8 L42 0" />
          <path d="M30 25 L42 32 L42 40" />
          <path d="M36 31.5 L42 32 L39.5 26.5" />
        </g>
      );
    case 'ci':
      return (
        <g>
          <rect x={18} y={5} width={28} height={30} rx={1} />
          {[11, 20, 29].map((y) => (
            <g key={y}>
              <line x1={8} y1={y} x2={18} y2={y} />
              <line x1={46} y1={y} x2={56} y2={y} />
            </g>
          ))}
          <path d="M28 5 A4 4 0 0 0 36 5" />
        </g>
      );
    case 'rele':
      return (
        <g>
          <rect x={6} y={13} width={14} height={14} />
          <line x1={13} y1={4} x2={13} y2={13} />
          <line x1={13} y1={27} x2={13} y2={36} />
          <line x1={20} y1={20} x2={36} y2={20} strokeDasharray="3 2.5" />
          <line x1={40} y1={34} x2={40} y2={28} />
          <line x1={40} y1={28} x2={50} y2={12} />
          <line x1={54} y1={14} x2={54} y2={4} />
          <line x1={50} y1={14} x2={56} y2={14} />
        </g>
      );
    case 'borne':
      return (
        <g>
          {[12, 28].map((y) => (
            <g key={y}>
              <circle cx={20} cy={y} r={4} />
              <line x1={24} y1={y} x2={56} y2={y} />
            </g>
          ))}
        </g>
      );
    case 'conector':
      return (
        <g>
          <rect x={14} y={4} width={12} height={32} rx={1} />
          {[10, 20, 30].map((y) => (
            <g key={y}>
              <circle cx={20} cy={y} r={2} />
              <line x1={26} y1={y} x2={56} y2={y} />
            </g>
          ))}
        </g>
      );
    case 'fusivel':
      return (
        <g>
          {lead(4, 18)}
          <rect x={18} y={14} width={28} height={12} rx={1} />
          <line x1={18} y1={20} x2={46} y2={20} />
          {lead(46, 60)}
        </g>
      );
    case 'botao':
      return (
        <g>
          {lead(4, 20)}
          <circle cx={21} cy={20} r={1.6} />
          <circle cx={43} cy={20} r={1.6} />
          <line x1={18} y1={13} x2={46} y2={13} />
          <line x1={32} y1={13} x2={32} y2={4} />
          <line x1={26} y1={4} x2={38} y2={4} />
          {lead(44, 60)}
        </g>
      );
    case 'dip':
      return (
        <g>
          <rect x={14} y={4} width={36} height={32} rx={1} />
          {[13, 27].map((y) => (
            <g key={y}>
              <line x1={4} y1={y} x2={20} y2={y} />
              <line x1={20} y1={y} x2={33} y2={y - 6} />
              <line x1={36} y1={y} x2={60} y2={y} />
            </g>
          ))}
        </g>
      );
    case 'jumper':
      return (
        <g>
          {[16, 32, 48].map((x) => (
            <g key={x}>
              <circle cx={x} cy={24} r={3} />
              <line x1={x} y1={27} x2={x} y2={38} />
            </g>
          ))}
          <path d="M14 18 L14 12 L34 12 L34 18" />
        </g>
      );
    case 'buzzer':
      return (
        <g>
          <line x1={20} y1={36} x2={20} y2={26} />
          <line x1={44} y1={36} x2={44} y2={26} />
          <path d="M14 26 L50 26 A18 18 0 0 0 14 26 Z" />
          <text x={8} y={36} className="sym__mark">
            +
          </text>
        </g>
      );
  }
}

/** One symbol as a standalone, accessible SVG. */
export function PartSymbol({ kind, size = 64 }: { kind: TimerPartKind; size?: number }) {
  const info = SYMBOL_INFO[kind];
  return (
    <svg
      className="sym"
      viewBox="0 0 64 40"
      width={size}
      height={(size * 40) / 64}
      role="img"
      aria-label={`Símbolo de ${info.name.toLowerCase()}`}
    >
      <SymbolGlyph kind={kind} />
    </svg>
  );
}
