// ─── GETTONI DEL DESTINO (G-01) ──────────────────────────────
// Catalogo dati delle pedine della mappa. Solo numeri e testi: tutta la
// logica sta in src/utils/tokens.js, così nessun componente deve sapere cosa
// fa un gettone. Design completo: docs/G-01-MAP-TOKENS.md.

export const POUCH_SIZE = 3;
export const BASE_TOKEN = "ottone";

// Gettoni ottenibili nel gioco (Pedinaro, zaini, boss). Da quando tutti gli
// effetti sono collegati e verificati (tests/token-effects.test.js), tutti.
// Per togliere un gettone dal gioco senza cancellarlo: toglilo da qui.

// Il Pedinaro (fase 4): baratto e prima visita.
export const PEDINARO = {
  barterRatio: 0.6,   // il gettone che dai deve valere almeno il 60% di quello che prendi
  barterTickets: 2,   // oppure 2 biglietti dalla tasca
};

// Tetti globali, applicati in un solo punto (utils/tokens.js).
export const TOKEN_CAPS = {
  maxDiscount: 0.35,        // sconto complessivo massimo sui prezzi
  maxMoneyBonus: 0.50,      // bonus complessivo massimo sui moltiplicatori di premio
  minSecretThreshold: 1,    // la soglia Fortuna dei nodi segreti non scende sotto
};

// price: costo dal Pedinaro · dup: € se lo trovi già posseduto ·
// weight: peso di pesca nell'offerta del Pedinaro.
export const TOKEN_RARITY = {
  base:          { label: "Base",          price: 0,  dup: 0,  weight: 0 },
  comune:        { label: "Comune",        price: 25, dup: 8,  weight: 55 },
  raro:          { label: "Raro",          price: 45, dup: 15, weight: 25 },
  maledetto:     { label: "Maledetto",     price: 60, dup: 20, weight: 8 },
  cianfrusaglia: { label: "Stravagante",   price: 15, dup: 5,  weight: 12 },
};

// Colore della rarità su schede e zaino.
export const TOKEN_RARITY_COLOR = {
  base: "#f2cf44", comune: "#b9c0c8", raro: "#5aa8ff", maledetto: "#d05aff", cianfrusaglia: "#e0894a",
};

export const DANGER_NODES = ["ladro", "miniboss", "spacciatore", "poliziotto"];
export const SAFE_NODES = ["locanda", "tabaccaio", "mendicante", "sacerdote", "chirurgo"];
export const COMBAT_NODES = ["ladro", "miniboss", "boss"];

