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

test("P-12: All-in resta un premio ma non supera un grattino medio", () => {
  const c = byEffect("DENARO", "allIn");
  assert.equal(c.value, 30);
  assert.equal(c.cost, 15);
  assert.equal(c.tradeoff, true);
});

test("le carte COMBATTIMENTO del giocatore fanno tutte danno", () => {
  for (const c of PLAYER_COMBAT_CELLS.COMBATTIMENTO) {
    assert.ok(EFFECT_DAMAGE[c.effect] > 0, `${c.name} (${c.effect}) è in COMBATTIMENTO ma non fa danno`);
  }
});

// Ogni carta a doppio taglio esce con la sua probabilità, come prima dello
// spostamento di All-in: Berserk non raddoppia, la Schedina non si dimezza.
import { generateCombatCell } from "../src/utils/combat.js";

test("carte a doppio taglio: frequenze oneste, ognuna la sua", () => {
  const N = 120000, seen = {};
  for (let i = 0; i < N; i++) { const c = generateCombatCell(); seen[c.effect] = (seen[c.effect] || 0) + 1; }
  const rate = (e) => (seen[e] || 0) / N;
  const near = (e, p) => assert.ok(Math.abs(rate(e) - p) < 0.006, `${e}: ${rate(e).toFixed(4)} invece di ~${p.toFixed(4)}`);
  near("berserk", 0.14 / 3);   // 1 categoria su 3 × 14%
  near("allIn", 0.14 / 3);
  near("gamble", 0.28 / 3);
  near("fortress", 0.28 / 3);
});

test("All-in dice quello che fa: +15 di scudo al nemico", () => {
  assert.match(byEffect("DENARO", "allIn").desc, /scudo/);
});
