import { useState, useRef, useEffect } from "react";
import { C, FONT, T } from "../data/theme.js";
import { PlayingCardFace } from "./PlayingCardFace.jsx";
import { AudioEngine, ParticleSystem } from "../audio.js";
import { Haptics } from "../utils/haptics.js";

// ─── SCRATCH CELL (canvas silver-layer drag-to-reveal) ──────
// ─── CORIANDOLI DI CELLA ─────────────────────────────────────
// La festa stava tutta nella schermata di vittoria finale: la grattata vincente
// — il momento in cui il giocatore SCOPRE di aver vinto — aveva solo un bordo
// verde e un box-shadow pulsante. Qui il premio si festeggia dove nasce.
// Emoji + CSS come i coriandoli della victory screen: nessuna libreria, nessun
// canvas in più (il ParticleSystem globale resta la polvere della grattata).
const CELL_CONFETTI = ["🎉","✨","🎊","⭐","💫","🌟"];
const JACKPOT_CONFETTI = ["💰","👑","💎","🏆","✨","🌟","🎊","💫"];
function cellBurstPieces(tier, seed) {
  const rng = (s) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };
  // Più alto è il tier del biglietto, più grossa è la festa (jackpot = 14 pezzi)
  const n = tier >= 4 ? 14 : tier >= 3 ? 11 : tier >= 2 ? 8 : 6;
  const pool = tier >= 3 ? JACKPOT_CONFETTI : CELL_CONFETTI;
  return Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * Math.PI * 2 + rng(seed + i) * 0.7;
    const dist = 26 + rng(seed * 3 + i) * 34;
    return {
      k: i,
      emoji: pool[i % pool.length],
      dx: Math.round(Math.cos(ang) * dist),
      dy: Math.round(Math.sin(ang) * dist - 12), // bias verso l'alto
      rot: Math.round(90 + rng(seed * 7 + i) * 320),
      size: 10 + Math.round(rng(seed * 11 + i) * (tier >= 3 ? 12 : 7)),
      delay: Math.round(rng(seed * 13 + i) * 220),
      dur: 900 + Math.round(rng(seed * 17 + i) * 700),
    };
  });
}

