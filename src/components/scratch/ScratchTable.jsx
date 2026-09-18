import { memo, useEffect, useRef } from "react";
import { C, FONT } from "../../data/theme.js";
import { GRATTATORE_DEFS } from "../../data/items.js";
import { fmtMoney } from "../../utils/money.js";
import { Asset } from "../Asset.jsx";
import { Tooltip } from "../Tooltip.jsx";

// ─── TAVOLO DA GRATTATA — ambientazione della schermata di grattata ──
// Desktop (shell ≥1024px). Il biglietto sta su un tappetino in mezzo al
// bancone; a sinistra il dossier della run come foglio appoggiato, a destra
// il vassoio dei grattatori (si prendono e si posano) e lo scontrino dei colpi.
// Pixel art: legno e panno a dithering netto, ombre dure, niente sfumature.
// Nessuno stato nuovo: player, gameStats e log arrivano da scratchlite.

const PAPER = { bg: "#fff3c4", ink: "#153f42", dim: "#5d6f68", edge: "#d9c27a", red: "#a3161d" };
const RAIL_W = 248;

// Bancone: listelli di legno a due toni + giunture scure ogni 48px.
export const TABLE_BG = [
  // pozza di luce della lampada: anelli a gradini netti, niente sfumatura
  "radial-gradient(ellipse 62% 70% at 50% 42%, #ffd79a1f 0 55%, #ffd79a14 55% 72%, #ffd79a0a 72% 88%, transparent 88%)",
  // giunture fra i listelli
  "repeating-linear-gradient(90deg, #00000000 0 62px, #3a1f0f 62px 64px)",
  // venatura: due toni caldi a dithering
  "repeating-conic-gradient(#7a4a26 0% 25%, #83522b 0% 50%) 0 0 / 4px 4px",
].join(", ");

// Tappetino sotto il biglietto: panno verde a dithering con bordo cucito.
export const MAT_STYLE = {
  background: "repeating-conic-gradient(#1f6a43 0% 25%, #257a4d 0% 50%) 0 0 / 4px 4px",
  boxShadow: "inset 0 0 0 3px #134a2d, inset 0 0 0 5px #e9c46a, inset 0 0 0 7px #134a2d, 6px 6px 0 #3a1f0f",
};

const paperBox = {
  background: PAPER.bg, color: PAPER.ink, fontFamily: FONT,
  boxShadow: `inset 0 0 0 2px ${PAPER.edge}, 5px 5px 0 #3a1f0f`,
};

function Label({ children, color = PAPER.ink, bg = "transparent" }) {
  return (
    <div style={{ fontSize: "11px", letterSpacing: "2px", fontWeight: "bold", color, background: bg,
      padding: bg === "transparent" ? 0 : "3px 6px", display: "inline-block" }}>{children}</div>
  );
}

