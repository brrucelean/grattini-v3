// Test del nucleo logico dei Gettoni del Destino (G-01).
// Eseguire con: npm test

import test from "node:test";
import assert from "node:assert/strict";

import { TOKENS, TOKEN_RARITY, POUCH_SIZE, TOKEN_CAPS } from "../src/data/tokens.js";
import {
  createTokenState, activeToken, canSwapToken, equipToken, canDiscard, discardToken,
  acquireToken, resolveFullPouch, chargesLeft, selectNode, returnToMap,
  priceMultiplier, rewardMultiplier, locandaCost, secretThreshold,
  onMapGenerated, dadoOptions, rollDado, callTelefono, fortuneModifier,
  onEnterShop, onNegativeEvent, onPoliziotto, onNodeResolved, onBossDefeated,
  pedinaroOffer, barterValue, claimNpcGift, needsCompensation, compensationOffer,
  mapGenParams, ladroMissed, markNodeOutcome, randomDrop, theftMult,
} from "../src/utils/tokens.js";
import { TOKEN_RELEASE, TOKEN_TAGS } from "../src/data/tokens.js";
import { generateMap } from "../src/utils/map.js";
import { TOKEN_VISUALS } from "../src/components/tokens/tokenVisuals.js";

// rng deterministico (mulberry32)
const seeded = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const fixed = (v) => () => v;

// Stato con custodia data ed equipaggiato dato, senza passare da acquire.
const withPouch = (pouch, equipped = pouch[0]) => ({ ...createTokenState(), pouch, equipped });

const tabaccaio = { id: "n1", type: "tabaccaio", row: 2, x: 0.5 };
const ladro = { id: "n2", type: "ladro", row: 3, x: 0.14 };

// ── Catalogo ─────────────────────────────────────────────────

test("catalogo: 33 gettoni, rarità valide, schede complete", () => {
  const ids = Object.keys(TOKENS);
  assert.equal(ids.length, 33);
  for (const id of ids) {
    const t = TOKENS[id];
    assert.ok(TOKEN_RARITY[t.rarity], `${id}: rarità ${t.rarity}`);
    for (const k of ["name", "pro", "contro", "quando"]) assert.ok(t[k], `${id}: manca ${k}`);
  }
});

// ── Custodia ─────────────────────────────────────────────────

test("inizio run: solo l'Ottone, equipaggiato, occupa un posto", () => {
  const ts = createTokenState();
  assert.deepEqual(ts.pouch, ["ottone"]);
  assert.equal(ts.equipped, "ottone");
});

test("acquisizione: aggiunta, duplicato in denaro, custodia piena", () => {
  let ts = createTokenState();
  let r = acquireToken(ts, "ficheBlu");
  assert.equal(r.outcome, "added");
  ts = r.state;
  r = acquireToken(ts, "ficheBlu");
  assert.equal(r.outcome, "duplicate");
  assert.equal(r.money, TOKEN_RARITY.comune.dup);
  ts = acquireToken(ts, "santino").state;
  assert.equal(ts.pouch.length, POUCH_SIZE);
  r = acquireToken(ts, "dado");
  assert.equal(r.outcome, "full");
  assert.equal(r.state, ts);
});

test("custodia piena: rifiuta, conserva buttando l'Ottone, equipaggia", () => {
  const full = withPouch(["ottone", "ficheBlu", "santino"]);
  assert.equal(resolveFullPouch(full, "dado", { choice: "refuse" }).state, full);

  const kept = resolveFullPouch(full, "dado", { choice: "keep", discardId: "ottone" }).state;
  assert.deepEqual(kept.pouch, ["ficheBlu", "santino", "dado"]);
  assert.equal(kept.equipped, "ficheBlu", "buttato l'equipaggiato → primo rimasto");

  const eq = resolveFullPouch(full, "dado", { choice: "equip", discardId: "santino" }).state;
  assert.equal(eq.equipped, "dado");
  assert.equal(eq.pouch.length, 3);
});

test("non si butta l'ultimo gettone", () => {
  const ts = withPouch(["ficheBlu"]);
  assert.equal(canDiscard(ts, "ficheBlu"), false);
  assert.throws(() => discardToken(ts, "ficheBlu"));
});

test("sequestro dell'unico gettone: torna l'Ottone", () => {
  const ts = withPouch(["contraffatto"]);
  const r = onPoliziotto(ts);
  assert.equal(r.seized, true);
  assert.equal(r.fine, 20);
  assert.deepEqual(r.state.pouch, ["ottone"]);
  assert.equal(r.state.equipped, "ottone");
});

