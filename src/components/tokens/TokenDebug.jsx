import { useState } from "react";
import { FONT } from "../../data/theme.js";
import { TOKENS, TOKEN_RARITY, TOKEN_RARITY_COLOR, TOKEN_RELEASE, TOKEN_TAGS } from "../../data/tokens.js";
import { GOLD, bevel } from "../map/mapTheme.js";
import { Pedina } from "../map/Pedina.jsx";
import { TokenCard } from "./TokenCard.jsx";
import { TokenVisualLayer } from "./TokenVisualLayer.jsx";
import { TOKEN_VISUALS, visualWrapperStyle } from "./tokenVisuals.js";

// ─── MODALITÀ DEBUG — CATALOGO GETTONI ───────────────────────────
// Solo sviluppo/playtest. Mostra tutti i gettoni con scheda, a cosa servono
// (utile / simpatico / visivo), se sono già in gioco, e per quelli visivi
// un'anteprima dell'effetto più PROVA SUL GIOCO (lo applica allo schermo).

const TAG = {
  utile:     { label: "UTILE",     color: "#7be08a", hint: "cambia soldi, fortuna o percorso" },
  simpatico: { label: "SIMPATICO", color: "#ffb04a", hint: "ha una trovata divertente" },
  visivo:    { label: "VISIVO",    color: "#e07aff", hint: "cambia come vedi il gioco" },
};

const FILTERS = [
  { id: "all", label: "TUTTI", test: () => true },
  { id: "utile", label: "UTILI", test: (id) => TOKEN_TAGS[id]?.includes("utile") },
  { id: "simpatico", label: "SIMPATICI", test: (id) => TOKEN_TAGS[id]?.includes("simpatico") },
  { id: "visivo", label: "VISIVI", test: (id) => TOKEN_TAGS[id]?.includes("visivo") },
  { id: "live", label: "IN GIOCO", test: (id) => TOKEN_RELEASE.includes(id) },
  { id: "todo", label: "EFFETTO DA COLLEGARE", test: (id) => !!TOKENS[id].todo },
];

const chip = (color, filled = false) => ({
  fontSize: "9px", letterSpacing: "1px", padding: "2px 5px", whiteSpace: "nowrap",
  color: filled ? "#000" : color, background: filled ? color : "transparent", boxShadow: `inset 0 0 0 1px ${color}`,
});

const btn = (main) => ({
  fontFamily: FONT, fontSize: "10px", letterSpacing: "1px", padding: "6px 8px", border: "none", cursor: "pointer",
  background: main ? GOLD.mid : "#3a332a", color: main ? GOLD.dark : "#f2e6c8", boxShadow: "2px 2px 0 #000",
});

