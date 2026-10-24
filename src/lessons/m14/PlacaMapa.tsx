/*
 * Module 14: the timer board seen from the top, drawn in 2D from the same
 * layout as the 3D part: outline, top traces, pads and one clickable box per
 * component with its designator. The chips around it are the accessible way
 * to pick a part; this drawing is a pointer shortcut (aria-hidden).
 */
import {
  TIMER_BOARD,
  TIMER_PARTS,
  boardSize,
  timerBoardLayout,
} from '../../three/parts/_timer-board-layout';
import './m14.css';

const LAYOUT = timerBoardLayout();
const TOP_TRACES = (LAYOUT.traces ?? []).filter((t) => (t.side ?? 'top') === 'top');

export default function PlacaMapa({
  selected,
  onSelect,
  refs = true,
}: {
  selected?: string;
  onSelect?: (ref: string) => void;
  /** Show the designators (off for the "what is it?" game). */
  refs?: boolean;
}) {
  const { width: W, height: H } = TIMER_BOARD;
  return (
    <svg className="placa-mapa" viewBox={`-1 -1 ${W + 2} ${H + 2}`} aria-hidden="true">
      <rect className="placa-mapa__board" x={0} y={0} width={W} height={H} rx={2.5} />
      {TOP_TRACES.map((t, i) => (
        <polyline
          key={i}
          className="placa-mapa__trace"
          points={t.points.map((p) => p.join(',')).join(' ')}
          strokeWidth={t.width}
        />
      ))}
      {(LAYOUT.pads ?? []).map((pad) => {
        const size = typeof pad.size === 'number' ? pad.size : pad.size[0];
        return pad.shape === 'square' ? (
          <rect
            key={pad.id}
            className="placa-mapa__pad"
            x={pad.at[0] - size / 2}
            y={pad.at[1] - size / 2}
            width={size}
            height={size}
          />
        ) : (
          <circle
            key={pad.id}
            className="placa-mapa__pad"
            cx={pad.at[0]}
            cy={pad.at[1]}
            r={size / 2}
          />
        );
      })}
      {(LAYOUT.holes ?? []).map((h, i) => (
        <circle key={i} cx={h.at[0]} cy={h.at[1]} r={h.drill / 2} fill="#0b1d36" />
      ))}
      {TIMER_PARTS.map((part) => {
        const [w, h] = boardSize(part);
        return (
          <g
            key={part.ref}
            className="placa-mapa__part"
            data-ref={part.ref}
            data-on={selected === part.ref ? '' : undefined}
            onClick={() => onSelect?.(part.ref)}
          >
            <rect x={part.at[0] - w / 2} y={part.at[1] - h / 2} width={w} height={h} rx={0.8} />
            {refs && (
              <text x={part.at[0]} y={part.at[1]}>
                {part.ref}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
