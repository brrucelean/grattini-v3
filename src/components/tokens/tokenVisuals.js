// ─── EFFETTI VISIVI DEI GETTONI (G-01) ───────────────────────────
// Un gettone con `visual` (data/tokens.js) cambia come si vede il gioco
// finché è la pedina. Qui c'è solo la ricetta: filtro per il contenitore
// dello schermo + eventuale livello sovrapposto (TokenVisualLayer.jsx).
// Direzione (proprietario, 2026-09-19): effetti fini e "da vetrina" —
// iridescenza, rifrazione, halation, bloom selettivo, palette che cambia
// con lo stato, aura reattiva, retino, lente liquida. Niente effetti
// grossolani a schermo intero.

import { TOKENS } from "../../data/tokens.js";

// filter: filtro CSS/SVG per il contenitore esterno dello schermo.
// overlay: livello disegnato sopra (TokenVisualLayer).
// dynamic: filtro calcolato dallo stato del gioco (Umore).
// map / pedina: effetti che toccano solo la mappa o la pedina.
export const TOKEN_VISUALS = {
  madreperla: {
    label: "Riflessi perlati e bordi iridescenti",
    overlay: "pearl",
  },
  prisma: {
    label: "Rifrazione da cristallo ai bordi",
    filter: "url(#tokPrism)",
  },
  pellicola: {
    label: "Halation, bloom sulle luci, grana da pellicola",
    filter: "url(#tokHalation) sepia(.1) contrast(1.04)",
    overlay: "filmgrain",
  },
  umore: {
    label: "Colori che cambiano col tuo stato",
    dynamic: "mood",
  },
  aura: {
    label: "Aura che reagisce a vincite e sconfitte",
    overlay: "aura",
  },
  retino: {
    label: "Retino tipografico animato",
    filter: "url(#tokPoster)",
    overlay: "dither",
  },
  mercurio: {
    label: "Lente liquida a ogni cambio di scena",
    liquid: true,
  },
  vhs: {
    label: "Cassetta VHS",
    filter: "url(#tokSplit2) saturate(1.4) contrast(1.08)",
    overlay: "vhs",
  },
  specchio: {
    label: "Mappa al contrario",
    map: "mirror",
  },
  fantasma: {
    label: "Pedina trasparente",
    pedina: "ghost",
  },
  coriandoli: {
    label: "Coriandoli",
    overlay: "confetti",
  },
};

export const TOKEN_VISUAL_CSS = `
  @keyframes tokVhsBand { from { top:-18%; } to { top:110%; } }
  @keyframes tokVhsJitter { 0%,92%,100% { transform:none; } 94% { transform:translateX(3px); } 96% { transform:translateX(-2px); } }
  @keyframes tokRec { 0%,49% { opacity:1; } 50%,100% { opacity:0; } }
  @keyframes tokConfetti { from { transform:translateY(-10%); } to { transform:translateY(110vh); } }
  @keyframes tokHue { from { filter:hue-rotate(0deg); } to { filter:hue-rotate(360deg); } }
  @keyframes tokPearlDemo { 0% { background-position:0% 30%; } 50% { background-position:100% 70%; } 100% { background-position:0% 30%; } }
  @keyframes tokFilmGrain { 0% { background-position:0 0; } 20% { background-position:-37px 21px; } 40% { background-position:52px -13px; } 60% { background-position:-18px -44px; } 80% { background-position:29px 38px; } 100% { background-position:0 0; } }
  @keyframes tokDither { 0% { background-position:0 0; } 25% { background-position:2px 0; } 50% { background-position:2px 2px; } 75% { background-position:0 2px; } }
  @keyframes tokAuraIdle { 0%,100% { opacity:.10; } 50% { opacity:.22; } }
  @keyframes tokMoodDemo {
    0%,100% { filter: sepia(.35) saturate(1.3) hue-rotate(-10deg) brightness(1.03); }
    50%     { filter: saturate(.55) hue-rotate(28deg) brightness(.92); }
  }
`;

