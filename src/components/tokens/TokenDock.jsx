import { useState } from "react";
import { C, FONT, FONT_TITLE } from "../../data/theme.js";
import { TOKENS, TOKEN_RARITY, TOKEN_RARITY_COLOR } from "../../data/tokens.js";
import { Pedina } from "../map/Pedina.jsx";
import { Tooltip } from "../Tooltip.jsx";
import { GOLD, bevel, dither } from "../map/mapTheme.js";

// Custodia sotto la mappa. Il clic apre la scheda; il trascinamento porta la
// sola pedina sulla mappa e la rende attiva. Anche la pedina già attiva può
// essere trascinata (il rilascio non cambia lo stato).
export function TokenDock({ tokens, canSwap = false }) {
  const [detailId, setDetailId] = useState(null);
  if (!tokens) return null;

  const active = tokens.equipped;
  const ordered = [active, ...tokens.pouch.filter(id => id !== active)];

  const tokenSlot = (id, idx) => id ? (
    <Tooltip key={id} text={`${TOKENS[id].name}\nClic: informazioni · Trascina: usa sulla mappa`}>
      <button type="button" draggable={canSwap}
        onDragStart={e => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/token", id);
          const ghost = e.currentTarget.querySelector("[data-token-ghost]");
          if (ghost) e.dataTransfer.setDragImage(ghost, 17, 17);
        }}
        onClick={() => setDetailId(id)}
        aria-label={`${TOKENS[id].name}, ${idx === 0 ? "pedina principale" : "pedina di riserva"}. Clicca per le informazioni o trascina sulla mappa`}
        style={{
          width: 142, height: 54, padding: "4px 8px", border: "none", fontFamily: FONT,
          display: "grid", gridTemplateColumns: "38px minmax(0,1fr)", gap: 7, alignItems: "center",
          background: idx === 0 ? dither("#2d220c", "#3b2e10", 2) : dither("#191714", "#22201b", 2),
          color: "#f2e6c8", cursor: canSwap ? "grab" : "pointer",
          boxShadow: idx === 0 ? bevel(GOLD, 2) : bevel(GOLD, 1), opacity: canSwap ? 1 : 0.7,
        }}>
        <span data-token-ghost style={{ display:"inline-flex", width:34, height:34 }}><Pedina id={id} size={34} /></span>
        <span style={{ minWidth: 0, textAlign: "left" }}>
          <span style={{ display:"block", color:GOLD.mid, fontSize:9, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{TOKENS[id].name}</span>
          <span style={{ display:"block", color:idx === 0 ? GOLD.hi : "#8f8878", fontSize:8, marginTop:3 }}>
            {idx === 0 ? "PRINCIPALE · TRASCINA" : "RISERVA · TRASCINA"}
          </span>
        </span>
      </button>
    </Tooltip>
  ) : (
    <div key={`empty-${idx}`} style={{ width:142, height:54, display:"grid", placeItems:"center",
      border:"1px dashed #514b40", color:"#6e675b", fontSize:8, letterSpacing:1 }}>POSTO LIBERO</div>
  );

  const detail = detailId && TOKENS[detailId];
  const rarity = detail && TOKEN_RARITY[detail.rarity];
  const rarityColor = detail ? TOKEN_RARITY_COLOR[detail.rarity] : GOLD.mid;

  return (
    <>
      <section aria-label="Custodia pedine" style={{
        height:76, flexShrink:0, overflow:"hidden", fontFamily:FONT,
        display:"grid", gridTemplateColumns:"190px 450px minmax(0,1fr)", alignItems:"center", gap:12,
        padding:"5px 14px", boxSizing:"border-box", background:dither("#15130f", "#1d1a14", 3),
        borderTop:`2px solid ${GOLD.dark}`, boxShadow:`inset 0 2px 0 ${GOLD.lo}`,
      }}>
        <div>
          <span style={{ display:"block", color:GOLD.mid, fontSize:11, letterSpacing:2 }}>CUSTODIA PEDINE</span>
          <span style={{ display:"block", color:canSwap ? "#a9a18f" : C.orange, fontSize:8, lineHeight:1.35, marginTop:4 }}>
            {canSwap ? "Clicca per leggere · trascina sulla mappa per attivare." : "Cambio bloccato fino al ritorno sulla mappa."}
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {Array.from({ length:3 }, (_, idx) => tokenSlot(ordered[idx], idx))}
        </div>

        <div style={{ color:"#817a6c", fontSize:8, lineHeight:1.45, borderLeft:`1px solid ${GOLD.lo}`, paddingLeft:12 }}>
          Trascina qualunque gettone fuori dalla custodia e rilascialo direttamente sul tabellone.
        </div>
      </section>

      {detail && (
        <div role="dialog" aria-modal="true" aria-label={`Scheda ${detail.name}`} onClick={() => setDetailId(null)} style={{
          position:"fixed", inset:0, zIndex:99996, display:"grid", placeItems:"center",
          background:"rgba(3,4,6,.82)", backdropFilter:"blur(2px)", fontFamily:FONT,
        }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"min(520px,92vw)", color:"#f2e6c8",
            background:dither("#17140f", "#211c13", 3), boxShadow:`${bevel(GOLD, 3)}, 10px 10px 0 #000`, position:"relative" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px",
              background:"#0b0a08", borderBottom:`2px solid ${GOLD.lo}` }}>
              <span style={{ color:GOLD.mid, fontSize:10, letterSpacing:3 }}>SCHEDA PEDINA</span>
              <span style={{ color:rarityColor, fontSize:9, letterSpacing:2 }}>{rarity?.label.toUpperCase()}</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"128px minmax(0,1fr)", gap:18, padding:20 }}>
              <div style={{ minHeight:128, display:"grid", placeItems:"center", background:"#090908", boxShadow:bevel(GOLD,1) }}>
                <Pedina id={detailId} size={92} />
              </div>
              <div>
                <div style={{ fontFamily:FONT_TITLE, fontSize:24, lineHeight:1, color:GOLD.hi, marginBottom:14 }}>{detail.name}</div>
                {[
                  ["▲ VANTAGGIO", detail.pro, "#7be08a"],
                  ["▼ FREGATURA", detail.contro, "#ff7a6a"],
                  ["◷ QUANDO", detail.quando, "#c8c0a8"],
                ].map(([label,value,color]) => (
                  <div key={label} style={{ marginBottom:11 }}>
                    <div style={{ color, fontSize:9, letterSpacing:1.5, marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:12, lineHeight:1.45 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"10px 14px",
              borderTop:`1px solid ${GOLD.lo}`, background:"#0e0c09" }}>
              <span style={{ color:"#9d947f", fontSize:9 }}>Chiudi la scheda, poi trascina la pedina sulla mappa.</span>
              <button type="button" onClick={() => setDetailId(null)} style={{ border:"none", padding:"7px 16px", cursor:"pointer",
                background:GOLD.mid, color:"#211707", fontFamily:FONT, fontSize:10, boxShadow:"2px 2px 0 #000" }}>CHIUDI</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
