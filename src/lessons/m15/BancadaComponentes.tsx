/*
 * Lesson 15.2: a box of loose parts on the bench. The student picks a part,
 * runs the tests a multimeter can do on it (out of the circuit, without
 * power), reads the display and says whether the part is good. Data in
 * ./bancada.ts; about half the parts in each box are bad.
 */
import { useId, useState } from 'react';
import { FN_LABEL, PARTS, conditionFor, partById, spoken, type Reading } from './bancada';
import '../m00/widget.css';
import './m15.css';

function Display({ reading, fn }: { reading: Reading | null; fn: string }) {
  const visual = reading !== null && !reading.digits;
  return (
    <div className="bancada__visor" data-beep={reading?.beep ? '' : undefined}>
      <span className="bancada__funcao">{fn}</span>
      <span className="bancada__digitos" data-leitura>
        {reading === null ? '- - -' : visual ? '👁' : reading.digits}
      </span>
      <span className="bancada__unidade">{reading && !visual ? reading.unit : ''}</span>
      {reading?.beep && <span className="bancada__bip">bip</span>}
    </div>
  );
}

export default function BancadaComponentes() {
  const id = useId();
  const [seed, setSeed] = useState(1);
  const [partId, setPartId] = useState(PARTS[0]!.id);
  const [testId, setTestId] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Record<string, boolean | undefined>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const part = partById(partId);
  const condition = conditionFor(part, seed);
  const test = part.tests.find((t) => t.id === testId) ?? null;
  const reading = test ? condition.readings[test.id]! : null;
  const answer = verdict[part.id];
  const done = checked[part.id] === true;
  const right = answer === condition.good;
  const score = PARTS.filter(
    (p) => checked[p.id] && verdict[p.id] === conditionFor(p, seed).good,
  ).length;
  const answered = PARTS.filter((p) => checked[p.id]).length;

  const choosePart = (pid: string) => {
    setPartId(pid);
    setTestId(null);
  };
  const newBox = () => {
    setSeed(seed + 1);
    setVerdict({});
    setChecked({});
    setTestId(null);
  };

  return (
    <section className="lw bancada" aria-labelledby={`${id}-titulo`}>
      <header className="lw__head">
        <p className="lw__kicker">Bancada</p>
        <h3 id={`${id}-titulo`} className="lw__title">
          Bom ou ruim?
        </h3>
        <p className="lw__lead">
          Uma caixa com sete peças tiradas de aparelhos, todas fora do circuito e sem energia.
          Escolha uma peça, faça os testes e diga se ela está boa ou com defeito.
        </p>
      </header>
      <div className="lw__body">
        <div className="lw__field">
          <label htmlFor={`${id}-peca`}>Peça</label>
          <select id={`${id}-peca`} value={partId} onChange={(e) => choosePart(e.target.value)}>
            {PARTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {checked[p.id] ? ' (respondida)' : ''}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="lw__group">
          <legend className="lw__legend">Teste</legend>
          <div className="lw__choices lw__choices--stack">
            {part.tests.map((t) => (
              <label key={t.id} className="lw__choice">
                <input
                  type="radio"
                  name={`${id}-teste`}
                  checked={testId === t.id}
                  onChange={() => setTestId(t.id)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="lw__output" aria-live="polite">
          <Display reading={reading} fn={test ? FN_LABEL[test.fn] : 'Escolha um teste'} />
          <p className="lw__sr">{reading ? `Leitura: ${spoken(reading)}` : ''}</p>
          {reading?.note && <p className="bancada__nota">{reading.note}</p>}
        </div>
        <fieldset className="lw__group">
          <legend className="lw__legend">Veredito: {part.name}</legend>
          <div className="lw__choices">
            {[
              { good: true, label: 'Está boa' },
              { good: false, label: 'Está com defeito' },
            ].map((o) => (
              <label key={o.label} className="lw__choice">
                <input
                  type="radio"
                  name={`${id}-veredito-${part.id}`}
                  checked={answer === o.good}
                  disabled={done}
                  onChange={() => setVerdict({ ...verdict, [part.id]: o.good })}
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="lw__output" aria-live="polite">
          {done ? (
            <p
              className="bancada__veredito"
              data-ok={right ? '' : undefined}
              data-erro={right ? undefined : ''}
            >
              <strong>
                {right ? 'Certo' : 'Não'}: {condition.name.toLowerCase()}.
              </strong>{' '}
              {condition.explain}
            </p>
          ) : (
            <div>
              <button
                type="button"
                className="lw__btn lw__btn--primary"
                disabled={answer === undefined}
                onClick={() => setChecked({ ...checked, [part.id]: true })}
              >
                Confirmar
              </button>
            </div>
          )}
          <p className="lw__note">
            Acertos: <span className="bancada__placar">{score}</span> de {answered} respondidas,{' '}
            {PARTS.length} peças na caixa.
          </p>
          {answered === PARTS.length && (
            <div>
              <button type="button" className="lw__btn" onClick={newBox}>
                Outra caixa de peças
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
