// ─── GETTONI DEL DESTINO — logica centrale (G-01) ───────────
// Unico punto in cui un gettone produce effetti. I componenti chiedono qui
// "quanto costa", "quanto vale", "cosa succede entrando/uscendo dal nodo" e
// ricevono numeri già limitati dai tetti di TOKEN_CAPS.
//
// Tutte le funzioni sono pure: prendono lo stato `tokens` (player.tokens) e
// ne restituiscono uno nuovo, senza toccare React. I tiri casuali usano un
// `rng` iniettabile, così i test sono deterministici.
//
// Regola d'oro anti-exploit: gli effetti di un nodo leggono SEMPRE il gettone
// fotografato alla scelta del nodo (`tokens.snapshot`), mai quello equipaggiato.

import {
  TOKENS, TOKEN_RARITY, TOKEN_CAPS, POUCH_SIZE, BASE_TOKEN,
  DANGER_NODES, COMBAT_NODES, NPC_TOKEN_GIFTS, PEDINARO,
} from "../data/tokens.js";
import { rng as defaultRng } from "./random.js";

const num = (id) => TOKENS[id]?.n || {};

// ── Stato ────────────────────────────────────────────────────

export function createTokenState() {
  return {
    equipped: BASE_TOKEN,
    pouch: [BASE_TOKEN],
    charges: {},        // { [biome]: { [tokenId]: usate } }
    npcGifts: {},       // { "sacerdote@0": true }
    acquired: {},       // { [biome]: n } gettoni ottenuti nel bioma (compensazione)
    counters: {
      lockNodes: 0,     // Moneta Incollata: nodi prima di poterla togliere
      calmNodes: 0,     // Ferro da Stiro: nodi di fila senza combattere
      streakType: null, streak: 0, tilt: 0,   // Flipper
      debitoPaid: false,
      shame: {},        // Lira: { [biome]: true }
      fortunePenalty: null, // Santino: { amount, nodes }
      aura: null,       // Aura: { amount, nodes } (+1 dopo una vincita, −1 dopo una sconfitta)
      prismaCrack: 0,   // Prisma: nodi in cui resta incrinato (spento)
      mercNodes: 0,     // Mercurio: nodi dall'ultimo morso
      spumanteBiome: -1, bigliaBiome: -1, // ultimo bioma in cui hanno già dato il loro regalo
    },
    unlocked: [],       // nodi segreti aperti dal Telefono
    snapshot: null,     // { nodeId, tokenId, row, nodeType, rolls, won }
  };
}

// Il gettone i cui effetti valgono adesso: quello fotografato se c'è un nodo
// in corso, altrimenti quello equipaggiato. Il TILT del Flipper spegne tutto.
export function activeToken(ts) {
  if (ts.counters.tilt > 0) return BASE_TOKEN;
  const id = ts.snapshot?.tokenId ?? ts.equipped;
  if (id === "prisma" && ts.counters.prismaCrack > 0) return BASE_TOKEN; // incrinato
  return id;
}

const isActive = (ts, id) => activeToken(ts) === id;
const inPouch = (ts, id) => ts.pouch.includes(id);

export const tokenInfo = (id) => {
  const t = TOKENS[id];
  return t ? { id, ...t, rarityLabel: TOKEN_RARITY[t.rarity].label } : null;
};

// ── Custodia ─────────────────────────────────────────────────

export function canSwapToken(ts) {
  return !ts.snapshot && ts.counters.lockNodes <= 0;
}

// Equipaggia un gettone della custodia. Solo sulla mappa, prima di scegliere.
// Restituisce { state, money } (money > 0 la prima volta della Pedina del Debito).
export function equipToken(ts, id) {
  if (!inPouch(ts, id)) throw new Error(`Gettone non in custodia: ${id}`);
  if (!canSwapToken(ts)) throw new Error("Cambio gettone non consentito ora");
  if (ts.equipped === id) return { state: ts, money: 0 };
  const counters = { ...ts.counters };
  let money = 0;
  if (id === "incollata") counters.lockNodes = num(id).lockNodes;
  if (id === "debito" && !counters.debitoPaid) {
    counters.debitoPaid = true;
    money = num(id).advance;
  }
  return { state: { ...ts, equipped: id, counters }, money };
}

