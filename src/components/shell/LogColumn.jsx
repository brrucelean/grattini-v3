import { memo, useEffect, useRef } from "react";
import { SH, edge, labelStyle } from "./shellTokens.js";

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
      fontFamily: SH.font,
    }}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 8px", height:"32px", flexShrink:0, borderBottom: edge(SH.line)}}>
        <span style={{...labelStyle, color: SH.ink}}>Scontrino</span>
        <span style={{...labelStyle, fontVariantNumeric:"tabular-nums"}}>{log.length ? `#${lastId}` : "—"}</span>
      </div>
      <ol ref={listRef} aria-live="polite" aria-relevant="additions" style={{
        flex:1, minHeight:0, overflowY:"auto", margin:0, padding:"8px",
        listStyle:"none", display:"flex", flexDirection:"column", gap:"6px",
      }}>
        {log.length === 0 && (
          <li style={{color: SH.dim, fontSize:"12px", lineHeight:1.5}}>Nessuna voce. Gratta qualcosa.</li>
        )}
        {log.map((e, i) => {
          const latest = i === log.length - 1;
          return (
            <li key={e.id} style={{
              color: e.color || SH.ink, fontSize:"12px", lineHeight:1.45,
              paddingLeft:"8px", borderLeft: edge(latest ? (e.color || SH.ink) : SH.line),
              opacity: latest ? 1 : Math.max(0.55, 1 - (log.length - 1 - i) * 0.06),
              wordBreak:"break-word",
            }}>{e.text}</li>
          );
        })}
      </ol>
    </aside>
  );
}

export const LogColumn = memo(LogColumnImpl);
