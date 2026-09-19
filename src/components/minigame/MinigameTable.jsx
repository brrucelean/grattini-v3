import { FONT } from "../../data/theme.js";
import { TABLE_BG, MAT_STYLE } from "../scratch/ScratchTable.jsx";
import { TICKET_LAYOUT, TICKET_LAYOUT_FALLBACK } from "../../data/ticketLayout.js";
import { assetUrl } from "../../assets/registry.js";

// ─── TAVOLO DEI MINIGIOCHI (desktop) ────────────────────────────
// Labirinto, Gratta & Combina e Mappa del Tesoro avevano ancora i vecchi
// pannelli al neon. Ora sono grattini veri sul tavolo della grattata: bancone
// di legno, tappetino verde, il biglietto stampato su carta crema con
// l'inchiostro del suo tema e caselle argentate da grattare. A destra la
// scheda "come si vince". Tutto in vista, senza scorrere.
// Solo presentazione: stato e regole restano in scratchlite.

const INK = "#153f42", CREAM = "#fff3c4", EDGE = "#d9c27a", SHADOW = "#3a1f0f", RED = "#a3161d";

// Casella: argento a retino finché coperta, carta quando scoperta.
export function CoverCell({ revealed, onClick, children, size = 76, mark = null, disabled = false, label }) {
  const can = !revealed && !disabled && !!onClick;
  const dim = typeof size === "number" ? `${size}px` : size;
  return (
    <button type="button" onClick={can ? onClick : undefined} disabled={!can} aria-label={label} style={{
      width: dim, height: dim, border: "none", padding: 0, fontFamily: FONT, position: "relative",
      cursor: can ? "pointer" : "default",
      background: revealed ? "#fffbe6" : "repeating-conic-gradient(#b9bec4 0% 25%, #c9ced3 0% 50%) 0 0 / 4px 4px",
      boxShadow: mark
        ? `inset 0 0 0 3px ${mark}`
        : revealed ? `inset 0 0 0 1px ${EDGE}` : "inset 2px 2px 0 #e4e8ec, inset -2px -2px 0 #8a9096",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: revealed ? `calc(${dim} * 0.42)` : `calc(${dim} * 0.24)`, color: revealed ? INK : "#6c7278",
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

// Il biglietto è l'illustrazione vera (ticket-<id>-v3): titolo nel cartiglio,
// griglia nel riquadro scuro (zone da TICKET_LAYOUT, come gli altri grattini).
// Il riquadro è un container: i figli possono dimensionarsi in cqh/cqw.
export function MinigameTable({ ticketId, title, emoji, accent, how, status, children, actions = [], rules = [] }) {
  const lay = TICKET_LAYOUT[ticketId] || TICKET_LAYOUT_FALLBACK;
  const box = (z) => ({ position: "absolute", top: `${z.top}%`, left: `${z.left}%`, right: `${z.right}%`, bottom: `${z.bottom}%` });
  const art = assetUrl(`ticket-${ticketId}-v3`);
  return (
    <div style={{
      flex: 1, minHeight: 0, width: "100%", boxSizing: "border-box", padding: "16px", overflow: "hidden",
      background: TABLE_BG, fontFamily: FONT, color: INK,
      display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: "16px",
    }}>
      {/* ══ Il tappetino con il biglietto ══ */}
      <div style={{ ...MAT_STYLE, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", padding: "18px" }}>
        <div style={{ flex: 1, minHeight: 0, width: "100%", containerType: "size", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <article aria-label={title} style={{
            position: "relative", width: "min(100cqw, 100cqh * 4 / 3)", aspectRatio: "4 / 3",
            background: art ? `url(${art}) center / 100% 100% no-repeat` : CREAM, imageRendering: "pixelated",
            filter: `drop-shadow(6px 6px 0 ${SHADOW})`,
          }}>
            {/* cartiglio: titolo stampato */}
            <div style={{ ...box(lay.header), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", textAlign: "center", padding: "0 6px" }}>
              <span style={{ fontSize: "clamp(16px, 2.6cqw, 30px)", lineHeight: 1, color: INK, letterSpacing: "1px" }}>{title.toUpperCase()}</span>
              <span style={{ fontSize: "clamp(13px, 1.7cqw, 17px)", lineHeight: 1.35, color: INK }}>{how}</span>
            </div>
            {/* riquadro di gioco */}
            <div style={{ ...box(lay.play), containerType: "size" }}>
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {children}
              </div>
            </div>
          </article>
        </div>
        {/* striscia di stato + azioni, sotto il biglietto */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
          {status.map(([k, v, strong]) => (
            <span key={k} style={{ fontSize: "12px", padding: "6px 10px", background: strong ? accent : CREAM,
              color: strong ? CREAM : INK, boxShadow: strong ? `3px 3px 0 ${SHADOW}` : `inset 0 0 0 1px ${EDGE}, 3px 3px 0 ${SHADOW}` }}>
              {k} <b style={{ fontWeight: "normal", fontSize: "14px" }}>{v}</b>
            </span>
          ))}
          <span style={{ width: "12px" }} />
          {actions.filter(Boolean).map(a => <ActionButton key={a.label} {...a} />)}
        </div>
      </div>

      {/* ══ Come si vince ══ */}
      <aside style={{ background: CREAM, boxShadow: `inset 0 0 0 2px ${EDGE}, 5px 5px 0 ${SHADOW}`, padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: "10px", alignSelf: "start" }}>
        <span style={{ fontSize: "11px", letterSpacing: "2px", color: CREAM, background: INK, padding: "3px 8px", alignSelf: "flex-start" }}>{emoji} COME SI VINCE</span>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
          {rules.map((r, i) => (
            <li key={i} style={{ fontSize: "12px", lineHeight: 1.5, paddingLeft: "10px", borderLeft: `3px solid ${i === rules.length - 1 ? RED : accent}` }}>{r}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