// Buttare: mai l'ultimo, mai quello incollato. Se butti l'equipaggiato si
// equipaggia il primo rimasto.
export function canDiscard(ts, id) {
  if (!inPouch(ts, id) || ts.pouch.length <= 1) return false;
  if (id === ts.equipped && !canSwapToken(ts)) return false;
  return true;
}

export function discardToken(ts, id) {
  if (!canDiscard(ts, id)) throw new Error(`Non puoi buttare: ${id}`);
  const pouch = ts.pouch.filter(t => t !== id);
  const equipped = ts.equipped === id ? pouch[0] : ts.equipped;
  return { ...ts, pouch, equipped };
}

// Rimozione forzata (sequestro, Sorpresina che si apre). Se la custodia resta
// vuota torna l'Ottone.
function removeToken(ts, id) {
  let pouch = ts.pouch.filter(t => t !== id);
  if (pouch.length === 0) pouch = [BASE_TOKEN];
  const equipped = pouch.includes(ts.equipped) ? ts.equipped : pouch[0];
  return { ...ts, pouch, equipped };
}

// Ottenere un gettone. Esiti:
//   "added"     → entrato in custodia
//   "duplicate" → già posseduto, convertito in `money`
//   "full"      → custodia piena: la UI chiede EQUIPAGGIA / CONSERVA / SCAMBIA /
//                 RIFIUTA e chiama resolveFullPouch
export function acquireToken(ts, id, { biome = 0 } = {}) {
  if (!TOKENS[id]) throw new Error(`Gettone sconosciuto: ${id}`);
  if (inPouch(ts, id)) {
    return { state: ts, outcome: "duplicate", money: TOKEN_RARITY[TOKENS[id].rarity].dup };
  }
  if (ts.pouch.length >= POUCH_SIZE) return { state: ts, outcome: "full", money: 0 };
  return { state: markAcquired({ ...ts, pouch: [...ts.pouch, id] }, biome), outcome: "added", money: 0 };
}

// choice: "refuse" | "keep" (butta discardId, conserva il nuovo) |
//         "equip" (butta discardId, equipaggia il nuovo)
export function resolveFullPouch(ts, id, { choice, discardId, biome = 0 }) {
  if (choice === "refuse") return { state: ts, money: 0 };
  const after = discardToken(ts, discardId);
  const added = markAcquired({ ...after, pouch: [...after.pouch, id] }, biome);
  if (choice === "equip") return equipToken(added, id);
  return { state: added, money: 0 };
}

function markAcquired(ts, biome) {
  return { ...ts, acquired: { ...ts.acquired, [biome]: (ts.acquired[biome] || 0) + 1 } };
}

// ── Cariche per bioma ────────────────────────────────────────

export function chargesLeft(ts, id, biome) {
  const max = num(id).charges || 0;
  return Math.max(0, max - (ts.charges[biome]?.[id] || 0));
}

function spendCharge(ts, id, biome) {
  const used = ts.charges[biome]?.[id] || 0;
  return { ...ts, charges: { ...ts.charges, [biome]: { ...ts.charges[biome], [id]: used + 1 } } };
}

// ── Scelta del nodo: la fotografia ──────────────────────────

// Congela il gettone e fa subito tutti i tiri casuali del nodo, così che
// ricaricare o cambiare idea non li ritiri. `map` serve all'Autoscontro.
// Restituisce { state, targetId } — targetId può differire dal nodo scelto
// se l'Autoscontro rimbalza.
export function selectNode(ts, node, { map, rng = defaultRng } = {}) {
  const tokenId = activeToken(ts);
  const rolls = {};
  let targetId = node.id;

  if (tokenId === "autoscontro" && DANGER_NODES.includes(node.type) && map && rng() < num(tokenId).bounceP) {
    const row = map.rows[node.row] || [];
    const sorted = [...row].sort((a, b) => a.x - b.x);
    const i = sorted.findIndex(n => n.id === node.id);
    const near = [sorted[i - 1], sorted[i + 1]].filter(n => n && !n.secret);
    if (near.length) {
      targetId = near[Math.floor(rng() * near.length)].id;
      rolls.bounced = true;
    }
  }
  if (tokenId === "testaCroce") rolls.coin = rng() < 0.5 ? "testa" : "croce";
  if (tokenId === "lira99") rolls.liraAccepted = rng() < num(tokenId).acceptP;
  if (tokenId === "invisibile") rolls.ladroMissed = rng() < num(tokenId).ladroMissP;

  const target = targetId === node.id ? node : (map?.rows[node.row] || []).find(n => n.id === targetId) || node;
  return { state: { ...ts, snapshot: { nodeId: targetId, tokenId, row: target.row, nodeType: target.type, rolls } }, targetId };
}

