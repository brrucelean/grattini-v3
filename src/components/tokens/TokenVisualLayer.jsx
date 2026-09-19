import { useEffect, useRef, useState } from "react";
import { FONT } from "../../data/theme.js";

// ─── LIVELLO SOVRAPPOSTO DEGLI EFFETTI VISIVI ────────────────────
// Si stende sul contenitore che lo ospita (schermo intero, o anteprima nella
// modalità debug con `small`). Non intercetta mai i clic. Con "riduci
// movimento" le parti animate restano ferme.

const CONFETTI_COLORS = ["#f2cf44", "#e04a3a", "#3ac8d0", "#4fb83a", "#e03ab8"];
const IRIDESCENT = "#ff9ad8, #9affea, #fff39a, #9ab8ff, #e0a0ff, #ff9ad8";

// Rumore organico finissimo (feTurbulence), per la grana da pellicola.
const FILM_NOISE = "url(\"data:image/svg+xml," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'>" +
  "<feTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='2' seed='4' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.4 -.45'/></filter>" +
  "<rect width='100%' height='100%' filter='url(#n)'/></svg>") + "\")";

// Retino ordinato 4×4 (Bayer) a due livelli: puntini di stampa.
const BAYER = "url(\"data:image/svg+xml," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4' shape-rendering='crispEdges'>" +
  "<rect x='0' y='0' width='1' height='1' fill='#000'/><rect x='2' y='2' width='1' height='1' fill='#000'/>" +
  "<rect x='2' y='0' width='1' height='1' fill='#000' fill-opacity='.5'/><rect x='0' y='2' width='1' height='1' fill='#000' fill-opacity='.5'/></svg>") + "\")";

export function TokenVisualLayer({ overlay, reducedMotion = false, small = false, money = 0 }) {
  if (!overlay) return null;
  const base = { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 99990, overflow: "hidden" };
  const anim = (a) => (reducedMotion ? "none" : a);

  if (overlay === "pearl") return <PearlLayer base={base} small={small} reducedMotion={reducedMotion} />;
  if (overlay === "aura") return <AuraLayer base={base} small={small} reducedMotion={reducedMotion} money={money} />;

  if (overlay === "filmgrain") return (
    <div aria-hidden style={{ ...base, backgroundImage: FILM_NOISE, backgroundSize: small ? "70px 70px" : "140px 140px",
      mixBlendMode: "overlay", opacity: 0.35, animation: anim("tokFilmGrain .5s steps(1) infinite") }} />
  );

  if (overlay === "dither") return (
    <div aria-hidden style={{ ...base, backgroundImage: BAYER, backgroundSize: small ? "4px 4px" : "6px 6px",
      imageRendering: "pixelated", mixBlendMode: "multiply", opacity: 0.22, animation: anim("tokDither 1.2s steps(1) infinite") }} />
  );

  if (overlay === "vhs") return (
    <div aria-hidden style={{ ...base, animation: anim("tokVhsJitter 3.2s steps(1) infinite") }}>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, #0000 0 3px, #00000030 3px 4px)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, height: "9%", background: "linear-gradient(0deg, #fff0, #ffffff26 40%, #ffffff10 60%, #fff0)",
        animation: anim("tokVhsBand 5s steps(40) infinite") }} />
      <span style={{ position: "absolute", top: small ? 4 : 18, left: small ? 6 : 24, fontFamily: FONT, fontSize: small ? 9 : 20,
        color: "#f4f4f4", textShadow: "2px 2px 0 #000", letterSpacing: 2 }}>PLAY ►</span>
      <span style={{ position: "absolute", top: small ? 4 : 18, right: small ? 6 : 24, fontFamily: FONT, fontSize: small ? 9 : 18,
        color: "#ff3a3a", textShadow: "2px 2px 0 #000", animation: anim("tokRec 1s steps(1) infinite") }}>● REC</span>
    </div>
  );

  if (overlay === "confetti") {
    const bits = small ? 14 : 40;
    return (
      <div aria-hidden style={base}>
        {Array.from({ length: bits }, (_, i) => (
          <span key={i} style={{ position: "absolute", left: `${(i * 29) % 100}%`, top: reducedMotion ? `${(i * 41) % 90}%` : "-4%",
            width: small ? 3 : 6, height: small ? 5 : 10, background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animation: anim(`tokConfetti ${2.2 + (i % 4) * 0.5}s steps(24) ${(i % 7) * 0.3}s infinite`) }} />
        ))}
      </div>
    );
  }

  return null;
}

