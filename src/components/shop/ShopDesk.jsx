import { FONT } from "../../data/theme.js";
import { fmtMoney } from "../../utils/money.js";
import { ticketArtCrop, TICKET_ART_ASPECT } from "../../data/ticketLayout.js";
import { Asset } from "../Asset.jsx";
import { Tooltip } from "../Tooltip.jsx";

// ─── IL TABACCHI DI NOTTE (desktop) ─────────────────────────────
// Unica eccezione alla regola "chiaro tranne la lotta", voluta dall'utente:
// il tabaccaio deve far venire voglia di spendere. Insegne al neon che
// sfarfallano, luci che corrono attorno alla slot,
// cartellini da volantino ("SOLO €1,80!"), il biglietto più ricco marcato
// HOT e un GRATTA che pulsa quando hai qualcosa in tasca.
// Tutto in vista senza scorrere: insegna + ticker in alto, vetrina e
// mensole a sinistra, slot / Broker / tasca a destra.
// Cataloghi, prezzi e callback arrivano da ShopView invariati.

const PINK = "#ff3fa4", CYAN = "#3ff0ff", YELLOW = "#ffe14a", GREEN = "#5dff8a", RED = "#ff4a4a", VIOLET = "#b36bff";
const TXT = "#f4eefe", DIM = "#8c7fa6", GLASS = "#0b0714";
const RARITY_COL = { comune: "#9aa6c0", media: CYAN, rara: VIOLET, leggendaria: YELLOW, rarissimo: "#ff9a3a", VIP: YELLOW };

// Tubo al neon: filo netto + alone. Il neon è l'unico posto dove l'alone è ammesso.
const tube = (c, w = 2) => `0 0 0 ${w}px ${c}, 0 0 10px ${c}aa, 0 0 22px ${c}44, inset 0 0 10px ${c}33`;
const glowText = (c) => `0 0 4px ${c}, 0 0 12px ${c}aa`;

const CSS = `
.sd-root { position: relative; }
/* le righe CRT ora stanno su tutto il gioco (index.html, body::after) */
@keyframes sdFlicker { 0%,19%,22%,62%,64%,100% { opacity: 1; } 20%,21%,63% { opacity: 0.25; } }
@keyframes sdPulse { 0%,100% { box-shadow: ${tube(YELLOW, 3)}; } 50% { box-shadow: 0 0 0 3px ${YELLOW}, 0 0 4px ${YELLOW}55; } }
@keyframes sdChase { to { background-position: 16px 0, -16px 100%, 0 -16px, 100% 16px; } }
@keyframes sdTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes sdBlink { 50% { opacity: 0.3; } }
@keyframes sdWobble { 0%,100% { transform: rotate(-8deg) scale(1); } 50% { transform: rotate(-8deg) scale(1.08); } }
.sd-flicker { animation: sdFlicker 4.2s steps(1) infinite; }
.sd-pulse { animation: sdPulse 1.1s steps(2) infinite; }
.sd-blink { animation: sdBlink 0.9s steps(1) infinite; }
.sd-sticker { animation: sdWobble 1.6s steps(3) infinite; }
.sd-chase { animation: sdChase 0.6s steps(2) infinite; }
.sd-ticker { animation: sdTicker 28s linear infinite; }
.sd-tile { transition: transform 0.08s steps(2); }
.sd-tile:not(:disabled):hover { transform: translateY(-4px); }
.sd-tile:not(:disabled):hover .sd-art { filter: brightness(1.15) saturate(1.2); }
@media (prefers-reduced-motion: reduce) {
  .sd-flicker, .sd-pulse, .sd-blink, .sd-sticker, .sd-chase, .sd-ticker { animation: none !important; }
  .sd-tile:not(:disabled):hover { transform: none; }
}`;

// Insegna a tubo: testo al neon con una lettera "malata" che sfarfalla.
function NeonWord({ text, color, size, brokenAt = -1 }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, color, textShadow: glowText(color), letterSpacing: "3px", whiteSpace: "nowrap" }}>
      {[...text].map((ch, i) => (
        <span key={i} className={i === brokenAt ? "sd-flicker" : undefined}>{ch}</span>
      ))}
    </span>
  );
}

