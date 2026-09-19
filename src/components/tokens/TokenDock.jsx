import { useState } from "react";
import { C, FONT } from "../../data/theme.js";
import { TOKENS } from "../../data/tokens.js";
import { Pedina } from "../map/Pedina.jsx";
import { Tooltip } from "../Tooltip.jsx";
import { GOLD, bevel, dither } from "../map/mapTheme.js";

// Tre posti affiancati, come una vera custodia. Il primo è sempre la pedina
// principale; una riserva si trascina lì sopra per scambiarla.
export function TokenDock({ tokens, canSwap = false, onEquip }) {
  const [dragged, setDragged] = useState(null);
  const [selected, setSelected] = useState(null);
  if (!tokens) return null;

  const active = tokens.equipped;
  const reserves = tokens.pouch.filter(id => id !== active);
  const equip = (id) => {
    if (!canSwap || !id || id === active) return;
    onEquip?.(id);
    setDragged(null);
    setSelected(null);
  };

  const reserveSlot = (id, idx) => id ? (
    <Tooltip key={id} text={`${TOKENS[id].name}\n${TOKENS[id].pro}\nTrascina sul primo posto per renderla principale`}>
      <button type="button" draggable={canSwap}
        onDragStart={e => { setDragged(id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/token", id); }}
        onDragEnd={() => setDragged(null)}
        onClick={() => canSwap && setSelected(s => s === id ? null : id)}
        aria-pressed={selected === id}
        aria-label={`${TOKENS[id].name}, pedina di riserva. Trascina sul posto principale`}
        style={{
          width: 142, height: 54, padding: "4px 8px", border: "none", fontFamily: FONT,
          display: "grid", gridTemplateColumns: "38px minmax(0,1fr)", gap: 7, alignItems: "center",
          background: selected === id ? dither("#17413a", "#20534a", 2) : dither("#191714", "#22201b", 2),
          color: "#f2e6c8", cursor: canSwap ? "grab" : "not-allowed",
          boxShadow: selected === id ? bevel({hi:"#7fffe3",mid:"#40c9c0",lo:"#17665e",dark:"#071f1d"}, 1) : bevel(GOLD, 1),
          opacity: canSwap ? 1 : 0.55,
        }}>
        <Pedina id={id} size={34} />
        <span style={{ minWidth: 0, textAlign: "left" }}>
          <span style={{ display: "block", color: GOLD.mid, fontSize: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{TOKENS[id].name}</span>
          <span style={{ display: "block", color: selected === id ? "#7fffe3" : "#8f8878", fontSize: 8, marginTop: 3 }}>{selected === id ? "PRONTA →" : "RISERVA · TRASCINA"}</span>
        </span>
      </button>
    </Tooltip>
  ) : (
    <div key={`empty-${idx}`} style={{ width: 142, height: 54, display: "grid", placeItems: "center",
      border: "1px dashed #514b40", color: "#6e675b", fontSize: 8, letterSpacing: 1 }}>POSTO LIBERO</div>
  );

  return (
    <section aria-label="Custodia pedine" style={{
      height: 76, flexShrink: 0, overflow: "hidden", fontFamily: FONT,
      display: "grid", gridTemplateColumns: "190px 450px minmax(0,1fr)", alignItems: "center", gap: 12,
      padding: "5px 14px", boxSizing: "border-box", background: dither("#15130f", "#1d1a14", 3),
      borderTop: `2px solid ${GOLD.dark}`, boxShadow: `inset 0 2px 0 ${GOLD.lo}`,
    }}>
      <div>
        <span style={{ display:"block", color: GOLD.mid, fontSize: 11, letterSpacing: 2 }}>CUSTODIA PEDINE</span>
        <span style={{ display:"block", color: canSwap ? "#a9a18f" : C.orange, fontSize: 8, lineHeight: 1.35, marginTop: 4 }}>
          {canSwap ? "Trascina una riserva sul primo posto." : "Cambio bloccato fino al ritorno sulla mappa."}
        </span>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
        <div role="button" tabIndex={canSwap && selected ? 0 : -1}
          onClick={() => selected && equip(selected)}
          onKeyDown={e => { if ((e.key === "Enter" || e.key === " ") && selected) { e.preventDefault(); equip(selected); } }}
          onDragOver={e => { if (canSwap) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } }}
          onDrop={e => { e.preventDefault(); equip(dragged || e.dataTransfer.getData("text/token")); }}
          aria-label={`Pedina principale: ${TOKENS[active]?.name}. Trascina qui una riserva`}
          style={{ width:142, height:54, boxSizing:"border-box", padding:"4px 8px", display:"grid",
            gridTemplateColumns:"38px minmax(0,1fr)", gap:7, alignItems:"center",
            background: dragged ? "#5a3d0b" : "#211a0c", boxShadow: bevel(GOLD, 2), color:GOLD.hi,
            outline: dragged ? `2px solid ${GOLD.hi}` : "none", cursor:selected ? "pointer" : "default" }}>
          <Pedina id={active} size={34} />
          <span style={{ minWidth:0 }}>
            <span style={{ display:"block", fontSize:8, letterSpacing:1 }}>PRINCIPALE</span>
            <span style={{ display:"block", fontSize:9, marginTop:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{TOKENS[active]?.name}</span>
          </span>
        </div>
        {reserveSlot(reserves[0], 0)}
        {reserveSlot(reserves[1], 1)}
      </div>

      <div style={{ color:"#817a6c", fontSize:8, lineHeight:1.45, borderLeft:`1px solid ${GOLD.lo}`, paddingLeft:12 }}>
        Il primo gettone è quello attivo. Trascinane un altro sopra, oppure selezionalo e poi clicca il primo posto.
      </div>
    </section>
  );
}
