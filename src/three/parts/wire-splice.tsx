/**
 * Hand splices of building wire (rigid, 1,5 to 4 mm²): the in-line splice
 * ("prolongamento", each end wound tight around the other), the pigtail
 * ("rabo de rato", two or three ends twisted together, as inside a box) and
 * the tap ("derivação", a branch wound around a stretch of bared main wire).
 *
 * `quality: 'frouxa'` shows the classic bad splice: few, loose turns that
 * touch only at points (high contact resistance, heats and blackens).
 * `tape` covers the splice with PVC electrical tape, half-overlapped turns,
 * extending past the bare copper onto the insulation.
 */
import { CatmullRomCurve3, Vector3, type BufferGeometry } from 'three';
import { formatNumber } from '../core/format';
import { Material } from '../materials/Material';
import { axialLathe, tube } from '../shapes/geometry';
import { useDisposable } from '../shapes/Wire';
import type { PartAnnotation, PartMeta, PartProps, Vec3 } from '../types';
import { conductorSpec, type WireColor } from './_wiring-parts';
import { WireRun } from './wire';

export type SpliceKind = 'prolongamento' | 'rabo-de-rato' | 'derivacao';

export interface WireSpliceProps {
  type?: SpliceKind;
  section?: number;
  quality?: 'firme' | 'frouxa';
  tape?: boolean;
  /** Wires in the pigtail (2 or 3). */
  wires?: number;
}

const KINDS: SpliceKind[] = ['prolongamento', 'rabo-de-rato', 'derivacao'];
const SECTIONS = [1.5, 2.5, 4];
const KIND_LABELS: Record<SpliceKind, string> = {
  prolongamento: 'Prolongamento (emenda em linha)',
  'rabo-de-rato': 'Rabo de rato (torção)',
  derivacao: 'Derivação (em T)',
};
const COLORS: WireColor[] = ['preto', 'vermelho', 'branco'];
/** Length of the wound part of each end (mm). */
const WRAP = 12;
const LEAD = 32;

function resolve(props: PartProps) {
  const p = { ...meta.defaults, ...props };
  return {
    type: KINDS.includes(p.type as SpliceKind) ? (p.type as SpliceKind) : 'prolongamento',
    section: SECTIONS.includes(Number(p.section)) ? Number(p.section) : 2.5,
    loose: p.quality === 'frouxa',
    tape: p.tape === true,
    wires: Number(p.wires) === 3 ? 3 : 2,
  };
}

