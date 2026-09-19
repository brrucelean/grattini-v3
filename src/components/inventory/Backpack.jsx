import { FONT } from "../../data/theme.js";
import { ITEM_DEFS, GRATTATORE_DEFS } from "../../data/items.js";
import { Asset } from "../Asset.jsx";
import { Tooltip } from "../Tooltip.jsx";

// ─── ZAINO — si apre al centro, materico come le vecchie app iOS ──
// Tradotto in pixel art: cuoio a dithering, cuciture tratteggiate, patta con
// targhetta d'ottone e cinghia, due tasche di tela con alloggiamenti incassati
// (quelli liberi restano tratteggiati: si vede quanto spazio c'è).
// Niente sfumature: rilievi fatti con ombre dure a gradini.
// Stesse azioni di prima: clic su un consumabile = usalo, clic su un
// grattatore = prendilo in mano / posalo.

const LEATHER = "repeating-conic-gradient(#6b3a1e 0% 25%, #74411f 0% 50%) 0 0 / 4px 4px";
const LEATHER_DARK = "repeating-conic-gradient(#4e2a14 0% 25%, #573016 0% 50%) 0 0 / 4px 4px";
const CANVAS = "repeating-conic-gradient(#2c2a22 0% 25%, #33302a 0% 50%) 0 0 / 4px 4px";
const BRASS = { hi: "#f3d98a", mid: "#c9a24a", lo: "#8a6a22", dark: "#3a2808" };
const STITCH = "#e3c28a";
const INK = "#f2e6c8";

const RARITY = { comune: "#9aa6b0", media: "#40c9c0", rara: "#b07ae0", epica: "#e08a3a", rarissimo: "#f2cf44", rarissima: "#f2cf44" };

const brassPlate = {
  background: BRASS.mid, color: BRASS.dark,
  boxShadow: `inset 0 0 0 2px ${BRASS.dark}, inset 2px 2px 0 2px ${BRASS.hi}, inset -2px -2px 0 2px ${BRASS.lo}, 3px 3px 0 #1a0c04`,
};

function Slot({ children, filled, active, onClick, label }) {
  return (
    <button type="button" onClick={onClick} disabled={!filled} aria-label={label} style={{
      position: "relative", width: "100%", aspectRatio: "1 / 1.12", boxSizing: "border-box", padding: "6px 4px",
      display: "grid", gridTemplateRows: "1fr auto auto", justifyItems: "center", alignItems: "center", gap: "3px",
      fontFamily: FONT, cursor: filled ? "pointer" : "default", border: "none",
      // alloggiamento incassato nella tela: ombra dura in alto a sinistra
      background: filled ? "#1c1a15" : "transparent",
      boxShadow: filled
        ? (active ? `inset 0 0 0 2px ${BRASS.mid}, inset 3px 3px 0 0 #0c0b08` : "inset 3px 3px 0 0 #0c0b08, inset -1px -1px 0 0 #4a463c")
        : "none",
      outline: filled ? "none" : "2px dashed #4a463c", outlineOffset: "-4px",
      color: INK,
    }}>{children}</button>
  );
}

function Pocket({ title, count, children }) {
  return (
    <section style={{
      background: CANVAS, padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: "10px",
      // tasca cucita sul cuoio
      boxShadow: "inset 0 0 0 2px #15130f, 0 0 0 3px #4e2a14, 0 0 0 5px #1a0c04",
      outline: `2px dashed ${STITCH}`, outlineOffset: "4px", minWidth: 0, minHeight: 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "12px", letterSpacing: "2px", color: STITCH }}>{title}</span>
        <span style={{ fontSize: "11px", color: "#a8987a" }}>{count}</span>
      </div>
      {children}
    </section>
  );
}

