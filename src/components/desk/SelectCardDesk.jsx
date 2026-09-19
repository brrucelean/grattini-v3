import { ticketGuide } from "../../data/cards.js";
import { TicketThumb } from "../TicketThumb.jsx";
import { Tooltip } from "../Tooltip.jsx";
import { MK, mkPanel, MkButton, MkScreen, MkTitle } from "./mapKit.jsx";

// ─── I TUOI BIGLIETTI — cosa grattare (desktop) ─────────────────
// Prima: griglia di riquadri al neon con un'emoji al posto del biglietto.
// Ora i biglietti veri (illustrazione con nome e cartiglio), nei colori
// della mappa, con rarità, prezzo, premio massimo, malus e il GRATTA.

const TIER = { 1: ["COMUNE", "#9aa6b0"], 2: ["MEDIA", "#40c9c0"], 3: ["RARA", "#b07ae0"], 4: ["LEGGENDARIA", "#f2cf44"] };

export function SelectCardDesk({ cards, onSelect, onBack, hasGrattatore }) {
  return (
    <MkScreen width={1100}>
      <MkTitle label="LE TUE TASCHE" title="I tuoi biglietti"
        sub={`${cards.length} ${cards.length === 1 ? "biglietto" : "biglietti"} in mano. Scegli cosa grattare.`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, 240px)", justifyContent: "center", gap: "14px" }}>
        {cards.map((card, idx) => {
          const [tierLabel, tierCol] = TIER[Math.min(4, Math.max(1, card.tier || 1))];
          const locked = card.requiresGrattatore && !hasGrattatore;
          return (
            <article key={idx} aria-label={card.name} style={{ ...mkPanel(), padding: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", textAlign: "center" }}>
              <Tooltip text={ticketGuide(card).how}>
                <button type="button" onClick={() => onSelect(idx)} aria-label={`Gratta ${card.name}`}
                  style={{ border: "none", padding: 0, background: "none", cursor: "pointer" }}>
                  <TicketThumb card={card} width={200} />
                </button>
              </Tooltip>
              <span style={{ fontSize: "10px", letterSpacing: "2px", color: tierCol }}>{tierLabel}</span>
              <span style={{ fontSize: "16px", color: MK.txt }}>{card.name}</span>
              <span style={{ fontSize: "12px", color: MK.ink }}>
                €{card.cost} · <span style={{ color: MK.green }}>fino a €{card.maxPrize}</span>
              </span>
              {card.malus && <span style={{ fontSize: "11px", color: MK.red, lineHeight: 1.4 }}>⚠ {card.malus.desc}</span>}
              {card.requiresGrattatore && <span style={{ fontSize: "11px", color: MK.accent }}>🔧 serve un grattatore in mano</span>}
              <MkButton onClick={() => onSelect(idx)} disabled={locked} style={{ width: "100%", marginTop: "auto" }}>
                {locked ? "PRENDI UN GRATTATORE" : "GRATTA"}
              </MkButton>
            </article>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <MkButton kind="secondary" onClick={onBack}>← TORNA INDIETRO</MkButton>
      </div>
    </MkScreen>
  );
}
