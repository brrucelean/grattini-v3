import { useState } from "react";
import { FONT } from "../../data/theme.js";
import { normalizePortrait } from "../../utils/nail.js";
import { hasAsset } from "../../assets/registry.js";
import { Asset } from "../Asset.jsx";
import { Tooltip } from "../Tooltip.jsx";
import { GOLD, bevel } from "../map/mapTheme.js";
import { MK } from "../desk/mapKit.jsx";

// ─── IL DIALOGO — evento / NPC su desktop ────────────────────────
// Stesso sistema delle schermate di passaggio che funzionano (Nonno Carmelo,
// tutorial, Pedinaro, soglia del nodo): tavolo verde scuro a retino, pannelli
// neri a filo sottile, oro per ciò che si può fare. Prima era carta crema su
// legno, scollegata dal resto (proprietario, 2026-09-19).
// In alto il personaggio (ritratto, tipo, pericolo, nome), poi la sua battuta
// scritta a macchina, poi le scelte come righe (numero, testo, targhetta).
// Solo presentazione: testi, scelte, condizioni e callback arrivano da
// EventView invariati.

const TXT = MK.txt, INK = MK.ink, DIM = MK.dim;
const RED = "#e0564a";
const panel = (edge = MK.line) => ({ background: MK.panel, boxShadow: `inset 0 0 0 2px ${edge}, 5px 5px 0 #000` });

// Colore del cartellino tipo: gli stessi della legenda della mappa, accesi per il testo.
function tagColor(cat) {
  if (cat.danger >= 2) return RED;
  if (cat.label === "EVENTO") return "#d06aa8";
  if (cat.danger === 1) return "#f08a2a";
  if (cat.label === "OGGETTO") return INK;
  return MK.accent;
}

// Targhetta a destra: il costo in oro, le scelte rischiose in rosso, l'uscita spenta.
function chipColor(badge, isCost) {
  if (isCost) return GOLD.mid;
  if (badge === "COMBATTI" || badge === "TRADIMENTO" || badge === "SCAPPA") return RED;
  if (badge === "ESCI" || badge === "GRATIS") return DIM;
  return GOLD.mid;
}