// ── Fotografia e blocco ─────────────────────────────────────

test("dopo la scelta del nodo il gettone è bloccato e fotografato", () => {
  let ts = withPouch(["ficheBlu", "ficheTruccata"]);
  ts = selectNode(ts, tabaccaio).state;
  assert.equal(canSwapToken(ts), false);
  assert.throws(() => equipToken(ts, "ficheTruccata"));
  // anche forzando equipped, gli effetti leggono la fotografia
  const hacked = { ...ts, equipped: "ficheTruccata" };
  assert.equal(activeToken(hacked), "ficheBlu");
  assert.equal(priceMultiplier(hacked, "tabaccaio"), 0.9);
  ts = returnToMap(ts);
  assert.equal(canSwapToken(ts), true);
});

test("i tiri casuali si fanno alla scelta e restano fissi", () => {
  let ts = withPouch(["testaCroce"]);
  ts = selectNode(ts, tabaccaio, { rng: fixed(0.1) }).state;
  assert.equal(ts.snapshot.rolls.coin, "testa");
  assert.equal(priceMultiplier(ts, "tabaccaio"), 0.8);
  assert.equal(priceMultiplier(ts, "tabaccaio"), 0.8, "stesso risultato a ogni lettura");
  const croce = selectNode(withPouch(["testaCroce"]), tabaccaio, { rng: fixed(0.9) }).state;
  assert.equal(priceMultiplier(croce, "tabaccaio"), 1.2);
});

test("Moneta Incollata: non si toglie per 3 nodi", () => {
  let ts = withPouch(["incollata", "ottone"], "ottone");
  ts = equipToken(ts, "incollata").state;
  assert.equal(canSwapToken(ts), false);
  assert.equal(canDiscard(ts, "incollata"), false);
  for (let i = 0; i < 3; i++) {
    ts = selectNode(ts, tabaccaio).state;
    ts = returnToMap(onNodeResolved(ts, tabaccaio).state);
  }
  assert.equal(canSwapToken(ts), true);
  assert.equal(fortuneModifier(ts, 2), 1);
});

// ── Tetti ────────────────────────────────────────────────────

test("sconto complessivo mai oltre il 35%", () => {
  const ts = selectNode(withPouch(["testaCroce"]), tabaccaio, { rng: fixed(0.1) }).state;
  // −20% del gettone + 30% da altre fonti = 50% → tagliato a 35%
  assert.equal(priceMultiplier(ts, "tabaccaio", { otherDiscount: 0.30 }), 1 - TOKEN_CAPS.maxDiscount);
});

test("i rincari passano interi anche con sconti esterni", () => {
  const ts = withPouch(["ficheTruccata"]);
  assert.ok(Math.abs(priceMultiplier(ts, "tabaccaio", { otherDiscount: 0.10 }) - 1.05) < 1e-9);
});

test("Pedina Invisibile annulla gli sconti esterni al tabaccaio", () => {
  const ts = withPouch(["invisibile"]);
  assert.equal(priceMultiplier(ts, "tabaccaio", { otherDiscount: 0.10 }), 1);
});

test("bonus premi mai oltre +50%; Gettone Nero = ×3 sull'élite", () => {
  const nero = withPouch(["nero"]);
  assert.equal(rewardMultiplier(nero, { elite: true }), 1.5);
  assert.equal(rewardMultiplier(nero, { elite: true }) * 2, 3, "sopra l'×2 élite");
  assert.equal(rewardMultiplier(nero, { elite: true, otherBonus: 0.4 }), 1 + TOKEN_CAPS.maxMoneyBonus);
  assert.equal(rewardMultiplier(nero, { elite: false }), 1);
  assert.equal(rewardMultiplier(withPouch(["ficheBlu"])), 0.9);
});

test("soglia nodi segreti mai sotto 1", () => {
  const ts = withPouch(["ficheTruccata"]);
  assert.equal(secretThreshold(ts, 2), 1);
  assert.equal(secretThreshold(ts, 1), 1);
  assert.equal(secretThreshold(createTokenState(), 2), 2);
});

// ── Effetti di nodo ─────────────────────────────────────────

