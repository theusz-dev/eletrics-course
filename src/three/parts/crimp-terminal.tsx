/**
 * Crimp terminals on a flexible wire: the ferrule ("ilhós", tubular terminal
 * for screw terminals and breakers) and the pre-insulated ring ("olhal"),
 * fork ("forquilha"), pin ("pino") and butt splice ("luva de emenda").
 *
 * Pre-insulated terminals use the usual colour code of the sleeve: red for
 * 0,5–1,5 mm², blue for 1,5–2,5 mm² and yellow for 4–6 mm²; ferrules here
 * follow DIN 46228-4 (orange 0,5, white 0,75, yellow 1, red 1,5, blue 2,5,
 * grey 4, black 6 mm²; other makers use other colours). Typical sizes: ferrule
 * of 8 mm for 0,5–2,5 mm² (10 mm above), ring and fork for M4 screws.
 *
 * `crimped: false` shows the moment before the crimp: the stripped wire just
 * in front of the terminal. Crimped, the barrel is pressed (the dent of the
 * crimping tool) and the copper fills it. Cutaway: plane z = 0, along the
 * wire, showing the strands inside the barrel.
 */
import { useMemo } from 'react';
import { Path, Shape, type BufferGeometry } from 'three';
import { formatNumber } from '../core/format';
import { Material } from '../materials/Material';
import { axialLathe } from '../shapes/geometry';
import { useDisposable } from '../shapes/Wire';
import type { PartAnnotation, PartMeta, PartProps } from '../types';
import { extrudeUp } from './_em-geometry';
import { conductorSpec, type WireColor } from './_wiring-parts';
import { WireRun } from './wire';

export type CrimpKind = 'ilhos' | 'olhal' | 'forquilha' | 'pino' | 'luva';

export interface CrimpTerminalProps {
  type?: CrimpKind;
  /** Wire section (mm²). */
  section?: number;
  crimped?: boolean;
  color?: WireColor;
}

const KINDS: CrimpKind[] = ['ilhos', 'olhal', 'forquilha', 'pino', 'luva'];
const SECTIONS = [0.5, 0.75, 1, 1.5, 2.5, 4, 6];

const KIND_LABELS: Record<CrimpKind, string> = {
  ilhos: 'Ilhós (terminal tubular)',
  olhal: 'Olhal (anel)',
  forquilha: 'Forquilha (garfo)',
  pino: 'Pino',
  luva: 'Luva de emenda',
};

/** Ferrule collar colours, DIN 46228-4. */
const FERRULE_COLORS: Record<string, { hex: string; name: string }> = {
  '0.5': { hex: '#f08a1c', name: 'laranja' },
  '0.75': { hex: '#f2f1ec', name: 'branco' },
  '1': { hex: '#f2c818', name: 'amarelo' },
  '1.5': { hex: '#c9221d', name: 'vermelho' },
  '2.5': { hex: '#2160c4', name: 'azul' },
  '4': { hex: '#8b9095', name: 'cinza' },
  '6': { hex: '#1d1d1f', name: 'preto' },
};

function sleeveColor(section: number): { hex: string; name: string; range: string } {
  if (section <= 1) return { hex: '#c9221d', name: 'vermelho', range: '0,5 a 1,5 mm²' };
  if (section <= 2.5) return { hex: '#2160c4', name: 'azul', range: '1,5 a 2,5 mm²' };
  return { hex: '#f2c818', name: 'amarelo', range: '4 a 6 mm²' };
}

function resolve(props: PartProps) {
  const p = { ...meta.defaults, ...props };
  const type = KINDS.includes(p.type as CrimpKind) ? (p.type as CrimpKind) : 'olhal';
  const section = SECTIONS.includes(Number(p.section)) ? Number(p.section) : 1.5;
  return {
    type,
    section,
    crimped: p.crimped !== false,
    color: (p.color as WireColor) ?? 'preto',
  };
}

