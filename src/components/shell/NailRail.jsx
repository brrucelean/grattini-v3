import { memo } from "react";
import { C } from "../../data/theme.js";
import { NAIL_INFO } from "../../data/nails.js";
import { ALL_IMPLANTS_META, CHIRURGO_IMPLANT_IDS } from "../../data/items.js";
import { getNailVisual } from "../../utils/nail.js";
import { Tooltip } from "../Tooltip.jsx";
import { Asset } from "../Asset.jsx";
import { NailTierBar, NailScratchBar, NailSlotBar, readNail, CHIRURGO_SLOT_MAX } from "../NailMeter.jsx";
import { SH, edge, labelStyle } from "./shellTokens.js";

// ─── NAIL RAIL — colonna sinistra della shell desktop (192 px) ───
// Unico posto dove si sceglie l'unghia. Modulare: il numero di dita cambia
// durante la run (5 di partenza, +5 della mano sinistra con la Doppia Mano,
// +1 piede) e ogni dito può cambiare natura (stati, kawaii, impianti,
// gettoni…). Ogni riga è un "dito" generico; la densità si adatta al numero.

const CHIRURGO_SLOTS = {
  plastica: { max: CHIRURGO_SLOT_MAX.plastica, color: "#44ddee", label: "PLASTICA" },
  ferro:    { max: CHIRURGO_SLOT_MAX.ferro,    color: "#c0c0d0", label: "FERRO" },
  oro:      { max: CHIRURGO_SLOT_MAX.oro,      color: "#ffd700", label: "ORO" },
};

// Gruppo di appartenenza: `nail.hand` vince, altrimenti l'ordine in cui le
// dita vengono aggiunte oggi (0-4 destra, 5-9 sinistra, dal 10 il piede).
const GROUP_LABEL = { dx: "MANO DESTRA", sx: "MANO SINISTRA", piede: "PIEDE" };
function groupOf(n, i) {
  if (n.hand) return n.hand;
  if (i < 5) return "dx";
  if (i < 10 && n.state !== "piede") return "sx";
  return "piede";
}

function tipFor(n, info, chirurgo, meter) {
  const lines = [];
  if (chirurgo) {
    lines.push(`${chirurgo.label} — ${n.implantUses}/${chirurgo.max} slot rimasti`);
    lines.push("Non sanguina — si spezza a slot 0.");
  } else {
    lines.push(`${info.label} — x${(info.mult || 0).toFixed(1)} premio`);
    lines.push(`HP: ${meter.aliveTiers}/5 tier · ${3 - (n.state === "morta" ? 0 : n.scratchCount)}/3 grattate rimaste`);
  }
  if (n.cremaHP > 0) lines.push(`🧴 Crema: ${n.cremaHP} colpi extra`);
  if (n.smalto > 0) lines.push(`💅 Smalto: ${n.smalto} colpi protetti`);
  if (n.implant) {
    const imp = ALL_IMPLANTS_META.find(im => im.id === n.implant);
    if (imp) lines.push(`⚙ ${imp.name}: ${imp.desc}`);
  }
  return lines.join("\n");
}

