import { FONT } from "../../data/theme.js";
import { TOKENS, TOKEN_RARITY, TOKEN_RARITY_COLOR } from "../../data/tokens.js";
import { GOLD, bevel } from "../map/mapTheme.js";
import { MK } from "../desk/mapKit.jsx";
import { TokenCard } from "./TokenCard.jsx";

// ─── COLLEZIONE PEDINE (home → Archivio) ─────────────────────────
// Metagame dei gettoni (G-01): si salva solo il catalogo di quelli visti
// almeno una volta. Scoperti = scheda completa; non ancora = sagoma e rarità.

const ORDER = ["base", "comune", "raro", "maledetto", "cianfrusaglia"];

function Silhouette({ id }) {
  const t = TOKENS[id];
  return (
    <div aria-label={`Pedina ${TOKEN_RARITY[t.rarity].label.toLowerCase()} non ancora scoperta`} style={{
      display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 12, alignItems: "center", padding: 12,
      background: "#0a0b0a", boxShadow: "inset 0 0 0 1px #2a2d2a", minHeight: 76,
    }}>
      <span aria-hidden style={{ width: 48, height: 48, display: "grid", placeItems: "center", background: "#141614",
        boxShadow: "inset 0 0 0 2px #262926", color: "#3a3f3a", fontSize: 22 }}>?</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ color: "#4a504a", fontSize: 13, letterSpacing: 2 }}>? ? ?</span>
        <span style={{ color: TOKEN_RARITY_COLOR[t.rarity], opacity: 0.6, fontSize: 10, letterSpacing: 1 }}>
          {TOKEN_RARITY[t.rarity].label.toUpperCase()} · da scoprire
        </span>
      </div>
    </div>
  );
}

export function TokenCollection({ discovered = [], onClose }) {
  const all = Object.keys(TOKENS);
  const found = all.filter(id => discovered.includes(id)).length;
  return (
    <div role="dialog" aria-modal="true" aria-label="Collezione pedine" onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 99000, background: "rgba(0,0,0,0.92)", fontFamily: FONT,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(1040px, 96vw)", maxHeight: "92vh", display: "flex", flexDirection: "column",
        background: MK.panel, boxShadow: `${bevel(GOLD, 2)}, 8px 8px 0 #000`, color: MK.txt,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderBottom: `2px solid ${GOLD.dark}` }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, letterSpacing: 3, color: MK.accent }}>ARCHIVIO</span>
            <span style={{ fontSize: 26, lineHeight: 1, color: GOLD.mid }}>PEDINE</span>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, color: MK.ink, lineHeight: 1.45 }}>
              Ogni gettone che trovi in una run finisce qui. Durano solo quella run: la collezione ricorda cosa hai visto.
            </span>
            <span style={{ display: "block", height: 6, background: "#050706", boxShadow: `inset 0 0 0 1px ${GOLD.lo}` }}>
              <span style={{ display: "block", height: "100%", width: `${(found / all.length) * 100}%`, background: GOLD.mid }} />
            </span>
          </div>
          <span style={{ fontSize: 18, color: GOLD.mid, whiteSpace: "nowrap" }}>{found} / {all.length}</span>
          <button type="button" onClick={onClose} aria-label="Chiudi" style={{ fontFamily: FONT, fontSize: 12, border: "none",
            padding: "8px 12px", cursor: "pointer", background: GOLD.mid, color: GOLD.dark, boxShadow: "2px 2px 0 #000" }}>CHIUDI</button>
        </div>

        <div style={{ overflowY: "auto", padding: "14px 18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {ORDER.map(rarity => {
            const ids = all.filter(id => TOKENS[id].rarity === rarity);
            if (!ids.length) return null;
            const n = ids.filter(id => discovered.includes(id)).length;
            return (
              <section key={rarity} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, borderBottom: `1px solid ${MK.line}`, paddingBottom: 4 }}>
                  <span style={{ fontSize: 13, letterSpacing: 2, color: TOKEN_RARITY_COLOR[rarity] }}>{TOKEN_RARITY[rarity].label.toUpperCase()}</span>
                  <span style={{ fontSize: 11, color: MK.dim }}>{n} / {ids.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
                  {ids.map(id => discovered.includes(id)
                    ? <TokenCard key={id} id={id} />
                    : <Silhouette key={id} id={id} />)}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
