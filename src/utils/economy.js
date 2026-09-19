import { CARD_BALANCE, CARD_TYPES } from "../data/cards.js";
import { PLAYER_COMBAT_CELLS } from "../data/combat.js";

const TARGET_DRIVEN = new Set(["collect", "labirinto", "combina", "tesoro"]);

// Ritorno economico conservativo: i jolly di consolazione non sono contati,
// mentre i malus in denaro vengono sottratti. I minigiochi, che dipendono
// dalla strategia umana, usano il target verificato dalle loro simulazioni.
export function configuredTicketRtp(type, balance = CARD_BALANCE[type.id]) {
  if (!type || !balance || !type.cost) return 0;
  if (TARGET_DRIVEN.has(type.mechanic)) return 1 + balance.evTarget;
  const meanPrize = (balance.prizeMin + balance.prizeMax) / 2;
  let payout = balance.winChance * meanPrize;
  if (type.mechanic === "ruota") {
    payout += (1 - balance.winChance) * 0.30 * Math.round(type.cost * 1.3);
  }
  if (type.malus?.type === "payExtra") {
    payout -= (1 - balance.winChance) * type.malus.amount;
  }
  return payout / type.cost;
}

export function ticketEconomyRows() {
  return CARD_TYPES.map(type => ({
    id: type.id,
    tier: CARD_BALANCE[type.id]?.tier || type.tier,
    cost: type.cost,
    rtp: configuredTicketRtp(type),
  }));
}

function moneyValue(cell) {
  switch (cell.effect) {
    case "money": case "stealMoney": case "allIn": return cell.value || 0;
    case "adrenaline": return cell.value || 0; // caso economicamente migliore: unghie sane
    case "fortress": return -(cell.cost || 0);
    case "gamble": return ((cell.value || 0) - (cell.cost || 0)) / 2;
    case "freeCard": return 8; // media del pool [0, 0, 8, 12, 20]
    default: return 0;
  }
}

// EV monetario di una carta rivelata in combattimento, usando esattamente le
// probabilita' di generateCombatCell (categorie equiprobabili e tradeoff con
// probabilita' propria). Non valuta danni/cure: misura soltanto quanti euro
// stampa la lotta, il confronto richiesto da P-12.
export function expectedCombatLootPerReveal() {
  const categories = Object.values(PLAYER_COMBAT_CELLS);
  const total = categories.reduce((sum, pool) => {
    const specials = pool.filter(c => c.tradeoff);
    const base = pool.filter(c => !c.tradeoff);
    const specialP = specials.reduce((p, c) => p + (c.tradeoffChance ?? 0.14), 0);
    const specialEv = specials.reduce((ev, c) => ev + (c.tradeoffChance ?? 0.14) * moneyValue(c), 0);
    const baseEv = base.reduce((ev, c) => ev + moneyValue(c), 0) / base.length;
    return sum + specialEv + Math.max(0, 1 - specialP) * baseEv;
  }, 0);
  return total / categories.length;
}
