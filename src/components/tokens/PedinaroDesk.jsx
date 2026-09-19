import { useEffect, useState } from "react";
import { C, FONT } from "../../data/theme.js";
import { TOKENS, TOKEN_RARITY, TOKEN_RARITY_COLOR, POUCH_SIZE, PEDINARO } from "../../data/tokens.js";
import { canBarterWith, barterNeed, barterValue } from "../../utils/tokens.js";
import { AudioEngine } from "../../audio.js";
import { Asset } from "../Asset.jsx";
import { Pedina } from "../map/Pedina.jsx";
import { SH } from "../shell/shellTokens.js";
import { BIOME_THEME, GOLD, dither } from "../map/mapTheme.js";
import { TokenCard } from "./TokenCard.jsx";

// ─── IL PEDINARO — la bottega dei gettoni (G-01, fase 4) ─────────
// Stesso sistema della scena di Nonno Carmelo: il personaggio in alto con la
// sua battuta (scritta a macchina), sotto i due gettoni del giorno. Il primo
// è IN VENDITA, il secondo IN BARATTO (con un tuo gettone che valga almeno il
// 60%, oppure 2 biglietti dalla tasca). Alla prima visita, se hai solo
// l'Ottone, uno dei due è in regalo. Tutte le regole stanno in utils/tokens.js.

const T = BIOME_THEME[0];
const BG = dither(T.board, T.board2);
const PANEL = T.marquee, LINE = SH.line, LINE_HI = SH.lineHi;
const TXT = C.text, INK = T.ink, ACCENT = T.accent;
const panel = { background: PANEL, boxShadow: `inset 0 0 0 2px ${LINE}, ${SH.shadow}` };

const btn = (kind = "primary", enabled = true) => ({
  height: 38, padding: "0 12px", border: "none", fontFamily: FONT, fontSize: 12, letterSpacing: 1,
  cursor: enabled ? "pointer" : "default", opacity: enabled ? 1 : 0.45, whiteSpace: "nowrap",
  color: kind === "primary" ? GOLD.dark : INK, background: kind === "primary" ? GOLD.mid : "transparent",
  boxShadow: kind === "primary" ? `inset 0 0 0 2px ${GOLD.dark}, inset 2px 2px 0 2px ${GOLD.hi}, ${SH.shadow}` : `inset 0 0 0 2px ${LINE}`,
});

function useTyped(text) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let i = 0;
    const iv = setInterval(() => {
      i += 2; setN(i);
      if (i % 6 === 0 && text[i] && text[i] !== " ") AudioEngine.dialogueTick?.();
      if (i >= text.length) clearInterval(iv);
    }, 24);
    return () => clearInterval(iv);
  }, [text]);
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) };
}

function Offer({ id, mode, visit, tokens, money, tickets, onBuy, onBarterToken, onBarterTickets, onGift }) {
  const t = TOKENS[id];
  const price = TOKEN_RARITY[t.rarity].price;
  const taken = !!visit.done[id];
  const owned = tokens.pouch.includes(id);
  const givers = tokens.pouch.filter(g => g !== tokens.equipped && canBarterWith(g, id));
  const tag = taken || owned ? "PRESO" : visit.gift ? "IN REGALO" : mode === "sale" ? `IN VENDITA · €${price}` : "IN BARATTO";

  return (
    <article style={{ ...panel, padding: 14, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, letterSpacing: 2, color: visit.gift ? C.green : mode === "sale" ? GOLD.mid : C.cyan }}>{tag}</span>
        <span style={{ fontSize: 10, color: TOKEN_RARITY_COLOR[t.rarity] }}>{TOKEN_RARITY[t.rarity].label.toUpperCase()}</span>
      </div>
      <TokenCard id={id} />

      {taken || owned ? (
        <div style={{ textAlign: "center", fontSize: 12, color: owned ? C.green : C.dim, padding: 8 }}>
          {owned ? "✓ È NELLA TUA CUSTODIA" : "GIÀ PRESO IN QUESTA VISITA"}
        </div>
      ) : visit.gift ? (
        <button type="button" style={btn("primary")} onClick={() => onGift(id)}>PRENDILO IN REGALO</button>
      ) : mode === "sale" ? (
        <button type="button" disabled={money < price} style={btn("primary", money >= price)} onClick={() => onBuy(id)}>
          {money >= price ? `COMPRA · €${price}` : `TI MANCANO €${Math.ceil(price - money)}`}
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, color: INK, lineHeight: 1.45 }}>
            Dai un tuo gettone che valga almeno <b style={{ color: C.bright, fontWeight: "normal" }}>€{barterNeed(id)}</b>
            {" "}(non la pedina che hai addosso), oppure {PEDINARO.barterTickets} biglietti dalla tasca.
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {givers.map(g => (
              <button key={g} type="button" style={{ ...btn("secondary"), display: "flex", alignItems: "center", gap: 6 }} onClick={() => onBarterToken(g, id)}>
                <Pedina id={g} size={18} /> DAI {TOKENS[g].name.toUpperCase()} <span style={{ color: C.dim }}>(€{barterValue(g)})</span>
              </button>
            ))}
            <button type="button" disabled={tickets < PEDINARO.barterTickets} style={btn("secondary", tickets >= PEDINARO.barterTickets)}
              onClick={() => onBarterTickets(id)}>
              DAI {PEDINARO.barterTickets} BIGLIETTI {tickets < PEDINARO.barterTickets ? `(ne hai ${tickets})` : ""}
            </button>
          </div>
          {!givers.length && <span style={{ fontSize: 10, color: C.dim }}>Nessun tuo gettone basta per questo scambio.</span>}
        </div>
      )}
    </article>
  );
}

