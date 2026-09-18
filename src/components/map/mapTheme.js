import { C } from "../../data/theme.js";

// ─── TEMA DELLA MAPPA-SLOT ───────────────────────────────────────
// Estetica "slot da tabacchi" tradotta in pixel art: cornici oro a gradini
// (tre toni netti, mai sfumati), simboli saturi su caselle piene, numeri di
// payline. Ogni bioma è un "gioco" diverso della stessa macchina.

export const GOLD = { hi: "#fff1a8", mid: "#f2cf44", lo: "#b3801f", dark: "#5c3a0c" };
export const SILVER = { hi: "#f4f6f8", mid: "#b9c0c8", lo: "#7d858f", dark: "#3c424a" };

// Bevel a gradini: solo ombre interne dure, nessun blur. Dall'esterno:
// filo scuro (w), luce in alto a sinistra / ombra in basso a destra (w),
// fascia piena (w). La prima ombra dichiarata sta sopra le altre.
export const bevel = (c = GOLD, w = 2) => [
  `inset 0 0 0 ${w}px ${c.dark}`,
  `inset ${w * 2}px ${w * 2}px 0 0 ${c.hi}`,
  `inset -${w * 2}px -${w * 2}px 0 0 ${c.lo}`,
  `inset 0 0 0 ${w * 3}px ${c.mid}`,
].join(", ");

// Pattern a scacchiera 2×2 (dithering) per i fondi, nessun gradiente.
export const dither = (a, b, px = 2) =>
  `repeating-conic-gradient(${a} 0% 25%, ${b} 0% 50%) 0 0 / ${px * 2}px ${px * 2}px`;

export const BIOME_THEME = [
  { // 0 · Tabacchitalia Nord — scontrino grigio, luci ciano
    board: "#16211f", board2: "#1b2a28", ink: "#8fb3ad", accent: C.cyan,
    marquee: "#0c1413", title: "TABACCHITALIA NORD", game: "GRATTA NORD DELUXE",
  },
  { // 1 · Centro Slot — velluto viola, luci magenta
    board: "#241230", board2: "#2c173a", ink: "#b98fd0", accent: C.magenta,
    marquee: "#150a1c", title: "CENTRO SLOT(UNICO)", game: "SLOT CENTRO 10",
  },
  { // 2 · Grattanapoli — rosso pomodoro e oro
    board: "#2e140a", board2: "#38190c", ink: "#d8a36a", accent: C.gold,
    marquee: "#1a0b05", title: "GRATTANAPOLI", game: "'O JACKPOT D'ORO",
  },
  { // 3 · Quartiere Cinese — lacca rossa, oro
    board: "#2e0909", board2: "#3a0c0c", ink: "#e39a7a", accent: "#ff5a3a",
    marquee: "#1a0505", title: "QUARTIERE CINESE", game: "DRAGO FORTUNATO 888",
  },
];

// Famiglie di nodo: colore della casella + glifo non cromatico nell'angolo.
export const DANGER = new Set(["ladro", "spacciatore", "miniboss", "poliziotto", "macellaio"]);
export const SAFE = new Set(["locanda", "tabaccaio", "mendicante", "sacerdote", "chirurgo", "maestroTe", "guantaio"]);

export function nodeFamily(node) {
  if (node.type === "boss") return "boss";
  if (node.type === "start") return "start";
  if (node.secret) return "secret";
  if (node.type === "evento") return "event";
  if (DANGER.has(node.type)) return "danger";
  if (SAFE.has(node.type)) return "safe";
  return "neutral";
}

export const FAMILY = {
  danger:  { tile: "#8e1d1d", tile2: "#a42626", glyph: "▲", label: "PERICOLO" },
  safe:    { tile: "#1d6a3a", tile2: "#237d45", glyph: "✚", label: "SICURO" },
  neutral: { tile: "#46307a", tile2: "#533a8e", glyph: "●", label: "NEUTRO" },
  event:   { tile: "#8a2a6a", tile2: "#9e337b", glyph: "?", label: "EVENTO" },
  secret:  { tile: "#5a6068", tile2: "#6c737c", glyph: "✦", label: "SEGRETO" },
  start:   { tile: "#2a3a38", tile2: "#324644", glyph: "►", label: "INGRESSO" },
  boss:    { tile: "#3a0508", tile2: "#520910", glyph: "$", label: "JACKPOT" },
};
