import { useEffect, useState } from "react";
import { FONT } from "../../data/theme.js";
import { ticketGuide } from "../../data/cards.js";
import { AudioEngine } from "../../audio.js";
import { Asset } from "../Asset.jsx";
import { TicketThumb } from "../TicketThumb.jsx";
import { C } from "../../data/theme.js";
import { SH } from "../shell/shellTokens.js";
import { BIOME_THEME, GOLD, dither } from "../map/mapTheme.js";
import { msgPlainText } from "../DialogueBox.jsx";

// ─── BENVENUTO — Nonno Carmelo al bancone (desktop) ─────────────
// Prima: riquadro al neon, i tre biglietti come bottoni e l'anteprima solo
// al passaggio del mouse. Ora è minimal, con i colori della mappa (tavolo
// verde scuro a retino, pannelli neri a filo sottile, testo grigio-verde,
// accento ciano, bottoni oro): in alto il vecchio con la sua battuta
// (scritta a macchina, clic per saltare), sotto i suoi tre biglietti già in
// grande con regole e premio, ognuno con il suo GRATTA. Finiti tutti, la
// scelta di quale intascare. Stesse azioni di prima: solo presentazione.

const T = BIOME_THEME[0];
const BG = dither(T.board, T.board2);
const PANEL = T.marquee, LINE = SH.line, LINE_HI = SH.lineHi;
const TXT = C.text, INK = T.ink, ACCENT = T.accent;
const RED = C.red, GREEN = C.green;
const panel = { background: PANEL, boxShadow: `inset 0 0 0 2px ${LINE}, ${SH.shadow}` };

// L'ultima battuta, scritta a macchina (come CarmeloLogBox).
function useTyped(latest) {
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
      height: "40px", padding: "0 16px", border: "none", fontFamily: FONT, fontSize: "13px", letterSpacing: "2px", cursor: "pointer",
      color: primary ? GOLD.dark : INK, background: primary ? GOLD.mid : "transparent",
      boxShadow: primary ? `inset 0 0 0 2px ${GOLD.dark}, inset 2px 2px 0 2px ${GOLD.hi}, ${SH.shadow}` : `inset 0 0 0 2px ${LINE}`, ...style,
    }}>{children}</button>
  );
}

export function IntroDesk({ messages, cards, prizes, onScratch, onRefuse, onPocket }) {
  const choosing = cards.length === 0 && prizes.length >= 3;
  // Dopo ogni biglietto parla del risultato; a fine giro il congedo arriva
  // subito dopo l'ultima reazione, quindi si tengono entrambe.
  const plain = messages.map(msgPlainText);
  const line = choosing && plain.length >= 2 ? `${plain[plain.length - 2]}\n${plain[plain.length - 1]}` : (plain[plain.length - 1] || "");
  const { text, done, skip } = useTyped(line);
  const fresh = cards.length === 3;

  return (
    <div style={{
      flex: 1, minHeight: 0, width: "100%", boxSizing: "border-box", padding: "20px", overflowY: "auto",
      background: BG, fontFamily: FONT, color: TXT,
      display: "flex", flexDirection: "column", alignItems: "center", gap: "18px",
    }}>
      {/* ══ Il vecchio al bancone ══ */}
      <section onClick={skip} aria-label="Nonno Carmelo" style={{
        width: "min(100%, 1000px)", boxSizing: "border-box", ...panel,
        padding: "18px 22px", display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: "22px", alignItems: "center",
        cursor: done ? "default" : "pointer", flexShrink: 0,
      }}>
        <div style={{ width: 150, height: 150, padding: "4px", boxSizing: "border-box", background: "#000",
          boxShadow: `inset 0 0 0 2px ${LINE_HI}`, overflow: "hidden" }}>
          <Asset id="spr-vecchio" emoji="👴" size={142} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontSize: "11px", letterSpacing: "2px", color: ACCENT }}>TABACCHERIA</span>
            <span style={{ fontSize: "26px", lineHeight: 1, color: TXT }}>Nonno Carmelo</span>
          </div>
          <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, fontStyle: "italic", minHeight: "4.8em", color: INK, whiteSpace: "pre-line" }}>
            {text}{!done && <span style={{ color: ACCENT }}>▌</span>}
          </p>
          {fresh && (
            <span style={{ fontSize: "12px", lineHeight: 1.5, color: C.gold }}>
              ⚠ Ogni 3 caselle grattate l'unghia si consuma. Marcia: vinci solo il 25%. Morta: il biglietto si annulla.
            </span>
          )}
          {!choosing && cards.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "11px", color: C.dim }}>{done ? "" : "clic per saltare →"}</span>
              <Button kind="secondary" onClick={(e) => { e.stopPropagation(); onRefuse(); }}>RIFIUTA · NON GUADAGNI MA SALVI LE UNGHIE</Button>
            </div>
          )}
        </div>
      </section>

      {/* ══ I suoi tre biglietti ══ */}
      {!choosing && cards.length > 0 && (
        <div style={{ width: "min(100%, 1000px)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ alignSelf: "center", fontSize: "12px", letterSpacing: "3px", color: INK }}>
            I SUOI BIGLIETTI · GRATIS · RIMASTI {cards.length}/3
          </span>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cards.length}, minmax(0, 324px))`, justifyContent: "center", gap: "14px" }}>
            {cards.map((card, idx) => {
              const g = ticketGuide(card);
              return (
                <article key={idx} aria-label={card.name} style={{ ...panel, padding: "12px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", textAlign: "center" }}>
                  <button type="button" onClick={() => onScratch(card)} aria-label={`Gratta ${card.name}`}
                    style={{ border: "none", padding: 0, background: "none", cursor: "pointer" }}>
                    <TicketThumb card={card} width={250} />
                  </button>
                  <span style={{ fontSize: "17px", color: TXT }}>{card.name}</span>
                  <span style={{ fontSize: "12px", lineHeight: 1.45, color: INK }}>{g.how}</span>
                  <span style={{ fontSize: "12px", color: C.dim }}>
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
          <span style={{ alignSelf: "center", fontSize: "12px", letterSpacing: "3px", color: INK }}>
            QUALE INTASCHI? UNO SOLO
          </span>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${prizes.length}, minmax(0, 324px))`, justifyContent: "center", gap: "14px" }}>
            {prizes.map((ip, idx) => (
              <article key={idx} style={{ ...panel, boxShadow: `inset 0 0 0 2px ${ip.prize > 0 ? GOLD.mid : LINE}, ${SH.shadow}`, padding: "16px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center" }}>
                <span style={{ fontSize: "12px", color: INK }}>{ip.cardName}</span>
                <span style={{ fontSize: "32px", lineHeight: 1, color: ip.prize > 0 ? GREEN : C.dim }}>{ip.prize > 0 ? `€${ip.prize}` : "—"}</span>
                <Button kind={ip.prize > 0 ? "primary" : "secondary"} onClick={() => onPocket(ip)} style={{ width: "100%" }}>INTASCA</Button>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
