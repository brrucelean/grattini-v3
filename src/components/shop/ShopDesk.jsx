import { FONT } from "../../data/theme.js";
import { fmtMoney } from "../../utils/money.js";
import { ticketArtCrop, TICKET_ART_ASPECT } from "../../data/ticketLayout.js";
import { Asset } from "../Asset.jsx";
import { Tooltip } from "../Tooltip.jsx";

// ─── IL BANCONE DEL TABACCAIO (desktop) ─────────────────────────
// Prima: pannello di vetro scuro con tre righe a scorrimento orizzontale, la
// slot sepolta in fondo e una fiancata ZAINO che ripeteva il bottone in alto.
// Ora è un bancone chiaro, tutto in vista senza scorrere la pagina:
//   · in alto l'insegna (tabaccaio, battuta) con GRATTA ed ESCI a portata;
//   · a sinistra la vetrina dei gratta e vinci a griglia, sotto due mensole
//     (grattatori, consumabili);
//   · a destra la slot machine vera, con il Broker sotto quando c'è.
// Carta crema, inchiostro scuro, ombre dure: scura resta solo la lotta.
// Cataloghi, prezzi e callback arrivano da ShopView invariati.

const INK = "#153f42", MUTED = "#5d6f68", CREAM = "#fff3c4", PAPER2 = "#fbeebc", EDGE = "#d9c27a";
const SHADOW = "#1a0c04", RED = "#a3161d";
const BRASS = { hi: "#f3d98a", mid: "#c9a24a", lo: "#8a6a22", dark: "#3a2808" };
const frame = (edge = INK) => `inset 0 0 0 2px ${EDGE}, inset 0 0 0 4px ${edge}, 5px 5px 0 ${SHADOW}`;
const RARITY_COL = { comune: "#6f7a84", media: "#1f7f86", rara: "#7a3aa0", leggendaria: "#b8862a", rarissimo: "#b0661a", VIP: "#b8862a" };

function Panel({ title, right, children, style }) {
  return (
    <section style={{ background: CREAM, boxShadow: frame(EDGE), padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: "8px", minHeight: 0, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "12px", letterSpacing: "2px", color: INK, fontWeight: "bold" }}>{title}</span>
        {right && <span style={{ fontSize: "11px", color: MUTED }}>{right}</span>}
      </div>
      {children}
    </section>
  );
}

function PriceTag({ price, can }) {
  return (
    <span style={{ fontSize: "12px", padding: "1px 6px", whiteSpace: "nowrap",
      color: can ? CREAM : RED, background: can ? INK : "transparent", boxShadow: can ? "none" : `inset 0 0 0 1px ${RED}` }}>
      €{fmtMoney(price)}
    </span>
  );
}

// Biglietto in vetrina: illustrazione ritagliata, nome, prezzo, premio massimo.
function TicketTile({ card, price, rarity, can, onBuy, tooltip }) {
  const crop = ticketArtCrop(card.id);
  const col = RARITY_COL[rarity] || RARITY_COL.comune;
  return (
    <Tooltip text={tooltip}>
      <button type="button" onClick={can ? onBuy : undefined} disabled={!can} aria-label={`${card.name}, €${fmtMoney(price)}`} style={{
        width: "100%", padding: "4px 4px 6px", border: "none", fontFamily: FONT, textAlign: "left",
        background: PAPER2, cursor: can ? "pointer" : "not-allowed", opacity: can ? 1 : 0.55,
        boxShadow: `inset 0 0 0 2px ${col}, 3px 3px 0 ${EDGE}`, display: "flex", flexDirection: "column", gap: "4px",
      }}>
        <span style={{ position: "relative", display: "block", aspectRatio: String(TICKET_ART_ASPECT), overflow: "hidden", background: "#1a1410" }}>
          <Asset id={`ticket-${card.id}-v3`} emoji={card.emoji || "🎫"} size="100%" style={{
            position: "absolute", maxWidth: "none",
            width: `${10000 / crop.width}%`, height: `${10000 / crop.height}%`,
            left: `${-crop.left * 100 / crop.width}%`, top: `${-crop.top * 100 / crop.height}%`,
          }} />
          <span style={{ position: "absolute", left: 0, top: 0, fontSize: "9px", letterSpacing: "1px", padding: "1px 5px", color: CREAM, background: col }}>
            {rarity === "VIP" ? "VIP" : rarity.toUpperCase()}
          </span>
        </span>
        <span style={{ fontSize: "12px", color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: "0 2px" }}>{card.name}</span>
        <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 2px" }}>
          <PriceTag price={price} can={can} />
          <span style={{ fontSize: "10px", color: MUTED }}>max €{card.maxPrize}</span>
        </span>
      </button>
    </Tooltip>
  );
}