// pro / contro / quando: le tre righe della scheda, testo per il giocatore.
// Tutti i numeri che la logica legge stanno in `n`.
// visual: effetto grafico mentre è la pedina (components/tokens/tokenVisuals.js).
// todo:   l'effetto di gioco non è ancora collegato (la grafica sì).
export const TOKENS = {
  // ── Base ──
  ottone: { name: "Gettone d'Ottone", rarity: "base",
    pro: "Pedina base", contro: "Nessuna", quando: "Sempre" },

  // ── Comuni ──
  ficheBlu: { name: "Fiche Blu", rarity: "comune",
    pro: "Tabaccai −10%", contro: "Ricompense dei combattimenti −10%",
    quando: "Tabaccaio / fine combattimento",
    n: { shopDelta: -0.10, combatRewardDelta: -0.10 } },
  monetaVicolo: { name: "Moneta del Vicolo", rarity: "comune",
    pro: "+€8 dopo un nodo pericoloso vinto", contro: "Locanda +€5",
    quando: "Vittoria su nodo pericoloso / locanda",
    n: { dangerWinMoney: 8, locandaFlat: 5 } },
  bigliaBambino: { name: "Biglia del Bambino", rarity: "comune",
    pro: "Il primo evento del bioma offre anche un grattino base",
    contro: "Con 5+ biglietti ne perdi uno casuale entrando nel bioma",
    quando: "Primo evento / ingresso bioma",
    n: { ticketLimit: 5 } },
  telefono: { name: "Gettone del Telefono", rarity: "comune",
    pro: "1 volta per bioma chiami e ti aprono il nodo segreto più vicino, senza Fortuna",
    contro: "Costa €1 a chiamata; 1 su 5 è un numero sbagliato e la chiamata è persa",
    quando: "Attivo, dalla scheda della pedina",
    n: { charges: 1, cost: 1, wrongNumberP: 0.2 } },
  magnetica: { name: "Pedina Magnetica", rarity: "comune",
    pro: "+€1 per ogni nodo attraversato", contro: "Il Poliziotto compare il doppio",
    quando: "Ogni nodo / nuova mappa",
    n: { perNodeMoney: 1, poliziottoChance: 0.14 } },
  sassolino: { name: "Sassolino", rarity: "comune",
    pro: "I furti ti tolgono metà: soldi dimezzati, e 50% di salvare l'oggetto", contro: "Il letto scricchiola: le stanze a pagamento curano 1 unghia in meno",
    quando: "Furto / locanda",
    n: { theftMult: 0.5, locandaHealLoss: 1 } },

  // ── Rari ──
  dado: { name: "Dado Scheggiato", rarity: "raro",
    pro: "1 volta per bioma apre un percorso in più verso la colonna dopo",
    contro: "Il nodo raggiunto così diventa élite",
    quando: "Attivo, dalla mappa, colonne 1–7",
    n: { charges: 1, minRow: 1, maxRow: 7 } },
  santino: { name: "Santino Plastificato", rarity: "raro",
    pro: "Annulla una multa, un furto o una maledizione",
    contro: "−1 Fortuna per i 3 nodi successivi",
    quando: "Automatico al primo evento negativo del bioma",
    n: { charges: 1, fortunePenalty: -1, penaltyNodes: 3 } },
  ficheTruccata: { name: "Fiche Truccata", rarity: "raro",
    pro: "Nodi segreti con 1 Fortuna in meno", contro: "Tabaccaio +15%",
    quando: "Mappa / tabaccaio",
    n: { secretDelta: -1, shopDelta: 0.15 } },
  mezzoCorno: { name: "Mezzo Corno", rarity: "raro",
    pro: "+1 Fortuna nelle colonne pari", contro: "−1 Fortuna nelle colonne dispari",
    quando: "Ingresso nodo" },
  denteOro: { name: "Dente d'Oro", rarity: "raro",
    pro: "Chirurgo e Macellaio −20%", contro: "Ogni combattimento perso: −€5",
    quando: "Chirurgo / sconfitta",
    n: { surgeonDelta: -0.20, lossMoney: -5 } },
  autoscontro: { name: "Gettone dell'Autoscontro", rarity: "raro",
    pro: "Nei nodi pericolosi 25% di rimbalzare accanto",
    contro: "Il rimbalzo è casuale", quando: "Scelta di un nodo pericoloso",
    n: { bounceP: 0.25 } },
  testaCroce: { name: "Testa o Croce", rarity: "raro",
    pro: "Al tabaccaio 50%: prezzi −20%", contro: "Altrimenti prezzi +20%",
    quando: "Ingresso tabaccaio",
    n: { swing: 0.20 } },

  // ── Maledetti ──
  nero: { name: "Gettone Nero", rarity: "maledetto",
    pro: "Nodi élite: ricompense ×1,5", contro: "Fino a 2 nodi pericolosi in più diventano élite",
    quando: "Élite / nuova mappa",
    n: { eliteRewardDelta: 0.5, extraElites: 2 } },
  contraffatto: { name: "Gettone Contraffatto", rarity: "maledetto",
    pro: "Vale il triplo nel baratto col Pedinaro",
    contro: "Il Poliziotto lo sequestra: multa €20", quando: "Pedinaro / Poliziotto",
    n: { barterMult: 3, fine: 20 } },
  incollata: { name: "Moneta Incollata", rarity: "maledetto",
    pro: "+1 Fortuna fissa", contro: "Non si toglie per 3 nodi",
    quando: "Sempre",
    n: { fortune: 1, lockNodes: 3 } },
  debito: { name: "Pedina del Debito", rarity: "maledetto",
    pro: "+€30 la prima volta che la equipaggi",
    contro: "Locanda −€10 finché è in custodia", quando: "Prima volta / locanda",
    n: { advance: 30, locandaFlat: 10 }, pouchWide: true },

  // ── Stravaganti: strani ma utili ──
  lira99: { name: "Lira del '99", rarity: "cianfrusaglia",
    pro: "Al tabaccaio 5% che valga €20", contro: "Altrimenti −1 Fortuna (1 volta per bioma)",
    quando: "Ingresso tabaccaio",
    n: { acceptP: 0.05, value: 20, shameFortune: -1 } },
  invisibile: { name: "Pedina Invisibile", rarity: "cianfrusaglia",
    pro: "I Ladri hanno il 15% di non vederti",
    contro: "Neanche il tabaccaio ti vede: niente sconti", quando: "Ladro / tabaccaio",
    n: { ladroMissP: 0.15 }, visual: "fantasma" },
  sorpresina: { name: "Sorpresina", rarity: "cianfrusaglia",
    pro: "Al primo boss battuto si apre e diventa un gettone nuovo", contro: "Chiusa non fa niente",
    quando: "Boss battuto", pouchWide: true },
  ferroStiro: { name: "Ferro da Stiro", rarity: "cianfrusaglia",
    pro: "Ogni 5 nodi senza combattere: ritira €20", contro: "La pazienza",
    quando: "Contatore nodi",
    n: { every: 5, money: 20 } },
  spumante: { name: "Tappo di Spumante", rarity: "cianfrusaglia",
    pro: "Primo nodo di ogni bioma: coriandoli e +€10",
    contro: "Il botto attira gente: un Ladro in più sulla mappa del bioma", quando: "Ingresso bioma",
    n: { money: 10, extraLadri: 1 }, visual: "coriandoli" },
  flipper: { name: "Gettone del Flipper", rarity: "cianfrusaglia",
    pro: "3 nodi dello stesso tipo di fila: +€15",
    contro: "4 di fila: TILT, effetti spenti per 1 nodo", quando: "Contatore tipi",
    n: { comboAt: 3, money: 15, tiltAt: 4 } },

  // ── Visivi: cambiano come vedi il gioco, e servono ──
  madreperla: { name: "Gettone di Madreperla", rarity: "raro",
    pro: "Vincite dei grattini +15%",
    contro: "Luccichi: attiri i ladri, un Ladro in più sulla mappa di ogni bioma", quando: "Grattini / nuova mappa",
    n: { scratchWinDelta: 0.15, extraLadri: 1 }, visual: "madreperla" },
  prisma: { name: "Prisma di Cristallo", rarity: "comune",
    pro: "Rifrange la fortuna: +1 Fortuna in ogni nodo evento",
    contro: "Fragile: dopo una sconfitta si incrina e resta spento per 2 nodi", quando: "Nodi evento / sconfitta",
    n: { eventFortune: 1, crackNodes: 2 }, visual: "prisma" },
  pellicola: { name: "Pellicola 35mm", rarity: "comune",
    pro: "Scena d'azione: premi contro Ladri e Spacciatori +20%",
    contro: "Sviluppare costa: −€3 a ogni combattimento", quando: "Combattimenti",
    n: { dangerRewardDelta: 0.20, combatCost: 3 }, visual: "pellicola" },
  umore: { name: "Gettone dell'Umore", rarity: "comune",
    pro: "Quando le unghie soffrono i colori si raffreddano e la locanda costa −20%",
    contro: "Quando hai più di €100 i colori si scaldano e il tabaccaio costa +10%", quando: "Sempre, segue il tuo stato",
    n: { painLocandaDelta: -0.20, richAt: 100, richShopDelta: 0.10 }, visual: "umore" },
  aura: { name: "Gettone Aura", rarity: "raro",
    pro: "Ogni vincita da €20 in su accende l'aura: +1 Fortuna per 2 nodi",
    contro: "Ogni sconfitta la spegne di rosso: −1 Fortuna per 2 nodi", quando: "Vincite / sconfitte",
    n: { winAt: 20, fortune: 1, nodes: 2 }, visual: "aura" },
  retino: { name: "Retino Tipografico", rarity: "comune",
    pro: "I grattini li stampi tu: costano −10%",
    contro: "Stampa economica: quando fai il premio massimo di un grattino, −10%", quando: "Tabaccaio / grattini",
    n: { cardPriceDelta: -0.10, maxPrizeDelta: -0.10 }, visual: "retino" },
  mercurio: { name: "Goccia di Mercurio", rarity: "maledetto",
    pro: "Il primo colpo subito in ogni combattimento ti scivola addosso",
    contro: "Metallo velenoso: ogni 5 nodi un'unghia peggiora di uno stato", quando: "Combattimenti / ogni 5 nodi",
    n: { every: 5 }, visual: "mercurio" },
  vhs: { name: "Gettone VHS", rarity: "raro",
    pro: "1 volta per bioma riavvolgi: un combattimento perso si rigioca da capo",
    contro: "Ogni riavvolgimento costa €10 di noleggio; l'immagine trema come una cassetta vecchia", quando: "Dopo una sconfitta",
    n: { charges: 1, rewindCost: 10 }, visual: "vhs" },
  specchietto: { name: "Specchietto del Barbiere", rarity: "comune",
    pro: "Tabaccai −15%",
    contro: "La mappa è al contrario: parti da destra e il boss sta a sinistra", quando: "Mappa / tabaccaio",
    n: { shopDelta: -0.15 }, visual: "specchio" },
};

