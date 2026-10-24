/*
 * Lesson 14.5: the soldering steps and the joint check on the 3D close-up
 * (`solder-joint`). "Passo a passo" walks heat → solder → withdraw → trim;
 * "Inspeção" switches the middle joint between good and the classic defects.
 */
import { useId, useMemo, useState } from 'react';
import Viewer from '../../three/core/Viewer';
import { meta as jointMeta, type JointQuality } from '../../three/parts/solder-joint';
import '../m00/widget.css';
import './m14.css';

const STEPS = [
  {
    title: 'Aquecer',
    stage: 'aquecer',
    cut: false,
    text: 'Encoste a ponta limpa e estanhada ao mesmo tempo na ilha e no terminal. Conte 1 ou 2 segundos: quem vai derreter a solda é a peça quente, não o ferro.',
  },
  {
    title: 'Aplicar a solda',
    stage: 'estanhar',
    cut: false,
    text: 'Encoste o fio de solda na junta, do lado oposto à ponta. Ele derrete, o fluxo limpa o cobre e a solda escorre pela ilha e entra no furo. Uns 2 a 5 mm de fio bastam.',
  },
  {
    title: 'Retirar o fio, depois o ferro',
    stage: 'pronta',
    cut: false,
    text: 'Tire primeiro o fio de solda e, um instante depois, o ferro. Não mexa a peça por alguns segundos, enquanto a solda esfria: um tremor agora dá junta fria.',
  },
  {
    title: 'Cortar o terminal',
    stage: 'pronta',
    cut: true,
    text: 'Com o alicate de corte rente, corte o excesso do terminal logo acima da junta, segurando a ponta para ela não voar. Confira: brilhante, em forma de vulcão, ilha coberta.',
  },
] as const;

const QUALITIES: { value: JointQuality; label: string; text: string }[] = [
  {
    value: 'boa',
    label: 'Boa',
    text: 'Brilhante e lisa, côncava como um vulcão, cobrindo a ilha toda e subindo pelo terminal. O contorno do terminal ainda aparece.',
  },
  {
    value: 'fria',
    label: 'Fria',
    text: 'Fosca, granulada, em forma de bola, com a borda da ilha aparecendo. A solda derreteu no ferro, mas a ilha ou o terminal não esquentaram: não houve liga. Mau contato que vai e volta.',
  },
  {
    value: 'pouca',
    label: 'Pouca solda',
    text: 'Um anel fino, com cobre aparecendo e o furo meio vazio. Conduz hoje, mas racha com a vibração e o calor. Reaqueça e acrescente solda.',
  },
  {
    value: 'excesso',
    label: 'Solda demais',
    text: 'Uma bola que esconde o terminal. Gasta solda, pode esconder uma junta fria por baixo e fica perto de encostar na vizinha. Tire o excesso com a malha.',
  },
  {
    value: 'ponte',
    label: 'Ponte',
    text: 'A solda uniu duas ilhas vizinhas: um curto-circuito entre dois pontos do circuito. Tire com a malha dessoldadora (ou arrastando a ponta limpa com fluxo).',
  },
];

export default function EtapasSolda({ poster }: { poster?: string }) {
  const id = useId();
  const [tab, setTab] = useState<'passos' | 'inspecao'>('passos');
  const [step, setStep] = useState(0);
  const [quality, setQuality] = useState<JointQuality>('boa');
  const s = STEPS[step]!;
  const q = QUALITIES.find((x) => x.value === quality)!;
  const props = useMemo(
    () =>
      tab === 'passos'
        ? { stage: s.stage, cut: s.cut, quality: 'boa' }
        : { stage: 'pronta', cut: true, quality },
    [tab, s.stage, s.cut, quality],
  );
  return (
    <section className="lw etapas-solda" aria-labelledby={`${id}-titulo`}>
      <header className="lw__head">
        <p className="lw__kicker">Explore</p>
        <h3 id={`${id}-titulo`} className="lw__title">
          Soldar e inspecionar uma junta
        </h3>
        <p className="lw__lead">
          Siga as etapas da soldagem ou compare a junta do meio com as vizinhas, que estão boas. Use
          o corte para ver a solda dentro do furo.
        </p>
      </header>
      <div className="lw__body">
        <div className="lw__choices" role="group" aria-label="Modo">
          <label className="lw__choice">
            <input
              type="radio"
              name={`${id}-tab`}
              checked={tab === 'passos'}
              onChange={() => setTab('passos')}
            />
            Passo a passo
          </label>
          <label className="lw__choice">
            <input
              type="radio"
              name={`${id}-tab`}
              checked={tab === 'inspecao'}
              onChange={() => setTab('inspecao')}
            />
            Inspeção
          </label>
        </div>
        <div className="placa-3d">
          <Viewer
            part="solder-joint"
            props={props}
            height={300}
            poster={poster}
            label="Modelo 3D: juntas de solda numa placa"
            description={jointMeta.describe?.({ ...jointMeta.defaults, ...props })}
          />
        </div>
        {tab === 'passos' ? (
          <div className="lw__output" aria-live="polite">
            <p className="lw__value-label">
              Etapa {step + 1} de {STEPS.length}: {s.title}
            </p>
            <p>{s.text}</p>
            <div className="lw__choices">
              <button
                type="button"
                className="lw__btn"
                onClick={() => setStep((i) => Math.max(i - 1, 0))}
                disabled={step === 0}
              >
                Voltar
              </button>
              <button
                type="button"
                className="lw__btn lw__btn--primary"
                onClick={() => setStep((i) => Math.min(i + 1, STEPS.length - 1))}
                disabled={step === STEPS.length - 1}
              >
                Próxima etapa
              </button>
            </div>
          </div>
        ) : (
          <>
            <fieldset className="lw__group">
              <legend className="lw__legend">Junta do meio</legend>
              <div className="lw__choices">
                {QUALITIES.map((x) => (
                  <label key={x.value} className="lw__choice">
                    <input
                      type="radio"
                      name={`${id}-q`}
                      checked={quality === x.value}
                      onChange={() => setQuality(x.value)}
                    />
                    {x.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="lw__output" aria-live="polite">
              <p>
                <strong>{q.label}.</strong> {q.text}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
