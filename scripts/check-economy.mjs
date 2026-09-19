import { CARD_TYPES, CARD_BALANCE } from "../src/data/cards.js";
import { configuredTicketRtp, expectedCombatLootPerReveal } from "../src/utils/economy.js";

const old = {
  fortunaFlash:[.32,1,2,0], setteEMezzo:[.34,2,4,0], portaFortuna:[.30,4,9,-.03],
  fintoMilionario:[.26,10,28,-.05], puzzle:[.28,18,48,-.08], boccaDrago:[.22,40,130,-.08],
  miliardario:[.17,60,260,-.10], tredici:[.14,200,440,-.10], maledetto:[.11,450,1400,0],
  ruota:[.22,25,65,-.02], labirinto:[.26,30,75,-.09], grattaCombina:[.28,45,115,-.10],
  mappaTesor0:[.22,75,210,-.10], doppioOnulla:[.48,28,48,-.09], mahjong:[.28,45,115,-.10],
  jackpotMix:[.24,45,120,0], turistaPerSempre:[.20,85,260,-.14],
};

const mixes = [
  ["fortunaFlash", "setteEMezzo", "portaFortuna", "fintoMilionario"],
  ["portaFortuna", "fintoMilionario", "ruota", "labirinto"],
  ["puzzle", "boccaDrago", "grattaCombina", "jackpotMix"],
  ["miliardario", "tredici", "maledetto", "turistaPerSempre"],
];

function oldRtp(type) {
  const [winChance, prizeMin, prizeMax, evTarget] = old[type.id];
  if (["collect", "labirinto", "combina", "tesoro"].includes(type.mechanic)) return 1 + evTarget;
  let payout = winChance * (prizeMin + prizeMax) / 2;
  if (type.mechanic === "ruota") payout += (1 - winChance) * .30 * Math.round(type.cost * 1.3);
  if (type.malus?.type === "payExtra") payout -= (1 - winChance) * type.malus.amount;
  return payout / type.cost;
}

const byId = Object.fromEntries(CARD_TYPES.map(c => [c.id, c]));
const combatNode = expectedCombatLootPerReveal() * 6;
console.log("P-12 · economia attesa per quartiere (4 grattini + confronto 1 lotta da 6 carte)\n");
console.log("Quartiere | Grattini prima | Grattini dopo | Lotta dopo");
for (let biome = 0; biome < mixes.length; biome++) {
  const cards = mixes[biome].map(id => byId[id]);
  const channel = (rtp) => cards.reduce((sum, c) => sum + c.cost * rtp(c), 0);
  console.log(`${biome + 1}          | €${channel(oldRtp).toFixed(2).padStart(7)}       | €${channel(configuredTicketRtp).toFixed(2).padStart(7)}      | €${combatNode.toFixed(2)}`);
}
console.log(`\nEV carta lotta rivelata: €${expectedCombatLootPerReveal().toFixed(2)}`);
console.log(`Target nuovi: ${Object.values(CARD_BALANCE).filter(b => b.tier > 1).every(b => b.evTarget >= .10) ? "OK" : "FUORI TARGET"}`);
