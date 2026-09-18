import { C } from "../../data/theme.js";
import { GRATTATORE_DEFS } from "../../data/items.js";

// ─── STATI ATTIVI DELLA RUN ──────────────────────────────────────
// Stessi stati e stessi testi dell'HUD legacy, ma come dati: la shell desktop
// (RunBar) li disegna a modo suo e l'HUD mobile resta invariato finché non
// migra anche lui. Ordine = priorità di lettura (pericolo prima).
// Ogni voce: key, tip, color, iconId, emoji, label, danger, active, openInventory.
export function getStatusChips(player) {
  const out = [];
  if (player.grattaMania) out.push({
    key: "grattamania", tip: "⚡ GRATTAMANIA — Premi x2 MA ogni grattata fa danni!",
    color: C.red, iconId: "hud-grattamania", emoji: "⚡", label: "MANIA", danger: true,
  });
  if (player.tumore) out.push({
    key: "tumore", tip: "💀 TUMORE AI POLMONI — -5 Fortuna permanente.",
    color: C.red, iconId: "hud-tumore", emoji: "💀", label: "−5F", danger: true,
  });
  if (player.clipViraleActive) out.push({
    key: "clip", tip: "🎬 CLIP VIRALE ATTIVA! Prossima vincita x2!",
    color: C.gold, iconId: "hud-clip", emoji: "🎬", label: "×2", active: true,
  });
  if (player.fortune > 0) out.push({
    key: "fortuna", tip: `🍀 FORTUNA +${player.fortune} — ${player.fortuneTurns} turni rimasti`,
    color: C.green, iconId: "hud-fortuna", emoji: "🍀", label: `+${player.fortune} · ${player.fortuneTurns}t`, active: true,
  });
  if (player.items.includes("cappelloSbirro")) out.push({
    key: "cappello",
    tip: player.cappelloSbirroWorn ? "🎩 INDOSSATO — clicca per toglierlo." : "🎩 In borsa — non ti protegge! Clicca per indossarlo.",
    color: player.cappelloSbirroWorn ? C.gold : C.dim, iconId: "hud-cappello", emoji: "🎩",
    label: player.cappelloSbirroWorn ? "SU" : "GIÙ", active: player.cappelloSbirroWorn, openInventory: true,
  });
  if (player.equippedGrattatore) {
    const g = player.equippedGrattatore;
    out.push({
      key: "grattatore",
      tip: `${g.name} — ${GRATTATORE_DEFS[g.id]?.desc || "grattatore equipaggiato"}\n\n${g.usesLeft} usi rimasti`,
      color: C.cyan, iconId: `item-${g.id}`, emoji: g.emoji, label: String(g.usesLeft),
    });
  }
  if (player.skills?.includes("ambidestri")) out.push({
    key: "ambidestri", tip: "🙌 DOPPIA MANO — gratti con due mani: +5 dita della mano sinistra.",
    color: C.magenta, iconId: null, emoji: "🙌", label: "", active: true,
  });
  (player.relics || []).forEach((r, i) => out.push({
    key: `relic-${i}`, tip: `${r.emoji} ${r.name} — ${r.desc}`,
    color: C.magenta, iconId: `item-${r.id}`, emoji: r.emoji, label: "", active: true,
  }));
  return out;
}
