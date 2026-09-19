import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { C, FONT, FONT_TITLE } from "../../data/theme.js";
import { NODE_ICONS, NODE_TOOLTIPS } from "../../data/map.js";
import { BIOMES, BIOME_MODIFIERS, BOSS_SPRITE } from "../../data/biomes.js";
import { hasAsset } from "../../assets/registry.js";
import { AudioEngine } from "../../audio.js";
import { useReducedMotion } from "../../hooks/useReducedMotion.js";
import { Asset } from "../Asset.jsx";
import { Tooltip } from "../Tooltip.jsx";
import { Pedina } from "./Pedina.jsx";
import { TokenPanel } from "../tokens/TokenPanel.jsx";
import { TOKENS } from "../../data/tokens.js";
import { isSecretOpen, secretThreshold as tokenSecretThreshold } from "../../utils/tokens.js";
import { GOLD, SILVER, bevel, dither, BIOME_THEME, FAMILY, nodeFamily } from "./mapTheme.js";

// ─── MAP BOARD — la mappa come schermo di una slot da tabacchi ───
// Desktop (shell ≥1024px). Il percorso corre da sinistra (ingresso) a destra
// (jackpot = boss): ogni riga del grafo è una colonna numerata come una
// payline, così l'atto intero entra nel riquadro senza scorrere.
// Stessa logica di MapView: stessi nodi, connessioni, raggiungibilità,
// segreti, élite, tooltip e onSelectNode. Cambia solo la presentazione.

const HEAD_H = 64;
const PAYLINE_H = 24;
const LEGEND_H = 28;
const PAD_X = 16;
const LABEL_H = 14;