// ── Prezzi e premi (tetti applicati qui) ────────────────────

// Variazione di prezzo del gettone per un tipo di nodo. Negativo = sconto.
// ctx.card: si sta comprando un grattino (Retino) · ctx.money: soldi in tasca (Umore).
function tokenPriceDelta(ts, kind, ctx = {}) {
  const id = activeToken(ts);
  const n = num(id);
  if (kind === "tabaccaio") {
    if (id === "testaCroce") return ts.snapshot?.rolls.coin === "testa" ? -n.swing : n.swing;
    let d = n.shopDelta || 0;
    if (ctx.card) d += n.cardPriceDelta || 0;
    if (id === "umore" && (ctx.money || 0) > n.richAt) d += n.richShopDelta;
    return d;
  }
  if (kind === "chirurgo" || kind === "macellaio") return n.surgeonDelta || 0;
  return 0;
}

// Moltiplicatore finale di prezzo. `otherDiscount` = sconti da altre fonti
// (bioma, reliquie), positivo. Lo sconto netto non supera maxDiscount.
export function priceMultiplier(ts, kind, { otherDiscount = 0, ...ctx } = {}) {
  const other = isActive(ts, "invisibile") && kind === "tabaccaio" ? 0 : otherDiscount;
  const netDiscount = other - tokenPriceDelta(ts, kind, ctx);
  return 1 - Math.min(TOKEN_CAPS.maxDiscount, netDiscount);
}

export function applyPrice(ts, kind, base, opts) {
  return Math.round(base * priceMultiplier(ts, kind, opts) * 100) / 100;
}

// Moltiplicatore dei premi dei combattimenti, SENZA l'×2 élite (che resta nel
// chiamante). `otherBonus` = bonus da altre fonti. Il bonus netto non supera
// maxMoneyBonus; i malus passano interi.
export function rewardMultiplier(ts, { elite = false, otherBonus = 0, nodeType = ts.snapshot?.nodeType } = {}) {
  const n = num(activeToken(ts));
  let delta = n.combatRewardDelta || 0;
  if (elite) delta += n.eliteRewardDelta || 0;
  if (nodeType === "ladro" || nodeType === "spacciatore") delta += n.dangerRewardDelta || 0; // Pellicola
  return 1 + Math.min(TOKEN_CAPS.maxMoneyBonus, otherBonus + delta);
}

// Costo locanda: fisso + Moneta del Vicolo + Pedina del Debito (quest'ultima
// vale anche solo tenendola in custodia).
export function locandaCost(ts, base) {
  let cost = base;
  if (isActive(ts, "monetaVicolo")) cost += num("monetaVicolo").locandaFlat;
  if (inPouch(ts, "debito")) cost += num("debito").locandaFlat;
  return cost;
}

// Stanza della locanda con gli effetti del gettone: costo (Moneta del Vicolo,
// Debito, Umore) e unghie curate (Sassolino). Solo le stanze a pagamento.
// ctx.pain: quota di unghie sofferenti (0…1).
export function locandaRoom(ts, room, { pain = 0 } = {}) {
  if (!(room.cost > 0)) return room;
  let cost = locandaCost(ts, room.cost);
  const id = activeToken(ts);
  if (id === "umore" && pain > 0) cost = Math.round(cost * (1 + num(id).painLocandaDelta));
  const heals = id === "sassolino" ? Math.max(1, room.heals - num(id).locandaHealLoss) : room.heals;
  const desc = heals < room.heals ? `${room.desc} · Sassolino: 1 unghia in meno` : room.desc;
  return { ...room, cost, heals, desc };
}