test("Moneta del Vicolo e Pedina del Debito sulla locanda", () => {
  assert.equal(locandaCost(withPouch(["monetaVicolo"]), 20), 25);
  // il Debito pesa anche solo in custodia
  assert.equal(locandaCost(withPouch(["ottone", "debito"], "ottone"), 20), 30);
  assert.equal(locandaCost(withPouch(["monetaVicolo", "debito"]), 20), 35);
});

test("Pedina del Debito: anticipo solo alla prima equipaggiata", () => {
  let ts = withPouch(["ottone", "debito"], "ottone");
  let r = equipToken(ts, "debito");
  assert.equal(r.money, 30);
  ts = equipToken(r.state, "ottone").state;
  r = equipToken(ts, "debito");
  assert.equal(r.money, 0);
});

test("Moneta del Vicolo: +€8 solo su nodo pericoloso vinto", () => {
  const ts = withPouch(["monetaVicolo"]);
  assert.equal(onNodeResolved(ts, ladro, { won: true }).money, 8);
  assert.equal(onNodeResolved(ts, ladro, { won: false }).money, 0);
  assert.equal(onNodeResolved(ts, tabaccaio).money, 0);
});

test("Santino: una carica per bioma, poi penitenza di 3 nodi", () => {
  let ts = withPouch(["santino"]);
  let r = onNegativeEvent(ts, "furto", 0);
  assert.equal(r.cancelled, true);
  ts = r.state;
  assert.equal(onNegativeEvent(ts, "multa", 0).cancelled, false, "carica finita nel bioma");
  assert.equal(onNegativeEvent(ts, "multa", 1).cancelled, true, "nuovo bioma, nuova carica");
  assert.equal(fortuneModifier(ts, 2), -1);
  for (let i = 0; i < 3; i++) ts = onNodeResolved(ts, tabaccaio).state;
  assert.equal(fortuneModifier(ts, 2), 0);
});

test("cariche non ripristinate cambiando gettone", () => {
  let ts = withPouch(["santino", "ottone"]);
  ts = onNegativeEvent(ts, "furto", 0).state;
  ts = equipToken(ts, "ottone").state;
  ts = equipToken(ts, "santino").state;
  assert.equal(chargesLeft(ts, "santino", 0), 0);
});

test("Mezzo Corno: pari +1, dispari −1", () => {
  const ts = withPouch(["mezzoCorno"]);
  assert.equal(fortuneModifier(ts, 4), 1);
  assert.equal(fortuneModifier(ts, 5), -1);
});

test("Lira del '99: accettata, altrimenti umiliazione una volta per bioma", () => {
  const ok = selectNode(withPouch(["lira99"]), tabaccaio, { rng: fixed(0.01) }).state;
  assert.equal(onEnterShop(ok, 0).money, 20);
  let ts = selectNode(withPouch(["lira99"]), tabaccaio, { rng: fixed(0.9) }).state;
  let r = onEnterShop(ts, 0);
  assert.equal(r.fortune, -1);
  r = onEnterShop(r.state, 0);
  assert.equal(r.fortune, 0);
});

test("Pedina Invisibile: il ladro può non vederti", () => {
  const ts = selectNode(withPouch(["invisibile"]), ladro, { rng: fixed(0.05) }).state;
  assert.equal(ladroMissed(ts), true);
  const seen = selectNode(withPouch(["invisibile"]), ladro, { rng: fixed(0.5) }).state;
  assert.equal(ladroMissed(seen), false);
});

test("Ferro da Stiro: €20 ogni 5 nodi senza combattere, reset al combattimento", () => {
  let ts = withPouch(["ferroStiro"]);
  let total = 0;
  for (let i = 0; i < 5; i++) { const r = onNodeResolved(ts, tabaccaio); ts = r.state; total += r.money; }
  assert.equal(total, 20);
  ts = onNodeResolved(ts, ladro, { won: true }).state;
  assert.equal(ts.counters.calmNodes, 0);
});

test("Flipper: +€15 al terzo uguale, TILT al quarto spegne il nodo dopo", () => {
  let ts = withPouch(["flipper"]);
  const moneys = [];
  for (let i = 0; i < 4; i++) {
    ts = selectNode(ts, tabaccaio).state;
    const r = onNodeResolved(ts, tabaccaio);
    moneys.push(r.money);
    ts = returnToMap(r.state);
  }
  assert.deepEqual(moneys, [0, 0, 15, 0]);
  assert.equal(ts.counters.tilt, 1);
  assert.equal(activeToken(ts), "ottone");
  ts = selectNode(ts, tabaccaio).state;
  assert.equal(ts.snapshot.tokenId, "ottone");
  ts = returnToMap(onNodeResolved(ts, tabaccaio).state);
  assert.equal(activeToken(ts), "flipper");
});