/** Sizes (mm) for a section: barrel, sleeve and the stripped length. */
function sizes(section: number, type: CrimpKind) {
  const spec = conductorSpec(section);
  const core = spec.bundleD;
  const barrelR = core / 2 + 0.12;
  const wall = section <= 2.5 ? 0.25 : 0.35;
  const insulationD = core + 2 * spec.insulation;
  if (type === 'ilhos') {
    const tube = section <= 2.5 ? 8 : 10;
    return { core, barrelR, wall, insulationD, tube, collar: 6, strip: tube };
  }
  const barrel = section <= 2.5 ? 6.5 : 8;
  return { core, barrelR, wall, insulationD, tube: barrel, collar: 9, strip: barrel - 0.5 };
}

const describeSection = (s: number) => `${formatNumber(s)} mm²`;

export const meta: PartMeta = {
  id: 'crimp-terminal',
  label: 'Terminais de crimpar',
  category: 'conexoes',
  summary:
    'Terminais prensados na ponta de um fio flexível: ilhós, olhal, forquilha, pino e luva de emenda, antes e depois de crimpar, nas cores de cada bitola.',
  defaults: { type: 'olhal', section: 1.5, crimped: true, color: 'preto' },
  controls: {
    type: {
      kind: 'select',
      label: 'Tipo',
      options: KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] })),
    },
    section: {
      kind: 'select',
      label: 'Seção do fio',
      options: SECTIONS.map((s) => ({ value: s, label: describeSection(s) })),
    },
    crimped: { kind: 'toggle', label: 'Crimpado' },
  },
  annotations: (props) => {
    const p = resolve(props);
    const s = sizes(p.section, p.type);
    const notes: PartAnnotation[] = [];
    if (p.type === 'ilhos') {
      notes.push(
        {
          at: [s.tube * 0.6, s.barrelR + s.wall, 0],
          text: 'Tubo de cobre estanhado: junta os fios finos numa ponta firme para o borne',
        },
        {
          at: [-s.collar * 0.5, s.barrelR + 1.2, 0],
          text: `Colarinho ${FERRULE_COLORS[String(p.section)]!.name}: indica a bitola (${describeSection(p.section)})`,
        },
      );
    } else {
      const c = sleeveColor(p.section);
      notes.push({
        at: [-s.collar * 0.4, s.barrelR + 1.3, 0],
        text: `Capa isolante ${c.name}: terminal para fios de ${c.range}`,
      });
      if (p.type === 'olhal')
        notes.push({
          at: [s.tube + 6.5, 0.4, 3.2],
          text: 'Olhal: o parafuso passa pelo furo e o fio não escapa mesmo se afrouxar',
        });
      if (p.type === 'forquilha')
        notes.push({
          at: [s.tube + 6.5, 0.4, 3.2],
          text: 'Forquilha: entra sob o parafuso sem tirá-lo, basta afrouxar',
        });
      if (p.type === 'pino')
        notes.push({
          at: [s.tube + 7, 1, 0],
          text: 'Pino: para bornes de mola ou de parafuso pequenos',
        });
      if (p.type === 'luva')
        notes.push({
          at: [0, s.barrelR + 1.3, 0],
          text: 'Luva: emenda dois fios de topo, cada um crimpado de um lado',
        });
    }
    notes.push({
      at: [-14, s.insulationD / 2, 0],
      text: p.crimped
        ? 'Crimpado com o alicate certo: o cobre fica preso por pressão, sem solda'
        : 'Antes de crimpar: descasque só o comprimento do tubo e enfie até o fim',
    });
    return notes;
  },
  cutaway: true,
  describe: (props) => {
    const p = resolve(props);
    const what =
      p.type === 'ilhos'
        ? `Ilhós (terminal tubular) com colarinho ${FERRULE_COLORS[String(p.section)]!.name}`
        : `${KIND_LABELS[p.type]} pré-isolado, com capa ${sleeveColor(p.section).name}`;
    const state = p.crimped
      ? 'crimpado na ponta de um fio flexível'
      : 'ao lado da ponta descascada de um fio flexível, antes de crimpar';
    const two = p.type === 'luva' ? ', com um fio entrando por cada lado' : '';
    return `${what}, ${state} de ${describeSection(p.section)}${two}.`;
  },
  view: [0.25, 0.95, 1],
};

