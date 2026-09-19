import { useState, useLayoutEffect, useRef } from "react";
import { FONT } from "../../data/theme.js";
import { normalizePortrait } from "../../utils/nail.js";
import { hasAsset } from "../../assets/registry.js";
import { Asset } from "../Asset.jsx";
import { Tooltip } from "../Tooltip.jsx";
import { TABLE_BG } from "../scratch/ScratchTable.jsx";

// ─── IL DIALOGO — evento / NPC su desktop ────────────────────────
// Stesso linguaggio della soglia (node/NodeThreshold.jsx): fondo a righe del
// titolo, pannello nero a retino con filo, oro/avorio, spigoli netti.
// Colonna centrata: ritratto medio, tipo, nome, battuta, poi le scelte come
// righe a tutta larghezza (numero, testo, chip a destra).
// Solo presentazione: testi, scelte, condizioni e callback arrivano da
// EventView invariati.

// Chiaro come il tavolo della grattata (carta crema, inchiostro scuro, bancone
// di legno): scura resta solo la lotta.
const GOLD = "#8a5a12", INK = "#153f42", MUTED = "#5d6f68", CREAM = "#fff3c4", PAPER2 = "#fbeebc";
const RED = "#a3161d", EDGE = "#d9c27a", SHADOW = "#3a1f0f";
const BLACK = CREAM;
const TABLE = TABLE_BG;
const frame = (edge = INK) => `inset 0 0 0 2px ${EDGE}, inset 0 0 0 4px ${edge}, 5px 5px 0 ${SHADOW}`;

// Colore del cartellino tipo: niente neon, stessa tavolozza della soglia.
function tagColor(cat) {
  if (cat.danger >= 2) return RED;
  if (cat.label === "EVENTO") return "#9a3a78";
  if (cat.danger === 1) return "#b0661a";
  if (cat.label === "OGGETTO") return MUTED;
  return INK;
}

// Chip a destra: il costo in oro, i badge rischiosi in rosso, l'uscita spenta.
function chipColor(badge, isCost) {
  if (isCost) return GOLD;
  if (badge === "COMBATTI" || badge === "TRADIMENTO" || badge === "SCAPPA") return RED;
  if (badge === "ESCI" || badge === "GRATIS") return MUTED;
  return GOLD;
}

// Altezza disponibile: dal bordo alto del pannello al fondo dell'area che
// scorre (il DESK). Così la pagina non scorre; se le scelte sono tante, scorre
// solo l'interno del palco.
function useFitHeight(ref, deps) {
  const [h, setH] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let box = el.parentElement;
    while (box && box !== document.body) {
      const oy = getComputedStyle(box).overflowY;
      if (oy === "auto" || oy === "scroll") break;
      box = box.parentElement;
    }
    const inBox = box && box !== document.body;
    const bottom = inBox ? box.getBoundingClientRect().bottom : window.innerHeight;
    // 10px = margine inferiore del palco
    setH(Math.max(420, Math.floor(bottom - el.getBoundingClientRect().top - 10)));
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return h;
}

