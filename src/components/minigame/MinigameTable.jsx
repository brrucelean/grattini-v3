import { FONT } from "../../data/theme.js";
import { TABLE_BG, MAT_STYLE } from "../scratch/ScratchTable.jsx";

// ─── TAVOLO DEI MINIGIOCHI (desktop) ────────────────────────────
// Labirinto, Gratta & Combina e Mappa del Tesoro avevano ancora i vecchi
// pannelli al neon. Ora sono grattini veri sul tavolo della grattata: bancone
// di legno, tappetino verde, il biglietto stampato su carta crema con
// l'inchiostro del suo tema e caselle argentate da grattare. A destra la
// scheda "come si vince". Tutto in vista, senza scorrere.
// Solo presentazione: stato e regole restano in scratchlite.

const INK = "#153f42", MUTED = "#5d6f68", CREAM = "#fff3c4", EDGE = "#d9c27a", SHADOW = "#3a1f0f", RED = "#a3161d";

// Casella: argento a retino finché coperta, carta quando scoperta.
export function CoverCell({ revealed, onClick, children, size = 76, mark = null, disabled = false, label }) {
  const can = !revealed && !disabled && !!onClick;
  return (
    <button type="button" onClick={can ? onClick : undefined} disabled={!can} aria-label={label} style={{
      width: size, height: size, border: "none", padding: 0, fontFamily: FONT, position: "relative",
      cursor: can ? "pointer" : "default",
      background: revealed ? "#fffbe6" : "repeating-conic-gradient(#b9bec4 0% 25%, #c9ced3 0% 50%) 0 0 / 4px 4px",
      boxShadow: mark
        ? `inset 0 0 0 3px ${mark}`
        : revealed ? `inset 0 0 0 1px ${EDGE}` : "inset 2px 2px 0 #e4e8ec, inset -2px -2px 0 #8a9096",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: revealed ? Math.round(size * 0.4) : Math.round(size * 0.22), color: revealed ? INK : "#6c7278",
    }}>{revealed ? children : (children ?? "?")}</button>
  );
}

function ActionButton({ label, onClick, kind = "secondary", disabled = false }) {
  const primary = kind === "primary", danger = kind === "danger";
  return (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      height: "46px", padding: "0 20px", border: "none", fontFamily: FONT, fontSize: "15px", letterSpacing: "2px",
      cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.45 : 1,
      color: primary ? CREAM : danger ? RED : INK,
      background: primary ? INK : CREAM,
      boxShadow: primary ? `3px 3px 0 ${SHADOW}` : `inset 0 0 0 2px ${danger ? RED : INK}, 3px 3px 0 ${SHADOW}`,
    }}>{label}</button>
  );
}

export function MinigameTable({ title, emoji, accent, how, status, children, actions = [], rules = [] }) {
  return (
    <div style={{
      flex: 1, minHeight: 0, width: "100%", boxSizing: "border-box", padding: "16px", overflowY: "auto",
      background: TABLE_BG, fontFamily: FONT, color: INK,
      display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: "16px",
    }}>
      {/* ══ Il tappetino con il biglietto ══ */}
      <div style={{ ...MAT_STYLE, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "18px" }}>
        <article aria-label={title} style={{
          background: CREAM, boxShadow: `inset 0 0 0 3px ${accent}, inset 0 0 0 5px ${CREAM}, inset 0 0 0 6px ${accent}, 6px 6px 0 ${SHADOW}`,
          padding: "20px 26px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", maxWidth: "100%",
        }}>
          {/* testata stampata */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", textAlign: "center" }}>
            <span style={{ fontSize: "10px", letterSpacing: "3px", color: MUTED }}>GRATTA E VINCI · MINIGIOCO</span>
            <span style={{ fontSize: "28px", lineHeight: 1, color: accent, letterSpacing: "1px" }}>{emoji} {title}</span>
            <span style={{ fontSize: "12px", lineHeight: 1.45, color: INK, maxWidth: "52ch" }}>{how}</span>
          </div>
          {/* striscia di stato: premio accumulato, contatori */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            {status.map(([k, v, strong]) => (
              <span key={k} style={{ fontSize: "12px", padding: "4px 10px", background: strong ? accent : "#fbeebc",
                color: strong ? CREAM : INK, boxShadow: strong ? "none" : `inset 0 0 0 1px ${EDGE}` }}>
                {k} <b style={{ fontWeight: "normal", fontSize: "14px" }}>{v}</b>
              </span>
            ))}
          </div>
          {children}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginTop: "4px" }}>
            {actions.filter(Boolean).map(a => <ActionButton key={a.label} {...a} />)}
          </div>
        </article>
      </div>

      {/* ══ Come si vince ══ */}
      <aside style={{ background: CREAM, boxShadow: `inset 0 0 0 2px ${EDGE}, 5px 5px 0 ${SHADOW}`, padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: "10px", alignSelf: "start" }}>
        <span style={{ fontSize: "11px", letterSpacing: "2px", color: CREAM, background: INK, padding: "3px 8px", alignSelf: "flex-start" }}>COME SI VINCE</span>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
          {rules.map((r, i) => (
            <li key={i} style={{ fontSize: "12px", lineHeight: 1.5, paddingLeft: "10px", borderLeft: `3px solid ${i === rules.length - 1 ? RED : accent}` }}>{r}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