function Case({ title, color, right, children, style }) {
  return (
    <section style={{ position: "relative", background: GLASS, boxShadow: tube(color), padding: "16px 12px 12px",
      display: "flex", flexDirection: "column", gap: "8px", minHeight: 0, ...style }}>
      {/* etichetta a tubo che "buca" il bordo in alto */}
      <span style={{ position: "absolute", top: "-9px", left: "12px", padding: "0 8px", background: GLASS, fontSize: "12px",
        letterSpacing: "3px", color, textShadow: glowText(color) }}>{title}</span>
      {right && <span style={{ position: "absolute", top: "-8px", right: "12px", padding: "0 8px", background: GLASS, fontSize: "11px", color: DIM }}>{right}</span>}
      {children}
    </section>
  );
}

// Cartellino da volantino: stella gialla storta con il prezzo.
function Sticker({ price, can }) {
  return (
    <span className={can ? "sd-sticker" : undefined} style={{
      position: "absolute", right: "-6px", bottom: "-8px", zIndex: 2, padding: "5px 7px 4px", fontSize: "13px", lineHeight: 1,
      color: can ? "#1a0a00" : TXT, background: can ? YELLOW : "#3a2a3a", transform: "rotate(-8deg)",
      boxShadow: can ? `0 0 0 2px #1a0a00, 3px 3px 0 #000` : "0 0 0 2px #000",
      clipPath: "polygon(0 12%, 12% 0, 88% 0, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0 88%)",
    }}>€{fmtMoney(price)}</span>
  );
}

function TicketTile({ card, price, rarity, can, hot, onBuy, tooltip }) {
  const crop = ticketArtCrop(card.id);
  const col = RARITY_COL[rarity] || RARITY_COL.comune;
  return (
    <Tooltip text={tooltip}>
      <button type="button" className="sd-tile" onClick={can ? onBuy : undefined} disabled={!can}
        aria-label={`${card.name}, €${fmtMoney(price)}, vinci fino a €${card.maxPrize}`} style={{
          position: "relative", width: "100%", padding: "4px", border: "none", fontFamily: FONT, textAlign: "left",
          background: "#140c22", cursor: can ? "pointer" : "not-allowed", opacity: can ? 1 : 0.4,
          boxShadow: can ? `0 0 0 2px ${col}, 0 0 12px ${col}66` : "0 0 0 1px #3a2f4a",
          display: "flex", flexDirection: "column", gap: "4px",
        }}>
        <span style={{ position: "relative", display: "block", aspectRatio: String(TICKET_ART_ASPECT), overflow: "hidden", background: "#000" }}>
          <Asset id={`ticket-${card.id}-v3`} emoji={card.emoji || "🎫"} size="100%" className="sd-art" style={{
            position: "absolute", maxWidth: "none",
            width: `${10000 / crop.width}%`, height: `${10000 / crop.height}%`,
            left: `${-crop.left * 100 / crop.width}%`, top: `${-crop.top * 100 / crop.height}%`,
          }} />
          {hot && (
            <span className="sd-blink" style={{ position: "absolute", left: 0, top: 0, fontSize: "10px", letterSpacing: "1px", padding: "2px 6px",
              color: "#1a0a00", background: RED, boxShadow: `0 0 8px ${RED}` }}>HOT</span>
          )}
          {!hot && rarity !== "comune" && (
            <span style={{ position: "absolute", left: 0, top: 0, fontSize: "9px", letterSpacing: "1px", padding: "1px 5px", color: "#0b0714", background: col }}>
              {rarity === "VIP" ? "VIP" : rarity.toUpperCase()}
            </span>
          )}
        </span>
        <span style={{ fontSize: "12px", color: TXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "40px" }}>{card.name}</span>
        <span style={{ fontSize: "11px", color: GREEN, textShadow: can ? glowText(GREEN) : "none", paddingRight: "40px" }}>fino a €{card.maxPrize}</span>
        <Sticker price={price} can={can} />
      </button>
    </Tooltip>
  );
}

