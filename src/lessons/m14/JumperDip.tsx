/*
 * Lesson 14.4: the jumper and the DIP switch of the timer board, on the 3D
 * board. JP1 picks MONO (one pulse per press), PISCA (free running) or no
 * jumper; DIP key 1 (LONGO) adds C3, key 2 (BIP) the buzzer; the TEMPO
 * trimpot sets RV1. The relay follows the 555 timing in real time.
 */
import { useEffect, useId, useMemo, useState } from 'react';
import Viewer from '../../three/core/Viewer';
import { meta as boardMeta } from '../../three/parts/relay-timer-board';
import { formatNumber } from '../m00/formato';
import { blink, monoPulse, RV1_MAX, RV1_MIN, type JumperMode } from './temporizador';
import '../m00/widget.css';
import './m14.css';

const MODES: { value: JumperMode; label: string; pins: string }[] = [
  { value: 'mono', label: 'MONO', pins: 'pinos 1 e 2' },
  { value: 'pisca', label: 'PISCA', pins: 'pinos 2 e 3' },
  { value: 'sem-jumper', label: 'Sem jumper', pins: 'nenhum' },
];

const seconds = (t: number) =>
  t < 10 ? `${formatNumber(t, 1)} s` : `${formatNumber(Math.round(t), 0)} s`;

function JumperDrawing({ mode }: { mode: JumperMode }) {
  const at = mode === 'mono' ? 0 : mode === 'pisca' ? 1 : -1;
  return (
    <svg
      viewBox="0 0 90 40"
      className="jumper-dip__desenho"
      role="img"
      aria-label={`Jumper JP1: ${MODES.find((m) => m.value === mode)!.pins}`}
    >
      <text x={8} y={36} fontSize={6} fill="currentColor">
        MONO
      </text>
      <text x={60} y={36} fontSize={6} fill="currentColor">
        PISCA
      </text>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={17 + i * 22} y={10} width={12} height={12} rx={1} fill="#1c1c1e" />
          <rect x={21 + i * 22} y={14} width={4} height={4} fill="#d6b45a" />
          <text x={23 + i * 22} y={8} fontSize={5.5} textAnchor="middle" fill="currentColor">
            {i + 1}
          </text>
        </g>
      ))}
      {at >= 0 && (
        <rect
          x={14 + at * 22}
          y={11.5}
          width={40}
          height={9}
          rx={2}
          fill="#2b2b2e"
          stroke="#000"
          opacity={0.92}
        />
      )}
    </svg>
  );
}

export default function JumperDip({ poster }: { poster?: string }) {
  const id = useId();
  const [mode, setMode] = useState<JumperMode>('mono');
  const [longo, setLongo] = useState(false);
  const [bip, setBip] = useState(false);
  const [rv1, setRv1] = useState(100_000);
  const [on, setOn] = useState(false);
  const [until, setUntil] = useState(0);

  const pulse = monoPulse({ longo, rv1 });
  const b = blink({ longo, rv1 });

  // PISCA: the relay toggles by itself. MONO: one pulse after each press.
  useEffect(() => {
    if (mode === 'pisca') {
      const timer = setTimeout(() => setOn((v) => !v), (on ? b.on : b.off) * 1000);
      return () => clearTimeout(timer);
    }
    if (mode === 'mono' && on) {
      const timer = setTimeout(() => setOn(false), Math.max(until - performance.now(), 0));
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [mode, on, b.on, b.off, until]);

  const chooseMode = (m: JumperMode) => {
    setMode(m);
    setOn(m === 'pisca');
  };
  const press = () => {
    if (mode !== 'mono' || on) return;
    setUntil(performance.now() + pulse * 1000);
    setOn(true);
  };

  const props = useMemo(
    () => ({
      mode,
      longo,
      bip,
      time: (rv1 - RV1_MIN) / (RV1_MAX - RV1_MIN),
      relayOn: on,
      labels: false,
    }),
    [mode, longo, bip, rv1, on],
  );

  const behaviour =
    mode === 'mono'
      ? `Cada aperto no DISPARO liga o relé por ${seconds(pulse)} (1,1 × R × C).`
      : mode === 'pisca'
        ? `O relé fica ${seconds(b.on)} ligado e ${seconds(b.off)} desligado, sem parar.`
        : 'Sem o jumper, o pino 2 do 555 fica solto: a placa pode disparar sozinha com ruído, ou nunca. Comportamento imprevisível.';

  return (
    <section className="lw jumper-dip" aria-labelledby={`${id}-titulo`}>
      <header className="lw__head">
        <p className="lw__kicker">Explore</p>
        <h3 id={`${id}-titulo`} className="lw__title">
          Configure a placa temporizadora
        </h3>
        <p className="lw__lead">
          Mude o jumper, as chaves DIP e o trimpot. O relé da placa segue o tempo do 555, em tempo
          real.
        </p>
      </header>
      <div className="lw__body">
        <div className="lw__controls lw__controls--cols">
          <fieldset className="lw__group">
            <legend className="lw__legend">Jumper JP1 (MODO)</legend>
            <div className="lw__choices">
              {MODES.map((m) => (
                <label key={m.value} className="lw__choice">
                  <input
                    type="radio"
                    name={`${id}-modo`}
                    checked={mode === m.value}
                    onChange={() => chooseMode(m.value)}
                  />
                  {m.label}
                </label>
              ))}
            </div>
            <JumperDrawing mode={mode} />
          </fieldset>
          <fieldset className="lw__group">
            <legend className="lw__legend">Chave DIP SW1</legend>
            <label className="lw__check">
              <input type="checkbox" checked={longo} onChange={(e) => setLongo(e.target.checked)} />
              1: LONGO (liga C3, de 100 µF)
            </label>
            <label className="lw__check">
              <input type="checkbox" checked={bip} onChange={(e) => setBip(e.target.checked)} />
              2: BIP (liga o buzzer)
            </label>
          </fieldset>
          <div className="lw__range">
            <div className="lw__range-head">
              <label htmlFor={`${id}-rv1`}>Trimpot TEMPO (RV1)</label>
              <span className="num">{formatNumber(rv1 / 1000, 0)} kΩ</span>
            </div>
            <input
              id={`${id}-rv1`}
              type="range"
              min={RV1_MIN}
              max={RV1_MAX}
              step={10_000}
              value={rv1}
              onChange={(e) => setRv1(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="placa-3d">
          <Viewer
            part="relay-timer-board"
            props={props}
            height={300}
            poster={poster}
            label="Modelo 3D: placa temporizadora com o jumper e a chave DIP"
            description={boardMeta.describe?.({ ...boardMeta.defaults, ...props })}
          />
        </div>
        <div className="lw__output" aria-live="polite">
          <div className="jumper-dip__estado">
            <button
              type="button"
              className="lw__btn lw__btn--primary"
              onClick={press}
              disabled={mode !== 'mono' || on}
            >
              Apertar DISPARO
            </button>
            <span className="jumper-dip__lampada" data-on={on ? '' : undefined}>
              Relé {on ? 'ligado' : 'desligado'}
            </span>
            <span className="lw__note">
              Buzzer: {bip ? (on ? 'apitando' : 'em silêncio') : 'desligado na DIP'}
            </span>
          </div>
          <p>{behaviour}</p>
          <p className="lw__formula">
            C = {longo ? '10 µF + 100 µF = 110 µF' : '10 µF'}; R = R3 + RV1 = 1 kΩ +{' '}
            {formatNumber(rv1 / 1000, 0)} kΩ
          </p>
        </div>
      </div>
    </section>
  );
}