export function PedinaroDesk({ visit, line, tokens, money, tickets, onBuy, onBarterToken, onBarterTickets, onGift, onLeave }) {
  const { shown, done, skip } = useTyped(line);
  const offers = [visit.sale && { id: visit.sale.id, mode: "sale" }, visit.barter && { id: visit.barter.id, mode: "barter" }].filter(Boolean);

  return (
    <div style={{
      flex: 1, minHeight: 0, width: "100%", boxSizing: "border-box", padding: 20, overflowY: "auto",
      background: BG, fontFamily: FONT, color: TXT, display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
    }}>
      {/* ══ Il Pedinaro ══ */}
      <section onClick={skip} aria-label="Il Pedinaro" style={{
        width: "min(100%, 1000px)", boxSizing: "border-box", ...panel, padding: "16px 20px",
        display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 20, alignItems: "center", cursor: done ? "default" : "pointer",
      }}>
        <div style={{ width: 132, height: 132, display: "grid", placeItems: "center", background: "#000", boxShadow: `inset 0 0 0 2px ${LINE_HI}`, position: "relative" }}>
          <Asset id="spr-pedinaro" emoji={<Pedina id="ottone" size={84} />} size={124} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, letterSpacing: 2, color: ACCENT }}>BANCO DEI GETTONI</span>
            <span style={{ fontSize: 26, lineHeight: 1, color: TXT }}>Il Pedinaro</span>
          </div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, fontStyle: "italic", color: INK, minHeight: "3.2em" }}>
            “{shown}{!done && <span style={{ color: ACCENT }}>▌</span>}{done && "”"}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: INK }}>LA TUA CUSTODIA {tokens.pouch.length}/{POUCH_SIZE}</span>
            {Array.from({ length: POUCH_SIZE }, (_, i) => tokens.pouch[i]
              ? <span key={i} title={TOKENS[tokens.pouch[i]].name} style={{ padding: 3, background: "#000", boxShadow: `inset 0 0 0 1px ${tokens.pouch[i] === tokens.equipped ? GOLD.mid : LINE_HI}` }}><Pedina id={tokens.pouch[i]} size={24} /></span>
              : <span key={i} style={{ width: 30, height: 30, outline: `2px dashed ${LINE_HI}`, outlineOffset: -4 }} />)}
            <span style={{ fontSize: 11, color: C.gold, marginLeft: "auto" }}>€{Math.floor(money)} · {tickets} biglietti</span>
          </div>
        </div>
      </section>

      {/* ══ I gettoni del giorno ══ */}
      {offers.length ? (
        <div style={{ width: "min(100%, 1000px)", display: "grid", gridTemplateColumns: `repeat(${offers.length}, minmax(0,1fr))`, gap: 14 }}>
          {offers.map(o => (
            <Offer key={o.id} {...o} visit={visit} tokens={tokens} money={money} tickets={tickets}
              onBuy={onBuy} onBarterToken={onBarterToken} onBarterTickets={onBarterTickets} onGift={onGift} />
          ))}
        </div>
      ) : (
        <div style={{ ...panel, width: "min(100%, 1000px)", padding: 20, textAlign: "center", color: INK, fontSize: 13 }}>
          La vetrina è vuota: hai già tutti i gettoni che ha.
        </div>
      )}

      <div style={{ width: "min(100%, 1000px)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 11, color: C.dim, lineHeight: 1.5 }}>
          La pedina si cambia sulla mappa: clicca la tua pedina, poi CAMBIA GETTONE.
        </span>
        <button type="button" style={btn("primary")} onClick={onLeave}>ESCI →</button>
      </div>
    </div>
  );
}