test("Autoscontro: rimbalzo su un vicino della stessa colonna", () => {
  const map = { rows: [[], [], [], [
    { id: "a", type: "tabaccaio", row: 3, x: 0.14 },
    { id: "b", type: "ladro", row: 3, x: 0.32 },
    { id: "c", type: "locanda", row: 3, x: 0.68 },
  ]], connections: {} };
  const ts = withPouch(["autoscontro"]);
  const r = selectNode(ts, map.rows[3][1], { map, rng: fixed(0.1) });
  assert.ok(["a", "c"].includes(r.targetId));
  assert.equal(r.state.snapshot.nodeId, r.targetId);
  assert.equal(selectNode(ts, map.rows[3][1], { map, rng: fixed(0.9) }).targetId, "b");
});

test("Telefono: costa €1, consuma la carica anche col numero sbagliato", () => {
  const ts = withPouch(["telefono"]);
  const wrong = callTelefono(ts, 0, { rng: fixed(0.1) });
  assert.equal(wrong.revealed, false);
  assert.equal(wrong.money, -1);
  assert.throws(() => callTelefono(wrong.state, 0));
  assert.equal(callTelefono(ts, 0, { rng: fixed(0.9) }).revealed, true);
});

test("Sorpresina si apre in un comune o raro non posseduto", () => {
  const ts = withPouch(["sorpresina", "ficheBlu"], "sorpresina");
  const r = onBossDefeated(ts, { rng: seeded(3) });
  assert.ok(r.opened);
  assert.ok(["comune", "raro"].includes(TOKENS[r.opened].rarity));
  assert.notEqual(r.opened, "ficheBlu");
  assert.equal(r.state.equipped, r.opened);
  assert.ok(!r.state.pouch.includes("sorpresina"));
});

test("Pedina Magnetica raddoppia il Poliziotto nelle nuove mappe", () => {
  assert.equal(mapGenParams(withPouch(["magnetica"])).poliziottoChance, 0.14);
  assert.equal(mapGenParams(createTokenState()).poliziottoChance, 0.07);
});

// ── Pedinaro, regali, compensazione ─────────────────────────

test("Pedinaro: due gettoni diversi non posseduti, mai l'Ottone", () => {
  const rng = seeded(42);
  for (let i = 0; i < 500; i++) {
    const ts = withPouch(["ottone", "ficheBlu", "dado"]);
    const { sale, barter } = pedinaroOffer(ts, { rng });
    assert.ok(sale && barter);
    assert.notEqual(sale.id, barter.id);
    for (const id of [sale.id, barter.id]) {
      assert.ok(!ts.pouch.includes(id));
      assert.notEqual(TOKENS[id].rarity, "base");
    }
    assert.equal(sale.price, TOKEN_RARITY[TOKENS[sale.id].rarity].price);
  }
});

test("Pedinaro: distribuzione vicina ai pesi 55/25/8/12", () => {
  const rng = seeded(7);
  const count = {};
  const N = 20000;
  for (let i = 0; i < N; i++) {
    const { sale } = pedinaroOffer(createTokenState(), { rng });
    const r = TOKENS[sale.id].rarity;
    count[r] = (count[r] || 0) + 1;
  }
  const expect = { comune: 0.55, raro: 0.25, maledetto: 0.08, cianfrusaglia: 0.12 };
  for (const [r, p] of Object.entries(expect)) {
    assert.ok(Math.abs(count[r] / N - p) < 0.02, `${r}: ${(count[r] / N).toFixed(3)}`);
  }
});

test("Contraffatto vale il triplo nel baratto", () => {
  assert.equal(barterValue("contraffatto"), TOKEN_RARITY.maledetto.price * 3);
  assert.equal(barterValue("ficheBlu"), TOKEN_RARITY.comune.price);
});

test("regali NPC: una volta per NPC e bioma", () => {
  let ts = createTokenState();
  let r = claimNpcGift(ts, "sacerdote", 0);
  assert.equal(r.tokenId, "santino");
  ts = r.state;
  assert.equal(claimNpcGift(ts, "sacerdote", 0).tokenId, null);
  assert.equal(claimNpcGift(ts, "sacerdote", 1).tokenId, "santino");
  assert.equal(claimNpcGift(ts, "nessuno", 0).tokenId, null);
});

