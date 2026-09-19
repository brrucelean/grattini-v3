// Verifica gettone per gettone: il VANTAGGIO e la FREGATURA di ogni gettone
// scattano davvero. Se aggiungi un gettone senza una riga qui, il primo test
// fallisce. Il secondo blocco controlla che ogni aggancio usato qui sia
// chiamato dal gioco (niente effetti che esistono solo nella logica).
// Eseguire con: npm test

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { TOKENS } from "../src/data/tokens.js";
import * as T from "../src/utils/tokens.js";
import { surgeonPrice, cardPrice, itemPrice } from "../src/utils/shop.js";
import { generateMap } from "../src/utils/map.js";
import { TOKEN_VISUALS } from "../src/components/tokens/tokenVisuals.js";

const fixed = (v) => () => v;
const seeded = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const eq = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} ≠ ${b}`);

// Stato con `id` equipaggiato, facoltativamente dentro un nodo.
const on = (id, node = null, opts = {}) => {
  const ts = { ...T.createTokenState(), pouch: [id, "ottone"].filter((x, i, a) => a.indexOf(x) === i), equipped: id };
  return node ? T.selectNode(ts, node, opts).state : ts;
};
const node = (type, row = 2, id = "n1") => ({ id, type, row, x: 0.5 });
const LADRO = node("ladro", 3, "L");
const SHOP = node("tabaccaio", 2, "S");
const EVENT = node("evento", 4, "E");
const player = (tokens, extra = {}) => ({ tokens, money: 50, shopDiscountMeta: 0, ...extra });
const room = { name: "Camera Media", cost: 22, heals: 2, desc: "" };
const count = (map, pred) => map.rows.flat().filter(pred).length;
const avg = (fn, n = 300) => { let s = 0; for (let i = 0; i < n; i++) s += fn(); return s / n; };

// ── Tabella: per ogni gettone, vantaggio e fregatura ─────────────
const CHECKS = {
  ottone: {
    pro: () => eq(T.priceMultiplier(on("ottone"), "tabaccaio"), 1, "prezzi pieni"),
    contro: () => eq(T.rewardMultiplier(on("ottone")), 1, "premi pieni"),
  },
  ficheBlu: {
    pro: () => eq(T.priceMultiplier(on("ficheBlu"), "tabaccaio"), 0.9, "tabaccaio −10%"),
    contro: () => eq(T.rewardMultiplier(on("ficheBlu", LADRO)), 0.9, "premi −10%"),
  },
  monetaVicolo: {
    pro: () => assert.equal(T.onNodeResolved(T.markNodeOutcome(on("monetaVicolo", LADRO), true), LADRO).money, 8),
    contro: () => assert.equal(T.locandaRoom(on("monetaVicolo"), room).cost, 27),
  },
  bigliaBambino: {
    pro: () => {
      const r = T.claimBigliaTicket(on("bigliaBambino", EVENT), 0);
      assert.equal(r.give, true);
      assert.equal(T.claimBigliaTicket(r.state, 0).give, false, "una volta per bioma");
    },
    contro: () => {
      assert.equal(T.onEnterBiome(on("bigliaBambino"), { ticketCount: 5 }).loseRandomTicket, true);
      assert.equal(T.onEnterBiome(on("bigliaBambino"), { ticketCount: 4 }).loseRandomTicket, false);
    },
  },
  telefono: {
    pro: () => {
      const r = T.callTelefono(on("telefono"), 0, { rng: fixed(0.9), targetId: "sec" });
      assert.equal(T.isSecretOpen(r.state, { id: "sec", secret: true }, 0), true, "aperto senza Fortuna");
    },
    contro: () => {
      const r = T.callTelefono(on("telefono"), 0, { rng: fixed(0.1), targetId: "sec" });
      assert.equal(r.money, -1);
      assert.equal(T.isSecretOpen(r.state, { id: "sec", secret: true }, 0), false, "numero sbagliato");
    },
  },
  magnetica: {
    pro: () => assert.equal(T.onNodeResolved(on("magnetica", SHOP), SHOP).money, 1),
    contro: () => {
      const p = T.mapGenParams(on("magnetica")).poliziottoChance;
      const withM = avg(() => count(generateMap(1, { poliziottoChance: p }), n => n.type === "poliziotto"));
      const without = avg(() => count(generateMap(1), n => n.type === "poliziotto"));
      assert.ok(withM > without, `più Poliziotti: ${withM} vs ${without}`);
    },
  },
  sassolino: {
    pro: () => eq(T.theftMult(on("sassolino")), 0.5, "furti a metà"),
    contro: () => assert.equal(T.locandaRoom(on("sassolino"), room).heals, 1),
  },
  dado: {
    pro: () => {
      for (let i = 0; i < 50; i++) {
        const map = generateMap(0);
        const from = map.rows[2][0];
        const [target] = T.dadoOptions(on("dado"), map, from, 0);
        if (!target) continue;
        assert.ok(!map.connections[from.id].includes(target), "prima non c'era");
        assert.ok(T.rollDado(on("dado"), map, from, target, 0).map.connections[from.id].includes(target), "dopo sì");
        return;
      }
      assert.fail("nessuna mappa con un percorso del Dado");
    },
    contro: () => {
      for (let i = 0; i < 50; i++) {
        const map = generateMap(0);
        const from = map.rows[3][0];
        const [target] = T.dadoOptions(on("dado"), map, from, 0);
        if (!target) continue;
        const r = T.rollDado(on("dado"), map, from, target, 0);
        assert.equal(r.map.rows.flat().find(n => n.id === target).elite, true);
        return;
      }
      assert.fail("nessuna mappa con un percorso del Dado");
    },
  },
  santino: {
    pro: () => assert.equal(T.onNegativeEvent(on("santino", SHOP), "multa", 0).cancelled, true),
    contro: () => {
      let ts = T.onNegativeEvent(on("santino", SHOP), "furto", 0).state;
      ts = T.returnToMap(T.onNodeResolved(ts, SHOP).state); // il nodo del furto non conta
      for (let i = 0; i < 3; i++) {
        eq(T.fortuneModifier(ts), -1, `penitenza nodo ${i + 1}`);
        ts = T.returnToMap(T.onNodeResolved(T.selectNode(ts, SHOP).state, SHOP).state);
      }
      eq(T.fortuneModifier(ts), 0, "finita dopo 3 nodi");
    },
  },
  ficheTruccata: {
    pro: () => assert.equal(T.secretThreshold(on("ficheTruccata"), 2), 1),
    contro: () => eq(T.priceMultiplier(on("ficheTruccata"), "tabaccaio"), 1.15, "tabaccaio +15%"),
  },
  mezzoCorno: {
    pro: () => eq(T.fortuneModifier(on("mezzoCorno", node("evento", 4))), 1, "colonna pari"),
    contro: () => eq(T.fortuneModifier(on("mezzoCorno", node("evento", 5))), -1, "colonna dispari"),
  },
  denteOro: {
    pro: () => assert.equal(surgeonPrice(player(on("denteOro")), 50), 40),
    contro: () => assert.equal(T.onNodeResolved(T.markNodeOutcome(on("denteOro", LADRO), false), LADRO).money, -5),
  },
  autoscontro: {
    pro: () => {
      const map = { rows: [[], [], [], [node("tabaccaio", 3, "a"), { ...LADRO, x: 0.3 }, node("locanda", 3, "c")]], connections: {} };
      map.rows[3][0].x = 0.1; map.rows[3][2].x = 0.9;
      assert.notEqual(T.selectNode(on("autoscontro"), map.rows[3][1], { map, rng: fixed(0.1) }).targetId, "L");
    },
    contro: () => {
      // il rimbalzo è casuale: può finire anche su un nodo peggiore (qui un altro pericoloso)
      const map = { rows: [[], [], [], [{ ...node("miniboss", 3, "a"), x: 0.1 }, { ...LADRO, x: 0.3 }]], connections: {} };
      assert.equal(T.selectNode(on("autoscontro"), map.rows[3][1], { map, rng: fixed(0.1) }).targetId, "a");
    },
  },
  testaCroce: {
    pro: () => eq(T.priceMultiplier(on("testaCroce", SHOP, { rng: fixed(0.1) }), "tabaccaio"), 0.8, "testa"),
    contro: () => eq(T.priceMultiplier(on("testaCroce", SHOP, { rng: fixed(0.9) }), "tabaccaio"), 1.2, "croce"),
  },
  nero: {
    pro: () => eq(T.rewardMultiplier(on("nero", LADRO), { elite: true }), 1.5, "élite ×1,5"),
    contro: () => {
      const extra = avg(() => {
        const m = generateMap(0);
        return count(T.onMapGenerated(on("nero"), m), n => n.elite) - count(m, n => n.elite);
      }, 100);
      assert.ok(extra > 1, `élite in più: ${extra}`);
    },
  },
  contraffatto: {
    pro: () => assert.equal(T.barterValue("contraffatto"), 180),
    contro: () => {
      const r = T.onPoliziotto(on("contraffatto", node("poliziotto")));
      assert.equal(r.seized, true); assert.equal(r.fine, 20);
    },
  },
  incollata: {
    pro: () => eq(T.fortuneModifier(on("incollata")), 1, "+1 Fortuna"),
    contro: () => {
      const ts = T.equipToken({ ...T.createTokenState(), pouch: ["ottone", "incollata"] }, "incollata").state;
      assert.equal(T.canSwapToken(ts), false);
    },
  },
  debito: {
    pro: () => assert.equal(T.equipToken({ ...T.createTokenState(), pouch: ["ottone", "debito"] }, "debito").money, 30),
    contro: () => assert.equal(T.locandaRoom({ ...T.createTokenState(), pouch: ["ottone", "debito"] }, room).cost, 32),
  },
  lira99: {
    pro: () => assert.equal(T.onEnterShop(on("lira99", SHOP, { rng: fixed(0.01) }), 0).money, 20),
    contro: () => assert.equal(T.onEnterShop(on("lira99", SHOP, { rng: fixed(0.9) }), 0).fortune, -1),
  },
  invisibile: {
    pro: () => assert.equal(T.ladroMissed(on("invisibile", LADRO, { rng: fixed(0.05) })), true),
    contro: () => eq(T.priceMultiplier(on("invisibile"), "tabaccaio", { otherDiscount: 0.1 }), 1, "niente sconti"),
  },
  sorpresina: {
    pro: () => assert.ok(T.onBossDefeated(on("sorpresina"), { rng: seeded(1) }).opened),
    contro: () => {
      eq(T.priceMultiplier(on("sorpresina"), "tabaccaio"), 1, "chiusa: niente");
      eq(T.fortuneModifier(on("sorpresina")), 0, "chiusa: niente");
    },
  },
  ferroStiro: {
    pro: () => {
      let ts = on("ferroStiro"); let m = 0;
      for (let i = 0; i < 5; i++) { const r = T.onNodeResolved(ts, SHOP); ts = r.state; m += r.money; }
      assert.equal(m, 20);
    },
    contro: () => assert.equal(T.onNodeResolved(on("ferroStiro"), LADRO).state.counters.calmNodes, 0),
  },
  spumante: {
    pro: () => {
      const r = T.onNodeResolved(on("spumante", SHOP), SHOP, { biome: 0 });
      assert.equal(r.money, 10); assert.equal(r.confetti, true);
      assert.equal(T.onNodeResolved(r.state, SHOP, { biome: 0 }).money, 0, "solo il primo nodo del bioma");
    },
    contro: () => {
      const extra = avg(() => { const m = generateMap(0); return count(T.onMapGenerated(on("spumante"), m), n => n.type === "ladro") - count(m, n => n.type === "ladro"); }, 100);
      assert.ok(extra > 0.9, `Ladri in più: ${extra}`);
    },
  },
  flipper: {
    pro: () => {
      let ts = on("flipper"); const m = [];
      for (let i = 0; i < 3; i++) { const r = T.onNodeResolved(ts, SHOP); ts = r.state; m.push(r.money); }
      assert.deepEqual(m, [0, 0, 15]);
    },
    contro: () => {
      let ts = on("flipper");
      for (let i = 0; i < 4; i++) ts = T.onNodeResolved(ts, SHOP).state;
      assert.equal(T.activeToken(ts), "ottone", "TILT");
    },
  },
  madreperla: {
    pro: () => assert.equal(T.scratchPrize(on("madreperla"), 100), 115),
    contro: () => {
      const extra = avg(() => { const m = generateMap(0); return count(T.onMapGenerated(on("madreperla"), m), n => n.type === "ladro") - count(m, n => n.type === "ladro"); }, 100);
      assert.ok(extra > 0.9, `Ladri in più: ${extra}`);
    },
  },
  prisma: {
    pro: () => eq(T.fortuneModifier(on("prisma", EVENT)), 1, "+1 negli eventi"),
    contro: () => {
      let ts = T.markNodeOutcome(on("prisma", LADRO), false);
      ts = T.returnToMap(T.onNodeResolved(ts, LADRO).state);
      eq(T.fortuneModifier(T.selectNode(ts, EVENT).state), 0, "incrinato dopo la sconfitta");
    },
  },
  pellicola: {
    pro: () => eq(T.rewardMultiplier(on("pellicola", LADRO)), 1.2, "+20% contro i Ladri"),
    contro: () => assert.equal(T.onNodeResolved(T.markNodeOutcome(on("pellicola", LADRO), true), LADRO).money, -3),
  },
  umore: {
    pro: () => assert.equal(T.locandaRoom(on("umore"), room, { pain: 0.4 }).cost, 18),
    contro: () => eq(T.priceMultiplier(on("umore"), "tabaccaio", { money: 150 }), 1.1, "ricco: +10%"),
  },
  aura: {
    pro: () => {
      let ts = T.onScratchWin(on("aura", SHOP), 25);
      ts = T.returnToMap(T.onNodeResolved(ts, SHOP).state);
      eq(T.fortuneModifier(T.selectNode(ts, SHOP).state), 1, "aura accesa nel nodo dopo");
    },
    contro: () => {
      let ts = T.markNodeOutcome(on("aura", LADRO), false);
      ts = T.returnToMap(T.onNodeResolved(ts, LADRO).state);
      eq(T.fortuneModifier(T.selectNode(ts, SHOP).state), -1, "aura rossa nel nodo dopo");
    },
  },
  retino: {
    pro: () => {
      const p = player(on("retino"));
      assert.equal(cardPrice(p, 1, { id: "x", cost: 10 }), 9);
      assert.equal(itemPrice(p, 1, 10), 10, "solo i grattini");
    },
    contro: () => assert.equal(T.scratchPrize(on("retino"), 100, { isMax: true }), 90),
  },
  mercurio: {
    pro: () => assert.equal(T.firstHitShield(on("mercurio")), true),
    contro: () => {
      let ts = on("mercurio"); let dmg = 0;
      for (let i = 0; i < 5; i++) { const r = T.onNodeResolved(ts, SHOP); ts = r.state; dmg += r.nailDamage; }
      assert.equal(dmg, 1);
    },
  },
  vhs: {
    pro: () => {
      const r = T.rewindCombat(on("vhs", LADRO), 0, 50);
      assert.ok(r);
      assert.equal(T.rewindCombat(r.state, 0, 50), null, "una volta per bioma");
    },
    contro: () => {
      assert.equal(T.rewindCombat(on("vhs", LADRO), 0, 50).cost, 10);
      assert.equal(T.rewindCombat(on("vhs", LADRO), 0, 5), null, "senza €10 non riavvolge");
    },
  },
  specchietto: {
    pro: () => eq(T.priceMultiplier(on("specchietto"), "tabaccaio"), 0.85, "tabaccaio −15%"),
    contro: () => assert.equal(TOKEN_VISUALS[TOKENS.specchietto.visual].map, "mirror"),
  },
};

test("ogni gettone ha la verifica di vantaggio e fregatura", () => {
  for (const id of Object.keys(TOKENS)) {
    assert.ok(CHECKS[id]?.pro && CHECKS[id]?.contro, `${id}: manca la verifica`);
  }
});

for (const [id, c] of Object.entries(CHECKS)) {
  test(`${TOKENS[id]?.name || id}: VANTAGGIO`, c.pro);
  test(`${TOKENS[id]?.name || id}: FREGATURA`, c.contro);
}

// ── Il gioco chiama davvero ogni aggancio ─────────────────────────
const src = (f) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const WIRES = {
  fortuneModifier: ["hooks/useNailHandlers.js"],
  isSecretOpen: ["components/map/MapBoard.jsx", "components/MapView.jsx"],
  secretThreshold: ["components/map/MapBoard.jsx", "components/MapView.jsx"],
  priceMultiplier: ["utils/shop.js"],
  surgeonPrice: ["hooks/useEventHandlers.js", "components/EventView.jsx"],
  rewardMultiplier: ["hooks/useNodeHandlers.js"],
  markNodeOutcome: ["hooks/useNodeHandlers.js"],
  locandaRoom: ["components/LocandaView.jsx"],
  onNodeResolved: ["scratchlite.jsx"],
  onEnterShop: ["hooks/useNodeHandlers.js"],
  onPoliziotto: ["hooks/useNodeHandlers.js"],
  ladroMissed: ["hooks/useNodeHandlers.js"],
  claimBigliaTicket: ["hooks/useNodeHandlers.js"],
  onEnterBiome: ["hooks/useNodeHandlers.js"],
  onBossDefeated: ["hooks/useNodeHandlers.js"],
  onNegativeEvent: ["scratchlite.jsx"],
  theftMult: ["scratchlite.jsx"],
  mapGenParams: ["scratchlite.jsx"],
  onMapGenerated: ["scratchlite.jsx"],
  rewindCombat: ["scratchlite.jsx"],
  callTelefono: ["scratchlite.jsx"],
  telefonoTarget: ["scratchlite.jsx"],
  dadoOptions: ["scratchlite.jsx"],
  rollDado: ["scratchlite.jsx"],
  firstHitShield: ["scratchlite.jsx"],
  scratchPrize: ["hooks/useScratchHandlers.js"],
  onScratchWin: ["hooks/useScratchHandlers.js"],
  equipToken: ["scratchlite.jsx"],
};

test("il gioco chiama ogni aggancio dei gettoni", () => {
  for (const [fn, files] of Object.entries(WIRES)) {
    assert.equal(typeof T[fn] === "function" || fn === "surgeonPrice", true, `${fn} non esiste`);
    for (const f of files) assert.ok(new RegExp(`\\b${fn}\\b`).test(src(f)), `${fn} non è usato in ${f}`);
  }
  // effetti restituiti da onNodeResolved che il gioco deve applicare
  const shell = src("scratchlite.jsx");
  assert.ok(/r\.nailDamage/.test(shell), "danno all'unghia (Mercurio) non applicato");
  assert.ok(/r\.confetti/.test(shell), "coriandoli (Spumante) non mostrati");
  assert.ok(/tokenCombat=/.test(shell), "effetti di combattimento non passati");
  assert.ok(/tokenBlocksNegative\?\.\("furto"\)/.test(src("hooks/useEventHandlers.js")), "Santino sui furti");
  assert.ok(/tokenBlocksNegative\?\.\("multa"\)/.test(src("hooks/useEventHandlers.js")), "Santino sulle multe");
  assert.ok(/tokenBlocksNegative\?\.\("maledizione"\)/.test(src("hooks/useEventHandlers.js")), "Santino sulle maledizioni");
  assert.ok(/tokenCombat\.firstHitShield/.test(src("components/CombatView.jsx")), "Mercurio in combattimento");
  assert.ok(/tokenCombat\.stealMult/.test(src("components/CombatView.jsx")), "Sassolino in combattimento");
});
