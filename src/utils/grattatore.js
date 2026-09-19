// ─── USO DEL GRATTATORE EQUIPAGGIATO ─────────────────────────
// Prima questa logica esisteva in tre copie (grattini, combattimento, effetti
// da combattimento), con il log "consumato!" lanciato dentro l'updater.

// Un uso in meno al grattatore equipaggiato: esaurito, esce dall'inventario e
// si sgancia. Funzione pura, da passare a updatePlayer.
export function spendGrattatoreUse(p) {
  const eq = p.equippedGrattatore;
  const g = eq && p.grattatori?.[eq.inventoryIdx];
  if (!g) return p;
  const grattatori = [...p.grattatori];
  const usesLeft = g.usesLeft - 1;
  if (usesLeft <= 0) {
    grattatori.splice(eq.inventoryIdx, 1);
    return {...p, grattatori, equippedGrattatore: null};
  }
  grattatori[eq.inventoryIdx] = {...g, usesLeft};
  return {...p, grattatori, equippedGrattatore: {...eq, usesLeft}};
}

// Il grattatore equipaggiato, se questo è il suo ultimo uso (per il log)
export function grattatoreAtLastUse(p) {
  const eq = p?.equippedGrattatore;
  const g = eq && p.grattatori?.[eq.inventoryIdx];
  return g && g.usesLeft <= 1 ? g : null;
}

// Grattatori con effetto solo in combattimento: non si consumano per carta
// grattata ma quando l'effetto scatta (o a fine fight: la Fascia da Polso sempre,
// il Guanto da BOSS solo dopo il boss). Sui grattini non grattano.
export const COMBAT_ONLY_EFFECTS = new Set(["atkBoost", "widePerfect", "guaranteedParry", "bossShield"]);

// ─── SOLO COMBATTIMENTO: NIENTE GRATTINI ─────────────────────
// Prima un grattatore da combattimento in mano grattava i grattini come un
// Bullone qualsiasi: proteggeva l'unghia e si consumava a fine carta, prima
// ancora di arrivare alla fight. Ora sul grattino non parte la grattata.
// Ritorna il messaggio da mostrare, o null se si può grattare.
export function combatOnlyScratchBlock(g) {
  return g && COMBAT_ONLY_EFFECTS.has(g.effect) ? `Non puoi grattare con ${grattatoreConArticolo(g)}` : null;
}

// Grattatori che si spendono a fine fight: la Fascia da Polso vale per una
// fight intera (vinta o persa), il Guanto da BOSS solo per la boss-fight.
export function grattatoreSpentAtFightEnd(p, { isBoss = false } = {}) {
  const eff = p?.equippedGrattatore?.effect;
  return eff === "widePerfect" || (eff === "bossShield" && isBoss);
}

// ─── AVVISO DI FINE GRATTATORE ───────────────────────────────
// Nomi femminili, per l'articolo e il participio ("la Fascia ... consumata").
const FEMMINILI = new Set(["unghiaFinta", "moneta_argento", "moneta_oro", "chiaveOttone", "monetaCinese", "fasciaPolso"]);

export function grattatoreConArticolo(g) {
  if (!FEMMINILI.has(g.id)) return `il ${g.name}`;
  return /^[aeiouAEIOU]/.test(g.name) ? `l'${g.name}` : `la ${g.name}`;
}

// Testo dell'avviso quando un grattatore finisce. usesLeft = usi rimasti dopo
// la spesa: sopra zero l'effetto della fight è finito ma l'attrezzo resta.
export function grattatoreGoneText(g, usesLeft = 0) {
  if (g.effect === "bossShield" && usesLeft <= 0) return "Il Guanto da BOSS si sgretola in mille pezzi. Ha retto fino all'ultimo.";
  const nome = grattatoreConArticolo(g);
  const soggetto = nome[0].toUpperCase() + nome.slice(1);
  if (usesLeft > 0) return `${soggetto}: effetto finito, ${usesLeft === 1 ? "resta 1 uso" : `restano ${usesLeft} usi`}.`;
  return `${soggetto} si è consumat${FEMMINILI.has(g.id) ? "a" : "o"}.`;
}