test("compensazione se nel bioma non hai ottenuto niente", () => {
  let ts = createTokenState();
  assert.equal(needsCompensation(ts, 0), true);
  const offer = compensationOffer(ts, { rng: seeded(1) });
  assert.equal(offer.length, 2);
  assert.ok(offer.every(id => TOKENS[id].rarity === "comune"));
  ts = acquireToken(ts, "ficheBlu", { biome: 0 }).state;
  assert.equal(needsCompensation(ts, 0), false);
  assert.equal(needsCompensation(ts, 1), true);
});

// ── Mappa: Dado e Gettone Nero su migliaia di mappe ─────────

const reachableFromStart = (map) => {
  const seen = new Set(["r0c0"]);
  const stack = ["r0c0"];
  while (stack.length) {
    const id = stack.pop();
    for (const nx of map.connections[id] || []) if (!seen.has(nx)) { seen.add(nx); stack.push(nx); }
  }
  return seen;
};
const reachesBoss = (map, id, memo = new Map()) => {
  if (id === "boss") return true;
  if (memo.has(id)) return memo.get(id);
  const ok = (map.connections[id] || []).some(nx => reachesBoss(map, nx, memo));
  memo.set(id, ok);
  return ok;
};

test("Dado su 2000 mappe: arco solo verso la colonna dopo, grafo intatto", () => {
  const rng = seeded(99);
  let used = 0;
  for (let i = 0; i < 2000; i++) {
    const biome = i % 4;
    const map = generateMap(biome);
    const all = map.rows.flat();
    const byId = Object.fromEntries(all.map(n => [n.id, n]));
    const from = all[Math.floor(rng() * all.length)];
    const ts = withPouch(["dado"]);
    const opts = dadoOptions(ts, map, from, biome);
    for (const id of opts) {
      assert.equal(byId[id].row, from.row + 1);
      assert.ok(byId[id].row <= 8, "mai verso convergenza pre-boss o boss");
      assert.ok(!byId[id].secret);
    }
    if (!opts.length) continue;
    used++;
    const target = opts[Math.floor(rng() * opts.length)];
    const r = rollDado(ts, map, from, target, biome);
    assert.ok(r.map.connections[from.id].includes(target));
    assert.equal(r.map.rows.flat().find(n => n.id === target).elite, true);
    assert.equal(chargesLeft(r.state, "dado", biome), 0);
    assert.deepEqual(dadoOptions(r.state, r.map, from, biome), []);
    // tutto ciò che era raggiungibile lo resta, e ogni nodo raggiungibile arriva al boss
    const before = reachableFromStart(map);
    const after = reachableFromStart(r.map);
    for (const id of before) assert.ok(after.has(id));
    const memo = new Map();
    for (const id of after) assert.ok(reachesBoss(r.map, id, memo), `${id} non arriva al boss`);
  }
  assert.ok(used > 500, `Dado usabile in poche mappe: ${used}`);
});

test("Dado: non utilizzabile durante un nodo o senza equipaggiarlo", () => {
  const map = generateMap(0);
  const from = map.rows[2][0];
  const inNode = selectNode(withPouch(["dado"]), from).state;
  assert.deepEqual(dadoOptions(inNode, map, from, 0), []);
  assert.deepEqual(dadoOptions(withPouch(["ottone", "dado"], "ottone"), map, from, 0), []);
});

test("Gettone Nero su 1000 mappe: al massimo 2 élite pericolosi in più", () => {
  const rng = seeded(5);
  const ts = withPouch(["nero"]);
  for (let i = 0; i < 1000; i++) {
    const map = generateMap(i % 4);
    const before = map.rows.flat().filter(n => n.elite).length;
    const out = onMapGenerated(ts, map, { rng });
    const added = out.rows.flat().filter(n => n.elite && !map.rows.flat().find(m => m.id === n.id).elite);
    assert.ok(added.length <= 2);
    assert.ok(added.every(n => ["ladro", "miniboss", "spacciatore", "poliziotto"].includes(n.type)));
    assert.equal(out.rows.flat().filter(n => n.elite).length, before + added.length);
    assert.equal(out.connections, map.connections);
  }
  const plain = generateMap(0);
  assert.equal(onMapGenerated(createTokenState(), plain), plain);
});

// ── Fase 3: collegamento al gioco ───────────────────────────