function ShelfItem({ id, def, price, can, onBuy, note, rarity }) {
  const col = RARITY_COL[rarity] || RARITY_COL.comune;
  return (
    <Tooltip text={`${def.name}\n${def.desc || ""}`}>
      <button type="button" className="sd-tile" onClick={can ? onBuy : undefined} disabled={!can} aria-label={`${def.name}, €${fmtMoney(price)}`} style={{
        width: "100%", height: "100%", padding: "6px 4px", border: "none", fontFamily: FONT,
        background: "#140c22", cursor: can ? "pointer" : "not-allowed", opacity: can ? 1 : 0.4,
        boxShadow: can ? `0 0 0 1px ${col}, 0 0 8px ${col}44` : "0 0 0 1px #3a2f4a",
        display: "grid", gridTemplateRows: "1fr auto auto", justifyItems: "center", alignItems: "center", gap: "3px",
      }}>
        <Asset id={`item-${id}`} emoji={def.emoji} size={30} />
        <span style={{ fontSize: "10px", color: TXT, width: "100%", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{def.name}</span>
        <span style={{ display: "flex", gap: "5px", alignItems: "center", fontSize: "11px" }}>
          <span style={{ color: can ? YELLOW : DIM, textShadow: can ? glowText(YELLOW) : "none" }}>€{fmtMoney(price)}</span>
          {note && <span style={{ fontSize: "10px", color: DIM }}>{note}</span>}
        </span>
      </button>
    </Tooltip>
  );
}

// ── Slot: cabinet con lampadine che corrono tutt'intorno, cimasa JACKPOT
// che lampeggia, rulli dietro vetro, leva gialla che pulsa. ──
const BULBS = `radial-gradient(circle, ${YELLOW} 0 2px, transparent 3px)`;
function SlotMachine({ reels, spinning, result, cost, prizes, canPay, onSpin }) {
  const win = !spinning && result && result.type !== "lose";
  const big = win && result.type !== "small";
  const resCol = !result ? DIM : result.type === "lose" ? DIM : result.type === "small" ? GREEN : YELLOW;
  return (
    <section aria-label="Slot machine" style={{ position: "relative", padding: "8px", background: "#2a0a1e", boxShadow: tube(PINK, 3), flexShrink: 0 }}>
      {/* lampadine: quattro file di pallini che scorrono */}
      <span aria-hidden className="sd-chase" style={{ position: "absolute", inset: "2px", pointerEvents: "none",
        background: `${BULBS} 0 0 / 16px 8px repeat-x, ${BULBS} 0 100% / 16px 8px repeat-x, ${BULBS} 0 0 / 8px 16px repeat-y, ${BULBS} 100% 0 / 8px 16px repeat-y` }} />
      <div style={{ position: "relative", background: "#12061a", padding: "10px 12px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <span className={big ? "sd-blink" : "sd-flicker"} style={{ fontSize: "20px", letterSpacing: "4px", color: YELLOW, textShadow: glowText(YELLOW) }}>
          JACKPOT €{prizes.superjackpot}
        </span>
        <div style={{ display: "flex", gap: "6px", padding: "6px", background: "#000", boxShadow: `inset 0 0 0 2px ${PINK}88` }}>
          {reels.map((sym, i) => (
            <div key={i} style={{
              width: 62, height: 74, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "34px",
              background: "repeating-linear-gradient(0deg, #f4eefe 0 3px, #e6dcf6 3px 4px)",
              boxShadow: win ? `0 0 0 3px ${YELLOW}, 0 0 14px ${YELLOW}` : "inset 0 8px 0 #b8a8d055, inset 0 -8px 0 #b8a8d055",
              filter: spinning ? "blur(0.6px)" : "none",
            }}>{sym}</div>
          ))}
        </div>
        <div aria-live="polite" className={big ? "sd-blink" : undefined} style={{ minHeight: "30px", fontSize: win ? "13px" : "12px", lineHeight: 1.3,
          textAlign: "center", color: resCol, textShadow: win ? glowText(resCol) : "none" }}>
          {spinning ? "gira… gira… gira…" : result ? result.text : "Due uguali pagano. Tre sette ti cambiano la vita."}
        </div>
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr auto", rowGap: "2px", fontSize: "12px", color: TXT }}>
          <span>7️⃣7️⃣7️⃣</span><span style={{ color: YELLOW }}>€{prizes.superjackpot}</span>
          <span>tre uguali</span><span style={{ color: YELLOW }}>€{prizes.jackpot}</span>
          <span>due uguali</span><span style={{ color: YELLOW }}>€{prizes.small}</span>
        </div>
        <button type="button" onClick={onSpin} disabled={spinning || !canPay} className={canPay && !spinning ? "sd-pulse" : undefined} style={{
          width: "100%", height: "44px", border: "none", fontFamily: FONT, fontSize: "16px", letterSpacing: "2px",
          cursor: spinning || !canPay ? "not-allowed" : "pointer",
          color: canPay && !spinning ? "#1a0a00" : DIM, background: canPay && !spinning ? YELLOW : "#241a2e",
          boxShadow: canPay && !spinning ? tube(YELLOW, 3) : "0 0 0 1px #3a2f4a",
        }}>{spinning ? "…" : canPay ? `TIRA LA LEVA · €${cost}` : "SEI IN BOLLETTA"}</button>
      </div>
    </section>
  );
}

export function ShopDesk({
  player, punchline, cards, vipCards, grattatori, consumabili, vipItems,
  slot, broker, onBuyCard, onBuyItem, onBuyGrattatore, onScratch, onLeave,
}) {
  const inPocket = player.scratchCards.length;
  const allCards = [...cards, ...vipCards];
  // HOT: il biglietto che puoi permetterti con il premio massimo più alto.
  const hotId = allCards.filter(c => player.money >= c.price).sort((a, b) => b.card.maxPrize - a.card.maxPrize)[0]?.card.id;
  const topPrize = Math.max(0, ...allCards.map(c => c.card.maxPrize));
  const tickerText = `★ OGGI IN PALIO FINO A €${topPrize} ★ ${punchline} ★ ${allCards.length} GRATTA E VINCI IN VETRINA ★ LA FORTUNA AIUTA GLI AUDACI ★ `;

  return (
    <div className="sd-root" style={{
      width: "100%", height: "100%", boxSizing: "border-box", padding: "16px 18px 14px", overflowY: "auto", minHeight: 0,
      display: "flex", flexDirection: "column", gap: "16px", fontFamily: FONT, color: TXT,
      background: "linear-gradient(#0b0714e6, #0b0714f2)",
    }}>
      <style>{CSS}</style>

      {/* ══ Insegna: ritratto in un monitor CRT, neon, ticker LED, GRATTA/ESCI ══ */}
      <header style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto", gap: "18px", alignItems: "center", flexShrink: 0 }}>
        {/* Primo piano: lo sprite (64×96) ingrandito sul viso, centrato nel monitor */}
        <div style={{ width: 88, height: 88, padding: "4px", boxSizing: "border-box", background: "#000", boxShadow: tube(CYAN) }}>
          <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#1a1030" }}>
            <Asset id="spr-tabaccaio-v3" emoji="🏪" size={171} style={{ position: "absolute", maxWidth: "none", width: 171, height: 256, left: -45, top: -8 }} />
          </div>
        </div>
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "18px", flexWrap: "wrap" }}>
            <NeonWord text="TABACCHI" color={PINK} size="34px" brokenAt={5} />
            <NeonWord text="GRATTA & VINCI" color={CYAN} size="16px" brokenAt={9} />
            <span className="sd-blink" style={{ fontSize: "11px", letterSpacing: "2px", color: GREEN, textShadow: glowText(GREEN) }}>● APERTO</span>
          </div>
          {/* ticker a matrice di punti */}
          <div style={{ overflow: "hidden", background: "#000", boxShadow: `inset 0 0 0 1px ${YELLOW}55`, padding: "4px 0", whiteSpace: "nowrap" }}>
            <span className="sd-ticker" style={{ display: "inline-block", fontSize: "13px", color: YELLOW, textShadow: glowText(YELLOW) }}>
              {tickerText}{tickerText}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "stretch" }}>
          <div style={{ fontSize: "11px", letterSpacing: "2px", color: DIM, textAlign: "right" }}>
            IN TASCA HAI <span style={{ fontSize: "16px", color: GREEN, textShadow: glowText(GREEN) }}>€{fmtMoney(player.money)}</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={inPocket ? onScratch : undefined} disabled={!inPocket} className={inPocket ? "sd-pulse" : undefined} style={{
              height: "46px", padding: "0 18px", border: "none", fontFamily: FONT, fontSize: "16px", letterSpacing: "2px",
              cursor: inPocket ? "pointer" : "default", color: inPocket ? "#1a0a00" : DIM, background: inPocket ? YELLOW : "#1a1224",
              boxShadow: inPocket ? tube(YELLOW, 3) : "0 0 0 1px #3a2f4a",
            }}>{inPocket ? `GRATTA ORA (${inPocket})` : "TASCHE VUOTE"}</button>
            <button type="button" onClick={onLeave} style={{
              height: "46px", padding: "0 16px", border: "none", fontFamily: FONT, fontSize: "14px", letterSpacing: "2px", cursor: "pointer",
              color: DIM, background: "transparent", boxShadow: "0 0 0 1px #4a3f5a",
            }}>ESCI →</button>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: "18px" }}>
        {/* ══ Sinistra: vetrina + mensole ══ */}
        <div style={{ minHeight: 0, display: "flex", flexDirection: "column", gap: "18px" }}>
          <Case title="VETRINA" color={PINK} right={`${allCards.length} biglietti`} style={{ flex: 1 }}>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(136px, 1fr))", gap: "14px 12px", alignContent: "start", padding: "6px 8px 10px 4px" }}>
              {allCards.map(({ card, price, rarity, tooltip }) => (
                <TicketTile key={card.id} card={card} price={price} rarity={rarity} tooltip={tooltip} hot={card.id === hotId}
                  can={player.money >= price} onBuy={() => onBuyCard(card.id)} />
              ))}
            </div>
          </Case>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "18px", flexShrink: 0 }}>
            <Case title="GRATTATORI" color={CYAN} right="salvano le unghie">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gridAutoRows: "84px", gap: "8px" }}>
                {grattatori.map(({ id, def, price, rarity }) => (
                  <ShelfItem key={id} id={id} def={def} price={price} rarity={rarity} can={player.money >= price}
                    note={`${def.maxUses === 99 ? "∞" : def.maxUses} usi`} onBuy={() => onBuyGrattatore(id)} />
                ))}
              </div>
            </Case>
            <Case title="SOTTOBANCO" color={GREEN} right="cura · bluff · vizi">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gridAutoRows: "84px", gap: "8px" }}>
                {[...consumabili, ...vipItems].map(({ id, def, price, rarity, isGrattatore }) => (
                  <ShelfItem key={id} id={id} def={def} price={price} rarity={rarity} can={player.money >= price}
                    onBuy={() => (isGrattatore ? onBuyGrattatore(id) : onBuyItem(id))} />
                ))}
              </div>
            </Case>
          </div>
        </div>

        {/* ══ Destra: slot, Broker, tasca ══ */}
        <div style={{ minHeight: 0, display: "flex", flexDirection: "column", gap: "18px" }}>
          <SlotMachine {...slot} />
          {broker.offer && (
            <Case title="IL BROKER" color={RED}>
              <span style={{ fontSize: "12px", lineHeight: 1.45, color: TXT }}>
                «Sei al verde, amico. Ti presto <b style={{ color: GREEN }}>€50</b> ora… al boss mi ridai <b style={{ color: RED }}>€80</b>.»
              </span>
              <button type="button" onClick={broker.onAccept} style={{
                height: "34px", border: "none", fontFamily: FONT, fontSize: "13px", letterSpacing: "1px", cursor: "pointer",
                color: RED, background: "transparent", boxShadow: tube(RED),
              }}>ACCETTA · €50 → €80</button>
            </Case>
          )}
          {broker.debt > 0 && (
            <div style={{ fontSize: "12px", lineHeight: 1.45, color: RED, textShadow: glowText(RED), padding: "4px 2px" }}>
              ⚠ Debito col Broker: €{broker.debt}, da ridare al prossimo boss.
            </div>
          )}
          <Case title="IN TASCA" color={YELLOW} right={inPocket ? `${inPocket} da grattare` : null} style={{ flex: 1 }}>
            {inPocket === 0 ? (
              <span style={{ fontSize: "12px", color: DIM, lineHeight: 1.5 }}>Vuota. La vetrina ti sta guardando.</span>
            ) : (
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "6px", alignContent: "start" }}>
                {player.scratchCards.map((c, i) => {
                  const crop = ticketArtCrop(c.id);
                  return (
                    <Tooltip key={i} text={c.name}>
                      <span style={{ position: "relative", display: "block", aspectRatio: String(TICKET_ART_ASPECT), overflow: "hidden", boxShadow: `0 0 0 1px ${YELLOW}` }}>
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
          </Case>
        </div>
      </div>
    </div>
  );
}
