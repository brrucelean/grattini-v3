import { memo } from "react";

// ─── PIXEL ICON — icone 16×16 disegnate a mano ───────────────
// Spada (botta), scudo (parata), moneta (premio) per il combattimento.
// Sagome monocolore con pochi dettagli in negativo (scanalatura della lama,
// bordo interno dello scudo, anello della moneta), come le icone RPG 16×16:
// diagonali a 45°, forme simmetriche, nessun pixel isolato.
// SVG con un <rect> per pixel e shape-rendering crispEdges: netto a ogni scala.

const MAPS = {
  sword: [
    "..............##",
    ".............###",
    "............#.#.",
    "...........#.#..",
    "..........#.#...",
    ".........#.#....",
    "...#....#.#.....",
    "....#..#.#......",
    ".....####.......",
    "......#.........",
    ".....#.#........",
    "....#...#.......",
    "...#.....#......",
    ".##.............",
    ".##.............",
    "................",
  ],
  shield: [
    "................",
    ".##############.",
    ".#............#.",
    ".#.##########.#.",
    ".#.##########.#.",
    ".#.##########.#.",
    ".#.##########.#.",
    ".#.##########.#.",
    ".#.##########.#.",
    "...#.######.#...",
    "....#.####.#....",
    ".....#.##.#.....",
    "......#..#......",
    ".......##.......",
    "................",
    "................",
  ],
  coin: [
    "................",
    ".....######.....",
    "...##########...",
    "..###......###..",
    "..##..####..##..",
    ".##..######..##.",
    ".##.########.##.",
    ".##.########.##.",
    ".##.########.##.",
    ".##.########.##.",
    ".##..######..##.",
    "..##..####..##..",
    "..###......###..",
    "...##########...",
    ".....######.....",
    "................",
  ],
};

export const CATEGORY_ICON = { COMBATTIMENTO: "sword", DIFESA: "shield", DENARO: "coin" };

function PixelIconImpl({ kind = "sword", size = 24, dim = false, color = "currentColor", style }) {
  const map = MAPS[kind] || MAPS.sword;
  const rects = [];
  map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === "#") rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />);
    }
  });
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} shapeRendering="crispEdges" aria-hidden
      style={{ display: "block", flexShrink: 0, opacity: dim ? 0.55 : 1, ...style }}>
      {rects}
    </svg>
  );
}

export const PixelIcon = memo(PixelIconImpl);
