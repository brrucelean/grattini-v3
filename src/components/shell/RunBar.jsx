import { useState, memo } from "react";
import { C } from "../../data/theme.js";
import { AudioEngine } from "../../audio.js";
import { fmtMoney } from "../../utils/money.js";
import { Tooltip } from "../Tooltip.jsx";
import { Asset } from "../Asset.jsx";
import { NailPipRow } from "../NailMeter.jsx";
import { getStatusChips } from "./statusChips.js";
import { SH, edge } from "./shellTokens.js";

// ─── RUN BAR — barra risorse della shell desktop (48 px) ─────────
// Sostituisce l'HUD legacy da 1024 px in su. Stessi contenuti: soldi,
// grattini, vite (pallini per unghia), stati attivi, volume, zaino.
// Le emoji restano come fallback finché non esistono gli sprite HUD.

const PILL_H = 32;

function Pill({ color, children, strong = false, onClick, label, audio, style = {} }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick} aria-label={label} data-audio={audio}
      style={{
        display:"inline-flex", alignItems:"center", gap:"8px",
        height:`${PILL_H}px`, boxSizing:"border-box", padding:"0 12px",
        border: edge(strong ? color : `${color}99`), background: SH.panel,
        color, fontFamily: SH.font, lineHeight:1, whiteSpace:"nowrap", flexShrink:0,
        boxShadow: strong ? "2px 2px 0 #000" : "none",
        cursor: onClick ? "pointer" : "default", userSelect:"none",
        ...style,
      }}>{children}</Tag>
  );
}

