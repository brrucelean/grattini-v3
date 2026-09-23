import { useEffect, useState } from "react";
import { C, FONT, FONT_TITLE } from "../../data/theme.js";
import { BIOMES, BOSS_MIN_MONEY } from "../../data/biomes.js";
import { AudioEngine } from "../../audio.js";
import { Asset } from "../Asset.jsx";
import { Pedina } from "../map/Pedina.jsx";
import { TokenCard } from "../tokens/TokenCard.jsx";
import { SH } from "../shell/shellTokens.js";
import { BIOME_THEME, GOLD, FAMILY, dither, bevel } from "../map/mapTheme.js";
import { StagePortrait } from "../desk/StagePortrait.jsx";

// ─── IL QUADERNO DI NONNO CARMELO — tutorial in 4 capitoli ──────
// Prologo della scena al bancone (IntroDesk): stessi colori della mappa,
// stesso vecchio che parla. Ogni capitolo: la sua voce in alto (scritta a
// macchina, clic per saltare), a sinistra un'illustrazione con gli sprite
// veri del gioco, a destra le regole numerate. Le regole sono quelle del
// codice (consumo unghie, combattimento, soglie dei boss, pedine G-01).

const T = BIOME_THEME[0];
const BG = dither(T.board, T.board2);
const PANEL = T.marquee, LINE = SH.line, LINE_HI = SH.lineHi;
const TXT = C.text, INK = T.ink, ACCENT = T.accent;
const panel = { background: PANEL, boxShadow: `inset 0 0 0 2px ${LINE}, ${SH.shadow}` };
const PAPER = "#efe2b5";
const PAPER_2 = "#e7d69f";
const PAPER_INK = "#243b38";
const paperLines = `repeating-linear-gradient(0deg, transparent 0 27px, #5f817622 27px 28px), ${PAPER}`;
const hl = (color) => ({ color, fontWeight: "normal" });

function useTyped(text) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let i = 0;
    const iv = setInterval(() => {
      i += 2;
      setN(i);
      if (i % 6 === 0 && text[i] && text[i] !== " ") AudioEngine.dialogueTick?.();
      if (i >= text.length) clearInterval(iv);
    }, 24);
    return () => clearInterval(iv);
  }, [text]);
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) };
}

// ── Illustrazioni ────────────────────────────────────────────────

const NAILS = [
  { id: "sana", label: "Sana", prize: "100%", color: C.green },
  { id: "graffiata", label: "Graffiata", prize: "100%", color: C.gold },
  { id: "sanguinante", label: "Sanguinante", prize: "100%", color: C.orange },
  { id: "marcia", label: "Marcia", prize: "25%", color: C.red },
  { id: "morta", label: "Morta", prize: "0%", color: "#777" },
];

function NailsArt() {
  // Dita della V2 (nail-<stato>.webp, P-07)
  const sprite = (id) => (`nail-${id}`);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <span style={{ fontSize: 11, letterSpacing: 2, color: INK }}>OGNI 3 CASELLE GRATTATE, UN GRADINO GIÙ</span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 6, alignItems: "end" }}>
        {NAILS.map((n, i) => (
          <div key={n.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" }}>
            <div style={{ width: 80, height: 80, display: "grid", placeItems: "center", background: "#000", boxShadow: `inset 0 0 0 2px ${n.color}66` }}>
              <Asset id={sprite(n.id)} emoji="💅" size={72} pixel={false} />
            </div>
            <span style={{ fontSize: 12, color: n.color }}>{n.label}</span>
            <span style={{ fontSize: 10, color: INK, background: "#000", padding: "1px 6px", boxShadow: `inset 0 0 0 1px ${n.color}55` }}>premio {n.prize}</span>
            {i < NAILS.length - 1 && <span aria-hidden style={{ position: "absolute", right: -9, top: 32, color: INK, fontSize: 12 }}>▸</span>}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 12, alignItems: "center", padding: 10, background: "#000", boxShadow: "inset 0 0 0 2px #ff88cc55" }}>
        <div style={{ width: 52, height: 52, display: "grid", placeItems: "center" }}><Asset id="nail-kawaii" emoji="💅" size={48} pixel={false} /></div>
        <span style={{ fontSize: 12, lineHeight: 1.45, color: TXT }}>
          <span style={hl("#ff88cc")}>Kawaii ♡</span> — premio <span style={hl("#ff88cc")}>×2</span>. Non si consuma per usura: si fa con la <span style={hl(C.magenta)}>manicure</span> in locanda.
        </span>
      </div>
    </div>
  );
}

