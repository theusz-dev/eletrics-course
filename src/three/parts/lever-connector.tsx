/**
 * Lever splicing connector ("conector de alavanca", "emenda rápida"): a
 * clear housing with 2, 3 or 5 ways, each with its own lever and clamp
 * spring pressing the wire against one tin-plated copper bar shared by all
 * the ways. Typical sizes for 0,2–4 mm² (rigid or flexible), 32 A, 450 V:
 * pitch 5,6 mm, depth 18,6 mm, height 8,3 mm with the levers down, 11 mm of
 * stripped wire, and a test slot for the probe above each entry. Generic, no
 * brand.
 *
 * Lifting a lever opens the spring; the wire goes in up to the end stop
 * (the copper is seen through the housing), and the lever goes down. A wire
 * stripped too short (`strip: 'curto'`) is held by the insulation, not by the
 * copper: the classic bad contact that heats.
 *
 * Cutaway: the plane z = 0 is replaced by a cut along the first way (x),
 * showing the spring, the bar and the wire end.
 */
import { useMemo } from 'react';
import { BoxGeometry, Shape } from 'three';
import { formatNumber } from '../core/format';
import { Anchor } from '../core/view';
import { Material } from '../materials/Material';
import { useDisposable } from '../shapes/Wire';
import type { PartAnnotation, PartMeta, PartProps, Vec3 } from '../types';
import { extrudeAlongX, roundedBox } from './_em-geometry';
import { WIRE_COLOR_ORDER, type WireColor } from './_wiring-parts';
import { WireRun } from './wire';

export interface LeverConnectorProps {
  ways?: number;
  /** Wires inserted, from the first way. */
  wires?: number;
  /** Levers of the empty ways lifted (open). */
  open?: boolean;
  /** Conductor section of the wires (mm²). */
  section?: number;
  kind?: 'rigido' | 'flexivel';
  /** Stripped length: right (11 mm) or too short (the first wire holds by the insulation). */
  strip?: 'certo' | 'curto';
}

const WAYS = [2, 3, 5];
const SECTIONS = [0.5, 1, 1.5, 2.5, 4];
const PITCH = 5.6;
const DEPTH = 18.6;
const BODY_H = 6.2;
const LEVER_T = 2.1;
const ENTRY_Y = 2.9;
const ENTRY_R = 1.85;
const STRIP_OK = 11;
const STRIP_SHORT = 5;
/** Where the wire stops inside (z), from the front face at +DEPTH/2. */
const STOP_Z = DEPTH / 2 - 12.5;
const LEVER_COLOR = '#f07c1b';
const WIRE_ORDER: WireColor[] = ['preto', 'azul-claro', 'vermelho', 'branco', 'marrom'];

function resolve(props: PartProps) {
  const p = { ...meta.defaults, ...props };
  const ways = WAYS.includes(Number(p.ways)) ? Number(p.ways) : 3;
  const wires = Math.min(Math.max(Math.round(Number(p.wires) || 0), 0), ways);
  const section = SECTIONS.includes(Number(p.section)) ? Number(p.section) : 1.5;
  const kind = p.kind === 'flexivel' ? 'flexivel' : 'rigido';
  const strip = p.strip === 'curto' ? 'curto' : 'certo';
  return { ways, wires, open: p.open === true, section, kind, strip } as const;
}

const width = (ways: number) => ways * PITCH + 1.8;
const wayX = (ways: number, i: number) => (i - (ways - 1) / 2) * PITCH;