/** Lathe around the X axis (profile: [radius, x]). */
function latheX(profile: [number, number][], segments = 36): BufferGeometry {
  const g = axialLathe(profile, segments);
  g.rotateZ(-Math.PI / 2);
  return g;
}

/** Flat tongue of ring, fork and pin terminals, in the XZ plane from x = 0. */
function tongueShape(type: CrimpKind): Shape {
  const s = new Shape();
  const neck = 2.2;
  if (type === 'olhal') {
    const c = 6.2;
    const R = 3.9;
    const a = Math.asin(neck / R);
    s.moveTo(0, -neck);
    s.lineTo(c - R * Math.cos(a), -neck);
    s.absarc(c, 0, R, Math.PI + a, Math.PI - a + Math.PI * 2, false);
    s.lineTo(0, neck);
    s.closePath();
    const hole = new Path();
    hole.absarc(c, 0, 2.15, 0, Math.PI * 2, true);
    s.holes.push(hole);
    return s;
  }
  // Fork: two prongs around a 4,3 mm slot.
  const L = 10;
  const half = 3.8;
  const slot = 2.15;
  s.moveTo(0, -neck);
  s.lineTo(2.5, -half);
  s.lineTo(L - 0.8, -half);
  s.quadraticCurveTo(L, -half, L, -half + 0.8);
  s.lineTo(L, -slot - 0.3);
  s.lineTo(4.6 + slot, -slot);
  s.absarc(4.6, 0, slot, -Math.PI / 2, Math.PI / 2, true);
  s.lineTo(L, slot);
  s.lineTo(L, half - 0.8);
  s.quadraticCurveTo(L, half, L - 0.8, half);
  s.lineTo(2.5, half);
  s.lineTo(0, neck);
  s.closePath();
  return s;
}

function Tongue({ type, x }: { type: CrimpKind; x: number }) {
  const geometry = useDisposable(() => {
    if (type === 'pino')
      return latheX([
        [0, 0],
        [0.95, 0],
        [0.95, 9.4],
        [0.6, 10],
        [0, 10],
      ]);
    const g = extrudeUp(tongueShape(type), 0.8, 0.1);
    // extrudeUp maps shape Y to −Z: flip back so the shape reads as drawn.
    g.translate(0, -0.4, 0);
    return g;
  }, [type]);
  return (
    <mesh geometry={geometry} position={[x, 0, 0]} castShadow receiveShadow>
      <Material preset="tin" roughness={0.3} clip />
    </mesh>
  );
}

function Barrel({
  from,
  length,
  r,
  wall,
  dent,
}: {
  from: number;
  length: number;
  r: number;
  wall: number;
  dent: boolean;
}) {
  const geometry = useDisposable(() => {
    const R = r + wall;
    const profile: [number, number][] = [
      [r, from],
      [R, from],
    ];
    if (dent) {
      const mid = from + length / 2;
      profile.push([R, mid - 1.6], [R * 0.9, mid - 1.1], [R * 0.9, mid + 1.1], [R, mid + 1.6]);
    }
    profile.push([R, from + length], [r, from + length], [r, from]);
    return latheX(profile);
  }, [from, length, r, wall, dent]);
  return (
    <mesh geometry={geometry} castShadow>
      <Material preset="tin" roughness={0.32} clip />
    </mesh>
  );
}