function CombatArt() {
  const card = (asset, label, color, text) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 8, background: "#000", boxShadow: `inset 0 0 0 2px ${color}66` }}>
      <Asset id={asset} emoji="🎴" size={56} />
      <span style={{ fontSize: 12, color }}>{label}</span>
      <span style={{ fontSize: 10, color: INK, textAlign: "center", lineHeight: 1.35 }}>{text}</span>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* il nemico */}
      <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 12, alignItems: "center" }}>
        <div style={{ width: 64, height: 64, background: "#000", boxShadow: `inset 0 0 0 2px ${C.red}66`, overflow: "hidden" }}>
          <Asset id="spr-ladro" emoji="🗡️" size={64} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 12, color: TXT }}>Ladro · <span style={{ color: INK }}>prossima mossa:</span> <span style={{ color: C.red }}>🗡 ATTACCO</span></span>
          <div style={{ height: 8, background: "#200", boxShadow: "inset 0 0 0 1px #000" }}><div style={{ width: "62%", height: "100%", background: C.red }} /></div>
          <div style={{ height: 6, background: "#0a1428", boxShadow: "inset 0 0 0 1px #000" }}><div style={{ width: "35%", height: "100%", background: C.blue }} /></div>
          <span style={{ fontSize: 10, color: INK }}><span style={{ color: C.red }}>vita</span> · <span style={{ color: C.blue }}>scudo</span> (assorbe prima della vita)</span>
        </div>
      </div>
      {/* le tre carte */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
        {card("combat-combattimento", "▲ BOTTA", C.red, "colpisci")}
        {card("combat-difesa", "◆ PARATA", C.blue, "pari il prossimo attacco")}
        {card("combat-denaro", "€ PREMIO", C.gold, "nel bottino se vinci")}
      </div>
      {/* tempismo */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 11, letterSpacing: 2, color: INK }}>TEMPISMO · FERMA IL CURSORE NEL VERDE</span>
        <div style={{ position: "relative", height: 16, background: "#3a1010", boxShadow: "inset 0 0 0 1px #000" }}>
          <div style={{ position: "absolute", left: "26%", width: "48%", top: 0, bottom: 0, background: C.gold }} />
          <div style={{ position: "absolute", left: "44%", width: "12%", top: 0, bottom: 0, background: C.green }} />
          <div style={{ position: "absolute", left: "49%", top: -6, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `8px solid ${C.bright}` }} />
        </div>
        {/* etichette sotto le zone vere: rosso ai lati, giallo, verde al centro */}
        <div style={{ position: "relative", height: 14, fontSize: 10 }}>
          <span style={{ position: "absolute", left: 0, color: C.red }}>rosso: metà</span>
          <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", color: C.green }}>verde: perfetto</span>
          <span style={{ position: "absolute", left: "30%", transform: "translateX(-50%)", color: C.gold }}>giallo</span>
          <span style={{ position: "absolute", left: "70%", transform: "translateX(-50%)", color: C.gold }}>giallo</span>
          <span style={{ position: "absolute", right: 0, color: C.red }}>rosso</span>
        </div>
      </div>
    </div>
  );
}

const PATH = [
  { sprite: "spr-start", label: "START", fam: "neutral" },
  { sprite: "spr-tabaccaio", label: "TABACCAIO", fam: "safe" },
  { sprite: "spr-ladro", label: "LADRO", fam: "danger", elite: true },
  { sprite: "spr-evento", label: "EVENTO", fam: "event" },
  { sprite: "spr-locanda", label: "LOCANDA", fam: "safe" },
  { sprite: "spr-boss", label: "BOSS", fam: "danger", boss: true },
];