export const theftMult = (ts) => num(activeToken(ts)).theftMult ?? 1;

// Premio di un grattino con gli effetti del gettone (Madreperla +15%, Retino
// −10% quando esce il premio massimo). Il bonus non supera il tetto maxMoneyBonus.
export function scratchPrize(ts, prize, { isMax = false } = {}) {
  const n = num(activeToken(ts));
  let delta = n.scratchWinDelta || 0;
  if (n.maxPrizeDelta && isMax) delta += n.maxPrizeDelta;
  return Math.round(prize * (1 + Math.min(TOKEN_CAPS.maxMoneyBonus, delta)));
}

// Vincita al grattino: l'Aura si accende (+1 Fortuna per 2 nodi).
export function onScratchWin(ts, prize) {
  if (!isActive(ts, "aura")) return ts;
  const n = num("aura");
  if (prize < n.winAt) return ts;
  return { ...ts, counters: { ...ts.counters, aura: { amount: n.fortune, nodes: n.nodes, fresh: true } } };
}

// Goccia di Mercurio: il primo colpo di ogni combattimento scivola via.
export const firstHitShield = (ts) => isActive(ts, "mercurio");

// Gettone VHS: riavvolge un combattimento perso (1 per bioma, €10).
// Restituisce { state, cost } oppure null se non si può.
export function rewindCombat(ts, biome, money) {
  if (!isActive(ts, "vhs") || chargesLeft(ts, "vhs", biome) <= 0) return null;
  const cost = num("vhs").rewindCost;
  if (money < cost) return null;
  return { state: spendCharge(ts, "vhs", biome), cost };
}

// ── Mappa ────────────────────────────────────────────────────

export function secretThreshold(ts, base = 2) {
  return Math.max(TOKEN_CAPS.minSecretThreshold, base + (num(activeToken(ts)).secretDelta || 0));
}

// Un nodo segreto è aperto se la Fortuna basta o se il Telefono l'ha aperto.
export const isSecretOpen = (ts, node, fortune, base = 2) =>
  !!node.secret && ((ts?.unlocked || []).includes(node.id) || fortune >= (ts ? secretThreshold(ts, base) : base));

// Il segreto ancora chiuso più vicino, dalla colonna corrente in avanti.
export function telefonoTarget(ts, map, currentRow) {
  for (let r = Math.max(0, currentRow); r < map.rows.length; r++) {
    const n = map.rows[r].find(x => x.secret && !(ts.unlocked || []).includes(x.id));
    if (n) return n;
  }
  return null;
}

// Parametri letti da generateMap (fase 3). Usa l'equipaggiato: la mappa si
// genera sulla mappa, non dentro un nodo.
export function mapGenParams(ts) {
  return { poliziottoChance: ts.equipped === "magnetica" ? num("magnetica").poliziottoChance : 0.07 };
}

// Dopo la generazione: il Gettone Nero trasforma fino a 2 nodi pericolosi in élite.
// Dopo la generazione: il Gettone Nero trasforma fino a 2 nodi pericolosi in
// élite; Madreperla e Spumante fanno comparire un Ladro in più.
const LADRO_SWAPPABLE = ["evento", "mendicante", "chirurgo", "stregone", "zaino", "bambino", "streamer"];
export function onMapGenerated(ts, map, { rng = defaultRng } = {}) {
  const n = num(ts.equipped);
  if (ts.equipped === "nero") {
    const cands = map.rows.slice(3, 9).flat().filter(x => DANGER_NODES.includes(x.type) && !x.elite && !x.secret);
    const chosen = new Set();
    while (chosen.size < Math.min(n.extraElites, cands.length)) {
      chosen.add(cands[Math.floor(rng() * cands.length)].id);
    }
    return { ...map, rows: map.rows.map(row => row.map(x => (chosen.has(x.id) ? { ...x, elite: true } : x))) };
  }
  if (n.extraLadri) {
    const cands = map.rows.slice(2, 9).flat().filter(x => LADRO_SWAPPABLE.includes(x.type) && !x.secret && !x.elite && !x._isVecchio);
    const chosen = new Set();
    while (chosen.size < Math.min(n.extraLadri, cands.length)) {
      chosen.add(cands[Math.floor(rng() * cands.length)].id);
    }
    return { ...map, rows: map.rows.map(row => row.map(x => (chosen.has(x.id) ? { ...x, type: "ladro" } : x))) };
  }
  return map;
}

