/**
 * The course's 12 V relay timer board (módulo temporizador), used in module
 * 14 to read a real board and in module 15 to hunt for defects: 90 × 55 mm
 * double-sided FR-4 with a blue mask, a 555 in a socket with the TEMPO
 * trimpot, the MODO jumper and a 2-way DIP switch, a BC337 driving a 12 V
 * relay with its 1N4148, the fuse and the reverse-polarity 1N4007 at the
 * input, two LEDs, a buzzer and terminal blocks. Layout and the list of
 * parts in `_timer-board-layout.ts`; circuit in
 * `src/lessons/m14/temporizador-jumper.circuit.ts`.
 *
 * Like the gate board, the kit's real parts are baked into a few merged
 * meshes (`_gate-batch.tsx`), and `highlight` keeps one part in colour.
 * `defect` adds the faults of lesson 15.3: a bulged capacitor, a burnt
 * resistor, a blown fuse, a cold solder joint and a cracked trace.
 */
import { DoubleSide } from 'three';
import { formatNumber } from '../core/format';
import { Anchor } from '../core/view';
import { GlowSprite } from '../fx/glow';
import { Material } from '../materials/Material';
import { getNoiseTexture } from '../materials/textures';
import { PrintedCircuitBoard } from '../pcb/PrintedCircuitBoard';
import { boardPoint, type Point } from '../pcb/layout';
import type { PartAnnotation, PartMeta, PartProps, Vec3 } from '../types';
import { BakeBlock, BakeLayer, BakePart, BatchRoot } from './_gate-batch';
import {
  BREAK_AT,
  CAP_SIZES,
  COLD_JOINT_PAD,
  J1_LABELS,
  J2_LABELS,
  TIMER_BOARD,
  TIMER_PARTS,
  TIMER_REFS,
  timerBoardLayout,
  timerPad,
  timerPart,
} from './_timer-board-layout';
import Buzzer from './buzzer';
import CeramicCapacitor from './ceramic-capacitor';
import ConnectorKk from './connector-kk';
import Diode from './diode';
import DipSwitch from './dip-switch';
import ElectrolyticCapacitor from './electrolytic-capacitor';
import FuseGlass from './fuse-glass';
import IcDip from './ic-dip';
import Led, { LED_COLORS } from './led';
import PinHeader from './pin-header';
import Relay from './relay';
import Resistor from './resistor';
import ScrewTerminal from './screw-terminal';
import TactileButton from './tactile-button';
import TransistorTo92 from './transistor-to92';
import Trimpot from './trimpot';

export type TimerMode = 'mono' | 'pisca' | 'sem-jumper';
export type TimerDefect =
  | 'nenhum'
  | 'capacitor-estufado'
  | 'resistor-queimado'
  | 'fusivel-queimado'
  | 'solda-fria'
  | 'trilha-rompida'
  | 'todos';

export interface RelayTimerBoardProps {
  /** Reference designator kept in colour ("K1"), or 'nenhum'. */
  highlight?: string;
  /** Jumper JP1: pins 1–2 (MONO), 2–3 (PISCA) or removed. */
  mode?: TimerMode;
  /** DIP SW1 key 1 (LONGO) and key 2 (BIP). */
  longo?: boolean;
  bip?: boolean;
  /** Trimpot TEMPO, 0 to 1. */
  time?: number;
  /** Board powered (LD1 lit). */
  powered?: boolean;
  /** Relay coil energized (LD2 lit). */
  relayOn?: boolean;
  /** DISPARO pressed. */
  pressed?: boolean;
  defect?: TimerDefect;
  /** Turned over: the solder side up. */
  flip?: boolean;
  /** Annotations with the name of each part (off for the "what is this?" game). */
  labels?: boolean;
}

const MODE_LABELS: Record<TimerMode, string> = {
  mono: 'MONO (pinos 1 e 2)',
  pisca: 'PISCA (pinos 2 e 3)',
  'sem-jumper': 'Sem jumper',
};