// Inchiostri da tipografia: ogni simbolo ha il suo colore (stabile), come sui
// gratta e vinci veri, invece di tutti blu petrolio. Le emoji hanno già i loro.
const PRINT_INKS = ["#c8161d", "#1f5fbf", "#1c7a3a", "#b0306a", "#d0621c", "#6a2fb0", "#0f7f86", "#8a5a00"];
function inkFor(sym = "") {
  let h = 0;
  for (const ch of String(sym)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return PRINT_INKS[h % PRINT_INKS.length];
}

export function ScratchCell({ cell, idx, onScratch, finished, isWinSymbol, isPartialMatch, ambidestri=false, bloodMode=false, isBloody=false, themeColor=null, blocked=false, onBlockedAttempt=null, fill=false, winTier=1, printSkin=false, onFirstTouch=null }) {
  const canvasRef = useRef(null);
  const rootRef = useRef(null);
  const drawing = useRef(false);
  const revealed = useRef(cell.scratched);
  const scratchTicks = useRef(0); // throttle del check getImageData (costoso su mobile)
  const touched = useRef(false); // primo tocco già segnalato a onFirstTouch
  const [winAnim, setWinAnim] = useState(false); // glow burst al reveal vincente
  const [burst, setBurst] = useState(null);      // coriandoli localizzati sulla cella
  const prevScratched = useRef(cell.scratched);
  // Pattern pseudo-random stabile basato su idx — così ogni cella sporca ha macchie di sangue coerenti
  // tra i render (altrimenti ballerebbero ad ogni update di React).
  const bloodSplatter = useRef(null);
  if (isBloody && !bloodSplatter.current) {
    // 3-5 macchie ellittiche + 1-2 gocce che colano
    const rng = (seed) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };
    const blobs = [];
    const nBlobs = 3 + Math.floor(rng(idx + 1) * 3);
    for (let i = 0; i < nBlobs; i++) {
      blobs.push({
        cx: 10 + rng(idx * 7 + i) * 80,
        cy: 10 + rng(idx * 11 + i * 3) * 55,
        rx: 6 + rng(idx * 13 + i * 5) * 10,
        ry: 4 + rng(idx * 17 + i * 7) * 7,
        rot: rng(idx * 19 + i) * 180,
        op: 0.55 + rng(idx * 23 + i) * 0.35,
      });
    }
    const drips = [];
    const nDrips = 1 + Math.floor(rng(idx + 31) * 2);
    for (let i = 0; i < nDrips; i++) {
      drips.push({
        x: 15 + rng(idx * 29 + i) * 70,
        y: 5 + rng(idx * 31 + i) * 20,
        h: 12 + rng(idx * 37 + i) * 18,
      });
    }
    bloodSplatter.current = { blobs, drips };
  }

  // ── Win glow + haptics al reveal ──────────────────────────────
  useEffect(() => {
    if (!prevScratched.current && cell.scratched) {
      if (isWinSymbol) {
        setWinAnim(true);
        Haptics.win();
        setTimeout(() => setWinAnim(false), 900);
        // Coriandoli sulla cella che ha chiuso la combinazione vincente.
        const pieces = cellBurstPieces(winTier, idx + 1);
        setBurst(pieces);
        const maxLife = Math.max(...pieces.map(p => p.delay + p.dur));
        setTimeout(() => setBurst(null), maxLife + 100);
        // Sbuffo di scintille dal centro della cella — stesso ParticleSystem
        // della polverina di grattata, così la festa ha anche "materia".
        const r = rootRef.current?.getBoundingClientRect();
        if (r) {
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          ParticleSystem.spawn(cx, cy, winTier >= 3 ? 26 : 16, false);
        }
      }
    }
    prevScratched.current = cell.scratched;
  }, [cell.scratched, isWinSymbol]);

  // Init silver layer on mount
  useEffect(() => {
    if (cell.scratched) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // Patina da vero gratta e vinci: opaca, stampata e leggermente irregolare.
    // I biglietti V3 evitano il vecchio effetto "pannello cromato".
    const grad = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    grad.addColorStop(0,   printSkin ? "#8f928c" : "#aaaaaa");
    grad.addColorStop(0.3, printSkin ? "#c5c6bc" : "#d4d4d4");
    grad.addColorStop(0.55,printSkin ? "#a7aaa3" : "#e8e8e8");
    grad.addColorStop(0.78,printSkin ? "#d2d0c4" : "#c0c0c0");
    grad.addColorStop(1,   printSkin ? "#858982" : "#888888");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Shimmer highlights
    ctx.fillStyle = printSkin ? "rgba(255,255,230,0.24)" : "rgba(255,255,255,0.5)";
    for (let i=0; i<55; i++) ctx.fillRect((i * 37 + idx * 11) % canvas.width, (i * 19 + idx * 7) % canvas.height, printSkin ? 1 : 1.5, printSkin ? 1 : 1.5);
    // Dark grit
    ctx.fillStyle = printSkin ? "rgba(42,48,45,0.18)" : "rgba(0,0,0,0.2)";
    for (let i=0; i<25; i++) ctx.fillRect((i * 29 + idx * 17) % canvas.width, (i * 31 + idx * 5) % canvas.height, printSkin ? 1 : 2, printSkin ? 1 : 2);
    // Diagonal texture lines
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.5;
    for (let i=0; i<8; i++) {
      ctx.beginPath();
      ctx.moveTo(i*(canvas.width/7), 0);
      ctx.lineTo(0, i*(canvas.height/7));
      ctx.stroke();
    }
    if (printSkin) {
      ctx.fillStyle = "rgba(35,55,52,0.48)";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★", canvas.width / 2, canvas.height / 2);
    }
  }, [idx, printSkin]);

  const doScratch = (e) => {
    if (blocked) { onBlockedAttempt?.(); return; }
    if (finished || revealed.current || cell.scratched) return;
    // Primo tocco: il biglietto può decidere adesso cosa c'è sotto (Tredici).
    if (!touched.current) { touched.current = true; onFirstTouch?.(idx); }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null) return;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI*2);
    if (ambidestri) { ctx.arc(x + 36, y - 10, 28, 0, Math.PI*2); }
    ctx.fill();
    AudioEngine.scratch();
    Haptics.scratch();
    ParticleSystem.spawn(clientX, clientY, 9, bloodMode);
    // Check how much is scratched — getImageData è costoso, throttle a 1 ogni 3
    // chiamate (su mobile il touchmove spara decine di eventi/secondo).
    scratchTicks.current += 1;
    if (scratchTicks.current % 3 !== 0) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i=3; i<data.length; i+=4) if (data[i]<100) transparent++;
    const pct = transparent / (canvas.width * canvas.height);
    if (pct > 0.35 && !revealed.current) {
      revealed.current = true;
      onScratch(idx);
    }
  };

  const isTrap = cell.isTrap;
  const isJolly = cell.isJolly;
  const isItem = cell.isItem;
  const isStop = cell.isStop;
  const isCard = cell.isRed !== undefined; // carta da gioco (sette e mezzo)
  // Biglietti V3 stampati: la cella scoperta è carta, non schermo CGA.
  // Vincita = casella gialla jackpot, coppia in corso = filo oro doppio,
  // trappola/stop = inchiostro rosso su rosa, jolly = oro, oggetto = verde acqua.
  const PRINT = {
    // carta con trama di stampa (dithering 2px fra due crema), non tinta piatta
    paper: "repeating-conic-gradient(#fff6d8 0% 25%, #fbeec4 0% 50%) 0 0 / 4px 4px",
    ink: inkFor(cell.symbol),
    win: "#ffd84a", winInk: "#0d3a1c", winEdge: "#1c7a3a",
    partialEdge: "#c8901f",
    trap: "#f6c9c0", trapInk: "#a3161d",
    jolly: "#ffe27a", jollyInk: "#6a4a00",
    item: "#c9efe8", itemInk: "#0c5a55",
  };
  // CGA: colori piatti puri, niente mezzi toni
  const borderColor = printSkin ? (
    isTrap || isStop ? PRINT.trapInk : isJolly ? "#c8901f" : isItem ? PRINT.itemInk :
    isWinSymbol ? PRINT.winEdge : isPartialMatch ? PRINT.partialEdge : "#ead56b"
  ) : isTrap ? C.red : isJolly ? C.gold : isItem ? C.cyan : isStop ? C.red :
    isCard ? (isWinSymbol ? C.green : C.text) :
    isWinSymbol ? C.green : isPartialMatch ? C.gold : C.dim;
  const bg = printSkin && !isCard ? (
    isTrap || isStop ? PRINT.trap : isJolly ? PRINT.jolly : isItem ? PRINT.item :
    isWinSymbol ? PRINT.win : PRINT.paper
  ) : isTrap ? "#550000" : isJolly ? "#555500" : isItem ? "#005555" : isStop ? "#550000" :
    isCard ? "#FFFFFF" :
    isWinSymbol ? "#005500" : isPartialMatch ? "#555500" : printSkin ? "#fff0b5" : "#000033";
  const color = printSkin && !isCard ? (
    isTrap || isStop ? PRINT.trapInk : isJolly ? PRINT.jollyInk : isItem ? PRINT.itemInk :
    isWinSymbol ? PRINT.winInk : PRINT.ink
  ) : isTrap ? C.red : isJolly ? C.gold : isItem ? C.cyan : isStop ? C.red :
    isCard ? (cell.isRed ? "#FF0000" : "#000000") :
    isWinSymbol ? C.green : isPartialMatch ? C.gold : printSkin ? "#153f42" : C.text;
  // CGA: cella non grattata = nero con bordo più visibile (aspetto "moneta CGA")
  const unrevealedBorder = themeColor || "#778899";
  // Sui biglietti stampati il simbolo occupa la cella (container query):
  // numeri e valori grandi come su una schedina, non 16px sperduti.
  const symFontSize = isCard ? "20px"
    : printSkin ? ((cell.value !== undefined || isStop) ? "min(60cqh, 34cqw)" : "min(78cqh, 50cqw)")
    : (cell.value !== undefined || isStop) ? "16px" : "24px";

  return (
    // Wrapper senza overflow: i coriandoli devono poter uscire dai bordi della
    // cella. Tiene lui la misura (aspect-ratio / fill); la tessera vera riempie
    // il wrapper, quindi l'impaginazione della griglia non cambia.
    <div ref={rootRef} style={{
      width:"100%", ...(fill ? {height:"100%"} : {aspectRatio:"1.3"}),
      position:"relative",
    }}>
    <div style={{
      position:"absolute", inset:0, containerType:"size",
      border: printSkin && !cell.scratched
        ? "2px solid #ead56b"
        : `${printSkin ? 2 : 3}px solid ${cell.scratched && isBloody ? "#ff2030" : (cell.scratched ? borderColor : unrevealedBorder)}`,
      outline: printSkin && !cell.scratched ? "1px solid #6f1d24"
        : printSkin && cell.scratched && isPartialMatch ? `2px solid ${PRINT.partialEdge}` : "none",
      outlineOffset: "-3px",
      borderRadius: printSkin ? "2px" : "0", overflow:"hidden",
      background: cell.scratched ? bg : "#111",
      // Biglietto stampato: la vincita è la casella gialla + lampeggio netto
      // (printWin, due scatti). Niente aloni, anelli o coriandoli.
      boxShadow: winAnim && printSkin
        ? `inset 0 0 0 2px ${PRINT.winEdge}`
        : winAnim
        ? `0 0 0 3px ${C.green}ee, 0 0 24px ${C.green}aa, 0 0 48px ${C.green}55, 3px 3px 0 #000`
        : cell.scratched && isBloody
          ? "inset 0 0 14px #ff000088, 0 0 10px #ff000055, 3px 3px 0 #000"
          : printSkin ? "none" : "3px 3px 0 #000000",
      animation: winAnim ? (printSkin ? "printWin 0.5s steps(1) 3" : "winFlash 0.9s ease-out forwards") : "none",
      transition: `box-shadow ${T.instant}`,
    }}>
      {/* Sette e Mezzo: la carta vera (indici negli angoli, semi, figure) */}
      {cell.scratched && isCard && cell.rank && (
        <PlayingCardFace rank={cell.rank} suit={cell.suit} isRed={cell.isRed} />
      )}
      {/* Symbol — visible only after reveal */}
      {cell.scratched && !(isCard && cell.rank) && (
        <div style={{
          position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:symFontSize, fontWeight:"bold", color,
          lineHeight: 1,
          textShadow: printSkin ? "none" : isWinSymbol ? `0 0 8px ${C.green}` : isJolly ? `0 0 8px #ffd700` : isItem ? `0 0 8px #00cccc` : "none",
        }}>
          {cell.symbol}
        </div>
      )}
      {/* ASCII texture underneath canvas */}
      {!cell.scratched && !printSkin && (
        <div style={{
          position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"10px", color:"#444", fontFamily:FONT, lineHeight:"1",
          overflow:"hidden", pointerEvents:"none", opacity:0.4,
        }}>
          ░▒▓█▓▒░<br/>▒▓█▓▒░▒<br/>▓█▓▒░▒▓
        </div>
      )}
      {/* Blood splatter overlay — visibile solo su cella grattata e "sporcata" */}
      {cell.scratched && isBloody && bloodSplatter.current && (
        <svg
          viewBox="0 0 100 70"
          preserveAspectRatio="none"
          style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            pointerEvents:"none",
            filter: "drop-shadow(0 0 2px #ff0000aa) drop-shadow(0 1px 1px #00000099)",
          }}
        >
          {/* Macchie grandi — rosso brillante con bordo scuro per definizione */}
          {bloodSplatter.current.blobs.map((b, i) => (
            <g key={`b${i}`} transform={`rotate(${b.rot} ${b.cx} ${b.cy})`}>
              <ellipse
                cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry}
                fill="#ff1020"
                opacity={Math.min(1, b.op + 0.1)}
              />
              {/* Highlight al centro per effetto bagnato/fresco */}
              <ellipse
                cx={b.cx - b.rx * 0.25} cy={b.cy - b.ry * 0.3}
                rx={b.rx * 0.3} ry={b.ry * 0.35}
                fill="#ff6060"
                opacity="0.55"
              />
            </g>
          ))}
          {/* Gocce che colano — rosso scuro ma saturo */}
          {bloodSplatter.current.drips.map((d, i) => (
            <g key={`d${i}`}>
              <rect
                x={d.x - 1.2} y={d.y} width="2.6" height={d.h}
                fill="#dd0010" opacity="0.92"
              />
              {/* Goccia a fondo colata */}
              <circle cx={d.x} cy={d.y + d.h} r="1.4" fill="#ff1020" opacity="0.95" />
            </g>
          ))}
          {/* Piccoli schizzi puntiformi — rosso brillante */}
          {bloodSplatter.current.blobs.slice(0, 3).map((b, i) => (
            <circle key={`s${i}`} cx={b.cx + 8 + i * 3} cy={b.cy - 6 - i * 2} r="1.1" fill="#ff2030" opacity="0.95" />
          ))}
          {/* Micro-spruzzi extra per aumentare densità visiva */}
          {bloodSplatter.current.blobs.slice(0, 4).map((b, i) => (
            <circle key={`ms${i}`} cx={b.cx - 6 - i * 2} cy={b.cy + 4 + i * 2} r="0.7" fill="#ff4050" opacity="0.85" />
          ))}
        </svg>
      )}
      {/* Silver canvas overlay */}
      {!cell.scratched && (
        <canvas ref={canvasRef} width={90} height={70}
          style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            cursor: finished ? "default" : "inherit",
            touchAction:"none",
          }}
          onMouseDown={(e)=>{ drawing.current=true; doScratch(e); }}
          onMouseUp={()=>{ drawing.current=false; }}
          onMouseLeave={()=>{ drawing.current=false; }}
          onMouseMove={(e)=>{ if(drawing.current) doScratch(e); }}
          onTouchStart={(e)=>{ e.preventDefault(); drawing.current=true; doScratch(e); }}
          onTouchMove={(e)=>{ e.preventDefault(); doScratch(e); }}
          onTouchEnd={()=>{ drawing.current=false; }}
        />
      )}
    </div>

    {/* ── CORIANDOLI: burst dal centro della cella vincente ── */}
    {burst && !printSkin && (
      <div aria-hidden style={{position:"absolute", inset:0, pointerEvents:"none", zIndex:12}}>
        {/* Onda d'urto */}
        <span style={{
          position:"absolute", left:"50%", top:"50%",
          width:"70%", height:"70%", marginLeft:"-35%", marginTop:"-35%",
          border:`2px solid ${winTier >= 3 ? C.gold : C.green}`,
          boxShadow:`0 0 14px ${winTier >= 3 ? C.gold : C.green}aa`,
          animation:"perfectRing 0.65s ease-out forwards",
        }}/>
        {burst.map(p => (
          <span key={p.k} style={{
            position:"absolute", left:"50%", top:"50%",
            fontSize:`${p.size}px`, lineHeight:1,
            "--dx":`${p.dx}px`, "--dy":`${p.dy}px`, "--rot":`${p.rot}deg`,
            animation:`cellBurst ${p.dur}ms ${p.delay}ms ease-out forwards`,
            filter:"drop-shadow(0 1px 2px #000)",
          }}>{p.emoji}</span>
        ))}
      </div>
    )}
    </div>
  );
}