// Dado Scheggiato: nodi della colonna successiva raggiungibili in più.
// Solo vicini diretti (±1 posizione) delle uscite attuali, niente segreti,
// niente colonna del boss né di convergenza pre-boss.
export function dadoOptions(ts, map, fromNode, biome) {
  if (ts.equipped !== "dado" || ts.snapshot || chargesLeft(ts, "dado", biome) <= 0) return [];
  const { minRow, maxRow } = num("dado");
  if (fromNode.row < minRow || fromNode.row > maxRow) return [];
  const next = [...(map.rows[fromNode.row + 1] || [])].sort((a, b) => a.x - b.x);
  const outs = new Set(map.connections[fromNode.id] || []);
  const idx = next.map((n, i) => (outs.has(n.id) ? i : -1)).filter(i => i >= 0);
  const opts = new Set();
  idx.forEach(i => [i - 1, i + 1].forEach(j => {
    const n = next[j];
    if (n && !outs.has(n.id) && !n.secret && n.type !== "boss") opts.add(n.id);
  }));
  return [...opts];
}

export function rollDado(ts, map, fromNode, targetId, biome) {
  if (!dadoOptions(ts, map, fromNode, biome).includes(targetId)) throw new Error("Percorso del Dado non valido");
  const newMap = {
    rows: map.rows.map(row => row.map(n => (n.id === targetId ? { ...n, elite: true } : n))),
    connections: { ...map.connections, [fromNode.id]: [...map.connections[fromNode.id], targetId] },
  };
  return { state: spendCharge(ts, "dado", biome), map: newMap };
}

// Gettone del Telefono: rivela un nodo nascosto. Anche il numero sbagliato
// consuma carica e €1.
// `targetId`: il segreto da aprire (telefonoTarget). Anche il numero
// sbagliato consuma carica e €1.
export function callTelefono(ts, biome, { rng = defaultRng, targetId = null } = {}) {
  if (ts.equipped !== "telefono" || ts.snapshot || chargesLeft(ts, "telefono", biome) <= 0) {
    throw new Error("Telefono non disponibile");
  }
  const n = num("telefono");
  const revealed = rng() >= n.wrongNumberP;
  let state = spendCharge(ts, "telefono", biome);
  if (revealed && targetId) state = { ...state, unlocked: [...(state.unlocked || []), targetId] };
  return { state, money: -n.cost, revealed };
}

// ── Eventi di nodo ───────────────────────────────────────────

// Fortuna aggiuntiva mentre sei nel nodo (Mezzo Corno, Moneta Incollata,
// penitenza del Santino). `row` = colonna del nodo.
export function fortuneModifier(ts, row = ts.snapshot?.row) {
  const id = activeToken(ts);
  let f = 0;
  if (id === "mezzoCorno" && row != null) f += row % 2 === 0 ? 1 : -1;
  if (id === "incollata") f += num(id).fortune;
  if (id === "prisma" && ts.snapshot?.nodeType === "evento") f += num(id).eventFortune;
  if (ts.counters.fortunePenalty) f += ts.counters.fortunePenalty.amount;
  if (ts.counters.aura) f += ts.counters.aura.amount;
  return f;
}

// Ingresso nel tabaccaio: Lira del '99. Restituisce { state, money, fortune }.
export function onEnterShop(ts, biome) {
  if (!isActive(ts, "lira99")) return { state: ts, money: 0, fortune: 0 };
  const n = num("lira99");
  if (ts.snapshot?.rolls.liraAccepted) return { state: ts, money: n.value, fortune: 0 };
  if (ts.counters.shame[biome]) return { state: ts, money: 0, fortune: 0 };
  const counters = { ...ts.counters, shame: { ...ts.counters.shame, [biome]: true } };
  return { state: { ...ts, counters }, money: 0, fortune: n.shameFortune };
}