const DEFECT_LABELS: Record<TimerDefect, string> = {
  nenhum: 'Nenhum',
  'capacitor-estufado': 'Capacitor C1 estufado',
  'resistor-queimado': 'Resistor R4 queimado',
  'fusivel-queimado': 'Fusível F1 queimado',
  'solda-fria': 'Solda fria no borne J2',
  'trilha-rompida': 'Trilha do NA rompida',
  todos: 'Todos os defeitos juntos',
};

const DEFECTS = Object.keys(DEFECT_LABELS) as TimerDefect[];

/** Parts shown with annotations when nothing is highlighted. */
const MAIN_PARTS = ['J1', 'F1', 'D1', 'C1', 'U1', 'RV1', 'JP1', 'SW1', 'S1', 'Q1', 'K1', 'J2'];

const { width: W, height: H, thickness: T } = TIMER_BOARD;

const resolve = (props: PartProps) =>
  ({ ...meta.defaults, ...props }) as Required<RelayTimerBoardProps>;

function has(defect: TimerDefect, which: TimerDefect): boolean {
  return defect === which || (defect === 'todos' && which !== 'nenhum');
}

function defectOf(value: unknown): TimerDefect {
  return DEFECTS.includes(value as TimerDefect) ? (value as TimerDefect) : 'nenhum';
}

function modeOf(value: unknown): TimerMode {
  return value === 'pisca' || value === 'sem-jumper' ? value : 'mono';
}

function focusOf(value: unknown): string {
  return typeof value === 'string' && TIMER_REFS.includes(value) ? value : 'nenhum';
}

/** Layout point → part space on the top surface (+ height). */
const on = ([x, y]: Point, up = 0): Vec3 => {
  const [px, py, pz] = boardPoint(TIMER_BOARD, [x, y]);
  return [px, py + up, pz];
};

/** Exploded view: parts lift off the board in three tiers. */
const LIFT_LOW: Vec3 = [0, 40, -20];
const LIFT_MID: Vec3 = [0, 54, -27];
const LIFT_TALL: Vec3 = [0, 68, -34];

/** Cut through the relay and the 555: removes the front of the board. */
const CUT_Z = 11 - H / 2;

/** Defect annotations (part space), shown with the others. */
function defectNotes(defect: TimerDefect): PartAnnotation[] {
  const out: PartAnnotation[] = [];
  if (has(defect, 'capacitor-estufado'))
    out.push({
      at: [0, 0, 0],
      anchor: 'tb-C1',
      text: 'C1 estufado: o topo abaulou. Troque por outro igual (mesma capacitância e tensão)',
    });
  if (has(defect, 'resistor-queimado'))
    out.push({
      at: [0, 0, 0],
      anchor: 'tb-R4',
      text: 'R4 queimado: corpo escurecido e rachado. Algo puxou corrente demais por ele',
    });
  if (has(defect, 'fusivel-queimado'))
    out.push({
      at: [0, 0, 0],
      anchor: 'tb-F1',
      text: 'F1 queimado: o filamento rompeu. Ache o curto antes de trocar',
    });
  if (has(defect, 'solda-fria')) {
    const [x, , z] = on(timerPad(COLD_JOINT_PAD)!);
    out.push({
      at: [x, -2.2, z],
      text: 'Solda fria no borne J2 (lado da solda): bolota fosca, com um anel em volta do terminal',
    });
  }
  if (has(defect, 'trilha-rompida')) {
    const [x, , z] = on(BREAK_AT);
    out.push({
      at: [x, T + 0.6, z],
      text: 'Trilha rompida: o cobre do NA do relé partiu e escureceu',
    });
  }
  return out;
}