export const meta: PartMeta = {
  id: 'wire-splice',
  label: 'Emendas de fios',
  category: 'conexoes',
  summary:
    'Emendas de fio rígido feitas à mão: prolongamento, rabo de rato e derivação, bem apertadas ou frouxas, com ou sem fita isolante.',
  defaults: { type: 'prolongamento', section: 2.5, quality: 'firme', tape: false, wires: 2 },
  controls: {
    type: {
      kind: 'select',
      label: 'Emenda',
      options: KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] })),
    },
    section: {
      kind: 'select',
      label: 'Seção',
      options: SECTIONS.map((s) => ({ value: s, label: `${formatNumber(s)} mm²` })),
    },
    quality: {
      kind: 'select',
      label: 'Aperto',
      options: [
        { value: 'firme', label: 'Firme (voltas juntas)' },
        { value: 'frouxa', label: 'Frouxa (poucas voltas soltas)' },
      ],
    },
    tape: { kind: 'toggle', label: 'Fita isolante' },
    wires: { kind: 'number', label: 'Fios no rabo de rato', min: 2, max: 3, step: 1 },
  },
  annotations: (props) => {
    const p = resolve(props);
    const d = conductorSpec(p.section).solidD;
    const notes: PartAnnotation[] = [];
    if (p.tape) {
      notes.push({
        at: [p.type === 'rabo-de-rato' ? WRAP / 2 : 0, d * 2.2, 0],
        text: 'Fita isolante em meia sobreposição, passando da isolação dos dois lados',
      });
    } else if (p.loose) {
      notes.push({
        at: [p.type === 'rabo-de-rato' ? WRAP / 2 : 3, d * 1.8, 0],
        text: 'Voltas frouxas: o cobre só se toca em pontos, a resistência sobe e a emenda esquenta',
      });
    } else {
      notes.push({
        at: [p.type === 'rabo-de-rato' ? WRAP / 2 : 3, d * 1.6, 0],
        text:
          p.type === 'rabo-de-rato'
            ? 'Pontas torcidas juntas, no mesmo sentido, com alicate: aperto firme'
            : 'Voltas juntas e apertadas: contato em toda a superfície',
      });
    }
    notes.push({
      at: [-LEAD + 4, d * 1.4, p.type === 'rabo-de-rato' ? d : 0],
      text: 'Isolação de PVC: descasque só o necessário para a emenda',
    });
    if (p.type === 'derivacao')
      notes.push({
        at: [0, d, 26],
        text: 'Fio da derivação, enrolado no fio principal descascado',
      });
    return notes;
  },
  describe: (props) => {
    const p = resolve(props);
    const what: Record<SpliceKind, string> = {
      prolongamento:
        'Emenda de prolongamento: duas pontas de fio rígido se cruzam e cada uma é enrolada em volta da outra',
      'rabo-de-rato': `Emenda rabo de rato: ${p.wires === 3 ? 'três' : 'duas'} pontas de fio rígido lado a lado, torcidas juntas`,
      derivacao:
        'Emenda de derivação: um trecho do fio principal foi descascado e o fio da derivação foi enrolado nele',
    };
    const fit = p.loose
      ? 'As voltas estão frouxas e espaçadas: mau contato.'
      : 'As voltas estão juntas e apertadas.';
    const tape = p.tape
      ? ' A emenda está coberta com fita isolante.'
      : ' Sem fita: o cobre aparece.';
    return `${what[p.type]}, ${formatNumber(p.section)} mm². ${fit}${tape}`;
  },
  view: [0.2, 1, 1],
};

/**
 * A wire end wound around the X axis from x0 to x1: starts on the axis (with
 * a short ramp) and turns at radius `r`. `pitch` is the advance per turn.
 */
function helix(x0: number, x1: number, r: number, pitch: number, phase = 0): Vec3[] {
  const turns = Math.abs(x1 - x0) / pitch;
  const steps = Math.max(Math.ceil(turns * 18), 8);
  const out: Vec3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ramp = Math.min(t * turns * 2, 1);
    const a = phase + t * turns * Math.PI * 2;
    out.push([x0 + (x1 - x0) * t, r * ramp * Math.cos(a), r * ramp * Math.sin(a)]);
  }
  return out;
}

function copperTube(points: Vec3[], radius: number): BufferGeometry {
  const curve = new CatmullRomCurve3(points.map((v) => new Vector3(...v)));
  return tube(curve, radius, { radial: 10, segments: points.length * 3 });
}

function Copper({ points, radius }: { points: Vec3[]; radius: number }) {
  const geometry = useDisposable(() => copperTube(points, radius), [points, radius]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <Material preset="copper" roughness={0.3} />
    </mesh>
  );
}

/** Electrical tape over [x0, x1] around the axis: half-overlapped turns. */
function Tape({ x0, x1, r }: { x0: number; x1: number; r: number }) {
  const geometry = useDisposable(() => {
    const step = 4;
    const profile: [number, number][] = [[r - 0.2, x0]];
    for (let x = x0; x < x1; x += step) {
      profile.push([r, x], [r + 0.12, Math.min(x + step - 0.4, x1)]);
    }
    profile.push([r, x1], [r - 0.2, x1]);
    const g = axialLathe(profile, 40);
    g.rotateZ(-Math.PI / 2);
    return g;
  }, [x0, x1, r]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <Material preset="pvc" color="#151517" roughness={0.45} />
    </mesh>
  );
}

