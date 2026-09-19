import test from "node:test";
import assert from "node:assert/strict";

import { CARD_TYPES, CARD_BALANCE } from "../src/data/cards.js";
import { configuredTicketRtp, expectedCombatLootPerReveal, ticketEconomyRows } from "../src/utils/economy.js";
import {
  LABIRINTO_CELL_PRIZE, LABIRINTO_JACKPOT,
  COMBINA_COMBO_PRIZE, TESORO_X_PRIZE, TESORO_JACKPOT,
} from "../src/utils/map.js";

test("P-12: economici al pareggio, medi e cari in attivo", () => {
  for (const row of ticketEconomyRows()) {
    if (row.tier === 1) assert.ok(row.rtp >= 0.95 && row.rtp <= 1.05, `${row.id}: RTP ${row.rtp}`);
    else assert.ok(row.rtp >= 1.10, `${row.id}: RTP ${row.rtp} sotto 110%`);
  }
});

test("P-12: il Finto Milionario resta positivo anche contando la penale da €5", () => {
  const type = CARD_TYPES.find(c => c.id === "fintoMilionario");
  assert.ok(configuredTicketRtp(type) >= 1.20);
});

test("P-12: jackpot e premi dei minigiochi sono stati alzati davvero", () => {
  assert.deepEqual(
    [LABIRINTO_CELL_PRIZE, LABIRINTO_JACKPOT, COMBINA_COMBO_PRIZE, TESORO_X_PRIZE, TESORO_JACKPOT],
    [8, 70, 20, 40, 105],
  );
});

test("P-12: una vincita media tier 2+ stampa piu' euro di una carta da lotta", () => {
  const paid = CARD_TYPES.filter(c => CARD_BALANCE[c.id]?.tier >= 2 && !["collect", "labirinto", "combina", "tesoro"].includes(c.mechanic));
  const meanWinningPrize = paid.reduce((sum, c) => {
    const b = CARD_BALANCE[c.id];
    return sum + (b.prizeMin + b.prizeMax) / 2;
  }, 0) / paid.length;
  assert.ok(meanWinningPrize > expectedCombatLootPerReveal() * 5,
    `premio medio ${meanWinningPrize.toFixed(2)}, carta lotta ${expectedCombatLootPerReveal().toFixed(2)}`);
});

test("P-12: maxPrize visibile non promette meno della tabella premi", () => {
  for (const type of CARD_TYPES) {
    const balance = CARD_BALANCE[type.id];
    if (!["collect", "labirinto", "combina", "tesoro"].includes(type.mechanic)) {
      assert.ok(type.maxPrize >= balance.prizeMax, `${type.id}: max ${type.maxPrize} < ${balance.prizeMax}`);
    }
  }
});
