/**
 * Close-up of through-hole solder joints on the solder side of a board: a row
 * of three leads at 2,54 mm in plated holes (pads Ø 2 mm, drill 1 mm, lead
 * Ø 0,6 mm), the middle one with the chosen joint and its neighbours with
 * good joints for comparison. The good joint is the textbook "volcano":
 * concave, shiny, wetting the whole pad and climbing the lead, with the
 * solder filling the plated hole. The cold joint is dull, grainy and round,
 * sitting on the pad without wetting it; too little solder leaves copper
 * showing and the hole half empty; too much makes a ball that hides the
 * lead; a bridge joins the joint to the neighbour.
 *
 * `stage` shows the soldering steps: heat pad and lead together with the
 * tip, feed the solder wire to the joint (not to the tip), take the wire
 * away, then the iron; `cut` trims the lead about 1 mm above the joint.
 *
 * Cutaway: the plane z = 0 cuts through the three holes, showing the solder
 * inside the barrel (or the void in the bad joints).
 */
import { useEffect, useMemo } from 'react';
import { CatmullRomCurve3, Vector3, type BufferGeometry } from 'three';
import { Anchor } from '../core/view';
import { Material } from '../materials/Material';
import { PrintedCircuitBoard } from '../pcb/PrintedCircuitBoard';
import type { PcbLayout } from '../pcb/layout';
import { axialLathe, tube } from '../shapes/geometry';
import { useDisposable } from '../shapes/Wire';
import type { PartAnnotation, PartMeta, PartProps, Vec3 } from '../types';

export type JointQuality = 'boa' | 'fria' | 'pouca' | 'excesso' | 'ponte' | 'sem-solda';
export type SolderStage = 'aquecer' | 'estanhar' | 'pronta';

export interface SolderJointProps {
  quality?: JointQuality;
  stage?: SolderStage;
  /** Lead trimmed about 1 mm above the joint. */
  cut?: boolean;
}

const QUALITIES: JointQuality[] = ['boa', 'fria', 'pouca', 'excesso', 'ponte', 'sem-solda'];
const STAGES: SolderStage[] = ['aquecer', 'estanhar', 'pronta'];

const QUALITY_LABELS: Record<JointQuality, string> = {
  boa: 'Boa (brilhante, em vulcão)',
  fria: 'Fria (fosca e granulada)',
  pouca: 'Pouca solda',
  excesso: 'Solda demais (bola)',
  ponte: 'Ponte com a vizinha',
  'sem-solda': 'Sem solda',
};

const STAGE_LABELS: Record<SolderStage, string> = {
  aquecer: '1. Aquecer a ilha e o terminal juntos',
  estanhar: '2. Encostar o fio de solda na junta',
  pronta: '3. Pronta (fio e ferro retirados)',
};

/** Board (mm): a strip with three pads, solder side up. */
const BOARD = { w: 12, h: 8, t: 1.6 };
const PITCH = 2.54;
const PAD_R = 1;
const DRILL_R = 0.5;
const LEAD_R = 0.3;
const TOP = BOARD.t;
const LEAD_BELOW = 2.5;
const LEAD_LONG = 5.5;
const LEAD_CUT = 1;
const XS = [-PITCH, 0, PITCH];

const LAYOUT: PcbLayout = {
  width: BOARD.w,
  height: BOARD.h,
  thickness: BOARD.t,
  corner: 0.6,
  mask: 'verde',
  copper: 'both',
  componentSide: 'bottom',
  pads: XS.map((x, i) => ({
    id: `P${i + 1}`,
    at: [BOARD.w / 2 + x, BOARD.h / 2] as [number, number],
    size: PAD_R * 2,
    drill: DRILL_R * 2,
    ...(i === 0 ? { shape: 'square' as const } : {}),
  })),
  traces: [
    {
      points: [
        [BOARD.w / 2 - PITCH, BOARD.h / 2],
        [BOARD.w / 2 - PITCH, 0.6],
      ],
      width: 0.8,
      side: 'top',
    },
    {
      points: [
        [BOARD.w / 2, BOARD.h / 2],
        [BOARD.w / 2, BOARD.h - 0.6],
      ],
      width: 0.8,
      side: 'top',
    },
    {
      points: [
        [BOARD.w / 2 + PITCH, BOARD.h / 2],
        [BOARD.w / 2 + PITCH + 2, BOARD.h / 2 - 2],
        [BOARD.w - 0.6, BOARD.h / 2 - 2],
      ],
      width: 0.8,
      side: 'top',
    },
  ],
};

