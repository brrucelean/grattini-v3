import { memo, useEffect, useRef } from "react";
import { SH, edge } from "./shellTokens.js";

const PAPER = { bg: "#fff3c4", ink: "#153f42", dim: "#5d6f68", edge: "#d9c27a" };

// ─── LOG COLUMN — colonna destra della shell desktop (224 px) ────
// Il vecchio log era una riga scorrevole in fondo che mostrava solo l'ultima
// voce. Qui è uno scontrino: le voci si impilano, la più recente in basso,
// e le ultime restano leggibili. Visibile su mappa, eventi e nodi.

function LogColumnImpl({ log }) {
  const listRef = useRef(null);
  const lastId = log.length ? log[log.length - 1].id : 0;

  // La voce nuova entra dal basso: tieni lo scontrino agganciato all'ultima riga.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastId]);

  return (
    <aside aria-label="Registro della run" style={{
      width:`${SH.logW}px`, flexShrink:0, boxSizing:"border-box",
      display:"flex", flexDirection:"column", minHeight:0,
      background: SH.panel, borderLeft: edge(SH.line),
      fontFamily: SH.font, padding:"8px",
    }}>
      {/* Carta dello scontrino, come sul tavolo della grattata */}
      <div style={{flex:1, minHeight:0, display:"flex", flexDirection:"column",
        background: PAPER.bg, color: PAPER.ink, boxShadow:`inset 0 0 0 2px ${PAPER.edge}, 4px 4px 0 #050304`}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 10px", height:"32px", flexShrink:0, borderBottom:`2px dashed ${PAPER.edge}`}}>
          <span style={{fontSize:"11px", letterSpacing:"2px", fontWeight:"bold"}}>SCONTRINO</span>
          <span style={{fontSize:"11px", color: PAPER.dim, fontVariantNumeric:"tabular-nums"}}>{log.length ? `#${lastId}` : "—"}</span>
        </div>
        <ol ref={listRef} aria-live="polite" aria-relevant="additions" style={{
          flex:1, minHeight:0, overflowY:"auto", margin:0, padding:"8px 10px",
          listStyle:"none", display:"flex", flexDirection:"column", gap:"6px",
        }}>
          {log.length === 0 && (
            <li style={{color: PAPER.dim, fontSize:"12px", lineHeight:1.5}}>Nessuna voce. Gratta qualcosa.</li>
          )}
          {log.map((e, i) => {
            const latest = i === log.length - 1;
            return (
              <li key={e.id} style={{
                // inchiostro scuro sulla carta; il colore della voce resta nel filo a sinistra
                color: PAPER.ink, fontSize:"12px", lineHeight:1.45,
                paddingLeft:"6px", borderLeft:`3px solid ${e.color || PAPER.ink}`,
                opacity: latest ? 1 : Math.max(0.6, 1 - (log.length - 1 - i) * 0.06),
                wordBreak:"break-word",
              }}>{e.text}</li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}

export const LogColumn = memo(LogColumnImpl);
