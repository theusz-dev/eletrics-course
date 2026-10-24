/*
 * Lesson 14.3: "o que é isso?". One part of the timer board is highlighted
 * (in 3D and on the 2D map); the student picks what kind of component it is
 * and gets the clue that gives it away. Eight rounds, then the score.
 */
import { useId, useMemo, useState } from 'react';
import Viewer from '../../three/core/Viewer';
import { meta as boardMeta } from '../../three/parts/relay-timer-board';
import { kindName, makeRounds } from './jogo-placa';
import PlacaMapa from './PlacaMapa';
import '../m00/widget.css';
import './m14.css';

export default function JogoPlaca({ poster }: { poster?: string }) {
  const id = useId();
  const [seed, setSeed] = useState(1);
  const rounds = useMemo(() => makeRounds(seed), [seed]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const done = index >= rounds.length;
  const round = rounds[Math.min(index, rounds.length - 1)]!;
  const props = useMemo(() => ({ highlight: round.ref, labels: false }), [round.ref]);
  const right = chosen === round.answer;

  const choose = (kind: string) => {
    if (chosen) return;
    setChosen(kind);
    if (kind === round.answer) setScore((s) => s + 1);
  };
  const next = () => {
    setChosen(null);
    setIndex((i) => i + 1);
  };
  const restart = () => {
    setSeed((s) => s + 1);
    setIndex(0);
    setChosen(null);
    setScore(0);
  };

  return (
    <section className="lw jogo-placa" aria-labelledby={`${id}-titulo`}>
      <header className="lw__head">
        <p className="lw__kicker">Jogo</p>
        <h3 id={`${id}-titulo`} className="lw__title">
          O que é isso?
        </h3>
        <p className="lw__lead">
          Uma peça da placa fica em destaque. Gire a placa, aproxime e diga o que ela é.
        </p>
      </header>
      <div className="lw__body">
        <div className="placa-dupla">
          <div className="placa-3d">
            <Viewer
              part="relay-timer-board"
              props={props}
              height={320}
              poster={poster}
              label="Modelo 3D: placa temporizadora com uma peça em destaque"
              description={boardMeta.describe?.({ ...boardMeta.defaults, ...props })}
            />
          </div>
          <PlacaMapa selected={done ? undefined : round.ref} refs={false} />
        </div>
        {done ? (
          <div className="lw__output" aria-live="polite">
            <p className="lw__value-label">Resultado</p>
            <p className="lw__value jogo-placa__placar">
              {score} de {rounds.length}
            </p>
            <p className="lw__note">
              {score === rounds.length
                ? 'Todas certas: você já lê uma placa de verdade.'
                : 'Jogue de novo: as peças e a ordem mudam.'}
            </p>
            <div>
              <button type="button" className="lw__btn lw__btn--primary" onClick={restart}>
                Jogar de novo
              </button>
            </div>
          </div>
        ) : (
          <>
            <fieldset className="lw__group">
              <legend className="lw__legend">
                Peça {index + 1} de {rounds.length}: o que é a peça em destaque?
              </legend>
              <div className="lw__choices">
                {round.options.map((kind) => (
                  <label key={kind} className="lw__choice">
                    <input
                      type="radio"
                      name={`${id}-r${index}`}
                      checked={chosen === kind}
                      disabled={chosen !== null && chosen !== kind}
                      onChange={() => choose(kind)}
                    />
                    {kindName(kind)}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="lw__output" aria-live="polite">
              {chosen ? (
                <>
                  <p
                    className="jogo-placa__feedback"
                    data-ok={right ? '' : undefined}
                    data-erro={right ? undefined : ''}
                  >
                    <strong>
                      {right ? 'Certo!' : `Não: é ${kindName(round.answer).toLowerCase()}.`}
                    </strong>{' '}
                    {round.ref}: {round.clue}.
                  </p>
                  <div>
                    <button type="button" className="lw__btn lw__btn--primary" onClick={next}>
                      {index + 1 < rounds.length ? 'Próxima peça' : 'Ver o resultado'}
                    </button>
                  </div>
                </>
              ) : (
                <p className="lw__note">
                  Acertos: <span className="jogo-placa__placar">{score}</span>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
