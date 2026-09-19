import { useEffect, useState } from "react";
import { FONT, FONT_TITLE } from "../../data/theme.js";
import { normalizePortrait } from "../../utils/nail.js";
import { hasAsset } from "../../assets/registry.js";
import { Tooltip } from "../Tooltip.jsx";
import { GOLD } from "../map/mapTheme.js";
import { MK } from "../desk/mapKit.jsx";
import { StagePortrait } from "../desk/StagePortrait.jsx";

// ─── IL DIALOGO — evento / NPC su desktop ────────────────────────
// Impaginato come la soglia del nodo (proprietario, 2026-09-19): riquadro
// in alto con il ritratto nella sua cornice d'oro (respira piano a scatti),
// e alla sua destra nome e battuta scritta a macchina (clic per saltare).
// Sotto, le scelte centrate come tasti numerati: si premono anche da
// tastiera (1–9).
// Palette del kit della mappa. Solo presentazione: testi, scelte, condizioni
// e callback arrivano da EventView invariati.

const TXT = MK.txt, INK = MK.ink, DIM = MK.dim;
const RED = "#e0564a";

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

const STAGE_CSS = `
  @keyframes evStageCursor { 0%,100% { opacity:1; } 50% { opacity:0; } }
  @keyframes evKeyIn { from { transform: translateX(12px); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .ev-anim { animation: none !important; } }
`;

