import { memo } from "react";
import { Asset } from "../Asset.jsx";
import { GOLD, SILVER } from "./mapTheme.js";
import { TOKENS } from "../../data/tokens.js";

// ─── PEDINA — il gettone del giocatore sulla mappa ───────────────
// È il gettone equipaggiato (G-01, docs/G-01-MAP-TOKENS.md). Lo sprite
// `pedina-<id>` si accende da solo tramite Asset quando esiste; fino ad allora
// si disegna il gettone qui sotto: forma, colore e lettera per ogni pedina.

const BLUE = { hi: "#bfe2ff", mid: "#3d8be0", lo: "#1f4f8f", dark: "#0b2244" };
const RED = { hi: "#ffb8a8", mid: "#e04a3a", lo: "#8f2418", dark: "#3d0c06" };
const INK = { hi: "#8a8a92", mid: "#3a3a42", lo: "#1c1c22", dark: "#000000" };
const COPPER = { hi: "#ffd0a0", mid: "#c9703a", lo: "#7e3c16", dark: "#2e1206" };
const IVORY = { hi: "#ffffff", mid: "#e8e0cc", lo: "#a89c80", dark: "#3a3226" };
const GREEN = { hi: "#c8ffb0", mid: "#4fb83a", lo: "#27661c", dark: "#0c2408" };
const PURPLE = { hi: "#e8c0ff", mid: "#9a4ad8", lo: "#55207e", dark: "#1e0830" };
const CYAN = { hi: "#d0ffff", mid: "#3ac8d0", lo: "#1a6e74", dark: "#062628" };
const ORANGE = { hi: "#ffe0a0", mid: "#f08a2a", lo: "#8e4a10", dark: "#301604" };
const MAGENTA = { hi: "#ffc0f0", mid: "#e03ab8", lo: "#7e1a64", dark: "#2c0622" };
const STONE = { hi: "#d8d4cc", mid: "#8e8a82", lo: "#5a5650", dark: "#23211e" };
const GHOST = { hi: "#ffffff88", mid: "#c8d8e866", lo: "#8898a866", dark: "#223344" };
// facce a più colori (fasce a gradini, niente sfumature morbide)
const PEARL = { hi: "#ffffff", mid: "linear-gradient(135deg,#fff4fb 0 30%,#e0fff8 30% 55%,#fff6dc 55% 80%,#ecdcff 80%)", lo: "#b8a8c8", dark: "#4a3a5a" };
const PRISM = { hi: "#ffffff", mid: "linear-gradient(90deg,#ff8a8a 0 33%,#e8f4ff 33% 67%,#8ae8ff 67%)", lo: "#6a8aa8", dark: "#1a2a3a" };
const FILM = { hi: "#ffd8a0", mid: "#3a2a1a", lo: "#1a120a", dark: "#ffb050" };
const MOOD = { hi: "#ffffff", mid: "linear-gradient(90deg,#ff9a4a 0 50%,#4a9aff 50%)", lo: "#2a3a5a", dark: "#10141e" };
const AURA = { hi: "#ffffff", mid: "#9ad8ff", lo: "#3a78a8", dark: "#0a2238" };
const HALFTONE = { hi: "#ffffff", mid: "radial-gradient(circle,#1a1a1a 30%,#f0e8d8 32%) 0 0 / 5px 5px", lo: "#8a8070", dark: "#1a1a1a" };

// Colore di ripiego per rarità, finché un gettone non ha la sua faccia.
const BY_RARITY = { base: GOLD, comune: SILVER, raro: BLUE, maledetto: INK, cianfrusaglia: COPPER };

