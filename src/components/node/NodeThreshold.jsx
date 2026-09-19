import { FONT } from "../../data/theme.js";
import { NODE_ICONS, NODE_TOOLTIPS } from "../../data/map.js";
import { BOSS_SPRITE } from "../../data/biomes.js";
import { ITEM_DEFS } from "../../data/items.js";
import { ticketArtCrop, TICKET_ART_ASPECT } from "../../data/ticketLayout.js";
import { hasAsset } from "../../assets/registry.js";
import { fmtMoney } from "../../utils/money.js";
import { groupItems } from "../../utils/backpack.js";
import { Asset } from "../Asset.jsx";
import { Tooltip } from "../Tooltip.jsx";
import { ToolTray } from "../scratch/ScratchTable.jsx";
import { nodeFamily, FAMILY, GOLD, dither, bevel } from "../map/mapTheme.js";
import { MK } from "../desk/mapKit.jsx";

// ─── LA SOGLIA — sosta prima di entrare in un nodo (desktop) ─────
// Stesso sistema delle schermate di passaggio che funzionano (Nonno Carmelo,
// tutorial, Pedinaro): tavolo verde scuro a retino, pannelli neri a filo
// sottile, bottone oro. Prima era carta crema su legno, scollegata dal resto
// (proprietario, 2026-09-19). In alto il luogo — ritratto grande, famiglia
// del nodo come colore d'accento, nome, cosa ti aspetta, soglia del boss,
// ENTRA — e sotto, su tre colonne, quello che puoi fare prima: grattare i
// biglietti in tasca, prendere un grattatore, usare un consumabile.
// Stesse azioni e regole di prima; cambia solo la presentazione.

const NODE_NAMES = {
  tabaccaio: "Tabaccaio", locanda: "Locanda", spacciatore: "Spacciatore", chirurgo: "Chirurgo",
  ladro: "Ladro", mendicante: "Mendicante", zaino: "Zaino abbandonato", miniboss: "Mini boss",
  boss: "Boss", evento: "Evento", stregone: "Stregone", poliziotto: "Poliziotto", anziana: "Anziana",
  sacerdote: "Sacerdote", bambino: "Bambino", streamer: "Streamer", macellaio: "Macellaio",
  maestroTe: "Maestro del Tè", guantaio: "Guantaio", pedinaro: "Il Pedinaro", start: "Inizio",
};
// Colori di famiglia: gli stessi della legenda della mappa (FAMILY), più accesi per il testo.
const FAMILY_TAG = {
  danger: { label: "PERICOLO", col: "#e0564a" }, safe: { label: "SICURO", col: "#5fbf7e" },
  neutral: { label: "NEUTRO", col: "#9a86d8" }, event: { label: "EVENTO", col: "#d06aa8" },
  secret: { label: "SEGRETO", col: "#9aa4ae" }, boss: { label: "BOSS", col: "#e0564a" }, start: { label: "INIZIO", col: MK.ink },
};

const panel = (edge = MK.line) => ({ background: MK.panel, boxShadow: `inset 0 0 0 2px ${edge}, 5px 5px 0 #000` });

