/*
 * Lesson 14.1: from the parts list to the board. Pick a designator (chips or
 * the 2D board map): the part lights up on the 3D board, and the card shows
 * its schematic symbol, what it is and what it does on this board.
 */
import { useId, useMemo, useState } from 'react';
import Viewer from '../../three/core/Viewer';
import { TIMER_PARTS, timerPart } from '../../three/parts/_timer-board-layout';
import { meta as boardMeta } from '../../three/parts/relay-timer-board';
import PlacaMapa from './PlacaMapa';
import { PartSymbol, SYMBOL_INFO } from './simbolos';
import '../m00/widget.css';
import './m14.css';

export default function EsquemaPlaca({ poster }: { poster?: string }) {
  const id = useId();
  const [ref, setRef] = useState('U1');
  const part = timerPart(ref)!;
  const info = SYMBOL_INFO[part.kind];
  const props = useMemo(() => ({ highlight: ref, labels: false }), [ref]);
  return (
    <section className="lw esquema-placa" aria-labelledby={`${id}-titulo`}>
      <header className="lw__head">
        <p className="lw__kicker">Explore</p>
        <h3 id={`${id}-titulo`} className="lw__title">
          Do designador à peça na placa
        </h3>
        <p className="lw__lead">
          Escolha um designador da lista de materiais. A peça se destaca na placa em 3D, e a ficha
          mostra o símbolo dela no esquema.
        </p>
      </header>
      <div className="lw__body">
        <fieldset className="lw__group">
          <legend className="lw__legend">Designadores</legend>
          <div className="placa-chips">
            {TIMER_PARTS.map((p) => (
              <label key={p.ref} className="lw__choice">
                <input
                  type="radio"
                  name={`${id}-ref`}
                  value={p.ref}
                  checked={ref === p.ref}
                  onChange={() => setRef(p.ref)}
                />
                {p.ref}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="placa-dupla">
          <PlacaMapa selected={ref} onSelect={setRef} />
          <div className="placa-3d">
            <Viewer
              part="relay-timer-board"
              props={props}
              height={300}
              poster={poster}
              label="Modelo 3D: placa temporizadora com relé"
              description={boardMeta.describe?.({ ...boardMeta.defaults, ...props })}
            />
          </div>
        </div>
        <div className="lw__output placa-ficha" aria-live="polite">
          <PartSymbol kind={part.kind} />
          <div>
            <p className="placa-ficha__ref">{ref}</p>
            <p>
              <strong>{part.name}.</strong> {part.role}.
            </p>
            <p className="lw__note">
              No esquema: {info.hint.charAt(0).toLowerCase() + info.hint.slice(1)}. Letras usadas:{' '}
              {info.letters}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
