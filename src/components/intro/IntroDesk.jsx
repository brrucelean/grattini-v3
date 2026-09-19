import { useEffect, useState } from "react";
import { FONT } from "../../data/theme.js";
import { ticketGuide } from "../../data/cards.js";
import { AudioEngine } from "../../audio.js";
import { Asset } from "../Asset.jsx";
import { TicketThumb } from "../TicketThumb.jsx";
import { TABLE_BG } from "../scratch/ScratchTable.jsx";
import { msgPlainText } from "../DialogueBox.jsx";

// ─── BENVENUTO — Nonno Carmelo al bancone (desktop) ─────────────
// Prima: riquadro scuro al neon, i tre biglietti come bottoni e l'anteprima
// solo al passaggio del mouse. Ora è chiaro come la soglia e il tavolo:
// in alto il vecchio con la sua battuta (scritta a macchina, clic per
// saltare), sotto i suoi tre biglietti già in grande con regole e premio,
// ognuno con il suo GRATTA. Finiti tutti, la scelta di quale intascare.
// Stesse azioni di prima: solo presentazione.

const INK = "#153f42", MUTED = "#5d6f68", CREAM = "#fff3c4", EDGE = "#d9c27a";
const SHADOW = "#3a1f0f", RED = "#a3161d", GREEN = "#2f7a4a", BRASS = "#b8862a";
const frame = (edge = INK) => `inset 0 0 0 2px ${EDGE}, inset 0 0 0 4px ${edge}, 5px 5px 0 ${SHADOW}`;

// L'ultima battuta, scritta a macchina (come CarmeloLogBox).
function useTyped(messages) {
  const latest = msgPlainText(messages.length ? messages[messages.length - 1] : "");
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!latest) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setN(i);
      if (i % 3 === 0 && latest[i] && latest[i] !== " ") AudioEngine.dialogueTick?.();
      if (i >= latest.length) clearInterval(iv);
    }, 28);
    return () => clearInterval(iv);
  }, [latest]);
  return { text: latest.slice(0, n), done: n >= latest.length, skip: () => setN(latest.length) };
}

function Button({ children, onClick, kind = "primary", style }) {
  const primary = kind === "primary";
  return (
    <button type="button" onClick={onClick} style={{
      height: "42px", padding: "0 18px", border: "none", fontFamily: FONT, fontSize: "14px", letterSpacing: "2px", cursor: "pointer",
      color: primary ? CREAM : MUTED, background: primary ? INK : "transparent",
      boxShadow: primary ? `3px 3px 0 ${SHADOW}` : `inset 0 0 0 1px ${EDGE}`, ...style,
    }}>{children}</button>
  );
}

export function IntroDesk({ messages, cards, prizes, onScratch, onRefuse, onPocket }) {
  const { text, done, skip } = useTyped(messages);
  const choosing = cards.length === 0 && prizes.length >= 3;

  return (
    <div style={{
      flex: 1, minHeight: 0, width: "100%", boxSizing: "border-box", padding: "20px", overflowY: "auto",
      background: TABLE_BG, fontFamily: FONT, color: INK,
      display: "flex", flexDirection: "column", alignItems: "center", gap: "18px",
    }}>
      {/* ══ Il vecchio al bancone ══ */}
      <section onClick={skip} aria-label="Nonno Carmelo" style={{
        width: "min(100%, 1000px)", boxSizing: "border-box", background: CREAM, boxShadow: frame(BRASS),
        padding: "18px 22px", display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: "22px", alignItems: "center",
        cursor: done ? "default" : "pointer", flexShrink: 0,
      }}>
        <div style={{ width: 150, height: 150, padding: "4px", boxSizing: "border-box", background: "#1a1410",
          boxShadow: `inset 0 0 0 2px ${INK}, 4px 4px 0 ${SHADOW}`, overflow: "hidden" }}>
          <Asset id="spr-vecchio" emoji="👴" size={142} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontSize: "11px", letterSpacing: "2px", padding: "2px 8px", color: CREAM, background: BRASS }}>TABACCHERIA</span>
            <span style={{ fontSize: "26px", lineHeight: 1 }}>Nonno Carmelo</span>
          </div>
          <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, fontStyle: "italic", minHeight: "4.8em" }}>
            {text}{!done && <span style={{ color: BRASS }}>▌</span>}
          </p>
          {!choosing && cards.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "11px", color: MUTED }}>{done ? "" : "clic per saltare →"}</span>
              <Button kind="secondary" onClick={(e) => { e.stopPropagation(); onRefuse(); }}>RIFIUTA · NON GUADAGNI MA SALVI LE UNGHIE</Button>
            </div>
          )}
        </div>
      </section>

      {/* ══ I suoi tre biglietti ══ */}
      {!choosing && cards.length > 0 && (
        <div style={{ width: "min(100%, 1000px)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ alignSelf: "center", fontSize: "12px", letterSpacing: "3px", color: CREAM, background: "#1a1410cc", padding: "3px 10px" }}>
            I SUOI BIGLIETTI · GRATIS · RIMASTI {cards.length}/3
          </span>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cards.length}, minmax(0, 324px))`, justifyContent: "center", gap: "14px" }}>
            {cards.map((card, idx) => {
              const g = ticketGuide(card);
              return (
                <article key={idx} aria-label={card.name} style={{ background: CREAM, boxShadow: frame(EDGE), padding: "12px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", textAlign: "center" }}>
                  <button type="button" onClick={() => onScratch(card)} aria-label={`Gratta ${card.name}`}
                    style={{ border: "none", padding: 0, background: "none", cursor: "pointer" }}>
                    <TicketThumb card={card} width={250} />
                  </button>
                  <span style={{ fontSize: "17px" }}>{card.name}</span>
                  <span style={{ fontSize: "12px", lineHeight: 1.45, color: INK }}>{g.how}</span>
                  <span style={{ fontSize: "12px", color: MUTED }}>
                    <s style={{ color: RED }}>€{card.cost}</s> <b style={{ color: GREEN }}>GRATIS</b> · fino a €{card.maxPrize}
                  </span>
                  {card.malus && <span style={{ fontSize: "11px", color: RED }}>⚠ {card.malus.desc}</span>}
                  <Button onClick={() => onScratch(card)} style={{ width: "100%", marginTop: "auto" }}>GRATTA</Button>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ Quale intaschi ══ */}
      {choosing && (
        <div style={{ width: "min(100%, 1000px)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ alignSelf: "center", fontSize: "12px", letterSpacing: "3px", color: CREAM, background: "#1a1410cc", padding: "3px 10px" }}>
            QUALE INTASCHI? UNO SOLO
          </span>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${prizes.length}, minmax(0, 324px))`, justifyContent: "center", gap: "14px" }}>
            {prizes.map((ip, idx) => (
              <article key={idx} style={{ background: CREAM, boxShadow: frame(ip.prize > 0 ? BRASS : EDGE), padding: "16px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center" }}>
                <span style={{ fontSize: "12px", color: MUTED }}>{ip.cardName}</span>
                <span style={{ fontSize: "32px", lineHeight: 1, color: ip.prize > 0 ? GREEN : MUTED }}>{ip.prize > 0 ? `€${ip.prize}` : "—"}</span>
                <Button kind={ip.prize > 0 ? "primary" : "secondary"} onClick={() => onPocket(ip)} style={{ width: "100%" }}>INTASCA</Button>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