function Section({ title, right, children }) {
  return (
    <section style={{ ...panel(), padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px", minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "12px", letterSpacing: "2px", color: MK.accent }}>{title}</span>
        {right && <span style={{ fontSize: "11px", color: MK.dim }}>{right}</span>}
      </div>
      {children}
    </section>
  );
}

const Empty = ({ children }) => <span style={{ fontSize: "12px", color: MK.dim, lineHeight: 1.5 }}>{children}</span>;

export function NodeThreshold({ node, player, preScratchCount, onPreScratch, onEnter, bossGate, onEquipGrattatore, onUseItem, maxItems }) {
  const fam = nodeFamily(node);
  const tag = FAMILY_TAG[fam] || FAMILY_TAG.neutral;
  const famTile = FAMILY[fam] || FAMILY.neutral;
  const isBoss = node.type === "boss";
  const accent = isBoss || node.elite ? GOLD.mid : tag.col;
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
  const items = player.items || [];

  return (
    <div style={{
      width: "100%", height: "100%", boxSizing: "border-box", padding: "20px", background: MK.bg, overflowY: "auto",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: "18px",
      fontFamily: FONT, color: MK.txt, minHeight: 0,
    }}>
      {/* ══ Il luogo ══ */}
      <article aria-label={`Prossima tappa: ${name}`} style={{
        width: "min(100%, 1040px)", boxSizing: "border-box", ...panel(accent + "aa"),
        padding: "18px 22px", display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto", gap: "24px", alignItems: "center",
        position: "relative",
      }}>
        {/* striscia del colore di famiglia, come sulla casella della mappa */}
        <span aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: dither(famTile.tile, famTile.tile2, 2) }} />

        {/* ritratto grande, incorniciato d'oro come sulla mappa */}
        <div style={{ width: 216, height: 216, padding: 6, boxSizing: "border-box", background: dither(famTile.tile, famTile.tile2, 2),
          boxShadow: [bevel(GOLD, 2), node.elite ? `0 0 0 3px #000, 0 0 0 6px #f08a2a` : "4px 4px 0 #000"].join(", "),
          display: "grid", placeItems: "center", overflow: "hidden" }}>
          {spriteId
            ? <Asset id={spriteId} size={204} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "96px", lineHeight: 1 }}>{icon}</span>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
          <span style={{ fontSize: "11px", letterSpacing: "3px", color: MK.accent }}>PROSSIMA TAPPA</span>
          <span style={{ fontSize: "34px", lineHeight: 1, color: MK.txt }}>{name}</span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", letterSpacing: "2px", padding: "3px 8px", color: tag.col, background: "#000", boxShadow: `inset 0 0 0 1px ${tag.col}` }}>{famTile.glyph} {tag.label}</span>
            {node.elite && <span style={{ fontSize: "11px", letterSpacing: "2px", padding: "3px 8px", color: "#000", background: "#f08a2a" }}>★ ÉLITE · PREMI DOPPI</span>}
          </div>
          <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: MK.ink, maxWidth: "56ch" }}>{desc}</p>
          {bossGate && (
            <div style={{ padding: "10px 14px", background: "#000", boxShadow: `inset 0 0 0 2px ${bossGate.canEnter ? MK.green : MK.red}`, fontSize: "13px", lineHeight: 1.5, color: MK.txt }}>
              <span style={{ color: bossGate.canEnter ? MK.green : MK.red, letterSpacing: "2px" }}>{bossGate.canEnter ? "ACCESSO CONSENTITO" : "ACCESSO NEGATO"}</span>
              <br />Chiede almeno <span style={{ color: GOLD.mid }}>€{bossGate.minMoney}</span>, tu hai <span style={{ color: GOLD.mid }}>€{fmtMoney(player.money)}</span>.
              {!bossGate.canEnter && <><br /><span style={{ color: MK.red }}>Se entri ora vieni rispedito all'inizio della mappa.</span></>}
            </div>
          )}
        </div>

        <button type="button" onClick={onEnter} style={{
          alignSelf: "end", minWidth: 200, height: "56px", cursor: "pointer", fontFamily: FONT, fontSize: "20px", letterSpacing: "3px",
          border: "none", color: GOLD.dark, background: GOLD.mid,
          boxShadow: `inset 0 0 0 2px ${GOLD.dark}, inset 2px 2px 0 2px ${GOLD.hi}, 4px 4px 0 #000`,
        }}>ENTRA →</button>
      </article>

      {/* ══ Prima di entrare: tre colonne uguali ══ */}
      <div style={{ width: "min(100%, 1040px)", display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={{ fontSize: "12px", letterSpacing: "3px", color: MK.ink }}>PRIMA DI ENTRARE</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "14px", alignItems: "start" }}>
          <Section title="GRATTINI IN TASCA" right={cards.length ? `ancora ${left}/3` : null}>
            {cards.length === 0 ? (
              <Empty>Tasche vuote. I grattini si comprano al tabaccaio.</Empty>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px" }}>
                  {cards.slice(0, 6).map((c, i) => {
                    const crop = ticketArtCrop(c.id);
                    return (
                      <Tooltip key={i} text={`${c.name} — ${c.desc || ""}`}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ position: "relative", aspectRatio: String(TICKET_ART_ASPECT), overflow: "hidden", boxShadow: `inset 0 0 0 2px ${MK.lineHi}` }}>
                            <Asset id={`ticket-${c.id}-v3`} emoji={c.emoji || "🎫"} size="100%" style={{
                              position: "absolute", maxWidth: "none",
                              width: `${10000 / crop.width}%`, height: `${10000 / crop.height}%`,
                              left: `${-crop.left * 100 / crop.width}%`, top: `${-crop.top * 100 / crop.height}%`,
                            }} />
                          </div>
                          <span style={{ fontSize: "10px", color: MK.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
                {cards.length > 6 && <span style={{ fontSize: "10px", color: MK.dim }}>…e altri {cards.length - 6}</span>}
                <button type="button" onClick={canScratch ? onPreScratch : undefined} disabled={!canScratch} style={{
                  height: "40px", fontFamily: FONT, fontSize: "13px", letterSpacing: "2px", cursor: canScratch ? "pointer" : "default", border: "none",
                  color: canScratch ? GOLD.dark : MK.dim, background: canScratch ? GOLD.mid : "transparent",
                  boxShadow: canScratch ? `inset 0 0 0 2px ${GOLD.dark}, 3px 3px 0 #000` : `inset 0 0 0 2px ${MK.line}`,
                }}>{canScratch ? "GRATTANE UNO" : "GIÀ GRATTATI 3"}</button>
              </>
            )}
          </Section>

          <ToolTray player={player} onEquipGrattatore={onEquipGrattatore} tone="dark" />

          <Section title="CONSUMABILI" right={`${items.length}/${maxItems}`}>
            {items.length === 0 ? (
              <Empty>Niente da usare. Li trovi al tabaccaio e negli eventi.</Empty>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {/* oggetti uguali raggruppati "×n", come nello zaino */}
                {groupItems(items).map(({ id, count, indices }) => {
                  const it = ITEM_DEFS[id];
                  if (!it) return null;
                  return (
                    <Tooltip key={id} text={it.desc}>
                      <button type="button" onClick={() => onUseItem(indices[indices.length - 1])} style={{
                        display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px", cursor: "pointer",
                        fontFamily: FONT, fontSize: "12px", color: MK.txt, background: "#000", border: "none",
                        boxShadow: `inset 0 0 0 2px ${MK.lineHi}, 2px 2px 0 #000`,
                      }}>
                        <Asset id={`item-${id}`} emoji={it.emoji} size={18} />{it.name}
                        {count > 1 && <span style={{ color: GOLD.mid }}>×{count}</span>}
                      </button>
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
