import { useState, useEffect, useRef } from "react";
import { C, FONT } from "../data/theme.js";
import {
  CAT_EMOJI_MAP, CAT_BG,
  ENEMY_STATS, DEFAULT_ENEMY_STATS, EFFECT_DAMAGE,
} from "../data/combat.js";
import { roll, pick } from "../utils/random.js";
import { nailCursor, isDamagedNail } from "../utils/nail.js";
import { generateCombatHand, generateCombatCard, CARD_VARIANTS } from "../utils/combat.js";
import { SPR_BIG } from "../data/art.js";
import { BOSS_SPRITE } from "../data/biomes.js";
import { AudioEngine, ParticleSystem } from "../audio.js";
import { hasRelic } from "../utils/hasRelic.js";
import { Btn } from "./Btn.jsx";
import { NailDisplay } from "./NailDisplay.jsx";
import { Asset } from "./Asset.jsx";
import { hasAsset } from "../assets/registry.js";
import { ANIM } from "../styles/animations.js";

// Nomi categoria abbreviati — COMBATTIMENTO è troppo lungo per le card strette
const CAT_SHORT = { COMBATTIMENTO: "BOTTA", DIFESA: "PARATA", DENARO: "PREMIO" };
const CAT_MARK = { COMBATTIMENTO: "⚔", DIFESA: "◆", DENARO: "€" };

// Sprite ASCII del nemico (schermo "mostro" sopra le barre — come da bozza)
function enemySpriteKey(enemy) {
  const n = enemy?.name;
  if (n === "Ladro" || n === "Ladro Nascosto") return "ladro";
  if (n === "Poliziotto") return "poliziotto";
  if (n === "Spacciatore") return "spacciatore";
  // Ogni boss il suo sprite; se l'arte dedicata non c'è ancora si ricade
  // sul generico invece di mostrare un'immagine mancante.
  const bossKey = BOSS_SPRITE[n];
  if (bossKey) return hasAsset(`spr-${bossKey}`) ? bossKey : "boss";
  if (enemy?.isBoss) return "boss";
  return "miniboss";
}


