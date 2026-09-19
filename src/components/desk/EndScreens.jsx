import { MK, mkPanel, MkButton, MkScreen, MkTitle } from "./mapKit.jsx";

// ─── FINE PARTITA E CEDOLE (desktop) ────────────────────────────
// Game over, vittoria e scelta della cedola nei colori della mappa: pannelli
// neri a filo sottile, numeri in chiaro, niente ASCII lampeggiante, glow o
// coriandoli al neon. Stessi dati e stesse azioni della versione mobile.

function StatGrid({ rows, cols = 3 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: "8px" }}>
      {rows.map(([label, val, color]) => (
        <div key={label} style={{ ...mkPanel(), padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "10px", letterSpacing: "2px", color: MK.dim }}>{label}</span>
          <span style={{ fontSize: "20px", color: color || MK.txt }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

export function GameOverDesk({ gameStats, onRetry, onTrophies }) {
  const s = gameStats;
  return (
    <MkScreen width={760} center>
      <MkTitle label="FINE DELLA RUN" title="Game over" color={MK.red}
        sub="Le tue unghie si sono consumate fino all'osso." />
      <StatGrid rows={[
        ["GRATTATE", s.cardsScratched], ["VINTE", s.scratchWins || 0, MK.green], ["PERSE", s.scratchLosses || 0, MK.red],
        ["GUADAGNATO", `€${s.moneyEarned}`, MK.gold.mid], ["SPESO", `€${s.moneySpent || 0}`], ["NODI", s.nodesVisited],
        ["COMBATTIMENTI VINTI", s.combatsWon || 0, MK.green], ["COMBATTIMENTI PERSI", s.combatsLost || 0, MK.red], ["COMBO", s.combosFired || 0],
        ["SOGNI", s.dreamsHad || 0], ["GIRI DI SLOT", s.slotPlays || 0], ["MIGLIOR PREMIO", `€${s.bestPrize || 0}`, MK.gold.mid],
      ]} />
      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <MkButton onClick={onRetry}>↻ RIPROVA</MkButton>
        <MkButton kind="secondary" onClick={onTrophies}>TROFEI</MkButton>
      </div>
    </MkScreen>
  );
}

// La vittoria resta una tessera da grattare: canvas, ref e gestori arrivano
// da scratchlite (stessa logica di prima).
export function VictoryDesk({ revealed, canvas, stats, bossName, biomeCount, onNewRun, onTrophies }) {
  return (
    <MkScreen width={760} center>
      <div style={{ ...mkPanel(MK.gold.mid), position: "relative", padding: "22px 20px", textAlign: "center", userSelect: "none" }}>
        <span style={{ display: "block", fontSize: "11px", letterSpacing: "3px", color: MK.accent, marginBottom: "10px" }}>VITTORIA</span>
        <span style={{ display: "block", fontSize: "44px", lineHeight: 1, color: MK.gold.mid, letterSpacing: "3px" }}>SEI LUDOPATICO</span>
        <span style={{ display: "block", fontSize: "18px", letterSpacing: "6px", color: MK.txt, marginTop: "8px" }}>COMPLIMENTI!</span>
        {!revealed && canvas}
      </div>
      {!revealed && <span style={{ textAlign: "center", fontSize: "12px", letterSpacing: "2px", color: MK.dim }}>gratta la tessera per scoprire il risultato</span>}
      {revealed && <>
        <span style={{ textAlign: "center", fontSize: "14px", lineHeight: 1.6, color: MK.ink }}>
          Hai sconfitto {bossName} e conquistato tutti e {biomeCount} i biomi. Sei il Re dei Grattini, 'o capo d'Italia!
        </span>
        <StatGrid cols={5} rows={stats} />
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <MkButton onClick={onNewRun}>NUOVA RUN</MkButton>
          <MkButton kind="secondary" onClick={onTrophies}>TROFEI</MkButton>
        </div>
      </>}
    </MkScreen>
  );
}

export function CedoleDesk({ offer, active, onPick, onRefuse }) {
  return (
    <MkScreen width={720} center>
      <MkTitle label="IL BROKER TI OFFRE UN ACCORDO" title="Scegli una cedola"
        sub="È permanente e vale dalla prossima run. Ogni vantaggio ha il suo prezzo." />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {offer.map(c => (
          <button key={c.id} type="button" onClick={() => onPick(c)} style={{
            ...mkPanel(), border: "none", cursor: "pointer", padding: "14px 16px", fontFamily: "inherit", textAlign: "left",
            display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto", gap: "14px", alignItems: "center", color: MK.txt,
          }}>
            <span style={{ fontSize: "30px" }}>{c.icon}</span>
            <span style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "16px" }}>{c.name}</span>
              <span style={{ fontSize: "12px", color: MK.green }}>✚ {c.pro}</span>
              <span style={{ fontSize: "12px", color: MK.red }}>✖ {c.contro}</span>
            </span>
            <span style={{ fontSize: "12px", letterSpacing: "2px", color: MK.gold.mid }}>SCEGLI →</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <MkButton kind="secondary" onClick={onRefuse}>RIFIUTA · NESSUNA CEDOLA</MkButton>
        {active && <span style={{ fontSize: "11px", color: MK.dim }}>Cedola attiva: {active.icon} {active.name}</span>}
      </div>
    </MkScreen>
  );
}