// Filtri SVG condivisi, inseriti una volta nel body (fuori dal contenitore
// che filtrano). Anche la lente liquida globale (fx) sta qui.
function ensureSvgFilters() {
  if (typeof document === "undefined" || document.getElementById("tok-svg-filters")) return;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("id", "tok-svg-filters");
  svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  // maschera radiale: 0 al centro, 1 sui bordi (per la rifrazione del Prisma)
  const edgeMask = "data:image/svg+xml," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' preserveAspectRatio='none'>" +
    "<defs><radialGradient id='g' cx='50%' cy='50%' r='72%'><stop offset='62%' stop-color='#fff' stop-opacity='0'/>" +
    "<stop offset='100%' stop-color='#fff' stop-opacity='1'/></radialGradient></defs>" +
    "<rect width='100' height='100' fill='url(#g)'/></svg>");
  const split = (id, d) => `
    <filter id="${id}" color-interpolation-filters="sRGB" x="-2%" y="0" width="104%" height="100%">
      <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
      <feOffset in="r" dx="-${d}" dy="0" result="rs" />
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="c" />
      <feOffset in="c" dx="${d}" dy="0" result="cs" />
      <feBlend in="rs" in2="cs" mode="screen" />
    </filter>`;
  const liquid = (id, anim) => `
    <filter id="${id}" x="-3%" y="-3%" width="106%" height="106%">
      <feTurbulence type="fractalNoise" baseFrequency="0.011 0.017" numOctaves="2" seed="7" result="t" />
      <feDisplacementMap in="SourceGraphic" in2="t" scale="0" xChannelSelector="R" yChannelSelector="G">${anim}</feDisplacementMap>
    </filter>`;
  svg.innerHTML = `
    ${split("tokSplit2", 2)}
    <filter id="tokPrism" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB" x="0" y="0" width="1" height="1">
      <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
      <feOffset in="r" dx="-0.0018" dy="0.0006" result="rs" />
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="c" />
      <feOffset in="c" dx="0.0018" dy="-0.0006" result="cs" />
      <feBlend in="rs" in2="cs" mode="screen" result="split" />
      <feImage href="${edgeMask}" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="mask" />
      <feComposite in="split" in2="mask" operator="in" result="edge" />
      <feComposite in="SourceGraphic" in2="mask" operator="out" result="center" />
      <feMerge><feMergeNode in="center" /><feMergeNode in="edge" /></feMerge>
    </filter>
    <filter id="tokHalation" color-interpolation-filters="sRGB" x="-3%" y="-3%" width="106%" height="106%">
      <!-- solo le parti luminose diventano un alone caldo (bloom selettivo) -->
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1  0 0 0 0 0.5  0 0 0 0 0.22  0.55 0.95 0.12 0 -1.02" result="hot" />
      <feGaussianBlur in="hot" stdDeviation="6" result="glow" />
      <feBlend in="glow" in2="SourceGraphic" mode="screen" />
    </filter>
    <filter id="tokPoster" color-interpolation-filters="sRGB">
      <feComponentTransfer>
        <feFuncR type="discrete" tableValues="0 .28 .55 .8 1" />
        <feFuncG type="discrete" tableValues="0 .28 .55 .8 1" />
        <feFuncB type="discrete" tableValues="0 .28 .55 .8 1" />
      </feComponentTransfer>
    </filter>
    ${liquid("fxLiquid", '<animate id="fxLiquidAnim" attributeName="scale" values="0;22;6;0" dur="0.55s" begin="indefinite" fill="freeze" />')}
    ${liquid("fxLiquidDemo", '<animate attributeName="scale" values="0;0;22;6;0" keyTimes="0;.55;.7;.85;1" dur="2.6s" repeatCount="indefinite" />')}
  `;
  document.body.appendChild(svg);
}

export const visualOf = (tokenId) => TOKEN_VISUALS[TOKENS[tokenId]?.visual] || null;

// Palette dell'Umore: si scalda coi soldi, si raffredda col dolore delle unghie.
function moodFilter(money = 0, pain = 0) {
  const w = Math.max(0, Math.min(1, money / 150));
  const p = Math.max(0, Math.min(1, pain));
  return `sepia(${(w * 0.35).toFixed(2)}) saturate(${(1 + w * 0.3 - p * 0.45).toFixed(2)}) ` +
    `hue-rotate(${Math.round(-w * 10 + p * 28)}deg) brightness(${(1 - p * 0.08).toFixed(2)})`;
}

// Stile per il contenitore dello schermo.
// ctx: { money, pain } per l'Umore · demo: true nell'anteprima del debug ·
// liquid: true mentre la lente liquida sta ondeggiando.
export function visualWrapperStyle(visual, reducedMotion = false, ctx = {}) {
  const filters = [];
  const style = {};
  if (ctx.liquid && !reducedMotion) filters.push(ctx.demo ? "url(#fxLiquidDemo)" : "url(#fxLiquid)");
  if (visual?.liquid && ctx.demo && !reducedMotion) filters.push("url(#fxLiquidDemo)");
  if (visual?.filter) filters.push(visual.filter);
  if (visual?.dynamic === "mood") {
    if (ctx.demo && !reducedMotion) style.animation = "tokMoodDemo 4s steps(12) infinite";
    else { filters.push(moodFilter(ctx.money, ctx.pain)); style.transition = "filter 1.6s steps(8)"; }
  }
  if (filters.some(f => f.includes("url(#"))) ensureSvgFilters();
  if (filters.length) style.filter = filters.join(" ");
  return style;
}

// ─── LENTE LIQUIDA GLOBALE ───────────────────────────────────────
// Onda breve su impatti e power-up (tutto il gioco, non solo i gettoni).
// Parte da utils/fx.js; con "riduci movimento" non parte mai.
export function playLiquidPulse(strength = 1) {
  ensureSvgFilters();
  const anim = document.getElementById("fxLiquidAnim");
  if (!anim) return;
  const peak = Math.round(8 + 18 * Math.max(0, Math.min(1.4, strength)));
  anim.setAttribute("values", `0;${peak};${Math.round(peak / 4)};0`);
  try { anim.beginElement(); } catch { /* SMIL non disponibile: niente onda */ }
}
