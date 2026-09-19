// Test del Lotto A del playtest 2026-09-19 (docs/PLAYTEST-2026-09-19.md):
// P-01 premio con jolly su biglietto perdente, P-02 Fascia da Polso,
// P-03 testi dell'avviso di fine grattatore.
// Eseguire con: npm test

import test from "node:test";
import assert from "node:assert/strict";

import { CARD_TYPES, CARD_BALANCE } from "../src/data/cards.js";
import { GRATTATORE_DEFS, makeGrattatore } from "../src/data/items.js";
import {
  generateCard, applyTrapToJolly, matchWinSymbol, matchWinPrize, jollyConsolationPrize,
} from "../src/utils/card.js";
import {
  COMBAT_ONLY_EFFECTS, combatOnlyScratchBlock, grattatoreSpentAtFightEnd,
  spendGrattatoreUse, grattatoreGoneText, grattatoreConArticolo,
} from "../src/utils/grattatore.js";

// rng deterministico (mulberry32): utils/random.js legge Math.random a ogni tiro
const seeded = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const withSeed = (seed, fn) => {
  const orig = Math.random;
  Math.random = seeded(seed);
  try { return fn(); } finally { Math.random = orig; }
};

const scratchAll = (cells) => cells.map(c => ({...c, scratched: true}));

// ── P-01 · Bocca del Drago + Malocchio ───────────────────────

test("P-01: biglietto perdente + Malocchio che fa 4 uguali col jolly → premio > 0", () => {
  withSeed(1901, () => {
    const type = CARD_TYPES.find(t => t.id === "boccaDrago");
    const cb = CARD_BALANCE.boccaDrago;
    let jollyWins = 0;
    for (let i = 0; i < 3000; i++) {
      const card = generateCard("boccaDrago", 0);
      if (card.isWinner) continue;
      assert.equal(card.prize, 0, "il biglietto perdente nasce senza premio");
      const cells = scratchAll(applyTrapToJolly(card.cells));
      // Senza Malocchio un perdente non vince mai
      assert.equal(matchWinSymbol(scratchAll(card.cells), type.matchNeeded), null);
      if (!matchWinSymbol(cells, type.matchNeeded)) continue;
      jollyWins++;
      const prize = matchWinPrize(card);
      assert.ok(prize > 0, "una vincita riconosciuta non paga mai €0");
      assert.ok(prize >= type.cost && prize <= cb.prizeMax, `premio ${prize} fuori tabella`);
    }
    assert.ok(jollyWins > 0, "il caso del bug deve presentarsi nel campione");
  });
});

test("P-01: il Malocchio trasforma solo le trappole, e non tocca le celle originali", () => {
  withSeed(7, () => {
    const card = generateCard("boccaDrago", 0);
    const traps = card.cells.filter(c => c.isTrap).length;
    const cells = applyTrapToJolly(card.cells);
    assert.equal(cells.filter(c => c.isJolly && c.symbol === "✨").length, traps);
    assert.equal(cells.filter(c => c.isTrap).length, 0);
    assert.equal(card.cells.filter(c => c.isTrap).length, traps, "la carta resta intatta");
    assert.notEqual(cells[0], card.cells[0], "celle copiate, non condivise");
  });
});

test("P-01: nessuna carta match/jolly/trap dichiara una vincita da €0 (con e senza Malocchio)", () => {
  withSeed(42, () => {
    const types = CARD_TYPES.filter(t => ["match", "jolly", "trap"].includes(t.mechanic));
    assert.ok(types.length >= 5);
    for (const type of types) {
      for (let i = 0; i < 400; i++) {
        const card = generateCard(type.id, 0);
        for (const cells of [card.cells, applyTrapToJolly(card.cells)]) {
          if (!matchWinSymbol(scratchAll(cells), type.matchNeeded)) continue;
          assert.ok(matchWinPrize(card) > 0, `${type.id}: vincita a €0`);
        }
      }
    }
  });
});

test("P-01: matchWinPrize tiene il premio del biglietto vincente", () => {
  const card = { id: "boccaDrago", cost: 20, maxPrize: 150, prize: 97 };
  assert.equal(matchWinPrize(card), 97);
});

test("P-01: la consolazione del jolly sta tra il costo e il premio calibrato", () => {
  withSeed(3, () => {
    for (const type of CARD_TYPES.filter(t => CARD_BALANCE[t.id])) {
      const cb = CARD_BALANCE[type.id];
      // tra prizeMin e il 45% di prizeMax (in qualunque ordine), mai sotto il costo
      const top = Math.max(type.cost, cb.prizeMin, Math.round(cb.prizeMax * 0.45));
      for (let i = 0; i < 50; i++) {
        const p = jollyConsolationPrize(type);
        assert.ok(p >= type.cost, `${type.id}: ${p} sotto il costo`);
        assert.ok(p <= top, `${type.id}: ${p} sopra ${top}`);
      }
    }
  });
});