const qualityOf = (v: unknown): JointQuality =>
  QUALITIES.includes(v as JointQuality) ? (v as JointQuality) : 'boa';
const stageOf = (v: unknown): SolderStage =>
  STAGES.includes(v as SolderStage) ? (v as SolderStage) : 'pronta';

function resolve(props: PartProps) {
  const p = { ...meta.defaults, ...props };
  return { quality: qualityOf(p.quality), stage: stageOf(p.stage), cut: p.cut !== false };
}

/** What the middle joint looks like at this stage. */
function shownJoint(quality: JointQuality, stage: SolderStage): JointQuality | 'parcial' {
  if (stage === 'aquecer') return 'sem-solda';
  if (stage === 'estanhar') return 'parcial';
  return quality;
}

/** Height of the joint above the pad (mm), where the lead leaves the solder. */
function jointHeight(joint: JointQuality | 'parcial'): number {
  switch (joint) {
    case 'boa':
      return 1.1;
    case 'fria':
      return 1.35;
    case 'pouca':
      return 0.4;
    case 'excesso':
    case 'ponte':
      return 2.2;
    case 'parcial':
      return 0.7;
    case 'sem-solda':
      return 0;
  }
}

const JOINT_TEXT: Record<JointQuality, string> = {
  boa: 'Junta boa: brilhante, côncava (em vulcão), cobrindo a ilha toda e subindo pelo terminal',
  fria: 'Junta fria: fosca, granulada e redonda; a solda não "molhou" a ilha e o contato falha',
  pouca: 'Pouca solda: cobre da ilha aparecendo e furo meio vazio; a junta racha com o tempo',
  excesso: 'Solda demais: uma bola que esconde o terminal e pode esconder uma junta fria por baixo',
  ponte: 'Ponte de solda: a junta encostou na vizinha e as duas viraram um nó só (curto)',
  'sem-solda': 'Terminal sem solda: só encostado no furo, sem contato confiável',
};

export const meta: PartMeta = {
  id: 'solder-joint',
  label: 'Junta de solda (PTH)',
  category: 'placas',
  summary:
    'Três terminais soldados numa placa, vistos do lado da solda: a junta do meio muda (boa, fria, pouca solda, solda demais, ponte) e as vizinhas ficam boas para comparar, com as etapas da soldagem.',
  defaults: { quality: 'boa', stage: 'pronta', cut: true },
  controls: {
    quality: {
      kind: 'select',
      label: 'Junta do meio',
      options: QUALITIES.map((q) => ({ value: q, label: QUALITY_LABELS[q] })),
    },
    stage: {
      kind: 'select',
      label: 'Etapa',
      options: STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] })),
    },
    cut: { kind: 'toggle', label: 'Terminal cortado' },
  },
  annotations: (props) => {
    const p = resolve(props);
    const joint = shownJoint(p.quality, p.stage);
    const list: PartAnnotation[] = [];
    if (p.stage === 'aquecer') {
      list.push({
        at: [-0.9, TOP + 0.6, 0],
        text: 'A ponta encosta na ilha e no terminal ao mesmo tempo: 2 a 3 segundos bastam',
      });
    } else if (p.stage === 'estanhar') {
      list.push({
        at: [0.9, TOP + 0.9, 0],
        text: 'O fio de solda vai na junta, do lado oposto à ponta: quem derrete a solda é a peça quente',
      });
      list.push({ at: [-4.5, 7, 0], text: 'Ponta do ferro (300 a 350 °C)' });
    } else {
      list.push({
        at: [0, TOP + jointHeight(joint) * 0.6, PAD_R * 0.6],
        text: JOINT_TEXT[p.quality],
      });
    }
    list.push({ at: [PITCH, TOP + 0.6, -PAD_R * 0.5], text: 'Junta boa ao lado, para comparar' });
    list.push({
      at: [-PITCH, TOP + 0.05, -1.6],
      text: 'Trilha de cobre, coberta pela máscara de solda verde',
    });
    list.push({
      at: [0, TOP / 2, 0],
      text: 'Furo metalizado: um tubo de cobre liga os dois lados e a solda boa sobe por dentro dele',
      exploded: false,
    });
    if (p.quality === 'ponte' && p.stage === 'pronta')
      list.push({
        at: [PITCH / 2, TOP + 0.6, 0],
        text: 'A ponte: tire o excesso com a malha dessoldadora',
      });
    return list;
  },
  cutaway: true,
  describe: (props) => {
    const p = resolve(props);
    const steps: Record<SolderStage, string> = {
      aquecer:
        'Primeira etapa: a ponta do ferro encosta ao mesmo tempo na ilha de cobre e no terminal do meio, para aquecer os dois.',
      estanhar:
        'Segunda etapa: com o ferro ainda encostado, o fio de solda toca a junta do lado oposto à ponta e derrete, escorrendo pela ilha e para dentro do furo.',
      pronta: `Junta do meio: ${JOINT_TEXT[p.quality].toLowerCase()}.`,
    };
    const lead = p.cut
      ? 'Os terminais foram cortados cerca de 1 mm acima da solda.'
      : 'Os terminais ainda estão compridos, sem cortar.';
    return `Três terminais de componente atravessam furos metalizados de uma placa verde, vista do lado da solda, com 2,54 mm entre eles. As juntas dos lados são boas: brilhantes, côncavas e cobrindo a ilha. ${steps[p.stage]} ${lead}`;
  },
  view: [0.4, 0.95, 1],
};