// Mini scena di prova: tre caselle-nodo, la pedina, un prezzo. L'effetto
// visivo ci viene applicato sopra come sullo schermo vero.
function VisualSwatch({ id, visual, reducedMotion }) {
  const tile = (bg, glyph) => (
    <span style={{ width: 26, height: 26, background: bg, color: "#fff", fontSize: 12, display: "flex",
      alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 2px #000" }}>{glyph}</span>
  );
  const mirror = visual.map === "mirror";
  return (
    <div style={{ position: "relative", height: 64, overflow: "hidden", background: "#1b2a28", boxShadow: "inset 0 0 0 2px #000" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        flexDirection: mirror ? "row-reverse" : "row", ...visualWrapperStyle(visual, reducedMotion, { demo: true }) }}>
        <Pedina id={id} size={28} />
        {tile("#b8342a", "▲")}{tile("#2f8a3a", "✚")}{tile("#7a3ab8", "?")}
        <span style={{ fontFamily: FONT, color: "#f2cf44", fontSize: 14 }}>€25</span>
        {mirror && <span style={{ fontFamily: FONT, color: "#ff6a6a", fontSize: 10 }}>BOSS</span>}
      </div>
      <TokenVisualLayer overlay={visual.overlay} reducedMotion={reducedMotion} small />
    </div>
  );
}

export function TokenDebug({ onClose, onPreview, onGive, canGive, reducedMotion = false }) {
  const [filter, setFilter] = useState("all");
  const f = FILTERS.find(x => x.id === filter);
  const ids = Object.keys(TOKENS).filter(f.test);

  return (
    <div role="dialog" aria-modal="true" aria-label="Debug gettoni" style={{
      position: "fixed", inset: 0, zIndex: 99997, background: "rgba(0,0,0,.88)", fontFamily: FONT,
      display: "flex", flexDirection: "column", color: "#f2e6c8",
    }}>
      {/* ── Testata ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "#16130f", boxShadow: bevel(GOLD, 2), flexWrap: "wrap" }}>
        <span style={{ fontSize: 16, letterSpacing: 3, color: GOLD.mid }}>DEBUG · GETTONI {Object.keys(TOKENS).length}</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTERS.map(x => {
            const n = Object.keys(TOKENS).filter(x.test).length;
            const on = x.id === filter;
            return (
              <button key={x.id} type="button" onClick={() => setFilter(x.id)} aria-pressed={on}
                style={{ ...btn(on), padding: "5px 8px" }}>{x.label} {n}</button>
            );
          })}
        </div>
        <button type="button" onClick={onClose} style={{ ...btn(true), marginLeft: "auto" }}>CHIUDI ✕</button>
      </div>

      {/* ── Legenda ── */}
      <div style={{ display: "flex", gap: 16, padding: "8px 20px", fontSize: 10, color: "#c8c0a8", flexWrap: "wrap" }}>
        {Object.values(TAG).map(t => <span key={t.label}><span style={chip(t.color)}>{t.label}</span> {t.hint}</span>)}
        <span><span style={chip("#7be08a", true)}>IN GIOCO</span> si trova già nella run</span>
        <span><span style={chip("#ff7a6a")}>EFFETTO DA COLLEGARE</span> la grafica c'è, l'effetto di gioco no</span>
      </div>

      {/* ── Griglia ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 24px",
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, alignContent: "start" }}>
        {ids.map(id => {
          const t = TOKENS[id];
          const visual = TOKEN_VISUALS[t.visual];
          const live = TOKEN_RELEASE.includes(id);
          return (
            <div key={id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10, background: "#0d0c0a", boxShadow: "inset 0 0 0 1px #3a332a" }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                <span style={chip(TOKEN_RARITY_COLOR[t.rarity])}>{TOKEN_RARITY[t.rarity].label.toUpperCase()}</span>
                {(TOKEN_TAGS[id] || []).map(tag => <span key={tag} style={chip(TAG[tag].color)}>{TAG[tag].label}</span>)}
                {live
                  ? <span style={chip("#7be08a", true)}>IN GIOCO</span>
                  : t.todo ? <span style={chip("#ff7a6a")}>EFFETTO DA COLLEGARE</span>
                  : <span style={chip("#8a8070")}>IN ARRIVO</span>}
                <span style={{ marginLeft: "auto", fontSize: 9, color: "#6d6552" }}>{id}</span>
              </div>
              <TokenCard id={id} />
              {visual && (
                <>
                  <div style={{ fontSize: 10, color: "#e07aff", letterSpacing: 1 }}>EFFETTO VISIVO · {visual.label.toUpperCase()}</div>
                  <VisualSwatch id={id} visual={visual} reducedMotion={reducedMotion} />
                </>
              )}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                {visual && <button type="button" style={btn(true)} onClick={() => onPreview(id)}>PROVA SUL GIOCO</button>}
                {canGive && <button type="button" style={btn(false)} onClick={() => onGive(id)}>DAI ALLA RUN</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Barra mostrata mentre un effetto è in prova sullo schermo.
export function TokenPreviewBar({ id, onStop, onCatalog }) {
  const visual = TOKEN_VISUALS[TOKENS[id]?.visual];
  return (
    <div style={{ position: "fixed", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 99998, fontFamily: FONT,
      display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "#16130f", boxShadow: `${bevel(GOLD, 1)}, 3px 3px 0 #000`, color: "#f2e6c8", fontSize: 11 }}>
      <Pedina id={id} size={20} />
      <span>PROVA: {TOKENS[id]?.name} · {visual?.label}{visual?.map ? " (si vede sulla mappa)" : ""}</span>
      <button type="button" style={btn(false)} onClick={onCatalog}>CATALOGO</button>
      <button type="button" style={btn(true)} onClick={onStop}>TOGLI</button>
    </div>
  );
}