// Il Ladro della Pedina Invisibile non ti vede: salta il combattimento.
export const ladroMissed = (ts) => isActive(ts, "invisibile") && !!ts.snapshot?.rolls.ladroMissed;

// Evento negativo (multa, furto, maledizione). Il Santino lo annulla una
// volta per bioma e lascia la penitenza di Fortuna.
export function onNegativeEvent(ts, kind, biome) {
  if (!isActive(ts, "santino") || !["multa", "furto", "maledizione"].includes(kind)) {
    return { state: ts, cancelled: false };
  }
  if (chargesLeft(ts, "santino", biome) <= 0) return { state: ts, cancelled: false };
  const n = num("santino");
  const spent = spendCharge(ts, "santino", biome);
  const counters = { ...spent.counters, fortunePenalty: { amount: n.fortunePenalty, nodes: n.penaltyNodes, fresh: !!spent.snapshot } };
  return { state: { ...spent, counters }, cancelled: true };
}

// Incontro col Poliziotto: il Contraffatto equipaggiato viene sequestrato.
export function onPoliziotto(ts) {
  if (!isActive(ts, "contraffatto")) return { state: ts, fine: 0, seized: false };
  return { state: removeToken(ts, "contraffatto"), fine: num("contraffatto").fine, seized: true };
}

// Esito del combattimento del nodo in corso, letto da onNodeResolved.
// Una sconfitta spegne l'Aura di rosso e incrina il Prisma.
export function markNodeOutcome(ts, won) {
  if (!ts.snapshot) return ts;
  const counters = { ...ts.counters };
  const id = activeToken(ts);
  if (won === false && id === "aura") counters.aura = { amount: -num("aura").fortune, nodes: num("aura").nodes, fresh: true };
  if (won === false && id === "prisma") counters.prismaCrack = num("prisma").crackNodes;
  return { ...ts, counters, snapshot: { ...ts.snapshot, won } };
}

// Fine del nodo, prima del ritorno sulla mappa. `won` solo per i nodi con
// combattimento (di default quello segnato con markNodeOutcome).
// Restituisce { state, money, log[] }.
export function onNodeResolved(ts, node, { won = ts.snapshot?.won ?? null, biome = 0 } = {}) {
  const id = activeToken(ts);
  const n = num(id);
  const counters = { ...ts.counters };
  const log = [];
  let money = 0;
  let nailDamage = 0;
  let confetti = false;

  // Pellicola 35mm: ogni combattimento costa lo sviluppo.
  if (id === "pellicola" && won !== null) { money -= n.combatCost; log.push(`Pellicola 35mm: sviluppo −€${n.combatCost}`); }
  // Tappo di Spumante: primo nodo di ogni bioma.
  if (id === "spumante" && counters.spumanteBiome !== biome) {
    counters.spumanteBiome = biome; money += n.money; confetti = true;
    log.push(`Tappo di Spumante: stappato! +€${n.money}`);
  }
  // Goccia di Mercurio: ogni 5 nodi un'unghia peggiora.
  if (id === "mercurio") {
    counters.mercNodes += 1;
    if (counters.mercNodes >= n.every) { counters.mercNodes = 0; nailDamage = 1; log.push("Goccia di Mercurio: il metallo morde, un'unghia peggiora"); }
  }

  if (id === "monetaVicolo" && won && DANGER_NODES.includes(node.type)) {
    money += n.dangerWinMoney; log.push(`Moneta del Vicolo: +€${n.dangerWinMoney}`);
  }
  if (id === "magnetica") money += n.perNodeMoney;
  if (id === "denteOro" && won === false) {
    money += n.lossMoney; log.push(`Dente d'Oro: €${n.lossMoney}`);
  }

  // Ferro da Stiro: nodi consecutivi senza combattere.
  if (COMBAT_NODES.includes(node.type)) counters.calmNodes = 0;
  else counters.calmNodes += 1;
  if (id === "ferroStiro" && counters.calmNodes > 0 && counters.calmNodes % n.every === 0) {
    money += n.money; log.push(`Ferro da Stiro: ritira €${n.money}`);
  }

  // Flipper: serie di nodi dello stesso tipo. Il TILT scatta a 4 e spegne gli
  // effetti per il nodo successivo.
  const tiltWasOn = counters.tilt > 0;
  counters.streak = node.type === counters.streakType ? counters.streak + 1 : 1;
  counters.streakType = node.type;
  counters.tilt = 0;
  if (id === "flipper" && !tiltWasOn) {
    if (counters.streak === n.comboAt) { money += n.money; log.push(`Flipper: +€${n.money}`); }
    if (counters.streak === n.tiltAt) { counters.tilt = 1; log.push("Flipper: TILT!"); }
  }

  if (counters.lockNodes > 0) counters.lockNodes -= 1;
  // Penitenza del Santino e Aura: valgono per i N nodi SUCCESSIVI. Se sono
  // nate in questo nodo (fresh) non si scalano ancora.
  const tick = (c) => (!c ? null : c.fresh ? { ...c, fresh: false } : c.nodes - 1 > 0 ? { ...c, nodes: c.nodes - 1 } : null);
  counters.fortunePenalty = tick(counters.fortunePenalty);
  counters.aura = tick(counters.aura);
  if (counters.prismaCrack > 0 && ts.snapshot?.won !== false) counters.prismaCrack -= 1;

  return { state: { ...ts, counters }, money, log, nailDamage, confetti };
}

