import { C, FONT } from "../../data/theme.js";

// ─── TOKEN DELLA SHELL DESKTOP ───────────────────────────────────
// Una sola tabella di misure per barra, rail, log e ticker (griglia 8 px,
// docs/STATUS.md D-01). Niente glow, gradienti morbidi o angoli arrotondati:
// bordo netto da 2 px e ombra dura traslata.
export const SH = {
  font: FONT,
  // superfici
  world:  C.bg,        // vuoto dietro la scena
  panel:  C.card,      // barra, rail, log
  panel2: C.cardHi,    // elemento attivo
  line:   "#2c3a38",   // bordi strutturali
  lineHi: "#4a5c58",
  ink:    C.text,
  dim:    C.dim,
  shadow: "4px 4px 0 #000",
  // misure
  barH:    48,
  tickerH: 24,
  railW:   192,
  logW:    224,
  gap:     8,
};

// Bordo standard: 2 px pieno, colore del ruolo.
export const edge = (col = SH.line) => `2px solid ${col}`;

// Etichetta maiuscola piccola (sezioni di rail e log).
export const labelStyle = {
  fontFamily: SH.font, fontSize: "11px", letterSpacing: "1.5px",
  color: SH.dim, textTransform: "uppercase", lineHeight: 1,
};