test("esito del combattimento segnato sul nodo: Moneta del Vicolo lo legge da sola", () => {
  let ts = selectNode(withPouch(["monetaVicolo"]), ladro).state;
  ts = markNodeOutcome(ts, true);
  assert.equal(onNodeResolved(ts, ladro).money, 8);
  const lost = markNodeOutcome(selectNode(withPouch(["monetaVicolo"]), ladro).state, false);
  assert.equal(onNodeResolved(lost, ladro).money, 0);
  assert.equal(markNodeOutcome(createTokenState(), true).snapshot, null, "fuori da un nodo non fa nulla");
});

test("drop: mai l'Ottone, mai già posseduti", () => {
  const rng = seeded(11);
  for (let i = 0; i < 200; i++) {
    const id = randomDrop(withPouch(["ottone", "ficheBlu"]), { rng, pool: TOKEN_RELEASE });
    assert.ok(id && id !== "ottone" && id !== "ficheBlu", id);
  }
  assert.equal(randomDrop(withPouch(["ficheBlu", "monetaVicolo"]), { pool: ["ottone", "ficheBlu", "monetaVicolo"] }), null);
});

test("gettoni rilasciati: esistono tutti nel catalogo", () => {
  for (const id of TOKEN_RELEASE) assert.ok(TOKENS[id], id);
});

test("ogni gettone ha le sue etichette; niente gettoni inutili", () => {
  for (const id of Object.keys(TOKENS)) {
    assert.ok(Array.isArray(TOKEN_TAGS[id]), `${id}: etichette mancanti`);
    if (id !== "ottone") assert.ok(TOKEN_TAGS[id].includes("utile"), `${id}: deve servire a qualcosa`);
  }
  for (const gone of ["ritenta", "ficheBucata", "chiaveCasa"]) assert.equal(TOKENS[gone], undefined);
});

test("Specchietto: tabaccai −15% dalla logica esistente", () => {
  assert.ok(Math.abs(priceMultiplier(withPouch(["specchietto"]), "tabaccaio") - 0.85) < 1e-9);
});

test("ogni gettone visivo ha la sua ricetta grafica", () => {
  for (const [id, t] of Object.entries(TOKENS)) {
    if (t.visual) assert.ok(TOKEN_VISUALS[t.visual], `${id}: manca l'effetto "${t.visual}"`);
  }
  for (const gone of ["psichedelica", "occhiali3d", "noir", "zecchino"]) assert.equal(TOKENS[gone], undefined);
});

// ── Fase 4: il Pedinaro ─────────────────────────────────────────
import { openPedinaro, barterToken, barterNeed, canBarterWith } from "../src/utils/tokens.js";

test("Pedinaro: uno per mappa, tra le colonne 4 e 7, su 2000 mappe", () => {
  for (let i = 0; i < 2000; i++) {
    const peds = generateMap(i % 4).rows.flat().filter(n => n.type === "pedinaro");
    assert.equal(peds.length, 1);
    assert.ok(peds[0].row >= 3 && peds[0].row <= 8);
  }
});

test("Pedinaro: regalo solo alla prima visita con il solo Ottone", () => {
  const first = openPedinaro(createTokenState(), { rng: seeded(2) });
  assert.equal(first.visit.first, true);
  assert.equal(first.visit.gift, true);
  const again = openPedinaro(first.state, { rng: seeded(3) });
  assert.equal(again.visit.first, false);
  assert.equal(again.visit.gift, false);
  const withMore = openPedinaro(withPouch(["ottone", "ficheBlu"]), { rng: seeded(4) });
  assert.equal(withMore.visit.gift, false, "non se hai già altri gettoni");
});

test("Pedinaro: baratto solo con un gettone che vale abbastanza, mai l'Ottone", () => {
  assert.equal(barterNeed("santino"), 27);                  // raro €45 × 0,6
  assert.equal(canBarterWith("ficheBlu", "santino"), false); // €25 < €27
  assert.equal(canBarterWith("contraffatto", "santino"), true);
  assert.equal(canBarterWith("ottone", "ficheBlu"), false);
  const ts = barterToken(withPouch(["ottone", "contraffatto"], "ottone"), "contraffatto", "santino");
  assert.deepEqual(ts.pouch, ["ottone", "santino"]);
  assert.equal(ts.acquired[0], 1, "conta per la compensazione");
  assert.throws(() => barterToken(withPouch(["ottone", "ficheBlu"]), "ficheBlu", "santino"));
});