export const meta: PartMeta = {
  id: 'relay-timer-board',
  label: 'Placa temporizadora com relé',
  category: 'placas',
  summary:
    'Placa de estudo de 12 V: CI 555 com trimpot de tempo, jumper de modo e chave DIP, transistor, relé com diodo de roda livre, fusível, LEDs, buzzer e bornes.',
  defaults: {
    highlight: 'nenhum',
    mode: 'mono',
    longo: false,
    bip: false,
    time: 0.3,
    powered: true,
    relayOn: false,
    pressed: false,
    defect: 'nenhum',
    flip: false,
    labels: true,
  },
  controls: {
    highlight: {
      kind: 'select',
      label: 'Destaque',
      options: [
        { value: 'nenhum', label: 'Nenhum' },
        ...TIMER_PARTS.map((p) => ({ value: p.ref, label: `${p.ref}: ${p.name}` })),
      ],
    },
    mode: {
      kind: 'select',
      label: 'Jumper JP1 (MODO)',
      options: (Object.keys(MODE_LABELS) as TimerMode[]).map((m) => ({
        value: m,
        label: MODE_LABELS[m],
      })),
    },
    longo: { kind: 'toggle', label: 'Chave DIP 1 (LONGO) ligada' },
    bip: { kind: 'toggle', label: 'Chave DIP 2 (BIP) ligada' },
    time: { kind: 'number', label: 'Trimpot TEMPO', min: 0, max: 1, step: 0.05 },
    powered: { kind: 'toggle', label: 'Placa alimentada' },
    relayOn: { kind: 'toggle', label: 'Relé ligado' },
    pressed: { kind: 'toggle', label: 'Botão DISPARO apertado' },
    defect: {
      kind: 'select',
      label: 'Defeito',
      options: DEFECTS.map((d) => ({ value: d, label: DEFECT_LABELS[d] })),
    },
    flip: { kind: 'toggle', label: 'Virada (lado da solda)' },
    labels: { kind: 'toggle', label: 'Anotações com o nome das peças' },
  },
  annotations: (props) => {
    const p = resolve(props);
    if (!p.labels) return [];
    const focus = focusOf(p.highlight);
    const refs = focus === 'nenhum' ? MAIN_PARTS : [focus];
    const notes: PartAnnotation[] = refs.map((ref) => {
      const part = timerPart(ref)!;
      return {
        at: [0, 0, 0],
        anchor: `tb-${ref}`,
        text: focus === 'nenhum' ? `${ref}: ${part.name}` : `${ref}: ${part.name}. ${part.role}`,
      };
    });
    const layers: PartAnnotation[] = [
      {
        at: [0, 0, 0],
        anchor: 'pcb-silk',
        text: 'Serigrafia: referências e funções',
        exploded: true,
      },
      { at: [0, 0, 0], anchor: 'pcb-copper', text: 'Cobre de cima: as trilhas', exploded: true },
      { at: [0, 0, 0], anchor: 'pcb-substrate', text: 'FR-4 de 1,6 mm', exploded: true },
    ];
    return [...notes, ...defectNotes(defectOf(p.defect)), ...(focus === 'nenhum' ? layers : [])];
  },
  explode: true,
  cutaway: true,
  cut: { normal: [0, 0, -1], through: [0, 0, CUT_Z] },
  describe: (props) => {
    const p = resolve(props);
    const focus = focusOf(p.highlight);
    const mode = modeOf(p.mode);
    const defect = defectOf(p.defect);
    const time = Math.min(Math.max(Number(p.time) || 0, 0), 1);
    const parts = [
      `Placa temporizadora de 12 V (${formatNumber(W)} × ${formatNumber(H)} mm)${p.flip ? ', virada com o lado da solda para cima' : ''}. À esquerda, o borne de entrada J1 (+12V e GND), o fusível F1, o diodo D1, o capacitor C1, o LED LD1, o conector CN1 e o botão DISPARO (S1). No meio, o 555 (U1) no soquete, o trimpot TEMPO (RV1), os capacitores de tempo C2 e C3, a chave DIP SW1, o jumper JP1 e o buzzer BZ1. À direita, o transistor Q1, o diodo D2, o relé K1, o LED LD2 e o borne de saída J2 (NA, C e NF).`,
      `Jumper JP1 ${mode === 'sem-jumper' ? 'retirado' : `em ${MODE_LABELS[mode]}`}; chave DIP 1 (LONGO) ${p.longo ? 'ligada' : 'desligada'}, chave 2 (BIP) ${p.bip ? 'ligada' : 'desligada'}; trimpot TEMPO em ${formatNumber(Math.round(time * 100))} % do curso.`,
    ];
    if (!p.powered) parts.push('Placa sem alimentação: LEDs apagados.');
    else parts.push(p.relayOn ? 'Relé ligado: LD2 aceso.' : 'Relé desligado: só o LD1 aceso.');
    if (defect !== 'nenhum') parts.push(`Defeito: ${DEFECT_LABELS[defect].toLowerCase()}.`);
    if (focus !== 'nenhum') {
      const part = timerPart(focus)!;
      parts.push(`Em destaque: ${focus}, ${part.name.toLowerCase()}.`);
    }
    return parts.join(' ');
  },
  view: [0.2, 1.4, 0.95],
};