function FingerRow({ n, i, active, locked, dense, onSelect }) {
  const info = NAIL_INFO[n.state] || NAIL_INFO.sana;
  const visual = getNailVisual(n);
  const col = visual?.color || info.color;
  const isDead = n.state === "morta";
  const meter = readNail(n);
  const chirurgo = !isDead && CHIRURGO_IMPLANT_IDS.has(n.implant) ? CHIRURGO_SLOTS[n.implant] : null;
  // Dita della V2 (nail-<stato>.webp, P-07): le -v3 restano su disco ma non si usano
  const spriteId = n.implant ? null : `nail-${n.state}`;
  const canSwitch = !isDead && !active && !locked;
  const name = chirurgo ? chirurgo.label : `${meter.glyph ? meter.glyph + " " : ""}${dense ? meter.shortLabel : info.label}`;
  const mult = chirurgo ? `${n.implantUses}/${chirurgo.max}` : `×${(info.mult || 0).toFixed(1)}`;
  const sprite = dense ? 32 : 48;

  return (
    <Tooltip text={tipFor(n, info, chirurgo, meter)} color={col}>
      <button type="button" disabled={!canSwitch && !active}
        data-audio="nail"
        data-audio-variant={i}
        onClick={canSwitch ? () => onSelect(i) : undefined}
        aria-pressed={active}
        aria-label={`Dito ${i + 1}: ${chirurgo ? chirurgo.label : info.label}, ${chirurgo ? mult + " slot" : mult + " premio"}${active ? ", in uso" : ""}${isDead ? ", fuori gioco" : ""}`}
        style={{
          position:"relative", width:"100%", boxSizing:"border-box",
          display:"grid", gridTemplateColumns:`${sprite}px minmax(0,1fr)`, alignItems:"center", gap:"8px",
          minHeight: dense ? "40px" : "88px", padding: dense ? "4px 8px" : "8px",
          background: active ? SH.panel2 : isDead ? SH.world : SH.panel,
          border: edge(active ? (meter.off ? meter.off.borderCol : col) : isDead ? SH.line : meter.off ? meter.off.borderCol : `${col}66`),
          boxShadow: active ? SH.shadow : "none",
          opacity: isDead ? 0.45 : 1,
          color: SH.ink, fontFamily: SH.font, textAlign:"left",
          cursor: canSwitch ? "pointer" : "default",
        }}>
        {/* Sprite del dito (emoji come riserva finché manca lo sprite) */}
        <span style={{width:`${sprite}px`, height:`${sprite}px`, display:"flex", alignItems:"center", justifyContent:"center",
          background: SH.world, border: edge(isDead ? SH.line : `${col}55`), boxSizing:"border-box"}}>
          <Asset id={spriteId} emoji={visual?.emoji || "🖐"} size={sprite - 8} pixel={false} />
        </span>

        <span style={{display:"grid", gap: dense ? "3px" : "6px", minWidth:0}}>
          <span style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:"4px"}}>
            <span style={{color: isDead ? "#8a8aa0" : meter.off ? meter.off.glyphCol : col, fontSize: dense ? "11px" : "13px", fontWeight:"bold",
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{name}</span>
            <span style={{color: SH.dim, fontSize:"11px", fontVariantNumeric:"tabular-nums", flexShrink:0}}>{mult}</span>
          </span>
          {chirurgo
            ? <NailSlotBar nail={n} chirurgo={chirurgo} active={active} size={dense ? "sm" : "md"} />
            : dense
              ? <NailScratchBar nail={n} active={active} size="sm" showCount={false} />
              : <>
                  <NailTierBar nail={n} active={active} size="md" />
                  <NailScratchBar nail={n} active={active} size="md" />
                </>}
          {!dense && (n.smalto > 0 || n.cremaHP > 0) && (
            <span style={{display:"flex", gap:"8px", fontSize:"11px"}}>
              {n.smalto > 0 && <span style={{color:C.magenta}}>💅×{n.smalto}</span>}
              {n.cremaHP > 0 && <span style={{color:C.cyan}}>🧴×{n.cremaHP}</span>}
            </span>
          )}
        </span>

        {active && (
          <span aria-hidden style={{position:"absolute", left:"-2px", top:"-2px", bottom:"-2px", width:"6px", background: col}} />
        )}
        {locked && !active && !isDead && (
          <span aria-hidden style={{position:"absolute", inset:0, background:"#000000b0",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", color:C.orange, letterSpacing:"1px"}}>🔒</span>
        )}
      </button>
    </Tooltip>
  );
}

function NailRailImpl({ nails, activeNail, onSelectNail, locked = false, equippedGrattatore = null }) {
  const dense = nails.length > 6;
  const alive = nails.filter(n => n.state !== "morta").length;

  // Raggruppa mantenendo l'indice originale (serve a onSelectNail).
  const groups = [];
  nails.forEach((n, i) => {
    const g = groupOf(n, i);
    const last = groups[groups.length - 1];
    if (last && last.key === g) last.items.push(i); else groups.push({ key: g, items: [i] });
  });
  const showGroups = groups.length > 1;

  return (
    <nav aria-label="Unghie" style={{
      width:`${SH.railW}px`, flexShrink:0, boxSizing:"border-box",
      display:"flex", flexDirection:"column", minHeight:0,
      background: SH.panel, borderRight: edge(SH.line),
      fontFamily: SH.font,
    }}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 8px", height:"32px", flexShrink:0, borderBottom: edge(SH.line)}}>
        <span style={{...labelStyle, color: locked ? C.orange : SH.ink}}>{locked ? "🔒 Bloccate" : "Unghie"}</span>
        <span style={{...labelStyle, fontVariantNumeric:"tabular-nums"}}>{alive}/{nails.length}</span>
      </div>

      <div style={{flex:1, minHeight:0, overflowY:"auto", padding:"8px", display:"flex", flexDirection:"column", gap: dense ? "2px" : "8px"}}>
        {groups.map(g => (
          <div key={g.key + g.items[0]} role="group" aria-label={GROUP_LABEL[g.key] || g.key}
            style={{display:"flex", flexDirection:"column", gap: dense ? "4px" : "8px"}}>
            {showGroups && <span style={{...labelStyle, padding:"2px 0 0"}}>{GROUP_LABEL[g.key] || g.key}</span>}
            {g.items.map(i => (
              <FingerRow key={i} n={nails[i]} i={i} active={i === activeNail} locked={locked}
                dense={dense} onSelect={onSelectNail} />
            ))}
          </div>
        ))}
      </div>

      {/* Grattatore equipaggiato: sostituisce l'unghia nel gesto */}
      {equippedGrattatore && (() => {
        const g = equippedGrattatore;
        const uses = g.usesLeft || 0;
        return (
          <Tooltip text={`${g.emoji} ${g.name}\n${g.desc}\n${uses > 10 ? uses : uses + "/" + (g.maxUses || uses)} usi rimasti`} color={C.cyan}>
            <div style={{margin:"0 8px 8px", padding:"8px", border: edge(C.cyan), background: SH.world,
              display:"grid", gridTemplateColumns:"24px minmax(0,1fr)", gap:"8px", alignItems:"center"}}>
              <Asset id={`item-${g.id}`} emoji={g.emoji} size={24} />
              <span style={{minWidth:0, display:"grid", gap:"4px"}}>
                <span style={{...labelStyle, color:C.cyan}}>Grattatore</span>
                <span style={{color:C.cyan, fontSize:"12px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{g.name}</span>
                <span style={{display:"flex", gap:"2px", flexWrap:"wrap", alignItems:"center"}}>
                  {Array(Math.min(uses, 10)).fill(0).map((_, pi) => (
                    <span key={pi} style={{width:"8px", height:"6px", background:C.cyan}} />
                  ))}
                  {uses > 10 && <span style={{color:C.cyan, fontSize:"11px", marginLeft:"2px"}}>{uses}</span>}
                </span>
              </span>
            </div>
          </Tooltip>
        );
      })()}

      <div style={{...labelStyle, textAlign:"center", padding:"8px", borderTop: edge(SH.line), flexShrink:0,
        color: locked ? C.orange : SH.dim, letterSpacing:"1px"}}>
        {locked ? "Finisci il grattino" : "Clicca per cambiare"}
      </div>
    </nav>
  );
}

export const NailRail = memo(NailRailImpl);