// ─── COMBAT CARD SCRATCH ─────────────────────────────────────
export function CombatCardScratch({ cell, onRevealed, catColors, disabled, nailState = "sana", onDeadAttempt }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const revealed = useRef(false);
  const [isRevealed, setIsRevealed] = useState(false); // al reveal la patina sparisce del tutto
  const lastScratchSound = useRef(0); // throttle audio
  const scratchTicks = useRef(0);     // throttle del check getImageData (costoso su mobile)
  const combatNailCursor = nailCursor(nailState);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // Patina argentata opaca da gratta e vinci, coerente con i biglietti V3.
    // Il colore di categoria resta nella gabbia stampata, non nella lamina.
    ctx.fillStyle = "#b9b8ad";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Noise leggerissimo — quasi invisibile
    ctx.fillStyle = "rgba(255,255,230,0.22)";
    for (let i = 0; i < 55; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.fillRect(x, y, 1, 1);
    }
    // Strisce diagonali sottilissime — appena percettibili
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    for (let x = -canvas.height; x < canvas.width + canvas.height; x += 26) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + canvas.height, canvas.height); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Marchio ripetuto da biglietto popolare: resta leggibile mentre la lamina
    // viene consumata, senza svelare in anticipo l'effetto della carta.
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = "#243331";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${CAT_MARK[cell.category] || "✦"} ${CAT_SHORT[cell.category] || "GRATTA"}`, canvas.width / 2, 31);
    ctx.font = "bold 12px monospace";
    ctx.fillText("GRATTA  GRATTA  GRATTA", canvas.width / 2, canvas.height - 15);
    ctx.globalAlpha = 1;
    // Bordo interno scuro
    ctx.strokeStyle = catColors[cell.category] || C.gold;
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
    ctx.strokeStyle = "rgba(25,35,34,0.65)";
    ctx.lineWidth = 2;
    ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
  }, [cell.category, catColors]);

  const doScratch = (e) => {
    if (revealed.current || disabled) return;
    // Unghia MORTA: non si può grattare — avvisa di sceglierne una sana
    if (nailState === "morta") { onDeadAttempt?.(); return; }
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
    ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.fill();
    // Polverina d'oro a ogni passata
    ParticleSystem.spawn(clientX, clientY, 18, false);
    // Suono della grattata — throttled a ogni 80ms per non spammare
    const now = Date.now();
    if (now - lastScratchSound.current > 80) {
      AudioEngine.scratch();
      lastScratchSound.current = now;
    }
    // getImageData legge tutto il canvas: throttle a 1 ogni 3 passate come in
    // ScratchCell (su mobile il touchmove spara decine di eventi al secondo).
    scratchTicks.current += 1;
    if (scratchTicks.current % 3 !== 0) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 100) transparent++;
    if (transparent / (canvas.width * canvas.height) > 0.30 && !revealed.current) {
      revealed.current = true;
      // Reveal completo: pulisci TUTTA la patina d'oro in un colpo (come i grattini originali)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Burst di polverina su tutta la carta
      for (let k = 0; k < 6; k++) {
        ParticleSystem.spawn(rect.left + Math.random() * rect.width, rect.top + Math.random() * rect.height, 12, false);
      }
      AudioEngine.scratch();
      setIsRevealed(true);
      onRevealed();
    }
  };

  const evts = {
    onMouseDown: (e) => { drawing.current = true; doScratch(e); },
    onMouseMove: (e) => { if (drawing.current) doScratch(e); },
    onMouseUp:   () =>  { drawing.current = false; },
    onMouseLeave:() =>  { drawing.current = false; },
    onTouchStart:(e) => { drawing.current = true; doScratch(e); e.preventDefault(); },
    onTouchMove: (e) => { if (drawing.current) doScratch(e); e.preventDefault(); },
    onTouchEnd:  () =>  { drawing.current = false; },
  };

  return (
    <div style={{
      position:"relative", borderRadius:"0", overflow:"hidden",
      border: disabled ? `3px solid #333` : `4px solid ${catColors[cell.category] || C.gold}`,
      // Sfondo OPACO scuro — niente bleeding del contenuto
      background: disabled ? "#111" : CAT_BG[cell.category] || "#0a0a12",
      // Misura fissa del ticket nel frame logico 640×360.
      height:"69px", minHeight:0,
      boxShadow: disabled ? "none" : `4px 4px 0 #000, inset 0 0 0 2px #f4df83`,
      cursor: disabled ? "default" : "crosshair",
      touchAction: "none",
    }} {...evts}>

      {/* Canvas oro — sempre montato finché non rivelata (mai smontato/rimontato:
          l'effetto di pittura gira una sola volta al mount del componente, quindi
          smontare e rimontare il <canvas> lo lascerebbe vuoto/trasparente).
          Il blocco "disabled" è puramente visivo (overlay sotto) + il check
          in doScratch, non tocca il DOM del canvas. */}
      {!isRevealed && (
        <canvas ref={canvasRef} width={288} height={138}
          style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            display:"block", cursor: disabled ? "default" : combatNailCursor, touchAction:"none",
            opacity: disabled ? 0.35 : 1,
            filter: disabled ? "grayscale(60%)" : "none",
          }}
        />
      )}

      {/* Badge categoria — SOPRA il canvas, sempre visibile */}
      <div style={{
        position:"absolute", inset:0,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        pointerEvents:"none", zIndex:3,
        gap:"3px",
      }}>
        {disabled ? (
          <div style={{fontSize:"24px", opacity:0.2, color:C.dim}}>✕</div>
        ) : isRevealed ? (
          <>
            {/* Carta rivelata: mostra l'EFFETTO specifico (emoji + nome) */}
            <div style={{
              minWidth:"32px", height:"28px", display:"grid", placeItems:"center",
              fontSize:"22px", lineHeight:1, background:"#f5e8bd",
              border:`2px solid ${catColors[cell.category] || C.gold}`,
              boxShadow:"2px 2px 0 #000",
            }}>
              <Asset
                id={!cell.emoji && cell.category ? `combat-${cell.category.toLowerCase()}` : null}
                emoji={cell.emoji || CAT_EMOJI_MAP[cell.category] || "?"}
                size={25}
              />
            </div>
            <div style={{
              fontSize:"11px", fontWeight:"bold", letterSpacing:"1px",
              color: "#fff7da", background:catColors[cell.category] || C.gold,
              textAlign:"center", padding:"3px 8px", lineHeight:1,
              border:"2px solid #090909", boxShadow:"2px 2px 0 #000",
            }}>
              {cell.name}
            </div>
          </>
        ) : (
          <>
            {/* Icona stampata sull'oro — colore scuro, ombra incisa */}
            <div style={{fontSize:"25px", lineHeight:.8, color:"#173c3b", fontWeight:900}}>
              {CAT_MARK[cell.category] || "✦"}
            </div>
            {/* Label stampata — abbreviata per evitare overflow nelle card strette */}
            <div style={{
              fontSize:"13px", fontWeight:"900", letterSpacing:"1px",
              color: "#173c3b",
              background:"rgba(255,255,225,.62)", padding:"2px 7px",
              border:"2px solid rgba(23,60,59,.55)",
              textTransform:"uppercase",
            }}>
              {CAT_SHORT[cell.category] || cell.category}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ─── V2: helper effetti duello HP ────────────────────────────
const CAT_COLORS = { COMBATTIMENTO: C.red, DIFESA: C.blue, DENARO: C.gold };
const FURY_TURN = 3; // dal turno 3 il nemico va in FURIA (enrage): +danno, niente cura

// Risolve UNA carta del player → produce delta {dmg, loot, heals, self, block, dodge, log}
function resolvePlayerCell(c) {
  const variantMult = CARD_VARIANTS[c.variant]?.valueMult ?? 1;
  const val = Math.round((c.value || 0) * variantMult);
  switch (c.effect) {
    case "lightDamage":
      return { dmg: EFFECT_DAMAGE.lightDamage, log: `🗡️ ${c.name}: ${EFFECT_DAMAGE.lightDamage} danni!` };
    case "damageNail":
      return { dmg: EFFECT_DAMAGE.damageNail, log: `🗡️ ${c.name}: colpo pesante ${EFFECT_DAMAGE.damageNail} danni!` };
    case "berserk":
      return { dmg: EFFECT_DAMAGE.berserk, self: 1, log: `💢 ${c.name}: ${EFFECT_DAMAGE.berserk} danni — ma degradi 1 unghia!` };
    case "stealMoney": {
      const dmg = EFFECT_DAMAGE.stealMoney;
      return { dmg, loot: val, log: `🗡️ ${c.name}: ${dmg} danni + rubi €${val}!` };
    }
    case "allIn":
      return { loot: val, enemyShield: c.cost || 0, log: `🎰 ${c.name}: +€${val} (ma il nemico si copre +${c.cost||0} scudo)` };
    case "money":
      return { loot: val, log: `💰 ${c.name}: +€${val}` };
    case "gamble":
      return roll(0.5)
        ? { loot: val, log: `🎟 ${c.name}: FORTUNA! +€${val}` }
        : { loot: -(c.cost || 0), log: `🎟 ${c.name}: sfiga −€${c.cost || 0}` };
    case "freeCard": {
      const prize = pick([0, 0, 8, 12, 20]);
      return prize > 0
        ? { loot: prize, log: `🎫 ${c.name}: grattino vinto +€${prize}!` }
        : { log: `🎫 ${c.name}: grattino... niente.` };
    }
    case "heal":
      return { heals: 1, log: `💉 ${c.name}: 1 unghia curata` };
    case "adrenaline":
      return { heals: 1, altLoot: val, log: `💉 ${c.name}: cura 1 unghia (o +€${val} se sane)` };
    case "block":
      return { block: true, log: `🛡 ${c.name}: PARATA pronta — para l'attacco in arrivo!` };
    case "fortress":
      return { guard: true, loot: -(c.cost || 0), log: `🏰 ${c.name}: FORTEZZA — blocco garantito (−€${c.cost || 0})` };
    case "dodge":
      return { dodge: 1, log: `💨 ${c.name}: PARATA pronta — schiva l'attacco!` };
    default:
      return { log: `${c.name}` };
  }
}


// ─── TIMING BAR: minigioco tempismo (attacco / parata) ───────
// Un cursore oscilla su una barra; zona verde = PERFETTO, gialla = BUONO.
// Premi (click/spazio/tap) per fermarlo. onResult riceve "perfect"|"good"|"miss".
function TimingBar({ mode = "attack", speed = 1.5, onResult, perfectWiden = 0 }) {
  const isAttack = mode === "attack";
  const accent = isAttack ? C.red : C.blue;
  // zone (0..1) — perfectWiden allarga la zona verde (Fascia da Polso)
  const PERFECT = [0.44 - perfectWiden, 0.56 + perfectWiden];
  const GOOD = [0.26, 0.74];

  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const dirRef = useRef(1);
  const doneRef = useRef(false);
  const rafRef = useRef(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let last = performance.now();
    const loop = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      posRef.current += dirRef.current * speed * dt;
      if (posRef.current >= 1) { posRef.current = 1; dirRef.current = -1; }
      if (posRef.current <= 0) { posRef.current = 0; dirRef.current = 1; }
      setPos(posRef.current);
      if (!doneRef.current) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed]);

  const lock = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const p = posRef.current;
    let quality = "miss";
    if (p >= PERFECT[0] && p <= PERFECT[1]) quality = "perfect";
    else if (p >= GOOD[0] && p <= GOOD[1]) quality = "good";
    AudioEngine.scratch();
    setResult(quality);
    setTimeout(() => onResult(quality), 650);
  };

  useEffect(() => {
    const onKey = (e) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); lock(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resultLabel = result === "perfect" ? (isAttack ? "COLPO PERFETTO!" : "PARATA PERFETTA!")
    : result === "good" ? (isAttack ? "BUONO!" : "PARATA PARZIALE")
    : result ? (isAttack ? "MANCATO..." : "COLPITO!") : null;
  const resultColor = result === "perfect" ? C.green : result === "good" ? C.gold : C.red;

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 40,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px",
      background: "rgba(4,5,5,0.92)",
    }}
      onClick={lock}
    >
      <div style={{ color: accent, fontSize: "22px", fontWeight: "bold", letterSpacing: "2px", textShadow: "3px 3px 0 #000" }}>
        {isAttack ? "⚔️ COLPISCI AL MOMENTO GIUSTO!" : "🛡 PARA L'ATTACCO!"}
      </div>
      {/* Barra */}
      <div style={{
        position: "relative", width: "min(80%, 460px)", height: "34px",
        background: "#090b0b", border: `4px solid ${accent}`, borderRadius: "0", overflow: "hidden",
        boxShadow: `5px 5px 0 #000, inset 0 0 0 2px #e9ddad33`,
      }}>
        {/* zona buono */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${GOOD[0] * 100}%`, width: `${(GOOD[1] - GOOD[0]) * 100}%`, background: `${C.gold}33`, borderLeft: `1px solid ${C.gold}88`, borderRight: `1px solid ${C.gold}88` }} />
        {/* zona perfetto */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${PERFECT[0] * 100}%`, width: `${(PERFECT[1] - PERFECT[0]) * 100}%`, background: C.green }} />
        {/* cursore */}
        <div style={{ position: "absolute", top: "-3px", bottom: "-3px", left: `calc(${pos * 100}% - 3px)`, width: "6px", background: result ? resultColor : "#fff", transition: doneRef.current ? "background 0.1s" : "none" }} />
      </div>
      {resultLabel ? (
        <div style={{ color: resultColor, fontSize: "22px", fontWeight: "bold", textShadow: "3px 3px 0 #000" }}>{resultLabel}</div>
      ) : (
        <div style={{
          padding: "10px 30px", background: accent, color: "#000", fontWeight: "bold", fontSize: "16px",
          border: `3px solid #f7e9b7`, borderRadius: "0", boxShadow: "4px 4px 0 #000", cursor: "pointer",
          letterSpacing: "1px",
        }}>
          {isAttack ? "COLPISCI!" : "PARA!"} <span style={{ fontSize: "11px", opacity: 0.7 }}>(spazio / tap)</span>
        </div>
      )}
    </div>
  );
}


