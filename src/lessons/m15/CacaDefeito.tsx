/*
 * Lesson 15.1: find the fault in a 12 V lamp circuit. One part is bad
 * (hidden); the student moves the two probes between six test points, reads
 * the voltage and names the culprit. The fewer measurements, the better:
 * splitting the loop in half each time finds any of five parts in three.
 * Model and numbers in ./caca-defeito.ts.
 */
import { useId, useState } from 'react';
import {
  PARTS,
  POINTS,
  brightness,
  faultById,
  measure,
  pickFault,
  type PartId,
  type PointId,
} from './caca-defeito';
import '../m00/widget.css';
import './m15.css';

/** Meter-style reading: two decimals, comma, real minus sign. */
const volts = (v: number) =>
  `${(Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace('.', ',').replace('-', '−')} V`;

/** Where each test point sits in the drawing (viewBox 360 × 200). */
const AT: Record<PointId, [number, number]> = {
  TP0: [40, 40],
  TP1: [140, 40],
  TP2: [222, 40],
  TP3: [320, 40],
  TP4: [320, 160],
  TP5: [40, 160],
};

function Drawing({
  glow,
  switchOn,
  red,
  black,
  onPick,
}: {
  glow: number;
  switchOn: boolean;
  red: PointId;
  black: PointId;
  onPick: (p: PointId) => void;
}) {
  return (
    <svg viewBox="0 0 360 200" className="caca__desenho" aria-hidden="true">
      <g className="caca__fio">
        <path d="M40 40H80M120 40H160M200 40H244M268 40H320V80M320 120V160H40V100M40 88V40" />
      </g>
      {/* Battery: long plate +, short plate − */}
      <path d="M24 88h32" className="caca__fio" />
      <path d="M31 100h18" className="caca__fio caca__fio--grosso" />
      <text x="64" y="98" className="caca__rotulo">
        12 V
      </text>
      <text x="16" y="84" className="caca__sinal">
        +
      </text>
      {/* F1 */}
      <rect x="80" y="33" width="40" height="14" rx="7" className="caca__peca" />
      <path d="M84 40h32" className="caca__fio" />
      <text x="100" y="26" className="caca__rotulo caca__rotulo--meio">
        F1
      </text>
      {/* S1 */}
      <circle cx="162" cy="40" r="2.5" className="caca__no" />
      <circle cx="198" cy="40" r="2.5" className="caca__no" />
      <path d={switchOn ? 'M162 40L196 37' : 'M162 40L192 22'} className="caca__fio" />
      <text x="180" y="62" className="caca__rotulo caca__rotulo--meio">
        S1
      </text>
      {/* X1 */}
      <rect x="244" y="30" width="24" height="20" rx="3" className="caca__peca" />
      <circle cx="256" cy="40" r="4" className="caca__fio" />
      <text x="256" y="66" className="caca__rotulo caca__rotulo--meio">
        X1
      </text>
      {/* L1 */}
      <circle cx="320" cy="100" r="20" className="caca__lampada" style={{ fillOpacity: glow }} />
      <circle cx="320" cy="100" r="20" className="caca__peca caca__peca--vazia" />
      <path d="M306 86l28 28M334 86l-28 28" className="caca__fio" />
      <text x="292" y="104" className="caca__rotulo caca__rotulo--fim">
        L1
      </text>
      <text x="180" y="180" className="caca__rotulo caca__rotulo--meio">
        fio de retorno
      </text>
      {POINTS.map((p) => {
        const [x, y] = AT[p.id];
        const probe = p.id === red ? 'red' : p.id === black ? 'black' : undefined;
        return (
          <g key={p.id} className="caca__tp" data-probe={probe} onClick={() => onPick(p.id)}>
            <circle cx={x} cy={y} r="9" className="caca__tp-alvo" />
            <circle cx={x} cy={y} r="5" className="caca__tp-ponto" />
            <text
              x={x + (x > 300 ? -12 : 12)}
              y={y + (y < 100 ? -10 : 18)}
              className={`caca__tp-nome ${x > 300 ? 'caca__rotulo--fim' : ''}`}
            >
              {p.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function CacaDefeito() {
  const id = useId();
  const [seed, setSeed] = useState(3);
  const [faultId, setFaultId] = useState(() => pickFault(3).id);
  const [switchOn, setSwitchOn] = useState(true);
  const [red, setRed] = useState<PointId>('TP1');
  const [black, setBlack] = useState<PointId>('TP5');
  const [log, setLog] = useState<{ red: PointId; black: PointId; v: number; on: boolean }[]>([]);
  const [guess, setGuess] = useState<PartId | null>(null);
  const [done, setDone] = useState(false);

  const fault = faultById(faultId);
  const v = measure(fault, switchOn, red, black);
  const glow = brightness(fault, switchOn);
  const right = guess === fault.part;

  const record = () => setLog((l) => [{ red, black, v, on: switchOn }, ...l].slice(0, 8));
  const restart = () => {
    const next = pickFault(seed + 1, faultId);
    setSeed(seed + 1);
    setFaultId(next.id);
    setSwitchOn(true);
    setLog([]);
    setGuess(null);
    setDone(false);
  };
  // A click on a point moves the red probe; with the red already there, the black.
  const pick = (p: PointId) => (p === red ? setBlack(p) : setRed(p));

  return (
    <section className="lw caca" aria-labelledby={`${id}-titulo`}>
      <header className="lw__head">
        <p className="lw__kicker">Simulação</p>
        <h3 id={`${id}-titulo`} className="lw__title">
          Encontre o defeito
        </h3>
        <p className="lw__lead">
          Uma das cinco partes do circuito está com defeito. Ponha as pontas do voltímetro em dois
          pontos de teste, anote a leitura e descubra qual é, com o menor número de medidas.
        </p>
      </header>
      <div className="lw__body">
        <p className="caca__sintoma">
          <strong>Sintoma:</strong> {switchOn ? fault.symptom : 'Interruptor desligado.'}
        </p>
        <Drawing glow={glow} switchOn={switchOn} red={red} black={black} onPick={pick} />
        <div className="lw__controls lw__controls--cols">
          <div className="lw__field">
            <label htmlFor={`${id}-red`}>Ponta vermelha</label>
            <select
              id={`${id}-red`}
              value={red}
              onChange={(e) => setRed(e.target.value as PointId)}
            >
              {POINTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="lw__field">
            <label htmlFor={`${id}-black`}>Ponta preta</label>
            <select
              id={`${id}-black`}
              value={black}
              onChange={(e) => setBlack(e.target.value as PointId)}
            >
              {POINTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <label className="lw__check">
            <input
              type="checkbox"
              checked={switchOn}
              onChange={(e) => setSwitchOn(e.target.checked)}
            />
            Interruptor S1 ligado
          </label>
        </div>
        <div className="lw__output" aria-live="polite">
          <p className="lw__value-label">
            Voltímetro ({red} → {black})
          </p>
          <p className="lw__value caca__leitura" data-leitura>
            {volts(v)}
          </p>
          <div>
            <button type="button" className="lw__btn" onClick={record}>
              Anotar a medida
            </button>
          </div>
        </div>
        {log.length > 0 && (
          <div className="caca__log">
            <p className="lw__value-label">Anotações ({log.length})</p>
            <ol>
              {log.map((m, i) => (
                <li key={log.length - i}>
                  {m.red} → {m.black}: <span className="num">{volts(m.v)}</span>
                  {m.on ? '' : ' (S1 desligado)'}
                </li>
              ))}
            </ol>
          </div>
        )}
        <fieldset className="lw__group">
          <legend className="lw__legend">Qual parte está com defeito?</legend>
          <div className="lw__choices">
            {PARTS.map((p) => (
              <label key={p.id} className="lw__choice">
                <input
                  type="radio"
                  name={`${id}-palpite`}
                  checked={guess === p.id}
                  disabled={done}
                  onChange={() => setGuess(p.id)}
                />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="lw__output" aria-live="polite">
          {done ? (
            <>
              <p
                className="caca__resultado"
                data-ok={right ? '' : undefined}
                data-erro={right ? undefined : ''}
              >
                <strong>
                  {right
                    ? 'Achou!'
                    : `Não era: o defeito estava em ${PARTS.find((p) => p.id === fault.part)!.name.toLowerCase()}.`}
                </strong>{' '}
                {fault.cause}
              </p>
              <p className="lw__note">
                Você mediu {log.length === 1 ? '1 vez' : `${log.length} vezes`}. Dividindo o
                circuito ao meio a cada medida, três bastam para achar qualquer uma das cinco
                partes.
              </p>
              <div>
                <button type="button" className="lw__btn lw__btn--primary" onClick={restart}>
                  Outro defeito
                </button>
              </div>
            </>
          ) : (
            <div>
              <button
                type="button"
                className="lw__btn lw__btn--primary"
                disabled={guess === null}
                onClick={() => setDone(true)}
              >
                Confirmar
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
