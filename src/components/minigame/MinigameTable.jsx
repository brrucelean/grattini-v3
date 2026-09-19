import { useEffect, useRef } from "react";
import { FONT } from "../../data/theme.js";
import { CARD_TYPES, ticketGuide } from "../../data/cards.js";
import { TABLE_BG, MAT_STYLE, Dossier, RightRail, TableTopBar } from "../scratch/ScratchTable.jsx";
import { TICKET_LAYOUT, TICKET_LAYOUT_FALLBACK } from "../../data/ticketLayout.js";
import { assetUrl } from "../../assets/registry.js";
import { TicketHeader } from "../TicketHeader.jsx";
import { WinPanel, NoWinPanel } from "../scratch/OutcomePanel.jsx";
import { AudioEngine, ParticleSystem } from "../../audio.js";

// ─── MINIGIOCHI SUL TAVOLO DELLA GRATTATA (desktop) ─────────────
// Labirinto, Gratta & Combina e Mappa del Tesoro stanno sullo STESSO tavolo
// dei grattini: barra in alto (biglietto, unghie, soldi), dossier a sinistra,
// grattatori e scontrino a destra, il biglietto illustrato sul tappetino con
// nome/costo/max nel cartiglio e la striscia "Come si vince" sotto. Le
// caselle si grattano davvero (strato argentato su canvas), non basta un clic.
// Solo presentazione: stato e regole restano in scratchlite.

const INK = "#153f42", CREAM = "#fff3c4", EDGE = "#d9c27a", SHADOW = "#3a1f0f", RED = "#a3161d";

// Strato argentato da grattare. Quando è scoperto il 35% la casella si apre
// (come ScratchCell): onReveal decide cosa succede.
function ScratchCoat({ onReveal, hot = false }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const done = useRef(false);
  const ticks = useRef(0);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    // argento a retino 2×2, bordo in rilievo, "?" (o ★ se è la casella indicata)
    for (let y = 0; y < cv.height; y += 2) for (let x = 0; x < cv.width; x += 2) {
      ctx.fillStyle = (x + y) % 4 === 0 ? "#b9bec4" : "#c9ced3";
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.fillStyle = "#e4e8ec"; ctx.fillRect(0, 0, cv.width, 2); ctx.fillRect(0, 0, 2, cv.height);
    ctx.fillStyle = "#8a9096"; ctx.fillRect(0, cv.height - 2, cv.width, 2); ctx.fillRect(cv.width - 2, 0, 2, cv.height);
    ctx.fillStyle = hot ? "#1f7a4a" : "#6c7278";
    ctx.font = "bold 18px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(hot ? "★" : "?", cv.width / 2, cv.height / 2);
  }, [hot]);
  const scratch = (e) => {
    if (done.current) return;
    const cv = ref.current;
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) * cv.width / r.width, y = (e.clientY - r.top) * cv.height / r.height;
    const ctx = cv.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
    AudioEngine.scratch?.();
    ParticleSystem.spawn?.(e.clientX, e.clientY, 9, false);
    if (++ticks.current % 3) return;
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let clear = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 100) clear++;
    if (clear / (cv.width * cv.height) > 0.35) { done.current = true; onReveal(); }
  };
  return (
    <canvas ref={ref} width={120} height={60} aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "crosshair", touchAction: "none",
        boxShadow: hot ? "inset 0 0 0 3px #1f7a4a" : "none" }}
      onPointerDown={(e) => { drawing.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); scratch(e); }}
      onPointerMove={(e) => { if (drawing.current) scratch(e); }}
      onPointerUp={() => { drawing.current = false; }}
      onPointerLeave={() => { drawing.current = false; }} />
  );
}

// Casella: sotto c'è il contenuto (carta), sopra lo strato da grattare finché
// è coperta. Senza onClick → argento fermo (non ancora raggiungibile).
// hot = casella indicata (Labirinto: dove porta la freccia).
export function CoverCell({ revealed, onClick, children, mark = null, disabled = false, hot = false, label }) {
  const scratchable = !revealed && !disabled && !!onClick;
  return (
    <div role={scratchable ? "button" : undefined} aria-label={label} style={{
      position: "relative", width: "100%", height: "100%", minWidth: 0, minHeight: 0, fontFamily: FONT,
      background: "#fffbe6", boxShadow: mark ? `inset 0 0 0 3px ${mark}` : `inset 0 0 0 1px ${EDGE}`,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15cqh", color: INK, overflow: "hidden",
    }}>
      {revealed && children}
      {!revealed && (scratchable
        ? <ScratchCoat onReveal={onClick} hot={hot} />
        : <div aria-hidden style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "7cqh", color: "#6c7278",
            background: "repeating-conic-gradient(#b9bec4 0% 25%, #c9ced3 0% 50%) 0 0 / 4px 4px",
            boxShadow: "inset 2px 2px 0 #e4e8ec, inset -2px -2px 0 #8a9096" }}>?</div>)}
    </div>
  );
}

// Freccia pixel del Labirinto: il font Tiny5 non ha ↓ ↑ (uscivano come ✚),
// quindi è disegnata a mano e ruotata. Emoji e simboli (💀 🏆) passano così.
const ARROW_ROT = { "→": 0, "↓": 90, "←": 180, "↑": 270 };
export function MazeGlyph({ ch, color }) {
  if (!(ch in ARROW_ROT)) return ch;
  return (
    <svg viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden
      style={{ width: "13cqh", height: "13cqh", transform: `rotate(${ARROW_ROT[ch]}deg)` }}>
      <path fill={color} d="M0 3h5v2H0zM4 1h1v6H4zM5 2h1v4H5zM6 3h1v2H6z" />
    </svg>
  );
}

