import { PLAYER_COMBAT_CELLS, ENEMY_COMBAT_POOLS } from "../data/combat.js";
import { pick, rng } from "./random.js";

export function generateCombatCell() {
  const categories = ["COMBATTIMENTO", "DIFESA", "DENARO"];
  // Carte a doppio taglio: ognuna ha la SUA probabilità (tradeoffChance), non
  // una quota fissa divisa per categoria. Così spostare All-in tra i premi non
  // ha raddoppiato Berserk né dimezzato la Schedina (proprietario, 2026-09-19).
  const cat = pick(categories);
  const pool = PLAYER_COMBAT_CELLS[cat];
  const base = pool.filter(c => !c.tradeoff);
  const r = rng();
  let acc = 0;
  const tradeoff = pool.filter(c => c.tradeoff).find(c => (acc += c.tradeoffChance ?? 0.14) > r);
  const effect = tradeoff || pick(base);
  return { ...effect, category: cat, scratched: false };
}

// Genera una mano di N carte (per selezione 5-scegli-3)
export function generateCombatHand(count = 5) {
  return Array.from({ length: count }, generateCombatCell);
}

// Carte nemico — variano per tipo
export function generateEnemyCombatCell(enemyName) {
  const pool = ENEMY_COMBAT_POOLS[enemyName] || ENEMY_COMBAT_POOLS["Sfidante"];
  const categories = Object.keys(pool);
  const cat = pick(categories);
  const effect = pick(pool[cat]);
  return { ...effect, category: cat, scratched: false };
}

export function generateCombatCard(isSpecial = false, enemyName = null) {
  if (enemyName) {
    // Il Napoletano ha 4 carte invece di 3 — "'na mano napoletana"
    const isNapoletano = enemyName === "Il Napoletano";
    const poolKey = enemyName;
    if (isNapoletano) {
      const cells = [
        generateEnemyCombatCell(poolKey),
        generateEnemyCombatCell(poolKey),
        generateEnemyCombatCell(poolKey),
        generateEnemyCombatCell(poolKey),
      ];
      return { category: cells[0].category, cells, isSpecial: true };
    }
    const cells = [
      generateEnemyCombatCell(poolKey),
      generateEnemyCombatCell(poolKey),
      generateEnemyCombatCell(poolKey),
    ];
    return { category: cells[0].category, cells, isSpecial };
  }
  const cells = [generateCombatCell(), generateCombatCell(), generateCombatCell()];
  return { category: cells[0].category, cells, isSpecial };
}