// Oggetto sulla mensola: icona, nome, prezzo (+ usi per i grattatori).
function ShelfItem({ id, def, price, can, onBuy, note, rarity }) {
  const col = RARITY_COL[rarity] || RARITY_COL.comune;
  return (
    <Tooltip text={`${def.name}\n${def.desc || ""}`}>
      <button type="button" onClick={can ? onBuy : undefined} disabled={!can} aria-label={`${def.name}, €${fmtMoney(price)}`} style={{
        width: "100%", height: "100%", padding: "6px 4px", border: "none", fontFamily: FONT,
        background: PAPER2, cursor: can ? "pointer" : "not-allowed", opacity: can ? 1 : 0.55,
        boxShadow: `inset 0 0 0 2px ${col}, 3px 3px 0 ${EDGE}`,
        display: "grid", gridTemplateRows: "1fr auto auto", justifyItems: "center", alignItems: "center", gap: "3px",
      }}>
        <Asset id={`item-${id}`} emoji={def.emoji} size={30} />
        <span style={{ fontSize: "10px", color: INK, width: "100%", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{def.name}</span>
        <span style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          <PriceTag price={price} can={can} />
          {note && <span style={{ fontSize: "10px", color: MUTED }}>{note}</span>}
        </span>
      </button>
    </Tooltip>
  );
}

// ── La slot: mobile in legno scuro con finiture d'ottone, tre rulli color
// crema, tabella premi sul frontale e la leva come bottone. ──
function SlotMachine({ reels, spinning, result, cost, prizes, canPay, onSpin }) {
  const win = !spinning && result && result.type !== "lose";
  const resCol = !result ? MUTED : result.type === "lose" ? "#c8b88a" : result.type === "small" ? "#9fe0a8" : BRASS.hi;
  return (
    <section aria-label="Slot machine" style={{
      background: "repeating-conic-gradient(#5a1a1a 0% 25%, #621d1d 0% 50%) 0 0 / 4px 4px",
      boxShadow: `inset 0 0 0 3px ${BRASS.dark}, inset 3px 3px 0 3px ${BRASS.mid}, inset -3px -3px 0 3px ${BRASS.lo}, 6px 6px 0 ${SHADOW}`,
      padding: "14px 16px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
    }}>
      {/* insegna */}
      <span style={{ fontSize: "18px", letterSpacing: "5px", padding: "4px 14px", color: BRASS.dark, background: BRASS.mid,
        boxShadow: `inset 0 0 0 2px ${BRASS.dark}, inset 2px 2px 0 2px ${BRASS.hi}, inset -2px -2px 0 2px ${BRASS.lo}` }}>SLOT</span>
      {/* finestra dei rulli */}
      <div style={{ display: "flex", gap: "6px", padding: "8px", background: "#1a0c04",
        boxShadow: `inset 0 0 0 2px ${BRASS.lo}, inset 3px 3px 0 2px #000` }}>
        {reels.map((sym, i) => (
          <div key={i} style={{
            width: 64, height: 76, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px",
            background: win ? "#fff9dc" : CREAM,
            boxShadow: win ? `inset 0 0 0 3px ${BRASS.mid}` : "inset 0 -6px 0 #e3cf8e, inset 0 6px 0 #e3cf8e",
          }}>{sym}</div>
        ))}
      </div>
      {/* esito */}
      <div aria-live="polite" className="shop-jackpot" style={{ minHeight: "32px", fontSize: result && result.type !== "lose" ? "13px" : "12px", lineHeight: 1.3,
        textAlign: "center", color: resCol, letterSpacing: "1px",
        animation: result?.type === "superjackpot" ? "shopJackpot 0.9s steps(2) infinite" : "none" }}>
        {spinning ? "I rulli girano…" : result ? result.text : `€${cost} a giro. Due uguali pagano.`}
      </div>
      {/* tabella premi */}
      <div style={{ width: "100%", background: "#1a0c04", boxShadow: `inset 0 0 0 1px ${BRASS.lo}`, padding: "6px 10px",
        display: "grid", gridTemplateColumns: "1fr auto", rowGap: "3px", fontSize: "12px", color: "#e8dcc0" }}>
        <span>7️⃣ 7️⃣ 7️⃣</span><b style={{ color: BRASS.hi, fontWeight: "normal" }}>€{prizes.superjackpot}</b>
        <span>tre uguali</span><b style={{ color: BRASS.hi, fontWeight: "normal" }}>€{prizes.jackpot}</b>
        <span>due uguali</span><b style={{ color: BRASS.hi, fontWeight: "normal" }}>€{prizes.small}</b>
      </div>
      {/* leva */}
      <button type="button" onClick={onSpin} disabled={spinning || !canPay} style={{
        width: "100%", height: "44px", border: "none", fontFamily: FONT, fontSize: "15px", letterSpacing: "2px",
        cursor: spinning || !canPay ? "not-allowed" : "pointer",
        color: canPay ? BRASS.dark : "#8a6a6a", background: canPay && !spinning ? BRASS.mid : "#3a1414",
        boxShadow: canPay && !spinning ? `inset 0 0 0 2px ${BRASS.dark}, inset 2px 2px 0 2px ${BRASS.hi}, inset -2px -2px 0 2px ${BRASS.lo}, 3px 3px 0 ${SHADOW}` : `inset 0 0 0 1px #6a2a2a`,
      }}>{spinning ? "GIRANDO…" : canPay ? `TIRA LA LEVA · €${cost}` : "SEI IN BOLLETTA"}</button>
    </section>
  );
}

export function ShopDesk({
  player, punchline, cards, vipCards, grattatori, consumabili, vipItems,
  slot, broker, onBuyCard, onBuyItem, onBuyGrattatore, onScratch, onLeave,
}) {
  const inPocket = player.scratchCards.length;
  const allCards = [...cards, ...vipCards];

  return (
    <div style={{
      width: "100%", height: "100%", boxSizing: "border-box", padding: "14px 18px", overflowY: "auto", minHeight: 0,
      display: "flex", flexDirection: "column", gap: "12px", fontFamily: FONT, color: INK,
    }}>
      <style>{`@keyframes shopJackpot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        @media (prefers-reduced-motion: reduce) { .shop-jackpot { animation: none !important; } }`}</style>
      {/* ══ Insegna ══ */}
      <header style={{ background: CREAM, boxShadow: frame(BRASS.lo), padding: "10px 14px", flexShrink: 0,
        display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto", gap: "16px", alignItems: "center" }}>
        <div style={{ width: 84, height: 84, padding: "3px", boxSizing: "border-box", background: "#1a1410",
          boxShadow: `inset 0 0 0 2px ${INK}, 3px 3px 0 ${SHADOW}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Asset id="spr-tabaccaio-v3" emoji="🏪" size={78} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontSize: "26px", lineHeight: 1 }}>Tabaccheria</span>
            <span style={{ fontSize: "11px", letterSpacing: "2px", color: MUTED }}>GRATTA E VINCI · SIGARETTE · LOTTO</span>
          </div>
          <span style={{ fontSize: "13px", fontStyle: "italic", lineHeight: 1.45 }}>«{punchline}»</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button type="button" onClick={inPocket ? onScratch : undefined} disabled={!inPocket} style={{
            height: "44px", padding: "0 18px", border: "none", fontFamily: FONT, fontSize: "15px", letterSpacing: "2px",
            cursor: inPocket ? "pointer" : "default", color: inPocket ? CREAM : MUTED, background: inPocket ? INK : PAPER2,
            boxShadow: inPocket ? `3px 3px 0 ${SHADOW}` : `inset 0 0 0 1px ${EDGE}`,
          }}>{inPocket ? `GRATTA (${inPocket})` : "TASCHE VUOTE"}</button>
          <button type="button" onClick={onLeave} style={{
            height: "44px", padding: "0 18px", border: "none", fontFamily: FONT, fontSize: "15px", letterSpacing: "2px", cursor: "pointer",
            color: INK, background: CREAM, boxShadow: `inset 0 0 0 2px ${INK}, 3px 3px 0 ${SHADOW}`,
          }}>ESCI →</button>
        </div>
      </header>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: "14px" }}>
        {/* ══ Sinistra: vetrina + mensole ══ */}
        <div style={{ minHeight: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
          <Panel title="GRATTA E VINCI" right={`${allCards.length} in vetrina · hai €${fmtMoney(player.money)}`} style={{ flex: 1 }}>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))", gap: "10px", alignContent: "start", padding: "2px 4px 4px 2px" }}>
              {allCards.map(({ card, price, rarity, tooltip }) => (
                <TicketTile key={card.id} card={card} price={price} rarity={rarity} tooltip={tooltip}
                  can={player.money >= price} onBuy={() => onBuyCard(card.id)} />
              ))}
            </div>
          </Panel>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "12px", flexShrink: 0 }}>
            <Panel title="GRATTATORI" right="proteggono le unghie">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(86px, 1fr))", gridAutoRows: "88px", gap: "8px" }}>
                {grattatori.map(({ id, def, price, rarity }) => (
                  <ShelfItem key={id} id={id} def={def} price={price} rarity={rarity} can={player.money >= price}
                    note={`${def.maxUses === 99 ? "∞" : def.maxUses} usi`} onBuy={() => onBuyGrattatore(id)} />
                ))}
              </div>
            </Panel>
            <Panel title="CONSUMABILI" right="cura · bluff · sottobanco">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(86px, 1fr))", gridAutoRows: "88px", gap: "8px" }}>
                {[...consumabili, ...vipItems].map(({ id, def, price, rarity, isGrattatore }) => (
                  <ShelfItem key={id} id={id} def={def} price={price} rarity={rarity} can={player.money >= price}
                    onBuy={() => (isGrattatore ? onBuyGrattatore(id) : onBuyItem(id))} />
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {/* ══ Destra: slot + Broker ══ */}
        <div style={{ minHeight: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
          <SlotMachine {...slot} />
          {broker.offer && (
            <section style={{ background: CREAM, boxShadow: frame(RED), padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "11px", letterSpacing: "2px", color: CREAM, background: RED, padding: "2px 8px", alignSelf: "flex-start" }}>IL BROKER SUSSURRA</span>
              <span style={{ fontSize: "12px", lineHeight: 1.45, fontStyle: "italic" }}>
                «Sei al verde, amico. Ti presto <b>€50</b> ora… ma al boss mi ridai <b style={{ color: RED }}>€80</b>. Affare?»
              </span>
              <button type="button" onClick={broker.onAccept} style={{
                height: "36px", border: "none", fontFamily: FONT, fontSize: "13px", letterSpacing: "1px", cursor: "pointer",
                color: CREAM, background: RED, boxShadow: `3px 3px 0 ${SHADOW}`,
              }}>ACCETTA · €50 → €80</button>
            </section>
          )}
          {broker.debt > 0 && (
            <div style={{ background: CREAM, boxShadow: frame(RED), padding: "10px 12px", fontSize: "12px", lineHeight: 1.45, color: RED }}>
              Debito col Broker: <b>€{broker.debt}</b>, da restituire al prossimo boss.
            </div>
          )}
          {/* In tasca: quello che hai appena comprato, pronto da grattare */}
          <Panel title="IN TASCA" right={inPocket ? `${inPocket} da grattare` : null} style={{ flex: 1 }}>
            {inPocket === 0 ? (
              <span style={{ fontSize: "12px", color: MUTED, lineHeight: 1.5 }}>Niente. Scegli un biglietto dalla vetrina.</span>
            ) : (
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "6px", alignContent: "start" }}>
                {player.scratchCards.map((c, i) => {
                  const crop = ticketArtCrop(c.id);
                  return (
                    <Tooltip key={i} text={c.name}>
                      <span style={{ position: "relative", display: "block", aspectRatio: String(TICKET_ART_ASPECT), overflow: "hidden", boxShadow: `inset 0 0 0 2px ${INK}` }}>
                        <Asset id={`ticket-${c.id}-v3`} emoji={c.emoji || "🎫"} size="100%" style={{
                          position: "absolute", maxWidth: "none",
                          width: `${10000 / crop.width}%`, height: `${10000 / crop.height}%`,
                          left: `${-crop.left * 100 / crop.width}%`, top: `${-crop.top * 100 / crop.height}%`,
                        }} />
                      </span>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
