import { useState, useCallback, useRef } from "react";
import { C } from "../data/theme.js";
import { NPC_CARMELO_COMMENTS } from "../data/art.js";

export const LOG_MAX = 3000;

export function useLog() {
  const [log, setLog] = useState([]);
  const [carmeloLog, setCarmeloLog] = useState([]);

  // id progressivo: il ticker in basso si rimonta a ogni voce nuova. Prima usava
  // log.length come chiave, che si ferma a 21 quando il log è pieno: da lì in
  // poi i messaggi nuovi non scorrevano più.
  // Lo scontrino (P-08) tiene tutta la partita per poterla rileggere: prima si
  // tenevano solo le ultime 21 voci. LOG_MAX è solo un tetto di sicurezza
  // (una run intera sta molto sotto), si azzera a ogni nuova run (setLog([])).
  const nextId = useRef(0);
  const addLog = useCallback((text, color) => {
    const id = ++nextId.current;
    setLog(l => [...(l.length >= LOG_MAX ? l.slice(-(LOG_MAX - 1)) : l), { id, text, color: color || C.dim }]);
  }, []);

  // prefix: frase di contesto prima della battuta (es. "Il Poveraccio: €8.")
  const triggerNpcComment = useCallback((category, prefix = "") => {
    const pool = NPC_CARMELO_COMMENTS[category];
    if (!pool) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const text = !prefix ? pick : Array.isArray(pick) ? [{ t: prefix + " " }, ...pick] : `${prefix} ${pick}`;
    setCarmeloLog(l => [...l, text]);
  }, []);

  return { log, setLog, carmeloLog, setCarmeloLog, addLog, triggerNpcComment };
}