export default function RelayTimerBoard(props: RelayTimerBoardProps) {
  const p = resolve(props as PartProps);
  const focus = focusOf(p.highlight);
  const mode = modeOf(p.mode);
  const defect = defectOf(p.defect);
  const time = Math.min(Math.max(Number(p.time) || 0, 0), 1);
  const lit1 = p.powered;
  const lit2 = p.powered && p.relayOn;
  const broken = has(defect, 'trilha-rompida');
  const cold = has(defect, 'solda-fria');
  const layout = timerBoardLayout({ brokenTrace: broken, coldJoint: cold });
  const highlight = focus === 'nenhum' ? [] : [focus];

  const place = (ref: string, up = 0, extraDeg = 0) => {
    const part = timerPart(ref)!;
    return {
      position: on(part.at, up),
      rotation: [0, ((part.deg + extraDeg) * Math.PI) / 180, 0] as Vec3,
    };
  };
  const anchor = (ref: string) => {
    const part = timerPart(ref)!;
    return <Anchor key={ref} name={`tb-${ref}`} position={on(part.at, part.height + 0.5)} />;
  };
  const anchors = (refs: string[]) => <>{refs.map(anchor)}</>;

  // Resistors: 1/4 W bodies 1 mm above the board.
  const R_UP = -T - 1.4;
  const R_DROP = 1.2 + 1 + T + 1.4;
  const resistor = (ref: string, ohms: number, burned = false) => (
    <BakeBlock key={ref} id={ref}>
      <BakePart {...place(ref, R_UP)}>
        <Resistor ohms={ohms} leads="dobrados" leadDrop={R_DROP} burned={burned} />
      </BakePart>
    </BakeBlock>
  );
  const cap = (ref: keyof typeof CAP_SIZES, bulged = false) => {
    const c = CAP_SIZES[ref];
    return (
      <BakeBlock key={ref} id={ref}>
        <BakePart {...place(ref, -7.5)}>
          <ElectrolyticCapacitor
            farads={c.farads}
            voltage={c.voltage}
            sleeve="preto"
            leadLength={4}
            bulged={bulged}
          />
        </BakePart>
      </BakeBlock>
    );
  };

  const jumperAt = mode === 'mono' ? 0 : mode === 'pisca' ? 1 : -1;

  return (
    <group rotation={p.flip ? [0, 0, Math.PI] : [0, 0, 0]} position={[0, p.flip ? T : 0, 0]}>
      <BatchRoot
        blocks={TIMER_REFS}
        highlight={highlight}
        cutNormal={[0, 0, -1]}
        cutThrough={[0, 0, CUT_Z]}
      >
        <PrintedCircuitBoard layout={layout} />

        {/* Low tier: axial parts, the 555, the transistor and the connector. */}
        <BakeLayer
          lift={LIFT_LOW}
          extras={anchors(['D1', 'R1', 'R2', 'R3', 'U1', 'C4', 'D2', 'R4', 'Q1', 'R5', 'CN1'])}
        >
          {resistor('R1', 1000)}
          {resistor('R2', 10_000)}
          {resistor('R3', 1000)}
          {resistor('R4', 1000, has(defect, 'resistor-queimado'))}
          {resistor('R5', 1000)}
          <BakeBlock id="D1">
            <BakePart {...place('D1', 1.3 + 0.6 - 9)}>
              <Diode variant="retificador" leads="dobrados" />
            </BakePart>
          </BakeBlock>
          <BakeBlock id="D2">
            <BakePart {...place('D2', 0.9 + 0.6 - 9)}>
              <Diode variant="sinal" leads="dobrados" />
            </BakePart>
          </BakeBlock>
          <BakeBlock id="U1">
            <BakePart {...place('U1', -3.3)}>
              <IcDip pins={8} code="NE555P" dateCode="2341" socket />
            </BakePart>
          </BakeBlock>
          <BakeBlock id="C4">
            <BakePart {...place('C4', -3)}>
              <CeramicCapacitor farads={10e-9} voltage={50} variant="disco" leadLength={5} />
            </BakePart>
          </BakeBlock>
          <BakeBlock id="Q1">
            <BakePart {...place('Q1', -3)}>
              <TransistorTo92 code="BC337" pinout="CBE" type="npn" leadLength={6} />
            </BakePart>
          </BakeBlock>
          <BakeBlock id="CN1">
            <BakePart {...place('CN1', -3.3)} dropAbove={12}>
              <ConnectorKk family="kk" pins={3} mated={false} />
            </BakePart>
          </BakeBlock>
        </BakeLayer>

        {/* LEDs: their own layer, they change with the state. */}
        <BakeLayer
          lift={LIFT_LOW}
          extras={
            <>
              {anchors(['LD1', 'LD2'])}
              <GlowSprite
                always
                color={LED_COLORS.verde.light}
                intensity={lit1 ? 0.75 : 0}
                size={9}
                position={on(timerPart('LD1')!.at, 1 + 3.2)}
              />
              <GlowSprite
                always
                color={LED_COLORS.vermelho.light}
                intensity={lit2 ? 0.75 : 0}
                size={9}
                position={on(timerPart('LD2')!.at, 1 + 3.2)}
              />
            </>
          }
        >
          <BakeBlock id="LD1">
            <BakePart {...place('LD1', -6)}>
              <Led size={3} color="verde" brightness={lit1 ? 1 : 0} leadLength={5} />
            </BakePart>
          </BakeBlock>
          <BakeBlock id="LD2">
            <BakePart {...place('LD2', -6)}>
              <Led size={3} color="vermelho" brightness={lit2 ? 1 : 0} leadLength={5} />
            </BakePart>
          </BakeBlock>
        </BakeLayer>

        {/* Settings the props move: jumper, DIP, trimpot and the button. */}
        <BakeLayer lift={LIFT_LOW} extras={anchors(['JP1', 'SW1', 'RV1', 'S1'])}>
          <BakeBlock id="JP1">
            <BakePart {...place('JP1', -3)}>
              <PinHeader pins={3} jumperAt={jumperAt} jumperColor="preto" />
            </BakePart>
          </BakeBlock>
          <BakeBlock id="SW1">
            <BakePart {...place('SW1', -3.5)}>
              <DipSwitch
                positions={2}
                color="vermelho"
                states={`${p.longo ? 1 : 0}${p.bip ? 1 : 0}`}
              />
            </BakePart>
          </BakeBlock>
          <BakeBlock id="RV1">
            <BakePart {...place('RV1', -3.5)}>
              <Trimpot variant="aberto" ohms={1_000_000} rotation={time} />
            </BakePart>
          </BakeBlock>
          <BakeBlock id="S1">
            <BakePart {...place('S1', -3.5)}>
              <TactileButton size={6} capColor="preto" pressed={p.pressed} />
            </BakePart>
          </BakeBlock>
        </BakeLayer>

        {/* Middle tier: fuse and terminal blocks. */}
        <BakeLayer lift={LIFT_MID} delay={0.08} extras={anchors(['F1', 'J1', 'J2'])}>
          <BakeBlock id="F1">
            <BakePart {...place('F1', -3.5)}>
              <FuseGlass
                amps={1}
                type="rapido"
                size="5x20"
                holder="clip-pcb"
                blown={has(defect, 'fusivel-queimado')}
              />
            </BakePart>
          </BakeBlock>
          <BakeBlock id="J1">
            <BakePart {...place('J1', -3.5)}>
              <ScrewTerminal
                ways={2}
                pitch={5.08}
                color="azul"
                screwTurns={0}
                labels={J1_LABELS.join(',')}
              />
            </BakePart>
          </BakeBlock>
          <BakeBlock id="J2">
            <BakePart {...place('J2', -3.5)}>
              <ScrewTerminal
                ways={3}
                pitch={5.08}
                color="azul"
                screwTurns={0}
                labels={J2_LABELS.join(',')}
              />
            </BakePart>
          </BakeBlock>
        </BakeLayer>

        {/* Relay: its own layer, the armature moves. */}
        <BakeLayer lift={LIFT_MID} delay={0.08} extras={anchor('K1')}>
          <BakeBlock id="K1">
            <BakePart {...place('K1', -3.5)}>
              <Relay coilVoltage={12} energized={lit2} />
            </BakePart>
          </BakeBlock>
        </BakeLayer>

        {/* Tall tier: electrolytics and the buzzer. */}
        <BakeLayer lift={LIFT_TALL} delay={0.16} extras={anchors(['C1', 'C2', 'C3', 'BZ1'])}>
          {cap('C1', has(defect, 'capacitor-estufado'))}
          {cap('C2')}
          {cap('C3')}
          <BakeBlock id="BZ1">
            <BakePart {...place('BZ1', -6)}>
              <Buzzer variant="ativo" sticker={false} />
            </BakePart>
          </BakeBlock>
        </BakeLayer>
      </BatchRoot>

      {cold && <ColdJoint at={timerPad(COLD_JOINT_PAD)!} />}
      {broken && <Scorch at={BREAK_AT} />}
    </group>
  );
}