/** Insulating sleeve (or ferrule collar): funnel at the wire entry. */
function Sleeve({
  from,
  to,
  r,
  color,
  dent,
  funnelAt = 'start',
}: {
  from: number;
  to: number;
  r: number;
  color: string;
  dent: boolean;
  funnelAt?: 'start' | 'both';
}) {
  const geometry = useMemo(() => {
    const R = r + 0.55;
    const flare = R + 0.5;
    const len = to - from;
    const profile: [number, number][] = [
      [r + 0.35, from],
      [flare, from],
      [flare, from + 0.6],
      [R, from + 2],
    ];
    if (dent) {
      const mid = from + len / 2;
      profile.push([R, mid - 1.6], [R * 0.88, mid - 1.1], [R * 0.88, mid + 1.1], [R, mid + 1.6]);
    }
    if (funnelAt === 'both')
      profile.push([R, to - 2], [flare, to - 0.6], [flare, to], [r + 0.35, to]);
    else profile.push([R, to - 0.4], [R - 0.4, to], [r + 0.05, to]);
    profile.push([r + 0.05, to - 0.5], [r + 0.35, from + 0.6], [r + 0.35, from]);
    return latheX(profile, 40);
  }, [from, to, r, dent, funnelAt]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <Material preset="pvc" color={color} roughness={0.38} clip />
    </mesh>
  );
}

export default function CrimpTerminal(props: CrimpTerminalProps) {
  const p = resolve(props as PartProps);
  const s = sizes(p.section, p.type);
  const back = p.crimped ? 0 : 5;
  if (p.type === 'ilhos') {
    const collar = s.collar;
    return (
      <group>
        <Sleeve
          from={-collar}
          to={0}
          r={s.insulationD / 2}
          color={FERRULE_COLORS[String(p.section)]!.hex}
          dent={false}
        />
        <Barrel from={-0.4} length={s.tube + 0.4} r={s.barrelR} wall={s.wall} dent={p.crimped} />
        <WireRun
          points={[
            [-collar - 30 - back, 0, 0],
            [s.tube - 0.2 - back, 0, 0],
          ]}
          section={p.section}
          kind="flexivel"
          color={p.color}
          strip={0}
          stripEnd={s.tube + 0.2}
          marking={false}
        />
      </group>
    );
  }
  if (p.type === 'luva') {
    const half = s.tube + 1;
    return (
      <group>
        <Sleeve
          from={-half - 2.5}
          to={half + 2.5}
          r={s.barrelR + s.wall}
          color={sleeveColor(p.section).hex}
          dent={false}
          funnelAt="both"
        />
        <Barrel from={-half} length={half - 0.5} r={s.barrelR} wall={s.wall} dent={p.crimped} />
        <Barrel from={0.5} length={half - 0.5} r={s.barrelR} wall={s.wall} dent={p.crimped} />
        <WireRun
          points={[
            [-half - 30, 0, 0],
            [-0.6 - back, 0, 0],
          ]}
          section={p.section}
          kind="flexivel"
          color={p.color}
          strip={0}
          stripEnd={s.strip}
          marking={false}
        />
        <WireRun
          points={[
            [half + 30, 0, 0],
            [0.6 + back, 0, 0],
          ]}
          section={p.section}
          kind="flexivel"
          color={p.color}
          strip={0}
          stripEnd={s.strip}
          marking={false}
        />
      </group>
    );
  }
  const sleeveFrom = -3.5;
  return (
    <group>
      <Sleeve
        from={sleeveFrom}
        to={s.tube + 0.6}
        r={s.barrelR + s.wall}
        color={sleeveColor(p.section).hex}
        dent={p.crimped}
      />
      <Barrel from={-0.5} length={s.tube} r={s.barrelR} wall={s.wall} dent={p.crimped} />
      <Tongue type={p.type} x={s.tube - 0.3} />
      <WireRun
        points={[
          [sleeveFrom - 30 - back, 0, 0],
          [s.tube - 1 - back, 0, 0],
        ]}
        section={p.section}
        kind="flexivel"
        color={p.color}
        strip={0}
        stripEnd={s.strip}
        marking={false}
      />
    </group>
  );
}