export default function WireSplice(props: WireSpliceProps) {
  const p = resolve(props as PartProps);
  const spec = conductorSpec(p.section);
  const d = spec.solidD;
  const rc = d / 2;
  const D = d + 2 * spec.insulation;
  const pitch = p.loose ? d * 3.4 : d * 1.08;
  const wrap = p.loose ? WRAP * 0.75 : WRAP;

  if (p.type === 'rabo-de-rato') {
    const n = p.wires;
    const spread = n === 3 ? d * 0.62 : d * 0.52;
    const twist = p.loose ? 18 : 7;
    const ends = Array.from({ length: n }, (_, i) => {
      const phase = (i / n) * Math.PI * 2;
      const pts: Vec3[] = [];
      const steps = 60;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const x = -4 + (WRAP + 6) * t;
        const a = phase + ((x + 4) / twist) * Math.PI * 2;
        const r = spread * Math.min((x + 4) / 4, 1);
        pts.push([x, r * Math.cos(a), r * Math.sin(a)]);
      }
      return pts;
    });
    // Insulated wires come in side by side from −X.
    const offsets = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * (D + 0.2));
    return (
      <group>
        {offsets.map((z, i) => (
          <group key={i}>
            <WireRun
              points={[
                [-LEAD - 10, 0, z],
                [-10, 0, z],
                [-4, 0, 0],
              ]}
              smooth
              section={p.section}
              color={COLORS[i]!}
              strip={0}
              stripEnd={7}
              marking={false}
            />
            <Copper points={ends[i]!} radius={rc} />
          </group>
        ))}
        {p.tape && <Tape x0={-12} x1={WRAP + 4} r={D * 0.95} />}
      </group>
    );
  }

  if (p.type === 'derivacao') {
    const bare = wrap + 6;
    return (
      <group>
        <WireRun
          points={[
            [-LEAD - 10, 0, 0],
            [-bare / 2, 0, 0],
          ]}
          section={p.section}
          color="preto"
          strip={0}
          stripEnd={0.01}
          marking={false}
        />
        <WireRun
          points={[
            [LEAD + 10, 0, 0],
            [bare / 2, 0, 0],
          ]}
          section={p.section}
          color="preto"
          strip={0}
          stripEnd={0.01}
          marking={false}
        />
        <Copper
          points={[
            [-bare / 2 - 0.5, 0, 0],
            [bare / 2 + 0.5, 0, 0],
          ]}
          radius={rc}
        />
        <WireRun
          points={[
            [0, 0, LEAD + 4],
            [0, 0, D + 6],
            [-wrap / 2, 0, d],
          ]}
          smooth
          section={p.section}
          color="vermelho"
          strip={0}
          stripEnd={6}
          marking={false}
        />
        <Copper points={helix(-wrap / 2, wrap / 2, d, pitch, Math.PI / 2)} radius={rc} />
        {p.tape && <Tape x0={-bare / 2 - 6} x1={bare / 2 + 6} r={D * 1.05} />}
      </group>
    );
  }

  // In-line splice: each end wound around the other's straight part.
  return (
    <group>
      <WireRun
        points={[
          [-LEAD - wrap, 0, 0],
          [-wrap, 0, 0],
        ]}
        section={p.section}
        color="preto"
        strip={0}
        stripEnd={0.01}
        marking={false}
      />
      <WireRun
        points={[
          [LEAD + wrap, 0, 0],
          [wrap, 0, 0],
        ]}
        section={p.section}
        color="preto"
        strip={0}
        stripEnd={0.01}
        marking={false}
      />
      <Copper
        points={[
          [-wrap - 0.5, 0, 0],
          [0, 0, 0],
          [0.6, 0, 0],
        ]}
        radius={rc}
      />
      <Copper
        points={[
          [wrap + 0.5, 0, 0],
          [0, 0, 0],
          [-0.6, 0, 0],
        ]}
        radius={rc}
      />
      <Copper points={helix(0.6, wrap, d, pitch)} radius={rc} />
      <Copper points={helix(-0.6, -wrap, d, pitch, Math.PI)} radius={rc} />
      {p.tape && <Tape x0={-wrap - 7} x1={wrap + 7} r={D * 1.05} />}
    </group>
  );
}
