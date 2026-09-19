import { C, FONT } from "../../data/theme.js";
import { SH } from "../shell/shellTokens.js";
import { BIOME_THEME, GOLD, dither } from "../map/mapTheme.js";

// ─── KIT MINIMAL "COME LA MAPPA" ────────────────────────────────
// Le schermate di passaggio (intro, scelta biglietti, Doppio o Nulla,
// cedole, fine partita, cella, titolo) usano gli stessi colori della mappa:
// tavolo verde scuro a retino, pannelli neri a filo sottile con ombra dura,
// testo grigio-verde, accento ciano, bottoni oro. Niente neon, glow o carta.

const T = BIOME_THEME[0];
export const MK = {
  bg: dither(T.board, T.board2),
  panel: T.marquee, line: SH.line, lineHi: SH.lineHi,
  txt: C.text, ink: T.ink, dim: C.dim, accent: T.accent,
  red: C.red, green: C.green, gold: GOLD,
};
export const mkPanel = (edge = MK.line) => ({ background: MK.panel, boxShadow: `inset 0 0 0 2px ${edge}, ${SH.shadow}` });

export function MkButton({ children, onClick, kind = "primary", disabled = false, style, ...rest }) {
  const primary = kind === "primary", danger = kind === "danger";
  return (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} {...rest} style={{
      height: "40px", padding: "0 16px", border: "none", fontFamily: FONT, fontSize: "13px", letterSpacing: "2px",
      cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.45 : 1,
      color: primary ? GOLD.dark : danger ? MK.red : MK.ink,
      background: primary ? GOLD.mid : "transparent",
      boxShadow: primary ? `inset 0 0 0 2px ${GOLD.dark}, inset 2px 2px 0 2px ${GOLD.hi}, ${SH.shadow}` : `inset 0 0 0 2px ${danger ? MK.red : MK.line}`,
      ...style,
    }}>{children}</button>
  );
}

// Schermata: tavolo pieno, colonna centrata, scorre solo se serve.
export function MkScreen({ children, width = 1000, center = false, style }) {
  return (
    <div style={{
      flex: 1, minHeight: 0, width: "100%", boxSizing: "border-box", padding: "20px", overflowY: "auto",
      background: MK.bg, fontFamily: FONT, color: MK.txt,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: center ? "center" : "flex-start", gap: "18px",
      ...style,
    }}>
      <div style={{ width: `min(100%, ${width}px)`, display: "flex", flexDirection: "column", gap: "16px" }}>{children}</div>
    </div>
  );
}

// Intestazione: etichetta ciano piccola, titolo, riga di contesto.
export function MkTitle({ label, title, sub, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", textAlign: "center" }}>
      {label && <span style={{ fontSize: "11px", letterSpacing: "3px", color: MK.accent }}>{label}</span>}
      <span style={{ fontSize: "30px", lineHeight: 1, color: color || MK.txt, letterSpacing: "1px" }}>{title}</span>
      {sub && <span style={{ fontSize: "13px", color: MK.ink, lineHeight: 1.5 }}>{sub}</span>}
    </div>
  );
}
