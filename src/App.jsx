import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const CARDS = [
  ["defense", "PARATA", "◆", "Pelle dura"], ["money", "PREMIO", "€", "Gettoni"],
  ["attack", "BOTTA", "▲", "Colpo secco"], ["money", "PREMIO", "€", "Mancia"],
  ["attack", "BOTTA", "▲", "Montante"], ["defense", "PARATA", "◆", "Fortezza"],
  ["attack", "BOTTA", "▲", "Sberla"], ["defense", "PARATA", "◆", "Schivata"],
  ["money", "PREMIO", "€", "Jackpot"],
];

let audioContext;

function getAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  audioContext ||= new AudioCtx();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function scratchSound(intensity = 0.4) {
  const audio = getAudio();
  if (!audio) return;
  const length = Math.floor(audio.sampleRate * 0.075);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < length; i += 1) {
    brown = brown * 0.82 + (Math.random() * 2 - 1) * 0.18;
    data[i] = brown * (1 - i / length);
  }
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  filter.type = "bandpass";
  filter.frequency.value = 950 + Math.random() * 500;
  filter.Q.value = 0.55;
  gain.gain.value = 0.045 * intensity;
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start();
}

function revealSound(type) {
  const audio = getAudio();
  if (!audio) return;
  const now = audio.currentTime;
  const notes = type === "money" ? [523, 659, 784] : type === "attack" ? [180, 120] : [330, 440];
  notes.forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.035, now + index * 0.055);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.055 + 0.09);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now + index * 0.055);
    oscillator.stop(now + index * 0.055 + 0.1);
  });
}

function PixelIcon({ type }) {
  return <span className={`pixel-icon pixel-icon--${type}`} aria-hidden="true" />;
}

function ScratchFoil({ type, label, symbol, onComplete }) {
  const canvasRef = useRef(null);
  const scratching = useRef(false);
  const completed = useRef(false);
  const lastSound = useRef(0);
  const moves = useRef(0);
  const previousPoint = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = 560;
    canvas.height = 200;
    ctx.scale(2, 2);
    ctx.fillStyle = "#b9b8ad";
    ctx.fillRect(0, 0, 280, 100);
    ctx.strokeStyle = "#8d8f8b";
    ctx.lineWidth = 2;
    for (let x = -100; x < 320; x += 12) {
      ctx.beginPath(); ctx.moveTo(x, 100); ctx.lineTo(x + 100, 0); ctx.stroke();
    }
    ctx.fillStyle = "#24282a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 42px monospace";
    ctx.fillText(symbol, 140, 43);
    ctx.font = "bold 17px monospace";
    ctx.fillText(label, 140, 78);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [label, symbol]);

  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    revealSound(type);
    onComplete();
  }, [onComplete, type]);

  const scratch = (event) => {
    if (!scratching.current || completed.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 54;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (previousPoint.current) ctx.moveTo(previousPoint.current.x, previousPoint.current.y);
    else ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 27, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    previousPoint.current = { x, y };
    moves.current += 1;
    const now = performance.now();
    if (now - lastSound.current > 58) {
      scratchSound(Math.min(1, 0.35 + moves.current / 35));
      lastSound.current = now;
    }
    if (moves.current % 8 === 0) {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0;
      for (let i = 3; i < pixels.length; i += 32) if (pixels[i] < 80) transparent += 1;
      if (transparent / (pixels.length / 32) > 0.42) finish();
    }
  };

  return <canvas ref={canvasRef} className="scratch-foil" aria-hidden="true"
    onPointerDown={(event) => { scratching.current = true; previousPoint.current = null; event.currentTarget.setPointerCapture(event.pointerId); scratch(event); }}
    onPointerMove={scratch} onPointerUp={() => { scratching.current = false; previousPoint.current = null; }}
    onPointerCancel={() => { scratching.current = false; previousPoint.current = null; }} />;
}