// ---------------------------------------------------------------------------
// Joint shapes: profiles [radius, height above the pad] for a lathe.
// ---------------------------------------------------------------------------

function concave(rBase: number, h: number, power: number, steps = 14): [number, number][] {
  const out: [number, number][] = [[rBase, -0.01]];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push([LEAD_R + 0.015 + (rBase - LEAD_R) * (1 - t) ** power, h * t]);
  }
  return out;
}

function profileOf(joint: JointQuality | 'parcial'): [number, number][] {
  switch (joint) {
    case 'boa':
      return concave(PAD_R, 1.1, 2.2);
    case 'parcial':
      return concave(PAD_R * 0.85, 0.7, 1.6);
    case 'pouca':
      return concave(0.62, 0.4, 1.4, 8);
    case 'fria':
      return [
        [0.68, -0.01],
        [0.86, 0.18],
        [0.97, 0.48],
        [0.95, 0.8],
        [0.8, 1.08],
        [0.56, 1.28],
        [LEAD_R + 0.02, 1.35],
      ];
    case 'excesso':
    case 'ponte':
      return [
        [PAD_R, -0.01],
        [1.22, 0.3],
        [1.32, 0.75],
        [1.26, 1.25],
        [1.02, 1.72],
        [0.66, 2.06],
        [LEAD_R + 0.02, 2.2],
      ];
    case 'sem-solda':
      return [];
  }
}

/** Smooths a coarse profile (Catmull-Rom through the points). */
function refine(profile: [number, number][], samples = 28): [number, number][] {
  if (profile.length < 4) return profile;
  const curve = new CatmullRomCurve3(profile.map(([r, y]) => new Vector3(r, y, 0)));
  return curve.getPoints(samples).map((v) => [v.x, v.y] as [number, number]);
}

/** Lumps on the surface of a cold joint (deterministic). */
function roughen(geometry: BufferGeometry, amount: number): BufferGeometry {
  const pos = geometry.attributes.position!;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < LEAD_R + 0.05) continue;
    const a = Math.atan2(z, x);
    const n =
      Math.sin(5 * a + 9 * y) * 0.5 +
      Math.sin(11 * a - 13 * y + 1.3) * 0.3 +
      Math.sin(3 * a + 2) * 0.4;
    const k = 1 + amount * n;
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function jointGeometry(joint: JointQuality | 'parcial'): BufferGeometry | null {
  const profile = profileOf(joint);
  if (!profile.length) return null;
  const smooth = joint === 'fria' || joint === 'excesso' || joint === 'ponte';
  const g = axialLathe(smooth ? refine(profile) : profile, 48);
  return joint === 'fria' ? roughen(g, 0.05) : g;
}