export function EventStage({
  node, ev, cat, bigArt, blink,
  typedText, typingDone, onSkip,
  choices, onChoice,
}) {
  const [hover, setHover] = useState(-1);
  const tag = tagColor(cat);
  const spriteId = hasAsset(`spr-${node.type}`) && !node.secret ? `spr-${node.type}` : null;
  const many = choices.length > 5;

  // Tasti 1–9: scegli senza mouse (solo quando la battuta è finita).
  useEffect(() => {
    if (!typingDone) return undefined;
    const onKey = (e) => {
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > choices.length) return;
      const ch = choices[n - 1];
      if (ch && !ch.isDisabled) { e.preventDefault(); onChoice(ch.action); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [typingDone, choices, onChoice]);

  return (
    // Stessa impaginazione della soglia del nodo (node/NodeThreshold.jsx):
    // riquadro largo come quello, ritratto a sinistra, nome e battuta alla sua
    // destra; sotto, le scelte centrate. In alto, non galleggiante.
    <div style={{
      flex: "1 1 0", minWidth: 0, minHeight: 0, width: "100%", alignSelf: "stretch", boxSizing: "border-box",
      background: MK.bg, padding: "20px", overflowY: "auto",
      // ancorato a sinistra come la soglia: il riquadro non si sposta cambiando pagina
      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "18px",
      fontFamily: FONT, color: TXT,
    }}>
      <style>{STAGE_CSS}</style>

      {/* ══ Il personaggio: ritratto, nome, battuta ══ */}
      <article aria-label={ev.title} onClick={onSkip} style={{
        width: "min(100%, 1040px)", maxWidth: "100%", boxSizing: "border-box", flexShrink: 0, position: "relative",
        background: MK.panel, boxShadow: `inset 0 0 0 2px ${tag}aa, 5px 5px 0 #000`,
        padding: "18px 22px", display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: "24px", alignItems: "center",
        cursor: typingDone ? "default" : "pointer",
      }}>
        {/* striscia del colore del tipo, come la soglia */}
        <span aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: tag }} />

        {/* ritratto condiviso con la soglia: stessa cornice, respira */}
        <StagePortrait spriteId={spriteId} accent={tag} icon={node.secret ? "🔮" : cat.icon}
          art={!spriteId && bigArt ? normalizePortrait(bigArt).map((line, i) => (blink && (i === 4 || i === 5) ? line.replace(/[•◕⊕∞☠><=;.]/g, "─") : line)) : null} />

        {/* nome e battuta, alla destra del ritratto */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", letterSpacing: "2px", padding: "3px 8px", color: tag, background: "#000", boxShadow: `inset 0 0 0 1px ${tag}` }}>{cat.label}</span>
            {cat.danger > 0 && (
              <span aria-label={`Pericolo ${cat.danger} su 3`} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 6px", background: "#000", boxShadow: `inset 0 0 0 1px ${MK.line}` }}>
                <span style={{ fontSize: "10px", letterSpacing: "2px", color: DIM, marginRight: 3 }}>PERICOLO</span>
                {[1, 2, 3].map(i => <span key={i} style={{ width: 8, height: 8, background: i <= cat.danger ? RED : MK.line }} />)}
              </span>
            )}
          </div>
          <h2 style={{ margin: 0, fontFamily: FONT_TITLE, fontWeight: "normal", fontSize: "30px", lineHeight: 1.05, color: TXT }}>{ev.title}</h2>
          <p style={{ margin: 0, fontSize: "16px", lineHeight: 1.6, fontStyle: "italic", color: INK, whiteSpace: "pre-line", minHeight: "3.2em", maxWidth: "62ch" }}>
            {typedText}
            {!typingDone && <span style={{ color: MK.accent, animation: "evStageCursor 0.6s step-start infinite", marginLeft: 1 }}>▌</span>}
          </p>
          {!typingDone && <span style={{ fontSize: "10px", letterSpacing: "1px", color: DIM }}>clic per saltare →</span>}
        </div>
      </article>

      {/* ══ Le scelte, centrate sotto ══ */}
      <section style={{ width: "min(100%, 1040px)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* le scelte: tasti numerati, premibili anche da tastiera */}
        {typingDone && (
          <div style={{ width: "min(100%, 760px)", display: "flex", flexDirection: "column", gap: many ? "6px" : "10px", paddingBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "12px", letterSpacing: "3px", color: MK.accent }}>COSA FAI?</span>
              <span style={{ fontSize: "10px", color: DIM, letterSpacing: "1px" }}>tasti 1–{choices.length}</span>
            </div>
            {choices.map((ch, i) => {
              const off = ch.isDisabled;
              const on = !off && hover === i;
              const chipCol = off ? MK.line : chipColor(ch.badge, !!ch.cost);
              const act = () => { if (!off) onChoice(ch.action); };
              return (
                <Tooltip key={i} text={ch.tooltip || (off && ch.disabledNote ? `⛔ ${ch.disabledNote}` : "")}>
                  <div
                    role="button" tabIndex={off ? -1 : 0} aria-disabled={off || undefined}
                    className="ev-anim"
                    onClick={act}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } }}
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(h => (h === i ? -1 : h))}
                    onFocus={() => setHover(i)} onBlur={() => setHover(h => (h === i ? -1 : h))}
                    style={{
                      display: "flex", alignItems: "center", gap: "14px", minHeight: many ? "50px" : "60px",
                      padding: "8px 12px 8px 8px", boxSizing: "border-box", textAlign: "left", userSelect: "none", outline: "none",
                      background: on ? "#141c1a" : "#000",
                      boxShadow: `inset 0 0 0 2px ${on ? GOLD.mid : MK.line}${off ? "" : `, ${on ? "2px 2px" : "4px 4px"} 0 #000`}`,
                      transform: on ? "translate(2px,2px)" : "none",
                      cursor: off ? "not-allowed" : "pointer", opacity: off ? 0.55 : 1,
                      animation: `evKeyIn .2s steps(3) ${i * 0.04}s backwards`,
                    }}>
                    {/* tasto numerato, come un tasto della cassa */}
                    <span style={{
                      flexShrink: 0, width: 38, height: 38, display: "grid", placeItems: "center", fontFamily: FONT_TITLE, fontSize: "20px",
                      color: off ? DIM : GOLD.dark, background: off ? "#111" : GOLD.mid,
                      boxShadow: off ? `inset 0 0 0 1px ${MK.line}` : `inset 0 0 0 2px ${GOLD.dark}, inset 2px 2px 0 2px ${GOLD.hi}, inset -2px -2px 0 2px ${GOLD.lo}`,
                    }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: "15px", lineHeight: 1.4, color: off ? DIM : TXT }}>
                      {ch.label}
                      {off && ch.disabledNote && (
                        <span style={{ display: "block", fontSize: "12px", marginTop: 3, color: RED }}>⛔ {ch.disabledNote}</span>
                      )}
                    </span>
                    <span style={{
                      flexShrink: 0, minWidth: 54, textAlign: "center", padding: "4px 8px", fontSize: "11px", letterSpacing: "1px",
                      whiteSpace: "nowrap", color: chipCol, background: "#000", boxShadow: `inset 0 0 0 1px ${chipCol}`,
                    }}>{ch.cost || ch.badge}</span>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