function ActionButton({ label, onClick, kind = "secondary", disabled = false }) {
  const primary = kind === "primary", danger = kind === "danger";
  return (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      height: "40px", padding: "0 16px", border: "none", fontFamily: FONT, fontSize: "13px", letterSpacing: "2px",
      cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.45 : 1,
      color: primary ? CREAM : danger ? RED : INK,
      background: primary ? INK : CREAM,
      boxShadow: primary ? `3px 3px 0 ${SHADOW}` : `inset 0 0 0 2px ${danger ? RED : INK}, 3px 3px 0 ${SHADOW}`,
    }}>{label}</button>
  );
}

// frame = { player, gameStats, biome, log, onEquipGrattatore } per il contorno del tavolo.
export function MinigameTable({ ticketId, accent, status, hint, children, actions = [], result = null, onContinue, frame }) {
  const card = CARD_TYPES.find(t => t.id === ticketId) || { id: ticketId, name: ticketId, cost: 0, maxPrize: 0 };
  const guide = ticketGuide(card);
  const lay = TICKET_LAYOUT[ticketId] || TICKET_LAYOUT_FALLBACK;
  const box = (z) => ({ position: "absolute", top: `${z.top}%`, left: `${z.left}%`, right: `${z.right}%`, bottom: `${z.bottom}%` });
  const art = assetUrl(`ticket-${ticketId}-v3`);
  const { player, gameStats, biome, log, onEquipGrattatore } = frame;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "#2a170c", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: FONT }}>
      {/* ── barra in alto, come la grattata ── */}
      <div style={{ flexShrink: 0, padding: "10px 14px", background: "#2a170c", borderBottom: "2px solid #e9c46a", display: "flex", alignItems: "center" }}>
        <TableTopBar card={card} nails={player.nails} activeNail={player.activeNail} money={player.money} />
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: "8px", background: TABLE_BG, display: "flex", gap: "14px" }}>
        <Dossier biome={biome} player={player} gameStats={gameStats} />

        {/* ── il tappetino ── */}
        <div style={{ flex: "1 1 auto", minWidth: 0, minHeight: 0, padding: "16px", ...MAT_STYLE, display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ flex: 1, minHeight: 0, width: "100%", containerType: "size", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <article aria-label={card.name} style={{
              position: "relative", width: "min(100cqw, 100cqh * 4 / 3)", aspectRatio: "4 / 3",
              background: art ? `url(${art}) center / 100% 100% no-repeat` : CREAM, imageRendering: "pixelated",
              filter: `drop-shadow(6px 6px 0 ${SHADOW})`,
            }}>
              <TicketHeader card={card} accent={accent} layout={lay} />
              <div style={{ ...box(lay.play), containerType: "size" }}>
                <div style={{ width: "100%", height: "100%", boxSizing: "border-box", padding: "2.5cqh 1.5cqw", display: "flex", alignItems: "stretch", justifyContent: "center" }}>
                  {children}
                </div>
              </div>
              {/* esito: la stessa fascia dei grattini normali */}
              {result && (
                <div style={{ position: "absolute", left: "50%", bottom: "4%", transform: "translateX(-50%)", width: "min(92%, 640px)", zIndex: 30 }}>
                  {result.kind === "win"
                    ? <WinPanel amountLabel={result.title} detail={result.detail} onOk={onContinue} okLabel={result.amount ? `✓ RITIRA €${result.amount}` : "✓ OK"} />
                    : <NoWinPanel reason={`${result.title} ${result.detail}`} onOk={onContinue} />}
                </div>
              )}
            </article>
          </div>

          {/* ── come si vince: la stessa striscia dei grattini ── */}
          <div style={{
            width: "min(100%, 900px)", margin: "0 auto", boxSizing: "border-box", flexShrink: 0,
            display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: "4px 12px", alignItems: "baseline",
            padding: "8px 12px", background: CREAM, color: INK, border: "2px solid #ead56b", outline: "1px solid #6f1d24", outlineOffset: "-5px",
          }}>
            <span style={{ gridRow: "span 2", alignSelf: "center", fontSize: "11px", fontWeight: "bold", letterSpacing: "1.5px",
              background: INK, color: CREAM, padding: "4px 6px", lineHeight: 1.2, textAlign: "center" }}>COME<br />SI VINCE</span>
            {guide.tagline && <span style={{ fontSize: "11px", fontStyle: "italic", opacity: 0.8 }}>{guide.tagline}</span>}
            <span style={{ fontSize: "13px", lineHeight: 1.4 }}>{guide.how}</span>
          </div>

          {/* ── stato + azioni (a gioco finito parla la fascia di esito) ── */}
          <div style={{ width: "min(100%, 900px)", margin: "0 auto", minHeight: "40px", flexShrink: 0, display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {!result && <>
              {status.map(([k, v, strong]) => (
                <span key={k} style={{ fontSize: "12px", padding: "6px 10px", background: strong ? accent : CREAM,
                  color: strong ? CREAM : INK, boxShadow: `3px 3px 0 ${SHADOW}` }}>
                  {k} <b style={{ fontWeight: "normal", fontSize: "14px" }}>{v}</b>
                </span>
              ))}
              {hint && <span style={{ fontSize: "12px", color: CREAM, marginLeft: "6px" }}>✋ {hint}</span>}
              <span style={{ flex: 1 }} />
              {actions.filter(Boolean).map(a => <ActionButton key={a.label} {...a} />)}
            </>}
          </div>
        </div>

        <RightRail player={player} onEquipGrattatore={onEquipGrattatore} log={log} setGameHost={null} />
      </div>
    </div>
  );
}