function CombatTicket({ card, index, revealed, locked, onReveal }) {
  const [type, label, symbol, title] = card;
  const reveal = useCallback(() => onReveal(index, type), [index, onReveal, type]);
  return <button className={`combat-ticket combat-ticket--${type} ${revealed ? "is-revealed" : ""}`}
    disabled={locked}
    onKeyDown={(event) => {
      if (!revealed && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); reveal(); }
    }}
    aria-label={`${label}: ${title}${revealed ? ", già grattato" : ", trascina per grattare"}`}>
    <span className="ticket-kicker">GRATTA E VINCI</span><span className="ticket-pattern" aria-hidden="true" />
    <span className="ticket-symbol">{symbol}</span><span className="ticket-label">{label}</span>
    <span className="ticket-title">{title}</span><span className="ticket-serial">GV3-{String(index + 1).padStart(2, "0")}</span>
    {!revealed && <ScratchFoil type={type} label={label} symbol={symbol} onComplete={reveal} />}
  </button>;
}

function TimingOverlay({ mode, onStop }) {
  return <div className="timing-overlay" role="dialog" aria-label={`Minigioco di ${mode === "attack" ? "attacco" : "parata"}`}>
    <div className="timing-window"><span className="timing-title">{mode === "attack" ? "COLPISCI" : "PARA"}</span>
      <div className="timing-track" aria-hidden="true"><span className="timing-good" /><span className="timing-perfect" /><span className="timing-cursor" /></div>
      <button onClick={onStop}>SPAZIO / TOCCA</button></div>
  </div>;
}

