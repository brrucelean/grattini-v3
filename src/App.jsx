import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DIRECTIONS = [
  {
    id: "terminale",
    index: "A",
    name: "Tabacchi Terminale",
    note: "Il miglior equilibrio: DOS urbano, leggibilità e ticket commerciali.",
  },
  {
    id: "notturno",
    index: "B",
    name: "Notte in Sala Giochi",
    note: "Più casinò e insegne, con un mondo ancora disciplinato.",
  },
  {
    id: "registro",
    index: "C",
    name: "Stampa Fuori Registro",
    note: "Più carta, inchiostro e trash promozionale da edicola anni Novanta.",
  },
];

const CARD_BLUEPRINT = [
  ["defense", "PARATA", "◆", "Pelle dura"],
  ["money", "PREMIO", "€", "Gettoni"],
  ["attack", "BOTTA", "▲", "Colpo secco"],
  ["money", "PREMIO", "€", "Mancia"],
  ["attack", "BOTTA", "▲", "Montante"],
  ["defense", "PARATA", "◆", "Fortezza"],
  ["attack", "BOTTA", "▲", "Sberla"],
  ["defense", "PARATA", "◆", "Schivata"],
  ["money", "PREMIO", "€", "Jackpot"],
];

function PixelIcon({ type }) {
  return <span className={`pixel-icon pixel-icon--${type}`} aria-hidden="true" />;
}

function CombatTicket({ card, index, revealed, locked, onReveal }) {
  const [type, label, symbol, title] = card;
  return (
    <button
      className={`combat-ticket combat-ticket--${type} ${revealed ? "is-revealed" : ""}`}
      disabled={locked}
      onClick={() => onReveal(index, type)}
      aria-label={`${label}: ${title}${revealed ? ", già grattato" : ", gratta"}`}
    >
      <span className="ticket-kicker">GRATTA E VINCI</span>
      <span className="ticket-pattern" aria-hidden="true" />
      <span className="ticket-symbol">{revealed ? symbol : "?"}</span>
      <span className="ticket-label">{label}</span>
      <span className="ticket-title">{title}</span>
      <span className="ticket-serial">GV3-{String(index + 1).padStart(2, "0")}</span>
    </button>
  );
}

function TimingOverlay({ mode, onStop }) {
  return (
    <div className="timing-overlay" role="dialog" aria-label={`Minigioco di ${mode === "attack" ? "attacco" : "parata"}`}>
      <div className="timing-window">
        <span className="timing-title">{mode === "attack" ? "COLPISCI" : "PARA"}</span>
        <div className="timing-track" aria-hidden="true">
          <span className="timing-good" />
          <span className="timing-perfect" />
          <span className="timing-cursor" />
        </div>
        <button onClick={onStop}>SPAZIO / TOCCA</button>
      </div>
    </div>
  );
}