// shape: "octagon" (gettone da slot) · "chip" (fiche con tacche) · "round"
// (moneta) · "square" (tessera) · "cap" (tappo a corona).
// Lettere e colori sono provvisori: gli sprite `pedina-<id>` arrivano in fase 6.
const FACES = {
  ottone:        { face: "G", c: GOLD,     shape: "octagon" },
  ficheBlu:      { face: "F", c: BLUE,     shape: "chip" },
  monetaVicolo:  { face: "V", c: SILVER,   shape: "round" },
  bigliaBambino: { face: "B", c: CYAN,     shape: "round" },
  telefono:      { face: "T", c: COPPER,   shape: "octagon" },
  magnetica:     { face: "U", c: RED,      shape: "octagon" },
  sassolino:     { face: "S", c: STONE,    shape: "round" },
  dado:          { face: "D", c: IVORY,    shape: "square" },
  santino:       { face: "+", c: IVORY,    shape: "square" },
  ficheTruccata: { face: "T", c: PURPLE,   shape: "chip" },
  mezzoCorno:    { face: "C", c: RED,      shape: "round" },
  denteOro:      { face: "D", c: GOLD,     shape: "round" },
  autoscontro:   { face: "A", c: ORANGE,   shape: "octagon" },
  testaCroce:    { face: "X", c: SILVER,   shape: "round" },
  nero:          { face: "N", c: INK,      shape: "chip" },
  contraffatto:  { face: "$", c: GREEN,    shape: "round" },
  incollata:     { face: "I", c: SILVER,   shape: "round" },
  debito:        { face: "-", c: RED,      shape: "octagon" },
  lira99:        { face: "L", c: SILVER,   shape: "round" },
  invisibile:    { face: "?", c: GHOST,    shape: "round" },
  sorpresina:    { face: "?", c: ORANGE,   shape: "round" },
  ferroStiro:    { face: "F", c: STONE,    shape: "square" },
  spumante:      { face: "*", c: GOLD,     shape: "cap" },
  flipper:       { face: "P", c: MAGENTA,  shape: "round" },
  madreperla:    { face: "M", c: PEARL,    shape: "round" },
  prisma:        { face: "P", c: PRISM,    shape: "octagon" },
  pellicola:     { face: "35", c: FILM,    shape: "square" },
  umore:         { face: "U", c: MOOD,     shape: "round" },
  aura:          { face: "A", c: AURA,     shape: "round" },
  retino:        { face: "R", c: HALFTONE, shape: "square" },
  mercurio:      { face: "Hg", c: SILVER,  shape: "round" },
  vhs:           { face: ">", c: INK,      shape: "square" },
  specchietto:   { face: "<", c: CYAN,     shape: "round" },
};

const pedinaFace = (id) => {
  const f = FACES[id];
  if (f) return f;
  const t = TOKENS[id];
  return { face: (t?.name || "?").replace(/^[^A-Za-z]*(Gettone |Pedina |Tappo )?/, "")[0] || "?", c: BY_RARITY[t?.rarity] || GOLD, shape: "octagon" };
};

const clipFor = (shape, u) => {
  if (shape === "cap") {
    // corona a 12 punte: dentini di un "pixel"
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      const r = i % 2 ? 50 : 50 - u * 1.6;
      pts.push(`${(50 + Math.cos(a) * r).toFixed(1)}% ${(50 + Math.sin(a) * r).toFixed(1)}%`);
    }
    return `polygon(${pts.join(",")})`;
  }
  if (shape === "round") return "circle(50%)";
  if (shape === "square") return "none";
  return `polygon(${u * 2}px 0, calc(100% - ${u * 2}px) 0, 100% ${u * 2}px, 100% calc(100% - ${u * 2}px), calc(100% - ${u * 2}px) 100%, ${u * 2}px 100%, 0 calc(100% - ${u * 2}px), 0 ${u * 2}px)`;
};

function PedinaImpl({ id = "ottone", size = 28 }) {
  const p = pedinaFace(id);
  const name = TOKENS[id]?.name || "Gettone";
  const u = Math.max(2, Math.round(size / 14)); // "pixel" del gettone
  const ghost = TOKENS[id]?.visual === "fantasma"; // Pedina Invisibile: si vede appena
  return (
    <span role="img" aria-label={`Pedina: ${name}`} style={{
      width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center",
      position: "relative", flexShrink: 0, opacity: ghost ? 0.45 : undefined,
    }}>
      <Asset id={`pedina-${id}`} size={size} emoji={
        <span style={{
          width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center",
          background: p.c.mid, color: p.c.dark, position: "relative",
          clipPath: clipFor(p.shape, u),
          boxShadow: `inset 0 0 0 ${u}px ${p.c.dark}, inset ${u * 2}px ${u * 2}px 0 0 ${p.c.hi}, inset -${u * 2}px -${u * 2}px 0 0 ${p.c.lo}`,
          fontSize: Math.round(size * 0.5), fontWeight: "bold", lineHeight: 1,
        }}>
          {/* fiche: anello tratteggiato di tacche bianche */}
          {p.shape === "chip" && (
            <span aria-hidden style={{ position: "absolute", inset: u * 2, border: `${u}px dashed #ffffffcc`, boxSizing: "border-box" }} />
          )}
          <span style={{ position: "relative" }}>{p.face}</span>
        </span>
      } />
    </span>
  );
}

export const Pedina = memo(PedinaImpl);