function useSize(ref) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export function MapBoard({ map, currentRow, visitedNodes, onSelectNode, reachableNodes, currentBiome = 0, playerFortuna = 0, tokens = null, onEquipToken, onDiscardToken, mirror = false, tokenPowers = null }) {
  // Dado Scheggiato: modalità "scegli il nuovo percorso"
  const [dadoPicking, setDadoPicking] = useState(false);
  const pedinaId = tokens?.equipped || "ottone";
  const [panelOpen, setPanelOpen] = useState(false);
  const [tokenDropActive, setTokenDropActive] = useState(false);
  const theme = BIOME_THEME[currentBiome] || BIOME_THEME[0];
  const boardRef = useRef(null);
  const { w: bw, h: bh } = useSize(boardRef);
  const reducedMotion = useReducedMotion();

  const cols = map.rows.length || 1;
  const maxPerCol = map.rows.reduce((a, r) => Math.max(a, r.length), 1);
  // Colonna d'ingresso a sinistra per la pedina prima del primo passo.
  const colW = bw > 0 ? (bw - PAD_X * 2) / (cols + 0.6) : 0;
  const originX = PAD_X + colW * 0.6;
  const usableH = Math.max(0, bh - PAYLINE_H - 16);
  // Casella: la più grande che entra in colonna e in altezza, in passi da 8 px.
  const tileRaw = Math.min(colW - 16, (usableH / maxPerCol) - LABEL_H - 12, 80);
  const T = Math.max(32, Math.floor(tileRaw / 8) * 8);
  const bossT = Math.min(Math.floor((colW - 8) / 8) * 8, T + 16);

  // Specchietto del Barbiere (G-01): la mappa corre da destra a sinistra.
  // Si specchiano solo le posizioni, così le scritte restano leggibili.
  const mx = (x) => (mirror ? bw - x : x);

  const pos = useMemo(() => {
    const out = {};
    const verticalCoords = map.rows.flat().map(n => n.x ?? 0.5);
    const minCoord = Math.min(...verticalCoords);
    const maxCoord = Math.max(...verticalCoords);
    const coordSpan = Math.max(0.001, maxCoord - minCoord);
    // Distribuzione centrata: stesso respiro sopra la prima fila e sotto
    // l'ultima, mantenendo i nodi vicini alla numerazione e senza scalarli.
    const edgeGap = 18;
    const topCenter = PAYLINE_H + 8 + T / 2 + edgeGap;
    const bottomCenter = PAYLINE_H + 8 + usableH - T / 2 - LABEL_H - edgeGap;
    map.rows.forEach((row, rIdx) => {
      row.forEach(node => {
        const x = mx(originX + colW * rIdx + colW / 2);
        // node.x ∈ [0,1] era l'ascissa della mappa verticale: qui diventa l'ordinata.
        const normalizedY = ((node.x ?? 0.5) - minCoord) / coordSpan;
        const y = topCenter + normalizedY * Math.max(0, bottomCenter - topCenter);
        out[node.id] = { x: Math.round(x), y: Math.round(y) };
      });
    });
    return out;
  }, [map, originX, colW, usableH, T, mirror, bw]); // eslint-disable-line react-hooks/exhaustive-deps

  const flat = useMemo(() => map.rows.flat(), [map]);
  const rowOf = useMemo(() => {
    const o = {};
    map.rows.forEach((row, r) => row.forEach(n => { o[n.id] = r; }));
    return o;
  }, [map]);
  const edges = useMemo(() => {
    const list = [];
    Object.entries(map.connections).forEach(([fromId, toIds]) => {
      toIds.forEach(toId => {
        const a = flat.find(n => n.id === fromId), b = flat.find(n => n.id === toId);
        list.push({ fromId, toId, shortcut: b && a ? b.row - a.row > 1 : false });
      });
    });
    return list;
  }, [map, flat]);

  // Scelta in corso: la pedina salta sul nodo, poi si entra (il salto si vede
  // prima che la mappa lasci il posto al nodo). Blocca i doppi clic.
  const [moving, setMoving] = useState(null);
  const choose = (node) => {
    if (moving) return;
    setPanelOpen(false);
    if (reducedMotion) { onSelectNode(node, rowOf[node.id]); return; }
    setMoving(node);
    setTimeout(() => onSelectNode(node, rowOf[node.id]), 420);
  };
  useEffect(() => { setMoving(null); }, [currentRow]);

  // Dove sta la pedina: l'ultimo nodo visitato nella colonna precedente.
  const pedinaNode = moving || (currentRow > 0 ? map.rows[currentRow - 1]?.find(n => visitedNodes.includes(n.id)) : null);
  const startNode = map.rows[0]?.find(n => n.type === "start") || map.rows[0]?.[0];
  const startPos = startNode && pos[startNode.id];
  const pedinaAt = pedinaNode && pos[pedinaNode.id]
    ? pos[pedinaNode.id]
    : { x: Math.round(mx(PAD_X + colW * 0.3)), y: startPos?.y ?? Math.round(PAYLINE_H + 8 + usableH / 2) };

  // Scatti sonori quando la pedina avanza (stessa voce della mappa legacy).
  const lastPedina = useRef(null);
  useEffect(() => {
    const key = pedinaNode?.id || "start";
    if (lastPedina.current && lastPedina.current !== key) {
      for (let i = 0; i < 3; i++) setTimeout(() => AudioEngine.mapTick(), i * 90);
    }
    lastPedina.current = key;
  }, [pedinaNode?.id]);

  const biome = BIOMES[currentBiome] || BIOMES[0];
  const mod = BIOME_MODIFIERS[currentBiome];
  // Soglia dei segreti: bioma, poi gettone (Fiche Truccata −1). Il Telefono
  // può aver aperto un segreto a prescindere dalla Fortuna.
  const baseSecret = mod?.secretFortuneThreshold ?? 2;
  const secretThreshold = tokens ? tokenSecretThreshold(tokens, baseSecret) : baseSecret;

  return (
    <div style={{
      flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column",
      background: theme.marquee, fontFamily: FONT, position: "relative",
      boxShadow: bevel(GOLD, 2), padding: "6px",
    }}>
      <style>{`
        @keyframes mbHop { 0% { transform:translate(-50%,-100%) } 40% { transform:translate(-50%,calc(-100% - 10px)) } 100% { transform:translate(-50%,-100%) } }
        @keyframes mbShine { 0% { transform:translateX(-120%) } 60%,100% { transform:translateX(220%) } }
        .mb-tile:focus-visible { outline:3px solid ${C.cyan}; outline-offset:3px; }
        .mb-tile.is-active:hover { transform:translate(-2px,-2px); }
        .mb-tile.is-active:hover .mb-face { box-shadow: 4px 4px 0 #000; }
        @media (prefers-reduced-motion: reduce) { .mb-anim { animation:none !important; } }
      `}</style>

      {/* ══ TESTATA — insegna del "gioco" del bioma ══════════════════ */}
      <div style={{
        height: HEAD_H, flexShrink: 0, display: "grid",
        gridTemplateColumns: "auto minmax(0,1fr) auto", alignItems: "center", gap: "16px",
        padding: "0 16px", background: theme.marquee, position: "relative",
        borderBottom: `2px solid ${GOLD.dark}`,
      }}>
        <div style={{display:"flex", flexDirection:"column", gap:"4px"}}>
          <span style={{fontSize:"11px", letterSpacing:"2px", color: theme.ink}}>
            BIOMA {currentBiome + 1}/{BIOMES.length} · COLONNA {Math.min(currentRow + 1, cols)}/{cols}
          </span>
          <span style={{fontFamily: FONT_TITLE, fontSize:"26px", lineHeight:1, color: GOLD.mid,
            textShadow:`2px 2px 0 ${GOLD.dark}, 4px 4px 0 #000`, letterSpacing:"2px", whiteSpace:"nowrap"}}>
            {theme.game}
          </span>
        </div>
        <div style={{minWidth:0, display:"flex", flexDirection:"column", gap:"4px"}}>
          <span style={{fontSize:"13px", color:"#fff", letterSpacing:"1px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
            {biome.name.toUpperCase()}
          </span>
          {mod && (
            <span style={{fontSize:"11px", color: theme.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
              <span style={{color: theme.accent}}>{mod.emoji} {mod.label}</span> — {mod.desc}
            </span>
          )}
        </div>
        <div style={{display:"flex", alignItems:"center", gap:"8px", padding:"6px 10px",
          background:"#000", boxShadow: bevel(GOLD, 1)}}>
          <span style={{fontSize:"11px", letterSpacing:"2px", color: GOLD.mid}}>JACKPOT</span>
          <span style={{fontSize:"13px", color:"#ff6a6a", letterSpacing:"1px", whiteSpace:"nowrap"}}>{biome.boss.toUpperCase()}</span>
        </div>
      </div>

      {/* ══ SCHERMO — percorso orizzontale ═══════════════════════════ */}
      <div ref={boardRef} style={{
        flex: 1, minHeight: 0, position: "relative", overflow: "hidden",
        background: dither(theme.board, theme.board2, 2),
        outline: tokenDropActive ? `4px solid ${GOLD.hi}` : "none", outlineOffset: "-6px",
      }}
        onDragEnter={e => { if (tokens && Array.from(e.dataTransfer.types).includes("text/token")) setTokenDropActive(true); }}
        onDragOver={e => {
          if (!tokens || !Array.from(e.dataTransfer.types).includes("text/token")) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setTokenDropActive(true);
        }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setTokenDropActive(false); }}
        onDrop={e => {
          e.preventDefault();
          setTokenDropActive(false);
          const id = e.dataTransfer.getData("text/token");
          if (id && id !== pedinaId) onEquipToken?.(id);
        }}>
        {tokenDropActive && (
          <div aria-hidden style={{ position:"absolute", inset:10, zIndex:20, pointerEvents:"none", display:"grid", placeItems:"center",
            border:`3px dashed ${GOLD.hi}`, background:"#120e05aa", color:GOLD.hi, fontFamily:FONT, fontSize:15,
            letterSpacing:3, textShadow:"2px 2px 0 #000" }}>
            RILASCIA QUI LA PEDINA
          </div>
        )}
        {bw > 0 && <>
          {/* Numeri di payline e colonna corrente */}
          {map.rows.map((_, c) => {
            const x = mirror ? bw - (originX + colW * c) - colW : originX + colW * c;
            const here = c === currentRow;
            const past = c < currentRow;
            return (
              <div key={`pl-${c}`} aria-hidden style={{
                position:"absolute", left: x, top: 0, width: colW, height: "100%",
                background: here ? "#ffffff0d" : "transparent",
                borderLeft: here ? `2px dashed ${GOLD.lo}` : "none",
                borderRight: here ? `2px dashed ${GOLD.lo}` : "none",
                boxSizing: "border-box",
              }}>
                <span style={{
                  position:"absolute", left:"50%", top: 4, transform:"translateX(-50%)",
                  minWidth: 20, height: 16, padding: "0 4px", boxSizing:"border-box",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"11px", fontVariantNumeric:"tabular-nums",
                  background: here ? GOLD.mid : past ? "#00000066" : "#000000aa",
                  color: here ? "#000" : past ? theme.ink + "88" : theme.ink,
                  boxShadow: here ? `0 0 0 2px ${GOLD.dark}` : "none",
                }}>{c + 1}</span>
              </div>
            );
          })}

          {/* Percorsi: tratteggio stampato, percorso fatto ripassato in oro */}
          <svg aria-hidden width={bw} height={bh} style={{position:"absolute", inset:0, pointerEvents:"none"}} shapeRendering="crispEdges">
            {edges.map(({ fromId, toId, shortcut }) => {
              const a = pos[fromId], b = pos[toId];
              if (!a || !b) return null;
              const fromVisited = visitedNodes.includes(fromId);
              const past = fromVisited && visitedNodes.includes(toId);
              const active = fromVisited && reachableNodes.includes(toId);
              const stroke = past ? GOLD.mid : active ? "#ffffff" : theme.ink + "66";
              const dash = past ? undefined : active ? "6 4" : "4 6";
              const w = past ? 4 : active ? 3 : 2;
              if (shortcut) {
                const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 40;
                return <path key={`${fromId}-${toId}`} d={`M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`}
                  stroke={past ? GOLD.mid : C.magenta} strokeWidth={w} strokeDasharray={dash} fill="none" />;
              }
              return <line key={`${fromId}-${toId}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={stroke} strokeWidth={w} strokeDasharray={dash} />;
            })}
          </svg>

          {/* Nodi */}
          {flat.map(node => {
            const p = pos[node.id];
            if (!p) return null;
            const visited = visitedNodes.includes(node.id);
            const reachable = reachableNodes.includes(node.id);
            const isActive = reachable && !visited;
            const isBoss = node.type === "boss";
            const isSecret = !!node.secret;
            const secretUnlocked = isSecret && (tokens ? isSecretOpen(tokens, node, playerFortuna, baseSecret) : playerFortuna >= secretThreshold);
            const dadoTarget = dadoPicking && tokenPowers?.dado?.targets.includes(node.id);
            const hidden = isSecret && !secretUnlocked && !visited;
            const isElite = !!node.elite && !visited;
            const fam = FAMILY[nodeFamily(node)];
            const size = isBoss ? bossT : T;
            const clickable = (isActive && !hidden) || dadoTarget;
            const icon = hidden ? "🔒" : isSecret ? "🔮" : NODE_ICONS[node.type] || "?";
            const bossKey = isBoss ? BOSS_SPRITE[node.bossName] : null;
            const spriteKey = bossKey && hasAsset(`spr-${bossKey}`) ? bossKey : node.type;
            const spriteId = !hidden && !isSecret && hasAsset(`spr-${spriteKey}`) ? `spr-${spriteKey}` : null;
            const label = isBoss ? (node.bossName || "BOSS") : hidden ? "???" : isSecret ? "SEGRETO" : node.type;
            const tooltip = hidden
              ? `🔒 Nodo Segreto — richiede Fortuna ≥ ${secretThreshold}`
              : isSecret ? "🔮 Nodo Segreto — evento raro con ricompense uniche!"
              : (isElite ? "★ ELITE — rischio e premi raddoppiati! " : "") + (NODE_TOOLTIPS[node.type] || node.type);
            const locked = !visited && !isActive;
            const frame = hidden ? SILVER : GOLD;

            return (
              <Tooltip key={node.id} text={tooltip}>
                <button type="button"
                  className={`mb-tile${clickable ? " is-active" : ""}`}
                  disabled={!clickable}
                  onClick={dadoTarget ? () => { tokenPowers.dado.onPick(node.id); setDadoPicking(false); } : clickable ? () => choose(node) : undefined}
                  aria-label={`${label}${isElite ? ", élite" : ""}${visited ? ", già visitato" : clickable ? ", raggiungibile" : hidden ? ", segreto bloccato" : ", non ancora raggiungibile"}`}
                  style={{
                    position:"absolute", left: p.x - size / 2, top: p.y - size / 2,
                    width: size, height: size + LABEL_H + 2, padding: 0, border: "none", background: "none",
                    cursor: clickable ? "pointer" : "default", zIndex: isActive ? 3 : 2,
                    fontFamily: FONT,
                  }}>
                  <span className="mb-face" style={{
                    position:"relative", display:"flex", alignItems:"center", justifyContent:"center",
                    width: size, height: size, overflow:"hidden",
                    background: hidden ? dither(SILVER.mid, SILVER.lo, 2) : visited ? "#2a2724" : dither(fam.tile, fam.tile2, 2),
                    boxShadow: [
                      visited ? `inset 0 0 0 2px #0c0b0a, inset 0 0 0 4px #57504a` : bevel(frame, isBoss ? 3 : 2),
                      isElite ? `0 0 0 2px #000, 0 0 0 4px ${C.orange}` : null,
                      clickable ? "2px 2px 0 #000" : null,
                      dadoTarget ? `0 0 0 3px #000, 0 0 0 6px ${C.magenta}` : null,
                    ].filter(Boolean).join(", "),
                    opacity: locked && !isBoss ? 0.55 : 1,
                    filter: visited ? "grayscale(1)" : "none",
                  }}>
                    {spriteId
                      ? <Asset id={spriteId} emoji={icon} size={size - (isBoss ? 18 : 14)} />
                      : <span style={{fontSize: Math.round(size * 0.46), lineHeight: 1}}>{icon}</span>}
                    {/* glifo di famiglia: leggibile senza colore */}
                    {!visited && (
                      <span aria-hidden style={{position:"absolute", left: 5, top: 4, fontSize:"10px", lineHeight:1,
                        color: "#fff", textShadow:"1px 1px 0 #000"}}>{fam.glyph}</span>
                    )}
                    {isElite && (
                      <span aria-hidden style={{position:"absolute", right: 4, top: 3, fontSize:"11px", color: C.orange, textShadow:"1px 1px 0 #000"}}>★</span>
                    )}
                    {/* riflesso a scatti quando il nodo è giocabile */}
                    {clickable && !reducedMotion && (
                      <span aria-hidden className="mb-anim" style={{position:"absolute", top:0, bottom:0, left:0, width:"30%",
                        background:"#ffffff30", transform:"translateX(-120%) skewX(-20deg)",
                        animation:"mbShine 2.4s steps(6) infinite"}} />
                    )}
                    {visited && (
                      <span aria-hidden style={{position:"absolute", inset:"auto 2px", top:"50%", transform:"translateY(-50%) rotate(-14deg)",
                        border:"2px solid #d23c3c", color:"#e04848", fontSize:"10px", letterSpacing:"1px",
                        textAlign:"center", background:"#0008", padding:"1px 0"}}>PAGATO</span>
                    )}
                  </span>
                  <span style={{
                    position:"absolute", left:"50%", top: size + 2, transform:"translateX(-50%)",
                    height: LABEL_H, padding:"0 4px", boxSizing:"border-box",
                    display:"flex", alignItems:"center", whiteSpace:"nowrap",
                    background:"#000", color: isBoss ? "#ff6a6a" : clickable ? GOLD.mid : visited ? "#6d6660" : theme.ink,
                    fontSize:"10px", letterSpacing:"0.5px", textTransform:"uppercase",
                    maxWidth: Math.max(size, colW - 4), overflow:"hidden", textOverflow:"ellipsis",
                  }}>{label}</span>
                </button>
              </Tooltip>
            );
          })}

          {/* Pedina: avanza a scatti fino al nodo appena scelto. Cliccandola si
              apre la scheda del gettone con CAMBIA GETTONE (G-01). */}
          <div style={{
            position:"absolute", left: pedinaAt.x, top: pedinaAt.y - (pedinaNode ? T / 2 - 4 : 0),
            transform:"translate(-50%,-100%)", zIndex: 5, pointerEvents: tokens && !moving ? "auto" : "none",
            transition: reducedMotion ? "none" : "left 0.36s steps(4), top 0.36s steps(4)",
          }}>
            <div key={pedinaNode?.id || "start"} className="mb-anim" style={{
              animation: reducedMotion ? "none" : "mbHop 0.36s steps(3) 1",
              filter:"drop-shadow(2px 2px 0 #000)",
            }}>
              {tokens ? (
                <Tooltip text={`${TOKENS[pedinaId]?.name || "Pedina"}\nclic per la scheda e per cambiare gettone`}>
                  <button type="button" className="mb-tile is-active" onClick={() => setPanelOpen(o => !o)}
                    aria-label={`Pedina: ${TOKENS[pedinaId]?.name}. Apri la scheda`} aria-expanded={panelOpen}
                    style={{ padding: 0, border: "none", background: "none", cursor: "pointer", display: "block" }}>
                    <Pedina id={pedinaId} size={28} />
                  </button>
                </Tooltip>
              ) : <Pedina id={pedinaId} size={28} />}
            </div>
          </div>
        </>}
        {dadoPicking && (
          <div style={{ position:"absolute", top: 8, left:"50%", transform:"translateX(-50%)", zIndex: 21, display:"flex", gap: 10,
            alignItems:"center", padding:"6px 10px", background:"#16130f", boxShadow:`${bevel(GOLD, 1)}, 3px 3px 0 #000`,
            color:"#f2e6c8", fontFamily: FONT, fontSize:"11px" }}>
            🎲 Scegli il nuovo percorso: i nodi bordati di magenta (diventeranno ÉLITE)
            <button type="button" onClick={() => setDadoPicking(false)} style={{ fontFamily: FONT, fontSize:"10px", border:"none",
              padding:"4px 8px", cursor:"pointer", background:"#3a332a", color:"#f2e6c8" }}>ANNULLA</button>
          </div>
        )}
        {panelOpen && tokens && (
          <TokenPanel tokens={tokens} onClose={() => setPanelOpen(false)}
            onEquip={(id) => onEquipToken?.(id)} onDiscard={(id) => onDiscardToken?.(id)}
            powers={tokenPowers} dadoPicking={dadoPicking}
            onDado={() => { setDadoPicking(p => !p); setPanelOpen(false); }} />
        )}
      </div>

      {/* ══ LEGENDA — forma + colore ════════════════════════════════ */}
      <div style={{
        height: LEGEND_H, flexShrink: 0, display:"flex", alignItems:"center", gap:"16px",
        padding:"0 12px", background: theme.marquee, borderTop:`2px solid ${GOLD.dark}`,
        fontSize:"11px", letterSpacing:"1px", overflow:"hidden",
      }}>
        {["danger","neutral","safe","event","secret"].map(k => (
          <span key={k} style={{display:"inline-flex", alignItems:"center", gap:"6px", color: theme.ink, flexShrink:0}}>
            <span style={{width:14, height:14, display:"inline-flex", alignItems:"center", justifyContent:"center",
              background: FAMILY[k].tile, color:"#fff", fontSize:"9px", boxShadow:`inset 0 0 0 1px ${GOLD.lo}`}}>{FAMILY[k].glyph}</span>
            {FAMILY[k].label}
          </span>
        ))}
        <span style={{display:"inline-flex", alignItems:"center", gap:"6px", color: C.orange, flexShrink:0}}>★ ÉLITE</span>
        <span style={{marginLeft:"auto", color: theme.ink, flexShrink:0}}>PAGATO = già visitato</span>
        {tokens && (
          <button type="button" onClick={() => setPanelOpen(o => !o)} style={{
            display:"inline-flex", alignItems:"center", gap:"6px", flexShrink:0, padding:"0 6px", height: 22,
            border:"none", background:"#000", color: GOLD.mid, fontFamily: FONT, fontSize:"11px", letterSpacing:"1px",
            cursor:"pointer", boxShadow:`inset 0 0 0 1px ${GOLD.lo}`,
          }}>
            <Pedina id={pedinaId} size={16} /> {TOKENS[pedinaId]?.name.toUpperCase()}
          </button>
        )}
      </div>
    </div>
  );
}