function CombatFrame() {
  const [revealed, setRevealed] = useState([]);
  const [turn, setTurn] = useState(3);
  const [timing, setTiming] = useState(null);
  const [message, setMessage] = useState("Il Borseggiatore prepara una coltellata.");
  const [loot, setLoot] = useState(24);
  const [enemyHp, setEnemyHp] = useState(74);
  const [activeNail, setActiveNail] = useState(1);
  const timingRef = useRef(null);

  const stopTiming = useCallback(() => {
    if (!timingRef.current) return;
    const mode = timingRef.current;
    setTiming(null); timingRef.current = null;
    if (mode === "attack") { setEnemyHp((hp) => Math.max(0, hp - 16)); setMessage("PERFETTO: 16 danni. Secco e soddisfacente."); }
    else setMessage("PARATA: danno annullato, contrattacco pronto.");
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.code === "Space" && timingRef.current) { event.preventDefault(); stopTiming(); } };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stopTiming]);

  const revealCard = useCallback((index, type) => {
    if (revealed.includes(index) || revealed.length >= 3 || timingRef.current) return;
    setRevealed((current) => [...current, index]);
    if (type === "money") { setLoot((value) => value + 7); setMessage("PREMIO: +€7. Il prossimo biglietto ti aspetta."); return; }
    const mode = type === "attack" ? "attack" : "defense";
    timingRef.current = mode; setTiming(mode);
    setMessage(type === "attack" ? "Ferma il cursore: zona bianca = perfetto." : "Difesa pronta: ferma il cursore per parare.");
  }, [revealed]);

  const finished = revealed.length === 3 && !timing;
  const intents = useMemo(() => ["attack", "money", "defense"], []);
  return <section className="game-frame" aria-label="Prototipo di combattimento Grattini">
    <div className="world-noise" aria-hidden="true" />
    <header className="enemy-strip"><div className="enemy-portrait" aria-label="Ritratto pixel del Borseggiatore"><span className="portrait-hat" /><span className="portrait-face" /><span className="portrait-eyes" /></div>
      <div className="enemy-copy"><div className="enemy-title-row"><span className="enemy-name">BORSEGGIATORE DI PORTA NUOVA</span><span className="fury-badge">FURIA 3</span></div>
        <div className="meter-line"><span>HP</span><span className="meter"><i style={{ width: `${enemyHp}%` }} /></span><b>{enemyHp}/100</b></div>
        <div className="intent-line"><span>IN ARRIVO</span>{intents.map((intent, index) => <span className={`intent intent--${intent} ${index === revealed.length ? "is-active" : ""}`} key={intent}><PixelIcon type={intent} /> {intent === "attack" ? "BOTTA" : intent === "money" ? "FURTO" : "SCUDO"}</span>)}</div></div>
    </header>
    <main className="combat-body"><div className="ticket-grid" aria-label="Griglia fissa tre per tre">{CARDS.map((card, index) => <CombatTicket card={card} index={index} key={index} revealed={revealed.includes(index)} locked={revealed.length >= 3 || Boolean(timing)} onReveal={revealCard} />)}</div>
      <aside className="combat-diary"><div className="diary-title">SCONTRINO</div><dl><div><dt>TURNO</dt><dd>{turn}</dd></div><div><dt>GRATTATI</dt><dd>{revealed.length}/3</dd></div><div><dt>BOTTINO</dt><dd>€{loot}</dd></div></dl>
        <div className="message-box" aria-live="polite">{message}</div><div className="legend"><span><PixelIcon type="attack" /> BOTTA</span><span><PixelIcon type="defense" /> PARATA</span><span><PixelIcon type="money" /> PREMIO</span></div></aside></main>
    <footer className="player-strip"><div className="pixel-hand" aria-hidden="true"><i className="pixel-hand__palm" />{[0,1,2,3,4].map((finger) => <i className={`pixel-hand__finger pixel-hand__finger--${finger + 1} ${activeNail === finger ? "is-active" : ""}`} key={finger} />)}</div><span className="player-label">UNGHIA {activeNail + 1}</span><div className="nails" aria-label="Seleziona una delle cinque unghie">{["hurt", "ok", "ok", "ok", "ok"].map((state, index) => <button type="button" aria-pressed={activeNail === index} aria-label={`Unghia ${index + 1}, ${state === "hurt" ? "sanguinante" : "sana"}`} onClick={() => setActiveNail(index)} className={`nail nail--${state} ${activeNail === index ? "is-active" : ""}`} key={index}>{index + 1}</button>)}</div>
      <span className="turn-rule">GRATTA 3 BIGLIETTI</span><button className="next-turn" disabled={!finished} onClick={() => { setRevealed([]); setTurn((value) => value + 1); setMessage("Nuovo turno. Scegli con l'occhio, gratta con l'unghia."); }}>{finished ? "PROSSIMO TURNO" : "GRATTA UN SIMBOLO"}</button></footer>
    {timing && <TimingOverlay mode={timing} onStop={stopTiming} />}
  </section>;
}

export function App() {
  return <div className="style-lab"><header className="lab-header"><div><p className="eyebrow">GRATTINI VISUAL SYSTEM · DIREZIONE APPROVATA</p><h1>Combat scratch pilot</h1><p className="lede">Il simbolo orienta. L'unghia decide. Il suono premia.</p></div><a href="https://github.com/brrucelean/grattini-v3" target="_blank" rel="noreferrer">REPOSITORY ↗</a></header>
    <section className="design-pillars" aria-label="Principi del prototipo"><span><b>01</b> SIMBOLI GRANDI</span><span><b>02</b> GRATTA DAVVERO</span><span><b>03</b> FEEDBACK ASMR</span></section>
    <div className="frame-scroll"><CombatFrame /></div>
    <section className="direction-note approved-note"><span>DIREZIONE BLOCCATA</span><div><h2>Tabacchi Terminale + stampa sporca</h2><p>Un solo linguaggio visivo per tutto il gioco. Carta, pixel e segnaletica leggibile.</p></div><p className="instructions">Trascina su una casella. Il simbolo resta grande anche sotto la patina.</p></section>
    <footer className="lab-footer"><span>FRAME LOGICO 640×360</span><span>GRIGLIA 8 PX</span><span>SUONO PROCEDURALE</span><span>MOUSE · TASTIERA · TOUCH</span></footer></div>;
}