export const TOKEN_RELEASE = Object.keys(TOKENS);

// Probabilità che un NPC regali davvero la sua pedina quando fai la scelta
// giusta: "non sempre" (proprietario, 2026-09-19). Se non la dà, può darla
// alla visita dopo nello stesso quartiere.
export const NPC_GIFT_CHANCE = 0.6;

// Regali degli NPC: esempi di partenza, uno per NPC e bioma.
export const NPC_TOKEN_GIFTS = {
  sacerdote:   "santino",
  bambino:     "bigliaBambino",
  spacciatore: "nero",
  poliziotto:  "ficheBlu",
  vecchio:     "dado",
  streamer:    "vhs",
  anziana:     "incollata",
};

// A cosa serve ogni gettone: filtri della modalità debug e del catalogo.
// utile = cambia soldi, fortuna o percorso · simpatico = ha una trovata
// divertente · visivo = cambia come vedi il gioco.
export const TOKEN_TAGS = {
  ottone: [],
  ficheBlu: ["utile"],
  monetaVicolo: ["utile"],
  bigliaBambino: ["utile", "simpatico"],
  telefono: ["utile", "simpatico"],
  magnetica: ["utile"],
  sassolino: ["utile"],
  dado: ["utile"],
  santino: ["utile", "simpatico"],
  ficheTruccata: ["utile"],
  mezzoCorno: ["utile", "simpatico"],
  denteOro: ["utile", "simpatico"],
  autoscontro: ["utile", "simpatico"],
  testaCroce: ["utile", "simpatico"],
  nero: ["utile"],
  contraffatto: ["utile", "simpatico"],
  incollata: ["utile"],
  debito: ["utile"],
  lira99: ["utile", "simpatico"],
  invisibile: ["utile", "simpatico", "visivo"],
  sorpresina: ["utile", "simpatico"],
  ferroStiro: ["utile", "simpatico"],
  spumante: ["utile", "simpatico", "visivo"],
  flipper: ["utile", "simpatico"],
  madreperla: ["utile", "visivo"],
  prisma: ["utile", "simpatico", "visivo"],
  pellicola: ["utile", "simpatico", "visivo"],
  umore: ["utile", "simpatico", "visivo"],
  aura: ["utile", "visivo"],
  retino: ["utile", "visivo"],
  mercurio: ["utile", "simpatico", "visivo"],
  vhs: ["utile", "simpatico", "visivo"],
  specchietto: ["utile", "simpatico", "visivo"],
};
