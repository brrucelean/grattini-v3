// Test delle carte combattimento del giocatore (P-06).
// Eseguire con: npm test

import test from "node:test";
import assert from "node:assert/strict";

import { PLAYER_COMBAT_CELLS, EFFECT_DAMAGE } from "../src/data/combat.js";

const byEffect = (cat, effect) => PLAYER_COMBAT_CELLS[cat].find(c => c.effect === effect);

test("All-in è una carta PREMIO (DENARO), non un attacco", () => {
  assert.ok(byEffect("DENARO", "allIn"), "All-in deve stare in DENARO");
  assert.equal(byEffect("COMBATTIMENTO", "allIn"), undefined, "All-in non deve stare in COMBATTIMENTO");
  assert.equal(byEffect("DIFESA", "allIn"), undefined);
});

test("All-in mantiene i suoi numeri: +€40 al bottino, nemico +15", () => {
  const c = byEffect("DENARO", "allIn");
  assert.equal(c.value, 40);
  assert.equal(c.cost, 15);
  assert.equal(c.tradeoff, true);
});

test("le carte COMBATTIMENTO del giocatore fanno tutte danno", () => {
  for (const c of PLAYER_COMBAT_CELLS.COMBATTIMENTO) {
    assert.ok(EFFECT_DAMAGE[c.effect] > 0, `${c.name} (${c.effect}) è in COMBATTIMENTO ma non fa danno`);
  }
});