export function EventStage({
  node, ev, cat, bigArt, blink, vw, vh,
  typedText, typingDone, onSkip,
  choices, onChoice,
}) {
  const rootRef = useRef(null);
  const height = useFitHeight(rootRef, [vw, vh]);
  const [hover, setHover] = useState(-1);
  const tag = tagColor(cat);
  const spriteId = hasAsset(`spr-${node.type}`) && !node.secret ? `spr-${node.type}` : null;
  // Molte scelte (es. Poliziotto, 7): pannello più largo, ritratto piccolo
  // accanto al nome e risposte due per riga, così niente scroll.
  const compact = choices.length > 4;
  const pic = compact ? 104 : 188;

  return (
    <div ref={rootRef} style={{
      flex: "1 1 0", minWidth: 0, minHeight: 0, width: "100%", margin: 0,
      height: height ? `${height}px` : "100%", boxSizing: "border-box",
      background: TABLE, boxShadow: "none",
      overflowY: "auto", padding: compact ? "14px 20px" : "20px",
      justifyContent: "center",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: FONT, color: INK,
    }}>
      <style>{`@keyframes evStageCursor { 0%,100% { opacity:1; } 50% { opacity:0; } }`}</style>

      <article aria-label={ev.title} style={{
        width: compact ? "min(100%, 920px)" : "min(100%, 680px)", boxSizing: "border-box", background: BLACK,
        boxShadow: frame(tag), padding: compact ? "16px 22px 18px" : "20px 24px 22px", flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center", gap: compact ? "10px" : "12px", textAlign: "center",
      }}>
        <div style={{ display: "flex", flexDirection: compact ? "row" : "column", alignItems: "center", gap: compact ? "18px" : "12px",
          alignSelf: compact ? "stretch" : "center", textAlign: compact ? "left" : "center" }}>
        {/* Ritratto medio: padding perché il filo oro resti visibile su tutti i lati */}
        <div style={{ width: pic, height: pic, padding: "4px", boxSizing: "border-box", background: "#1a1410",
          boxShadow: `inset 0 0 0 2px ${INK}, 4px 4px 0 ${SHADOW}`, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {spriteId ? (
            <Asset id={spriteId} size={pic - 8} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : bigArt ? (
            <pre style={{ margin: 0, color: "#e9c46a", fontSize: "11px", lineHeight: 1.2, fontFamily: FONT, textAlign: "left" }}>
              {normalizePortrait(bigArt).map((line, i) => {
                const t = blink && (i === 4 || i === 5) ? line.replace(/[•◕⊕∞☠><=;.]/g, "─") : line;
                return <span key={i}>{t}{"\n"}</span>;
              })}
            </pre>
          ) : (
            <span style={{ fontSize: compact ? "52px" : "80px", lineHeight: 1 }}>{node.secret ? "🔮" : cat.icon}</span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: compact ? "flex-start" : "center", gap: "10px", minWidth: 0 }}>
        {/* Tipo + pericolo */}
        <div style={{ display: "flex", gap: "8px", justifyContent: compact ? "flex-start" : "center", alignItems: "center" }}>
          <span style={{ fontSize: "11px", letterSpacing: "2px", padding: "2px 8px", color: CREAM, background: tag }}>{cat.label}</span>
          {cat.danger > 0 && (
            <span aria-label={`Pericolo ${cat.danger} su 3`} style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "2px 6px", boxShadow: `inset 0 0 0 1px ${EDGE}` }}>
              <span style={{ fontSize: "10px", letterSpacing: "2px", color: MUTED, marginRight: "3px" }}>PERICOLO</span>
              {[1, 2, 3].map(i => (
                <span key={i} style={{ width: "8px", height: "8px", background: i <= cat.danger ? RED : EDGE }} />
              ))}
            </span>
          )}
        </div>

        <h2 style={{ margin: 0, fontSize: "30px", fontWeight: "normal", color: INK, letterSpacing: "1px", lineHeight: 1.1 }}>{ev.title}</h2>
        </div>
        </div>

        {/* Battuta: clic per saltare la scrittura */}
        <div onClick={onSkip} style={{
          width: "100%", boxSizing: "border-box", padding: "12px 16px", background: PAPER2,
          boxShadow: `inset 0 0 0 1px ${EDGE}`, cursor: typingDone ? "default" : "pointer",
          position: "relative", minHeight: compact ? "0" : "76px",
        }}>
          <p style={{ margin: "0 auto", maxWidth: "52ch", fontSize: "15px", lineHeight: 1.6, color: INK }}>
            {typedText}
            {!typingDone && <span style={{ color: INK, animation: "evStageCursor 0.6s step-start infinite", marginLeft: "1px" }}>▌</span>}
          </p>
          {!typingDone && (
            <span style={{ position: "absolute", right: "8px", bottom: "4px", fontSize: "10px", letterSpacing: "1px", color: MUTED }}>clicca per saltare →</span>
          )}
        </div>

        {/* Scelte */}
        {typingDone && (
          <div style={{ width: "100%", display: "grid", gridTemplateColumns: compact ? "repeat(2, minmax(0,1fr))" : "minmax(0,1fr)", gap: compact ? "8px" : "6px", marginTop: "2px" }}>
            <span style={{ gridColumn: "1 / -1", fontSize: "11px", letterSpacing: "3px", color: MUTED }}>SCEGLI</span>
            {choices.map((ch, i) => {
              const off = ch.isDisabled;
              const on = !off && hover === i;
              const chipCol = off ? "#b8a878" : chipColor(ch.badge, !!ch.cost);
              const act = () => { if (!off) onChoice(ch.action); };
              return (
                <Tooltip key={i} text={ch.tooltip || (off && ch.disabledNote ? `⛔ ${ch.disabledNote}` : "")}>
                  <div
                    role="button" tabIndex={off ? -1 : 0} aria-disabled={off || undefined}
                    onClick={act}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } }}
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(h => (h === i ? -1 : h))}
                    onFocus={() => setHover(i)} onBlur={() => setHover(h => (h === i ? -1 : h))}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px", height: compact ? "100%" : undefined, minHeight: compact ? "48px" : "46px", padding: compact ? "4px 10px 4px 5px" : "6px 10px 6px 6px",
                      boxSizing: "border-box", textAlign: "left", userSelect: "none", outline: "none",
                      background: on ? "#fff9dc" : off ? "#f3e6b4" : PAPER2,
                      boxShadow: `inset 0 0 0 ${on ? 2 : 1}px ${on ? INK : EDGE}${off ? "" : `, 3px 3px 0 ${EDGE}`}`,
                      cursor: off ? "not-allowed" : "pointer",
                    }}>
                    <span style={{
                      flexShrink: 0, width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", color: off ? "#b8a878" : on ? CREAM : INK, background: on ? INK : CREAM,
                      boxShadow: on ? "none" : `inset 0 0 0 1px ${off ? EDGE : INK}`,
                    }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: "14px", lineHeight: 1.4, color: off ? "#9a8a60" : INK }}>
                      {ch.label}
                      {off && ch.disabledNote && (
                        <span style={{ display: "block", fontSize: "12px", marginTop: "3px", color: RED }}>⛔ {ch.disabledNote}</span>
                      )}
                    </span>
                    <span style={{
                      flexShrink: 0, minWidth: "48px", textAlign: "center", padding: "3px 8px", fontSize: "11px", letterSpacing: "1px",
                      whiteSpace: "nowrap", color: chipCol, background: CREAM, boxShadow: `inset 0 0 0 1px ${chipCol}`,
                    }}>{ch.cost || ch.badge}</span>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        )}
      </article>
    </div>
  );
}
