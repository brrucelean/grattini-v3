import { FONT, FONT_TITLE } from "../../data/theme.js";
import { ITEM_DEFS, GRATTATORE_DEFS } from "../../data/items.js";
import { Asset } from "../Asset.jsx";
import { Tooltip } from "../Tooltip.jsx";
import { groupItems, groupGrattatori } from "../../utils/backpack.js";

// ─── ZAINO — si apre al centro, materico come le vecchie app iOS ──
// Tradotto in pixel art: cuoio a dithering, cuciture tratteggiate, patta con
// targhetta d'ottone e cinghia, due tasche di tela con alloggiamenti incassati
// (quelli liberi restano tratteggiati: si vede quanto spazio c'è).
// Niente sfumature: rilievi fatti con ombre dure a gradini.
// Stesse azioni di prima: clic su un consumabile = usalo, clic su un
// grattatore = prendilo in mano / posalo.
// Oggetti uguali in una casella sola con "×n" (P-04): il raggruppamento è solo
// visivo (utils/backpack.js), il clic agisce su un pezzo e il numero scala.
// La Tessera VIP spunta dal portatessera cucito sulla patta (P-05).

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

// Etichetta "×n" nell'angolo della casella: targhetta d'ottone piccola.
function CountTag({ count }) {
  if (count < 2) return null;
  return (
    <span aria-hidden style={{ position: "absolute", right: "3px", top: "3px", fontSize: "10px", lineHeight: 1,
      padding: "2px 3px", ...brassPlate, boxShadow: `inset 0 0 0 1px ${BRASS.dark}, 2px 2px 0 #0c0b08` }}>×{count}</span>
  );
}

// ─── TESSERA VIP nel portatessera della patta ──
// Non è un consumabile: con player.hasVIP (elemosina al Mendicante, o tessera
// usata) la tessera d'oro spunta da un taschino di plastica cucito sulla
// patta, e non occupa caselle. Senza tessera il taschino resta vuoto, con la
// sagoma tratteggiata: si capisce che lì va qualcosa. Solo presentazione:
// l'effetto (Zona VIP del tabaccaio) è lo stesso di prima.
// Oro a gradini (niente sfumature morbide): dithering di due ori, bevel duro,
// un riflesso che attraversa la tessera a scatti e scintille che lampeggiano.
const GOLD_DITHER = "repeating-conic-gradient(#f7d64e 0% 25%, #eec23a 0% 50%) 0 0 / 2px 2px";
const VIP_CSS = `
  @keyframes vipShine { 0%, 55% { background-position: -140px 0; } 85%, 100% { background-position: 160px 0; } }
  @keyframes vipTwinkle { 0%, 100% { opacity: 0; } 40%, 60% { opacity: 1; } }
  @keyframes vipGlow { 0%, 100% { box-shadow: 0 0 0 2px #3a2808, 0 0 0 4px #f7d64e55; } 50% { box-shadow: 0 0 0 2px #3a2808, 0 0 0 4px #fff3b0cc; } }
  @media (prefers-reduced-motion: reduce) { .vip-anim { animation: none !important; } }
`;

// Scintilla a quattro punte, fatta di "pixel".
function Sparkle({ style, delay = 0 }) {
  return (
    <span aria-hidden className="vip-anim" style={{ position: "absolute", width: 9, height: 9, pointerEvents: "none",
      animation: `vipTwinkle 1.8s steps(4) ${delay}s infinite`, opacity: 0, ...style }}>
      <span style={{ position: "absolute", left: 3, top: 0, width: 3, height: 9, background: "#fff8d0" }} />
      <span style={{ position: "absolute", left: 0, top: 3, width: 9, height: 3, background: "#fff8d0" }} />
      <span style={{ position: "absolute", left: 3, top: 3, width: 3, height: 3, background: "#ffffff" }} />
    </span>
  );
}

function VipCard() {
  return (
    <span className="vip-anim" style={{
      position: "absolute", left: 6, right: 6, top: 0, height: 74, boxSizing: "border-box", padding: "6px 8px",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      background: GOLD_DITHER, color: "#4a3008", fontFamily: FONT,
      // bevel a gradini: luce in alto a sinistra, ombra in basso a destra
      boxShadow: "inset 0 0 0 2px #3a2808, inset 3px 3px 0 1px #fff3b0, inset -3px -3px 0 1px #b88a1c",
      animation: "vipGlow 2.4s steps(6) infinite",
    }}>
      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 8, letterSpacing: 1 }}>GRATTINI CLUB</span>
        {/* chip */}
        <span aria-hidden style={{ width: 14, height: 10, background: "#c9c2a8",
          boxShadow: "inset 0 0 0 1px #4a3008, inset 0 4px 0 -3px #4a3008, inset 5px 0 0 -4px #4a3008" }} />
      </span>
      <span style={{ fontFamily: FONT_TITLE, fontSize: 24, lineHeight: 1, letterSpacing: 4, marginTop: -4,
        textShadow: "2px 2px 0 #b88a1c" }}>VIP</span>
      <span style={{ fontSize: 7, letterSpacing: 1 }}>SOCIO ORO · N° 0001 ★★★</span>
      {/* riflesso che attraversa la tessera */}
      <span aria-hidden className="vip-anim" style={{ position: "absolute", inset: 2, pointerEvents: "none", overflow: "hidden",
        background: "linear-gradient(105deg, transparent 0 42%, #ffffffcc 42% 47%, transparent 47% 52%, #ffffff77 52% 54%, transparent 54%) no-repeat",
        backgroundSize: "140px 100%", animation: "vipShine 3.2s steps(16) infinite" }} />
    </span>
  );
}