// Ritorno sulla mappa: si scongela il gettone.
export const returnToMap = (ts) => ({ ...ts, snapshot: null });

// ── Bioma e boss ─────────────────────────────────────────────

// Ingresso in un nuovo bioma. `ticketCount` = biglietti nello zaino.
export function onEnterBiome(ts, { ticketCount = 0 } = {}) {
  const id = ts.equipped;
  return {
    state: ts,
    loseRandomTicket: id === "bigliaBambino" && ticketCount >= num(id).ticketLimit,
    confetti: id === "spumante",
    firstEventBonusTicket: id === "bigliaBambino",
  };
}

// Biglia del Bambino: al primo evento del bioma arriva anche un grattino base.
export function claimBigliaTicket(ts, biome) {
  if (!isActive(ts, "bigliaBambino") || ts.counters.bigliaBiome === biome) return { state: ts, give: false };
  return { state: { ...ts, counters: { ...ts.counters, bigliaBiome: biome } }, give: true };
}

// Boss battuto: la Sorpresina si apre in un Comune o Raro non posseduto.
export function onBossDefeated(ts, { rng = defaultRng } = {}) {
  if (!inPouch(ts, "sorpresina")) return { state: ts, opened: null };
  const pool = Object.keys(TOKENS).filter(id =>
    ["comune", "raro"].includes(TOKENS[id].rarity) && !inPouch(ts, id));
  if (!pool.length) return { state: ts, opened: null };
  const opened = pool[Math.floor(rng() * pool.length)];
  const pouch = ts.pouch.map(t => (t === "sorpresina" ? opened : t));
  const equipped = ts.equipped === "sorpresina" ? opened : ts.equipped;
  return { state: { ...ts, pouch, equipped }, opened };
}


// ── Pedinaro, regali, compensazione ─────────────────────────

// Due gettoni diversi non posseduti, pescati per rarità. Il primo è in
// vendita, il secondo in baratto. Rarità esaurite: il peso si ridistribuisce.
// `pool` = gettoni ammessi (in gioco: TOKEN_RELEASE).
export function pedinaroOffer(ts, { rng = defaultRng, pool = Object.keys(TOKENS) } = {}) {
  const taken = new Set(ts.pouch);
  const offer = [];
  for (let k = 0; k < 2; k++) {
    const byRarity = {};
    pool.forEach(id => {
      const t = TOKENS[id];
      if (t.rarity !== "base" && !taken.has(id)) (byRarity[t.rarity] ||= []).push(id);
    });
    const rarities = Object.keys(byRarity);
    if (!rarities.length) break;
    const total = rarities.reduce((s, r) => s + TOKEN_RARITY[r].weight, 0);
    let r = rng() * total;
    let rarity = rarities[rarities.length - 1];
    for (const cand of rarities) { r -= TOKEN_RARITY[cand].weight; if (r < 0) { rarity = cand; break; } }
    const list = byRarity[rarity];
    const id = list[Math.floor(rng() * list.length)];
    offer.push(id);
    taken.add(id);
  }
  return {
    sale: offer[0] ? { id: offer[0], price: TOKEN_RARITY[TOKENS[offer[0]].rarity].price } : null,
    barter: offer[1] ? { id: offer[1] } : null,
  };
}

