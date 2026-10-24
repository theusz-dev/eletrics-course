/*
 * Lesson 14.1: the symbols of the timer board's parts, with the designator
 * letters. Static: rendered at build time, no JavaScript on the page.
 */
import type { TimerPartKind } from '../../three/parts/_timer-board-layout';
import { PartSymbol, SYMBOL_INFO } from './simbolos';
import './m14.css';

const ORDER: TimerPartKind[] = [
  'resistor',
  'trimpot',
  'ceramico',
  'eletrolitico',
  'diodo',
  'led',
  'transistor',
  'ci',
  'rele',
  'fusivel',
  'botao',
  'dip',
  'jumper',
  'borne',
  'conector',
  'buzzer',
];

export default function TabelaSimbolos() {
  return (
    <ul className="simbolos">
      {ORDER.map((kind) => {
        const info = SYMBOL_INFO[kind];
        return (
          <li key={kind}>
            <PartSymbol kind={kind} />
            <span>
              <strong>{info.name}</strong>
              <span className="num">{info.letters}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
