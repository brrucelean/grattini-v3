import { useState } from "react";
import { C, FONT } from "../../data/theme.js";
import { GOLD, bevel } from "../map/mapTheme.js";
import { MK } from "./mapKit.jsx";

// ─── IMPOSTAZIONI → AZZERA PROGRESSI ─────────────────────────────
// Scegli cosa azzerare (trofei, reliquie, pedine, statistiche) e conferma due
// volte: non si torna indietro. Tocca solo la metaprogressione salvata.

const PARTS = [
  { key: "trophies", label: "TROFEI", accent: C.gold, note: "tutti i trofei sbloccati" },
  { key: "relics", label: "RELIQUIE", accent: "#c060ff", note: "reliquie scoperte e quelle attive a inizio run" },
  { key: "tokens", label: "PEDINE", accent: "#e58a68", note: "la collezione dei gettoni scoperti" },
  { key: "stats", label: "STATS", accent: C.cyan, note: "run giocate, vinte, soldi e grattini totali" },
];

export function ResetProgress({ counts = {}, onReset, onClose }) {
  const [sel, setSel] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(null);
  const chosen = PARTS.filter(p => sel[p.key]);
  const toggle = (k) => { setSel(s => ({ ...s, [k]: !s[k] })); setConfirm(false); setDone(null); };

  const btn = (kind, enabled = true) => ({
    fontFamily: FONT, fontSize: 12, letterSpacing: 2, padding: "10px 14px", border: "none",
    cursor: enabled ? "pointer" : "default", opacity: enabled ? 1 : 0.45,
    background: kind === "danger" ? "#7a1f16" : kind === "primary" ? GOLD.mid : "transparent",
    color: kind === "danger" ? "#ffd8d0" : kind === "primary" ? GOLD.dark : MK.ink,
    boxShadow: kind === "ghost" ? `inset 0 0 0 2px ${MK.line}` : "3px 3px 0 #000",
  });

  return (
    <div role="dialog" aria-modal="true" aria-label="Azzera progressi" onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 99001, background: "rgba(0,0,0,0.9)", fontFamily: FONT,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(520px, 96vw)", background: MK.panel, boxShadow: `${bevel(GOLD, 2)}, 8px 8px 0 #000`,
        color: MK.txt, padding: 20, display: "flex", flexDirection: "column", gap: 14,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, letterSpacing: 3, color: MK.accent }}>IMPOSTAZIONI</span>
          <span style={{ fontSize: 24, lineHeight: 1, color: GOLD.mid }}>Azzera progressi</span>
          <span style={{ fontSize: 12, color: MK.ink, lineHeight: 1.5 }}>Scegli cosa ricominciare da zero. I dati sono solo su questo dispositivo: una volta cancellati non tornano.</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {PARTS.map(p => {
            const on = !!sel[p.key];
            return (
              <button key={p.key} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(p.key)} style={{
                display: "grid", gridTemplateColumns: "22px minmax(0,1fr) auto", gap: 12, alignItems: "center", textAlign: "left",
                padding: "10px 12px", border: "none", cursor: "pointer", fontFamily: FONT, color: MK.txt,
                background: on ? "#1f1210" : "#000", boxShadow: `inset 0 0 0 2px ${on ? C.red : MK.line}`,
              }}>
                <span aria-hidden style={{ width: 18, height: 18, display: "grid", placeItems: "center", fontSize: 13,
                  boxShadow: `inset 0 0 0 2px ${on ? C.red : MK.lineHi}`, color: C.red }}>{on ? "✕" : ""}</span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 14, color: p.accent, letterSpacing: 1 }}>{p.label}</span>
                  <span style={{ fontSize: 11, color: MK.ink }}>{p.note}</span>
                </span>
                <span style={{ fontSize: 11, color: MK.dim }}>{counts[p.key] ?? ""}</span>
              </button>
            );
          })}
        </div>

        {done && <div style={{ fontSize: 12, color: C.green }}>Fatto: {done} da zero.</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" onClick={onClose} style={btn("ghost")}>CHIUDI</button>
          {!confirm ? (
            <button type="button" disabled={!chosen.length} onClick={() => setConfirm(true)} style={btn("primary", chosen.length > 0)}>AZZERA…</button>
          ) : (
            <button type="button" onClick={() => {
              onReset(Object.fromEntries(chosen.map(p => [p.key, true])));
              setDone(chosen.map(p => p.label.toLowerCase()).join(", "));
              setSel({}); setConfirm(false);
            }} style={btn("danger")}>SICURO? AZZERA {chosen.map(p => p.label).join(" + ")}</button>
          )}
        </div>
      </div>
    </div>
  );
}
