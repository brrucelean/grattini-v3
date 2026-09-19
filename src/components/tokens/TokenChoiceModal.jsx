import { FONT } from "../../data/theme.js";
import { GOLD, bevel } from "../map/mapTheme.js";
import { TokenCard } from "./TokenCard.jsx";

// ─── SCEGLI UN GETTONE ───────────────────────────────────────────
// Compensazione del boss (G-01): se nel bioma non hai preso nessun gettone,
// il boss ne lascia cadere due comuni e ne tieni uno.

export function TokenChoiceModal({ ids, onPick, title = "Il boss lascia cadere due gettoni", sub = "Non hai preso nessuna pedina in questo quartiere. Tienine una." }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Scegli un gettone" style={{
      position: "fixed", inset: 0, zIndex: 99995, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.8)", padding: 16, fontFamily: FONT,
    }}>
      <div style={{
        width: "min(720px, 100%)", background: "#16130f", boxShadow: `${bevel(GOLD, 2)}, 8px 8px 0 #000`,
        padding: 20, display: "flex", flexDirection: "column", gap: 14, color: "#f2e6c8",
      }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 18, letterSpacing: 2, color: GOLD.mid }}>{title}</span>
          <span style={{ fontSize: 12, color: "#c8c0a8" }}>{sub}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${ids.length}, minmax(0,1fr))`, gap: 12 }}>
          {ids.map(id => (
            <div key={id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <TokenCard id={id} />
              <button type="button" onClick={() => onPick(id)} style={{
                height: 40, border: "none", cursor: "pointer", fontFamily: FONT, fontSize: 13, letterSpacing: 2,
                background: GOLD.mid, color: GOLD.dark, boxShadow: `inset 0 0 0 2px ${GOLD.dark}, 3px 3px 0 #000`,
              }}>PRENDO QUESTO</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
