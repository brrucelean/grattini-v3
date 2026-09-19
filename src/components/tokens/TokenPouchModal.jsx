import { useState } from "react";
import { FONT } from "../../data/theme.js";
import { POUCH_SIZE } from "../../data/tokens.js";
import { canDiscard } from "../../utils/tokens.js";
import { GOLD, bevel } from "../map/mapTheme.js";
import { TokenCard } from "./TokenCard.jsx";

// ─── CUSTODIA PIENA — scelta obbligatoria ────────────────────────
// EQUIPAGGIA: butti uno a scelta e metti subito il nuovo come pedina.
// CONSERVA:   butti uno a scelta e tieni il nuovo in custodia.
// SCAMBIA:    butti la pedina attiva e il nuovo prende il suo posto.
// RIFIUTA:    lasci il nuovo dov'è.

const btn = (enabled, main = false) => ({
  fontFamily: FONT, fontSize: "11px", letterSpacing: "1px", padding: "8px 12px", border: "none",
  cursor: enabled ? "pointer" : "default",
  background: !enabled ? "#2a2724" : main ? GOLD.mid : "#3a332a",
  color: !enabled ? "#6d6660" : main ? GOLD.dark : "#f2e6c8",
  boxShadow: enabled ? "3px 3px 0 #000" : "none",
});

export function TokenPouchModal({ tokens, newId, canEquip = true, onResolve }) {
  const [discardId, setDiscardId] = useState(null);
  const pick = discardId && canDiscard(tokens, discardId);
  const swapOk = canEquip && canDiscard(tokens, tokens.equipped);

  return (
    <div role="dialog" aria-modal="true" aria-label="Custodia piena" style={{
      position: "fixed", inset: 0, zIndex: 99996, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.75)", padding: "16px", fontFamily: FONT,
    }}>
      <div style={{
        width: "min(620px, 100%)", maxHeight: "calc(100vh - 32px)", overflowY: "auto", boxSizing: "border-box",
        background: "#16130f", boxShadow: `${bevel(GOLD, 2)}, 8px 8px 0 #000`, padding: "20px",
        display: "flex", flexDirection: "column", gap: "14px", color: "#f2e6c8",
      }}>
        <div style={{ fontSize: "16px", letterSpacing: "3px", color: GOLD.mid, textAlign: "center" }}>
          CUSTODIA PIENA · {tokens.pouch.length}/{POUCH_SIZE}
        </div>
        <TokenCard id={newId} badge="NUOVO" />

        <div style={{ fontSize: "11px", letterSpacing: "1px", color: "#c8c0a8" }}>
          Scegli quale buttare per fargli posto:
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${tokens.pouch.length}, minmax(0,1fr))`, gap: "8px" }}>
          {tokens.pouch.map(id => {
            const selected = discardId === id;
            const allowed = canDiscard(tokens, id);
            return (
              <button key={id} type="button" disabled={!allowed} onClick={() => setDiscardId(selected ? null : id)}
                aria-pressed={selected} style={{
                  padding: 0, border: "none", background: "none", textAlign: "left", cursor: allowed ? "pointer" : "default",
                  outline: selected ? "3px solid #ff5a4a" : "none", outlineOffset: "2px", opacity: allowed ? 1 : 0.5,
                }}>
                <TokenCard id={id} compact badge={id === tokens.equipped ? "ATTIVA" : selected ? "DA BUTTARE" : null} />
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
          <button type="button" disabled={!(pick && canEquip)} style={btn(!!(pick && canEquip), true)}
            onClick={() => onResolve({ choice: "equip", discardId })}>EQUIPAGGIA</button>
          <button type="button" disabled={!pick} style={btn(!!pick)}
            onClick={() => onResolve({ choice: "keep", discardId })}>CONSERVA</button>
          <button type="button" disabled={!swapOk} style={btn(swapOk)}
            onClick={() => onResolve({ choice: "equip", discardId: tokens.equipped })}>SCAMBIA CON LA PEDINA</button>
          <button type="button" style={btn(true)} onClick={() => onResolve({ choice: "refuse" })}>RIFIUTA</button>
        </div>
        {!canEquip && (
          <div style={{ fontSize: "10px", color: "#ff9a8a", textAlign: "center" }}>
            Sei dentro un nodo: puoi conservarlo e cambiare pedina tornato sulla mappa.
          </div>
        )}
      </div>
    </div>
  );
}