function VipHolder({ has }) {
  const tip = has
    ? "Tessera VIP\nZona VIP aperta nel tabaccaio"
    : "Portatessera vuoto\nLa Tessera VIP te la dà il Mendicante, per un'elemosina";
  return (
    <Tooltip text={tip}>
      <span role="img" aria-label={has ? "Tessera VIP: Zona VIP aperta nel tabaccaio" : "Portatessera vuoto: qui va la Tessera VIP"} style={{
        position: "relative", display: "block", width: 132, height: 96,
      }}>
        <style>{VIP_CSS}</style>
        {has ? <VipCard /> : (
          // sagoma della tessera che manca
          <span style={{ position: "absolute", left: 6, right: 6, top: 6, height: 68, boxSizing: "border-box",
            outline: "2px dashed #8a6a3a", outlineOffset: "-2px", display: "grid", placeItems: "center",
            color: "#8a6a3a", fontFamily: FONT, fontSize: 10, letterSpacing: 2 }}>TESSERA VIP</span>
        )}
        {/* taschino di plastica cucito: copre la parte bassa della tessera */}
        <span aria-hidden style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 38, boxSizing: "border-box",
          background: "rgba(214,238,244,0.16)",
          boxShadow: "inset 0 2px 0 0 #cfe6ec, inset 0 0 0 1px #9fb8bf, 3px 3px 0 #1a0c04",
          outline: `2px dashed ${STITCH}`, outlineOffset: "3px",
        }}>
          {/* riflessi netti sulla plastica */}
          <span style={{ position: "absolute", left: 16, top: 4, width: 4, height: 28, background: "rgba(255,255,255,0.3)", transform: "skewX(-20deg)" }} />
          <span style={{ position: "absolute", left: 24, top: 4, width: 2, height: 28, background: "rgba(255,255,255,0.2)", transform: "skewX(-20deg)" }} />
          {!has && <span style={{ position: "absolute", right: 6, bottom: 4, fontFamily: FONT, fontSize: 8, color: "#cfe6ec99" }}>vuoto</span>}
        </span>
        {has && <>
          <Sparkle style={{ left: -6, top: -4 }} delay={0} />
          <Sparkle style={{ right: -4, top: 10 }} delay={0.7} />
          <Sparkle style={{ right: 20, top: -8 }} delay={1.3} />
        </>}
      </span>
    </Tooltip>
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
  const itemGroups = groupItems(items);
  const equippedIdx = player.equippedGrattatore?.inventoryIdx ?? null;
  const toolGroups = groupGrattatori(tools, equippedIdx);
  // Caselle libere = pezzi che ci stanno ancora (il limite conta i pezzi).
  const freeItemSlots = Math.max(0, maxItems - items.length);
  const toolSlots = Math.max(4, Math.ceil(toolGroups.length / 4) * 4);

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
        <div style={{ position: "relative", background: LEATHER_DARK, padding: "18px 24px 22px", minHeight: "128px", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "inset 0 -4px 0 0 #2a1608", outline: `2px dashed ${STITCH}`, outlineOffset: "-10px" }}>
          <span style={{ ...brassPlate, fontSize: "20px", letterSpacing: "6px", padding: "8px 22px" }}>ZAINO</span>
          {/* portatessera cucito a sinistra della targhetta: pieno o vuoto */}
          <span style={{ position: "absolute", left: "34px", top: "50%", transform: "translateY(-50%) rotate(-3deg)", zIndex: 1 }}>
            <VipHolder has={!!player.hasVIP} />
          </span>
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
              {itemGroups.map(({ id, count, indices }) => {
                const it = ITEM_DEFS[id];
                if (!it) return null;
                // si usa l'ultimo pezzo del gruppo: gli indici degli altri non si spostano
                const idx = indices[indices.length - 1];
                return (
                  <Tooltip key={id} text={`${it.name}${count > 1 ? ` ×${count}` : ""}\n${it.desc}\nclic per ${count > 1 ? "usarne uno" : "usarlo"}`}>
                    <Slot filled label={`${it.name}${count > 1 ? `, ${count} pezzi` : ""}: usa`} onClick={() => onUseItem(idx, id)}>
                      <CountTag count={count} />
                      <Asset id={`item-${id}`} emoji={it.emoji} size={32} />
                      <span style={{ fontSize: "10px", width: "100%", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</span>
                      <span aria-label={`rarità ${it.rarity || "comune"}`} style={{ width: 8, height: 8, background: RARITY[it.rarity] || RARITY.comune, boxShadow: "0 0 0 1px #0c0b08" }} />
                    </Slot>
                  </Tooltip>
                );
              })}
              {Array.from({ length: freeItemSlots }, (_, i) => <Slot key={`libero-${i}`} filled={false} label="Alloggiamento libero" />)}
            </div>
          </Pocket>

          <Pocket title="GRATTATORI" count={`${tools.length}`}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "8px" }}>
              {Array.from({ length: toolSlots }, (_, slot) => {
                const grp = toolGroups[slot];
                if (!grp) return <Slot key={`libero-${slot}`} filled={false} label="Alloggiamento libero" />;
                const { tool: g, count, indices, inHand } = grp;
                const idx = indices[0];
                const def = GRATTATORE_DEFS[g.id];
                const uses = g.usesLeft || 0;
                return (
                  <Tooltip key={grp.key} text={`${g.name}${count > 1 ? ` ×${count}` : ""}\n${g.desc || def?.desc || ""}\n${uses} usi${count > 1 ? " ciascuno" : ""} · clic per ${inHand ? "posarlo" : count > 1 ? "prenderne uno" : "prenderlo"}`}>
                    <Slot filled active={inHand} label={`${g.name}${count > 1 ? `, ${count} pezzi` : ""}, ${uses} usi${inHand ? ", in mano" : ""}`} onClick={() => onToggleTool(idx, inHand)}>
                      <CountTag count={count} />
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