function CombatFrame({ direction }) {
  const [revealed, setRevealed] = useState([]);
  const [turn, setTurn] = useState(3);
  const [timing, setTiming] = useState(null);
  const [message, setMessage] = useState("Il Borseggiatore prepara una coltellata.");
  const [loot, setLoot] = useState(24);
  const [enemyHp, setEnemyHp] = useState(74);
  const timingRef = useRef(null);

  const stopTiming = useCallback(() => {
    if (!timingRef.current) return;
    const mode = timingRef.current;
    setTiming(null);
    timingRef.current = null;
    if (mode === "attack") {
      setEnemyHp((hp) => Math.max(0, hp - 16));
      setMessage("PERFETTO: 16 danni. Il tavolo non si sposta.");
    } else {
      setMessage("PARATA: danno annullato, contrattacco pronto.");
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === "Space" && timingRef.current) {
        event.preventDefault();
        stopTiming();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stopTiming]);

  const revealCard = (index, type) => {
    if (revealed.includes(index) || revealed.length >= 3 || timing) return;
    setRevealed((current) => [...current, index]);
    if (type === "money") {
      setLoot((value) => value + 7);
      setMessage("PREMIO: +€7. Prossimo intento ancora visibile.");
      return;
    }
    const mode = type === "attack" ? "attack" : "defense";
    timingRef.current = mode;
    setTiming(mode);
    setMessage(type === "attack" ? "Ferma il cursore: zona bianca = perfetto." : "Difesa pronta: ferma il cursore per parare.");
  };

  const nextTurn = () => {
    setRevealed([]);
    setTurn((value) => value + 1);
    setMessage("Nuovo turno. Geometria e bersagli invariati.");
  };

  const finished = revealed.length === 3 && !timing;
  const intents = useMemo(() => ["attack", "money", "defense"], []);

  return (
    <section className={`game-frame theme-${direction}`} aria-label={`Style frame ${direction}`}>
      <div className="world-noise" aria-hidden="true" />
      <header className="enemy-strip">
        <div className="enemy-portrait" aria-label="Ritratto pixel del Borseggiatore">
          <span className="portrait-hat" />
          <span className="portrait-face" />
          <span className="portrait-eyes" />
        </div>
        <div className="enemy-copy">
          <div className="enemy-title-row">
            <span className="enemy-name">BORSEGGIATORE DI PORTA NUOVA</span>
            <span className="fury-badge">FURIA 3</span>
          </div>
          <div className="meter-line">
            <span>HP</span>
            <span className="meter"><i style={{ width: `${enemyHp}%` }} /></span>
            <b>{enemyHp}/100</b>
          </div>
          <div className="intent-line">
            <span>IN ARRIVO</span>
            {intents.map((intent, index) => (
              <span className={`intent intent--${intent} ${index === revealed.length ? "is-active" : ""}`} key={intent}>
                <PixelIcon type={intent} /> {intent === "attack" ? "BOTTA" : intent === "money" ? "FURTO" : "SCUDO"}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="combat-body">
        <div className="ticket-grid" aria-label="Griglia fissa tre per tre">
          {CARD_BLUEPRINT.map((card, index) => (
            <CombatTicket
              card={card}
              index={index}
              key={index}
              revealed={revealed.includes(index)}
              locked={revealed.length >= 3 || Boolean(timing)}
              onReveal={revealCard}
            />
          ))}
        </div>
        <aside className="combat-diary">
          <div className="diary-title">SCONTRINO</div>
          <dl>
            <div><dt>TURNO</dt><dd>{turn}</dd></div>
            <div><dt>GRATTATI</dt><dd>{revealed.length}/3</dd></div>
            <div><dt>BOTTINO</dt><dd>€{loot}</dd></div>
          </dl>
          <div className="message-box" aria-live="polite">{message}</div>
          <div className="legend">
            <span><PixelIcon type="attack" /> BOTTA</span>
            <span><PixelIcon type="defense" /> PARATA</span>
            <span><PixelIcon type="money" /> PREMIO</span>
          </div>
        </aside>
      </main>

      <footer className="player-strip">
        <span className="player-label">LE TUE UNGHIE</span>
        <div className="nails" aria-label="Cinque unghie, quattro sane e una sanguinante">
          {["hurt", "ok", "ok", "ok", "ok"].map((state, index) => <span className={`nail nail--${state}`} key={index}>{index + 1}</span>)}
        </div>
        <span className="turn-rule">GRATTA 3 BIGLIETTI</span>
        <button className="next-turn" disabled={!finished} onClick={nextTurn}>{finished ? "PROSSIMO TURNO" : "SCEGLI UN BIGLIETTO"}</button>
      </footer>

      {timing && <TimingOverlay mode={timing} onStop={stopTiming} />}
    </section>
  );
}

export function App() {
  const [direction, setDirection] = useState("terminale");
  const active = DIRECTIONS.find((item) => item.id === direction);

  return (
    <div className="style-lab">
      <header className="lab-header">
        <div>
          <p className="eyebrow">GRATTINI VISUAL SYSTEM · FASE 1</p>
          <h1>Combat style lab</h1>
          <p className="lede">Tre direzioni. Stesso stato, stessa geometria, nessun reflow.</p>
        </div>
        <a href="https://github.com/brrucelean/grattini-v3" target="_blank" rel="noreferrer">REPOSITORY ↗</a>
      </header>

      <nav className="direction-tabs" aria-label="Direzioni visuali">
        {DIRECTIONS.map((item) => (
          <button className={direction === item.id ? "is-active" : ""} onClick={() => setDirection(item.id)} key={item.id}>
            <span>{item.index}</span>
            <strong>{item.name}</strong>
          </button>
        ))}
      </nav>

      <div className="frame-scroll">
        <CombatFrame key={direction} direction={direction} />
      </div>

      <section className="direction-note">
        <span>DIREZIONE {active.index}</span>
        <div>
          <h2>{active.name}</h2>
          <p>{active.note}</p>
        </div>
        <p className="instructions">Gratta tre ticket. Usa SPAZIO o tocca per fermare il timing.</p>
      </section>

      <footer className="lab-footer">
        <span>FRAME LOGICO 640×360</span>
        <span>GRIGLIA 8 PX</span>
        <span>TINY5 · OFL-1.1</span>
        <span>MOUSE · TASTIERA · TOUCH</span>
      </footer>
    </div>
  );
}

