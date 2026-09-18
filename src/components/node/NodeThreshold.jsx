import { FONT } from "../../data/theme.js";
import { NODE_ICONS, NODE_TOOLTIPS } from "../../data/map.js";
import { BOSS_SPRITE } from "../../data/biomes.js";
import { ITEM_DEFS } from "../../data/items.js";
import { ticketArtCrop, TICKET_ART_ASPECT } from "../../data/ticketLayout.js";
import { hasAsset } from "../../assets/registry.js";
import { fmtMoney } from "../../utils/money.js";
import { Asset } from "../Asset.jsx";
import { Tooltip } from "../Tooltip.jsx";
import { ToolTray } from "../scratch/ScratchTable.jsx";
import { nodeFamily } from "../map/mapTheme.js";

// ─── LA SOGLIA — sosta prima di entrare in un nodo (desktop) ─────
// Prima era un riquadro quasi vuoto con "NESSUN GRATTINO". Ora è una colonna
// centrata: il luogo (ritratto medio, tipo, nome, cosa ti aspetta, soglia del
// boss, ENTRA) e sotto, su tre colonne, quello che puoi fare prima: grattare i
// biglietti in tasca, prendere un grattatore, usare un consumabile.
// Stesse azioni e regole di prima; cambia solo la presentazione.

const GOLD = "#c9a24a", INK = "#e8dcc0", MUTED = "#8a7a5a";
const BLACK = "repeating-conic-gradient(#121014 0% 25%, #17141a 0% 50%) 0 0 / 4px 4px";
const TABLE = "repeating-conic-gradient(#1a0f09 0% 25%, #1e120a 0% 50%) 0 0 / 4px 4px";
const frame = (edge = GOLD) => `inset 0 0 0 2px #050304, inset 0 0 0 3px ${edge}, inset 0 0 0 5px #050304, 5px 5px 0 #050304`;

const NODE_NAMES = {
  tabaccaio: "Tabaccaio", locanda: "Locanda", spacciatore: "Spacciatore", chirurgo: "Chirurgo",
  ladro: "Ladro", mendicante: "Mendicante", zaino: "Zaino abbandonato", miniboss: "Mini boss",
  boss: "Boss", evento: "Evento", stregone: "Stregone", poliziotto: "Poliziotto", anziana: "Anziana",
  sacerdote: "Sacerdote", bambino: "Bambino", streamer: "Streamer", macellaio: "Macellaio",
  maestroTe: "Maestro del Tè", guantaio: "Guantaio", start: "Inizio",
};
const FAMILY_TAG = {
  danger: { label: "PERICOLO", col: "#c0433a" }, safe: { label: "SICURO", col: "#4f9a6a" },
  neutral: { label: "NEUTRO", col: "#8a78c0" }, event: { label: "EVENTO", col: "#b0508a" },
  secret: { label: "SEGRETO", col: "#9aa6b0" }, boss: { label: "BOSS", col: "#c0433a" }, start: { label: "INIZIO", col: MUTED },
};

