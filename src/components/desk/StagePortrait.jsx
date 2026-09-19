import { FONT } from "../../data/theme.js";
import { Asset } from "../Asset.jsx";
import { GOLD, bevel, dither } from "../map/mapTheme.js";

// ─── RITRATTO DI SCENA — soglia del nodo e dialoghi ─────────────
// Un solo ritratto per le due schermate, così restano uguali (proprietario,
// 2026-09-19): cornice d'oro a gradini, fondo scuro con un cono di luce del
// colore della scena, e il personaggio che respira piano, a scatti.
// Con "riduci movimento" resta fermo.

const CSS = `
  @keyframes stageBreathe { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  @media (prefers-reduced-motion: reduce) { .stage-breathe { animation: none !important; } }
`;

// spriteId: sprite del personaggio · art: righe ASCII di riserva · icon: emoji di riserva
export function StagePortrait({ spriteId, art = null, icon = "?", accent, size = 216 }) {
  return (
    <div style={{
      width: size, height: size, padding: 6, boxSizing: "border-box", overflow: "hidden", flexShrink: 0,
      background: `radial-gradient(60% 60% at 50% 40%, ${accent}33 0 50%, ${accent}1a 50% 70%, transparent 70%), ${dither("#0b1110", "#0f1716", 2)}`,
      boxShadow: `${bevel(GOLD, 2)}, 4px 4px 0 #000`, display: "grid", placeItems: "center",
    }}>
      <style>{CSS}</style>
      <div className="stage-breathe" style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", overflow: "hidden",
        animation: "stageBreathe 3.2s steps(4) infinite" }}>
        {spriteId ? (
          <Asset id={spriteId} size="100%" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : art ? (
          <pre style={{ margin: 0, color: GOLD.mid, fontSize: "11px", lineHeight: 1.2, fontFamily: FONT, textAlign: "left" }}>
            {art.map((line, i) => <span key={i}>{line}{"\n"}</span>)}
          </pre>
        ) : (
          <span style={{ fontSize: Math.round(size * 0.44), lineHeight: 1 }}>{icon}</span>
        )}
      </div>
    </div>
  );
}
