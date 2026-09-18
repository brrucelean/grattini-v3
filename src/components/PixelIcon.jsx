import { memo } from "react";

// ─── PIXEL ICON — icone 12×12 disegnate a mano ───────────────
// Spada (botta), scudo (parata), moneta (premio) per il combattimento.
// SVG con un <rect> per pixel e shape-rendering crispEdges: restano pixel
// netti a qualsiasi scala intera. Solo profilo: si disegnano contorno e
// dettagli (D, G, O) in un unico colore, niente riempimenti.

// Colori originali delle mappe (non usati nella resa a profilo, restano
// come riferimento per quando serviranno icone piene).
export const PAL = {
  D: "#1a1512",   // contorno
  W: "#eef3f6",   // lama, luce
  L: "#9aa6b0",   // lama, ombra
  G: "#d8ad45",   // oro
  g: "#8a6a22",   // oro in ombra
  B: "#2d4f9a",   // blu scudo
  H: "#7ea4ec",   // blu luce
  R: "#6b3a1e",   // impugnatura
  Y: "#e0b64a",   // moneta
  O: "#9a7420",   // moneta in ombra
  S: "#fff1a8",   // moneta, luce
};

const MAPS = {
  sword: [
    "..........DD",
    ".........DWD",
    "........DWLD",
    ".......DWLD.",
    "......DWLD..",
    ".....DWLD...",
    "..D.DWLD....",
    "..DGDLD.....",
    "...DGD......",
    "..DRDGD.....",
    ".DRD..DD....",
    "DGD.........",
  ],
  shield: [
    "DDDDDDDDDDDD",
    "DHHHHGGBBBBD",
    "DHBBBGGBBBBD",
    "DBBBBGGBBBBD",
    "DGGGGGGGGGGD",
    "DgggggGGgggD",
    "DBBBBGGBBBBD",
    ".DBBBGGBBBD.",
    ".DBBBGGBBBD.",
    "..DBBGGBBD..",
    "...DBGGBD...",
    "....DDDD....",
  ],
  coin: [
    "....DDDD....",
    "..DDYYYYDD..",
    ".DYSSYYYYOD.",
    ".DYSOOOOYOD.",
    "DYSOYYYYOYOD",
    "DYYOYYYYOYOD",
    "DYYOYYYYOYOD",
    "DYYOYYYYOYOD",
    ".DYYOOOOYOD.",
    ".DYYYYYYOOD.",
    "..DDOOOODD..",
    "....DDDD....",
  ],
};

export const CATEGORY_ICON = { COMBATTIMENTO: "sword", DIFESA: "shield", DENARO: "coin" };

const LINE = new Set(["D", "G", "O"]);

function PixelIconImpl({ kind = "sword", size = 24, dim = false, color = "currentColor", style }) {
  const map = MAPS[kind] || MAPS.sword;
  const rects = [];
  map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (LINE.has(row[x])) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />);
    }
  });
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} shapeRendering="crispEdges" aria-hidden
      style={{ display: "block", flexShrink: 0, opacity: dim ? 0.55 : 1, ...style }}>
      {rects}
    </svg>
  );
}

export const PixelIcon = memo(PixelIconImpl);