// Apertura della bottega. L'offerta si tira UNA volta per visita (ricaricare
// non la cambia). Prima visita della run con il solo Ottone in custodia: uno
// dei due è in regalo.
export function openPedinaro(ts, { rng = defaultRng, pool } = {}) {
  const offer = pedinaroOffer(ts, { rng, pool });
  const first = !ts.counters.metPedinaro;
  const gift = first && ts.pouch.length === 1 && ts.pouch[0] === BASE_TOKEN;
  return {
    state: { ...ts, counters: { ...ts.counters, metPedinaro: true } },
    visit: { ...offer, first, gift, done: {} },
  };
}

// Prezzo di baratto: il gettone dato deve valere almeno il 60% di quello preso.
export const barterNeed = (wantId) => Math.ceil(TOKEN_RARITY[TOKENS[wantId].rarity].price * PEDINARO.barterRatio);
export const canBarterWith = (giveId, wantId) => giveId !== BASE_TOKEN && barterValue(giveId) >= barterNeed(wantId);

// Baratto gettone contro gettone: il dato esce, il preso entra al suo posto
// (e diventa pedina se il dato lo era). La custodia non si riempie mai.
export function barterToken(ts, giveId, wantId, { biome = 0 } = {}) {
  if (!inPouch(ts, giveId) || inPouch(ts, wantId)) throw new Error("Baratto non valido");
  if (!canBarterWith(giveId, wantId)) throw new Error("Non basta per il baratto");
  if (giveId === ts.equipped && !canSwapToken(ts)) throw new Error("Pedina bloccata");
  const pouch = ts.pouch.map(t => (t === giveId ? wantId : t));
  const equipped = ts.equipped === giveId ? wantId : ts.equipped;
  return markAcquired({ ...ts, pouch, equipped }, biome);
}

// Valore di un gettone offerto in baratto (il Contraffatto vale il triplo).
export function barterValue(id) {
  const base = TOKEN_RARITY[TOKENS[id].rarity].price;
  return id === "contraffatto" ? base * num(id).barterMult : base;
}

// Regalo di un NPC: una volta per NPC e bioma. Restituisce l'id o null.
export function claimNpcGift(ts, npc, biome) {
  const id = NPC_TOKEN_GIFTS[npc];
  const key = `${npc}@${biome}`;
  if (!id || ts.npcGifts[key]) return { state: ts, tokenId: null };
  return { state: { ...ts, npcGifts: { ...ts.npcGifts, [key]: true } }, tokenId: id };
}

// Compensazione: nessun gettone ottenuto nel bioma → il boss offre 2 comuni.
export const needsCompensation = (ts, biome) => !(ts.acquired[biome] > 0);

export function compensationOffer(ts, { rng = defaultRng, pool: allowed = Object.keys(TOKENS) } = {}) {
  const pool = allowed.filter(id => TOKENS[id].rarity === "comune" && !inPouch(ts, id));
  const out = [];
  while (out.length < Math.min(2, pool.length)) {
    const id = pool[Math.floor(rng() * pool.length)];
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

// Un gettone a caso tra quelli ammessi e non posseduti (drop da zaino,
// compensazione del boss finché non c'è la scelta). null se non ce n'è.
export function randomDrop(ts, { rng = defaultRng, pool = Object.keys(TOKENS) } = {}) {
  const cands = pool.filter(id => TOKENS[id].rarity !== "base" && !inPouch(ts, id));
  return cands.length ? cands[Math.floor(rng() * cands.length)] : null;
}

// Metagame: aggiunge al catalogo scoperto (senza duplicati).
export const addToCatalog = (catalog = [], id) => (catalog.includes(id) ? catalog : [...catalog, id]);

