import { useState } from "react";
import { FONT } from "../../data/theme.js";
import { POUCH_SIZE } from "../../data/tokens.js";
import { canSwapToken, canDiscard } from "../../utils/tokens.js";
import { GOLD, bevel } from "../map/mapTheme.js";
import { TokenCard } from "./TokenCard.jsx";

// ─── PANNELLO PEDINA — si apre cliccando la pedina sulla mappa ────
// Scheda del gettone attivo e custodia con CAMBIA / BUTTA. Il cambio è
// consentito solo sulla mappa prima di scegliere il nodo (canSwapToken).

const btn = (enabled, danger = false) => ({
  fontFamily: FONT, fontSize: "10px", letterSpacing: "1px", padding: "5px 8px", border: "none",
  cursor: enabled ? "pointer" : "default", whiteSpace: "nowrap",
  background: !enabled ? "#2a2724" : danger ? "#7a1f16" : GOLD.mid,
  color: !enabled ? "#6d6660" : danger ? "#ffd8d0" : GOLD.dark,
  boxShadow: enabled ? "2px 2px 0 #000" : "none",
});

// powers: poteri attivi del gettone equipaggiato (Telefono, Dado), da scratchlite.
export function TokenPanel({ tokens, onEquip, onDiscard, onClose, powers = null, onDado, dadoPicking = false }) {
  const [confirm, setConfirm] = useState(null);
  const swappable = canSwapToken(tokens);
  const others = tokens.pouch.filter(id => id !== tokens.equipped);

  return (
    <div role="dialog" aria-label="Pedina attiva" style={{
      position: "absolute", left: "16px", bottom: "40px", zIndex: 20, width: "min(380px, calc(100% - 32px))",
      background: "#16130f", boxShadow: `${bevel(GOLD, 2)}, 6px 6px 0 #000`, padding: "14px",
      fontFamily: FONT, display: "flex", flexDirection: "column", gap: "10px", color: "#f2e6c8",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "12px", letterSpacing: "2px", color: GOLD.mid }}>PEDINA ATTIVA</span>
        <span style={{ fontSize: "11px", color: "#a8987a" }}>GETTONI {tokens.pouch.length}/{POUCH_SIZE}</span>
        <button type="button" onClick={onClose} aria-label="Chiudi" style={{ ...btn(true), padding: "3px 7px" }}>✕</button>
      </div>

      <TokenCard id={tokens.equipped} />
      {/* ── Potere attivo ── */}
      {powers?.telefono && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", fontSize: 11 }}>
          <span>📞 Chiamate rimaste nel bioma: {powers.telefono.left}</span>
          <button type="button" disabled={!swappable || powers.telefono.left <= 0} onClick={powers.telefono.onUse}
            style={btn(swappable && powers.telefono.left > 0)}>CHIAMA · €1</button>
        </div>
      )}
      {powers?.dado && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", fontSize: 11 }}>
          <span>🎲 Lanci rimasti nel bioma: {powers.dado.left}{powers.dado.left > 0 && !powers.dado.targets.length ? " · nessun percorso da qui" : ""}</span>
          <button type="button" disabled={!swappable || powers.dado.left <= 0 || !powers.dado.targets.length} onClick={onDado}
            style={btn(swappable && powers.dado.left > 0 && powers.dado.targets.length > 0)}>{dadoPicking ? "ANNULLA" : "LANCIA IL DADO"}</button>
        </div>
      )}
      {tokens.pouch.length > 1 && (
        <button type="button" disabled={!canDiscard(tokens, tokens.equipped)}
          onClick={() => setConfirm(confirm === tokens.equipped ? null : tokens.equipped)}
          style={{ ...btn(canDiscard(tokens, tokens.equipped), true), alignSelf: "flex-end" }}>
          {confirm === tokens.equipped ? "ANNULLA" : "BUTTA"}
        </button>
      )}
      {confirm === tokens.equipped && (
        <ConfirmDiscard onYes={() => { onDiscard(confirm); setConfirm(null); }} />
      )}

      <div style={{ fontSize: "11px", letterSpacing: "2px", color: GOLD.mid, marginTop: "4px" }}>CAMBIA GETTONE</div>
      {others.length === 0 && (
        <div style={{ fontSize: "11px", color: "#a8987a", lineHeight: 1.4 }}>
          Custodia vuota. I gettoni si trovano negli zaini abbandonati e come premio del boss.
        </div>
      )}
      {others.map(id => (
        <div key={id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <TokenCard id={id} compact />
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button type="button" disabled={!canDiscard(tokens, id)} onClick={() => setConfirm(confirm === id ? null : id)}
              style={btn(canDiscard(tokens, id), true)}>{confirm === id ? "ANNULLA" : "BUTTA"}</button>
            <button type="button" disabled={!swappable} onClick={() => onEquip(id)} style={btn(swappable)}>EQUIPAGGIA</button>
          </div>
          {confirm === id && <ConfirmDiscard onYes={() => { onDiscard(id); setConfirm(null); }} />}
        </div>
      ))}
      {!swappable && (
        <div style={{ fontSize: "10px", color: "#ff9a8a" }}>
          {tokens.snapshot ? "Gettone bloccato fino al ritorno sulla mappa." : "Questo gettone non si stacca ancora."}
        </div>
      )}
    </div>
  );
}

function ConfirmDiscard({ onYes }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", fontSize: "10px", color: "#ff9a8a" }}>
      Buttato è perso per questa run.
      <button type="button" onClick={onYes} style={btn(true, true)}>BUTTA DAVVERO</button>
    </div>
  );
}
