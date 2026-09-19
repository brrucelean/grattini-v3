import { FONT } from "../../data/theme.js";
import { TOKENS, TOKEN_RARITY, TOKEN_RARITY_COLOR as RARITY_COLOR } from "../../data/tokens.js";
import { Pedina } from "../map/Pedina.jsx";
import { GOLD, bevel } from "../map/mapTheme.js";

// ─── SCHEDA GETTONE — vantaggio, fregatura, quando ───────────────
// La stessa scheda nel pannello della mappa, nello zaino e nella scelta a
// custodia piena: il giocatore legge sempre le tre righe nello stesso ordine.

// Nella scheda compatta l'etichetta sta sopra il testo invece che a fianco:
// resta scritta per esteso (VANTAGGIO / FREGATURA) senza rubare larghezza.
const ROWS = [
  { key: "pro", label: "▲ VANTAGGIO", color: "#7be08a" },
  { key: "contro", label: "▼ FREGATURA", color: "#ff7a6a" },
  { key: "quando", label: "◷ QUANDO", color: "#c8c0a8" },
];

export function TokenCard({ id, compact = false, badge = null, fill = false }) {
  const t = TOKENS[id];
  if (!t) return null;
  const rarity = TOKEN_RARITY[t.rarity];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: compact ? "8px" : "12px", alignItems: "start",
      padding: compact ? "8px" : "12px", background: "#0d0c0a", boxShadow: bevel(GOLD, 1), fontFamily: FONT,
      position: "relative", color: "#f2e6c8", flex: fill ? 1 : undefined,
    }}>
      <Pedina id={id} size={compact ? 32 : 48} />
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: compact ? "3px" : "5px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: compact ? "12px" : "14px", color: GOLD.mid, letterSpacing: "1px" }}>{t.name}</span>
          <span style={{ fontSize: "10px", letterSpacing: "1px", color: RARITY_COLOR[t.rarity] }}>{rarity.label.toUpperCase()}</span>
        </div>
        {ROWS.map(r => (
          <div key={r.key} style={compact
            ? { display: "flex", flexDirection: "column", gap: "1px", fontSize: "11px", lineHeight: 1.3 }
            : { display: "grid", gridTemplateColumns: "96px minmax(0,1fr)", gap: "6px", fontSize: "11px", lineHeight: 1.35 }}>
            <span style={{ color: r.color, letterSpacing: "1px", fontSize: compact ? "9px" : undefined }}>{r.label}</span>
            <span style={{ color: r.key === "quando" ? "#a8987a" : undefined }}>{t[r.key]}</span>
          </div>
        ))}
      </div>
      {badge && (
        <span style={{
          position: "absolute", top: "-8px", right: "8px", fontSize: "9px", letterSpacing: "1px", padding: "2px 6px",
          background: GOLD.mid, color: GOLD.dark, boxShadow: `inset 0 0 0 1px ${GOLD.dark}`,
        }}>{badge}</span>
      )}
    </div>
  );
}