// ── P-02 · Fascia da Polso: solo combattimento, una fight ────

const equipped = (id, extra = {}) => {
  const g = { ...makeGrattatore(id), ...extra };
  return { grattatori: [g], equippedGrattatore: { ...g, inventoryIdx: 0 } };
};

test("P-02: con la Fascia da Polso in mano il grattino non parte", () => {
  assert.equal(combatOnlyScratchBlock(makeGrattatore("fasciaPolso")), "Non puoi grattare con la Fascia da Polso");
  assert.equal(combatOnlyScratchBlock(null), null);
  assert.equal(combatOnlyScratchBlock(makeGrattatore("bullone")), null);
});

test("P-02: stessa regola per tutti i grattatori solo-combattimento", () => {
  const combatOnly = Object.entries(GRATTATORE_DEFS).filter(([, d]) => COMBAT_ONLY_EFFECTS.has(d.effect));
  assert.deepEqual(combatOnly.map(([id]) => id).sort(), ["coltelloAffilato", "fasciaPolso", "guantoBoss", "guantoFerro"]);
  for (const [id] of combatOnly) {
    assert.match(combatOnlyScratchBlock(makeGrattatore(id)), /^Non puoi grattare con (il|la|l') /);
  }
  for (const [id, d] of Object.entries(GRATTATORE_DEFS)) {
    if (!COMBAT_ONLY_EFFECTS.has(d.effect)) assert.equal(combatOnlyScratchBlock(makeGrattatore(id)), null, id);
  }
});

test("P-02: la Fascia si spende a fine fight (vinta o persa, anche non boss) e sparisce", () => {
  const p = equipped("fasciaPolso");
  assert.equal(grattatoreSpentAtFightEnd(p), true);
  assert.equal(grattatoreSpentAtFightEnd(p, { isBoss: true }), true);
  const after = spendGrattatoreUse(p);
  assert.equal(after.grattatori.length, 0);
  assert.equal(after.equippedGrattatore, null);
});

test("P-02: a fine fight gli altri grattatori non si spendono (Guanto da BOSS solo col boss)", () => {
  assert.equal(grattatoreSpentAtFightEnd(equipped("coltelloAffilato")), false);
  assert.equal(grattatoreSpentAtFightEnd(equipped("guantoFerro")), false);
  assert.equal(grattatoreSpentAtFightEnd(equipped("bullone")), false);
  assert.equal(grattatoreSpentAtFightEnd(equipped("guantoBoss")), false);
  assert.equal(grattatoreSpentAtFightEnd(equipped("guantoBoss"), { isBoss: true }), true);
  assert.equal(grattatoreSpentAtFightEnd({ grattatori: [], equippedGrattatore: null }), false);
});

test("P-02: la Fascia vale una fight per uso (con usi extra resta per la prossima)", () => {
  const after = spendGrattatoreUse(equipped("fasciaPolso", { usesLeft: 3 }));
  assert.equal(after.grattatori[0].usesLeft, 2);
  assert.equal(after.equippedGrattatore.usesLeft, 2);
});

// ── P-03 · Testi dell'avviso ─────────────────────────────────

test("P-03: avviso di fine grattatore con articolo e genere giusti", () => {
  const g = (id) => makeGrattatore(id);
  assert.equal(grattatoreGoneText(g("fasciaPolso")), "La Fascia da Polso si è consumata.");
  assert.equal(grattatoreGoneText(g("bullone")), "Il Bullone si è consumato.");
  assert.equal(grattatoreGoneText(g("unghiaFinta")), "L'Unghia Finta si è consumata.");
  assert.equal(grattatoreGoneText(g("coltelloAffilato")), "Il Coltello Affilato si è consumato.");
  assert.match(grattatoreGoneText(g("guantoBoss")), /sgretola/);
  assert.equal(grattatoreGoneText(g("fasciaPolso"), 2), "La Fascia da Polso: effetto finito, restano 2 usi.");
  assert.equal(grattatoreGoneText(g("fasciaPolso"), 1), "La Fascia da Polso: effetto finito, resta 1 uso.");
  assert.equal(grattatoreConArticolo(g("moneta_oro")), "la Moneta d'Oro");
});