function MapArt() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: `repeat(${PATH.length}, minmax(0,1fr))`, gap: 4, padding: "14px 6px", background: dither(T.board, T.board2), boxShadow: "inset 0 0 0 2px #000" }}>
        <div aria-hidden style={{ position: "absolute", left: "8%", right: "8%", top: 40, borderTop: `2px dashed ${GOLD.lo}` }} />
        {PATH.map((n, i) => {
          const fam = FAMILY[n.fam];
          return (
            <div key={n.label} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: n.boss ? 54 : 48, height: n.boss ? 54 : 48, background: dither(fam.tile, fam.tile2, 2), boxShadow: [bevel(GOLD, 2), n.elite ? `0 0 0 2px #000, 0 0 0 4px ${C.orange}` : null].filter(Boolean).join(", "), overflow: "hidden", display: "grid", placeItems: "center" }}>
                <Asset id={n.sprite} emoji="?" size={n.boss ? 44 : 38} />
              </div>
              <span style={{ fontSize: 9, color: n.boss ? "#ff6a6a" : INK, background: "#000", padding: "0 3px" }}>{n.label}{n.elite ? " ★" : ""}</span>
              {i === 0 && <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}><Pedina id="ottone" size={20} /></span>}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 11, letterSpacing: 2, color: INK }}>PER ENTRARE DAL BOSS SERVONO ALMENO</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 6 }}>
          {BIOMES.map((b, i) => (
            <div key={b.id} style={{ padding: "6px 8px", background: "#000", boxShadow: `inset 0 0 0 1px ${LINE_HI}`, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 9, color: INK }}>{i + 1}. {b.name.replace(/^\S+ (?=Quartiere)/, "")}</span>
              <span style={{ fontSize: 11, color: TXT }}>{b.boss}</span>
              <span style={{ fontSize: 14, color: C.gold }}>€{BOSS_MIN_MONEY[b.boss]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SHOWCASE = ["ficheBlu", "monetaVicolo", "madreperla", "vhs", "specchietto", "santino"];

function TokenArt() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 14, alignItems: "center" }}>
        <div style={{ padding: 10, background: "#000", boxShadow: `inset 0 0 0 2px ${GOLD.mid}` }}><Pedina id="ottone" size={56} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 16, color: GOLD.mid }}>Gettone d'Ottone</span>
          <span style={{ fontSize: 11, color: INK, lineHeight: 1.45 }}>La tua prima pedina. Non fa niente di speciale: è quella con cui parti ogni run.</span>
        </div>
      </div>
      <span style={{ fontSize: 11, letterSpacing: 2, color: INK }}>PER STRADA NE TROVERAI ALTRE</span>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${SHOWCASE.length}, minmax(0,1fr))`, gap: 6 }}>
        {SHOWCASE.map(id => (
          <div key={id} style={{ display: "grid", placeItems: "center", padding: 6, background: "#000", boxShadow: `inset 0 0 0 1px ${LINE_HI}` }}>
            <Pedina id={id} size={34} />
          </div>
        ))}
      </div>
      <span style={{ fontSize: 11, letterSpacing: 2, color: INK }}>OGNI PEDINA HA LA SUA SCHEDA</span>
      <TokenCard id="ficheBlu" />
    </div>
  );
}

// ── Capitoli ─────────────────────────────────────────────────────

const CHAPTERS = [
  {
    tab: "LE DITA", title: "Cinque unghie, cinque vite", color: C.cyan, Art: NailsArt,
    voice: "Ne ho viste passare tante di mani, figliolo: mani d'oro e mani di pastafrolla. Qui non conta quanti soldi hai in tasca: contano le dita che ti restano. Ne hai cinque. Quando si grattano via tutte, la partita è chiusa.",
    rules: [
      <>Gratti i biglietti con l'unghia in uso. Ogni <b style={hl(C.bright)}>3 caselle</b> scende di un gradino.</>,
      <>Da <b style={hl(C.red)}>Marcia</b> vinci solo il 25%. Da <b style={hl("#aaa")}>Morta</b> non gratta più: il biglietto si annulla e passi al dito dopo.</>,
      <>Con un <b style={hl(C.cyan)}>grattatore in mano</b> gratta lui, e l'unghia non si consuma finché ha usi.</>,
      <>Curale con <b style={hl(C.bright)}>cerotto</b> e <b style={hl(C.bright)}>disinfettante</b>, oppure dormendo in <b style={hl(C.magenta)}>locanda</b>.</>,
    ],
  },
  {
    tab: "IL DUELLO", title: "Chi gratta più veloce", color: C.red, Art: CombatArt,
    voice: "Là fuori non ti rubano il portafoglio: te lo grattano via. Ladri, spacciatori, la gente del Broker. Con loro non si parla. Si gratta, e si gratta più veloce di loro.",
    rules: [
      <>Porta a zero la <b style={hl(C.red)}>vita</b> del nemico. Il suo <b style={hl(C.blue)}>scudo</b> assorbe i colpi prima.</>,
      <>Ogni turno gratti <b style={hl(C.bright)}>3 carte su 9</b>: <b style={hl(C.red)}>botta</b>, <b style={hl(C.blue)}>parata</b> o <b style={hl(C.gold)}>premio</b> (soldi che incassi solo se vinci).</>,
      <>In alto vedi le 3 mosse del nemico. <b style={hl(C.bright)}>Se la prossima è un attacco, cerca una parata</b>: senza, ti rovina un'unghia.</>,
      <>Ferma il cursore nel <b style={hl(C.green)}>verde</b>: botta perfetta +40%, parata perfetta = nessun danno e contrattacco.</>,
      <>3 botte nello stesso turno = <b style={hl(C.magenta)}>combo</b> +25%. Dal turno 3 il nemico va in <b style={hl(C.orange)}>furia</b>: chiudi in fretta.</>,
    ],
  },
  {
    tab: "LA STRADA", title: "Quattro quartieri, quattro padroni", color: C.gold, Art: MapArt,
    voice: "Da qui al Quartiere Cinese ci sono quattro quartieri e quattro padroni: il Broker, il Romanaccio, il Napoletano e il Drago d'Oro. Nessuno di loro riceve chi arriva a mani vuote. Porta i soldi, o ti rimandano indietro.",
    rules: [
      <>La mappa va da <b style={hl(C.bright)}>sinistra a destra</b>: scegli un nodo per colonna fino al <b style={hl(C.red)}>boss</b>.</>,
      <><b style={hl(C.red)}>▲ Pericolo</b>: combattimenti, soldi ma unghie a rischio. <b style={hl(C.green)}>✚ Sicuri</b>: tabaccaio e locanda. <b style={hl(C.magenta)}>? Incontri</b>: scelte che aiutano o fregano.</>,
      <><b style={hl(C.orange)}>★ Élite</b>: premi doppi, colpi più duri. <b style={hl("#b9c0c8")}>🔒 Segreti</b>: si aprono solo con abbastanza Fortuna.</>,
      <>Prima di entrare in un nodo puoi grattare <b style={hl(C.bright)}>fino a 3 biglietti</b> che hai in tasca.</>,
      <>Il boss ti riceve solo sopra la sua <b style={hl(C.gold)}>soglia</b>. Sotto, ti rispedisce all'inizio della mappa.</>,
    ],
  },
  {
    tab: "LA PEDINA", title: "Il gettone che cammina per te", color: GOLD.mid, Art: TokenArt,
    voice: "Questo tienilo tu: è un gettone d'ottone, il primo che ho messo in una slot. Sulla mappa cammina lui al posto tuo. Per strada ne troverai altri, e ognuno ti cambia il viaggio: uno ti fa lo sconto, uno ti porta i ladri in casa, uno ti fa vedere tutto a colori strani. Ricordati: nessuno è gratis.",
    rules: [
      <>Una pedina alla volta, e la vedi camminare sulla mappa. <b style={hl(C.bright)}>Cliccala</b> per la scheda: <b style={hl("#7be08a")}>vantaggio</b>, <b style={hl("#ff7a6a")}>fregatura</b>, quando scatta.</>,
      <>Ne porti <b style={hl(C.bright)}>al massimo 3</b> nella custodia sotto la mappa, Ottone compreso. Se è piena, scegli quale buttare.</>,
      <>Si cambia <b style={hl(C.gold)}>solo sulla mappa</b>: trascina qualunque gettone dalla custodia e rilascialo sul tabellone, prima di scegliere il nodo. Dentro il nodo resta quella.</>,
      <>Le trovi negli <b style={hl(C.bright)}>zaini abbandonati</b> e dal <b style={hl(C.red)}>boss</b>. Valgono per questa run, ma restano nella collezione <b style={hl("#e58a68")}>Pedine</b> della home.</>,
      <>Alcune hanno un potere da usare (Telefono, Dado), altre cambiano <b style={hl("#e07aff")}>come vedi il gioco</b>.</>,
    ],
  },
];

export function TutorialDesk({ page, onPage, onDone }) {
  const ch = CHAPTERS[page] || CHAPTERS[0];
  const { shown, done, skip } = useTyped(ch.voice);
  const last = page === CHAPTERS.length - 1;

  // ← → per sfogliare
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); last ? onDone() : onPage(page + 1); }
      if (e.key === "ArrowLeft" && page > 0) { e.preventDefault(); onPage(page - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, last, onPage, onDone]);

  return (
    <div style={{
      flex: 1, minHeight: 0, width: "100%", boxSizing: "border-box", padding: "18px 20px", overflowY: "auto",
      background: BG, fontFamily: FONT, color: TXT, display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
    }}>
      <div style={{ width: "min(100%, 1060px)", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

        {/* La pagina parlata usa la stessa grammatica degli altri NPC: striscia,
            ritratto di scena, cartellino, nome e battuta dattiloscritta. */}
        <section onClick={skip} aria-label="Dialogo con Nonno Carmelo" style={{
          ...panel, position: "relative", padding: "16px 20px 16px 24px",
          display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 22, alignItems: "center",
          cursor: done ? "default" : "pointer", flexShrink: 0,
        }}>
          <span aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: ch.color }} />
          <StagePortrait spriteId="spr-vecchio" accent={ch.color} size={148} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, letterSpacing: 3, color: ACCENT }}>TABACCHERIA</span>
              <span style={{ fontSize: 10, letterSpacing: 2, padding: "3px 8px", color: ch.color, background: "#000", boxShadow: `inset 0 0 0 1px ${ch.color}` }}>
                CAPITOLO {["I", "II", "III", "IV"][page]}
              </span>
            </div>
            <h2 style={{ margin: 0, fontFamily: FONT_TITLE, fontWeight: "normal", fontSize: 28, lineHeight: 1.05, color: TXT }}>Nonno Carmelo</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, fontStyle: "italic", color: INK, minHeight: "4.8em" }}>
              ❝ {shown}{!done && <span style={{ color: ch.color }}>▌</span>}{done && " ❞"}
            </p>
            {!done && <span style={{ alignSelf: "flex-end", fontSize: 10, letterSpacing: 1, color: C.dim }}>tocca per saltare →</span>}
          </div>
        </section>

        {/* Sketchbook aperto: copertina, fogli rigati, dorso e spirale. */}
        <article aria-label="Libretto di istruzioni di Nonno Carmelo" style={{
          position: "relative", flex: 1, padding: "14px", background: "#6d4425",
          boxShadow: `inset 0 0 0 3px #332014, inset 0 0 0 6px #a77a3f, 7px 7px 0 #000`,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <style>{`
            @keyframes sketchbookPageIn {
              0% { opacity: 0; transform: perspective(900px) rotateY(-5deg) translateX(14px); }
              55% { opacity: 1; transform: perspective(900px) rotateY(1deg) translateX(-2px); }
              100% { opacity: 1; transform: perspective(900px) rotateY(0) translateX(0); }
            }
            @media (prefers-reduced-motion: reduce) {
              .sketchbook-spread { animation: none !important; }
            }
          `}</style>
          <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "2px 4px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 10, letterSpacing: 3, color: PAPER_2 }}>LIBRETTO DI ISTRUZIONI · APPUNTI DEL VECCHIO</span>
              <span style={{ fontSize: 22, lineHeight: 1, color: "#fff1bd" }}>{ch.title}</span>
            </div>
            <nav aria-label="Capitoli" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {CHAPTERS.map((c, i) => {
                const on = i === page;
                return (
                  <button key={c.tab} type="button" onClick={() => onPage(i)} aria-current={on ? "step" : undefined} style={{
                    fontFamily: FONT, fontSize: 10, letterSpacing: 1, padding: "6px 9px", border: "none", cursor: "pointer",
                    background: on ? ch.color : "#24180f", color: on ? "#000" : i < page ? PAPER : "#ad9b73",
                    boxShadow: on ? "2px 2px 0 #000" : "inset 0 0 0 1px #725b3a",
                  }}>{["I", "II", "III", "IV"][i]} · {c.tab}</button>
                );
              })}
            </nav>
          </header>

          <div key={page} className="sketchbook-spread" style={{
            position: "relative", display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", minHeight: 390,
            transformOrigin: "50% 50%", animation: "sketchbookPageIn 0.28s steps(4) both",
          }}>
            <span aria-hidden style={{ position: "absolute", zIndex: 3, left: "50%", top: 0, bottom: 0, width: 18, transform: "translateX(-50%)",
              background: "repeating-linear-gradient(0deg, transparent 0 13px, #332014 13px 17px, #d7c58f 17px 20px)",
              filter: "drop-shadow(2px 0 #806b43)" }} />
            <section aria-label="Illustrazione" style={{ background: paperLines, color: PAPER_INK, padding: "22px 28px 22px 22px", boxShadow: "inset 3px 0 #c5af74, inset 0 3px #c5af74" }}>
              <span style={{ display: "block", marginBottom: 14, fontSize: 10, letterSpacing: 2, color: "#6e654d" }}>FIG. {page + 1} · {ch.tab}</span>
              <ch.Art />
            </section>
            <section aria-label="Regole" style={{ background: `repeating-linear-gradient(0deg, transparent 0 27px, #5f817622 27px 28px), ${PAPER_2}`,
              color: PAPER_INK, padding: "22px 22px 22px 30px", boxShadow: "inset -3px 0 #c5af74, inset 0 3px #c5af74", display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 12, letterSpacing: 2, color: PAPER_INK, borderBottom: `3px double ${PAPER_INK}`, paddingBottom: 7 }}>COSA DEVI SAPERE</span>
              {ch.rules.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "26px minmax(0,1fr)", gap: 10, alignItems: "start" }}>
                  <span style={{ width: 24, height: 24, display: "grid", placeItems: "center", border: `2px solid ${ch.color}`,
                    color: PAPER_INK, fontSize: 11, transform: `rotate(${i % 2 ? 1 : -1}deg)` }}>{i + 1}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.55, color: PAPER_INK }}>{r}</span>
                </div>
              ))}
              <span style={{ marginTop: "auto", alignSelf: "flex-end", fontSize: 10, color: "#756948", transform: "rotate(-2deg)" }}>— N. Carmelo</span>
            </section>
          </div>
        </article>

        {/* ══ Navigazione: stessi punti su tutte le pagine ══ */}
        <footer style={{ display: "grid", gridTemplateColumns: "160px minmax(0,1fr) 260px", gap: 12, alignItems: "center" }}>
          <button type="button" onClick={() => onPage(page - 1)} style={{
            visibility: page > 0 ? "visible" : "hidden", height: 44, fontFamily: FONT, fontSize: 13, letterSpacing: 2, cursor: "pointer",
            border: "none", background: "transparent", color: INK, boxShadow: `inset 0 0 0 2px ${LINE}`,
          }}>← INDIETRO</button>
          <span style={{ textAlign: "center", fontSize: 11, color: C.dim, letterSpacing: 1 }}>
            {page + 1} / {CHAPTERS.length} · frecce ← → per sfogliare
          </span>
          <button type="button" onClick={last ? onDone : () => onPage(page + 1)} style={{
            height: 44, fontFamily: FONT, fontSize: 14, letterSpacing: 2, cursor: "pointer", border: "none",
            color: GOLD.dark, background: GOLD.mid, boxShadow: `inset 0 0 0 2px ${GOLD.dark}, inset 2px 2px 0 2px ${GOLD.hi}, ${SH.shadow}`,
          }}>{last ? "COMINCIA →" : "AVANTI →"}</button>
        </footer>
      </div>
    </div>
  );
}