// ── SINISTRA: dossier della run ──
function DossierImpl({ biome, player, gameStats }) {
  const rows = [
    ["Portafoglio", `€${fmtMoney(player.money)}`, PAPER.ink],
    ["Grattate", gameStats.cardsScratched || 0, PAPER.ink],
    ["Vinte", gameStats.scratchWins || 0, "#1c7a3a"],
    ["Perse", gameStats.scratchLosses || 0, PAPER.red],
    ["Miglior premio", `€${gameStats.bestPrize || 0}`, PAPER.ink],
    ["Nodi", gameStats.nodesVisited || 0, PAPER.ink],
  ];
  return (
    <aside aria-label="Dossier della run" style={{ ...paperBox, width: RAIL_W, flexShrink: 0, alignSelf: "flex-start",
      display: "flex", flexDirection: "column", maxHeight: "100%", overflow: "hidden", marginTop: "8px" }}>
      <div style={{ padding: "10px 12px 8px", borderBottom: `2px dashed ${PAPER.edge}` }}>
        <Label bg={PAPER.ink} color={PAPER.bg}>DOSSIER DELLA RUN</Label>
      </div>
      <div style={{ padding: "10px 12px", borderBottom: `2px dashed ${PAPER.edge}` }}>
        <div style={{ fontSize: "10px", letterSpacing: "2px", color: PAPER.dim }}>ZONA</div>
        <div style={{ fontSize: "14px", fontWeight: "bold", margin: "2px 0 4px" }}>{biome?.name || "—"}</div>
        <div style={{ fontSize: "11px", lineHeight: 1.45, color: PAPER.dim, fontStyle: "italic" }}>{biome?.desc || ""}</div>
      </div>
      <div style={{ padding: "8px 12px 12px", overflowY: "auto", minHeight: 0 }}>
        {rows.map(([k, v, col]) => (
          <div key={k} style={{ display: "flex", alignItems: "baseline", gap: "6px", padding: "4px 0", fontSize: "12px" }}>
            <span style={{ color: PAPER.dim, whiteSpace: "nowrap" }}>{k}</span>
            <span aria-hidden style={{ flex: 1, borderBottom: `2px dotted ${PAPER.edge}`, transform: "translateY(-3px)" }} />
            <span style={{ fontWeight: "bold", color: col, fontVariantNumeric: "tabular-nums" }}>{v}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
export const Dossier = memo(DossierImpl);

// ── DESTRA (sopra): vassoio dei grattatori ──
function ToolTrayImpl({ player, onEquipGrattatore }) {
  const tools = player.grattatori || [];
  return (
    <section aria-label="Vassoio dei grattatori" style={{
      background: "repeating-conic-gradient(#39424a 0% 25%, #3f4952 0% 50%) 0 0 / 4px 4px",
      boxShadow: "inset 0 0 0 2px #1b2126, inset 2px 2px 0 3px #6b7883, inset -2px -2px 0 3px #262d33, 5px 5px 0 #3a1f0f",
      padding: "10px", display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0,
      fontFamily: FONT,
    }}>
      <Label color="#e8eef2">GRATTATORI</Label>
      {tools.length === 0 ? (
        <div style={{ fontSize: "11px", lineHeight: 1.5, color: "#c8d2d9" }}>
          Vassoio vuoto: gratti a unghia nuda. I grattatori si comprano al tabaccaio.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {tools.map((g, idx) => {
            const def = GRATTATORE_DEFS[g.id];
            const inHand = player.equippedGrattatore?.inventoryIdx === idx;
            const uses = g.usesLeft || 0;
            return (
              <Tooltip key={idx} text={`${g.name}\n${g.desc || def?.desc || ""}\n${uses} usi rimasti · clic per ${inHand ? "posarlo" : "prenderlo"}`} color={C.cyan}>
                <button type="button" onClick={() => onEquipGrattatore?.(idx)}
                  aria-pressed={inHand} aria-label={`${g.name}, ${uses} usi, ${inHand ? "in mano" : "sul vassoio"}`}
                  style={{
                    position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                    padding: "8px 4px 6px", cursor: "pointer", fontFamily: FONT,
                    background: inHand ? "#153f42" : "#20272d",
                    border: `2px solid ${inHand ? C.cyan : "#12171b"}`,
                    boxShadow: inHand ? "none" : "2px 2px 0 #0c0f12",
                    transform: inHand ? "translate(2px,2px)" : "none",
                    color: inHand ? C.cyan : "#dfe7ec",
                  }}>
                  <Asset id={`item-${g.id}`} emoji={g.emoji} size={32} />
                  <span style={{ fontSize: "10px", lineHeight: 1.2, textAlign: "center", width: "100%",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</span>
                  <span aria-hidden style={{ display: "flex", gap: "2px", flexWrap: "wrap", justifyContent: "center" }}>
                    {Array(Math.min(uses, 8)).fill(0).map((_, i) => (
                      <span key={i} style={{ width: 6, height: 6, background: inHand ? C.cyan : "#9fb0bb" }} />
                    ))}
                    {uses > 8 && <span style={{ fontSize: "9px" }}>+{uses - 8}</span>}
                  </span>
                  {inHand && (
                    <span style={{ position: "absolute", top: -8, right: -4, fontSize: "9px", letterSpacing: "1px",
                      background: C.cyan, color: "#000", padding: "1px 4px" }}>IN MANO</span>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>
      )}
    </section>
  );
}
export const ToolTray = memo(ToolTrayImpl);

// ── DESTRA (sotto): scontrino dei colpi ──
function ReceiptImpl({ log }) {
  const ref = useRef(null);
  const lastId = log.length ? log[log.length - 1].id : 0;
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lastId]);
  return (
    <section aria-label="Scontrino dei colpi" style={{ ...paperBox, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "8px 12px", borderBottom: `2px dashed ${PAPER.edge}`, display: "flex", justifyContent: "space-between" }}>
        <Label>SCONTRINO</Label>
        <span style={{ fontSize: "11px", color: PAPER.dim }}>{log.length ? `#${lastId}` : ""}</span>
      </div>
      <ol ref={ref} aria-live="polite" style={{ listStyle: "none", margin: 0, padding: "8px 12px", overflowY: "auto", flex: 1, minHeight: 0,
        display: "flex", flexDirection: "column", gap: "6px" }}>
        {log.length === 0 && <li style={{ fontSize: "11px", color: PAPER.dim }}>Ancora niente. Gratta.</li>}
        {log.map((e, i) => (
          <li key={e.id} style={{ fontSize: "11px", lineHeight: 1.45, color: PAPER.ink,
            opacity: i === log.length - 1 ? 1 : 0.72, borderLeft: `3px solid ${i === log.length - 1 ? PAPER.ink : PAPER.edge}`, paddingLeft: "6px" }}>
            {e.text}
          </li>
        ))}
      </ol>
    </section>
  );
}
export const Receipt = memo(ReceiptImpl);

// setGameHost: ScratchCardView disegna qui (portal) i pannelli della
// meccanica — Banco, punteggio, contatori, avvisi — così non stanno sotto il
// biglietto e il biglietto non cambia mai misura.
export function RightRail({ player, onEquipGrattatore, log, setGameHost }) {
  return (
    <div style={{ width: RAIL_W, flexShrink: 0, display: "flex", flexDirection: "column", gap: "12px", minHeight: 0, padding: "8px 0" }}>
      <ToolTray player={player} onEquipGrattatore={onEquipGrattatore} />
      {/* Riquadro "in questo biglietto": appare solo se la meccanica ha
          qualcosa da mostrare (Banco, punteggio, jolly, trappole, contatori). */}
      <style>{`.table-game:has(.table-game-body:empty) { display: none; }
        .table-game-body > * { margin: 0 !important; font-size: 12px !important; line-height: 1.45; }`}</style>
      <section className="table-game" aria-label="In questo biglietto" style={{
        flexShrink: 0, maxHeight: "50%", display: "flex", flexDirection: "column", minHeight: 0,
        background: "#1b100a", boxShadow: "inset 0 0 0 2px #e9c46a, inset 0 0 0 4px #1b100a, inset 0 0 0 5px #7a5a1c, 5px 5px 0 #3a1f0f",
        padding: "10px", gap: "8px", fontFamily: FONT,
      }}>
        <Label color="#e9c46a">IN QUESTO BIGLIETTO</Label>
        <div ref={setGameHost} className="table-game-body" style={{ display: "flex", flexDirection: "column", gap: "8px",
          overflowY: "auto", minHeight: 0, fontSize: "12px", lineHeight: 1.45 }} />
      </section>
      <Receipt log={log} />
    </div>
  );
}