export const meta: PartMeta = {
  id: 'lever-connector',
  label: 'Conector de alavanca',
  category: 'conexoes',
  summary:
    'Conector de emenda com alavancas, de 2, 3 ou 5 vias, com carcaça transparente: cada alavanca abre a mola que prende o fio contra uma barra de cobre comum a todas as vias.',
  defaults: { ways: 3, wires: 2, open: true, section: 1.5, kind: 'rigido', strip: 'certo' },
  controls: {
    ways: {
      kind: 'select',
      label: 'Vias',
      options: WAYS.map((w) => ({ value: w, label: `${w} vias` })),
    },
    wires: { kind: 'number', label: 'Fios encaixados', min: 0, max: 5, step: 1 },
    open: { kind: 'toggle', label: 'Alavancas das vias vazias abertas' },
    section: {
      kind: 'select',
      label: 'Seção dos fios',
      options: SECTIONS.map((s) => ({ value: s, label: `${formatNumber(s)} mm²` })),
    },
    kind: {
      kind: 'select',
      label: 'Tipo de fio',
      options: [
        { value: 'rigido', label: 'Rígido' },
        { value: 'flexivel', label: 'Flexível (cabinho)' },
      ],
    },
    strip: {
      kind: 'select',
      label: 'Ponta descascada do 1º fio',
      options: [
        { value: 'certo', label: '11 mm (certo)' },
        { value: 'curto', label: '5 mm (curta demais)' },
      ],
    },
  },
  annotations: (props) => {
    const p = resolve(props);
    const W = width(p.ways);
    const notes: PartAnnotation[] = [
      {
        at: [wayX(p.ways, p.ways - 1), BODY_H + LEVER_T, -DEPTH / 4],
        text: p.open
          ? 'Alavanca levantada: a mola abre e o fio entra sem esforço'
          : 'Alavanca abaixada: a mola aperta o fio contra a barra',
        anchor: 'alavanca',
      },
      {
        at: [-W / 2, BODY_H * 0.6, 0],
        text: 'Carcaça transparente: dá para ver se o cobre chegou até o fim',
      },
      {
        at: [0, 1.4, STOP_Z + 1],
        text: 'Barra de cobre estanhado comum a todas as vias: todos os fios ficam ligados entre si',
      },
      {
        at: [wayX(p.ways, 0), BODY_H - 0.4, DEPTH / 2 - 1.5],
        text: 'Fenda de teste: a ponta de prova do multímetro entra aqui',
      },
    ];
    if (p.wires > 0 && p.strip === 'curto')
      notes.push({
        at: [wayX(p.ways, 0), ENTRY_Y, DEPTH / 2 + 3],
        text: 'Ponta curta: a mola aperta a isolação, não o cobre. Mau contato que esquenta',
      });
    return notes;
  },
  cutaway: true,
  cut: (props) => {
    const p = resolve(props);
    return { normal: [1, 0, 0], through: [wayX(p.ways, 0), 0, 0] };
  },
  describe: (props) => {
    const p = resolve(props);
    const wires =
      p.wires === 0
        ? 'Nenhum fio encaixado.'
        : `${p.wires === 1 ? 'Um fio' : `${p.wires} fios`} ${p.kind === 'flexivel' ? 'flexíveis' : 'rígidos'} de ${formatNumber(p.section)} mm² encaixado${p.wires > 1 ? 's' : ''}, com as alavancas abaixadas.`;
    const empty =
      p.wires < p.ways
        ? ` As alavancas das vias vazias estão ${p.open ? 'levantadas (abertas)' : 'abaixadas'}.`
        : '';
    const short =
      p.wires > 0 && p.strip === 'curto'
        ? ' O primeiro fio foi descascado curto demais: a mola prende a isolação e o cobre mal encosta na barra, um mau contato.'
        : '';
    return `Conector de alavanca de ${p.ways} vias, com carcaça transparente e alavancas laranja. ${wires}${empty}${short} Dentro, uma barra de cobre estanhado liga todas as vias entre si.`;
  },
  view: [-0.8, 1.15, 0.75],
};

/** Side profile of a lever (drawn in the YZ plane, extruded along X). */
function leverShape(): Shape {
  const s = new Shape();
  const L = DEPTH - 1.4;
  // Shape X → −Z (front at negative shape X), shape Y → Y. Hinge at the back.
  s.moveTo(-L, 0);
  s.lineTo(-1.2, 0);
  s.quadraticCurveTo(0, 0, 0, 1);
  s.lineTo(0, LEVER_T - 0.3);
  s.quadraticCurveTo(0, LEVER_T, -1.2, LEVER_T);
  s.lineTo(-L + 2.5, LEVER_T);
  s.lineTo(-L, LEVER_T + 0.8);
  s.quadraticCurveTo(-L - 0.6, LEVER_T + 0.8, -L - 0.6, LEVER_T);
  s.lineTo(-L - 0.6, 0.6);
  s.closePath();
  return s;
}