export function Backpack({ player, maxItems = 8, onUseItem, onToggleTool, onClose }) {
  const items = player.items || [];
  const tools = player.grattatori || [];
  const itemSlots = Math.max(maxItems, items.length);
  const toolSlots = Math.max(4, Math.ceil(tools.length / 4) * 4);

  return (
    <div role="dialog" aria-modal="true" aria-label="Zaino" style={{
      position: "fixed", inset: 0, zIndex: 99995, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", fontFamily: FONT, pointerEvents: "none",
    }}>
      <style>{`@keyframes bpOpen { 0% { transform: translateY(-16px); } 50% { transform: translateY(-6px); } 100% { transform: none; } }
        @media (prefers-reduced-motion: reduce) { .bp-body { animation: none !important; } }`}</style>
      <div className="bp-body" style={{
        pointerEvents: "auto", width: "min(820px, 100%)", maxHeight: "calc(100vh - 32px)", overflow: "hidden",
        background: LEATHER, boxSizing: "border-box",
        boxShadow: "inset 0 0 0 3px #2a1608, inset 4px 4px 0 3px #8a5530, inset -4px -4px 0 3px #3e2010, 8px 8px 0 #0a0503",
        outline: `2px dashed ${STITCH}`, outlineOffset: "-12px",
        animation: "bpOpen 0.18s steps(3)", position: "relative", display: "flex", flexDirection: "column",
      }}>
        {/* ── Patta con targhetta, cinghia e fibbia ── */}
        <div style={{ position: "relative", background: LEATHER_DARK, padding: "18px 24px 22px", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "inset 0 -4px 0 0 #2a1608", outline: `2px dashed ${STITCH}`, outlineOffset: "-10px" }}>
          <span style={{ ...brassPlate, fontSize: "20px", letterSpacing: "6px", padding: "8px 22px" }}>ZAINO</span>
          {/* cinghia verticale con fibbia */}
          <span aria-hidden style={{ position: "absolute", left: "50%", bottom: "-18px", transform: "translateX(-50%)", width: "34px", height: "30px",
            background: "#3e2010", boxShadow: "inset 0 0 0 2px #1a0c04", zIndex: 2 }}>
            <span style={{ position: "absolute", left: "5px", right: "5px", top: "8px", height: "12px", ...brassPlate, boxShadow: `inset 0 0 0 2px ${BRASS.dark}` }} />
          </span>
          <button type="button" onClick={onClose} aria-label="Chiudi lo zaino" style={{
            position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", width: "34px", height: "34px",
            ...brassPlate, border: "none", cursor: "pointer", fontFamily: FONT, fontSize: "16px",
          }}>✕</button>
        </div>

        {/* ── Tasche ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.35fr) minmax(0,1fr)",
          gap: "22px", padding: "34px 26px 18px", flex: 1, minHeight: 0,
        }}>
          <Pocket title="CONSUMABILI" count={`${items.length}/${maxItems}`}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "8px" }}>
              {Array.from({ length: itemSlots }, (_, idx) => {
                const id = items[idx];
                const it = id ? ITEM_DEFS[id] : null;
                if (!it) return <Slot key={idx} filled={false} label="Alloggiamento libero" />;
                return (
                  <Tooltip key={idx} text={`${it.name}\n${it.desc}\nclic per usarlo`}>
                    <Slot filled label={`${it.name}: usa`} onClick={() => onUseItem(idx, id)}>
                      <Asset id={`item-${id}`} emoji={it.emoji} size={32} />
                      <span style={{ fontSize: "10px", width: "100%", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</span>
                      <span aria-label={`rarità ${it.rarity || "comune"}`} style={{ width: 8, height: 8, background: RARITY[it.rarity] || RARITY.comune, boxShadow: "0 0 0 1px #0c0b08" }} />
                    </Slot>
                  </Tooltip>
                );
              })}
            </div>
          </Pocket>

          <Pocket title="GRATTATORI" count={`${tools.length}`}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "8px" }}>
              {Array.from({ length: toolSlots }, (_, idx) => {
                const g = tools[idx];
                if (!g) return <Slot key={idx} filled={false} label="Alloggiamento libero" />;
                const def = GRATTATORE_DEFS[g.id];
                const inHand = player.equippedGrattatore?.inventoryIdx === idx;
                const uses = g.usesLeft || 0;
                return (
                  <Tooltip key={idx} text={`${g.name}\n${g.desc || def?.desc || ""}\n${uses} usi · clic per ${inHand ? "posarlo" : "prenderlo"}`}>
                    <Slot filled active={inHand} label={`${g.name}, ${uses} usi${inHand ? ", in mano" : ""}`} onClick={() => onToggleTool(idx, inHand)}>
                      <Asset id={`item-${g.id}`} emoji={g.emoji} size={32} />
                      <span style={{ fontSize: "10px", width: "100%", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</span>
                      <span aria-hidden style={{ display: "flex", gap: "2px", height: "8px", alignItems: "center" }}>
                        {Array(Math.min(uses, 6)).fill(0).map((_, i) => <span key={i} style={{ width: 5, height: 5, background: inHand ? BRASS.mid : "#a8987a" }} />)}
                        {uses > 6 && <span style={{ fontSize: "9px", color: "#a8987a" }}>+{uses - 6}</span>}
                      </span>
                      {inHand && (
                        <span style={{ position: "absolute", top: "-6px", left: "50%", transform: "translateX(-50%)", fontSize: "9px", letterSpacing: "1px",
                          padding: "1px 6px", whiteSpace: "nowrap", ...brassPlate }}>IN MANO</span>
                      )}
                    </Slot>
                  </Tooltip>
                );
              })}
            </div>
          </Pocket>

        </div>

        <div style={{ padding: "0 26px 22px", flexShrink: 0, textAlign: "center", fontSize: "11px", color: STITCH, letterSpacing: "1px" }}>
          Clic su un consumabile per usarlo · clic su un grattatore per prenderlo in mano
        </div>
      </div>
    </div>
  );
}