function RunBarImpl({ player, onOpenInventory, inventoryOpen = false, moneyBling = 0, hideInventoryButton = false }) {
  const [vol, setVol] = useState(AudioEngine.getVolume());
  const setVolume = (v) => { setVol(v); AudioEngine.setVolume(v); };
  const muted = vol === 0;

  const aliveNails = player.nails.filter(n => n.state !== "morta").length;
  const viteColor = aliveNails <= 1 ? C.red : aliveNails <= 2 ? C.orange : C.green;
  const ownedCards = player.scratchCards.filter(c => c.owned).length;
  const bagCount = (player.items?.length || 0) + (player.grattatori?.length || 0);
  const chips = getStatusChips(player);

  return (
    <div role="region" aria-label="Risorse della run" style={{
      height:`${SH.barH}px`, flexShrink:0, boxSizing:"border-box", width:"100%", alignSelf:"stretch",
      display:"flex", alignItems:"center", gap:`${SH.gap}px`,
      padding:`0 ${SH.gap}px`,
      background: SH.panel, borderBottom: edge(SH.line),
      fontFamily: SH.font,
    }}>
      {/* Lampo netto a due colpi quando entrano soldi: niente glow. */}
      <style>{`@keyframes shellMoneyHit { 0% { background:${C.gold}; color:#000; } 50% { background:${SH.panel}; color:${C.gold}; } }
        @media (prefers-reduced-motion: reduce) { @keyframes shellMoneyHit { from {} to {} } }`}</style>
      {/* ── Soldi: primo livello di lettura ── */}
      <Tooltip text="🤑 i tuoi SUDATISSIMI soldi!! spendili bene o piangi">
        <Pill key={moneyBling} color={C.gold} strong label={`Soldi: ${fmtMoney(player.money)} euro`}
          style={{fontSize:"18px", minWidth:"136px", justifyContent:"flex-start",
            animation: moneyBling > 0 ? "shellMoneyHit 0.5s steps(1) 2" : "none"}}>
          <Asset id="hud-soldi" emoji="💰" size={20} />
          <span style={{fontVariantNumeric:"tabular-nums"}}>€{fmtMoney(player.money)}</span>
        </Pill>
      </Tooltip>

      <Tooltip text="🎫 grattini tuoi — comprati al tabaccaio">
        <Pill color={C.cyan} label={`Grattini: ${ownedCards}`} style={{fontSize:"15px"}}>
          <Asset id="hud-grattino" emoji="🎫" size={18} />
          <b style={{fontVariantNumeric:"tabular-nums"}}>{ownedCards}</b>
        </Pill>
      </Tooltip>

      <Tooltip text={`💀 unghie ancora vive su ${player.nails.length} — se arrivano a 0 sei MORTO poverino`}>
        <Pill color={viteColor} label={`Unghie vive: ${aliveNails} su ${player.nails.length}`}
          style={{fontSize:"15px", background: aliveNails <= 1 ? "#1a0508" : SH.panel}}>
          <span style={{color:SH.dim, fontSize:"11px", letterSpacing:"1.5px"}}>VITE</span>
          <NailPipRow nails={player.nails} size="md" gap={3} />
          <b style={{fontVariantNumeric:"tabular-nums"}}>{aliveNails}/{player.nails.length}</b>
        </Pill>
      </Tooltip>

      {/* ── Stati attivi: pericolo prima, poi bonus ── */}
      <div aria-label="Stati attivi" style={{display:"flex", alignItems:"center", gap:"4px", minWidth:0, overflow:"hidden", flex:1}}>
        {chips.map(ch => (
          <Tooltip key={ch.key} text={ch.tip} color={ch.color}>
            <span onClick={ch.openInventory ? onOpenInventory : undefined} style={{
              display:"inline-flex", alignItems:"center", gap:"4px",
              height:"24px", boxSizing:"border-box", padding:"0 8px",
              border: edge(ch.danger ? ch.color : `${ch.color}99`),
              background: ch.danger ? "#1a0508" : SH.world,
              color: ch.color, fontSize:"12px", whiteSpace:"nowrap", flexShrink:0,
              cursor: ch.openInventory ? "pointer" : "default",
            }}>
              <Asset id={ch.iconId} emoji={ch.emoji} size={14} />
              {ch.label && <span>{ch.label}</span>}
            </span>
          </Tooltip>
        ))}
      </div>

      {/* ── Volume ── */}
      <Tooltip text="🔊 volume musicale — alzalo e GODITI l'8-bit bro">
        <span style={{display:"inline-flex", alignItems:"center", gap:"8px", height:`${PILL_H}px`,
          padding:"0 8px", border: edge(SH.line), flexShrink:0}}>
          <button type="button" onClick={() => setVolume(muted ? 0.7 : 0)}
            aria-label={muted ? "Riattiva audio" : "Disattiva audio"}
            style={{background:"none", border:"none", padding:0, color:SH.dim, fontSize:"15px", lineHeight:1, cursor:"pointer"}}>
            {muted ? "🔇" : vol < 0.4 ? "🔈" : "🔊"}
          </button>
          <input type="range" min="0" max="1" step="0.05" value={vol} aria-label="Volume"
            onChange={e => setVolume(parseFloat(e.target.value))}
            style={{width:"64px", height:"4px", accentColor: C.gold, cursor:"pointer"}} />
        </span>
      </Tooltip>

      {/* ── Zaino: unico comando della barra ── */}
      {onOpenInventory && !hideInventoryButton && (() => {
        const col = bagCount > 0 || inventoryOpen ? C.gold : C.dim;
        return (
          <Pill color={col} strong onClick={onOpenInventory} audio="none"
            label={`Zaino, ${bagCount} oggetti${inventoryOpen ? ", aperto" : ""}`}
            style={{fontSize:"13px", letterSpacing:"1.5px",
              background: inventoryOpen ? `${col}33` : SH.panel}}>
            <Asset id="hud-zaino" emoji="🎒" size={18} />
            ZAINO
            <span style={{minWidth:"20px", textAlign:"center", background: col, color:"#000",
              padding:"2px 4px", fontVariantNumeric:"tabular-nums"}}>{bagCount}</span>
          </Pill>
        );
      })()}
    </div>
  );
}

export const RunBar = memo(RunBarImpl);