function Lever({ x, open, index }: { x: number; open: boolean; index: number }) {
  const geometry = useDisposable(() => extrudeAlongX(leverShape(), PITCH - 1.2, 0.3), []);
  const hingeZ = -DEPTH / 2 + 0.7;
  const angle = open ? (80 * Math.PI) / 180 : 0;
  return (
    <group position={[x, BODY_H, hingeZ]} rotation={[-angle, 0, 0]}>
      <mesh geometry={geometry} castShadow>
        <Material preset="absYellow" color={LEVER_COLOR} roughness={0.45} clip />
      </mesh>
      {index === 0 && <Anchor name="alavanca" position={[0, LEVER_T, DEPTH / 2]} />}
    </group>
  );
}

/** Clamp spring: a bent steel strip that presses the wire up against the bar. */
function Spring({ x, open }: { x: number; open: boolean }) {
  const geometry = useMemo(() => new BoxGeometry(PITCH - 1.6, 0.35, 6.5), []);
  const tilt = open ? -0.55 : -0.25;
  return (
    <group position={[x, 0.9, STOP_Z + 4.5]}>
      <mesh geometry={geometry} rotation={[tilt, 0, 0]} position={[0, 1.2, 0]}>
        <Material preset="steel" color="#c7c9cc" roughness={0.3} clip />
      </mesh>
      <mesh position={[0, 0.2, 2.6]}>
        <boxGeometry args={[PITCH - 1.6, 0.35, 1.6]} />
        <Material preset="steel" color="#c7c9cc" roughness={0.3} clip />
      </mesh>
    </group>
  );
}

export default function LeverConnector(props: LeverConnectorProps) {
  const p = resolve(props as PartProps);
  const W = width(p.ways);
  const body = useDisposable(() => roundedBox(W, BODY_H, DEPTH, 1.2, 0.5), [W]);
  const bar = useDisposable(() => new BoxGeometry(W - 2.2, 0.6, 7), [W]);
  const wires = Array.from({ length: p.wires }, (_, i) => i);
  return (
    <group>
      <mesh geometry={body} castShadow receiveShadow renderOrder={2}>
        <Material
          preset="polycarbonate"
          color="#d9e3ea"
          roughness={0.22}
          transmission={0.72}
          clip
        />
      </mesh>
      {/* Wire entries and test slots on the front face. */}
      {Array.from({ length: p.ways }, (_, i) => (
        <group key={i} position={[wayX(p.ways, i), 0, DEPTH / 2 + 0.01]}>
          <mesh position={[0, ENTRY_Y, 0]}>
            <circleGeometry args={[ENTRY_R, 28]} />
            <Material preset="absDark" color="#40464b" roughness={0.5} clip />
          </mesh>
          <mesh position={[0, BODY_H - 1.1, 0]}>
            <planeGeometry args={[1.1, 1.3]} />
            <Material preset="absDark" color="#40464b" roughness={0.5} clip />
          </mesh>
        </group>
      ))}
      <mesh geometry={bar} position={[0, ENTRY_Y + ENTRY_R * 0.55, STOP_Z + 3.5]}>
        <Material preset="tin" roughness={0.3} clip />
      </mesh>
      {Array.from({ length: p.ways }, (_, i) => {
        const filled = i < p.wires;
        return (
          <group key={i}>
            <Spring x={wayX(p.ways, i)} open={!filled && p.open} />
            <Lever x={wayX(p.ways, i)} open={!filled && p.open} index={i} />
          </group>
        );
      })}
      {wires.map((i) => {
        const short = i === 0 && p.strip === 'curto';
        const strip = short ? STRIP_SHORT : STRIP_OK;
        // A short end can only go in as far as the insulation lets it.
        const end = short ? STOP_Z + 6 : STOP_Z;
        const x = wayX(p.ways, i);
        const points: Vec3[] = [
          [x, ENTRY_Y, DEPTH / 2 + 28],
          [x, ENTRY_Y, end],
        ];
        return (
          <WireRun
            key={i}
            points={points}
            section={p.section}
            kind={p.kind}
            color={WIRE_ORDER[i] ?? WIRE_COLOR_ORDER[i]!}
            strip={0}
            stripEnd={strip}
            marking={false}
          />
        );
      })}
    </group>
  );
}