// Madreperla: riflesso perlato che segue il cursore + bordo iridescente che si
// accende quando qualcosa si muove, poi torna quasi invisibile.
function PearlLayer({ base, small, reducedMotion }) {
  const [pos, setPos] = useState({ x: 50, y: 40 });
  const [moving, setMoving] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (small) return undefined;
    let raf = 0, idle = 0;
    const onMove = (e) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        setMoving(true);
        clearTimeout(idle);
        idle = setTimeout(() => setMoving(false), 700);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); clearTimeout(idle); };
  }, [small]);
  const on = small || moving;
  return (
    <div ref={ref} aria-hidden style={base}>
      {/* riflesso perlato: morbido, segue il cursore (in anteprima si muove da solo) */}
      {/* luccichio, non nebbia: piccolo, anelli iridescenti, blend "overlay" basso */}
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.32,
        background: small
          ? `radial-gradient(circle at 50% 50%, #ffffff 0%, #ffd6f4 6%, #c8fff4 11%, #fff2c8 16%, transparent 26%) 0 0 / 180% 180%`
          : `radial-gradient(circle at ${pos.x}% ${pos.y}%, #ffffff 0%, #ffd6f4 3%, #c8fff4 6%, #fff2c8 9%, #e0d0ff 12%, transparent 17%)`,
        animation: small && !reducedMotion ? "tokPearlDemo 3s steps(24) infinite" : "none",
        transition: "background .08s linear" }} />
      {/* bordo iridescente: solo ai lati, forte quando ti muovi */}
      {/* niente scorciatoia `border`: azzererebbe borderImage */}
      <div style={{ position: "absolute", inset: small ? 0 : 6, borderStyle: "solid", borderWidth: small ? 2 : 5,
        borderImageSource: `conic-gradient(${IRIDESCENT})`, borderImageSlice: 1, opacity: on ? 0.85 : 0.2,
        transition: "opacity .35s steps(4)", animation: reducedMotion ? "none" : "tokHue 6s steps(48) infinite" }} />
    </div>
  );
}

// Aura: bordo luminoso che respira piano; si accende d'oro quando entrano
// soldi e di rosso quando escono (reagisce al punteggio).
function AuraLayer({ base, small, reducedMotion, money }) {
  const prev = useRef(money);
  const [flash, setFlash] = useState(null);
  useEffect(() => {
    const d = money - prev.current;
    prev.current = money;
    if (!d) return undefined;
    setFlash(d > 0 ? "#ffd84a" : "#ff4a4a");
    const t = setTimeout(() => setFlash(null), 750);
    return () => clearTimeout(t);
  }, [money]);
  // anteprima del debug: vincita e sconfitta finte, a turno
  useEffect(() => {
    if (!small || reducedMotion) return undefined;
    let n = 0;
    const iv = setInterval(() => { n++; setFlash(n % 3 === 0 ? null : n % 3 === 1 ? "#ffd84a" : "#ff4a4a"); }, 900);
    return () => clearInterval(iv);
  }, [small, reducedMotion]);
  const color = flash || "#9ad8ff";
  const spread = small ? 18 : 90;
  return (
    <div aria-hidden style={{ ...base, boxShadow: `inset 0 0 ${spread}px ${Math.round(spread / 6)}px ${color}`,
      opacity: flash ? 0.75 : undefined, transition: "box-shadow .2s steps(3), opacity .5s steps(5)",
      animation: flash || reducedMotion ? "none" : "tokAuraIdle 2.8s steps(10) infinite" }} />
  );
}