export function EventStage({
  node, ev, cat, bigArt, blink,
  typedText, typingDone, onSkip,
  choices, onChoice,
}) {
  const [hover, setHover] = useState(-1);
  const tag = tagColor(cat);
  const spriteId = hasAsset(`spr-${node.type}`) && !node.secret ? `spr-${node.type}` : null;
  // Molte scelte (es. Poliziotto, 7): risposte due per riga, così niente scroll.
  const twoCols = choices.length > 4;
  const pic = 176;

  return (
    // Riempie tutta l'area: prima un'altezza calcolata in pixel lasciava una
    // fascia vuota sotto la scena.
    <div style={{
      flex: "1 1 0", minWidth: 0, minHeight: 0, width: "100%", alignSelf: "stretch", boxSizing: "border-box",
      background: MK.bg, overflowY: "auto", padding: "20px",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px",
      fontFamily: FONT, color: TXT,
    }}>
      <style>{`@keyframes evStageCursor { 0%,100% { opacity:1; } 50% { opacity:0; } }`}</style>

      <article aria-label={ev.title} style={{
        width: "min(100%, 1000px)", boxSizing: "border-box", ...panel(tag + "aa"), padding: "18px 22px 20px",
        flexShrink: 0, display: "flex", flexDirection: "column", gap: "14px",
      }}>
        {/* ── Il personaggio ── */}
        <div onClick={onSkip} style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: "22px", alignItems: "center",
          cursor: typingDone ? "default" : "pointer" }}>
          <div style={{ width: pic, height: pic, padding: 5, boxSizing: "border-box", background: "#000",
            boxShadow: `${bevel(GOLD, 2)}, 4px 4px 0 #000`, flexShrink: 0,
            display: "grid", placeItems: "center", overflow: "hidden" }}>
            {spriteId ? (
              <Asset id={spriteId} size={pic - 10} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : bigArt ? (
              <pre style={{ margin: 0, color: GOLD.mid, fontSize: "11px", lineHeight: 1.2, fontFamily: FONT, textAlign: "left" }}>
                {normalizePortrait(bigArt).map((line, i) => {
                  const t = blink && (i === 4 || i === 5) ? line.replace(/[•◕⊕∞☠><=;.]/g, "─") : line;
                  return <span key={i}>{t}{"\n"}</span>;
                })}
              </pre>
            ) : (
              <span style={{ fontSize: "80px", lineHeight: 1 }}>{node.secret ? "🔮" : cat.icon}</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", letterSpacing: "2px", padding: "3px 8px", color: tag, background: "#000", boxShadow: `inset 0 0 0 1px ${tag}` }}>{cat.label}</span>
              {cat.danger > 0 && (
                <span aria-label={`Pericolo ${cat.danger} su 3`} style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "3px 6px", background: "#000", boxShadow: `inset 0 0 0 1px ${MK.line}` }}>
                  <span style={{ fontSize: "10px", letterSpacing: "2px", color: DIM, marginRight: "3px" }}>PERICOLO</span>
                  {[1, 2, 3].map(i => (
                    <span key={i} style={{ width: "8px", height: "8px", background: i <= cat.danger ? RED : MK.line }} />
                  ))}
                </span>
              )}
            </div>
            <h2 style={{ margin: 0, fontSize: "28px", fontWeight: "normal", color: TXT, letterSpacing: "1px", lineHeight: 1.1 }}>{ev.title}</h2>
            {/* la battuta, scritta a macchina: clic per saltare */}
            <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, fontStyle: "italic", color: INK, minHeight: "3.2em", whiteSpace: "pre-line" }}>
              {typedText}
              {!typingDone && <span style={{ color: MK.accent, animation: "evStageCursor 0.6s step-start infinite", marginLeft: "1px" }}>▌</span>}
            </p>
            {!typingDone && <span style={{ fontSize: "10px", letterSpacing: "1px", color: DIM }}>clic per saltare →</span>}
          </div>
        </div>

        {/* ── Le scelte ── */}
        {typingDone && (
          <div style={{ display: "grid", gridTemplateColumns: twoCols ? "repeat(2, minmax(0,1fr))" : "minmax(0,1fr)", gap: "8px" }}>
            <span style={{ gridColumn: "1 / -1", fontSize: "11px", letterSpacing: "3px", color: MK.accent }}>COSA FAI?</span>
            {choices.map((ch, i) => {
              const off = ch.isDisabled;
              const on = !off && hover === i;
              const chipCol = off ? MK.line : chipColor(ch.badge, !!ch.cost);
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
                      display: "flex", alignItems: "center", gap: "12px", height: twoCols ? "100%" : undefined, minHeight: "48px",
                      padding: "6px 10px 6px 6px", boxSizing: "border-box", textAlign: "left", userSelect: "none", outline: "none",
                      background: on ? "#141c1a" : "#000",
                      boxShadow: `inset 0 0 0 2px ${on ? GOLD.mid : MK.line}${off ? "" : ", 3px 3px 0 #000"}`,
                      cursor: off ? "not-allowed" : "pointer", opacity: off ? 0.6 : 1,
                    }}>
                    <span style={{
                      flexShrink: 0, width: "32px", height: "32px", display: "grid", placeItems: "center", fontSize: "14px",
                      color: on ? GOLD.dark : off ? DIM : GOLD.mid, background: on ? GOLD.mid : "#000",
                      boxShadow: on ? `inset 0 0 0 2px ${GOLD.dark}` : `inset 0 0 0 1px ${off ? MK.line : GOLD.lo}`,
                    }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: "14px", lineHeight: 1.4, color: off ? DIM : TXT }}>
                      {ch.label}
                      {off && ch.disabledNote && (
                        <span style={{ display: "block", fontSize: "12px", marginTop: "3px", color: RED }}>⛔ {ch.disabledNote}</span>
                      )}
                    </span>
                    <span style={{
                      flexShrink: 0, minWidth: "48px", textAlign: "center", padding: "3px 8px", fontSize: "11px", letterSpacing: "1px",
                      whiteSpace: "nowrap", color: chipCol, background: "#000", boxShadow: `inset 0 0 0 1px ${chipCol}`,
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