/** Solder inside the plated hole: full for good joints, partial or none for bad ones. */
function fillOf(joint: JointQuality | 'parcial'): number {
  if (joint === 'boa' || joint === 'excesso' || joint === 'ponte') return 1;
  if (joint === 'parcial') return 0.5;
  if (joint === 'pouca') return 0.3;
  return 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Lead({ x, cut, height }: { x: number; cut: boolean; height: number }) {
  const top = TOP + (cut ? Math.max(height, 0.2) + LEAD_CUT : LEAD_LONG);
  const geometry = useDisposable(
    () =>
      axialLathe(
        [
          [0, -LEAD_BELOW],
          [LEAD_R, -LEAD_BELOW],
          [LEAD_R, top - (cut ? 0.02 : 0.15)],
          [cut ? LEAD_R * 0.92 : LEAD_R * 0.6, top],
          [0, top],
        ],
        20,
      ),
    [top, cut],
  );
  return (
    <mesh geometry={geometry} position={[x, 0, 0]} castShadow>
      <Material preset="tin" color="#c9cccf" roughness={0.32} clip />
    </mesh>
  );
}

function Fill({ x, amount }: { x: number; amount: number }) {
  const geometry = useDisposable(
    () =>
      axialLathe(
        [
          [LEAD_R, TOP],
          [DRILL_R - 0.03, TOP],
          [DRILL_R - 0.03, TOP - BOARD.t * amount],
          [LEAD_R, TOP - BOARD.t * amount - 0.08],
        ],
        24,
      ),
    [amount],
  );
  if (amount <= 0) return null;
  return (
    <mesh geometry={geometry} position={[x, 0, 0]}>
      <Material preset="solder" clip />
    </mesh>
  );
}

function Joint({ x, joint }: { x: number; joint: JointQuality | 'parcial' }) {
  const geometry = useMemo(() => jointGeometry(joint), [joint]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  const cold = joint === 'fria';
  return (
    <mesh geometry={geometry} position={[x, TOP, 0]} castShadow receiveShadow>
      {cold ? (
        <Material preset="solder" color="#6f7273" roughness={0.55} clip />
      ) : (
        <Material preset="solder" clip />
      )}
    </mesh>
  );
}

/** The solder bridge between the middle joint and the right one. */
function Bridge() {
  return (
    <mesh position={[PITCH / 2, TOP + 0.55, 0]} scale={[1.55, 0.55, 0.75]} castShadow>
      <sphereGeometry args={[1, 32, 16]} />
      <Material preset="solder" clip />
    </mesh>
  );
}

/** Tip of the iron, leaning in from the left at 40°, touching pad and lead. */
function IronTip() {
  const geometry = useDisposable(
    () =>
      axialLathe(
        [
          [0, 0],
          [0.45, 0.05],
          [0.7, 0.6],
          [1.5, 5],
          [1.9, 9],
          [1.9, 10],
          [0, 10],
        ],
        32,
      ),
    [],
  );
  const angle = (40 * Math.PI) / 180;
  return (
    <group position={[-0.78, TOP + 0.2, 0]} rotation={[0, 0, angle]}>
      <mesh geometry={geometry} castShadow>
        <Material preset="tin" roughness={0.12} />
      </mesh>
      <mesh position={[0, 10 + 3, 0]} castShadow>
        <cylinderGeometry args={[2.6, 2.6, 6, 32]} />
        <Material preset="steel" color="#b9b2a6" roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Solder wire (Ø 1 mm) coming in from the right and melting on the joint. */
function SolderWire() {
  const geometry = useDisposable(() => {
    const curve = new CatmullRomCurve3(
      (
        [
          [0.75, TOP + 0.75, 0.15],
          [2.6, TOP + 2.4, 0.4],
          [5, TOP + 4.8, 0.6],
          [8, TOP + 7, 0.6],
        ] as Vec3[]
      ).map((v) => new Vector3(...v)),
    );
    return tube(curve, 0.5, { radial: 14 });
  }, []);
  return (
    <mesh geometry={geometry} castShadow>
      <Material preset="solder" roughness={0.3} />
    </mesh>
  );
}

export default function SolderJoint(props: SolderJointProps) {
  const p = resolve(props as PartProps);
  const joint = shownJoint(p.quality, p.stage);
  const neighbour: JointQuality = 'boa';
  const cut = p.cut && p.stage === 'pronta';
  return (
    <group position={[0, 0, 0]}>
      <PrintedCircuitBoard layout={LAYOUT} />
      {XS.map((x, i) => {
        const j = i === 1 ? joint : neighbour;
        return (
          <group key={i}>
            <Lead x={x} cut={cut} height={jointHeight(j)} />
            <Fill x={x} amount={fillOf(j)} />
            <Joint x={x} joint={j} />
          </group>
        );
      })}
      {joint === 'ponte' && <Bridge />}
      {p.stage !== 'pronta' && <IronTip />}
      {p.stage === 'estanhar' && <SolderWire />}
      <Anchor name="junta" position={[0, TOP + jointHeight(joint), 0]} />
    </group>
  );
}