// ─── COMBAT COMPONENT — DUELLO HP ────────────────────────────
export function CombatView({ enemy, player, onEnd, onNailDamage, onNailHeal, onCellScratch, onGrattatoreConsumed, onCombo, onVariantRevealed }) {
  // Nome mostrato all'utente: usa il flavor (displayName) se presente, altrimenti
  // la specie. Le lookup stats/pool/sprite restano su enemy.name (la specie).
  const enemyLabel = enemy.displayName || enemy.name;
  // Stato dell'unghia attiva (selezionata nella sidebar) — serve per bloccare
  // la grattata quando è morta e avvisare di sceglierne una sana.
  const activeNailState = player.nails?.[player.activeNail]?.state ?? "sana";
  const [deadNailWarn, setDeadNailWarn] = useState(false);
  // Timer in un ref: come proprietà della funzione (ricreata a ogni render)
  // il clearTimeout non trovava mai il timer precedente.
  const deadNailTimer = useRef(null);
  const warnDeadNail = () => {
    setDeadNailWarn(true);
    clearTimeout(deadNailTimer.current);
    deadNailTimer.current = setTimeout(() => setDeadNailWarn(false), 2000);
  };
  const grEffect = player.equippedGrattatore?.effect;
  const guaranteedParryLeftRef = useRef(grEffect === "guaranteedParry"); // 1 sola volta a fight
  // Fascia da Polso (grattatore) + Maneki Neko (reliquia, "+10% vincita su TUTTE le carte"
  // → qui si traduce in zona PERFETTO più larga) si sommano.
  const perfectWiden = (grEffect === "widePerfect" ? (player.equippedGrattatore.value || 0.06) : 0)
    + (hasRelic(player, "globalWinBoost") ? 0.04 : 0);
  // Occhio di Tigre: primo colpo subito in QUESTO combattimento completamente assorbito.
  const tigerShieldLeftRef = useRef(hasRelic(player, "firstHitShield"));
  // ELITE: nodi ★ — non solo loot ×2 (in handleCombatEnd) ma anche fight più
  // dura. Scala HP/scudo e aggiunge +1 step ai colpi nemici (isEliteFight sotto).
  const isEliteFight = !!enemy.isElite;
  const baseStats = ENEMY_STATS[enemy.name] || DEFAULT_ENEMY_STATS;
  const stats = isEliteFight
    ? { hp: Math.round(baseStats.hp * 1.4), shieldPerDef: Math.round(baseStats.shieldPerDef * 1.3) }
    : baseStats;

  const [enemyMaxHp] = useState(stats.hp);
  const [enemyHp, setEnemyHp] = useState(stats.hp);
  const [enemyShield, setEnemyShield] = useState(0);

  const [phase, setPhase] = useState("intro"); // intro | player | turnEnd | win
  const [turn, setTurn] = useState(1);
  const [hand, setHand] = useState([]); // 3 carte grattabili del player
  const [revealedIdxs, setRevealedIdxs] = useState([]); // indici già grattati
  const [loot, setLoot] = useState(0); // € bottino accumulato
  const [log, setLog] = useState([]); // [{text, color}]
  const [enemyPlan, setEnemyPlan] = useState([]); // carte nemico del turno
  const [enemyHitFlash, setEnemyHitFlash] = useState(0);
  // Colpo PERFETTO: payoff visivo dedicato (flash bianco + scatto di scala sullo
  // sprite). Prima il minigioco di tempismo meglio riuscito produceva solo testo
  // e lo stesso nudge di 4px del colpo normale.
  const [perfectHit, setPerfectHit] = useState(0); // 0 | id incrementale (per riavviare l'animazione)
  const perfectId = useRef(0);
  const [painFlash, setPainFlash] = useState(0);
  const [activeTiming, setActiveTiming] = useState(null); // {mode, onResult} minigioco tempismo
  const [currentExchange, setCurrentExchange] = useState(-1); // scambio in corso (per telegrafo)
  const [busy, setBusy] = useState(false); // uno scambio è in risoluzione → blocca la grattata delle altre carte
  const [coins, setCoins] = useState([]); // monete che volano
  const [floaters, setFloaters] = useState([]); // numeri/testi fluttuanti {id, text, color, zone, big, dx, dy}
  const [shake, setShake] = useState(null); // null | "light" | "heavy" — screen shake su danno subìto
  const coinId = useRef(0);
  const floaterId = useRef(0);
  const logScrollRef = useRef(null);
  const dead = useRef(false);

  // Sconfitta = 0 unghie vive, coerente col parent (che va in gameOver).
  // Le unghie arrivano aggiornate dal parent DOPO onNailDamage: il vecchio
  // checkDefeat() leggeva le props del render precedente e non vedeva mai
  // il colpo appena subito.
  const aliveNails = player.nails.filter(n => n.state !== "morta").length;
  useEffect(() => { if (aliveNails <= 0) dead.current = true; }, [aliveNails]);

  // Refs per applicazione LIVE degli effetti (accumulo sincrono, poi mirror in state)
  const hpRef = useRef(stats.hp);
  const shieldRef = useRef(0);
  const lootRef = useRef(0);
  const pendingParryRef = useRef(false); // true se il player ha giocato Scudo/Schiva (parata a tempo)
  const pendingGuardRef = useRef(false); // true se il player ha giocato Fortezza (blocco garantito, no minigioco)
  const atkDmgRef = useRef(0);     // danno d'attacco cumulato (per combo)
  const playedRef = useRef([]);    // indici giocati questo turno
  const turnLogRef = useRef([]);   // log del turno (cresce live)
  const resolvingRef = useRef(false);

  // ── Deal: inizio turno, pesca 9 carte (griglia 3x3) + prepara il piano nemico ──
  // Come l'originale: gratti 3 delle 9 carte; quelle 3 sono le mosse giocate.
  const dealTurn = () => {
    // Lo scudo nemico vale per il turno in cui viene giocato. Accumulandosi da un
    // turno all'altro (+16/+26 a carta DIFESA) i duelli coi boss andavano in
    // stallo: il Romanaccio arrivava a 83 di scudo al turno 17 e dal boss non si
    // può scappare, quindi la run restava bloccata.
    shieldRef.current = 0; setEnemyShield(0);
    setHand(generateCombatHand(9));
    playedRef.current = [];
    setRevealedIdxs([]);
    pendingParryRef.current = false; pendingGuardRef.current = false; atkDmgRef.current = 0;
    turnLogRef.current = []; setLog([]);
    resolvingRef.current = false; setBusy(false);
    setCurrentExchange(-1);
    const plan = generateCombatCard(false, enemy.name).cells;
    setEnemyPlan(plan);
  };

  const startCombat = () => { setPhase("player"); dealTurn(); };

  // ── Reveal di una carta = uno SCAMBIO: player agisce, poi il nemico risponde ──
  const onCellRevealed = (idx) => {
    if (phase !== "player" || resolvingRef.current || dead.current || hpRef.current <= 0) return;
    if (playedRef.current.includes(idx) || playedRef.current.length >= 3) return;
    const exchangeIdx = playedRef.current.length; // 0,1,2
    const isLast = exchangeIdx >= 2;
    playedRef.current = [...playedRef.current, idx];
    setRevealedIdxs([...playedRef.current]);
    setCurrentExchange(exchangeIdx);
    resolvingRef.current = true; setBusy(true); // blocca lo scratch delle altre carte durante lo scambio
    pendingParryRef.current = false; pendingGuardRef.current = false; // difesa di QUESTO scambio
    onCellScratch?.(false);
    const cell = hand[idx];
    if (!cell) { resolvingRef.current = false; setBusy(false); return; }
    if (cell.variant && onVariantRevealed) onVariantRevealed(cell.variant);

    const r = resolvePlayerCell(cell);
    const isAttack = cell.category === "COMBATTIMENTO" && r.dmg > 0;

    // Effetti non-danno della carta si applicano subito
    applyPlayerImmediate(cell, r);

    if (isAttack) {
      // Minigioco di tempismo: colpisci al momento giusto
      setActiveTiming({
        mode: "attack",
        onResult: (quality) => {
          setActiveTiming(null);
          applyAttackDamage(cell, r, quality);
          proceedToEnemy(exchangeIdx, isLast);
        },
        perfectWiden,
      });
    } else {
      // Nessun attacco da temporizzare → passa direttamente al nemico
      setTimeout(() => proceedToEnemy(exchangeIdx, isLast), 450);
    }
  };

  // Danno d'attacco modulato dal tempismo
  const applyAttackDamage = (cell, r, quality) => {
    const mult = quality === "perfect" ? 1.4 : quality === "good" ? 1.0 : 0.5;
    let dmg = Math.max(1, Math.round(r.dmg * mult));
    // Coltello Affilato: +50% sulla PROSSIMA carta ATTACCO grattata, poi si consuma.
    if (player.equippedGrattatore?.effect === "atkBoost") {
      const boosted = Math.round(dmg * (1 + (player.equippedGrattatore.value || 0.5)));
      pushLog(`🔪 Coltello Affilato! ${dmg}→${boosted} danni`, C.magenta);
      dmg = boosted;
      onGrattatoreConsumed?.();
    }
    atkDmgRef.current += dmg;
    const isPerfect = quality === "perfect";
    if (isPerfect) {
      pushLog(`⚔️ ${cell.name}: COLPO PERFETTO! ${dmg} danni (×1.4)`, C.green);
      AudioEngine.perfectHit?.();
      spawnFloater("PERFETTO!", C.green, "enemy", true);
      // Payoff dedicato: flash bianco + scatto di scala sullo sprite nemico.
      // (Il vecchio setEnemyHitFlash(1.4) veniva comunque sovrascritto da
      // dealDamage con 1, quindi a schermo il perfetto era indistinguibile.)
      perfectId.current += 1;
      setPerfectHit(perfectId.current);
      setTimeout(() => setPerfectHit(0), 620);
    } else if (quality === "good") pushLog(`⚔️ ${cell.name}: ${dmg} danni`, C.gold);
    else pushLog(`⚔️ ${cell.name}: colpo maldestro, solo ${dmg} danni`, C.dim);
    flyCoins(2);
    dealDamage(dmg, isPerfect);
  };

  // Dopo l'azione del player, il nemico risponde per questo scambio
  const proceedToEnemy = (exchangeIdx, isLast) => {
    // Combo: se le 3 carte giocate sono tutte attacchi → bonus
    if (isLast) {
      const played = playedRef.current.map(i => hand[i]).filter(Boolean);
      if (played.length === 3 && played.every(c => c.category === "COMBATTIMENTO") && atkDmgRef.current > 0) {
        const bonus = Math.round(atkDmgRef.current * 0.25);
        pushLog(`🔥 COMBO ATTACCO! +${bonus} danni!`, C.magenta);
        onCombo?.();
        dealDamage(bonus, true);
      }
    }
    if (hpRef.current <= 0) { winNow(); return; }

    const ec = enemyPlan[exchangeIdx];
    const isEnemyAttack = ec && ec.category === "COMBATTIMENTO";
    if (isEnemyAttack) {
      // FORTEZZA: blocco garantito, a prescindere dal tempismo (nessun minigioco).
      if (pendingGuardRef.current) {
        pushLog(`${enemyLabel} 🗡 ${ec.name}: 🏰 FORTEZZA blocca tutto — nessun danno!`, C.blue);
        setTimeout(() => finishExchange(exchangeIdx, isLast), 450);
        return;
      }
      // Guanto di Ferro: la prima parata della fight è automaticamente PERFETTA
      // (richiede comunque una carta Scudo/Schiva per attivare la parata).
      if (pendingParryRef.current && guaranteedParryLeftRef.current) {
        guaranteedParryLeftRef.current = false;
        pushLog(`🧤 Guanto di Ferro! ${ec.name}: PARATA PERFETTA garantita`, C.magenta);
        onGrattatoreConsumed?.();
        applyEnemyAttack(ec, "perfect");
        setTimeout(() => finishExchange(exchangeIdx, isLast), 550);
        return;
      }
      // La PARATA (minigioco) parte SOLO se hai giocato Scudo/Schiva in questo scambio.
      if (pendingParryRef.current) {
        setActiveTiming({
          mode: "parry",
          onResult: (quality) => {
            setActiveTiming(null);
            applyEnemyAttack(ec, quality);
            finishExchange(exchangeIdx, isLast);
          },
          perfectWiden,
        });
      } else {
        // Nessuna difesa giocata → l'attacco colpisce pieno, senza minigioco.
        applyEnemyAttack(ec, "miss");
        setTimeout(() => finishExchange(exchangeIdx, isLast), 550);
      }
    } else {
      // Difesa/cura nemico
      if (ec) applyEnemyNonAttack(ec);
      setTimeout(() => finishExchange(exchangeIdx, isLast), 450);
    }
  };

  const applyEnemyNonAttack = (c) => {
    if (c.category === "DIFESA") {
      shieldRef.current += stats.shieldPerDef; setEnemyShield(shieldRef.current);
      pushLog(`${enemyLabel} 🛡 ${c.name}: +${stats.shieldPerDef} scudo`, C.blue);
    } else if (c.category === "DENARO") {
      if (turn >= FURY_TURN) {
        // FURIA: troppo agitato per curarsi — colpo a vuoto, puoi bruciarlo
        pushLog(`${enemyLabel} 🔥 ${c.name}: troppo furioso per curarsi!`, C.red);
      } else {
        const healAmt = Math.round((c.value || 20) * 0.35);
        hpRef.current = Math.min(enemyMaxHp, hpRef.current + healAmt); setEnemyHp(hpRef.current);
        pushLog(`${enemyLabel} 💰 ${c.name}: si cura +${healAmt} HP`, C.orange);
      }
    } else {
      // attacco bloccato da carta scudo del player
      pushLog(`${enemyLabel} 🗡 ${c.name}: 🛡 BLOCCATO dallo scudo!`, C.blue);
    }
  };

  // Attacco nemico risolto dal tempismo di parata
  const applyEnemyAttack = (c, quality) => {
    const heavy = c.effect === "damageNail" || c.effect === "killNail" || c.effect === "damage";
    const stealsMoney = c.effect === "stealMoney" || c.effect === "steal";
    const fury = Math.max(0, turn - FURY_TURN + 1); // 0 fino al turno soglia, poi cresce
    const eliteStep = isEliteFight ? 1 : 0;         // elite: colpi più duri
    const baseSteps = (heavy ? 2 : 1) + fury + eliteStep; // FURIA: attacchi sempre più pesanti
    const stealVal = (c.value || 15) + fury * 10;

    if (quality === "perfect") {
      // Annulla il danno + contrattacco
      pushLog(`${enemyLabel} 🗡 ${c.name}: 🛡 PARATA PERFETTA! Nessun danno`, C.green);
      AudioEngine.parry?.();
      spawnFloater("PARATA!", C.blue, "player", true);
      const counter = 14;
      pushLog(`↩️ Contrattacco! ${counter} danni a ${enemyLabel}`, C.cyan);
      dealDamage(counter);
      if (hpRef.current <= 0) { winNow(); return; }
      return;
    }
    if (quality === "good") {
      if (stealsMoney) {
        const v = Math.round(stealVal * 0.5);
        lootRef.current = Math.max(0, lootRef.current - v); setLoot(lootRef.current);
        pushLog(`${enemyLabel} 🗡 ${c.name}: parata parziale — ti ruba solo €${v}`, C.gold);
        spawnFloater(`−€${v}`, C.orange, "loot");
      } else if (tigerShieldLeftRef.current) {
        // Occhio di Tigre: primo colpo del combattimento assorbito gratis.
        tigerShieldLeftRef.current = false;
        pushLog(`🐯 Occhio di Tigre! ${c.name} assorbito — nessun danno`, C.orange);
        spawnFloater("ASSORBITO!", C.orange, "player", true);
      } else {
        onNailDamage?.(1);
        AudioEngine.nailCrack?.();
        setPainFlash(0.3); setTimeout(() => setPainFlash(0), 350);
        triggerShake("light"); // anche il colpo attutito si sente addosso
        spawnFloater("−1", C.orange, "player");
        pushLog(`${enemyLabel} 🗡 ${c.name}: parata parziale — 1 danno`, C.gold);
      }
      return;
    }
    // miss → danno pieno
    if (stealsMoney) {
      lootRef.current = Math.max(0, lootRef.current - stealVal); setLoot(lootRef.current);
      pushLog(`${enemyLabel} 🗡 ${c.name}: ti ruba €${stealVal}!`, C.red);
      spawnFloater(`−€${stealVal}`, C.red, "loot");
    } else if (tigerShieldLeftRef.current) {
      // Occhio di Tigre: primo colpo del combattimento assorbito gratis.
      tigerShieldLeftRef.current = false;
      pushLog(`🐯 Occhio di Tigre! ${c.name}: colpo assorbito — nessun danno`, C.orange);
      spawnFloater("ASSORBITO!", C.orange, "player", true);
    } else {
      onNailDamage?.(baseSteps);
      setPainFlash(0.5); setTimeout(() => setPainFlash(0.2), 150); setTimeout(() => setPainFlash(0), 500);
      AudioEngine.painScream?.();
      // Scossa proporzionata: piena solo per i colpi pesanti (2+ unghie),
      // leggera per il colpo secco da 1 — prima era tutto o niente.
      triggerShake(baseSteps >= 2 ? "heavy" : "light");
      spawnFloater(`−${baseSteps}💢`, C.red, "player", true);
      pushLog(`${enemyLabel} 🗡 ${c.name}: COLPITO! ${baseSteps} danno alle unghie`, C.red);
    }
  };

  const finishExchange = (exchangeIdx, isLast) => {
    // Nemico già al tappeto (contrattacco della parata perfetta): la vittoria è
    // in arrivo. Prima lo scambio proseguiva: si potevano grattare altre carte,
    // le carte nemico extra colpivano ancora e col Guanto di Ferro il turnEnd
    // arrivava dopo la vittoria e la sovrascriveva.
    if (hpRef.current <= 0) return;
    if (dead.current) { setPhase("turnEnd"); return; }
    if (isLast) {
      // Carte nemico extra (es. 4a del Napoletano) si risolvono senza parata
      for (let k = 3; k < enemyPlan.length; k++) {
        const ec = enemyPlan[k];
        if (ec.category === "COMBATTIMENTO") applyEnemyAttack(ec, "miss");
        else applyEnemyNonAttack(ec);
      }
      setTimeout(() => setPhase("turnEnd"), 400);
    } else {
      // Avanza l'evidenziazione allo scambio SUCCESSIVO (quello ancora da grattare),
      // così il player sa cosa arriva. Lo scambio appena risolto diventa ✓ fatto.
      setCurrentExchange(-1);
      resolvingRef.current = false; setBusy(false); // sblocca lo scratch per la prossima carta
    }
  };

  const flyCoins = (n) => {
    const batch = Array.from({ length: Math.min(8, Math.max(1, n)) }, () => ({
      id: coinId.current++,
      dx: (Math.random() - 0.5) * 120,
      dy: -40 - Math.random() * 80,
      rot: (Math.random() - 0.5) * 180,
    }));
    setCoins(prev => [...prev, ...batch]);
    setTimeout(() => setCoins(prev => prev.filter(c => !batch.find(b => b.id === c.id))), 1100);
  };

  // Testo/numero fluttuante ancorato a una zona: "enemy" | "player" | "loot"
  // Più floater possono nascere nello stesso istante e sulla stessa zona (es.
  // "PERFETTO!" + il numero di danno): senza scarto si sovrapponevano pixel su
  // pixel e ne restava leggibile uno solo.
  const spawnFloater = (text, color, zone = "enemy", big = false) => {
    const id = floaterId.current++;
    setFloaters(prev => {
      const sameZone = prev.filter(f => f.zone === zone).length;
      return [...prev, {
        id, text, color, zone, big,
        dx: (id % 2 ? 1 : -1) * (10 + sameZone * 16),
        dy: sameZone * 20,
      }];
    });
    setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 1100);
  };
  // "heavy" = colpo pesante / FURIA (screenShake pieno). "light" = colpo subìto
  // normale: prima non scuoteva affatto, ora c'è una scossa breve e contenuta.
  const triggerShake = (intensity = "heavy") => {
    setShake(intensity);
    setTimeout(() => setShake(null), intensity === "heavy" ? 380 : 240);
  };

  // Aggiunge una riga al log del turno (mostrato live in turnEnd)
  const pushLog = (text, color = C.dim) => {
    turnLogRef.current = [...turnLogRef.current, { text, color }];
    setLog(turnLogRef.current);
  };

  // Applica danno all'HP nemico (scudo prima, poi HP). Aggiorna gli state per il render.
  // `big` alza il numero fluttuante a taglia "critica" (colpo perfetto / combo).
  const dealDamage = (d, big = false) => {
    let remaining = d;
    if (shieldRef.current > 0) {
      const absorbed = Math.min(shieldRef.current, remaining);
      shieldRef.current -= absorbed; remaining -= absorbed;
      setEnemyShield(shieldRef.current);
      if (absorbed > 0) {
        pushLog(`🛡 Scudo nemico assorbe ${absorbed}`, C.blue);
        // Anche il danno mangiato dallo scudo ha un suo numero: senza, il colpo
        // sembrava semplicemente non essere avvenuto.
        spawnFloater(`🛡 ${absorbed}`, C.blue, "enemy");
      }
    }
    if (remaining > 0) {
      hpRef.current = Math.max(0, hpRef.current - remaining);
      setEnemyHp(hpRef.current);
      AudioEngine.hitEnemy?.(); // suono impatto
      setEnemyHitFlash(1); setTimeout(() => setEnemyHitFlash(0), 350);
      // Numero di danno rosso che sale e sfuma sul nemico — stesso pattern dei
      // floater di oro/cura; la barra HP da sola (transition 0.4s) non bastava.
      spawnFloater(`−${remaining}`, big ? "#ffffff" : C.red, "enemy", big);
    }
  };

  // Applica gli effetti NON-danno di una carta player (bottino/cura/difesa/self).
  // Il danno d'attacco è gestito a parte da applyAttackDamage (dopo il minigioco).
  const applyPlayerImmediate = (c, r) => {
    const damaged = player.nails.some(isDamagedNail);
    if (r.loot) {
      lootRef.current = Math.max(0, lootRef.current + r.loot);
      setLoot(lootRef.current);
      if (r.loot > 0) { flyCoins(Math.ceil(r.loot / 6)); AudioEngine.cash?.(); spawnFloater(`+€${r.loot}`, C.gold, "loot"); }
      else { spawnFloater(`−€${Math.abs(r.loot)}`, C.red, "loot"); }
    }
    if (r.heals) {
      if (c.effect === "adrenaline" && !damaged) {
        lootRef.current += (r.altLoot || 0); setLoot(lootRef.current);
        if (r.altLoot) { flyCoins(Math.ceil(r.altLoot / 6)); AudioEngine.cash?.(); spawnFloater(`+€${r.altLoot}`, C.gold, "loot"); }
      } else {
        onNailHeal?.(r.heals);
        AudioEngine.heal?.(); spawnFloater(`+${r.heals}💚`, C.green, "player");
      }
    }
    // Scudo/Schivata → parata a tempo; Fortezza → blocco garantito (no minigioco)
    if (r.block || r.dodge) pendingParryRef.current = true;
    if (r.guard) pendingGuardRef.current = true;
    if (r.enemyShield) { shieldRef.current += r.enemyShield; setEnemyShield(shieldRef.current); }
    if (r.self) { onNailDamage?.(r.self); setPainFlash(0.35); setTimeout(() => setPainFlash(0), 400); triggerShake("light"); }
    pushLog(r.log, CAT_COLORS[c.category] || C.dim);
  };

  const winNow = () => {
    setActiveTiming(null);
    pushLog(`💥 ${enemyLabel} è al tappeto!`, C.green);
    AudioEngine.win?.();
    setTimeout(() => setPhase("win"), 600);
  };

  const nextTurn = () => {
    if (dead.current) return;
    setTurn(t => t + 1);
    setPhase("player");
    dealTurn();
  };

  const finishWin = () => {
    onEnd({
      won: true,
      playerMoney: loot,
      nailHeals: 0,    // già applicate live via onNailHeal (mantenuto: letto in handleCombatEnd)
      winNail: true,
    });
  };

  useEffect(() => {
    if (logScrollRef.current) logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
  }, [log, phase]);

  // FURIA: suono drammatico quando il nemico entra in enrage
  useEffect(() => {
    if (turn === FURY_TURN) { AudioEngine.bossEntrance?.(); triggerShake(); }
  }, [turn]);

  const inFury = turn >= FURY_TURN;

  // Spacebar: prosegui fasi
  const spaceRef = useRef(null);
  spaceRef.current = () => {
    if (phase === "intro") startCombat();
    else if (phase === "turnEnd") nextTurn();
    else if (phase === "win") finishWin();
  };
  useEffect(() => {
    const onKey = (e) => { if (e.code !== "Space") return; e.preventDefault(); spaceRef.current?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hpPct = Math.max(0, Math.round((enemyHp / enemyMaxHp) * 100));

  // Floater per zona (ancoraggi in % nel container combat)
  const FLOATER_ANCHOR = {
    enemy: { left: "50%", top: "20%" },
    loot: { left: "88%", top: "24%" },
    player: { left: "16%", top: "24%" },
  };

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div style={{
      width:"min(640px, calc(100vw - 32px))",
      height:"min(360px, calc((100vw - 32px) * .5625))",
      margin:"0 auto", flex:"0 0 auto", overflow:"visible",
    }}>
    <div style={{
      position: "relative", flex: "0 0 auto", width: "640px", height: "360px",
      margin: "0 auto", fontFamily: FONT, color: "#fff0d6", overflow: "hidden",
      transformOrigin:"top left", transform:"scale(min(1, calc((100vw - 32px) / 640px)))",
      border: "4px solid #fff0d6", outline: "2px solid #ff4b45", outlineOffset: "3px",
      background: "#100a19", boxShadow: "0 0 0 6px #ffd02e, 10px 10px 0 #000",
      animation: shake === "heavy" ? "screenShake 0.38s"
        : shake === "light" ? "screenShakeLight 0.24s"
        : "none",
    }}>
      {painFlash > 0 && (
        <div style={{ position: "absolute", inset: 0, background: `rgba(255,0,0,${painFlash})`, pointerEvents: "none", zIndex: 50, transition: "background 0.1s" }} />
      )}
      {floaters.map(f => {
        const a = FLOATER_ANCHOR[f.zone] || FLOATER_ANCHOR.enemy;
        return (
          <div key={f.id} style={{
            position: "absolute",
            left: `calc(${a.left} + ${f.dx || 0}px)`, top: `calc(${a.top} + ${f.dy || 0}px)`,
            zIndex: 55,
            pointerEvents: "none", whiteSpace: "nowrap",
            color: f.color, fontWeight: "bold",
            fontSize: f.big ? "26px" : "17px",
            textShadow: "2px 2px 0 #000",
            animation: "combatFloat 1.1s ease-out forwards",
          }}>{f.text}</div>
        );
      })}

      {/* Strip nemico: 624×64, grammatica del pilot approvato. */}
      <div style={{
        position:"absolute", left:8, top:8, width:624, height:64,
        display:"grid", gridTemplateColumns:"56px 1fr", gap:8,
        border:`2px solid ${perfectHit ? "#fff" : "#ff4b45"}`, background:"#1c1028",
        boxShadow:"4px 4px 0 #09050e", padding:4,
        transform: enemyHitFlash ? "translateX(4px)" : "none",
        transition:"transform .1s", zIndex:2,
      }}>
        <div style={{
          width:52, height:52, background:"#09050e", border:"2px solid #fff0d6",
          overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", position:"relative",
        }}>
          {hasAsset(`spr-${enemySpriteKey(enemy)}`) ? (
            <Asset id={`spr-${enemySpriteKey(enemy)}`} size={48}
              style={{width:48, height:48, objectFit:"contain", display:"block", imageRendering:"pixelated",
                animation: perfectHit ? "perfectHitFlash 0.6s ease-out" : "none"}} />
          ) : (
            <pre style={{
              margin:0, textAlign:"center", color:"#ff4b45", fontFamily:FONT,
              fontSize:"4px", lineHeight:1, whiteSpace:"pre",
            }}>
              {(SPR_BIG[enemySpriteKey(enemy)] || SPR_BIG.miniboss).join("\n")}
            </pre>
          )}
        </div>
        <div style={{minWidth:0, padding:"0 4px 0 0"}}>
          <div style={{height:18, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
            <span style={{color:"#ff4b45", fontSize:15, letterSpacing:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
              {enemy.isBoss ? "♛ " : ""}{enemyLabel.toUpperCase()}
            </span>
            {inFury && (
              <span style={{flexShrink:0, fontSize:11, padding:"1px 6px", color:"#09050e", background:"#ff4b45"}}>FURIA {turn}</span>
            )}
          </div>
          <div style={{height:16, display:"grid", gridTemplateColumns:"18px 1fr 48px", alignItems:"center", gap:5, color:"#9e80ad", fontSize:11}}>
            <span>HP</span>
            <div style={{height:8, border:"2px solid #fff0d6", background:"#09050e"}}>
              <div style={{width:`${hpPct}%`, height:"100%", background:"#ff4b45", transition:"width 80ms steps(2,end)"}} />
            </div>
            <b style={{color:"#fff0d6", fontWeight:400, textAlign:"right"}}>{enemyHp}/{enemyMaxHp}</b>
          </div>
          <div style={{height:18, display:"flex", alignItems:"center", gap:5, color:"#9e80ad", fontSize:10}}>
            <span>IN ARRIVO</span>
            {enemyPlan.slice(0,3).map((ec,i) => {
              const col=ec.category==="COMBATTIMENTO"?"#ff4b45":ec.category==="DIFESA"?"#3eb9ff":"#ffd02e";
              const lb=ec.category==="COMBATTIMENTO"?"BOTTA":ec.category==="DIFESA"?"SCUDO":"FURTO";
              const activeEx=currentExchange>=0?currentExchange:revealedIdxs.length;
              return <span key={i} style={{padding:"1px 4px", border:`${i===activeEx?2:1}px solid ${i===activeEx?col:"#654275"}`, color:i<activeEx?"#654275":col}}>{i<activeEx?"✓ ":""}{lb}</span>;
            })}
            <span style={{marginLeft:"auto", color:"#3eb9ff"}}>SC {enemyShield}</span>
          </div>
        </div>
      </div>

      {/* Corpo fisso 448 + 168. */}
      <div style={{position:"absolute", left:8, top:80, width:624, height:224, display:"grid", gridTemplateColumns:"448px 168px", gap:8}}>
        <div style={{position:"relative", overflow:"hidden"}}>
          {phase === "player" && (
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,144px)", gridTemplateRows:"repeat(3,69px)", gap:8}}>
              {hand.map((cell,i) => {
                const isRevealed=revealedIdxs.includes(i);
                const locked=(revealedIdxs.length>=3||busy)&&!isRevealed;
                return <CombatCardScratch key={`${turn}-${i}`} cell={cell} catColors={CAT_COLORS}
                  onRevealed={()=>onCellRevealed(i)} disabled={locked} nailState={activeNailState} onDeadAttempt={warnDeadNail}/>;
              })}
            </div>
          )}
          {phase === "intro" && (
            <div style={{height:"100%", display:"grid", placeItems:"center", border:"2px solid #fff0d6", background:"#1c1028", textAlign:"center", padding:16}}>
              <div><div style={{color:"#ff4b45", fontSize:22, letterSpacing:2}}>{enemyLabel.toUpperCase()} TI SFIDA</div>
                <p style={{color:"#9e80ad", fontSize:11, lineHeight:1.4, maxWidth:380}}>Gratta 3 biglietti su 9. BOTTA infligge danno, PARATA prepara la difesa, PREMIO aumenta il bottino. Dal turno {FURY_TURN} il nemico entra in FURIA.</p>
                <Btn variant="danger" onClick={startCombat} style={{fontSize:14, padding:"6px 20px", borderRadius:0, boxShadow:"4px 4px 0 #09050e"}}>COMBATTI</Btn></div>
            </div>
          )}
          {(phase === "turnEnd" || phase === "win") && (
            <div ref={logScrollRef} style={{height:"100%", overflowY:"auto", border:"2px solid #fff0d6", background:"#1c1028", padding:10, fontSize:12}}>
              {phase === "win" && <div style={{color:"#ffd02e", fontSize:20, letterSpacing:2, marginBottom:8}}>HAI VINTO · €{loot}</div>}
              {log.map((l,i)=><div key={i} style={{color:l.color}}>{l.text}</div>)}
            </div>
          )}
          {deadNailWarn && <div style={{position:"absolute", left:8, right:8, bottom:8, padding:5, zIndex:8, border:"2px solid #ff4b45", background:"#09050e", color:"#ff4b45", textAlign:"center", fontSize:11, animation:ANIM.pulseUrgent}}>UNGHIA MORTA · SCEGLINE UNA SANA</div>}
        </div>

        {/* Scontrino laterale persistente. */}
        <aside style={{border:"2px solid #fff0d6", background:"#1c1028", boxShadow:"4px 4px 0 #09050e", overflow:"hidden"}}>
          <div style={{height:22, padding:"3px 7px", background:"#fff0d6", color:"#09050e", fontSize:15, letterSpacing:2}}>SCONTRINO</div>
          <div style={{padding:"6px 7px", fontSize:11}}>
            {[["TURNO",turn],["GRATTATI",`${revealedIdxs.length}/3`],["BOTTINO",`€${loot}`],["SCUDO",enemyShield]].map(([k,v])=><div key={k} style={{display:"flex", justifyContent:"space-between", borderBottom:"1px dashed #654275"}}><span style={{color:"#9e80ad"}}>{k}</span><span style={{color:"#ffd02e"}}>{v}</span></div>)}
          </div>
          <div ref={logScrollRef} style={{height:82, margin:"4px 7px", padding:6, overflowY:"auto", borderLeft:"4px solid #ff4b45", background:"#2b1431", color:"#fff0d6", fontSize:10, lineHeight:1.15}}>
            {log.length ? log.slice(-5).map((l,i)=><div key={i} style={{color:l.color}}>{l.text}</div>) : "Scegli con l'occhio. Gratta con l'unghia."}
          </div>
          <div style={{display:"grid", gap:3, padding:"2px 7px", color:"#9e80ad", fontSize:9}}>
            <span style={{color:"#ff4b45"}}>▲ BOTTA</span><span style={{color:"#3eb9ff"}}>◆ PARATA</span><span style={{color:"#ffd02e"}}>€ PREMIO</span>
          </div>
        </aside>
      </div>

      {/* Footer unghie del pilot, senza mano aggiuntiva. */}
      <footer style={{position:"absolute", left:8, bottom:8, width:624, height:40, display:"flex", alignItems:"center", gap:6, padding:"4px 6px", border:"2px solid #fff0d6", background:"#2b1431", boxShadow:"4px 4px 0 #09050e"}}>
        <span style={{width:54, color:"#fff0d6", fontSize:10, textAlign:"center"}}>UNGHIE</span>
        <NailDisplay nails={player.nails} activeNail={player.activeNail} />
        <span style={{marginLeft:"auto", color:"#ffd02e", fontSize:10}}>GRATTA 3 BIGLIETTI</span>
        {coins.map(c=><span key={c.id} style={{position:"absolute", right:120, top:0, animation:"coinFly 1s ease-out forwards", "--dx":`${c.dx}px`, "--dy":`${c.dy}px`, "--rot":`${c.rot}deg`, pointerEvents:"none"}}>€</span>)}
        {phase === "turnEnd" && <Btn onClick={nextTurn} style={{width:132, height:28, padding:0, borderRadius:0, border:"2px solid #ffd02e", background:"#ffd02e", color:"#09050e", boxShadow:"none"}}>PROSSIMO TURNO</Btn>}
        {phase === "win" && <Btn variant="success" onClick={finishWin} style={{width:132, height:28, padding:0, borderRadius:0, border:"2px solid #ffd02e", boxShadow:"none"}}>INCASSA €{loot}</Btn>}
        {(phase === "intro" || phase === "player") && <div style={{width:132, height:28, display:"grid", placeItems:"center", border:"2px solid #654275", background:"#09050e", color:"#9e80ad", fontSize:10}}>{phase === "intro" ? "PRONTO?" : `${revealedIdxs.length}/3 GRATTATI`}</div>}
      </footer>

      {activeTiming && (
        <TimingBar
          mode={activeTiming.mode}
          speed={enemy.isBoss ? 1.75 : 1.45}
          onResult={activeTiming.onResult}
          perfectWiden={activeTiming.perfectWiden || 0}
        />
      )}
    </div>
    </div>
  );
}
