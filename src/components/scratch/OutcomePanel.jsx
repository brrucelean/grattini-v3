import { C, FONT } from "../../data/theme.js";
import { Btn } from "../Btn.jsx";

// ─── FASCE DI ESITO — condivise da grattini e minigiochi ─────────
// Prima i minigiochi avevano un loro timbro VINTO/PERSO e un cartello crema,
// diversi dalla fascia dei grattini normali: due linguaggi per la stessa
// notizia. Ora tutti usano queste due fasce (ScratchCardView e MinigameTable).

function Brackets({ color }) {
  return ["tl", "tr", "bl", "br"].map(pos => {
    const [v, h] = pos.split("");
    return (
      <div key={pos} style={{
        position: "absolute", [v === "t" ? "top" : "bottom"]: "4px", [h === "l" ? "left" : "right"]: "4px",
        width: "10px", height: "10px", pointerEvents: "none",
        borderTop: v === "t" ? `2px solid ${color}` : "none", borderBottom: v === "b" ? `2px solid ${color}` : "none",
        borderLeft: h === "l" ? `2px solid ${color}` : "none", borderRight: h === "r" ? `2px solid ${color}` : "none",
      }} />
    );
  });
}

// Nessuna vincita: 😔, badge rosso, motivo in corsivo, OK →.
export function NoWinPanel({ reason, onOk, okLabel = "OK →", prominent = false }) {
  return (
    <div role="status" style={{
      position: "relative", marginTop: "6px", padding: "10px 14px",
      border: `2px solid ${C.red}`, background: "#1a0000",
      display: "flex", alignItems: "center", gap: "12px",
      boxShadow: `0 0 14px ${C.red}55, inset 0 0 16px ${C.red}18`,
    }}>
      <Brackets color={C.red} />
      <div style={{ fontSize: "28px", flexShrink: 0, filter: `drop-shadow(0 0 6px ${C.red}aa)` }}>😔</div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{
          display: "inline-block", background: C.red, color: "#000",
          padding: "2px 8px", fontSize: "10px", fontWeight: "bold", letterSpacing: "2px", marginBottom: "4px",
          boxShadow: `0 0 8px ${C.red}aa`,
        }}>★ NESSUNA VINCITA ★</div>
        <div style={{ color: C.dim, fontSize: "10px", fontStyle: "italic" }}>{reason}</div>
      </div>
      <Btn variant={prominent ? "gold" : "default"} onClick={onOk} style={{
        fontSize: prominent ? "13px" : "11px",
        padding: prominent ? "10px 18px" : "5px 14px",
        flexShrink: 0,
        boxShadow: prominent ? `0 0 16px ${C.gold}88` : undefined,
      }}>{okLabel}</Btn>
    </div>
  );
}

// Vincita: badge verde, premio grande, riga di dettaglio, RITIRA.
export function WinPanel({ amountLabel, detail, onOk, okLabel }) {
  return (
    <div role="status" style={{
      position: "relative", background: "#001a0a", border: `2px solid ${C.green}`,
      padding: "12px 14px", marginBottom: "8px", textAlign: "center",
      boxShadow: `0 0 18px ${C.green}66, inset 0 0 16px ${C.green}18`,
      animation: "outcomeWinFlicker 1.6s steps(1) infinite",
    }}>
      <style>{`@keyframes outcomeWinFlicker { 0% { filter: brightness(1); } 8% { filter: brightness(1.45); } 12% { filter: brightness(0.9); } 16% { filter: brightness(1.2); } 22%, 100% { filter: brightness(1); } }
        @media (prefers-reduced-motion: reduce) { @keyframes outcomeWinFlicker { from {} to {} } }`}</style>
      <Brackets color={C.green} />
      <div style={{
        display: "inline-block", background: C.green, color: "#000",
        padding: "3px 10px", fontSize: "10px", fontWeight: "bold", letterSpacing: "3px", marginBottom: "8px",
        boxShadow: `0 0 10px ${C.green}aa`,
      }}>★ 💰 VINCITA! ★</div>
      <div style={{ color: C.green, fontSize: "20px", fontWeight: "bold", marginBottom: "6px", textShadow: `0 0 15px ${C.green}`, letterSpacing: "1px", fontFamily: FONT }}>
        {amountLabel}
      </div>
      {detail && <div style={{ color: C.dim, fontSize: "11px", marginBottom: "8px" }}>{detail}</div>}
      <Btn variant="gold" onClick={onOk} style={{ fontSize: "14px" }}>{okLabel}</Btn>
    </div>
  );
}
