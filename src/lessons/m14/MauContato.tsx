/*
 * Lesson 14.6: how much heat a bad connection makes. The power in a contact
 * is P = I² × R: tiny resistances, big currents. Presets for a shower, an
 * outlet with a heater and a 12 V LED strip; the contact resistance goes
 * from a good splice (about 1 mΩ) to a loose one (0,5 Ω).
 */
import { useId, useState } from 'react';
import { formatNumber } from '../m00/formato';
import '../m00/widget.css';
import './m14.css';

const LOADS = [
  { id: 'chuveiro', label: 'Chuveiro de 5.500 W em 220 V', current: 25 },
  { id: 'aquecedor', label: 'Aquecedor de 1.500 W em 127 V', current: 11.8 },
  { id: 'fita', label: 'Fita de LED de 60 W em 12 V', current: 5 },
];

/** Contact resistance steps (Ω), log-spaced. */
const R_STEPS = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5];

function verdict(p: number): string {
  if (p < 1) return 'Normal: uma emenda bem feita dissipa isso sem esquentar de verdade.';
  if (p < 5)
    return 'Esquenta ao toque com o tempo: a isolação envelhece, o cobre oxida e o contato piora.';
  if (p < 15)
    return 'Calor de uma lâmpada inteira concentrado num ponto: a fita e a isolação amolecem e escurecem.';
  return 'Calor de um ferro de solda dentro da caixa de passagem: derrete o plástico e pode começar um incêndio.';
}

const ohms = (r: number) => (r < 1 ? `${formatNumber(r * 1000, 0)} mΩ` : `${formatNumber(r, 1)} Ω`);

export default function MauContato() {
  const id = useId();
  const [load, setLoad] = useState('chuveiro');
  const [step, setStep] = useState(1);
  const current = LOADS.find((l) => l.id === load)!.current;
  const r = R_STEPS[step]!;
  const p = current ** 2 * r;
  return (
    <section className="lw mau-contato" aria-labelledby={`${id}-titulo`}>
      <header className="lw__head">
        <p className="lw__kicker">Calcule</p>
        <h3 id={`${id}-titulo`} className="lw__title">
          Quanto esquenta uma emenda ruim
        </h3>
        <p className="lw__lead">
          Escolha a carga e a resistência do contato. A potência que vira calor na emenda é I² × R.
        </p>
      </header>
      <div className="lw__body">
        <div className="lw__controls">
          <fieldset className="lw__group">
            <legend className="lw__legend">Carga</legend>
            <div className="lw__choices lw__choices--stack">
              {LOADS.map((l) => (
                <label key={l.id} className="lw__choice">
                  <input
                    type="radio"
                    name={`${id}-carga`}
                    checked={load === l.id}
                    onChange={() => setLoad(l.id)}
                  />
                  {l.label} ({formatNumber(l.current, 1)} A)
                </label>
              ))}
            </div>
          </fieldset>
          <div className="lw__range">
            <div className="lw__range-head">
              <label htmlFor={`${id}-r`}>Resistência do contato</label>
              <span className="num">{ohms(r)}</span>
            </div>
            <input
              id={`${id}-r`}
              type="range"
              min={0}
              max={R_STEPS.length - 1}
              step={1}
              value={step}
              aria-valuetext={ohms(r)}
              onChange={(e) => setStep(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="lw__output" aria-live="polite">
          <p className="lw__value-label">Calor na emenda</p>
          <p className="lw__value" data-potencia>
            {formatNumber(p, p < 10 ? 1 : 0)} W
          </p>
          <p className="lw__formula">
            P = I² × R = ({formatNumber(current, 1)} A)² × {ohms(r)}
          </p>
          <p>{verdict(p)}</p>
        </div>
      </div>
    </section>
  );
}
