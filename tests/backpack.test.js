// Test del raggruppamento visivo dello zaino (P-04).
// Eseguire con: npm test

import test from "node:test";
import assert from "node:assert/strict";

import { groupItems, groupGrattatori } from "../src/utils/backpack.js";

test("consumabili uguali in una casella sola, con gli indici dei pezzi", () => {
  const groups = groupItems(["cerotto", "sigaretta", "cerotto", "cerotto"]);
  assert.deepEqual(groups, [
    { id: "cerotto", count: 3, indices: [0, 2, 3] },
    { id: "sigaretta", count: 1, indices: [1] },
  ]);
});

test("il totale dei pezzi non cambia raggruppando", () => {
  const items = ["cerotto", "cerotto", "smalto", "sigaretta", "smalto"];
  const total = groupItems(items).reduce((s, g) => s + g.count, 0);
  assert.equal(total, items.length);
});

test("usarne uno scala il numero", () => {
  const items = ["cerotto", "cerotto"];
  const [g] = groupItems(items);
  const after = items.filter((_, i) => i !== g.indices[0]);
  assert.equal(groupItems(after)[0].count, 1);
});

test("zaino vuoto o assente → nessuna casella", () => {
  assert.deepEqual(groupItems([]), []);
  assert.deepEqual(groupItems(undefined), []);
});

test("grattatori raggruppati solo se stesso id e stessi usi", () => {
  const tools = [
    { id: "bottone", usesLeft: 3 },
    { id: "bottone", usesLeft: 3 },
    { id: "bottone", usesLeft: 1 },
    { id: "bullone", usesLeft: 3 },
  ];
  const groups = groupGrattatori(tools);
  assert.equal(groups.length, 3);
  assert.deepEqual(groups.map(g => [g.tool.id, g.count, g.indices]), [
    ["bottone", 2, [0, 1]],
    ["bottone", 1, [2]],
    ["bullone", 1, [3]],
  ]);
});

test("il grattatore in mano ha una casella sua", () => {
  const tools = [
    { id: "bottone", usesLeft: 3 },
    { id: "bottone", usesLeft: 3 },
    { id: "bottone", usesLeft: 3 },
  ];
  const groups = groupGrattatori(tools, 1);
  assert.equal(groups.length, 2);
  const hand = groups.find(g => g.inHand);
  assert.deepEqual(hand.indices, [1]);
  const rest = groups.find(g => !g.inHand);
  assert.deepEqual(rest.indices, [0, 2]);
  assert.equal(rest.count, 2);
});