function Section({ title, right, children }) {
  return (
    <section style={{ background: BLACK, boxShadow: frame("#3a3026"), padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px", minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "12px", letterSpacing: "2px", color: GOLD }}>{title}</span>
        {right && <span style={{ fontSize: "11px", color: MUTED }}>{right}</span>}
      </div>
      {children}
    </section>
  );
}

export function NodeThreshold({ node, player, preScratchCount, onPreScratch, onEnter, bossGate, onEquipGrattatore, onUseItem, maxItems }) {
  const fam = nodeFamily(node);
  const tag = FAMILY_TAG[fam] || FAMILY_TAG.neutral;
  const isBoss = node.type === "boss";
  const name = node.secret ? "Nodo segreto" : isBoss ? (node.bossName || "Boss") : (NODE_NAMES[node.type] || node.type);
  const desc = (node.secret ? "Qualcosa di raro ti aspetta dietro questa porta." : (NODE_TOOLTIPS[node.type] || ""))
    .replace(/^\p{Extended_Pictographic}️?\s*/u, "");
  const bossKey = isBoss ? BOSS_SPRITE[node.bossName] : null;
  const spriteKey = bossKey && hasAsset(`spr-${bossKey}`) ? bossKey : node.type;
  const spriteId = !node.secret && hasAsset(`spr-${spriteKey}`) ? `spr-${spriteKey}` : null;
  const icon = node.secret ? "🔮" : NODE_ICONS[node.type] || "?";
  const left = Math.max(0, 3 - preScratchCount);
  const cards = player.scratchCards || [];
  const canScratch = cards.length > 0 && left > 0;

  return (
    <div style={{
      width: "100%", height: "100%", boxSizing: "border-box", padding: "20px", background: TABLE, overflowY: "auto",
      display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", fontFamily: FONT, color: INK, minHeight: 0,
    }}>
      {/* ══ Il luogo: ritratto medio, poi tutto centrato ══ */}
      <article aria-label={`Prossima tappa: ${name}`} style={{
        width: "min(100%, 640px)", boxSizing: "border-box", background: BLACK,
        boxShadow: frame(isBoss || node.elite ? GOLD : tag.col), padding: "20px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center",
      }}>
        <span style={{ fontSize: "11px", letterSpacing: "3px", color: MUTED }}>PROSSIMA TAPPA</span>
        {/* padding: l'immagine resta dentro il filo oro, che così si vede su tutti i lati */}
        <div style={{ width: 188, height: 188, padding: "4px", boxSizing: "border-box", background: "#0a0806",
          boxShadow: `inset 0 0 0 2px ${GOLD}, 4px 4px 0 #050304`,
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {spriteId
            ? <Asset id={spriteId} size={180} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "80px", lineHeight: 1 }}>{icon}</span>}
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <span style={{ fontSize: "11px", letterSpacing: "2px", padding: "2px 8px", color: "#0b090b", background: tag.col }}>{tag.label}</span>
          {node.elite && <span style={{ fontSize: "11px", letterSpacing: "2px", padding: "2px 8px", color: "#0b090b", background: GOLD }}>★ ÉLITE</span>}
        </div>
        <span style={{ fontSize: "30px", color: GOLD, letterSpacing: "1px", lineHeight: 1 }}>{name}</span>
        <span style={{ fontSize: "14px", lineHeight: 1.5, color: INK, maxWidth: "48ch" }}>{desc}</span>
        {bossGate && (
          <div style={{ padding: "10px 14px", background: "#0b090b", boxShadow: `inset 0 0 0 2px ${bossGate.canEnter ? "#4f9a6a" : "#c0433a"}`, fontSize: "13px", lineHeight: 1.5 }}>
            <span style={{ color: bossGate.canEnter ? "#7fcf98" : "#e07a6a", letterSpacing: "2px" }}>{bossGate.canEnter ? "ACCESSO CONSENTITO" : "ACCESSO NEGATO"}</span>
            <br />Chiede almeno <b style={{ color: GOLD }}>€{bossGate.minMoney}</b>, tu hai <b style={{ color: GOLD }}>€{fmtMoney(player.money)}</b>.
            {!bossGate.canEnter && <><br /><span style={{ color: "#e0a060" }}>Se entri ora vieni rispedito all'inizio della mappa.</span></>}
          </div>
        )}
        <button type="button" onClick={onEnter} style={{
          width: "min(100%, 320px)", height: "52px", marginTop: "4px", cursor: "pointer", fontFamily: FONT, fontSize: "20px", letterSpacing: "3px",
          background: "#1d1810", color: GOLD, border: "none", boxShadow: `inset 0 0 0 2px ${GOLD}, 4px 4px 0 #050304`,
        }}>ENTRA →</button>
      </article>

      {/* ══ Prima di entrare: tre colonne uguali ══ */}
      <div style={{ width: "min(100%, 1040px)", display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={{ fontSize: "12px", letterSpacing: "3px", color: MUTED, textAlign: "center" }}>PRIMA DI ENTRARE</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "12px", alignItems: "start" }}>
        <Section title="GRATTINI IN TASCA" right={cards.length ? `ancora ${left}/3` : null}>
          {cards.length === 0 ? (
            <span style={{ fontSize: "12px", color: MUTED, lineHeight: 1.5 }}>Tasche vuote. I grattini si comprano al tabaccaio.</span>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px" }}>
                {cards.slice(0, 6).map((c, i) => {
                  const crop = ticketArtCrop(c.id);
                  return (
                    <Tooltip key={i} text={`${c.name} — ${c.desc || ""}`}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ position: "relative", aspectRatio: String(TICKET_ART_ASPECT), overflow: "hidden", boxShadow: `inset 0 0 0 1px ${GOLD}` }}>
                          <Asset id={`ticket-${c.id}-v3`} emoji={c.emoji || "🎫"} size="100%" style={{
                            position: "absolute", maxWidth: "none",
                            width: `${10000 / crop.width}%`, height: `${10000 / crop.height}%`,
                            left: `${-crop.left * 100 / crop.width}%`, top: `${-crop.top * 100 / crop.height}%`,
                          }} />
                        </div>
                        <span style={{ fontSize: "10px", color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
              <button type="button" onClick={canScratch ? onPreScratch : undefined} disabled={!canScratch} style={{
                height: "38px", fontFamily: FONT, fontSize: "13px", letterSpacing: "2px", cursor: canScratch ? "pointer" : "default",
                background: canScratch ? GOLD : "#1a1614", color: canScratch ? "#0b090b" : MUTED, border: "none",
                boxShadow: "3px 3px 0 #050304",
              }}>{canScratch ? `GRATTANE UNO` : "GIÀ GRATTATI 3"}</button>
            </>
          )}
        </Section>

        <ToolTray player={player} onEquipGrattatore={onEquipGrattatore} />

        <Section title="CONSUMABILI" right={`${player.items.length}/${maxItems}`}>
          {player.items.length === 0 ? (
            <span style={{ fontSize: "12px", color: MUTED, lineHeight: 1.5 }}>Niente da usare. Li trovi al tabaccaio e negli eventi.</span>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {player.items.map((id, idx) => {
                const it = ITEM_DEFS[id];
                if (!it) return null;
                return (
                  <Tooltip key={idx} text={it.desc}>
                    <button type="button" onClick={() => onUseItem(idx)} style={{
                      display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px", cursor: "pointer",
                      fontFamily: FONT, fontSize: "12px", color: INK, background: "#0b090b", border: "none", boxShadow: `inset 0 0 0 1px ${GOLD}`,
                    }}><Asset id={`item-${id}`} emoji={it.emoji} size={18} />{it.name}</button>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </Section>
        </div>
      </div>
    </div>
  );
}