/**
 * A cold solder joint on the solder side: a dull, grainy ball that sits on
 * the lead without wetting the pad, with a dark ring where it never bonded.
 */
function ColdJoint({ at }: { at: Point }) {
  const noise = getNoiseTexture();
  const [x, , z] = boardPoint(TIMER_BOARD, at, 'bottom');
  return (
    <group position={[x, 0, z]}>
      {/* The ball, a bit lumpy and off-centre. */}
      <mesh position={[0.15, -1.1, -0.1]} scale={[1.25, 1, 1.15]}>
        <sphereGeometry args={[1.15, 20, 14]} />
        <Material
          color="#9a9c9a"
          metalness={0.65}
          roughness={0.78}
          roughnessMap={noise}
          bumpMap={noise}
          bumpScale={3}
        />
      </mesh>
      {/* Dark gap between the ball and the pad: it never wetted the copper. */}
      <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.45, 28]} />
        <Material color="#2a2622" roughness={0.9} side={DoubleSide} />
      </mesh>
      {/* Lead end sticking out of the ball. */}
      <mesh position={[0, -2.3, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1.6, 12]} />
        <Material preset="tin" roughness={0.45} />
      </mesh>
    </group>
  );
}

/** Scorch mark where the trace cracked: darkened mask and copper. */
function Scorch({ at }: { at: Point }) {
  const noise = getNoiseTexture();
  const [x, y, z] = boardPoint(TIMER_BOARD, at, 'top');
  return (
    <group position={[x, y + 0.03, z]} rotation={[-Math.PI / 2, 0, 0.5]}>
      <mesh scale={[1, 0.62, 1]}>
        <circleGeometry args={[2.1, 24]} />
        <Material
          color="#2b1d12"
          roughness={0.95}
          roughnessMap={noise}
          transparent
          opacity={0.82}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]} rotation={[0, 0, -0.5]}>
        <planeGeometry args={[2.6, 0.35]} />
        <Material color="#120c08" roughness={1} />
      </mesh>
    </group>
  );
}
