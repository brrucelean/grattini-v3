import { memo } from "react";
import { SH, edge } from "./shellTokens.js";
import { FONT_TITLE } from "../../data/theme.js";

// Carta termica: bianco sporco, inchiostro scuro, righe grigie da cassa.
const PAPER = { bg: "#f6f2e6", ink: "#1f2a28", dim: "#6a716b", rule: "#bdb5a0", mark: "#e7e0cc" };
const TOOTH = 8; // passo del bordo seghettato (px)

// ─── LOG COLUMN — colonna destra della shell desktop (224 px) ────
// Uno scontrino vero (P-08): bordo seghettato, logo GRATTINI in testa, subito
// sotto l'ultima operazione in evidenza, poi lo storico completo che si scorre
// all'indietro (dal più recente al più vecchio) e il totale delle voci.
// Il registro tiene tutta la run (useLog, LOG_MAX). Visibile su mappa, eventi e nodi.

// Bordo seghettato: denti a stop secco (niente sfumature). top = denti verso l'alto.
function Teeth({ top }) {
  const a = top ? 45 : 135, b = top ? -45 : -135;
  const half = TOOTH / 2;
  return (
    <div aria-hidden style={{
      height: `${half}px`, flexShrink: 0,
      backgroundImage: `linear-gradient(${a}deg, ${PAPER.bg} ${half}px, transparent 0), linear-gradient(${b}deg, ${PAPER.bg} ${half}px, transparent 0)`,
      backgroundSize: `${TOOTH}px ${TOOTH}px`,
      backgroundPosition: top ? "left bottom" : "left top",
      backgroundRepeat: "repeat-x",
    }} />
  );
}

// Riga tratteggiata da cassa, con etichetta opzionale al centro.
function Rule({ label }) {
  return (
    <div aria-hidden={!label} style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 10px", flexShrink: 0,
      color: PAPER.dim, fontSize: "10px", letterSpacing: "2px" }}>
      <span style={{ flex: 1, borderTop: `2px dashed ${PAPER.rule}` }} />
      {label && <span>{label}</span>}
      {label && <span style={{ flex: 1, borderTop: `2px dashed ${PAPER.rule}` }} />}
    </div>
  );
}

const num = (id) => String(id).padStart(3, "0");

// Una riga dello storico: numero d'operazione a sinistra, testo, tacca del colore della voce.
const LogRow = memo(function LogRow({ entry }) {
  return (
    <li style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: "6px",
      fontSize: "11px", lineHeight: 1.45, color: PAPER.ink, padding: "3px 0",
      borderBottom: `1px dotted ${PAPER.rule}`, wordBreak: "break-word" }}>
      <span style={{ color: PAPER.dim, fontVariantNumeric: "tabular-nums" }}>
        <span aria-hidden style={{ display: "inline-block", width: "4px", height: "8px", marginRight: "3px",
          background: entry.color || PAPER.ink, boxShadow: `0 0 0 1px ${PAPER.ink}` }} />
        {num(entry.id)}
      </span>
      <span>{entry.text}</span>
    </li>
  );
});

function LogColumnImpl({ log }) {
  const latest = log.length ? log[log.length - 1] : null;
  // Storico dal più recente al più vecchio: si legge scendendo, cioè tornando indietro.
  const history = [];
  for (let i = log.length - 2; i >= 0; i--) history.push(log[i]);

  return (
    <aside aria-label="Registro della run" style={{
      width:`${SH.logW}px`, flexShrink:0, boxSizing:"border-box",
      display:"flex", flexDirection:"column", minHeight:0,
      background: SH.panel, borderLeft: edge(SH.line),
      fontFamily: SH.font, padding:"8px 10px 12px 8px",
    }}>
      {/* Carta dello scontrino con ombra dura */}
      <div style={{flex:1, minHeight:0, display:"flex", flexDirection:"column", filter:"drop-shadow(4px 4px 0 #050304)"}}>
        <Teeth top />
        <div style={{flex:1, minHeight:0, display:"flex", flexDirection:"column", background: PAPER.bg, color: PAPER.ink}}>

          {/* ── Testata: logo e dati della cassa ── */}
          <header style={{flexShrink:0, textAlign:"center", padding:"8px 10px 6px"}}>
            <div style={{fontFamily: FONT_TITLE, fontSize:"22px", letterSpacing:"3px", lineHeight:1,
              color: PAPER.ink, textShadow:`2px 2px 0 ${PAPER.mark}`}}>GRATTINI</div>
            <div style={{fontSize:"9px", letterSpacing:"2px", color: PAPER.dim, marginTop:"4px"}}>TABACCHI · RICEVITORIA</div>
            <div style={{display:"flex", justifyContent:"space-between", fontSize:"10px", color: PAPER.dim, marginTop:"6px",
              fontVariantNumeric:"tabular-nums"}}>
              <span>SCONTRINO</span>
              <span>{latest ? `N. ${num(latest.id)}` : "—"}</span>
            </div>
          </header>
          <Rule />

          {/* ── Ultima operazione, in evidenza ── */}
          <section aria-label="Ultima voce" aria-live="polite" style={{flexShrink:0, padding:"6px 10px 8px"}}>
            <div style={{fontSize:"9px", letterSpacing:"2px", color: PAPER.dim, marginBottom:"4px"}}>ULTIMA OPERAZIONE</div>
            {latest ? (
              <div key={latest.id} style={{
                fontSize:"12px", lineHeight:1.45, color: PAPER.ink, wordBreak:"break-word",
                background: PAPER.mark, padding:"5px 6px 5px 8px",
                // filo del colore della voce + riquadro netto da inchiostro
                boxShadow:`inset 3px 0 0 ${latest.color || PAPER.ink}, inset 0 0 0 1px ${PAPER.ink}`,
              }}>{latest.text}</div>
            ) : (
              <div style={{fontSize:"12px", lineHeight:1.45, color: PAPER.dim}}>Nessuna voce. Gratta qualcosa.</div>
            )}
          </section>

          {/* ── Storico completo, scorrevole ── */}
          <Rule label="STORICO" />
          <ol aria-label="Storico della run" style={{
            flex:1, minHeight:0, overflowY:"auto", margin:0, padding:"4px 10px 6px",
            listStyle:"none", display:"flex", flexDirection:"column",
          }}>
            {history.length === 0 && (
              <li style={{color: PAPER.dim, fontSize:"11px", lineHeight:1.45, padding:"3px 0"}}>—</li>
            )}
            {history.map(e => <LogRow key={e.id} entry={e} />)}
          </ol>

          {/* ── Totale da cassa ── */}
          <Rule />
          <footer style={{flexShrink:0, padding:"6px 10px 8px", fontSize:"11px", letterSpacing:"1px"}}>
            <div style={{display:"flex", justifyContent:"space-between", fontVariantNumeric:"tabular-nums"}}>
              <span>TOTALE VOCI</span>
              <span>{log.length}</span>
            </div>
            <div style={{textAlign:"center", fontSize:"9px", letterSpacing:"2px", color: PAPER.dim, marginTop:"4px"}}>GRAZIE E ARRIVEDERCI</div>
          </footer>
        </div>
        <Teeth />
      </div>
    </aside>
  );
}

export const LogColumn = memo(LogColumnImpl);
