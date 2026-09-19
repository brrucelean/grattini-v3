import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { C, FONT, MAX_ITEMS, W, R } from "./data/theme.js";
import { KEYFRAMES, EFFECTS_CSS, ANIM } from "./styles/animations.js";
import { NAIL_INFO } from "./data/nails.js";
import { ACHIEVEMENTS } from "./data/achievements.js";
import { useLog } from "./hooks/useLog.js";
import { useMeta } from "./hooks/useMeta.js";
import { useAudioTheme } from "./hooks/useAudioTheme.js";
import { useVictoryCanvas } from "./hooks/useVictoryCanvas.js";
import { useNailEffects } from "./hooks/useNailEffects.js";
import { useNailHandlers } from "./hooks/useNailHandlers.js";
import { useItemHandlers } from "./hooks/useItemHandlers.js";
import { useShopHandlers } from "./hooks/useShopHandlers.js";
import { useScratchHandlers } from "./hooks/useScratchHandlers.js";
import { useNodeHandlers } from "./hooks/useNodeHandlers.js";
import { useEventHandlers } from "./hooks/useEventHandlers.js";
import { useSpacebarShortcut } from "./hooks/useSpacebarShortcut.js";
import { useIsMobile } from "./hooks/useIsMobile.js";
import { useReducedMotion } from "./hooks/useReducedMotion.js";
import { NODE_ICONS } from "./data/map.js";
import { ITEM_DEFS, RELIC_DEFS, GRATTATORE_DEFS } from "./data/items.js";
import { BIOMES, CEDOLE, BIOME_PALETTE, BOSS_MIN_MONEY } from "./data/biomes.js";
import { MECH_RULES } from "./data/cards.js";
import { AudioEngine } from "./audio.js";
import { Haptics } from "./utils/haptics.js";
import { degradeNailObj, healDamagedNails, nailCursor, grattatoreCursor } from "./utils/nail.js";
import { generateCard, generateIntroCards } from "./utils/card.js";
import {
  generateMap,
  LABIRINTO_CELL_PRIZE, LABIRINTO_JACKPOT,
  TESORO_X_PRIZE, TESORO_JACKPOT,
  COMBINA_COMBO_PRIZE, COMBINA_MEGA_MULT,
} from "./utils/map.js";

import { S } from "./utils/styles.js";
import { Tooltip } from "./components/Tooltip.jsx";
import { Btn } from "./components/Btn.jsx";
import { Asset } from "./components/Asset.jsx";
import { TicketThumb } from "./components/TicketThumb.jsx";
import { assetIdByName } from "./assets/nameIndex.js";
import { assetUrl } from "./assets/registry.js";
import { CarmeloLogBox, CarmeloScratchStrip } from "./components/DialogueBox.jsx";
import { NewsTicker } from "./components/NewsTicker.jsx";
import { HUD } from "./components/HUD.jsx";
import { NailSidebar } from "./components/NailSidebar.jsx";
import { RunBar } from "./components/shell/RunBar.jsx";
import { NailRail } from "./components/shell/NailRail.jsx";
import { LogColumn } from "./components/shell/LogColumn.jsx";
import { TickerRow } from "./components/shell/TickerRow.jsx";
import { Dossier, RightRail, TABLE_BG, MAT_STYLE, TableTopBar } from "./components/scratch/ScratchTable.jsx";
import { NodeThreshold } from "./components/node/NodeThreshold.jsx";
import { IntroDesk } from "./components/intro/IntroDesk.jsx";
import { TutorialDesk } from "./components/intro/TutorialDesk.jsx";
import { SelectCardDesk } from "./components/desk/SelectCardDesk.jsx";
import { GameOverDesk, VictoryDesk, CedoleDesk } from "./components/desk/EndScreens.jsx";
import { MK, mkPanel, MkButton, MkScreen, MkTitle } from "./components/desk/mapKit.jsx";
import { MinigameTable, CoverCell, MazeGlyph } from "./components/minigame/MinigameTable.jsx";
import { Backpack } from "./components/inventory/Backpack.jsx";
import { TokenPouchModal } from "./components/tokens/TokenPouchModal.jsx";
import { TokenCollection } from "./components/tokens/TokenCollection.jsx";
import { ResetProgress } from "./components/desk/ResetProgress.jsx";
import { PedinaroDesk } from "./components/tokens/PedinaroDesk.jsx";
import { TokenChoiceModal } from "./components/tokens/TokenChoiceModal.jsx";
import { Pedina } from "./components/map/Pedina.jsx";
import { TokenDebug, TokenPreviewBar } from "./components/tokens/TokenDebug.jsx";
import { TokenVisualLayer } from "./components/tokens/TokenVisualLayer.jsx";
import { TOKEN_VISUAL_CSS, visualOf, visualWrapperStyle, playLiquidPulse } from "./components/tokens/tokenVisuals.js";
import { onFx } from "./utils/fx.js";
import { TOKENS, TOKEN_RARITY, TOKEN_RELEASE, PEDINARO } from "./data/tokens.js";
import {
  createTokenState, acquireToken, resolveFullPouch, equipToken, discardToken,
  canSwapToken, onNodeResolved, returnToMap, onNegativeEvent, theftMult,
  openPedinaro, barterToken, compensationOffer,
  mapGenParams, onMapGenerated, rewindCombat, callTelefono, telefonoTarget,
  dadoOptions, rollDado, chargesLeft, firstHitShield,
} from "./utils/tokens.js";
import { TitleScreen } from "./components/TitleScreen.jsx";
import { RunStatsRail, ScratchLogRail } from "./components/ScratchSideRails.jsx";
// ScratchCell usato solo dentro ScratchCardView — non serve importarlo qui
import { STORAGE_KEYS, getStored, setStored, removeStored } from "./utils/storage.js";
import { fmtMoney, roundMoney } from "./utils/money.js";

// ─── LAZY CHUNKS — ogni schermata scaricata on-demand ─────────────────────────
const ScratchCardView  = lazy(() => import("./components/ScratchCardView.jsx").then(m => ({ default: m.ScratchCardView })));
// DEV-only: galleria biglietti (?ticket=<cardId>) per rivedere l'impaginazione dei 17.
const TicketGallery    = lazy(() => import("./components/TicketGallery.jsx").then(m => ({ default: m.TicketGallery })));
const DoppioONullaView = lazy(() => import("./components/DoppioONullaView.jsx").then(m => ({ default: m.DoppioONullaView })));
const MapView          = lazy(() => import("./components/MapView.jsx").then(m => ({ default: m.MapView })));
const MapBoard         = lazy(() => import("./components/map/MapBoard.jsx").then(m => ({ default: m.MapBoard })));
const ShopView         = lazy(() => import("./components/ShopView.jsx").then(m => ({ default: m.ShopView })));
const ShopZainoRail    = lazy(() => import("./components/ShopView.jsx").then(m => ({ default: m.ShopZainoRail })));
const LocandaView      = lazy(() => import("./components/LocandaView.jsx").then(m => ({ default: m.LocandaView })));
const EventView        = lazy(() => import("./components/EventView.jsx").then(m => ({ default: m.EventView })));
const CombatView       = lazy(() => import("./components/CombatView.jsx").then(m => ({ default: m.CombatView })));
// ═══════════════════════════════════════════════════════════════
//  G R A T T I N I  —  Beta 5
//  A roguelike scratch card game with ASCII aesthetics
// ═══════════════════════════════════════════════════════════════


// ─── LAZY FALLBACK — schermata di attesa per i chunk on-demand ───────────────
function LazyFallback() {
  return (
    <div style={{
      flex:1, display:"flex", alignItems:"center", justifyContent:"center",
      color:"#333355", fontFamily:"monospace", fontSize:"11px", letterSpacing:"2px",
    }}>
      ░░░
    </div>
  );
}

// ─── UTILITY FUNCTIONS ───────────────────────────────────────
// Schermate "ferme" in cui una run senza unghie va chiusa subito (grattino,
// combattimento e cella gestiscono da sé la propria sconfitta)
const IDLE_SCREENS = new Set(["map", "event", "preScratch", "shop", "locanda", "selectCard", "node", "labirinto", "grattaCombina", "mappaTesor0"]);

// ═══════════════════════════════════════════════════════════════
//  MAIN GAME COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Grattini() {
  // ─── DEV: ?ticket=<cardId> apre la galleria biglietti, saltando il gioco ───
  const devTicket = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get("ticket")
    : null;

  // ─── GAME STATE ─────────────────────────────────────────────
  const [screen, setScreen] = useState("title");
  const [player, setPlayer] = useState(null);
  const [map, setMap] = useState(null);
  const [currentRow, setCurrentRow] = useState(0);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  // ─── HOOK: useLog ───
  const { log, setLog, carmeloLog, setCarmeloLog, addLog, triggerNpcComment } = useLog();
  const [preScratchCount, setPreScratchCount] = useState(0);
  const [scratchingCard, setScratchingCard] = useState(null);
  const [combatEnemy, setCombatEnemy] = useState(null);
  const [, setIntroCardsLeft] = useState(3);
  const [introPrizes, setIntroPrizes] = useState([]); // prizes from both intro cards, not yet pocketed
  const [, setCardSelectMode] = useState(false);
  const [, setSelectedCardIdx] = useState(null);
  const [returnScreen, setReturnScreen] = useState(null); // where to go back after scratch
  const [currentBiome, setCurrentBiome] = useState(0);
  const [gameStats, setGameStats] = useState({ nodesVisited:0, moneyEarned:0, cardsScratched:0, scratchWins:0, scratchLosses:0 });
  const [firstScratchShown, setFirstScratchShown] = useState(false);
  const [hoveredIntroIdx, setHoveredIntroIdx] = useState(-1);
  const [cellaProgress, setCellaProgress] = useState(0); // graffi al muro in cella (0-8 = evaso)
  const [tutorialPage, setTutorialPage] = useState(0); // capitolo del quaderno: 0 dita · 1 duello · 2 strada · 3 pedina
  // ─── HOOK: useMeta ───
  const {
    achievements, setAchievements,
    activeCedola, setActiveCedola,
    pendingCedoleOffer, setPendingCedoleOffer,
    achievementToast,
    showTrophies, setShowTrophies,
    showReliquie, setShowReliquie,
    discoveredRelics, discoverRelic,
    discoverToken, discoveredTokens, resetMeta,
    enabledRelics, setEnabledRelics,
    showAllTimeStats, setShowAllTimeStats,
    unlockAchievement,
    updateAllTimeStats,
  } = useMeta();
  // ─── SPECIAL MINIGAME STATES ─────────────────────────────────
  const [scratchGameHost, setScratchGameHost] = useState(null); // colonna "sul tavolo" della grattata desktop
  const [labirintoState, setLabirintoState] = useState(null); // {pos, revealed, prize, grid, done}
  const [showPedine, setShowPedine] = useState(false); // G-01: collezione pedine (Archivio della home)
  const [showResetProgress, setShowResetProgress] = useState(false); // Impostazioni → azzera progressi
  const [combinaState, setCombinaState] = useState(null); // gratta & combina
  const [tesoroState, setTesoroState] = useState(null); // mappa del tesoro
  // nessuno zoom — il contenuto riempie il frame 16:9 naturalmente

  // ─── HOOK: useAudioTheme ───
  useAudioTheme({ screen, currentNode, combatEnemy, currentBiome });

  useEffect(() => AudioEngine.bindUI(), []);


  // Commenti reattivi al cambio schermata
  useEffect(() => {
    if (!player) return;
    if (screen === "shop") triggerNpcComment("shop");
    else if (screen === "combat") triggerNpcComment("combat");
    else if (screen === "map") triggerNpcComment("map");
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Haptics al cambio schermata ──────────────────────────────
  useEffect(() => {
    if (screen === "gameOver")  Haptics.gameOver();
    if (screen === "victory")   Haptics.victory();
    if (screen === "combat")    Haptics.tap();
    if (screen === "map")       Haptics.tap();
  }, [screen]);

  const updatePlayer = useCallback((updates) => {
    setPlayer(p => {
      let next = typeof updates === "function" ? updates(p) : {...p, ...updates};
      // Soldi sempre al centesimo: tanti gestori fanno p.money - X su importi con
      // i decimali (sconti, Poveraccio a €0,45) e lasciavano €31.200000000000003.
      if (next !== p && typeof next?.money === "number" && next.money !== p?.money) {
        next = {...next, money: roundMoney(next.money)};
      }
      // Ka-ching! quando il money aumenta
      if (next.money > p.money) AudioEngine.cash();
      return next;
    });
  }, []);

  // ─── GAME INITIALIZATION ───────────────────────────────────
  const startGame = () => {
    AudioEngine.init(); // sblocca AudioContext durante gesto utente
    const newPlayer = {
      money: 0,
      nails: Array(5).fill(null).map(() => ({ state: "sana", scratchCount: 0, implant: null, implantUses: 0, stats: { fortuna: 0, potenza: 0, resilienza: 0 }, heldItem: null, cremaHP: 0 })),
      activeNail: 0,
      items: [],
      grattatori: [], // { id, name, emoji, effect, usesLeft }
      equippedGrattatore: null,
      scratchCards: generateIntroCards(3),
      fortune: 0,
      fortuneTurns: 0,
      smokesTotal: 0,
      tumore: false,
      // Sprint 2: tick counters per risk/reward sigarette
      sigarettaTicks: 0, // -> unghiaNera quando raggiunge 0
      erbaTicks: 0,      // -> polliceVerde quando raggiunge 0
      consecutiveWins: 0,
      grattaMania: false,
      grattaManiaTurns: 0,
      skills: [],
      anzianaVisits: 0,
      vecchioVisits: 0,
      monetaCineseActive: false,
      clipViraleActive: false,
      cappelloSbirroWorn: false, // true = indossato e attivo
      // Sprint 4: tensione psicologica
      streamerFollowers: 0, // aumenta con streamerLive → donazioni dinamiche in combat
      snitchedOn: false,    // true dopo Snitch al Poliziotto → spacciatore ostile
      bluffsBought: 0,      // quanti falsi-vincenti comprati dallo spacciatore (stat)
      // Sprint 5: Giornaletto Porno
      giornalettoRead: false, // true mentre il giornaletto è letto recentemente → Poliziotto ti becca
      giornalettoTicks: 0,    // grattate rimanenti prima che svanisca l'effetto
      grattedCards: [], // storico carte grattate: [{typeId, tier, isWinner, prize, name}]
      lastWonPrize: 0, // ultimo premio vinto (per Doppio o Nulla x2)
      extraTiles: [], // tile extra nel grattino corrente (es. monetaCinese)
      relics: enabledRelics.map(id => RELIC_DEFS[id] ? {id, ...RELIC_DEFS[id]} : null).filter(Boolean), // reliquie abilitate dalla meta
      tokens: createTokenState(), // G-01: pedina attiva + custodia gettoni (solo run)
    };
    discoverToken("ottone");
    // Applica cedola attiva se presente
    let finalPlayer = newPlayer;
    const cedolaId = activeCedola;
    if (cedolaId) {
      const cedolaDef = CEDOLE.find(c => c.id === cedolaId);
      if (cedolaDef) {
        // bonusStartCard (Tacchino) resta in sospeso fino alla fine dell'intro: vedi leaveIntro
        finalPlayer = cedolaDef.apply(newPlayer);
        addLog(`🃏 Cedola attiva: ${cedolaDef.icon} ${cedolaDef.name}`, C.gold);
      }
    }
    setPlayer(finalPlayer);
    setCurrentBiome(0);
    setMap(generateMap(0));
    setCurrentRow(0);
    setVisitedNodes([]);
    setLog([]);
    setCarmeloLog([`Eh figliolo... settant'anni di tabaccheria e adesso non ci vedo più niente.\nHo questi tre grattini qui, me li gratti tu?\nTieniti quello che vuoi, tanto non ci vedo, e il buio è uguale vincere o perdere.`]);
    setPreScratchCount(0);
    setIntroCardsLeft(3);
    setIntroPrizes([]);
    setGameStats({ nodesVisited:0, moneyEarned:0, cardsScratched:0, scratchWins:0, scratchLosses:0, moneySpent:0, combatsWon:0, combatsLost:0, nailsLost:0, dreamsHad:0, slotPlays:0, bestPrize:0, combosFired:0, _chirurgoUses:0, _broke:false });
    setFirstScratchShown(false);
    setVictoryRevealed(false);
    setTutorialPage(0);
    setScreen("tutorialNails");
    addLog(`Benvenuto a ${BIOMES[0].name}!`, C.cyan);
    addLog("Nonno Carmelo ti ferma al bancone. Ha tre biglietti e mani che tremano. Gratti tu, scegli tu.", C.gold);
  };

  // Fine dell'intro di Nonno Carmelo. Il grattino del Tacchino di Natale arriva
  // qui: messo subito nel mazzo diventava un quarto biglietto dell'intro (di cui
  // si intasca un solo premio) e "Rifiuta" lo buttava via.
  const leaveIntro = () => {
    if (player.bonusStartCard) {
      const bonusCard = {...generateCard(player.bonusStartCard), owned: true};
      updatePlayer(p => ({...p, scratchCards: [...p.scratchCards, bonusCard], bonusStartCard: null}));
      addLog(`🦃 Il Tacchino di Natale: ${bonusCard.name} gratis nel mazzo!`, C.gold);
    }
    setScreen("map");
  };

  // ─── HOOK: useNailEffects ───
  const { globalPainFlash, nailDeathFlash, setNailDeathFlash, screenShake, moneyBling } = useNailEffects({ player, screen, gameStats, unlockAchievement, updateAllTimeStats, addLog });

  // ─── HOOK: useVictoryCanvas ───
  const { victoryRevealed, setVictoryRevealed, victoryCanvasRef, victoryDrawing, handleVictoryScratch } = useVictoryCanvas({ screen });

  // ─── HELPER: isAlive ────────────────────────────────────────
  const isAlive = (nails) => {
    const n = nails || player?.nails;
    if (!n) return true;
    return n.some(nail => nail.state !== "morta");
  };

  // ─── RETE DI SICUREZZA UNGHIE ─────────────────────────────
  // "Quando una muore, passi automaticamente alla prossima" (tutorial): eventi,
  // combattimento e sogni uccidevano un'unghia senza spostare quella attiva,
  // che restava morta e bloccava la grattata finché non la si cambiava a mano.
  useEffect(() => {
    if (!player || player.nails[player.activeNail]?.state !== "morta") return;
    updatePlayer(p => {
      if (p.nails[p.activeNail]?.state !== "morta") return p;
      const alive = p.nails.findIndex(n => n.state !== "morta");
      return alive >= 0 ? {...p, activeNail: alive} : p;
    });
  }, [player?.nails, player?.activeNail, updatePlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Zero unghie fuori da grattini e combattimenti (eventi, sogni, minigiochi):
  // prima la run restava in piedi senza vita.
  useEffect(() => {
    if (!player || scratchingCard || !IDLE_SCREENS.has(screen)) return;
    if (!isAlive(player.nails)) setScreen("gameOver");
  }, [player?.nails, screen, scratchingCard]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ultima unghia persa in combattimento: game over dopo un attimo, il tempo di
  // vedere il colpo (prima il timer partiva dentro l'updater di setPlayer).
  useEffect(() => {
    if (screen !== "combat" || !player || isAlive(player.nails)) return;
    const t = setTimeout(() => setScreen("gameOver"), 800);
    return () => clearTimeout(t);
  }, [player?.nails, screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── HOOK: useNailHandlers ───
  const { playerRelicEffects, effectiveFortune, getActiveNailState, handleCellScratch, handleNailDamage, handleCombatCellScratch, consumeGrattatore } = useNailHandlers({
    player, updatePlayer, triggerNpcComment, scratchingCard, addLog,
  });

  // ─── HOOK: useItemHandlers ───
  const {
    itemFoundModal, setItemFoundModal,
    nailEquipModal, setNailEquipModal,
    nailEquipCallbackRef,
    nailEquipResult, setNailEquipResult,
    smokeChoiceModal, setSmokeChoiceModal,
    showSmokeEffect,
    showInventoryPanel, setShowInventoryPanel,
    stampOverlay,
    showItemFound,
    handleCardItemFound,
    handleSmoke,
    handleSaveSmoke,
    handleUseItem,
  } = useItemHandlers({ player, updatePlayer, addLog });
  // Riferimento stabile per HUD (memoizzato) — un'arrow function inline nel JSX
  // sarebbe una nuova identità ad ogni render, vanificando il memo.
  const toggleInventoryPanel = useCallback(() => setShowInventoryPanel(v => {
    AudioEngine.bagToggle(!v);
    return !v;
  }), [setShowInventoryPanel]);

  // ─── HOOK: useShopHandlers ───
  const { handleBuyCard, handleBuyItem, handleBuyGrattatore, handleSlotResult, handleShopScratch } = useShopHandlers({
    player, gameStats, updatePlayer, addLog, setGameStats, setCardSelectMode, setScreen, setReturnScreen, effectiveFortune, unlockAchievement,
    setItemFoundModal, currentBiome,
  });

  // ─── GETTONI DEL DESTINO (G-01) ───────────────────────────
  // Tutta la logica sta in utils/tokens.js: qui solo stato, log e modali.
  const [pendingToken, setPendingToken] = useState(null); // { id, biome } a custodia piena
  // Modalità debug dei gettoni (solo sviluppo o ?debug nell'URL): catalogo
  // grafico + prova degli effetti visivi sullo schermo.
  const tokenDebugEnabled = import.meta.env.DEV || new URLSearchParams(window.location.search).has("debug");
  const [tokenDebugOpen, setTokenDebugOpen] = useState(false);
  const [tokenPreview, setTokenPreview] = useState(null);
  const [confettiBurst, setConfettiBurst] = useState(false); // Tappo di Spumante
  const [pedinaroVisit, setPedinaroVisit] = useState(null);   // { sale, barter, gift, first, done }
  const [pedinaroLine, setPedinaroLine] = useState("");
  const [tokenChoice, setTokenChoice] = useState(null);       // compensazione del boss: [id, id]

  // Dà un gettone al giocatore. `withModal: false` quando il chiamante ha già
  // un popup suo (es. sblocco bioma) e vuole solo la riga da aggiungere.
  // Restituisce una riga di testo che descrive l'esito.
  // pay: { money, tickets } — prezzo del Pedinaro. Si paga solo quando il
  // gettone entra davvero in custodia (con la custodia piena, alla scelta).
  const payFor = (p, pay) => {
    if (!pay) return p;
    let scratchCards = p.scratchCards;
    if (pay.tickets) {
      // i biglietti meno cari: il Pedinaro si accontenta
      const idx = p.scratchCards.map((c, i) => [c.cost || 0, i]).sort((a, b) => a[0] - b[0]).slice(0, pay.tickets).map(x => x[1]);
      scratchCards = p.scratchCards.filter((_, i) => !idx.includes(i));
    }
    return {...p, money: roundMoney(p.money - (pay.money || 0)), scratchCards};
  };
  const grantToken = useCallback((tokenId, { source = "Trovato", withModal = true, pay = null } = {}) => {
    const def = TOKENS[tokenId];
    if (!def || !player?.tokens) return null;
    discoverToken(tokenId);
    const biome = currentBiome;
    const r = acquireToken(player.tokens, tokenId, { biome });
    if (r.outcome === "full") {
      setPendingToken({ id: tokenId, biome, pay });
      addLog(`🪙 ${def.name}: custodia piena, scegli cosa tenere.`, C.gold);
      return `🪙 GETTONE: ${def.name} — custodia piena, scegli cosa tenere.`;
    }
    updatePlayer(p => {
      const rr = acquireToken(p.tokens, tokenId, { biome });
      if (rr.outcome === "added") return payFor({...p, tokens: rr.state}, pay);
      if (rr.outcome === "duplicate") return {...p, money: p.money + rr.money};
      return p;
    });
    AudioEngine.tokenInsert();
    const line = r.outcome === "duplicate"
      ? `🪙 ${def.name} già in custodia: rivenduto per €${r.money}.`
      : `🪙 GETTONE: ${def.name} — ${def.pro}. Fregatura: ${def.contro}.`;
    addLog(line, C.gold);
    if (withModal && r.outcome === "added") {
      setItemFoundModal({
        emoji: "🪙", tokenId, name: def.name,
        desc: `VANTAGGIO: ${def.pro}\nFREGATURA: ${def.contro}\nQUANDO: ${def.quando}\n\nÈ nella custodia (zaino → GETTONI). Clicca la pedina sulla mappa per equipaggiarlo.`,
        subtitle: `${source} · Gettone ${TOKEN_RARITY[def.rarity].label}`,
      });
    }
    return line;
  }, [player, currentBiome, updatePlayer, addLog, discoverToken]);

  const resolvePendingToken = (opts) => {
    if (!pendingToken) return;
    const { id, biome, pay } = pendingToken;
    const r = resolveFullPouch(player.tokens, id, { ...opts, biome });
    updatePlayer(p => {
      const next = {...p, tokens: r.state, money: p.money + (r.money || 0)};
      return opts.choice === "refuse" ? next : payFor(next, pay); // rifiutato = non paghi
    });
    setPendingToken(null);
    if (opts.choice === "refuse") { addLog(`🪙 Lasci ${TOKENS[id].name} dove l'hai trovato.`, C.dim); return; }
    if (pay) setPedinaroVisit(v => (v ? {...v, done: {...v.done, [id]: true}} : v));
    AudioEngine.tokenInsert();
    addLog(`🪙 Butti ${TOKENS[opts.discardId].name} e tieni ${TOKENS[id].name}${opts.choice === "equip" ? " come pedina" : ""}.`, C.gold);
  };

  const handleEquipToken = (tokenId) => {
    if (!player?.tokens || !canSwapToken(player.tokens) || !player.tokens.pouch.includes(tokenId)) { AudioEngine.error(); return; }
    const r = equipToken(player.tokens, tokenId);
    updatePlayer(p => ({...p, tokens: r.state, money: p.money + r.money}));
    AudioEngine.tokenInsert();
    addLog(`🪙 Pedina: ${TOKENS[tokenId].name}. ${TOKENS[tokenId].pro}.`, C.gold);
  };

  const handleDiscardToken = (tokenId) => {
    if (!player?.tokens) return;
    try {
      updatePlayer(p => ({...p, tokens: discardToken(p.tokens, tokenId)}));
      addLog(`🪙 Butti ${TOKENS[tokenId].name}.`, C.dim);
    } catch { AudioEngine.error(); }
  };

  // Mappa di un nuovo bioma con gli effetti della pedina (Magnetica: più
  // Poliziotti · Nero: élite in più · Madreperla/Spumante: un Ladro in più).
  const makeMap = useCallback((biome) => {
    const ts = player?.tokens;
    return ts ? onMapGenerated(ts, generateMap(biome, mapGenParams(ts))) : generateMap(biome);
  }, [player?.tokens]);

  // Santino Plastificato: prova ad annullare una multa, un furto o una
  // maledizione. true = annullato (il chiamante salta l'effetto negativo).
  const NEGATIVE_LABEL = { multa: "multa annullata", furto: "furto annullato", maledizione: "maledizione annullata" };
  const tokenBlocksNegative = useCallback((kind) => {
    if (!player?.tokens) return false;
    const r = onNegativeEvent(player.tokens, kind, currentBiome);
    if (!r.cancelled) return false;
    updatePlayer(p => ({...p, tokens: onNegativeEvent(p.tokens, kind, currentBiome).state}));
    addLog(`🪙 Santino Plastificato: ${NEGATIVE_LABEL[kind]}! In cambio −1 Fortuna per i prossimi 3 nodi.`, C.gold);
    AudioEngine.tokenInsert();
    return true;
  }, [player?.tokens, currentBiome, updatePlayer, addLog]);
  const tokenTheftMult = player?.tokens ? theftMult(player.tokens) : 1;

  // Gettone VHS: su una sconfitta riavvolge il combattimento (1 per bioma, €10).
  const [combatRunId, setCombatRunId] = useState(0);
  const tryRewindCombat = () => {
    if (!player?.tokens) return false;
    const r = rewindCombat(player.tokens, currentBiome, player.money);
    if (!r) return false;
    updatePlayer(p => ({...p, money: p.money - r.cost, tokens: r.state}));
    addLog(`📼 Gettone VHS: RIAVVOLGI! Il combattimento riparte da capo (−€${r.cost} di noleggio).`, C.gold);
    setCombatRunId(n => n + 1);
    return true;
  };

  // Telefono: apre il segreto più vicino. Dado: apre un percorso in più.
  const handleCallTelefono = () => {
    if (!player?.tokens || !map) return;
    const target = telefonoTarget(player.tokens, map, currentRow);
    if (!target) { addLog("📞 Nessun nodo segreto da aprire davanti a te.", C.dim); AudioEngine.error(); return; }
    if (player.money < 1) { addLog("📞 Ti serve almeno €1 per la chiamata.", C.red); AudioEngine.error(); return; }
    try {
      const r = callTelefono(player.tokens, currentBiome, { targetId: target.id });
      updatePlayer(p => ({...p, tokens: r.state, money: p.money + r.money}));
      addLog(r.revealed ? "📞 Pronto? Ti hanno aperto il nodo segreto più vicino!" : "📞 Numero sbagliato... la chiamata è persa (−€1).", r.revealed ? C.gold : C.red);
    } catch { AudioEngine.error(); }
  };
  const dadoFrom = map && currentRow > 0 ? map.rows[currentRow - 1]?.find(n => visitedNodes.includes(n.id)) : null;
  const dadoTargets = player?.tokens && dadoFrom && map ? dadoOptions(player.tokens, map, dadoFrom, currentBiome) : [];
  const handleRollDado = (targetId) => {
    try {
      const r = rollDado(player.tokens, map, dadoFrom, targetId, currentBiome);
      setMap(r.map);
      updatePlayer(p => ({...p, tokens: r.state}));
      addLog("🎲 Dado Scheggiato: si apre un percorso in più... verso un nodo ÉLITE.", C.orange);
    } catch { AudioEngine.error(); }
  };
  const tokenPowers = player?.tokens ? {
    telefono: player.tokens.equipped === "telefono" ? { left: chargesLeft(player.tokens, "telefono", currentBiome), onUse: handleCallTelefono } : null,
    dado: player.tokens.equipped === "dado" ? { left: chargesLeft(player.tokens, "dado", currentBiome), targets: dadoTargets, onPick: handleRollDado } : null,
  } : null;

  // ─── IL PEDINARO (fase 4) ───────────────────────────────
  const PEDINARO_LINES = {
    first: "Ehi, ehi. Hai la faccia di uno che cammina ancora col gettone d'ottone. Io sono il Pedinaro: compro, vendo, baratto pedine. Uno per quartiere, e io sono quello onesto. Più o meno.",
    gift: " E siccome è la prima volta... uno di questi due te lo regalo. Scegli bene.",
    back: [
      "Di nuovo tu. Le pedine non si consumano, la fortuna sì.",
      "Oggi ho roba buona. Almeno una delle due.",
      "Guarda pure. Toccare costa niente, girare sulla mappa costa tutto.",
    ],
    buy: "Affare fatto. Se ti porta sfortuna, non sono stato io.",
    barter: "Scambio onesto. Il tuo lo metto in vetrina, qualcuno ci casca.",
    gifted: "Tienilo. Il prossimo lo paghi, eh.",
    empty: "Hai già tutto quello che ho. Complimenti, o condoglianze.",
  };
  const openPedinaroVisit = () => {
    if (!player?.tokens) return;
    const r = openPedinaro(player.tokens, { pool: TOKEN_RELEASE });
    updatePlayer(p => ({...p, tokens: {...p.tokens, counters: {...p.tokens.counters, metPedinaro: true}}}));
    setPedinaroVisit(r.visit);
    [r.visit.sale, r.visit.barter].filter(Boolean).forEach(o => discoverToken(o.id)); // visto = in collezione
    setPedinaroLine(!r.visit.sale ? PEDINARO_LINES.empty
      : r.visit.first ? PEDINARO_LINES.first + (r.visit.gift ? PEDINARO_LINES.gift : "")
      : PEDINARO_LINES.back[Math.floor(Math.random() * PEDINARO_LINES.back.length)]);
    AudioEngine.tokenInsert();
  };
  const pedinaroDone = (id, line) => {
    setPedinaroVisit(v => (v ? {...v, gift: false, done: {...v.done, [id]: true}} : v));
    setPedinaroLine(line);
  };
  const handlePedinaroBuy = (id) => {
    const price = TOKEN_RARITY[TOKENS[id].rarity].price;
    if (player.money < price) { AudioEngine.error(); return; }
    const full = player.tokens.pouch.length >= 3;
    grantToken(id, { source: "Comprato dal Pedinaro", withModal: false, pay: { money: price } });
    addLog(`🪙 Compri ${TOKENS[id].name} dal Pedinaro per €${price}.`, C.gold);
    if (!full) pedinaroDone(id, PEDINARO_LINES.buy);
    else setPedinaroLine("Custodia piena? Fai spazio, poi ne parliamo.");
  };
  const handlePedinaroGift = (id) => {
    grantToken(id, { source: "Regalo del Pedinaro", withModal: false });
    pedinaroDone(id, PEDINARO_LINES.gifted);
  };
  const handlePedinaroBarterToken = (giveId, wantId) => {
    try {
      barterToken(player.tokens, giveId, wantId, { biome: currentBiome }); // valida prima: lancia se non si può
      updatePlayer(p => ({...p, tokens: barterToken(p.tokens, giveId, wantId, { biome: currentBiome })}));
      discoverToken(wantId);
      AudioEngine.tokenInsert();
      addLog(`🪙 Baratti ${TOKENS[giveId].name} con ${TOKENS[wantId].name}.`, C.gold);
      pedinaroDone(wantId, PEDINARO_LINES.barter);
    } catch { AudioEngine.error(); }
  };
  const handlePedinaroBarterTickets = (wantId) => {
    if (player.scratchCards.length < PEDINARO.barterTickets) { AudioEngine.error(); return; }
    const full = player.tokens.pouch.length >= 3;
    grantToken(wantId, { source: "Barattato dal Pedinaro", withModal: false, pay: { tickets: PEDINARO.barterTickets } });
    addLog(`🪙 Dai ${PEDINARO.barterTickets} biglietti al Pedinaro per ${TOKENS[wantId].name}.`, C.gold);
    if (!full) pedinaroDone(wantId, PEDINARO_LINES.barter);
    else setPedinaroLine("Custodia piena? Fai spazio, poi ne parliamo.");
  };

  // Compensazione del boss: nessun gettone preso nel bioma → scegline uno tra due comuni
  const offerCompensation = () => {
    if (!player?.tokens) return false;
    const ids = compensationOffer(player.tokens, { pool: TOKEN_RELEASE });
    if (!ids.length) return false;
    ids.forEach(discoverToken);
    setTokenChoice(ids);
    return true;
  };

  // Solo in sviluppo, per il playtest: window.__gettoni.grant("ficheBlu")
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__gettoni = {
      grant: (id) => grantToken(id, { source: "Dev" }), ids: Object.keys(TOKENS), catalog: () => setTokenDebugOpen(true),
      pedinaro: () => { openPedinaroVisit(); setScreen("pedinaro"); },
    };
  }, [grantToken]);

  // Ritorno sulla mappa: chiude il nodo (effetti di fine nodo) e scongela la pedina.
  useEffect(() => {
    if (screen !== "map" || !player?.tokens?.snapshot) return;
    const r = onNodeResolved(player.tokens, currentNode || { type: "start", row: 0 }, { biome: currentBiome });
    updatePlayer(p => {
      if (!p.tokens?.snapshot) return p;
      let nails = p.nails;
      // Goccia di Mercurio: un'unghia viva peggiora di uno stato
      if (r.nailDamage) {
        nails = [...p.nails];
        const i = nails.findIndex(n => n.state !== "morta");
        if (i >= 0) nails[i] = degradeNailObj(nails[i], 1);
      }
      return {...p, nails, money: Math.max(0, p.money + r.money), tokens: returnToMap(r.state)};
    });
    r.log.forEach(line => addLog(`🪙 ${line}`, C.gold));
    if (r.confetti) { setConfettiBurst(true); setTimeout(() => setConfettiBurst(false), 3500); }
  }, [screen, player?.tokens?.snapshot]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── HOOK: useScratchHandlers ─── (dopo i gettoni: riceve makeMap)
  const { doppioONulla, handleScratchDone, handleDoppioDecline, handleDoppioResult } = useScratchHandlers({
    player, scratchingCard, returnScreen, currentNode, currentRow, currentBiome,
    updatePlayer, addLog, triggerNpcComment, consumeGrattatore, unlockAchievement,
    setGameStats, setScratchingCard, setReturnScreen, setCardSelectMode, setSelectedCardIdx,
    setScreen, setIntroCardsLeft, setIntroPrizes, setItemFoundModal,
    setMap, setCurrentRow, setVisitedNodes, setCurrentNode, setCurrentBiome,
    setPlayer, isAlive, makeMap,
  });

  // ─── HOOK: useNodeHandlers ───
  const { dreamModal, setDreamModal, selectNode, enterNode, handlePreScratch, handleSelectCard, handleRest, handleCombatEnd } = useNodeHandlers({
    player, currentNode, currentBiome,
    updatePlayer, addLog, unlockAchievement, updateAllTimeStats,
    consumeGrattatore,
    setScreen, setCurrentNode, setVisitedNodes, setCurrentRow, setPreScratchCount,
    setGameStats, setCardSelectMode, setReturnScreen, setScratchingCard, setSelectedCardIdx,
    setCombatEnemy, setCurrentBiome, setMap, setPlayer,
    setItemFoundModal, discoverRelic, activeCedola, setPendingCedoleOffer,
    setLabirintoState, setCombinaState, setTesoroState,
    effectiveFortune, gameStats, isAlive, grantToken,
    map, makeMap, tokenBlocksNegative, tokenTheftMult, tryRewindCombat,
    openPedinaroVisit, offerCompensation,
  });

  // ─── HOOK: useEventHandlers ───
  const { handleEventChoice } = useEventHandlers({
    player, currentNode, currentBiome, effectiveFortune,
    updatePlayer, addLog, unlockAchievement, showItemFound, discoverRelic,
    setScreen, setCombatEnemy, setGameStats, setCellaProgress,
    setItemFoundModal, setSmokeChoiceModal,
    setScratchingCard, setReturnScreen, grantToken,
    tokenBlocksNegative, tokenTheftMult,
  });

  // ─── HOOK: useSpacebarShortcut ───
  useSpacebarShortcut({ screen, startGame, handlePreScratch, enterNode, preScratchCount, player, setScreen });

  // ─── GRATTATORE EQUIP/UNEQUIP ─────────────────────────────
  // useCallback: riferimento stabile finché `player` non cambia davvero, altrimenti
  // il memo su NailSidebar (che riceve questa funzione come prop) non serve a nulla.
  const equipGrattatore = useCallback((idx) => {
    updatePlayer(p => {
      const g = p.grattatori[idx];
      return {...p, equippedGrattatore: {...g, inventoryIdx: idx}};
    });
    addLog(`Grattatore equipaggiato: ${player.grattatori[idx]?.name}`, C.cyan);
  }, [player, updatePlayer, addLog]);

  const unequipGrattatore = () => {
    updatePlayer(p => ({...p, equippedGrattatore: null}));
  };

  // Toggle equip/unequip per la fiancata del banco (RunStatsRail): un click
  // sul grattatore già attivo lo toglie, altrimenti lo equipaggia — stesso
  // comportamento dello zaino a schermo intero, in versione compatta.
  const handleRailEquipGrattatore = (idx) => {
    if (player.equippedGrattatore?.inventoryIdx === idx) unequipGrattatore();
    else equipGrattatore(idx);
  };

  // ─── NAIL SELECT ──────────────────────────────────────────
  const handleSelectNail = useCallback((i) => {
    if (scratchingCard) return; // locked during scratch
    updatePlayer(p => ({...p, activeNail: i}));
    addLog(`Unghia ${i+1} selezionata come attiva.`, C.cyan);
  }, [scratchingCard, updatePlayer, addLog]);

  // ─── MINIGIOCHI (labirinto / combina / tesoro): chiusura ────
  // Si torna da dove si era partiti: prima una carta comprata e giocata nel
  // Tabaccaio rimandava all'anteprima del nodo invece che al negozio.
  // Esito dei minigiochi su desktop: invece di chiudere subito (si tornava al
  // tabaccaio senza capire cosa fosse successo) il biglietto resta aperto,
  // tutto scoperto, con il cartello dell'esito e CONTINUA.
  const [minigameResult, setMinigameResult] = useState(null);
  const endMinigame = (result, revealAll) => {
    if (!wideShell) { closeMinigame(); return; }
    revealAll?.();
    setMinigameResult(result);
  };
  const closeMinigame = () => {
    setMinigameResult(null);
    setLabirintoState(null); setCombinaState(null); setTesoroState(null);
    setCardSelectMode(false); setSelectedCardIdx(null);
    setScreen(returnScreen === "shop" ? "shop" : currentNode ? "preScratch" : "map");
    setReturnScreen(null);
  };

  // ─── GET REACHABLE NODES ───────────────────────────────────
  const getReachableNodes = () => {
    if (!map) return [];
    if (currentRow === 0) return map.rows[0].map(n => n.id);
    const reachable = new Set();
    map.rows[currentRow - 1]?.forEach(node => {
      if (node && visitedNodes.includes(node.id)) {
        (map.connections[node.id] || []).forEach(id => reachable.add(id));
      }
    });
    if (reachable.size === 0 && currentRow <= 1) {
      map.rows[currentRow]?.forEach(n => n && reachable.add(n.id));
    }
    return [...reachable];
  };

  // ─── RENDER ─────────────────────────────────────────────────
  // Cursore globale: mano pixel-art con unghia del colore dello stato attivo.
  // Appena un grattatore è equipaggiato, il puntatore diventa l'attrezzo stesso
  // — "lo vedi in mano" al posto del dito — subito, non solo mentre si gratta
  // un grattino: equipaggiare è già "prendere in mano" l'attrezzo.
  const globalNailState = player?.nails?.[player?.activeNail ?? 0]?.state ?? "sana";
  const baseNailCursor = nailCursor(screen === "gameOver" ? "scheletro" : globalNailState);
  const globalNailCursor = player?.equippedGrattatore
    ? grattatoreCursor(player.equippedGrattatore.id, baseNailCursor)
    : baseNailCursor;

  // Neon dimming: glow effects fade when few nails alive
  const aliveCount = player?.nails?.filter(n => n.state !== "morta").length ?? 5;
  const neonDim = aliveCount <= 1 ? 0.3 : aliveCount <= 2 ? 0.5 : aliveCount <= 3 ? 0.7 : 1.0;

  const bioPal = BIOME_PALETTE[currentBiome] || BIOME_PALETTE[0];

  // ─── SFONDO DELLO STAGE 16:9 — scena per schermata ───────────
  // Un unico background sullo stage (CSS multi-layer: gradiente scuro + immagine,
  // entrambi dietro al contenuto → nessun problema di z-index).
  const stageScene =
      screen === "title"   ? assetUrl("scene-title")
    : screen === "shop"    ? assetUrl("scene-shop")
    : screen === "locanda" ? assetUrl("scene-locanda")
    : screen === "combat"  ? assetUrl("scene-combat")
    : screen === "cella"   ? assetUrl("scene-cella")
    : screen === "gameOver"? assetUrl("scene-gameover")
    : screen === "victory" ? assetUrl("scene-victory")
    : (screen === "map" || screen === "event" || screen === "node")
                           ? assetUrl(`scene-biome-${currentBiome}`)
    : null;
  const stageBg = stageScene
    ? `linear-gradient(rgba(4,4,12,0.72), rgba(3,3,10,0.82)), url(${stageScene}) center / cover no-repeat`
    : bioPal.bg;

  // iPhone/mobile: layout verticale a colonna singola invece di 3 colonne
  const { isMobile, vw, vh: stageH, scale: stageScale } = useIsMobile();
  const reducedMotion = useReducedMotion();
  // Effetto visivo attivo: quello in prova nella modalità debug, altrimenti
  // quello della pedina equipaggiata (solo durante la run).
  const activeTokenVisual = visualOf(tokenPreview || (screen !== "title" ? player?.tokens?.equipped : null));

  // Lente liquida (per tutto il gioco): onda breve su impatti e power-up,
  // che arrivano dai suoni semantici via utils/fx.js. La Goccia di Mercurio
  // la fa partire anche a ogni cambio di schermata. Il filtro resta attivo
  // solo mentre l'onda corre, per non pesare quando è ferma.
  const [liquidOn, setLiquidOn] = useState(false);
  const liquidTimer = useRef(0);
  const pulseLiquid = useCallback((strength) => {
    if (reducedMotion) return;
    setLiquidOn(true);
    requestAnimationFrame(() => playLiquidPulse(strength));
    clearTimeout(liquidTimer.current);
    liquidTimer.current = setTimeout(() => setLiquidOn(false), 650);
  }, [reducedMotion]);
  useEffect(() => onFx(({ strength }) => pulseLiquid(strength)), [pulseLiquid]);
  useEffect(() => { if (activeTokenVisual?.liquid) pulseLiquid(0.9); }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stato per la palette dell'Umore: soldi e quota di unghie sofferenti.
  const tokenVisualCtx = {
    money: player?.money || 0,
    pain: player?.nails ? player.nails.filter(n => !["sana", "kawaii"].includes(n.state)).length / player.nails.length : 0,
    liquid: liquidOn,
  };
  // Desktop largo: c'è spazio per le fiancate attorno al grattino (vedi overlay scratch).
  // Sotto i 1100px la carta resta da sola e centrata, come prima.
  const wideDesk = !isMobile && vw >= 1100;
  // Shell desktop V3 (docs/STATUS.md D-01): barra, rail unghie, stage, log.
  // Sotto i 1024px resta la shell legacy finché tablet e telefono non migrano.
  const wideShell = vw >= 1024;
  const inRun = !!player && !["title","tutorialNails"].includes(screen);
  const shellLog = wideShell && inRun && ["map","event","node"].includes(screen);

  // DEV: galleria biglietti — dopo tutti gli hook, così l'ordine resta stabile.
  if (devTicket) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <TicketGallery initialId={devTicket} />
      </Suspense>
    );
  }

  return (
    /* position:fixed inset:0 — l'unico modo 100% affidabile su iOS Safari:
       non usa vh (sballato con URL bar), non usa height:100% in un flex-row
       (non risolve il % quando alignItems≠stretch), non usa absolute (può
       avere il containing block sbagliato se un ancestor ha transform).
       Il wrapper è un semplice blocco: niente flex, niente centering — così
       S.container con height:100% risolve senza ambiguità. */
    <div
      // overflow:hidden NON impedisce lo scroll programmatico: quando un
      // pulsante prende il focus (OK di un popup) il browser faceva scorrere
      // questo contenitore per mostrarlo, e lo stage restava spostato a
      // sinistra con una fascia nera a destra. "clip" lo vieta; il reset
      // sull'evento copre i browser che non lo supportano.
      onScroll={e => { e.currentTarget.scrollLeft = 0; e.currentTarget.scrollTop = 0; }}
      style={{
      position:"fixed", inset:0,
      background: "#000",
      overflow:"clip",
      display:"flex", alignItems:"center", justifyContent:"center",
      // Effetto visivo della pedina (G-01): qui e non sullo stage, che usa già
      // filter/animation per neon e scossa.
      ...visualWrapperStyle(activeTokenVisual, reducedMotion, tokenVisualCtx),
    }}>
    {/* I coriandoli dello Spumante sono una raffica al primo nodo del bioma, non uno sfondo fisso */}
    <TokenVisualLayer reducedMotion={reducedMotion} money={player?.money || 0}
      overlay={activeTokenVisual?.overlay === "confetti" && !tokenPreview && !confettiBurst ? null : activeTokenVisual?.overlay} />
    {/* ── STAGE — sempre grafica desktop: almeno 1280×720 virtuali, scalati
         per stare nella finestra (hooks/useIsMobile.js). A scala 1 riempie
         esattamente il viewport come prima. ── */}
    <div style={{...S.container, cursor: globalNailCursor,
      width: `${vw}px`,
      height: `${stageH}px`,
      flexShrink: 0,
      // `scale` (non transform): la scossa dello schermo usa transform e
      // non deve azzerare la scala.
      scale: stageScale < 1 ? String(stageScale) : undefined,
      transformOrigin: "center center",
      position:"relative", overflow:"hidden",
      background: stageBg,
      boxShadow:"0 0 0 1px #000, 0 0 40px rgba(0,0,0,0.8)",
      paddingTop: "env(safe-area-inset-top, 0px)",
      /* paddingBottom rimosso: gestito dal DESK così il background riempie
         fino al bordo fisico dello schermo (PWA standalone mode). */
      animation: screenShake ? "screenShake 0.3s ease-in-out" : "none",
      filter: neonDim < 1 ? `saturate(${neonDim}) brightness(${0.6 + neonDim * 0.4})` : "none",
      transition: "filter 1.5s ease, background 0.8s ease",
      display:"flex", flexDirection:"column",
    }}>
      <style>{`
        ${KEYFRAMES}
        ${EFFECTS_CSS}
        ${TOKEN_VISUAL_CSS}
        html, body { margin: 0; padding: 0; overflow: hidden; background: #000; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 0px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: ${C.dim}88; border-radius: ${R.sm}; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.dim}; }
        /* Forza il cursore-dito su TUTTO — sovrascrive pointer/not-allowed inline
           su qualsiasi elemento selezionabile (card shop, bottoni, nodi mappa...) */
        * { cursor: ${globalNailCursor} !important; }
        /* ── MOBILE / iPhone: tap target Apple HIG (min 44px) ── */
        @media (max-width: 768px) {
          button { min-height: 44px; }
          /* slider volume: pollice più grande */
          input[type="range"] { height: 28px; }
          input[type="range"]::-webkit-slider-thumb { width: 22px; height: 22px; }
          /* niente hover-stick su touch: i :hover restano attaccati dopo il tap */
          * { -webkit-touch-callout: none; }
        }
      `}</style>

      {/* Grana pellicola e vignettatura rimosse: effetti morbidi vietati dal
          redesign (docs/redesign/00-MASTER-PLAN.md, regola 5). */}

      {/* ═══ FLASH ROSSO — UNGHIA SANGUINANTE (estetico, sparisce da solo) ═══ */}
      {globalPainFlash > 0 && (
        <div style={{
          position:"fixed", inset:0,
          background:`rgba(220,0,0,${globalPainFlash})`,
          boxShadow:"none",
          zIndex:99998, pointerEvents:"none",
        }} />
      )}

      {/* ═══ MODALE SANGUINANTE — rimane finché non clicchi ═══ */}

      {/* ═══ MODALE MORTE UNGHIA — rimane finché non clicchi ═══ */}
      {nailDeathFlash && (
        <div style={{
          position:"fixed", inset:0,
          background:"rgba(0,0,0,0.94)",
          zIndex:100000,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:"16px",
        }}>
          <div style={{
            fontSize:"90px", lineHeight:"1",
            animation:ANIM.pulseUrgent,
          }}>✝</div>
          <div style={{color:C.red, fontFamily:FONT, fontSize:"22px", letterSpacing:"4px", fontWeight:"bold"}}>
            UNGHIA PERSA
          </div>
          <div style={{color:C.dim, fontFamily:FONT, fontSize:"12px", textAlign:"center", lineHeight:"1.8"}}>
            Questa unghia è fuori gioco.<br/>
            Il gioco continua con le unghie rimaste.
          </div>
          <Btn onClick={() => setNailDeathFlash(false)} style={{
            fontFamily:FONT, background:"#111", color:"#888", border:"1px solid #444",
            padding:"10px 28px", borderRadius:"0", fontSize:"14px",
            marginTop:"8px", letterSpacing:"1px",
          }}>Avanti →</Btn>
        </div>
      )}

      {/* ═══ FULL-SCREEN SCRATCH OVERLAY ═══
           Appare ogni volta che l'utente apre un grattino — copre tutta la schermata
           con z-index:500 così sia il DESK che l'intro risultano invisibili sotto. */}
      {scratchingCard && player && (
        <div style={{
          position:"fixed", inset:0, zIndex:9000,
          background: wideShell ? "#2a170c" : bioPal.bg,
          display:"flex", flexDirection:"column",
          overflow:"hidden",
        }}>
          {/* ── TOP BAR — paddingTop assorbe Dynamic Island (env() funziona in React inline styles) ── */}
          <div style={{
            flexShrink:0,
            paddingTop: "calc(10px + env(safe-area-inset-top, 0px))",
            paddingBottom: "10px",
            paddingLeft: "14px",
            paddingRight: "14px",
            background: wideShell ? "#2a170c" : "#030308",
            borderBottom: wideShell ? "2px solid #e9c46a" : `2px solid ${scratchingCard.theme?.border || C.dim}`,
            display:"flex", alignItems:"center", gap:"10px",
            animation:"scratchTopBarIn 0.22s ease-out both",
            boxShadow: wideShell ? "none" : `0 2px 18px #00000088`,
          }}>
            {wideShell ? (
              <TableTopBar card={scratchingCard} nails={player.nails} activeNail={player.activeNail} money={player.money} />
            ) : (<>
            {/* Card info */}
            <div style={{flex:1, minWidth:0}}>
              <div style={{color:C.dim, fontSize:"10px", letterSpacing:"3px", fontFamily:FONT, marginBottom:"2px"}}>
                ░ GRATTA E VINCI ░
              </div>
              <div style={{
                color: scratchingCard.theme?.border || C.gold,
                fontFamily:FONT, fontSize:"14px", fontWeight:"bold",
                letterSpacing:"1px",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                textShadow:`0 0 10px ${scratchingCard.theme?.border || C.gold}88`,
              }}>
                {scratchingCard.emoji || "🎫"} {scratchingCard.name}
              </div>
            </div>
            {/* Nail health indicators — più grandi e leggibili */}
            <div style={{display:"flex", gap:"4px", flexShrink:0, alignItems:"center"}}>
              {player.nails.map((n, i) => {
                const dotColor =
                  n.state === "morta"        ? "#1a1a1a"  :
                  n.state === "marcia"       ? "#880000"  :
                  n.state === "sanguinante"  ? "#cc3300"  :
                  n.state === "graffiata"    ? "#886600"  :
                  n.state === "piede"        ? "#006688"  :
                  C.green;
                const isActive = i === player.activeNail;
                const isDead   = n.state === "morta";
                const emoji = isDead ? "✝" :
                  n.state === "sanguinante" ? "🩸" :
                  n.state === "marcia"      ? "💀" :
                  n.state === "graffiata"   ? "⚡" : "🖐";
                return (
                  <div key={i} style={{
                    display:"flex", flexDirection:"column", alignItems:"center", gap:"2px",
                    width:"22px",
                    opacity: isDead ? 0.35 : 1,
                    flexShrink:0,
                  }}>
                    <div style={{
                      width:"22px", height:"22px",
                      background: dotColor+"33",
                      border: isActive ? `2px solid ${dotColor}` : `1px solid ${dotColor}66`,
                      boxShadow: isActive ? `0 0 8px ${dotColor}cc` : "none",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"12px", lineHeight:1,
                    }}>{emoji}</div>
                    {isActive && (
                      <div style={{
                        width:"6px", height:"3px",
                        background: dotColor,
                        boxShadow:`0 0 4px ${dotColor}`,
                      }}/>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Money */}
            <div style={{
              color:C.gold, fontFamily:FONT, fontSize:"15px", fontWeight:"bold",
              textShadow:`0 0 8px ${C.gold}88`, flexShrink:0,
              background:"#0a0800", border:`1px solid ${C.gold}44`,
              padding:"2px 8px",
            }}>
              €{fmtMoney(player.money)}
            </div>
            </>)}
          </div>

          {/* ── SCROLL AREA con la schedina ── (desktop: niente scroll, tutto in vista) */}
          <div style={{
            flex:1, minHeight:0, overflowY: wideShell ? "hidden" : "auto", overflowX:"hidden",
            WebkitOverflowScrolling:"touch",
            display:"flex", justifyContent:"center",
            padding: wideShell ? "8px" : "10px 4px 32px",
            // Desktop: il tavolo da grattata (bancone di legno) sotto tutto.
            ...(wideShell ? { background: TABLE_BG } : {}),
            backgroundImage: wideShell ? undefined : "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)",
            backgroundAttachment:"local",
          }}>
            {/* ── BANCO — su desktop largo la carta resta della sua dimensione
                 (asset a proporzioni fisse) e lo spazio laterale viene occupato
                 dal dossier della run e dal log dei colpi. Il tetto è W.content,
                 così su monitor enormi il banco non si sfilaccia. ── */}
            <div style={{
              width:"100%", maxWidth: wideShell ? "none" : W.content, margin:"0 auto",
              display:"flex", alignItems: wideShell ? "stretch" : "flex-start", justifyContent:"center",
              gap: wideDesk ? "14px" : "0",
              ...(wideShell ? { height:"100%", minHeight:0 } : {}),
            }}>
            {wideShell ? (
              <Dossier biome={BIOMES[currentBiome]} player={player} gameStats={gameStats} />
            ) : wideDesk && (
              <RunStatsRail biome={BIOMES[currentBiome]} palette={bioPal} player={player} gameStats={gameStats} onEquipGrattatore={handleRailEquipGrattatore} />
            )}
            {/* animation wrapper */}
            <div style={{animation:"scratchCardSlideIn 0.28s ease-out both", flex:"1 1 auto", minWidth:0, display:"flex", justifyContent:"center", alignItems: wideShell ? "stretch" : "flex-start", ...(wideShell ? { minHeight:0, padding:"16px", ...MAT_STYLE } : {})}}>
              <Suspense fallback={<LazyFallback />}>
              <ScratchCardView
                card={scratchingCard}
                fit={wideShell}
                gameHost={wideShell ? scratchGameHost : null}
                nailState={getActiveNailState()}
                nailImplant={player.nails[player.activeNail]?.implant || null}
                grattaMania={player.grattaMania}
                equippedGrattatore={player.equippedGrattatore}
                relicEffects={playerRelicEffects}
                ambidestri={player.skills?.includes("ambidestri")}
                onCellScratch={handleCellScratch}
                onNailDamage={handleNailDamage}
                onItemFound={handleCardItemFound}
                onDone={(r) => { setFirstScratchShown(true); handleScratchDone(r); }}
                showFirstWarning={!firstScratchShown}
                lastWonPrize={player.lastWonPrize || 0}
                extraTiles={player.extraTiles || []}
                onExtraTileUsed={(tileId, tileIdx) => {
                  if (tileId === "monetaCinese") {
                    updatePlayer(p => {
                      const tiles = [...(p.extraTiles||[])];
                      tiles.splice(tileIdx, 1);
                      return {...p, extraTiles: tiles, monetaCineseActive: true};
                    });
                    addLog("🀄 MONETA CINESE ATTIVATA! La prossima grattata sarà x5 GARANTITA!", C.gold);
                  }
                }}
                onCardActivate={(event) => {
                  if (event === "maledetto_curse") {
                    updatePlayer(p => ({
                      ...p,
                      nails: p.nails.map(n =>
                        n.state !== "morta" && n.state !== "marcia" && n.state !== "sanguinante"
                          ? {...n, state: "sanguinante"} : n
                      ),
                    }));
                    addLog("💀 LA MALEDIZIONE SI APRE! Tutte le unghie sanguinano!", C.red);
                  }
                }}
              />
              </Suspense>
            </div>
            {wideShell ? (
              <RightRail player={player} onEquipGrattatore={handleRailEquipGrattatore} log={log} setGameHost={setScratchGameHost} />
            ) : wideDesk && log.length > 0 && (
              <ScratchLogRail log={log} palette={bioPal} />
            )}
            </div>
          </div>

          {/* ── CARMELO STRIP — striscia 96px multi-riga con typewriter, visibile durante introScratch ── */}
          {returnScreen === "introScratch" && carmeloLog.length > 0 && !wideShell && (
            <CarmeloScratchStrip messages={carmeloLog} color={C.gold} active={!scratchingCard} />
          )}
        </div>
      )}

      {/* ── HUD PERSISTENTE (tutte le screen tranne title e tutorial) ── */}
      {inRun && wideShell && (
        <RunBar player={player} onOpenInventory={toggleInventoryPanel} inventoryOpen={showInventoryPanel} moneyBling={moneyBling} hideInventoryButton={screen === "shop" && wideDesk && !wideShell} />
      )}
      {inRun && wideShell && screen === "map" && <TickerRow currentBiome={currentBiome} />}
      {inRun && !wideShell && (
        <div style={{width:"100%", flexShrink:0, paddingTop:"6px"}}>
          <HUD player={player} onOpenInventory={toggleInventoryPanel} inventoryOpen={showInventoryPanel} moneyBling={moneyBling} currentBiome={currentBiome} hideInventoryButton={screen === "shop" && wideDesk && !wideShell} />
        </div>
      )}

      {/* ── MAIN AREA — riga (desktop) / colonna (mobile) ── */}
      <div style={{flex:1, width:"100%", display:"flex", flexDirection: isMobile ? "column" : "row", overflow:"hidden", minHeight:0}}>

      {/* ── UNGHIE — colonna sinistra (desktop) / striscia orizzontale in cima (mobile) ── */}
      {inRun && wideShell && (
        <NailRail nails={player.nails} activeNail={player.activeNail} onSelectNail={handleSelectNail} locked={!!scratchingCard} equippedGrattatore={player.equippedGrattatore} />
      )}
      {inRun && !wideShell && (
        <div style={isMobile ? {
          width:"100%", flexShrink:0,
          borderBottom:`2px solid ${bioPal.border}55`,
          background: bioPal.panelBg,
          overflowX:"auto", overflowY:"hidden",
          padding:"6px 8px",
          transition:"border-color 0.6s, background 0.6s",
        } : {
          width:"160px", flexShrink:0,
          borderRight:`1px solid ${bioPal.border}44`,
          background: bioPal.panelBg,
          display:"flex", flexDirection:"column",
          overflowY:"auto", overflowX:"hidden",
          padding:"8px 6px",
          transition:"border-color 0.6s, background 0.6s",
        }}>
          <NailSidebar nails={player.nails} activeNail={player.activeNail} onSelectNail={handleSelectNail} locked={!!scratchingCard} equippedGrattatore={player.equippedGrattatore} horizontal={isMobile} />
        </div>
      )}

      {/* ── NEWS STRIP MOBILE — striscia notizie sotto le unghie (mobile only) ── */}
      {player && isMobile && !["title","tutorialNails"].includes(screen) && (
        <div style={{
          flexShrink:0, height:"22px",
          display:"flex", alignItems:"stretch", overflow:"hidden",
          background: bioPal.logBg,
          borderBottom:`1px solid ${bioPal.border}33`,
          paddingLeft:"6px", paddingRight:"6px",
          transition:"border-color 0.6s, background 0.6s",
        }}>
          <NewsTicker currentBiome={currentBiome} />
        </div>
      )}

      {/* ── DESK — area di gioco centrale, scrollabile ── */}
      {/* paddingBottom: safe-area bottom qui (non su S.container) così il background
          del DESK riempie fino al bordo fisico, evitando il buco nero in PWA mode. */}
      <div style={{flex:1, minHeight:0,
        overflowY:"auto",
        overflowX:"hidden",
        WebkitOverflowScrolling:"touch", /* momentum scroll iOS */
        display:"flex", flexDirection:"column", alignItems:"center",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        /* Scanlines CRT + ambient glow del bioma corrente — solo shell legacy */
        backgroundImage: wideShell ? "none" : [
          /* linee bright ogni 4px — visibili anche su sfondo nero */
          "repeating-linear-gradient(180deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 4px)",
          `radial-gradient(ellipse 90% 55% at 50% 0%, ${bioPal.border}22 0%, transparent 100%)`,
        ].join(","),
        backgroundAttachment: "local",
        position: "relative",
        transition: "background-image 0.8s ease",
      }}>

      {screen === "title" && (
        <TitleScreen
          onStart={startGame}
          activeCedola={activeCedola}
          onRemoveCedola={() => {
            removeStored(STORAGE_KEYS.cedola);
            setActiveCedola(null);
          }}
          achievements={achievements}
          discoveredRelics={discoveredRelics}
          discoveredTokens={discoveredTokens}
          onOpenTrophies={() => setShowTrophies(true)}
          onOpenReliquie={() => setShowReliquie(true)}
          onOpenStats={() => setShowAllTimeStats(true)}
          onOpenPedine={() => setShowPedine(true)}
          onOpenSettings={() => setShowResetProgress(true)}
        />
      )}

      {/* ═══ TUTORIAL — Il quaderno di Nonno Carmelo, 4 capitoli (components/intro/TutorialDesk.jsx) ═══ */}
      {screen === "tutorialNails" && (
        <div style={{ flex:1, minHeight:0, width:"100%", display:"flex" }}>
          <TutorialDesk page={tutorialPage}
            onPage={(p) => setTutorialPage(Math.max(0, Math.min(3, p)))}
            onDone={() => setScreen("introScratch")} />
        </div>
      )}

      {/* ═══ IL PEDINARO — bottega dei gettoni (G-01 fase 4) ═══ */}
      {screen === "pedinaro" && player?.tokens && pedinaroVisit && (
        <div style={{ flex:1, minHeight:0, width:"100%", display:"flex" }}>
          <PedinaroDesk visit={pedinaroVisit} line={pedinaroLine} tokens={player.tokens}
            money={player.money} tickets={player.scratchCards.length}
            onBuy={handlePedinaroBuy} onGift={handlePedinaroGift}
            onBarterToken={handlePedinaroBarterToken} onBarterTickets={handlePedinaroBarterTickets}
            onLeave={() => { setPedinaroVisit(null); setScreen("map"); }} />
        </div>
      )}

      {/* ═══ INTRO SCRATCH (scratch 2 starting cards, pocket 1 prize) ═══ */}
      {screen === "introScratch" && player && wideShell && !scratchingCard && (
        // Desktop: Nonno Carmelo al bancone, chiaro (components/intro/IntroDesk.jsx)
        <div style={{ flex:1, minHeight:0, width:"100%", display:"flex" }}>
          <IntroDesk
            messages={carmeloLog}
            cards={scratchingCard ? [] : player.scratchCards}
            prizes={introPrizes}
            onScratch={(card) => {
              // Desktop: l'avvertimento sulle unghie è già nell'intro (IntroDesk)
              setScratchingCard(card);
              setReturnScreen("introScratch");
            }}
            onRefuse={() => {
              addLog("Tieni le mani in tasca e vai.", C.dim);
              updatePlayer(p => ({...p, scratchCards: []}));
              setIntroPrizes([{prize:0, cardName:"(rifiutato)"}]);
              leaveIntro();
            }}
            onPocket={(ip) => {
              updatePlayer(p => ({...p, money: p.money + ip.prize}));
              setGameStats(s => ({...s, moneyEarned: s.moneyEarned + ip.prize}));
              addLog(`Intaschi €${ip.prize} dal "${ip.cardName}". Il vecchio annuisce.`, C.green);
              leaveIntro();
            }}
          />
        </div>
      )}
      {screen === "introScratch" && player && !wideShell && (
        // justifyContent:"center" — prima il dialogo di Nonno Carmelo (unico
        // figlio che cresceva, flex:1) si allungava a riempire tutta l'altezza
        // disponibile pur avendo solo 3 righe di testo. Ora il box ha
        // un'altezza propria e l'intero blocco (dialogo + biglietti) si centra
        // nello spazio verticale invece di lasciare il vuoto dentro il box.
        <div style={{width:"100%", maxWidth:W.content, padding:"8px", display:"flex", flexDirection:"column", justifyContent:"center", gap:"10px", height:"100%", minHeight:0, overflow:"hidden"}}>

          {/* NPC Dialogue Log */}
          <CarmeloLogBox
            npc="vecchio"
            name="Nonno Carmelo"
            color={C.gold}
            messages={carmeloLog}
            active={!scratchingCard}
            height="200px"
            footer={player.scratchCards.length > 0
              ? <Btn onClick={(e) => {
                  e.stopPropagation();
                  addLog("Tieni le mani in tasca e vai.", C.dim);
                  updatePlayer(p => ({...p, scratchCards: []}));
                  setIntroPrizes([{prize:0, cardName:"(rifiutato)"}]);
                  leaveIntro();
                }} style={{fontSize:"10px", color:C.dim, borderColor:"#333", padding:"3px 10px"}}>
                  😶 Rifiuta — non guadagni niente ma non rovini le unghie
                </Btn>
              : null
            }
          />

          {/* Cards to scratch */}
          {player.scratchCards.length > 0 && (
            <div style={{display:"flex", flexDirection:"column", gap:"8px", flex:"0 1 auto", minHeight:0, overflowY:"auto"}}>
              {!scratchingCard && (<>
                <div style={{color:C.dim, fontSize:"10px", letterSpacing:"2px", textAlign:"center"}}>
                  — BIGLIETTI DI NONNO CARMELO — rimasti {player.scratchCards.length}/3 —
                </div>
                <div style={{display:"flex", justifyContent:"center", gap:"8px", flexWrap:"wrap"}}>
                  {player.scratchCards.map((card, idx) => (
                    <div key={idx} style={{textAlign:"center"}}
                      onMouseEnter={() => setHoveredIntroIdx(idx)}
                      onMouseLeave={() => setHoveredIntroIdx(-1)}>
                      <Btn variant="gold" sound="card" onClick={() => {
                        if (!firstScratchShown) triggerNpcComment("first_warning");
                        setScratchingCard(card);
                        setReturnScreen("introScratch");
                        setHoveredIntroIdx(-1);
                      }}>
                        {card.emoji || "🎫"} {card.name}
                        <span style={{display:"block", fontSize:"10px"}}>
                          <span style={{color:C.red, textDecoration:"line-through"}}>€{card.cost}</span>
                          {" "}
                          <span style={{color:C.green, fontWeight:"bold"}}>GRATIS!</span>
                        </span>
                      </Btn>
                    </div>
                  ))}
                </div>
                {/* Preview panel — hover mostra anteprima card */}
                {(() => {
                  const c = hoveredIntroIdx >= 0 ? player.scratchCards[hoveredIntroIdx] : null;
                  const borderColor = c?.theme?.border || C.gold;
                  return (
                    <div style={{
                      width:"100%", marginTop:"4px",
                      border:`2px solid ${c ? borderColor : "#1a1a2e"}`,
                      background: c ? "#0a0a1a" : "#070710",
                      padding:"14px 18px",
                      // Altezza FISSA, identica da vuoto e con l'anteprima dentro:
                      // se cambiasse al passaggio del mouse, il riquadro sopra
                      // (che è flex:1) si ridimensionerebbe e tutta la schermata
                      // sobbalzerebbe a ogni hover su un biglietto.
                      flex:"0 0 auto", height:"196px", boxSizing:"border-box",
                      display:"flex", alignItems:"center", gap:"20px",
                      overflow:"hidden",
                      transition:"border-color 0.15s",
                      boxShadow: c ? `inset 0 0 40px ${borderColor}08` : "none",
                    }}>
                      {c ? (<>
                        {/* Anteprima biglietto — arte PNG col titolo nel cartiglio
                            e l'area grattabile, composta come in partita */}
                        <div style={{flexShrink:0}}>
                          <TicketThumb card={c} width={200} />
                          <div style={{color:borderColor, fontSize:"10px", textAlign:"center", letterSpacing:"1px", marginTop:"5px"}}>
                            clicca per grattare
                          </div>
                        </div>
                        {/* Info */}
                        <div style={{flex:1, borderLeft:`1px solid ${borderColor}22`, paddingLeft:"20px"}}>
                          <div style={{color:borderColor, fontWeight:"bold", fontSize:"13px", marginBottom:"6px"}}>
                            {c.emoji || "🎫"} {c.name}
                          </div>
                          <div style={{color:C.text, fontSize:"11px", lineHeight:"1.7", marginBottom:"8px"}}>
                            {(MECH_RULES[c.mechanic] || MECH_RULES.match)(c)}
                          </div>
                          <div style={{display:"flex", gap:"16px", flexWrap:"wrap"}}>
                            <span style={{color:C.dim, fontSize:"10px"}}>
                              Premio max: <span style={{color:C.gold, fontWeight:"bold"}}>€{c.maxPrize}</span>
                            </span>
                            {c.malus && <span style={{color:C.red, fontSize:"10px"}}>⚠ {c.malus.desc}</span>}
                          </div>
                        </div>
                      </>) : (
                        <div style={{color:"#333", fontSize:"10px", letterSpacing:"3px", margin:"0 auto"}}>
                          — passa sopra un biglietto per l'anteprima —
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>)}

              {/* Scratch inline rimosso — gestito dal full-screen overlay (position:fixed zIndex:9000) */}
            </div>
          )}

          {/* Prize selection after all scratched */}
          {player.scratchCards.length === 0 && introPrizes.length >= 3 && (
            <div style={{display:"flex", flexDirection:"column", gap:"8px", flex:1, minHeight:0, overflowY:"auto"}}>
              <div style={{color:C.dim, fontSize:"10px", letterSpacing:"2px", textAlign:"center"}}>
                — QUALE INTASCHI? —
              </div>
              <div style={{display:"flex", justifyContent:"center", gap:"10px", flexWrap:"wrap"}}>
                {introPrizes.map((ip, idx) => (
                  <div key={idx} style={{
                    border:`2px solid ${ip.prize > 0 ? C.gold : C.dim}`,
                    background:"#0a0a18", padding:"12px 18px",
                    cursor:"pointer", textAlign:"center", minWidth:"130px",
                    transition:"all 0.15s",
                    boxShadow: ip.prize > 0 ? `0 0 14px ${C.gold}22` : "none",
                  }}
                    onClick={() => {
                      updatePlayer(p => ({...p, money: p.money + ip.prize}));
                      setGameStats(s => ({...s, moneyEarned: s.moneyEarned + ip.prize}));
                      addLog(`Intaschi €${ip.prize} dal "${ip.cardName}". Il vecchio annuisce.`, C.green);
                      leaveIntro();
                    }}
                  >
                    <div style={{color:C.dim, fontSize:"10px", marginBottom:"4px", letterSpacing:"1px"}}>{ip.cardName}</div>
                    <div style={{
                      color: ip.prize > 0 ? C.gold : C.dim,
                      fontSize:"22px", fontWeight:"bold",
                      textShadow: ip.prize > 0 ? `0 0 10px ${C.gold}` : "none",
                      marginBottom:"8px",
                    }}>
                      {ip.prize > 0 ? `€${ip.prize}` : "—"}
                    </div>
                    <Btn variant={ip.prize > 0 ? "gold" : "default"} style={{fontSize:"10px", padding:"4px 10px"}}>
                      Intasca →
                    </Btn>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      )}

      {/* ═══ SCRATCH CARD — ora gestita dal full-screen overlay in cima (zIndex:500) ═══ */}

      {/* ═══ DOPPIO O NULLA ═══ */}
      {screen === "doppioONulla" && player && doppioONulla && (
        <div style={wideShell ? { flex:1, minHeight:0, width:"100%", display:"flex" } : {maxWidth:"900px", width:"100%"}}>
          <Suspense fallback={<LazyFallback />}>
          <DoppioONullaView
            desk={wideShell}
            prize={doppioONulla.prize}
            winChance={playerRelicEffects.includes("riggedDice") ? 0.65 : 0.5}
            onDecline={handleDoppioDecline}
            onResult={handleDoppioResult}
          />
          </Suspense>
        </div>
      )}

      {/* ═══ SELECT CARD TO SCRATCH ═══ */}
      {screen === "selectCard" && player && (() => {
        const backFromSelect = () => {
          setCardSelectMode(false);
          setReturnScreen(null);
          if (returnScreen === "shop") setScreen("shop");
          else if (currentNode) setScreen("preScratch");
          else setScreen("map");
        };
        // Desktop: i biglietti veri nei colori della mappa (components/desk/SelectCardDesk.jsx)
        if (wideShell) return (
          <div style={{ flex:1, minHeight:0, width:"100%", display:"flex" }}>
            <SelectCardDesk cards={player.scratchCards} onSelect={handleSelectCard} onBack={backFromSelect}
              hasGrattatore={!!player.equippedGrattatore} />
          </div>
        );
        const TIER_META = {
          1: { label: "COMUNE",       accent: "#7a8aaa", emoji: "🎫" },
          2: { label: "MEDIA",        accent: C.cyan,    emoji: "🎟️" },
          3: { label: "RARA",         accent: C.magenta, emoji: "💎" },
          4: { label: "LEGGENDARIA",  accent: C.gold,    emoji: "👑" },
        };
        const MECH_BADGE = {
          trap: "💣 TRAPPOLE", sum13: "🃏 SOMMA 13", ruota: "🎡 RUOTA",
          doppioOnulla: "🎲 DOPPIO", labirinto: "🗺️ LABIRINTO",
          combina: "🧩 COMBINA", tesoro: "🗺️ TESORO", jolly: "✨ JOLLY",
          setteemezzo: "🃏 7½", collect: "💰 COLLECT", mahjong: "🀄 MAHJONG",
        };
        return (
        <div style={{maxWidth:"760px", width:"100%", margin: "10px auto"}}>
          <div style={{
            ...S.panel, background: "#05050b",
            border: `2px solid ${C.gold}55`,
            boxShadow: `0 0 22px ${C.gold}22, inset 0 0 28px ${C.gold}08`,
            position: "relative",
          }}>
            {/* Corner brackets */}
            {["tl","tr","bl","br"].map(pos => {
              const [v, h] = pos.split("");
              return (
                <div key={pos} style={{
                  position: "absolute",
                  [v === "t" ? "top" : "bottom"]: "10px",
                  [h === "l" ? "left" : "right"]: "10px",
                  width: "14px", height: "14px",
                  borderTop: v === "t" ? `2px solid ${C.gold}` : "none",
                  borderBottom: v === "b" ? `2px solid ${C.gold}` : "none",
                  borderLeft: h === "l" ? `2px solid ${C.gold}` : "none",
                  borderRight: h === "r" ? `2px solid ${C.gold}` : "none",
                  boxShadow: `0 0 8px ${C.gold}88`,
                  pointerEvents: "none",
                }}/>
              );
            })}

            {/* Header */}
            <div style={{
              textAlign:"center", marginBottom:"16px",
              paddingBottom:"10px", borderBottom:`1px solid ${C.gold}33`,
              background: `linear-gradient(180deg, ${C.gold}08 0%, transparent 100%)`,
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: "-2px", right: "10px",
                fontSize: "12px", color: C.gold,
                animation: "variantSparkle 2.4s ease-in-out infinite",
              }}>✦</div>
              <div style={{
                fontSize: "22px", fontWeight: "bold", color: C.gold,
                letterSpacing: "4px", marginBottom: "4px",
                textShadow: `0 0 12px ${C.gold}aa, 0 0 26px ${C.gold}55`,
                fontFamily: FONT,
              }}>
                🎫 I TUOI BIGLIETTI
              </div>
              <div style={{
                display: "inline-block",
                color: "#000", background: C.gold,
                fontSize: "10px", letterSpacing: "3px", fontWeight: "bold",
                padding: "2px 8px", marginBottom: "8px",
                boxShadow: `0 0 8px ${C.gold}aa`,
              }}>
                ≋ SCEGLI COSA GRATTARE ≋
              </div>
              <div style={{color:C.text, fontSize:"11px", fontStyle:"italic"}}>
                {player.scratchCards.length} biglietto{player.scratchCards.length === 1 ? "" : "i"} in mano
              </div>
            </div>

            {/* Card grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "10px",
              marginBottom: "14px",
            }}>
              {player.scratchCards.map((card, idx) => {
                const tier = Math.min(4, Math.max(1, card.tier || 1));
                const meta = TIER_META[tier];
                const accent = meta.accent;
                const tierLabel = meta.label;
                const cardEmoji = card.emoji || meta.emoji;
                const mechBadge = MECH_BADGE[card.mechanic];
                return (
                  <div key={idx} data-audio="card" data-audio-interactive="true" onClick={() => handleSelectCard(idx)} style={{
                    position: "relative",
                    background: "#0a0a14",
                    border: `2px solid ${accent}88`,
                    boxShadow: `0 0 10px ${accent}44, inset 0 0 14px ${accent}12`,
                    padding: "10px 10px 12px", cursor: "pointer",
                    textAlign: "center",
                    transition: "transform 0.12s, box-shadow 0.15s",
                    overflow: "hidden",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = `0 0 18px ${accent}aa, 0 4px 12px #000a, inset 0 0 18px ${accent}22`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 0 10px ${accent}44, inset 0 0 14px ${accent}12`;
                  }}>
                    {/* Preview tile */}
                    <div style={{
                      position: "relative",
                      width: "64px", height: "64px", margin: "0 auto 8px",
                      background: `linear-gradient(135deg, ${accent}22, ${accent}05)`,
                      border: `1px solid ${accent}66`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `inset 0 0 12px ${accent}22`,
                    }}>
                      {["tl","tr","bl","br"].map(pos => {
                        const [v, h] = pos.split("");
                        return (
                          <div key={pos} style={{
                            position: "absolute",
                            [v === "t" ? "top" : "bottom"]: "3px",
                            [h === "l" ? "left" : "right"]: "3px",
                            width: "8px", height: "8px",
                            borderTop: v === "t" ? `1px solid ${accent}` : "none",
                            borderBottom: v === "b" ? `1px solid ${accent}` : "none",
                            borderLeft: h === "l" ? `1px solid ${accent}` : "none",
                            borderRight: h === "r" ? `1px solid ${accent}` : "none",
                          }}/>
                        );
                      })}
                      <div style={{
                        fontSize: "30px",
                        textShadow: `0 0 14px ${accent}`,
                      }}>{cardEmoji}</div>
                      {tier >= 4 && (
                        <div style={{
                          position: "absolute", inset: 0,
                          background: `linear-gradient(110deg, transparent 30%, ${accent}55 50%, transparent 70%)`,
                          backgroundSize: "200% 100%",
                          animation: "variantShimmer 2.4s linear infinite",
                          mixBlendMode: "screen",
                          pointerEvents: "none",
                        }}/>
                      )}
                    </div>

                    {/* Tier badge */}
                    <div style={{
                      display: "inline-block",
                      background: accent, color: "#000",
                      padding: "2px 6px", fontSize: "10px", fontWeight: "bold",
                      letterSpacing: "2px", marginBottom: "4px",
                      boxShadow: `0 0 6px ${accent}88`,
                    }}>
                      ★ {tierLabel} ★
                    </div>

                    {/* Name */}
                    <div style={{
                      color: C.bright, fontSize: "12px", fontWeight: "bold",
                      marginBottom: "5px", lineHeight: 1.2,
                    }}>
                      {card.name}
                    </div>

                    {/* Cost + Max pills */}
                    <div style={{display:"flex", justifyContent:"center", gap:"4px", marginBottom:"4px", flexWrap:"wrap"}}>
                      <div style={{
                        fontSize:"10px", color: C.gold,
                        background: `${C.gold}14`,
                        border: `1px solid ${C.gold}66`,
                        padding: "1px 5px", letterSpacing: "0.5px",
                      }}>€{card.cost}</div>
                      <div style={{
                        fontSize:"10px", color: C.green,
                        background: `${C.green}14`,
                        border: `1px solid ${C.green}66`,
                        padding: "1px 5px", letterSpacing: "0.5px",
                      }}>max €{card.maxPrize}</div>
                    </div>

                    {/* Mechanic badge */}
                    {mechBadge && (
                      <div style={{
                        color: accent, fontSize: "10px", letterSpacing: "1px",
                        fontWeight: "bold", marginBottom: "3px",
                      }}>
                        {mechBadge}
                      </div>
                    )}

                    {/* Malus warning */}
                    {card.malus && (
                      <div style={{
                        color:C.red, fontSize:"10px", letterSpacing:"0.3px",
                        lineHeight: 1.3, marginTop: "4px",
                        borderTop: `1px dashed ${C.red}55`, paddingTop: "4px",
                      }}>
                        ⚠ {card.malus.desc}
                      </div>
                    )}

                    {/* Requires grattatore flag */}
                    {card.requiresGrattatore && (
                      <div style={{
                        position: "absolute", top: "6px", right: "6px",
                        color: C.cyan, fontSize: "10px",
                        background: "#000a",
                        padding: "1px 4px",
                        border: `1px solid ${C.cyan}88`,
                        letterSpacing: "0.5px", fontWeight: "bold",
                      }}>
                        🔧
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Back button */}
            <div style={{
              display: "flex", justifyContent: "center",
              borderTop: `1px solid ${C.gold}33`, paddingTop: "12px",
            }}>
              <Btn onClick={() => {
                setCardSelectMode(false);
                setReturnScreen(null);
                if (returnScreen === "shop") setScreen("shop");
                else if (currentNode) setScreen("preScratch");
                else setScreen("map");
              }}>← Torna indietro</Btn>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ═══ PRE-SCRATCH (before entering node) ═══ */}
      {screen === "preScratch" && player && currentNode && (() => {
        const NODE_ACCENT = {
          tabaccaio: C.gold, locanda: C.pink, spacciatore: C.green,
          chirurgo: C.red, ladro: C.orange, mendicante: C.blue,
          zaino: C.cyan, miniboss: C.orange, boss: C.red,
          evento: C.magenta, stregone: C.magenta, poliziotto: C.blue,
          anziana: C.pink, sacerdote: C.gold, bambino: C.cyan,
          streamer: C.pink, macellaio: C.red,
          maestroTe: C.green, guantaio: C.gold, start: C.dim,
        };
        const NODE_NAMES = {
          tabaccaio: "TABACCAIO", locanda: "LOCANDA", spacciatore: "SPACCIATORE",
          chirurgo: "CHIRURGO", ladro: "LADRO", mendicante: "MENDICANTE",
          zaino: "ZAINO", miniboss: "MINI-BOSS", boss: "BOSS",
          evento: "EVENTO", stregone: "STREGONE", poliziotto: "POLIZIOTTO",
          anziana: "ANZIANA", sacerdote: "SACERDOTE", bambino: "BAMBINO",
          streamer: "STREAMER", macellaio: "MACELLAIO",
          maestroTe: "MAESTRO DEL TÈ", guantaio: "GUANTAIO", start: "INIZIO",
        };
        const accent = NODE_ACCENT[currentNode.type] || C.cyan;
        const nodeName = currentNode.secret ? "NODO SEGRETO" : NODE_NAMES[currentNode.type] || currentNode.type.toUpperCase();
        const nodeIcon = currentNode.secret ? "🔮" : NODE_ICONS[currentNode.type] || "?";
        const isBoss = currentNode.type === "boss";
        const isElite = !!currentNode.elite;

        // Desktop: la soglia — carta del luogo + cosa fare prima di entrare.
        if (wideShell) {
          const bn = currentNode.bossName || "Il Broker";
          const minMoney = isBoss ? BOSS_MIN_MONEY[bn] : undefined;
          return (
            <div style={{ flex: 1, minHeight: 0, width: "100%", display: "flex" }}>
              <NodeThreshold
                node={currentNode} player={player} preScratchCount={preScratchCount}
                onPreScratch={handlePreScratch} onEnter={enterNode}
                bossGate={minMoney !== undefined ? { minMoney, canEnter: player.money >= minMoney } : null}
                onEquipGrattatore={handleRailEquipGrattatore} onUseItem={handleUseItem} maxItems={MAX_ITEMS}
              />
            </div>
          );
        }

        // Corner brackets helper
        const CornerBrackets = ({ color = accent, size = 14, inset = 10, shadow = true }) => (
          <>{["tl","tr","bl","br"].map(pos => {
            const [v, h] = pos.split("");
            return (
              <div key={pos} style={{
                position: "absolute",
                [v === "t" ? "top" : "bottom"]: `${inset}px`,
                [h === "l" ? "left" : "right"]: `${inset}px`,
                width: `${size}px`, height: `${size}px`,
                borderTop: v === "t" ? `2px solid ${color}` : "none",
                borderBottom: v === "b" ? `2px solid ${color}` : "none",
                borderLeft: h === "l" ? `2px solid ${color}` : "none",
                borderRight: h === "r" ? `2px solid ${color}` : "none",
                boxShadow: shadow ? `0 0 8px ${color}88` : "none",
                pointerEvents: "none",
              }}/>
            );
          })}</>
        );

        return (
        // 760px era un quarto valore diverso (Shop/Combat/Event/Locanda usano
        // tutti W.content, 1280px) per lo stesso tipo di schermata "hub".
        <div style={{maxWidth:W.content, width:"100%", margin:"10px auto"}}>

          {/* ═══ BOSS ENTRY WARNING ═══ */}
          {isBoss && (() => {
            const bossName = currentNode.bossName || "Il Broker";
            const minMoney = BOSS_MIN_MONEY[bossName];
            if (minMoney === undefined) return null;
            const canEnter = player.money >= minMoney;
            const gateColor = canEnter ? C.green : C.red;
            return (
              <div style={{
                position: "relative",
                background: canEnter ? "#001a0a" : "#1a0000",
                border: `2px solid ${gateColor}`,
                padding: "14px 20px", marginBottom: "10px",
                textAlign: "center",
                boxShadow: canEnter
                  ? `0 0 16px ${gateColor}44, inset 0 0 16px ${gateColor}12`
                  : `0 0 20px ${gateColor}66, inset 0 0 20px ${gateColor}22`,
                animation: canEnter ? "none" : ANIM.pulseActive,
              }}>
                <CornerBrackets color={gateColor} size={12} inset={6} />
                <div style={{
                  display: "inline-block",
                  background: gateColor, color: "#000",
                  padding: "3px 10px", fontSize: "10px", fontWeight: "bold",
                  letterSpacing: "3px", marginBottom: "8px",
                  boxShadow: `0 0 8px ${gateColor}aa`,
                }}>
                  ★ {canEnter ? "ACCESSO CONSENTITO" : "ACCESSO NEGATO"} ★
                </div>
                <div style={{color: C.text, fontSize: "12px", lineHeight: 1.6}}>
                  <strong style={{color: gateColor, fontSize: "13px"}}>{bossName}</strong> richiede almeno{" "}
                  <strong style={{color: C.gold}}>€{minMoney}</strong>.
                  {" "}Hai{" "}
                  <strong style={{color: gateColor}}>€{fmtMoney(player.money)}</strong>.
                </div>
                {!canEnter && (
                  <div style={{
                    marginTop: "8px", padding: "6px 10px",
                    background: "#0a0004",
                    border: `1px dashed ${C.orange}66`,
                    color: C.orange, fontSize: "10px",
                    letterSpacing: "1px", fontStyle: "italic",
                  }}>
                    ⚠ Se entri ora verrai rispedito all'inizio della mappa
                  </div>
                )}
              </div>
            );
          })()}

          {/* ═══ MAIN PANEL — node preview + actions ═══ */}
          <div style={{
            ...S.panel, position: "relative",
            background: "#05050b",
            border: `2px solid ${accent}55`,
            boxShadow: `0 0 22px ${accent}22, inset 0 0 28px ${accent}08`,
          }}>
            <CornerBrackets />

            {/* Header: icon tile + title */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr",
              gap: "16px", alignItems: "center",
              padding: "8px 8px 14px",
              borderBottom: `1px solid ${accent}33`,
              marginBottom: "14px",
              background: `linear-gradient(180deg, ${accent}08 0%, transparent 100%)`,
            }}>
              {/* Icon tile */}
              <div style={{
                position: "relative",
                width: "72px", height: "72px",
                background: `linear-gradient(135deg, ${accent}22, ${accent}05)`,
                border: `1px solid ${accent}66`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `inset 0 0 16px ${accent}22, 0 0 14px ${accent}44`,
              }}>
                {["tl","tr","bl","br"].map(pos => {
                  const [v, h] = pos.split("");
                  return (
                    <div key={pos} style={{
                      position: "absolute",
                      [v === "t" ? "top" : "bottom"]: "4px",
                      [h === "l" ? "left" : "right"]: "4px",
                      width: "10px", height: "10px",
                      borderTop: v === "t" ? `1px solid ${accent}` : "none",
                      borderBottom: v === "b" ? `1px solid ${accent}` : "none",
                      borderLeft: h === "l" ? `1px solid ${accent}` : "none",
                      borderRight: h === "r" ? `1px solid ${accent}` : "none",
                    }}/>
                  );
                })}
                <div style={{
                  fontSize: "38px",
                  textShadow: `0 0 16px ${accent}`,
                  filter: `drop-shadow(0 0 8px ${accent}aa)`,
                }}>{nodeIcon}</div>
                {(isBoss || isElite) && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: `linear-gradient(110deg, transparent 30%, ${accent}55 50%, transparent 70%)`,
                    backgroundSize: "200% 100%",
                    animation: "variantShimmer 2.4s linear infinite",
                    mixBlendMode: "screen", pointerEvents: "none",
                  }}/>
                )}
              </div>

              {/* Title block */}
              <div>
                <div style={{
                  color: C.dim, fontSize: "10px",
                  letterSpacing: "4px", marginBottom: "2px",
                }}>
                  ≋ PROSSIMO NODO ≋
                </div>
                <div style={{
                  fontSize: "22px", fontWeight: "bold", color: accent,
                  letterSpacing: "3px", marginBottom: "4px",
                  textShadow: `0 0 12px ${accent}aa, 0 0 26px ${accent}55`,
                  fontFamily: FONT,
                }}>
                  {nodeName}
                </div>
                {isElite && (
                  <div style={{
                    display: "inline-block",
                    color: "#000", background: C.orange,
                    fontSize: "10px", letterSpacing: "3px", fontWeight: "bold",
                    padding: "1px 7px", marginRight: "4px",
                    boxShadow: `0 0 8px ${C.orange}aa`,
                  }}>
                    ★ ELITE ★
                  </div>
                )}
                {isBoss && (
                  <div style={{
                    display: "inline-block",
                    color: "#000", background: C.red,
                    fontSize: "10px", letterSpacing: "3px", fontWeight: "bold",
                    padding: "1px 7px",
                    boxShadow: `0 0 8px ${C.red}aa`,
                    animation: ANIM.pulseActive,
                  }}>
                    ⚠ BOSS ⚠
                  </div>
                )}
              </div>
            </div>

            {/* Body: tickets info OR empty state */}
            {player.scratchCards.length > 0 ? (
              <div style={{
                textAlign: "center",
                background: `${accent}0c`,
                border: `1px solid ${accent}33`,
                padding: "10px 14px",
                marginBottom: "14px",
                fontSize: "11px", color: C.text, letterSpacing: "0.5px",
              }}>
                🎫 Puoi grattare fino a <strong style={{color: C.gold}}>
                {3 - preScratchCount}</strong> bigliett{(3 - preScratchCount) === 1 ? "o" : "i"} prima di entrare
              </div>
            ) : (
              <div style={{
                textAlign: "center", marginBottom: "14px",
                padding: "14px 10px",
                background: "#0a0508",
                border: `1px dashed ${C.red}55`,
              }}>
                <div style={{display:"block", margin:"0 auto 10px", opacity:0.85,
                  filter:"grayscale(0.35) drop-shadow(0 0 8px #00000088)"}}>
                  <Asset id="misc-nograttino" emoji="🎫" size={72} />
                </div>
                <div style={{
                  display: "inline-block",
                  background: C.red, color: "#000",
                  padding: "2px 8px", fontSize: "10px", fontWeight: "bold",
                  letterSpacing: "3px", marginBottom: "8px",
                  boxShadow: `0 0 8px ${C.red}aa`,
                }}>
                  ★ NESSUN GRATTINO ★
                </div>
                <div style={{color: C.dim, fontSize: "11px", lineHeight: 1.5, marginBottom: "4px"}}>
                  Di solito qui ci si ferma a grattare<br/>i biglietti comprati al Tabaccaio.
                </div>
                <div style={{color: C.gold, fontSize: "11px", fontStyle: "italic"}}>
                  Comprane al prossimo 🏪 Tabaccaio!
                </div>
              </div>
            )}

            {/* CTAs */}
            <div style={{
              display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap",
              borderTop: `1px solid ${accent}33`, paddingTop: "12px",
            }}>
              {preScratchCount < 3 && player.scratchCards.length > 0 && (
                <Btn variant="gold" onClick={handlePreScratch}>
                  🎫 Gratta ({3 - preScratchCount} rimasti)
                </Btn>
              )}
              <Btn onClick={enterNode}>
                Entra nel nodo →
              </Btn>
            </div>
          </div>

          {/* ═══ GRATTATORI ═══ */}
          {player.grattatori.length > 0 && (
            <div style={{
              ...S.panel, position: "relative",
              background: "#05080a",
              border: `2px solid ${C.cyan}44`,
              boxShadow: `0 0 14px ${C.cyan}20, inset 0 0 20px ${C.cyan}06`,
            }}>
              {/* Section header */}
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                borderBottom: `1px solid ${C.cyan}44`,
                paddingBottom: "6px", marginBottom: "10px",
                flexWrap: "nowrap", overflow: "hidden",
              }}>
                <div style={{
                  flexShrink: 0,
                  background: C.cyan, color: "#000",
                  padding: "3px 8px", fontSize: "10px", fontWeight: "bold",
                  letterSpacing: "1px", whiteSpace: "nowrap",
                  boxShadow: `0 0 8px ${C.cyan}88`,
                }}>
                  🔧 GRATTATORI
                </div>
                <div style={{flex: 1, color: C.dim, fontSize: "10px", letterSpacing: "0.5px", fontStyle: "italic",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                  proteggono le unghie
                </div>
                <div style={{flexShrink: 0, color: C.cyan, fontSize: "10px", letterSpacing: "1px", whiteSpace: "nowrap"}}>
                  {player.grattatori.length} {player.grattatori.length === 1 ? "pezzo" : "pezzi"}
                </div>
              </div>

              {/* Equipped indicator */}
              {player.equippedGrattatore && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  color: C.green, fontSize: "11px", marginBottom: "8px",
                  background: "#001a0a",
                  border: `1px solid ${C.green}66`,
                  padding: "5px 10px",
                  boxShadow: `inset 0 0 10px ${C.green}14`,
                }}>
                  <span style={{fontSize: "14px"}}>✓</span>
                  <span style={{letterSpacing: "1px"}}>EQUIPAGGIATO:</span>
                  <strong style={{color: C.bright}}>
                    {player.equippedGrattatore.emoji} {player.equippedGrattatore.name}
                  </strong>
                  <span style={{color: C.dim}}>({player.equippedGrattatore.usesLeft} usi)</span>
                  <Btn onClick={unequipGrattatore} style={{fontSize: "10px", marginLeft: "auto", padding: "2px 8px"}}>
                    ✗ Rimuovi
                  </Btn>
                </div>
              )}

              {/* Grattatori list */}
              <div style={{display: "flex", flexWrap: "wrap", gap: "5px"}}>
                {player.grattatori.map((g, idx) => {
                  const def = GRATTATORE_DEFS[g.id];
                  return (
                    <Tooltip key={idx} text={def ? `${def.desc} · ${g.usesLeft} uso/i rimasti` : g.name}>
                      <Btn
                        onClick={() => equipGrattatore(idx)}
                        variant={player.equippedGrattatore?.inventoryIdx === idx ? "gold" : "normal"}
                        style={{fontSize: "11px"}}>
                        {g.emoji} {g.name} ({g.usesLeft})
                      </Btn>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ CONSUMABILI ═══ */}
          {player.items.length > 0 && (
            <div style={{
              ...S.panel, position: "relative",
              background: "#05080a",
              border: `2px solid ${C.green}44`,
              boxShadow: `0 0 14px ${C.green}20, inset 0 0 20px ${C.green}06`,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                borderBottom: `1px solid ${C.green}44`,
                paddingBottom: "6px", marginBottom: "10px",
              }}>
                <div style={{
                  background: C.green, color: "#000",
                  padding: "3px 10px", fontSize: "10px", fontWeight: "bold",
                  letterSpacing: "2px",
                  boxShadow: `0 0 8px ${C.green}88`,
                }}>
                  ★ 💊 CONSUMABILI ★
                </div>
                <div style={{color: C.dim, fontSize: "10px", letterSpacing: "1px", fontStyle: "italic"}}>
                  click per usare
                </div>
                <div style={{marginLeft: "auto", color: C.green, fontSize: "10px", letterSpacing: "1px"}}>
                  {player.items.length}/{MAX_ITEMS}
                </div>
              </div>

              <div style={{display: "flex", flexWrap: "wrap", gap: "5px"}}>
                {player.items.map((itemId, idx) => {
                  const item = ITEM_DEFS[itemId];
                  return item ? (
                    <Tooltip key={idx} text={item.desc}>
                      <Btn onClick={() => handleUseItem(idx)} style={{fontSize: "11px"}}>
                        {item.emoji} {item.name}
                      </Btn>
                    </Tooltip>
                  ) : null;
                })}
              </div>
            </div>
          )}

        </div>
        );
      })()}

      {/* ═══ MAP ═══ */}
      {screen === "map" && player && map && (
        <div style={{
          flex:1, minHeight:0, width:"100%", maxWidth:W.content,
          display:"flex", flexDirection:"column", overflow:"hidden",
          position:"relative",
        }}>
          {/* Mappa — occupa tutto lo spazio disponibile */}
          <Suspense fallback={<LazyFallback />}>
          {wideShell ? (
          <MapBoard
            map={map}
            currentRow={currentRow}
            visitedNodes={visitedNodes}
            reachableNodes={getReachableNodes()}
            onSelectNode={selectNode}
            currentBiome={currentBiome}
            playerFortuna={effectiveFortune || player.fortune || 0}
            tokens={player.tokens}
            onEquipToken={handleEquipToken}
            onDiscardToken={handleDiscardToken}
            mirror={activeTokenVisual?.map === "mirror"}
            tokenPowers={tokenPowers}
          />
          ) : (
          <MapView
            map={map}
            currentRow={currentRow}
            visitedNodes={visitedNodes}
            reachableNodes={getReachableNodes()}
            onSelectNode={selectNode}
            currentBiome={currentBiome}
            playerFortuna={effectiveFortune || player.fortune || 0}
            tokens={player.tokens}
          />
          )}
          </Suspense>

          {/* Striscia inventario compatta — flexShrink:0, NON toglie spazio alla mappa */}
          {(player.items.length > 0 || player.grattatori.length > 0) && (
            <div style={{
              flexShrink:0,
              display:"flex", alignItems:"center", gap:"6px",
              padding:"5px 8px",
              background:"#06060e",
              borderTop:`1px solid ${C.cyan}22`,
              overflowX:"auto", overflowY:"hidden",
              WebkitOverflowScrolling:"touch",
            }}>
              {/* Grattatori */}
              {player.grattatori.map((g, idx) => {
                const def = GRATTATORE_DEFS[g.id];
                const isEquipped = player.equippedGrattatore?.inventoryIdx === idx;
                return (
                  <Tooltip key={"g"+idx} text={def ? `${def.desc} · ${g.usesLeft} uso/i` : g.name}>
                    <Btn
                      onClick={() => equipGrattatore(idx)}
                      style={{
                        flexShrink:0,
                        display:"flex", alignItems:"center", gap:"3px",
                        background: isEquipped ? `${C.cyan}22` : "#0a0a18",
                        border:`1px solid ${isEquipped ? C.cyan : "#333355"}`,
                        color: isEquipped ? C.cyan : C.dim,
                        padding:"3px 7px",
                        fontSize:"10px", fontFamily:FONT,
                        boxShadow: isEquipped ? `0 0 8px ${C.cyan}55` : "none",
                        letterSpacing:"0.5px",
                        WebkitTapHighlightColor:"transparent",
                      }}
                    >
                      <span style={{fontSize:"13px"}}><Asset id={`item-${g.id}`} emoji={g.emoji} size={15} /></span>
                      <span style={{fontSize:"10px"}}>{g.name}</span>
                      <span style={{
                        background: isEquipped ? C.cyan : "#222244",
                        color: isEquipped ? "#000" : C.dim,
                        fontSize:"10px", padding:"0 3px",
                        fontWeight:"bold",
                      }}>{g.usesLeft}</span>
                    </Btn>
                  </Tooltip>
                );
              })}
              {/* Divisore */}
              {player.grattatori.length > 0 && player.items.length > 0 && (
                <div style={{width:"1px", height:"20px", background:`${C.dim}33`, flexShrink:0}}/>
              )}
              {/* Consumabili */}
              {player.items.map((itemId, idx) => {
                const item = ITEM_DEFS[itemId];
                return item ? (
                  <Tooltip key={idx} text={item.desc}>
                    <Btn
                      onClick={() => handleUseItem(idx)}
                      style={{
                        flexShrink:0,
                        display:"flex", alignItems:"center", gap:"3px",
                        background:"#0a0a12",
                        border:`1px solid ${C.green}44`,
                        color: C.green,
                        padding:"3px 7px",
                        fontSize:"10px", fontFamily:FONT,
                        letterSpacing:"0.5px",
                        WebkitTapHighlightColor:"transparent",
                      }}
                    >
                      <span style={{fontSize:"13px"}}><Asset id={`item-${itemId}`} emoji={item.emoji} size={15} /></span>
                      <span style={{fontSize:"10px", color:C.dim}}>{item.name}</span>
                    </Btn>
                  </Tooltip>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ SHOP (Tabaccaio) ═══
           Su desktop largo il banco stesso si allarga per riempire lo spazio
           residuo (vedi wideDesk in ShopView) invece di restare stretto e
           lasciare che il layout lo ricentri in un'isola: flex-start lo tiene
           subito dopo la sidebar UNGHIE, la fiancata ZAINO segue a ruota. */}
      {screen === "shop" && player && (
        <div style={wideShell ? { flex:1, minHeight:0, width:"100%", display:"flex" } : {
          width:"100%",
          display:"flex", justifyContent: wideDesk ? "flex-start" : "center",
          gap: wideDesk ? "14px" : "0",
        }}>
          <Suspense fallback={<LazyFallback />}>
          <ShopView
            player={player}
            currentRow={currentRow}
            currentBiome={currentBiome}
            wideDesk={wideDesk}
            desk={wideShell}
            onBuyCard={handleBuyCard}
            onBuyItem={handleBuyItem}
            onBuyGrattatore={handleBuyGrattatore}
            onLeave={() => setScreen("map")}
            onScratch={handleShopScratch}
            onScratchCard={(idx) => { setReturnScreen("shop"); handleSelectCard(idx); }}
            onSlotResult={handleSlotResult}
          />
          {/* Su desktop niente fiancata ZAINO: c'è il bottone ZAINO in alto. */}
          {wideDesk && !wideShell && (
            <ShopZainoRail player={player} onEquipGrattatore={handleRailEquipGrattatore} onUseItem={handleUseItem} />
          )}
          </Suspense>
        </div>
      )}

      {/* ═══ LOCANDA ═══
          Resta centrata (non flex-start): richiesto esplicitamente
          dall'utente dopo un tentativo di allinearla come Shop/Event/Combat. */}
      {screen === "locanda" && player && (
        <div style={wideShell ? { flex:1, minHeight:0, width:"100%", display:"flex" } : {maxWidth:W.content, width:"100%"}}>
          <Suspense fallback={<LazyFallback />}>
          <LocandaView
            table={wideShell}
            player={player}
            onRest={handleRest}
            onLeave={() => setScreen("map")}
          />
          </Suspense>
        </div>
      )}

      {/* ═══ EVENT / NPC ═══
           Stesso pattern flex-start di ShopView (vedi commento lì): a schermo
           largo il pannello si allinea subito dopo la sidebar UNGHIE invece di
           restare centrato con margini vuoti identici su entrambi i lati —
           prima solo il negozio faceva così, evento e combattimento restavano
           centrati "a isola" con più spazio morto ai lati. */}
      {screen === "event" && player && currentNode && (
        <div style={{width:"100%", display:"flex", justifyContent:"center"}}>
          <Suspense fallback={<LazyFallback />}>
          <EventView
            node={currentNode}
            player={player}
            onChoice={handleEventChoice}
          />
          {/* Niente fiancata ZAINO qui: duplicava il bottone ZAINO della barra
              in alto (richiesto dall'utente). Lo stage resta centrato. */}
          </Suspense>
        </div>
      )}

      {/* ═══ NODE (generic) ═══ */}
      {screen === "node" && player && currentNode && (
        <div style={{maxWidth:"900px", width:"100%"}}>
          <div style={{...S.panel, textAlign:"center"}}>
            <div style={{...S.h2}}>{NODE_ICONS[currentNode.type]} {currentNode.type}</div>
            <Btn onClick={() => setScreen("map")}>Continua →</Btn>
          </div>
        </div>
      )}

      {/* ═══ COMBAT ═══
           Stesso pattern flex-start di ShopView/EventView: a schermo largo il
           pannello si allinea subito dopo la sidebar UNGHIE invece di restare
           centrato "a isola" con margini vuoti su entrambi i lati. */}
      {screen === "combat" && player && combatEnemy && (
        <div style={{flex:1, minHeight:0, width:"100%", display:"flex", justifyContent: wideDesk ? "flex-start" : "center", overflow:"hidden"}}>
        <div style={{flex:1, minHeight:0, width:"100%", maxWidth: wideShell ? "none" : W.content, display:"flex", flexDirection:"column", overflow:"hidden"}}>
          <Suspense fallback={<LazyFallback />}>
          <CombatView
            key={combatRunId /* Gettone VHS: riavvolgere rimonta il combattimento da capo */}
            tokenCombat={player.tokens ? { firstHitShield: firstHitShield(player.tokens), stealMult: tokenTheftMult } : undefined}
            table={wideShell}
            onEquipGrattatore={handleRailEquipGrattatore}
            enemy={combatEnemy}
            player={player}
            onEnd={handleCombatEnd}
            onCellScratch={handleCombatCellScratch}
            onGrattatoreConsumed={consumeGrattatore}
            onCombo={() => { unlockAchievement("combo_master"); setGameStats(s => ({...s, combosFired: (s.combosFired || 0) + 1})); }}
            onNailHeal={(count) => updatePlayer(p => ({ ...p, nails: healDamagedNails(p.nails, count) }))}
            onNailDamage={(count) => {
              updatePlayer(p => {
                // Guanto da BOSS (bossShield/guantoBossActive): protegge TUTTE le
                // dita per l'intera boss-fight, come promette la descrizione.
                // Attivo SOLO contro il boss (si sgretola a fine fight in handleCombatEnd).
                if (combatEnemy?.isBoss && (p.equippedGrattatore?.effect === "bossShield" || p.guantoBossActive)) return p;
                const nails = [...p.nails];
                // noCombatDegradeMeta (Unghia d'Acciaio): non più immunità totale
                // (rendeva il duello a HP impossibile da perdere) — assorbe 1 step
                // per colpo. I colpi leggeri (1) vengono annullati, i pesanti/FURIA passano ridotti.
                const effCount = p.noCombatDegradeMeta ? Math.max(0, count - 1) : count;
                for (let d = 0; d < effCount; d++) {
                  const alive = nails.findIndex(n => n.state !== "morta");
                  if (alive >= 0) nails[alive] = degradeNailObj(nails[alive], 1);
                }
                return {...p, nails};
              });
            }}
          />
          </Suspense>
        </div>
        {/* Stessa fiancata ZAINO del negozio/evento — a schermo largo il
            duello (maxWidth W.content) lascia spazio a destra della sidebar. */}
        {wideDesk && !wideShell && (
          <ShopZainoRail player={player} onEquipGrattatore={handleRailEquipGrattatore} onUseItem={handleUseItem} />
        )}
        </div>
      )}

      {/* ═══ CELLA ═══ */}
      {screen === "cella" && player && (() => {
        const WALL_NEEDED = 8;
        // Check reale: nessuna unghia VIVA sotto-max
        const anyAliveBelowMax = player.nails.some(n =>
          n.state !== "morta" && n.state !== "sana" && n.state !== "kawaii" && n.state !== "piede"
        );
        const canEscape = !anyAliveBelowMax && player.nails.some(n => n.state !== "morta");
        const aliveCount = player.nails.filter(n => n.state !== "morta").length;

        const handleGrattaMuro = () => {
          AudioEngine.scratch();
          if (canEscape) {
            // Avanza il contatore
            const newProgress = cellaProgress + 1;
            setCellaProgress(newProgress);
            addLog(`💪 Graffi il muro con forza! (${newProgress}/${WALL_NEEDED})`, C.green);
            // Ogni grattata consuma anche l'unghia
            updatePlayer(p => {
              const nails = [...p.nails];
              const active = p.activeNail;
              let nail = {...nails[active]};
              nail.scratchCount = (nail.scratchCount || 0) + 1;
              if (nail.scratchCount >= 3) { nail = degradeNailObj(nail); nail.scratchCount = 0; }
              nails[active] = nail;
              const newActive = nail.state === "morta"
                ? nails.findIndex((n,i) => i !== active && n.state !== "morta")
                : active;
              return {...p, nails, activeNail: newActive >= 0 ? newActive : active};
            });
            if (newProgress >= WALL_NEEDED) {
              addLog("🧱 IL MURO CEDE! Sei evaso! Corri!", C.gold);
              setTimeout(() => { setCellaProgress(0); setScreen("map"); }, 1200);
            }
          } else {
            // Nessun progresso — l'unghia si consuma contro il cemento
            addLog("🩸 Graffi il muro ma non succede nulla... l'unghia soffre.", C.red);
            updatePlayer(p => {
              const nails = [...p.nails];
              const active = p.activeNail;
              let nail = {...nails[active]};
              nail.scratchCount = (nail.scratchCount || 0) + 1;
              if (nail.scratchCount >= 3) { nail = degradeNailObj(nail); nail.scratchCount = 0; }
              nails[active] = nail;
              let newActive = active;
              if (nail.state === "morta") {
                const next = nails.findIndex((n,i) => i !== active && n.state !== "morta");
                newActive = next >= 0 ? next : active;
              }
              // GAY OVER se tutte le unghie morte
              if (!nails.some(n => n.state !== "morta")) {
                setTimeout(() => setScreen("gameOver"), 800);
              }
              return {...p, nails, activeNail: newActive};
            });
          }
        };

        const wallBricks = Array.from({length: WALL_NEEDED}, (_, i) => i < cellaProgress);

        // Desktop: minimal nei colori della mappa. Le unghie sono già nella
        // colonna a sinistra: qui scena, muro, condizione di fuga e il bottone.
        if (wideShell) return (
          <div style={{ flex:1, minHeight:0, width:"100%", display:"flex" }}>
            <MkScreen width={720} center>
              <MkTitle label="PRIGIONE" title="In cella" color={MK.red}
                sub="«Quindici anni di grattini illegali. Ora graffi i muri.»" />
              <div style={{ ...mkPanel(), padding: "16px", display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", gap: "18px", alignItems: "center" }}>
                <img src={assetUrl("scene-cella")} alt="La cella" style={{ width: "100%", display: "block", imageRendering: "pixelated", boxShadow: `inset 0 0 0 2px ${MK.lineHi}` }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: "2px", color: MK.dim }}>IL MURO · {cellaProgress}/{WALL_NEEDED} MATTONI</span>
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${WALL_NEEDED}, 1fr)`, gap: "4px" }}>
                    {wallBricks.map((broken, i) => (
                      <span key={i} style={{ height: "22px", background: broken ? "#000" : "#6b4a3a",
                        boxShadow: broken ? `inset 0 0 0 1px ${MK.line}` : "inset 2px 2px 0 #8a634f, inset -2px -2px 0 #4a3025" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "13px", lineHeight: 1.5, color: canEscape ? MK.green : MK.red }}>
                    {canEscape
                      ? `Unghie al massimo: puoi scavare. Ancora ${WALL_NEEDED - cellaProgress} graffi.`
                      : "Le unghie rovinate non scavano il cemento. Servono tutte le unghie vive Sane o Kawaii; altrimenti gratti a vuoto e l'unghia soffre."}
                  </span>
                  {aliveCount > 0
                    ? <MkButton kind={canEscape ? "primary" : "danger"} onClick={handleGrattaMuro} style={{ alignSelf: "flex-start" }}>
                        {canEscape ? "GRATTA IL MURO" : "GRATTA (INUTILE…)"}
                      </MkButton>
                    : <span style={{ fontSize: "14px", color: MK.red }}>Nessuna unghia rimasta. Il muro ha vinto.</span>}
                </div>
              </div>
            </MkScreen>
          </div>
        );

        return (
          <div style={{maxWidth:"500px", width:"100%", textAlign:"center", fontFamily:FONT}}>
            <div style={{...S.panel, borderColor:C.dim, background:"linear-gradient(180deg, rgba(10,10,12,0.8), rgba(3,3,4,0.9))", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", marginTop:"8px"}}>

              {/* Titolo */}
              <div style={{color:C.red, fontSize:"20px", fontWeight:"bold", letterSpacing:"3px", marginBottom:"4px", }}>
                🔒 IN CELLA
              </div>
              <div style={{color:C.dim, fontSize:"11px", marginBottom:"14px", fontStyle:"italic"}}>
                "Quindici anni di grattini illegali. Ora graffi i muri."
              </div>

              {/* Scena cella — finestra sull'ambientazione prigione */}
              <div style={{
                margin:"0 auto 12px", maxWidth:"300px",
                border:`2px solid #555`, borderRadius:"3px", overflow:"hidden",
                boxShadow:"inset 0 0 20px #000, 0 0 12px #0008",
                position:"relative",
              }}>
                <img src={assetUrl("scene-cella")} alt="Cella" style={{
                  width:"100%", display:"block", filter:"brightness(0.82) contrast(1.05)",
                }}/>
                {/* scanline CRT */}
                <div aria-hidden style={{
                  position:"absolute", inset:0, pointerEvents:"none", opacity:0.4,
                  backgroundImage:"repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 3px)",
                }}/>
              </div>

              {/* Barra progresso muro */}
              <div style={{marginBottom:"12px"}}>
                <div style={{fontSize:"11px", color:C.dim, marginBottom:"5px"}}>
                  {canEscape ? "Graffi nel posto giusto! Il muro si sgretola..." : "Unghie danneggiate — non riesci a fare breccia"}
                </div>
                <div style={{display:"flex", gap:"4px", justifyContent:"center", marginBottom:"6px"}}>
                  {wallBricks.map((broken, i) => (
                    <div key={i} style={{
                      width:"28px", height:"16px",
                      background: broken ? C.gold : "#2a2a2a",
                      border: `1px solid ${broken ? C.gold+"88" : "#444"}`,
                      borderRadius:"0",
                      transition:"all 0.3s",
                      boxShadow: broken ? `0 0 6px ${C.gold}66` : "none",
                      fontSize:"10px", display:"flex", alignItems:"center", justifyContent:"center",
                      color: broken ? "#000" : "#555",
                    }}>
                      {broken ? "✓" : "░"}
                    </div>
                  ))}
                </div>
                <div style={{color:C.dim, fontSize:"10px"}}>{cellaProgress}/{WALL_NEEDED} mattoni rimossi</div>
              </div>

              {/* Condizione fuga */}
              <div style={{
                ...S.panel,
                borderColor: canEscape ? C.green+"66" : C.red+"44",
                background: canEscape ? "#001200" : "#120000",
                padding:"8px 12px", marginBottom:"14px", fontSize:"11px",
              }}>
                {canEscape ? (
                  <span style={{color:C.green}}>✅ Unghie al massimo — puoi scavare! Ancora {WALL_NEEDED - cellaProgress} graffi.</span>
                ) : (
                  <span style={{color:C.red}}>
                    ❌ Le unghie danneggiate non scavano il cemento.<br/>
                    <span style={{color:C.dim, fontSize:"10px"}}>Hai bisogno di tutte le unghie vive al massimo (Sana/Kawaii).<br/>Altrimenti... gratta fino alla fine.</span>
                  </span>
                )}
              </div>

              {/* Stato unghie */}
              <div style={{display:"flex", gap:"5px", justifyContent:"center", marginBottom:"14px", flexWrap:"wrap"}}>
                {player.nails.map((n, i) => {
                  const info = NAIL_INFO[n.state] || NAIL_INFO.morta;
                  return (
                    <div key={i} style={{
                      padding:"3px 7px", borderRadius:"0",
                      border: `1px solid ${info.color}66`,
                      background: i === player.activeNail ? info.color+"22" : "transparent",
                      fontSize:"10px", color: info.color,
                    }}>
                      {info.label}
                    </div>
                  );
                })}
              </div>

              {/* Bottone gratta */}
              {aliveCount > 0 ? (
                <Btn
                  variant={canEscape ? "success" : "default"}
                  onClick={handleGrattaMuro}
                  style={{
                    fontSize:"16px", padding:"12px 32px", letterSpacing:"2px",
                    boxShadow: canEscape ? `0 0 20px ${C.green}55` : "none",
                  }}
                >
                  {canEscape ? "💪 GRATTA IL MURO" : "🩸 Gratta (inutile...)"}
                </Btn>
              ) : (
                <div style={{color:C.red, fontSize:"14px", fontWeight:"bold"}}>
                  Nessuna unghia rimasta. Il muro ha vinto.
                </div>
              )}

              {/* Flavor text */}
              <div style={{color:C.dim, fontSize:"10px", marginTop:"10px", fontStyle:"italic"}}>
                {canEscape
                  ? "Le unghie kawaii scavano il cemento come un laser. Tecnica di fuga livello 9."
                  : "\"Le unghie rotte non scalfiscono il muro di una cella.\" — Guardia Penitenziaria"}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ LABIRINTO ═══ */}
      {screen === "labirinto" && player && labirintoState && (() => {
        const ls = labirintoState;
        const [row, col] = ls.pos;
        const CELL_PRIZE = LABIRINTO_CELL_PRIZE;
        const JACKPOT_PRIZE = LABIRINTO_JACKPOT;

        const handleMove = () => {
          if (ls.done) return;
          const DELTA = {"→":[0,1],"↓":[1,0],"←":[0,-1],"↑":[-1,0]};
          const [dr, dc] = DELTA[ls.grid[row][col]] || [0, 0];
          const nr = row + dr, nc = col + dc;
          if (nr<0||nr>3||nc<0||nc>3) {
            addLog("Il percorso porta fuori dalla griglia... cella sbagliata!", C.red);
            return;
          }
          // Il rischio si decide ENTRANDO nella cella. Prima teschio e trofeo
          // scattavano solo ripartendo da lì, mentre "Cella attuale" mostrava già
          // il teschio: bastava incassare per non rischiare mai (RTP ~196%).
          const target = ls.grid[nr][nc];
          if (target === "💀") {
            handleNailDamage();
            addLog("💀 Hai trovato una trappola! Perdi tutto e un'unghia!", C.red);
            endMinigame({ kind: "lose", title: "TRAPPOLA!", detail: `Sei entrato in un 💀: perdi i €${ls.prize} accumulati e un'unghia.` }, () => setLabirintoState(st => st && ({...st, done: true, pos: [nr, nc], revealed: new Set(Array.from({length:16}, (_, i) => `${Math.floor(i/4)},${i%4}`))})));
            return;
          }
          // Il premio si paga SOLO per celle nuove: se la traiettoria entra in un
          // ciclo (due frecce che si rimbalzano) il giocatore poteva cliccare
          // all'infinito a +€8 a click. Ora un ciclo non frutta nulla e il totale
          // è comunque limitato a 16 celle.
          const alreadySeen = ls.revealed.has(`${nr},${nc}`);
          const newPrize = alreadySeen ? ls.prize : ls.prize + CELL_PRIZE;
          if (target === "🏆") {
            const totalPrize = newPrize + JACKPOT_PRIZE;
            updatePlayer(p => ({...p, money: p.money + totalPrize}));
            addLog(`🏆 SEI USCITO! Jackpot €${JACKPOT_PRIZE} + €${newPrize} = €${totalPrize}!`, C.gold);
            endMinigame({ kind: "win", amount: totalPrize, title: `€${totalPrize}`, detail: `Sei uscito dal labirinto: €${newPrize} di strada + €${JACKPOT_PRIZE} di jackpot.` }, () => setLabirintoState(st => st && ({...st, done: true, pos: [nr, nc], revealed: new Set(Array.from({length:16}, (_, i) => `${Math.floor(i/4)},${i%4}`))})));
            return;
          }
          const newRevealed = new Set(ls.revealed);
          newRevealed.add(`${row},${col}`);
          setLabirintoState({...ls, pos:[nr,nc], revealed:newRevealed, prize:newPrize});
          if (alreadySeen) addLog("🔄 Giri in tondo — questa cella l'hai già battuta. Nessun premio.", C.orange);
          else addLog(`Avanzi! +€${CELL_PRIZE} → totale €${newPrize}`, C.green);
        };

        const handleIncassa = () => {
          if (ls.prize > 0) {
            updatePlayer(p => ({...p, money: p.money + ls.prize}));
            addLog(`🏃 Hai incassato €${ls.prize} scappando dal labirinto!`, C.gold);
            endMinigame({ kind: "win", amount: ls.prize, title: `€${ls.prize}`, detail: "Sei scappato prima della trappola. Ecco dove portavano le frecce." },
              () => setLabirintoState(st => st && ({...st, done: true, revealed: new Set(Array.from({length:16}, (_, i) => `${Math.floor(i/4)},${i%4}`))})));
            return;
          }
          closeMinigame();
        };

        // Desktop: grattino sul tavolo (components/minigame/MinigameTable.jsx)
        if (wideShell) return (
          <div style={{ flex:1, minHeight:0, width:"100%", display:"flex" }}>
            {(() => {
              // Dove porta la freccia: quella casella si gratta per muoversi.
              const [dr, dc] = {"→":[0,1],"↓":[1,0],"←":[0,-1],"↑":[-1,0]}[ls.grid[row][col]] || [0, 0];
              const tr = row + dr, tc = col + dc;
              const inGrid = tr >= 0 && tr < 4 && tc >= 0 && tc < 4;
              const targetSeen = inGrid && ls.revealed.has(`${tr},${tc}`);
              return (
            <MinigameTable result={minigameResult} onContinue={closeMinigame} ticketId="labirinto" accent="#1f7a4a"
              frame={{ player, gameStats, biome: BIOMES[currentBiome], log, onEquipGrattatore: handleRailEquipGrattatore }}
              status={[["Accumulato", `€${ls.prize}`, true], ["Ogni casella nuova", `+€${CELL_PRIZE}`]]}
              hint={!inGrid ? "La freccia porta fuori: incassa e scappa." : targetSeen ? "La freccia torna indietro: nessun premio." : "Gratta la casella con la ★"}
              actions={[
                targetSeen && { label: "MUOVITI →", onClick: handleMove, kind: "primary" },
                ls.prize > 0 && { label: `INCASSA €${ls.prize}`, onClick: handleIncassa },
                { label: "ABBANDONA", onClick: closeMinigame, kind: "danger" },
              ]}>
              <div style={{ display: "grid", flex: 1, gridTemplateColumns: "repeat(4, minmax(0,1fr))", gridTemplateRows: "repeat(4, minmax(0,1fr))", gap: "2cqh 1.2cqw" }}>
                {ls.grid.map((rowData, r) => rowData.map((cell, c) => {
                  const isPos = r === row && c === col;
                  const seen = ls.revealed.has(`${r},${c}`);
                  const isTarget = !ls.done && inGrid && r === tr && c === tc && !seen;
                  return (
                    <CoverCell key={`${r},${c}`} revealed={isPos || seen} mark={isPos ? "#1f7a4a" : null}
                      onClick={isTarget ? handleMove : undefined} hot={isTarget}
                      label={isPos ? `Sei qui: ${cell}` : seen ? cell : isTarget ? "casella da grattare" : "casella coperta"}>
                      {isPos || seen ? <span style={{ display: "flex", color: isPos ? "#1f7a4a" : "#8a9a90" }}><MazeGlyph ch={cell} color={isPos ? "#1f7a4a" : "#8a9a90"} /></span> : undefined}
                    </CoverCell>
                  );
                }))}
              </div>
            </MinigameTable>
              );
            })()}
          </div>
        );

        return (
          <div style={{maxWidth:"500px", width:"100%", textAlign:"center"}}>
            <div style={{...S.panel, borderColor:"#00aa55", background:"#001a0a"}}>
              <div style={{...S.h2, color:"#00aa55"}}>🌀 IL LABIRINTO</div>
              <div style={{color:C.dim, fontSize:"11px", marginBottom:"8px"}}>
                Segui le frecce — arriva a 🏆 per €{JACKPOT_PRIZE}! Ogni cella = +€{CELL_PRIZE}.
              </div>
              <div style={{color:C.gold, fontSize:"14px", marginBottom:"10px", fontWeight:"bold"}}>
                💰 Accumulato: €{ls.prize}
              </div>
              {/* Griglia 4x4 */}
              <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"4px", marginBottom:"12px", maxWidth:"220px", margin:"0 auto 12px"}}>
                {ls.grid.map((rowData, r) => rowData.map((cell, c) => {
                  const isPos = r===row && c===col;
                  const isRevealed = ls.revealed.has(`${r},${c}`);
                  return (
                    <div key={`${r},${c}`} style={{
                      width:"48px", height:"48px", border:`2px solid ${isPos?"#00ff88":"#004422"}`,
                      background: isPos ? "#002211" : isRevealed ? "#001a0a" : "#001208",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize: isPos ? "22px" : isRevealed ? "16px" : "12px",
                      color: isPos ? "#00ff88" : isRevealed ? "#006633" : "#003311",
                      borderRadius:"0",
                    }}>
                      {isPos ? "👆" : isRevealed ? cell : "?"}
                    </div>
                  );
                }))}
              </div>
              <div style={{color:C.bright, fontSize:"12px", marginBottom:"10px"}}>
                Cella attuale: <strong style={{color:"#00ff88"}}>{ls.grid[row]?.[col]}</strong> — segui questa freccia!
              </div>
              <div style={{display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap"}}>
                <Btn variant="gold" onClick={handleMove}>
                  ➡ Muoviti!
                </Btn>
                {ls.prize > 0 && (
                  <Btn variant="normal" onClick={handleIncassa}>
                    🏃 Incassa e scappa (€{ls.prize})
                  </Btn>
                )}
                <Btn variant="danger" onClick={closeMinigame}>
                  ✗ Abbandona (€0)
                </Btn>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ GRATTA & COMBINA ═══ */}
      {screen === "grattaCombina" && player && combinaState && (() => {
        const cs = combinaState;
        const COMBO_PRIZE = COMBINA_COMBO_PRIZE;
        const MEGA_MULT = COMBINA_MEGA_MULT;

        const handleReveal = (grid, idx) => {
          if (cs.done) return;
          if (grid === "A" && cs.revealedA[idx]) return;
          if (grid === "B" && cs.revealedB[idx]) return;

          let newState = {...cs};
          if (grid === "A") {
            const newRev = [...cs.revealedA]; newRev[idx] = true;
            newState = {...newState, revealedA: newRev, lastRevealedA: cs.gridA[idx]};
          } else {
            const newRev = [...cs.revealedB]; newRev[idx] = true;
            newState = {...newState, revealedB: newRev, lastRevealedB: cs.gridB[idx]};
          }

          // Check combo: se entrambi i lastRevealed sono uguali e non-null
          const lastA = newState.lastRevealedA;
          const lastB = newState.lastRevealedB;
          if (lastA && lastB && lastA === lastB) {
            const newCombos = newState.combos + 1;
            const newPrize = newState.prize + COMBO_PRIZE;
            addLog(`✨ COMBO! ${lastA} = ${lastA}! +€${COMBO_PRIZE} (combo ${newCombos}/3)`, C.gold);
            if (newCombos >= 3) {
              // MEGA COMBO!
              const megaPrize = newPrize * MEGA_MULT;
              updatePlayer(p => ({...p, money: p.money + megaPrize}));
              addLog(`🎆 MEGA COMBO x${MEGA_MULT}! +€${megaPrize}!`, C.gold);
              endMinigame({ kind: "win", amount: megaPrize, title: `🎆 MEGA COMBO! €${megaPrize}`, detail: `Tre combo: €${newPrize} moltiplicati ×${MEGA_MULT}.` }, () => setCombinaState(st => st && ({...st, done: true, revealedA: Array(6).fill(true), revealedB: Array(6).fill(true)})));
              return;
            }
            newState = {...newState, combos: newCombos, prize: newPrize, lastRevealedA: null, lastRevealedB: null};
          }

          // Check se tutte le celle sono rivelate
          const allRevA = newState.revealedA.every(Boolean);
          const allRevB = newState.revealedB.every(Boolean);
          if (allRevA && allRevB) {
            if (newState.prize > 0) {
              updatePlayer(p => ({...p, money: p.money + newState.prize}));
              addLog(`🃏 Gratta & Combina finita! Hai vinto €${newState.prize}!`, C.gold);
            } else {
              addLog("Nessuna combo trovata...", C.dim);
            }
            endMinigame(newState.prize > 0
              ? { kind: "win", amount: newState.prize, title: `€${newState.prize}`, detail: `${newState.combos} ${newState.combos === 1 ? "combo" : "combo"} da €${COMBO_PRIZE}. Per la MEGA ne servivano 3.` }
              : { kind: "lose", title: "NESSUNA COMBO", detail: "Hai scoperto tutte le caselle senza mai due simboli uguali di fila." }, () => setCombinaState(st => st && ({...st, done: true, revealedA: Array(6).fill(true), revealedB: Array(6).fill(true)})));
            return;
          }
          setCombinaState(newState);
        };

        const renderGrid = (which) => {
          const grid = which === "A" ? cs.gridA : cs.gridB;
          const revealed = which === "A" ? cs.revealedA : cs.revealedB;
          const lastRev = which === "A" ? cs.lastRevealedA : cs.lastRevealedB;
          return (
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"4px"}}>
              {grid.map((sym, i) => (
                <div key={i} onClick={() => handleReveal(which, i)} style={{
                  width:"56px", height:"56px", border:`2px solid ${revealed[i] ? (sym===lastRev?"#ffd700":"#444") : "#336633"}`,
                  background: revealed[i] ? (sym===cs.lastRevealedA||sym===cs.lastRevealedB ? "#1a1200" : "#111") : "#001a00",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize: revealed[i] ? "24px" : "12px", cursor: revealed[i] ? "default" : "pointer",
                  color: revealed[i] ? "#fff" : "#336633", borderRadius:"0",
                }}>
                  {revealed[i] ? (sym || "—") : "?"}
                </div>
              ))}
            </div>
          );
        };

        if (wideShell) {
          const deskGrid = (which) => {
            const grid = which === "A" ? cs.gridA : cs.gridB;
            const revealed = which === "A" ? cs.revealedA : cs.revealedB;
            const last = which === "A" ? cs.lastRevealedA : cs.lastRevealedB;
            return (
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "stretch", gap: "1.5cqh" }}>
                <span style={{ fontSize: "11px", letterSpacing: "3px", color: "#fff3c4", textAlign: "center" }}>GRIGLIA {which}</span>
                <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gridTemplateRows: "repeat(2, minmax(0,1fr))", gap: "2cqh 1cqw" }}>
                  {grid.map((sym, i) => (
                    <CoverCell key={i} revealed={revealed[i]} onClick={() => handleReveal(which, i)}
                      mark={revealed[i] && sym && sym === last ? "#9a2a66" : null}
                      label={revealed[i] ? (sym || "vuota") : `griglia ${which}, casella coperta`}>
                      {revealed[i] ? (sym || <span style={{ color: "#b8a878" }}>—</span>) : undefined}
                    </CoverCell>
                  ))}
                </div>
              </div>
            );
          };
          const pair = (v) => (
            <span style={{ width: "26cqh", height: "26cqh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13cqh",
              background: "#fbeebc", boxShadow: "inset 0 0 0 2px #d9c27a" }}>{v || "·"}</span>
          );
          return (
            <div style={{ flex:1, minHeight:0, width:"100%", display:"flex" }}>
              <MinigameTable result={minigameResult} onContinue={closeMinigame} ticketId="grattaCombina" accent="#9a2a66"
                frame={{ player, gameStats, biome: BIOMES[currentBiome], log, onEquipGrattatore: handleRailEquipGrattatore }}
                status={[["Premio", `€${cs.prize}`, true], ["Combo", `${cs.combos}/3`], ["MEGA COMBO", `×${MEGA_MULT}`]]}
                hint="Gratta una casella in A e una in B"
                actions={[
                  { label: cs.prize > 0 ? `INCASSA €${cs.prize} E VAI` : "ABBANDONA", kind: cs.prize > 0 ? "primary" : "danger", onClick: () => {
                    if (cs.prize > 0) {
                      updatePlayer(p => ({...p, money: p.money + cs.prize})); addLog(`Incassato €${cs.prize} abbandonando.`, C.dim);
                      endMinigame({ kind: "win", amount: cs.prize, title: `€${cs.prize}`, detail: `${cs.combos} combo prima di lasciare. Ecco cosa c'era sotto.` }, () => setCombinaState(st => st && ({...st, done: true, revealedA: Array(6).fill(true), revealedB: Array(6).fill(true)})));
                    } else closeMinigame();
                  } },
                ]}>
                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "stretch", gap: "2.5cqw" }}>
                  {deskGrid("A")}
                  <div aria-label="Ultime due scoperte" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    {pair(cs.lastRevealedA)}
                    <span style={{ fontSize: "18px", color: cs.lastRevealedA && cs.lastRevealedA === cs.lastRevealedB ? "#ffe14a" : "#fff3c4" }}>=</span>
                    {pair(cs.lastRevealedB)}
                  </div>
                  {deskGrid("B")}
                </div>
              </MinigameTable>
            </div>
          );
        }

        return (
          <div style={{maxWidth:"500px", width:"100%", textAlign:"center"}}>
            <div style={{...S.panel, borderColor:"#ff2e93", background:"#1a0014"}}>
              <div style={{...S.h2, color:"#ff2e93"}}>🃏 GRATTA & COMBINA</div>
              <div style={{color:C.dim, fontSize:"11px", marginBottom:"8px"}}>
                Gratta una cella per griglia. Stesso simbolo sulle ultime due scoperte = COMBO (+€{COMBO_PRIZE}). 3 COMBO = MEGA COMBO x{MEGA_MULT}!
              </div>
              <div style={{color:C.gold, fontSize:"13px", marginBottom:"8px"}}>
                Combo: {cs.combos}/3 · Premio: €{cs.prize}
              </div>
              <div style={{display:"flex", gap:"16px", justifyContent:"center", marginBottom:"12px", flexWrap:"wrap"}}>
                <div>
                  <div style={{color:"#ff2e93", fontSize:"11px", marginBottom:"4px"}}>GRIGLIA A</div>
                  {renderGrid("A")}
                </div>
                <div>
                  <div style={{color:"#ff2e93", fontSize:"11px", marginBottom:"4px"}}>GRIGLIA B</div>
                  {renderGrid("B")}
                </div>
              </div>
              <Btn variant="danger" onClick={() => {
                if (cs.prize > 0) { updatePlayer(p => ({...p, money: p.money + cs.prize})); addLog(`Incassato €${cs.prize} abbandonando.`, C.dim); }
                closeMinigame();
              }}>
                ✗ Abbandona {cs.prize > 0 ? `(incassa €${cs.prize})` : "(€0)"}
              </Btn>
            </div>
          </div>
        );
      })()}

      {/* ═══ MAPPA DEL TESORO ═══ */}
      {screen === "mappaTesor0" && player && tesoroState && (() => {
        const ts = tesoroState;
        const X_PRIZE = TESORO_X_PRIZE;
        const JACKPOT_PRIZE = TESORO_JACKPOT;

        const getManhattanDist = (idx) => {
          const r = Math.floor(idx/4), c = idx%4;
          let minDist = 99;
          ts.treasures.forEach(ti => {
            const tr = Math.floor(ti/4), tc = ti%4;
            minDist = Math.min(minDist, Math.abs(r-tr)+Math.abs(c-tc));
          });
          return minDist;
        };

        const handleReveal = (idx) => {
          if (ts.done || ts.revealed[idx]) return;
          const newRevealed = [...ts.revealed]; newRevealed[idx] = true;

          if (ts.bombs.has(idx)) {
            // Bomba!
            handleNailDamage();
            addLog("💣 BOMBA! Perdi tutto e un'unghia!", C.red);
            endMinigame({ kind: "lose", title: "BOOM!", detail: `Hai scoperto una 💣: perdi i €${ts.prize} trovati e un'unghia.` }, () => setTesoroState(st => st && ({...st, done: true, revealed: Array(16).fill(true)})));
            return;
          }

          let newPrize = ts.prize;
          let newFoundTreasures = ts.foundTreasures;
          if (ts.treasures.has(idx)) {
            newFoundTreasures++;
            newPrize += X_PRIZE;
            addLog(`💎 DIAMANTE TROVATO! +€${X_PRIZE} (${newFoundTreasures}/2)`, C.gold);
            if (newFoundTreasures >= 2) {
              // JACKPOT — trovati tutti i tesori: paga il cumulato + jackpot bonus
              const total = newPrize + JACKPOT_PRIZE;
              updatePlayer(p => ({...p, money: p.money + total}));
              addLog(`🗺️ JACKPOT! Trovato tutto! €${newPrize} accumulati + €${JACKPOT_PRIZE} bonus = +€${total}!`, C.gold);
              endMinigame({ kind: "win", amount: total, title: `🗺️ JACKPOT! €${total}`, detail: `Tutti e due i 💎 diamanti: €${newPrize} + €${JACKPOT_PRIZE} di bonus.` }, () => setTesoroState(st => st && ({...st, done: true, revealed: Array(16).fill(true)})));
              return;
            }
          }

          setTesoroState({...ts, revealed:newRevealed, prize:newPrize, foundTreasures:newFoundTreasures});
        };

        if (wideShell) {
          const DIST_INK = { 1: "#a3161d", 2: "#b0661a", 3: "#8a6a22" };
          return (
            <div style={{ flex:1, minHeight:0, width:"100%", display:"flex" }}>
              <MinigameTable result={minigameResult} onContinue={closeMinigame} ticketId="mappaTesor0" accent="#8a5a12"
                frame={{ player, gameStats, biome: BIOMES[currentBiome], log, onEquipGrattatore: handleRailEquipGrattatore }}
                status={[["Premio", `€${ts.prize}`, true], ["Diamanti", `${ts.foundTreasures}/2`], ["Jackpot", `+€${JACKPOT_PRIZE}`]]}
                hint="Gratta: i numeri dicono quanto manca al 💎"
                actions={[
                  ts.prize > 0 && { label: `INCASSA €${ts.prize}`, kind: "primary", onClick: () => {
                    updatePlayer(p => ({...p, money: p.money + ts.prize}));
                    addLog(`💰 Incassato €${ts.prize} con ${ts.foundTreasures} diamanti trovati.`, C.gold);
                    endMinigame({ kind: "win", amount: ts.prize, title: `€${ts.prize}`, detail: `${ts.foundTreasures} diamante trovato. Ecco dov'erano l'altro e le bombe.` }, () => setTesoroState(st => st && ({...st, done: true, revealed: Array(16).fill(true)})));
                  } },
                  { label: "ABBANDONA", kind: "danger", onClick: closeMinigame },
                ]}>
                <div style={{ display: "grid", flex: 1, gridTemplateColumns: "repeat(4, minmax(0,1fr))", gridTemplateRows: "repeat(4, minmax(0,1fr))", gap: "2cqh 1.2cqw" }}>
                  {Array.from({length:16}, (_, idx) => {
                    const rev = ts.revealed[idx];
                    const isTreasure = ts.treasures.has(idx), isBomb = ts.bombs.has(idx);
                    const dist = rev && !isTreasure && !isBomb ? getManhattanDist(idx) : null;
                    return (
                      <CoverCell key={idx} revealed={rev} onClick={() => handleReveal(idx)}
                        mark={rev && isTreasure ? "#8a5a12" : null}
                        label={rev ? (isTreasure ? "tesoro" : isBomb ? "bomba" : `distanza ${dist}`) : "casella coperta"}>
                        {rev ? (isTreasure ? "💎" : isBomb ? "💣" : <span style={{ color: DIST_INK[dist] || "#5d6f68" }}>{dist}</span>) : undefined}
                      </CoverCell>
                    );
                  })}
                </div>
              </MinigameTable>
            </div>
          );
        }

        return (
          <div style={{maxWidth:"500px", width:"100%", textAlign:"center"}}>
            <div style={{...S.panel, borderColor:"#cc8800", background:"#1a0e00"}}>
              <div style={{...S.h2, color:"#cc8800"}}>🗺️ LA MAPPA DEL TESORO</div>
              <div style={{color:C.dim, fontSize:"11px", marginBottom:"8px"}}>
                Trova i 2 💎 senza toccare le 💣. I numeri indicano quanti passi mancano al diamante più vicino.
              </div>
              <div style={{color:C.gold, fontSize:"13px", marginBottom:"10px"}}>
                Diamanti: {ts.foundTreasures}/2 · Premio: €{ts.prize > 0 ? ts.prize : "?"} (jackpot €{JACKPOT_PRIZE})
              </div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"4px", maxWidth:"240px", margin:"0 auto 12px"}}>
                {Array.from({length:16}, (_,idx) => {
                  const rev = ts.revealed[idx];
                  const isTreasure = ts.treasures.has(idx);
                  const isBomb = ts.bombs.has(idx);
                  const dist = rev && !isTreasure && !isBomb ? getManhattanDist(idx) : null;
                  const distColor = dist === 1 ? C.red : dist === 2 ? C.orange : dist === 3 ? C.gold : C.dim;
                  return (
                    <div key={idx} onClick={() => handleReveal(idx)} style={{
                      width:"52px", height:"52px",
                      border:`2px solid ${rev ? (isTreasure ? C.gold : isBomb ? C.red : "#444") : "#664400"}`,
                      background: rev ? (isTreasure ? "#1a1200" : isBomb ? "#1a0000" : "#111") : "#1a0a00",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize: rev ? (isTreasure || isBomb ? "22px" : "18px") : "16px",
                      cursor: rev ? "default" : "pointer", borderRadius:"0",
                      color: rev && !isTreasure && !isBomb ? distColor : "#fff",
                    }}>
                      {rev ? (isTreasure ? "💎" : isBomb ? "💣" : dist !== null ? dist : "") : "?"}
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap"}}>
                {ts.prize > 0 && (
                  <Btn variant="gold" onClick={() => {
                    updatePlayer(p => ({...p, money: p.money + ts.prize}));
                    addLog(`💰 Incassato €${ts.prize} con ${ts.foundTreasures} diamanti trovati.`, C.gold);
                    closeMinigame();
                  }}>
                    💰 Incassa €{ts.prize}
                  </Btn>
                )}
                <Btn variant="danger" onClick={closeMinigame}>
                  ✗ Abbandona (€0)
                </Btn>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ GAME OVER ═══ */}
      {screen === "gameOver" && wideShell && (
        <div style={{ flex:1, minHeight:0, width:"100%", display:"flex" }}>
          <GameOverDesk gameStats={gameStats} onRetry={() => setScreen("title")} onTrophies={() => setShowTrophies(true)} />
        </div>
      )}
      {screen === "gameOver" && !wideShell && (
        <div style={{
          textAlign: "center", maxWidth: "560px", width: "100%",
          border: `2px solid ${C.red}`,
          animation: "gameOverBorder 2s ease-in-out infinite",
          padding: "18px",
          position: "relative",
          backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          // Vetro traslucido su scene-gameover + scanlines CRT
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px), linear-gradient(180deg, rgba(24,0,0,0.74) 0%, rgba(5,5,11,0.84) 100%)",
        }}>
          {/* Corner brackets decorativi grandi */}
          {["tl","tr","bl","br"].map(pos => {
            const [v, h] = pos.split("");
            return (
              <div key={pos} style={{
                position: "absolute",
                [v === "t" ? "top" : "bottom"]: "6px",
                [h === "l" ? "left" : "right"]: "6px",
                width: "18px", height: "18px",
                borderTop: v === "t" ? `2px solid ${C.red}` : "none",
                borderBottom: v === "b" ? `2px solid ${C.red}` : "none",
                borderLeft: h === "l" ? `2px solid ${C.red}` : "none",
                borderRight: h === "r" ? `2px solid ${C.red}` : "none",
                boxShadow: `0 0 8px ${C.red}88`,
              }}/>
            );
          })}

          {/* Skull animato */}
          <div style={{
            fontSize:"52px", marginBottom:"6px",
            animation:"gameOverSkull 1.8s ease-in-out infinite",
            filter:`drop-shadow(0 0 14px ${C.red})`,
          }}>💀</div>

          {/* ASCII GAME OVER con flicker CRT */}
          <div style={{marginBottom: "12px"}}>
            <pre style={{
              ...S.pre, color: C.red, fontSize: "12px",
              display: "inline-block", lineHeight: 1.2,
              animation: "gameOverFlicker 3.2s ease-in-out infinite",
              margin: 0,
              textAlign: "left",
            }}>{` ██████╗  █████╗ ██╗   ██╗
██╔════╝ ██╔══██╗╚██╗ ██╔╝
██║  ███╗███████║ ╚████╔╝
██║   ██║██╔══██║  ╚██╔╝
╚██████╔╝██║  ██║   ██║
 ╚═════╝ ╚═╝  ╚═╝   ╚═╝
      O   V   E   R`}
            </pre>
          </div>

          {/* Badge di morte — sotto l'ASCII per gerarchia visiva */}
          <div style={{marginBottom: "12px"}}>
            <div style={{
              display: "inline-block",
              background: C.red, color: "#000",
              fontSize: "10px", fontWeight: "bold", letterSpacing: "4px",
              padding: "3px 14px",
              boxShadow: `0 0 12px ${C.red}aa`,
            }}>
              ★ FINE DELLA RUN ★
            </div>
          </div>

          <div style={{
            color: "#cc6677", fontSize: "12px", fontStyle: "italic",
            marginBottom: "14px", letterSpacing: "1px",
            background: "#1a0005",
            border: `1px solid ${C.red}44`,
            padding: "6px 12px",
            display: "inline-block",
            boxShadow: `inset 0 0 10px ${C.red}14`,
          }}>
            <span style={{color: C.red, marginRight: "6px"}}>❝</span>
            Le tue unghie si sono consumate fino all'osso.
            <span style={{color: C.red, marginLeft: "6px"}}>❞</span>
          </div>

          {/* Section header */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            borderBottom: `1px solid ${C.gold}44`,
            paddingBottom: "6px", marginBottom: "10px",
            maxWidth: "420px", margin: "0 auto 10px",
          }}>
            <div style={{
              background: C.gold, color: "#000",
              padding: "2px 10px", fontSize: "10px", fontWeight: "bold",
              letterSpacing: "2px",
              boxShadow: `0 0 6px ${C.gold}88`,
            }}>
              ★ 📊 DIARIO DI RUN ★
            </div>
            <div style={{marginLeft: "auto", color: C.gold, fontSize: "10px", letterSpacing: "1px"}}>
              12 metriche
            </div>
          </div>

          {/* Stats grid — tile foil con icon centrale */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px",
            marginBottom: "16px", maxWidth: "420px", margin: "0 auto 16px",
          }}>
            {[
              { icon: "🖐️", label: "GRATTATE", val: gameStats.cardsScratched, color: C.magenta },
              { icon: "✅", label: "VINTE", val: gameStats.scratchWins || 0, color: C.green },
              { icon: "❌", label: "PERSE", val: gameStats.scratchLosses || 0, color: C.red },
              { icon: "💰", label: "GUADAGNATO", val: `€${gameStats.moneyEarned}`, color: C.gold },
              { icon: "💸", label: "SPESO", val: `€${gameStats.moneySpent || 0}`, color: C.orange },
              { icon: "🗺️", label: "NODI", val: gameStats.nodesVisited, color: C.cyan },
              { icon: "⚔️", label: "COMBAT ✓", val: gameStats.combatsWon || 0, color: C.green },
              { icon: "💀", label: "COMBAT ✗", val: gameStats.combatsLost || 0, color: C.red },
              { icon: "⚡", label: "COMBO", val: gameStats.combosFired || 0, color: C.cyan },
              { icon: "🌙", label: "SOGNI", val: gameStats.dreamsHad || 0, color: C.magenta },
              { icon: "🎰", label: "SLOT", val: gameStats.slotPlays || 0, color: C.gold },
              { icon: "🏆", label: "MIGLIOR €", val: `€${gameStats.bestPrize || 0}`, color: C.gold },
            ].map(s => (
              <div key={s.label} style={{
                background: "#07070d",
                border: `1px solid ${s.color}66`,
                boxShadow: `inset 0 0 8px ${s.color}18`,
                padding: "6px 4px 5px",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Icon dietro semi-trasparente */}
                <div style={{
                  position: "absolute", right: "-4px", bottom: "-6px",
                  fontSize: "28px", opacity: 0.12,
                  textShadow: `0 0 8px ${s.color}`,
                  pointerEvents: "none",
                }}>{s.icon}</div>
                <div style={{
                  color: s.color, fontSize: "10px",
                  letterSpacing: "1.5px", fontWeight: "bold",
                  marginBottom: "2px", position: "relative",
                }}>
                  {s.icon} {s.label}
                </div>
                <div style={{
                  color: s.color, fontSize: "14px", fontWeight: "bold",
                  fontFamily: FONT, position: "relative",
                  textShadow: `0 0 6px ${s.color}55`,
                }}>
                  {s.val}
                </div>
              </div>
            ))}
          </div>

          <div style={{display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap"}}>
            <Btn variant="gold" onClick={() => { setScreen("title"); }} style={{letterSpacing: "2px"}}>
              ↻ RIPROVA
            </Btn>
            <Btn onClick={() => setShowTrophies(true)} style={{fontSize: "11px", borderColor: C.gold, color: C.gold, letterSpacing: "1px"}}>
              🏆 TROFEI
            </Btn>
          </div>
        </div>
      )}

      {/* ═══ VICTORY ═══ */}
      {/* ═══ CEDOLE DEL BROKER — meta-progressione post-vittoria ═══ */}
      {screen === "cedole" && pendingCedoleOffer && wideShell && (
        <div style={{ flex:1, minHeight:0, width:"100%", display:"flex" }}>
          <CedoleDesk offer={pendingCedoleOffer} active={CEDOLE.find(c => c.id === activeCedola)}
            onPick={(cedola) => {
              setStored(STORAGE_KEYS.cedola, cedola.id);
              setActiveCedola(cedola.id);
              setPendingCedoleOffer(null);
              setScreen("victory");
            }}
            onRefuse={() => { setPendingCedoleOffer(null); setScreen("victory"); }} />
        </div>
      )}
      {screen === "cedole" && pendingCedoleOffer && !wideShell && (
        <div style={{textAlign:"center", maxWidth:"600px", width:"100%"}}>
          <div style={{color:C.gold, fontSize:"18px", fontWeight:"bold", letterSpacing:"4px", marginBottom:"4px"}}>
            IL BROKER TI OFFRE UN ACCORDO
          </div>
          <div style={{color:C.dim, fontSize:"11px", marginBottom:"20px", letterSpacing:"2px"}}>
            Scegli una cedola permanente — attiva dalla prossima run
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:"12px", marginBottom:"20px"}}>
            {pendingCedoleOffer.map(cedola => (
              <div
                key={cedola.id}
                onClick={() => {
                  setStored(STORAGE_KEYS.cedola, cedola.id);
                  setActiveCedola(cedola.id);
                  setPendingCedoleOffer(null);
                  setScreen("victory");
                }}
                style={{
                  border:`2px solid ${C.gold}`, background:"#000000",
                  padding:"14px 18px", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:"14px",
                  textAlign:"left",
                }}
                onMouseEnter={e => e.currentTarget.style.background=C.gold}
                onMouseLeave={e => e.currentTarget.style.background="#000000"}
              >
                <div style={{fontSize:"32px", flexShrink:0}}>{cedola.icon}</div>
                <div style={{flex:1}}>
                  <div style={{color:C.gold, fontWeight:"bold", fontSize:"13px", marginBottom:"4px", fontFamily:FONT}}>
                    {cedola.name}
                  </div>
                  <div style={{fontSize:"11px", display:"flex", gap:"12px"}}>
                    <span style={{color:C.green}}>✚ {cedola.pro}</span>
                    <span style={{color:C.red}}>✖ {cedola.contro}</span>
                  </div>
                </div>
                <div style={{color:C.gold, fontSize:"16px", flexShrink:0}}>▶</div>
              </div>
            ))}
          </div>
          <Btn onClick={() => { setPendingCedoleOffer(null); setScreen("victory"); }}
            style={{fontSize:"11px", color:C.dim, borderColor:C.dim}}>
            Rifiuta — nessuna cedola
          </Btn>
          {activeCedola && (
            <div style={{color:C.dim, fontSize:"10px", marginTop:"12px"}}>
              Cedola attiva: {CEDOLE.find(c=>c.id===activeCedola)?.icon} {CEDOLE.find(c=>c.id===activeCedola)?.name}
            </div>
          )}
        </div>
      )}

      {screen === "victory" && player && wideShell && (
        <div style={{ flex:1, minHeight:0, width:"100%", display:"flex" }}>
          <VictoryDesk revealed={victoryRevealed}
            bossName={BIOMES[BIOMES.length-1].boss} biomeCount={BIOMES.length}
            onNewRun={() => setScreen("title")} onTrophies={() => setShowTrophies(true)}
            stats={[
              ["SOLDI FINALI", `€${fmtMoney(player.money)}`, C.gold],
              ["UNGHIE VIVE", `${player.nails.filter(n=>n.state!=="morta").length}/${player.nails.length}`, C.green],
              ["GRATTATE", gameStats.cardsScratched],
              ["VINTE", gameStats.scratchWins||0, C.green],
              ["PERSE", gameStats.scratchLosses||0, C.red],
              ["GUADAGNATO", `€${gameStats.moneyEarned}`, C.gold],
              ["NODI", gameStats.nodesVisited],
              ["MIGLIOR PREMIO", `€${gameStats.bestPrize||0}`, C.gold],
              ["COMBATTIMENTI VINTI", gameStats.combatsWon||0, C.green],
              ["COMBO", gameStats.combosFired||0],
            ]}
            canvas={
              <canvas ref={victoryCanvasRef} width={520} height={140}
                style={{ position:"absolute", inset:0, width:"100%", height:"100%", cursor:"crosshair", touchAction:"none" }}
                onMouseDown={e => { victoryDrawing.current = true; handleVictoryScratch(e.clientX, e.clientY); }}
                onMouseMove={e => { if (victoryDrawing.current) handleVictoryScratch(e.clientX, e.clientY); }}
                onMouseUp={() => { victoryDrawing.current = false; }}
                onMouseLeave={() => { victoryDrawing.current = false; }} />
            } />
        </div>
      )}
      {screen === "victory" && player && !wideShell && (
        <div style={{textAlign:"center", maxWidth:"520px", width:"100%", position:"relative"}}>

          {/* ── CONFETTI gold — visibili solo dopo il reveal ──
               Con prefers-reduced-motion non li montiamo affatto: sono 18 elementi
               che cadono ruotando, il caso peggiore per chi è sensibile al movimento. */}
          {victoryRevealed && !reducedMotion && (() => {
            const rng = (s) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };
            const confetti = ["🌟","✨","💫","⭐","🏆","💰","🎊","🎉"];
            return Array.from({length:18}, (_,i) => (
              <div key={i} style={{
                position:"absolute",
                left:`${5 + rng(i*7)*88}%`,
                top:`${rng(i*11)*30}%`,
                fontSize:`${10 + rng(i*13)*14}px`,
                animation:`confettiDrop ${1.2 + rng(i*17)*1.6}s ${rng(i*19)*0.8}s ease-in forwards`,
                pointerEvents:"none", zIndex:10,
              }}>{confetti[i % confetti.length]}</div>
            ));
          })()}

          {/* ── SCRATCH CARD TITOLO ── */}
          <div style={{position:"relative", marginBottom: victoryRevealed ? "16px" : "4px", userSelect:"none"}}>
            {/* Testo nascosto sotto */}
            <div style={{padding:"18px 0 10px"}}>
              <div style={{
                color:C.gold, fontSize:"clamp(32px,7vw,56px)", fontWeight:"bold",
                letterSpacing:"4px", lineHeight:1, fontFamily:FONT,
                animation: victoryRevealed ? "victoryGoldPulse 1.8s ease-in-out infinite" : "none",
              }}>
                SEI LUDOPATICO
              </div>
              <div style={{
                color:C.gold, fontSize:"clamp(14px,3vw,22px)", fontWeight:"bold",
                letterSpacing:"6px", fontFamily:FONT, marginTop:"6px",
                opacity:0.9, animation: victoryRevealed ? "victoryGoldPulse 2.2s ease-in-out infinite" : "none",
              }}>
                COMPLIMENTI!
              </div>
            </div>
            {/* Canvas overlay — sparisce quando rivelato */}
            {!victoryRevealed && (
              <canvas
                ref={victoryCanvasRef}
                width={520} height={140}
                style={{
                  position:"absolute", top:0, left:0, width:"100%", height:"100%",
                  cursor:"crosshair", touchAction:"none",
                }}
                onMouseDown={e => { victoryDrawing.current = true; handleVictoryScratch(e.clientX, e.clientY); }}
                onMouseMove={e => { if (victoryDrawing.current) handleVictoryScratch(e.clientX, e.clientY); }}
                onMouseUp={() => { victoryDrawing.current = false; }}
                onMouseLeave={() => { victoryDrawing.current = false; }}
                onTouchStart={e => { victoryDrawing.current = true; handleVictoryScratch(e.touches[0].clientX, e.touches[0].clientY); }}
                onTouchMove={e => { e.preventDefault(); handleVictoryScratch(e.touches[0].clientX, e.touches[0].clientY); }}
                onTouchEnd={() => { victoryDrawing.current = false; }}
              />
            )}
          </div>

          {/* ── CONTENUTO: visibile solo dopo il reveal ── */}
          {victoryRevealed && (<>
            <div style={{color:C.dim, fontSize:"13px", marginBottom:"10px", letterSpacing:"3px"}}>
              ─── vittoria ───
            </div>
            <div style={{color:C.green, fontSize:"13px", marginBottom:"6px"}}>
              Hai sconfitto {BIOMES[BIOMES.length-1].boss}!
            </div>
            <div style={{color:C.bright, marginBottom:"12px", fontSize:"11px"}}>
              Hai conquistato tutti e {BIOMES.length} i biomi. Sei il Re dei Grattini — 'o capo d'Italia!
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5px", marginBottom:"16px", textAlign:"left", maxWidth:"380px", margin:"0 auto 16px"}}>
              {[
                ["💰 Soldi finali", `€${fmtMoney(player.money)}`, C.gold],
                ["🖐️ Unghie vive", `${player.nails.filter(n=>n.state!=="morta").length}/${player.nails.length}`, C.green],
                ["🖐️ Carte grattate", gameStats.cardsScratched, C.magenta],
                ["✅ Grattate vincenti", gameStats.scratchWins||0, C.green],
                ["❌ Grattate perdenti", gameStats.scratchLosses||0, C.red],
                ["💰 Guadagnato", `€${gameStats.moneyEarned}`, C.gold],
                ["🗺️ Nodi visitati", gameStats.nodesVisited, C.cyan],
                ["🏆 Miglior premio", `€${gameStats.bestPrize||0}`, C.gold],
                ["⚔️ Combat vinti", gameStats.combatsWon||0, C.green],
                ["⚡ Combo", gameStats.combosFired||0, C.cyan],
              ].map(([label, val, color], i) => (
                <div key={label} style={{
                  background:"#0d0d18", border:`1px solid ${color}44`, padding:"5px 8px",
                  animation:`statTileIn 0.4s ${i * 0.06}s ease-out both`,
                  boxShadow:`inset 0 0 8px ${color}18`,
                }}>
                  <div style={{color:C.dim, fontSize:"10px"}}>{label}</div>
                  <div style={{color, fontSize:"12px", fontWeight:"bold"}}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{color:C.dim, marginBottom:"12px", fontSize:"11px"}}>
              BETA 5 — Hai completato tutti i biomi!
            </div>
            <div style={{display:"flex", gap:"10px", justifyContent:"center", flexWrap:"wrap"}}>
              <Btn variant="gold" onClick={() => setScreen("title")} style={{fontSize:"16px", padding:"12px 32px"}}>
                Nuova Run
              </Btn>
              <Btn onClick={() => setShowTrophies(true)} style={{fontSize:"11px", borderColor:C.gold, color:C.gold}}>
                🏆 Trofei
              </Btn>
            </div>
          </>)}

          {/* hint se non ancora rivelato */}
          {!victoryRevealed && (
            <div style={{color:C.dim, fontSize:"10px", letterSpacing:"2px", marginTop:"6px"}}>
              gratta la tessera per scoprire il risultato
            </div>
          )}
        </div>
      )}

      {/* ═══ ITEM FOUND MODAL ═══ */}
      {itemFoundModal && (() => {
        const IFM_RARITY = {
          comune:     { c:"#7a8aaa", label:"COMUNE" },
          media:      { c:"#00cccc", label:"MEDIA" },
          rara:       { c:"#cc66ff", label:"RARA" },
          epica:      { c:C.orange,  label:"EPICA" },
          rarissimo:  { c:C.gold,    label:"RARISSIMO" },
          rarissima:  { c:C.gold,    label:"RARISSIMA" },
          leggendaria:{ c:C.gold,    label:"LEGGEND." },
        };
        const rar = IFM_RARITY[itemFoundModal.rarity] || null;
        const em = itemFoundModal.emoji || "✦";
        const sub = (itemFoundModal.subtitle || "").toLowerCase();
        const nm  = (itemFoundModal.name    || "").toLowerCase();
        const isDanger = ["💀","🩸","🚫"].some(e => em.includes(e))
          || nm.match(/fallita|maledizione|gelosia|negato|perdita|maledett/);
        const isWin = ["🏆","⚡","🌍"].some(e => em.includes(e))
          || sub.match(/vittoria|sbloccato/);
        const accent = rar ? rar.c
          : isDanger ? "#ff3355"
          : isWin    ? C.green
          : sub.includes("reliquia")  ? C.gold
          : sub.includes("grattatore")? C.cyan
          : sub.includes("chirurgo")  ? "#00cccc"
          : sub.includes("macellaio") ? "#ff6600"
          : sub.includes("collezion") ? "#ffcc00"
          : sub.includes("evento")    ? "#ff9ec4"
          : C.gold;
        const descLines = (itemFoundModal.desc || "").split("\n");
        return (
          <div style={{
            position:"fixed", inset:0,
            background:"rgba(0,0,0,0.91)", zIndex:99998,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            {/* Backdrop glow */}
            <div style={{
              position:"absolute", inset:0, pointerEvents:"none",
              background:`radial-gradient(ellipse 70% 55% at 50% 50%, ${accent}1a 0%, ${accent}07 45%, transparent 70%)`,
            }}/>
            <div style={{
              background:"linear-gradient(180deg,#08081c 0%,#040410 100%)",
              border:`2px solid ${accent}`,
              maxWidth:"320px", width:"92%",
              boxShadow:`0 0 50px ${accent}44, 0 0 90px ${accent}18, inset 0 0 18px ${accent}0a`,
              fontFamily:FONT, position:"relative", overflow:"hidden",
              animation:"itemFoundIn 0.25s cubic-bezier(0.22,1,0.36,1)",
            }}>
              {/* Top shimmer line */}
              <div style={{height:"2px", background:`linear-gradient(90deg,transparent,${accent}55,${accent}bb,${accent}55,transparent)`}}/>

              {/* Header */}
              <div style={{padding:"10px 14px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", flexWrap:"wrap"}}>
                <div style={{color:accent, fontSize:"10px", letterSpacing:"3px", fontWeight:"bold", textShadow:`0 0 10px ${accent}`}}>
                  {itemFoundModal.subtitle ? `✦ ${itemFoundModal.subtitle.toUpperCase()} ✦` : "✦ HAI TROVATO ✦"}
                </div>
                {rar && (
                  <div style={{background:`${accent}22`, border:`1px solid ${accent}66`, color:accent, fontSize:"10px", letterSpacing:"1.5px", padding:"2px 6px", fontWeight:"bold"}}>
                    {rar.label}
                  </div>
                )}
              </div>

              {/* Emoji ring */}
              <div style={{position:"relative", width:"96px", height:"96px", margin:"10px auto 4px", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <div style={{position:"absolute", inset:0, borderRadius:"50%", background:`radial-gradient(circle,${accent}44 0%,${accent}16 50%,transparent 70%)`, animation:"itemGlowRing 2.2s ease-in-out infinite"}}/>
                <div style={{position:"absolute", inset:"18%", borderRadius:"50%", border:`1px solid ${accent}44`, animation:"itemGlowRing 2.2s ease-in-out infinite 0.7s"}}/>
                <div style={{fontSize:"50px", position:"relative", zIndex:1, filter:`drop-shadow(0 0 14px ${accent})`, animation:isDanger?ANIM.pulseActive:"none"}}>
                  {itemFoundModal.tokenId
                    ? <Pedina id={itemFoundModal.tokenId} size={64} />
                    : <Asset id={itemFoundModal.assetId || assetIdByName(itemFoundModal.name)} emoji={em} size={64} />}
                </div>
              </div>

              {/* Name */}
              <div style={{color:"#fff", fontWeight:"bold", fontSize:"16px", padding:"0 18px 6px", textAlign:"center", textShadow:`0 0 12px ${accent}88`, letterSpacing:"0.4px"}}>
                {itemFoundModal.name}
              </div>

              {/* Divider */}
              <div style={{height:"1px", margin:"0 18px 10px", background:`linear-gradient(90deg,transparent,${accent}44,transparent)`}}/>

              {/* Desc */}
              <div style={{padding:"0 18px 14px", display:"flex", flexDirection:"column", gap:"2px"}}>
                {descLines.map((line, i) => {
                  if (!line.trim()) return <div key={i} style={{height:"4px"}}/>;
                  const isArt = /^[\s]*[│┌┐└┘╔╗╚╝║═╠╣░▒▓┼─]/.test(line);
                  const isStat = /^[+\-±]/.test(line.trim()) || /[€×x]\d/.test(line) || /VINCITA|BONUS|COMBO/.test(line);
                  if (isArt) return (
                    <div key={i} style={{color:`${accent}99`, fontSize:"10px", lineHeight:"1.3", fontFamily:"monospace", whiteSpace:"pre", overflow:"hidden", textOverflow:"ellipsis"}}>{line}</div>
                  );
                  return (
                    <div key={i} style={{color:isStat?C.bright:C.text, fontSize:isStat?"12px":"11px", lineHeight:"1.7", fontWeight:isStat?"bold":"normal"}}>
                      {line}
                    </div>
                  );
                })}
              </div>

              {/* Buttons */}
              <div style={{padding:"0 16px 18px", display:"flex", flexDirection:"column", gap:"8px"}}>
                {itemFoundModal.choices ? (
                  itemFoundModal.choices.map((ch, ci) => (
                    <Btn key={ci} variant={ci===0?"gold":"normal"} onClick={() => { ch.action?.(); setItemFoundModal(null); }}
                      style={{fontSize:"12px", padding:"10px 20px"}}>
                      {ch.label}
                    </Btn>
                  ))
                ) : (
                  <div onClick={() => setItemFoundModal(null)} style={{
                    padding:"11px 20px", background:`${accent}18`, border:`1px solid ${accent}88`,
                    color:accent, fontSize:"13px", fontWeight:"bold", letterSpacing:"1px",
                    cursor:"pointer", textAlign:"center", fontFamily:FONT,
                    boxShadow:`0 0 14px ${accent}2a, inset 0 0 8px ${accent}0d`,
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background=`${accent}2a`}
                  onMouseLeave={e=>e.currentTarget.style.background=`${accent}18`}>
                    {itemFoundModal.buttonLabel || "OK →"}
                  </div>
                )}
              </div>

              {/* Bottom shimmer */}
              <div style={{height:"1px", background:`linear-gradient(90deg,transparent,${accent}44,${accent}88,${accent}44,transparent)`}}/>
            </div>
          </div>
        );
      })()}

      {/* ═══ NAIL EQUIP MODAL — "Su quale unghia lo equipaggi?" ═══ */}
      {nailEquipModal && player && (() => {
        const TIER_ORDER = ["marcia","sanguinante","graffiata","sana","kawaii"];
        const TIER_COLORS = { marcia:C.red, sanguinante:C.orange, graffiata:C.gold, sana:C.green, kawaii:C.pink };
        // Sprint 2: stati speciali fuori catena — mappa pip all'equivalente più vicino
        const SPECIAL_TIER_MAP = { polliceVerde: "kawaii", unghiaNera: "marcia" };
        const activeNailColor = NAIL_INFO[player.nails[player.activeNail]?.state]?.color || C.magenta;
        return (
        <div style={{
          position:"fixed", inset:0,
          background:"rgba(0,0,0,0.88)", zIndex:99998,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <div style={{
            background:C.card, border:`2px solid ${activeNailColor}`,
            boxShadow:`0 0 40px ${activeNailColor}44`,
            padding:"24px 28px", textAlign:"center", maxWidth:"420px", width:"95%",
            fontFamily:FONT,
          }}>
            {nailEquipResult ? (
              <>
                <div style={{color:C.green, fontSize:"11px", letterSpacing:"3px", marginBottom:"6px"}}>✦ APPLICATO ✦</div>
                <div style={{fontSize:"42px", margin:"6px 0 8px"}}>{nailEquipResult.emoji}</div>
                <div style={{color:C.green, fontWeight:"bold", fontSize:"16px", marginBottom:"8px"}}>
                  {nailEquipResult.text}
                </div>
                <Btn onClick={() => { setNailEquipResult(null); setNailEquipModal(null); }} style={{marginTop:"12px", fontSize:"12px"}}>
                  OK →
                </Btn>
              </>
            ) : (
            <>
            <div style={{color:activeNailColor, fontSize:"11px", letterSpacing:"3px", marginBottom:"6px"}}>
              {nailEquipModal.fromZaino ? "✦ USA OGGETTO ✦" : "✦ HAI TROVATO ✦"}
            </div>
            <div style={{fontSize:"42px", margin:"6px 0 8px"}}><Asset id={assetIdByName(nailEquipModal.name)} emoji={nailEquipModal.emoji} size={52} /></div>
            <div style={{color:C.bright, fontWeight:"bold", fontSize:"16px", marginBottom:"4px"}}>
              {nailEquipModal.name}
            </div>
            <div style={{color:C.text, fontSize:"11px", lineHeight:"1.6", marginBottom:"16px"}}>
              {nailEquipModal.desc}
            </div>
            <div style={{color:C.gold, fontSize:"12px", letterSpacing:"1px", marginBottom:"12px", fontWeight:"bold"}}>
              📎 Su quale unghia lo usi?
            </div>
            {/* 5 nail buttons */}
            <div style={{display:"flex", gap:"6px", justifyContent:"center", flexWrap:"wrap", marginBottom:"14px"}}>
              {player.nails.map((n, i) => {
                const ni = NAIL_INFO[n.state];
                const isDead = n.state === "morta";
                const nailEmoji = isDead ? "💀"
                  : n.state==="piede" ? "🦶"
                  : n.state==="kawaii" ? "💖"
                  : n.state==="polliceVerde" ? "🌿"
                  : n.state==="unghiaNera" ? "🖤"
                  : "🖐";
                const pipStateModal = SPECIAL_TIER_MAP[n.state] || n.state;
                const aliveTiersModal = TIER_ORDER.indexOf(pipStateModal);
                const cbRef = nailEquipCallbackRef.current;
                const canSelect = !!cbRef?.nailFilter(n);
                return (
                  <div key={i}
                    onClick={!canSelect ? undefined : () => {
                      setNailEquipResult({ emoji: nailEquipModal.emoji, text: cbRef.resultText(i, n) });
                      cbRef.onNailSelect(i);
                      nailEquipCallbackRef.current = null;
                    }}
                    style={{
                      width:"68px", padding:"8px 4px",
                      border:`1px solid ${!canSelect ? "#333" : i === player.activeNail ? ni.color : ni.color+"55"}`,
                      background: !canSelect ? "#0a0a0a" : i === player.activeNail ? ni.color+"15" : "#0a0a14",
                      cursor: !canSelect ? "not-allowed" : "pointer",
                      opacity: !canSelect ? 0.4 : 1,
                      textAlign:"center",
                      transition:"border-color 0.2s, background 0.2s",
                    }}
                    onMouseEnter={e => { if (canSelect) { e.currentTarget.style.borderColor = C.magenta; e.currentTarget.style.background = C.magenta+"15"; }}}
                    onMouseLeave={e => { if (canSelect) { e.currentTarget.style.borderColor = i === player.activeNail ? ni.color : ni.color+"55"; e.currentTarget.style.background = i === player.activeNail ? ni.color+"15" : "#0a0a14"; }}}
                  >
                    <div style={{fontSize:"18px", marginBottom:"4px"}}>{nailEmoji}</div>
                    <div style={{color:ni.color, fontSize:"10px", fontWeight:"bold", marginBottom:"3px"}}>{ni.label}</div>
                    {/* HP pips */}
                    <div style={{display:"flex", gap:"2px", justifyContent:"center", flexWrap:"wrap"}}>
                      {TIER_ORDER.map((tier, ti) => {
                        const filled = ti <= aliveTiersModal && !isDead;
                        return <span key={ti} style={{display:"inline-block", width:"7px", height:"4px", background: filled ? TIER_COLORS[tier] : "#111", border:`1px solid ${filled ? TIER_COLORS[tier]+"aa" : "#2a2a2a"}`}}/>;
                      })}
                      {Array(n.cremaHP||0).fill(0).map((_,ci) => (
                        <span key={"c"+ci} style={{display:"inline-block", width:"7px", height:"4px", background:"#fff", border:"1px solid #aaa"}}/>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Metti in inventario instead (solo quando trovato, non da zaino) */}
            {!nailEquipModal.fromZaino && (
              <Btn variant="normal" onClick={() => {
                if (player.items.length >= MAX_ITEMS) {
                  addLog(`🎒 Zaino pieno: ${nailEquipModal.emoji} ${nailEquipModal.name} resta per terra.`, C.red);
                } else {
                  updatePlayer(p => ({...p, items: [...p.items, nailEquipModal.itemId]}));
                  addLog(`🎒 ${nailEquipModal.emoji} ${nailEquipModal.name} messo nello zaino`, C.dim);
                }
                nailEquipCallbackRef.current = null;
                setNailEquipModal(null);
              }} style={{fontSize:"10px", padding:"6px 16px", color:C.dim}}>
                🎒 Metti nello zaino →
              </Btn>
            )}
            {nailEquipModal.fromZaino && (
              <Btn variant="normal" onClick={() => { nailEquipCallbackRef.current = null; setNailEquipModal(null); }} style={{fontSize:"10px", padding:"6px 16px", color:C.dim}}>
                ✖ Annulla
              </Btn>
            )}
            </>
            )}
          </div>
        </div>
        );
      })()}

      {/* ═══ STAMP OVERLAY (Timbro WIN) ═══ */}
      {stampOverlay && (
        <div style={{
          position:"fixed", inset:0,
          zIndex:999999, pointerEvents:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <div style={{
            color: stampOverlay.color || C.gold, fontSize:"72px", fontWeight:"bold", fontFamily:FONT,
            textShadow:`0 0 40px ${stampOverlay.color || C.gold}, 0 0 80px ${stampOverlay.color || C.gold}88, 0 0 120px ${stampOverlay.color || C.gold}44`,
            letterSpacing:"12px",
            transform:"rotate(-12deg) scale(1.2)",
            animation:"stampIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            border:`4px solid ${stampOverlay.color || C.gold}`,
            padding:"20px 60px",
            background:"rgba(0,0,0,0.7)",
          }}>
            {stampOverlay.text || stampOverlay}
          </div>
        </div>
      )}

      {/* ═══ SMOKE CHOICE MODAL ═══ */}
      {smokeChoiceModal && (
        <div style={{
          position:"fixed", inset:0,
          background:"rgba(0,0,0,0.85)", zIndex:99999,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {(() => { const smokeCol = smokeChoiceModal.itemType === "sigarettaErba" ? C.green : "#aaaaaa"; return (
          <div style={{
            background:"#0d0d0d", border:`2px solid ${smokeCol}`,
            borderRadius:"0", padding:"28px 36px",
            textAlign:"center", maxWidth:"320px", width:"90%",
            fontFamily:FONT, boxShadow:`0 0 28px ${smokeCol}55, inset 0 0 22px ${smokeCol}14`,
          }}>
            <div style={{fontSize:"48px", marginBottom:"8px"}}>
              {smokeChoiceModal.itemType === "sigarettaErba" ? "🌿" : "🚬"}
            </div>
            <div style={{color:C.bright, fontWeight:"bold", fontSize:"16px", marginBottom:"6px"}}>
              {smokeChoiceModal.itemType === "sigarettaErba" ? "Sigaretta con Erba" : "Sigaretta"}
            </div>
            <div style={{color:C.dim, fontSize:"12px", marginBottom:"20px", lineHeight:"1.7"}}>
              {smokeChoiceModal.itemType === "sigarettaErba"
                ? "+2 Fortuna per 4 turni · cura l'unghia attiva\nLa fumi o la tieni?"
                : "+1 Fortuna per 4 turni · tra 3 grattate l'unghia attiva diventa 🖤 Unghia Nera\nLa fumi subito o la conservi?"}
            </div>
            {player && (player.smokesTotal || 0) >= 4 && !player.tumore && (
              <div style={{color:C.red, fontSize:"11px", marginBottom:"12px", padding:"6px", border:`1px solid ${C.red}`, borderRadius:"0"}}>
                ⚠ Hai già fumato molto... ancora una e rischi grosso!
              </div>
            )}
            <div style={{display:"flex", gap:"10px", justifyContent:"center"}}>
              <Btn variant="gold" onClick={() => handleSmoke(smokeChoiceModal.itemType)}
                style={{fontSize:"12px", padding:"10px 20px"}}>
                🔥 Fuma subito
              </Btn>
              <Btn variant="default" onClick={() => handleSaveSmoke(smokeChoiceModal.itemType)}
                disabled={!player || player.items.length >= MAX_ITEMS}
                style={{fontSize:"12px", padding:"10px 20px"}}>
                {player && player.items.length >= MAX_ITEMS ? "🎒 Zaino pieno" : "🎒 Zaino →"}
              </Btn>
            </div>
          </div>
          ); })()}
        </div>
      )}

      {/* ═══ INVENTARIO SLIDE-IN — usabile in qualsiasi momento ═══ */}
      {showInventoryPanel && player && (
        <div
          onClick={() => setShowInventoryPanel(false)}
          style={{
            position:"fixed", inset:0,
            background:"rgba(0,0,0,0.7)", zIndex:99990, cursor:"pointer",
          }}
        />
      )}
      {showInventoryPanel && player && (
        <Backpack
          player={player} maxItems={MAX_ITEMS}
          onUseItem={(idx, itemId) => { handleUseItem(idx); if (itemId !== "cappelloSbirro") setShowInventoryPanel(false); }}
          onToggleTool={(idx, inHand) => { if (inHand) unequipGrattatore(); else equipGrattatore(idx); }}
          onClose={() => setShowInventoryPanel(false)}
        />
      )}

      {/* ═══ DEBUG GETTONI — catalogo grafico (solo sviluppo / ?debug) ═══ */}
      {tokenDebugEnabled && !tokenDebugOpen && !tokenPreview && (
        <button type="button" onClick={() => setTokenDebugOpen(true)} style={{
          position:"fixed", left:8, bottom:8, zIndex:99996, fontFamily:FONT, fontSize:"10px", letterSpacing:"1px",
          padding:"4px 8px", border:"none", cursor:"pointer", background:"#e07aff", color:"#1e0830", boxShadow:"2px 2px 0 #000",
        }}>DEBUG GETTONI</button>
      )}
      {tokenDebugOpen && (
        <TokenDebug reducedMotion={reducedMotion}
          onClose={() => setTokenDebugOpen(false)}
          onPreview={(id) => { setTokenPreview(id); setTokenDebugOpen(false); }}
          canGive={!!player?.tokens && screen !== "title"}
          onGive={(id) => grantToken(id, { source: "Debug" })} />
      )}
      {tokenPreview && (
        <TokenPreviewBar id={tokenPreview} onStop={() => setTokenPreview(null)}
          onCatalog={() => { setTokenPreview(null); setTokenDebugOpen(true); }} />
      )}

      {/* ═══ COMPENSAZIONE DEL BOSS — scegli un gettone tra due (G-01) ═══ */}
      {tokenChoice && !pendingToken && (
        <TokenChoiceModal ids={tokenChoice}
          onPick={(id) => { setTokenChoice(null); grantToken(id, { source: "Lasciato dal boss" }); }} />
      )}

      {/* ═══ CUSTODIA GETTONI PIENA — scelta obbligatoria (G-01) ═══ */}
      {pendingToken && player?.tokens && (
        <TokenPouchModal tokens={player.tokens} newId={pendingToken.id}
          canEquip={canSwapToken(player.tokens)} onResolve={resolvePendingToken} />
      )}

      {/* ═══ SMOKE EFFECT OVERLAY ═══ */}
      {showSmokeEffect && (
        <div style={{
          position:"fixed", inset:0,
          background:"rgba(20,40,20,0.45)", zIndex:99997, pointerEvents:"none",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          animation:"fadeOut 2.5s forwards",
        }}>
          <div style={{fontSize:"60px", opacity:0.7, marginBottom:"12px"}}>💨</div>
          <div style={{color:C.green, fontFamily:FONT, fontSize:"18px", fontWeight:"bold",
            letterSpacing:"2px"}}>
            {player?.tumore ? "💀 TUMORE!" : `+FORTUNA`}
          </div>
        </div>
      )}

      {/* ═══ SOGNO MODAL ═══ */}
      {dreamModal && (
        <div style={{
          position:"fixed", inset:0,
          background:"rgba(0,0,0,0.93)", zIndex:99999,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:FONT,
        }}>
          <div style={{
            background:"#050510", border:`2px solid #3a2a6a`,
            borderRadius:"0", padding:"36px 44px",
            textAlign:"center", maxWidth:"360px", width:"90%",
            boxShadow:"0 0 40px #5a3a9877, inset 0 0 40px #3a2a6a22",
          }}>
            <div style={{color:"#7a5ab8", fontSize:"11px", letterSpacing:"4px", marginBottom:"10px"}}>
              ✦ SOGNO... ✦
            </div>
            <div style={{fontSize:"56px", margin:"8px 0 16px", filter:"drop-shadow(0 0 18px #5a3a9888)"}}>
              {dreamModal.emoji}
            </div>
            <div style={{
              color:"#c8b8e8", fontSize:"13px", lineHeight:"2.0",
              marginBottom:"24px", fontStyle:"italic", whiteSpace:"pre-line",
            }}>
              {dreamModal.text}
            </div>
            {dreamModal.effect && (
              <div style={{
                color: dreamModal.effectColor || C.gold,
                fontSize:"11px", marginBottom:"16px",
                background:"#0a0820", borderRadius:"0",
                padding:"6px 12px", letterSpacing:"1px",
              }}>
                {dreamModal.effect}
              </div>
            )}
            <Btn variant="success" onClick={() => {
              if (dreamModal.onConfirm) dreamModal.onConfirm();
              setDreamModal(null);
              setScreen("map");
            }} style={{fontSize:"13px", padding:"9px 28px", borderColor:"#5a3a98", background:"#0d0828", color:"#c8b8e8"}}>
              Mi sveglio...
            </Btn>
          </div>
        </div>
      )}


      {/* ═══ MODAL RELIQUIE ═══ */}
      {showReliquie && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.94)", zIndex:99000,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:FONT, padding:"16px",
        }} onClick={() => setShowReliquie(false)}>
          <div style={{
            background:"#08080f", border:"2px solid #c060ff",
            maxWidth:"640px", width:"96vw", maxHeight:"92vh", overflowY:"auto",
            padding:"18px 20px 16px",
            boxShadow:"0 0 40px #c060ff44, inset 0 0 40px #c060ff11",
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{color:"#c060ff", fontSize:"18px", fontWeight:"bold", letterSpacing:"4px", textAlign:"center", marginBottom:"2px", textShadow:"0 0 12px #c060ff88"}}>
              🏺 RELIQUIE
            </div>
            <div style={{color:C.dim, fontSize:"10px", textAlign:"center", letterSpacing:"1px", marginBottom:"4px"}}>
              Oggetti mistici da equipaggiare per la prossima run
            </div>
            {/* Progress bar */}
            <div style={{margin:"8px auto 18px", maxWidth:"360px"}}>
              <div style={{display:"flex", justifyContent:"space-between", fontSize:"10px", color:"#c060ff", marginBottom:"3px", letterSpacing:"1px"}}>
                <span>SCOPERTE · {enabledRelics.length} ATTIVE</span>
                <span>{discoveredRelics.length} / {Object.keys(RELIC_DEFS).length}</span>
              </div>
              <div style={{height:"6px", background:"#1a1a22", border:"1px solid #2a2a3a", position:"relative"}}>
                <div style={{
                  height:"100%", width:`${(discoveredRelics.length/Object.keys(RELIC_DEFS).length)*100}%`,
                  background:"linear-gradient(90deg, #c060ff, #ff9900)",
                  boxShadow:"0 0 8px #c060ffaa",
                  transition:"width 0.4s",
                }} />
              </div>
            </div>
            {/* Grid cards — stile Vintage con toggle ATTIVA */}
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))",
              gap:"12px", marginBottom:"16px",
            }}>
              {Object.entries(RELIC_DEFS).map(([id, def]) => {
                const known = discoveredRelics.includes(id);
                const active = enabledRelics.includes(id);
                const isEpic = def.rarity === "epica";
                const accent = isEpic ? "#ff9900" : "#c060ff";
                return (
                  <div key={id} style={{
                    background: known ? "#0d0d14" : "#0a0a10",
                    border: `2px solid ${known ? (active ? accent : accent+"55") : "#252538"}`,
                    padding:"0", position:"relative",
                    overflow:"hidden",
                    boxShadow: known && active ? `0 0 14px ${accent}66` : "none",
                    opacity: known ? 1 : 0.72,
                    display:"flex", flexDirection:"column",
                  }}>
                    {/* Preview tile */}
                    <div style={{
                      height:"92px", position:"relative",
                      background: known ? (isEpic ? "#1f1408" : "#140a1f") : "#060608",
                      borderBottom: `1px solid ${known ? accent+"66" : "#1a1a28"}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      filter: known ? "none" : "grayscale(100%) brightness(0.4)",
                      overflow:"hidden",
                    }}>
                      {/* Shimmer foil per scoperti */}
                      {known && (
                        <div style={{
                          position:"absolute", inset:0, pointerEvents:"none",
                          background:`linear-gradient(110deg, transparent 30%, ${accent}55 48%, ${accent}aa 50%, ${accent}55 52%, transparent 70%)`,
                          backgroundSize:"200% 100%",
                          animation:`variantShimmer ${active ? "2.2s" : "3.2s"} linear infinite`,
                          mixBlendMode:"screen",
                        }} />
                      )}
                      {/* Emoji centrale */}
                      <div style={{
                        fontSize:"40px", position:"relative", zIndex:2,
                        textShadow: known ? `0 0 14px ${accent}cc` : "none",
                        filter: known ? "none" : "blur(1px)",
                      }}>
                        {known ? def.emoji : "🔮"}
                      </div>
                      {/* Sparkle per epiche */}
                      {known && isEpic && (
                        <div style={{
                          position:"absolute", top:8, right:10, fontSize:"14px",
                          color: accent, zIndex:3,
                          animation:"variantSparkle 1.6s ease-in-out infinite",
                          textShadow:`0 0 8px ${accent}`,
                        }}>✦</div>
                      )}
                      {/* Rarity badge angolo */}
                      {known && (
                        <div style={{
                          position:"absolute", top:6, left:6, zIndex:3,
                          fontSize:"10px", letterSpacing:"1px", fontWeight:"bold",
                          color: accent,
                          background: isEpic ? "#1f1408" : "#140a1f",
                          border:`1px solid ${accent}88`,
                          padding:"1px 4px",
                        }}>{def.rarity.toUpperCase()}</div>
                      )}
                    </div>
                    {/* Badge label */}
                    <div style={{
                      background: known ? accent : "#1a1a28",
                      color: known ? "#000" : "#3a3a52",
                      padding:"4px 6px", fontSize:"11px", fontWeight:"bold",
                      letterSpacing:"2px", textAlign:"center",
                      textShadow: known ? "0 0 4px #fff8" : "none",
                    }}>
                      ★ {known ? def.name.toUpperCase() : "???"} ★
                    </div>
                    {/* Body: desc + toggle */}
                    <div style={{padding:"8px 8px 10px", flex:1, display:"flex", flexDirection:"column", gap:"6px"}}>
                      <div style={{
                        color: known ? C.text : "#2a2a4a",
                        fontSize:"10px", lineHeight:"1.35", minHeight:"42px",
                      }}>
                        {known ? def.desc : "Scoprila durante una run per sbloccarne i poteri."}
                      </div>
                      {known ? (
                        <Btn onClick={() => {
                          setEnabledRelics(prev => {
                            const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
                            setStored(STORAGE_KEYS.relicsEnabled, next);
                            return next;
                          });
                        }} style={{
                          width:"100%",
                          background: active ? accent : "transparent",
                          border:`1px solid ${active ? accent : accent+"55"}`,
                          color: active ? "#000" : accent,
                          fontSize:"10px", padding:"5px 8px",
                          fontFamily:FONT, fontWeight:"bold", letterSpacing:"1.5px",
                          textShadow: active ? "0 0 4px #fff8" : "none",
                          boxShadow: active ? `0 0 8px ${accent}66` : "none",
                          // transition estesa oltre box/text-shadow di Btn: qui cambia
                          // anche background/border/color al toggle, non solo il glow.
                          transition:"all 0.15s",
                        }}>
                          {active ? "✓ ATTIVA" : "▸ ATTIVA"}
                        </Btn>
                      ) : (
                        <div style={{
                          borderTop:`1px solid #1a1a28`, paddingTop:"5px",
                          fontSize:"10px", color:"#3a3a52", textAlign:"center",
                          letterSpacing:"1px",
                        }}>— LOCKED —</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {enabledRelics.length > 0 && (
              <div style={{color:"#c060ff", fontSize:"10px", textAlign:"center", marginBottom:"10px", letterSpacing:"1px"}}>
                ✦ Le {enabledRelics.length} reliquie attive saranno presenti dall'inizio della prossima run ✦
              </div>
            )}
            <div style={{textAlign:"center"}}>
              <Btn onClick={() => setShowReliquie(false)} style={{borderColor:"#c060ff", color:"#c060ff", fontSize:"11px"}}>
                Chiudi
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ═══ COLLEZIONE PEDINE (G-01) — sostituisce i Vintage nella home ═══ */}
      {showPedine && <TokenCollection discovered={discoveredTokens} onClose={() => setShowPedine(false)} />}
      {showResetProgress && (
        <ResetProgress onReset={resetMeta} onClose={() => setShowResetProgress(false)} counts={{
          trophies: `${Object.keys(achievements).length} sbloccati`,
          relics: `${discoveredRelics.length} scoperte`,
          tokens: `${discoveredTokens.length} scoperte`,
          stats: `${getStored(STORAGE_KEYS.alltime, {}).totalRuns || 0} run`,
        }} />
      )}

      {/* ═══ ACHIEVEMENT TOAST ═══ */}
      {achievementToast && (
        <div style={{
          position:"fixed", bottom:"80px", right:"16px", zIndex:99999,
          background:"#0d0d1a", border:`2px solid ${C.gold}`,
          borderRadius:"0", padding:"10px 14px", maxWidth:"220px",
          animation:"achievementSlide 0.4s ease-out",
          boxShadow:`0 0 24px ${C.gold}88, 0 6px 16px #000c, inset 0 0 18px ${C.gold}18`,
          fontFamily: FONT,
        }}>
          <div style={{color:C.gold, fontSize:"11px", fontWeight:"bold", marginBottom:"2px"}}>🏆 ACHIEVEMENT SBLOCCATO!</div>
          <div style={{fontSize:"20px"}}>{achievementToast.emoji}</div>
          <div style={{color:C.text, fontSize:"12px", fontWeight:"bold"}}>{achievementToast.name}</div>
          <div style={{color:C.dim, fontSize:"10px"}}>{achievementToast.desc}</div>
        </div>
      )}

      {/* ═══ TROPHIES OVERLAY ═══ */}
      {showTrophies && (
        <div style={{
          position:"fixed", inset:0,
          background:"rgba(0,0,0,0.92)", zIndex:99990,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily: FONT, padding:"16px",
        }} onClick={() => setShowTrophies(false)}>
          <div style={{
            background:"#08080f", border:`2px solid ${C.gold}`,
            maxWidth:"640px", width:"96vw", maxHeight:"92vh", overflowY:"auto",
            padding:"18px 20px 16px",
            boxShadow:`0 0 40px ${C.gold}44, inset 0 0 40px ${C.gold}11`,
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{color:C.gold, fontSize:"18px", fontWeight:"bold", letterSpacing:"4px", textAlign:"center", marginBottom:"2px", textShadow:`0 0 12px ${C.gold}88`}}>
              🏆 TROFEI
            </div>
            <div style={{color:C.dim, fontSize:"10px", textAlign:"center", letterSpacing:"1px", marginBottom:"4px"}}>
              Achievements sbloccati durante le tue run
            </div>
            {/* Progress bar */}
            <div style={{margin:"8px auto 18px", maxWidth:"360px"}}>
              <div style={{display:"flex", justifyContent:"space-between", fontSize:"10px", color:C.gold, marginBottom:"3px", letterSpacing:"1px"}}>
                <span>COLLEZIONE</span>
                <span>{Object.keys(achievements).length} / {ACHIEVEMENTS.length}</span>
              </div>
              <div style={{height:"6px", background:"#1a1a22", border:"1px solid #2a2a3a", position:"relative"}}>
                <div style={{
                  height:"100%", width:`${(Object.keys(achievements).length/ACHIEVEMENTS.length)*100}%`,
                  background:`linear-gradient(90deg, ${C.gold}, ${C.green})`,
                  boxShadow:`0 0 8px ${C.gold}aa`,
                  transition:"width 0.4s",
                }} />
              </div>
            </div>
            {/* Grid cards — stile Vintage */}
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fit, minmax(170px, 1fr))",
              gap:"12px", marginBottom:"16px",
            }}>
              {ACHIEVEMENTS.map(ach => {
                const unlocked = achievements[ach.id];
                const isSecret = ach.secret;
                const hidden = isSecret && !unlocked;
                return (
                  <div key={ach.id} style={{
                    background: unlocked ? "#0d0d14" : "#0a0a10",
                    border: `2px solid ${unlocked ? C.gold : "#252538"}`,
                    padding:"0", position:"relative",
                    overflow:"hidden",
                    boxShadow: unlocked ? `0 0 12px ${C.gold}44` : "none",
                    opacity: unlocked ? 1 : 0.72,
                    display:"flex", flexDirection:"column",
                  }}>
                    {/* Preview tile */}
                    <div style={{
                      height:"92px", position:"relative",
                      background: unlocked ? "#1f1a08" : "#060608",
                      borderBottom: `1px solid ${unlocked ? C.gold+"66" : "#1a1a28"}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      filter: unlocked ? "none" : "grayscale(100%) brightness(0.5)",
                      overflow:"hidden",
                    }}>
                      {/* Shimmer foil per sbloccati */}
                      {unlocked && (
                        <div style={{
                          position:"absolute", inset:0, pointerEvents:"none",
                          background:`linear-gradient(110deg, transparent 30%, ${C.gold}55 48%, ${C.gold}aa 50%, ${C.gold}55 52%, transparent 70%)`,
                          backgroundSize:"200% 100%",
                          animation:"variantShimmer 2.8s linear infinite",
                          mixBlendMode:"screen",
                        }} />
                      )}
                      {/* Emoji centrale */}
                      <div style={{
                        fontSize:"40px", position:"relative", zIndex:2,
                        textShadow: unlocked ? `0 0 14px ${C.gold}cc` : "none",
                        filter: hidden ? "blur(1px)" : "none",
                      }}>
                        {hidden ? "🔒" : ach.emoji}
                      </div>
                      {/* Sparkle angolo per sbloccati */}
                      {unlocked && (
                        <div style={{
                          position:"absolute", top:8, right:10, fontSize:"14px",
                          color: C.gold, zIndex:3,
                          animation:"variantSparkle 1.6s ease-in-out infinite",
                          textShadow:`0 0 8px ${C.gold}`,
                        }}>✦</div>
                      )}
                      {/* Badge SECRET in alto a sx */}
                      {isSecret && (
                        <div style={{
                          position:"absolute", top:6, left:6, zIndex:3,
                          fontSize:"10px", letterSpacing:"1px", fontWeight:"bold",
                          color: unlocked ? C.magenta : "#4a3a5a",
                          background: unlocked ? "#1a0a1f" : "#0a0810",
                          border:`1px solid ${unlocked ? C.magenta+"88" : "#2a1a3a"}`,
                          padding:"1px 4px",
                        }}>SECRET</div>
                      )}
                    </div>
                    {/* Badge label */}
                    <div style={{
                      background: unlocked ? C.gold : "#1a1a28",
                      color: unlocked ? "#000" : "#3a3a52",
                      padding:"4px 6px", fontSize:"11px", fontWeight:"bold",
                      letterSpacing:"2px", textAlign:"center",
                      textShadow: unlocked ? "0 0 4px #fff8" : "none",
                    }}>
                      ★ {hidden ? "???" : ach.name.toUpperCase()} ★
                    </div>
                    {/* Body: desc + unlock date */}
                    <div style={{padding:"8px 8px 10px", flex:1, display:"flex", flexDirection:"column", gap:"6px"}}>
                      <div style={{
                        color: unlocked ? C.text : "#3a3a52",
                        fontSize:"10px", lineHeight:"1.35", minHeight:"28px",
                      }}>
                        {hidden ? "Un mistero da scoprire giocando..." : ach.desc}
                      </div>
                      <div style={{
                        display:"flex", justifyContent:"space-between",
                        fontSize:"10px", color:C.dim,
                        borderTop:`1px solid ${unlocked ? C.gold+"33" : "#1a1a28"}`,
                        paddingTop:"5px", letterSpacing:"0.5px",
                      }}>
                        <span>{isSecret ? "TIPO" : "TIPO"} <span style={{color: isSecret ? C.magenta : C.cyan, fontWeight:"bold"}}>
                          {isSecret ? "SECRET" : "NORMAL"}
                        </span></span>
                        <span style={{color: unlocked ? C.gold : C.dim, fontWeight:"bold"}}>
                          {unlocked ? `✓ ${new Date(unlocked.unlockedAt).toLocaleDateString("it-IT")}` : "— LOCKED"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{color:C.gold, fontSize:"10px", textAlign:"center", marginBottom:"10px", letterSpacing:"1px"}}>
              ✦ Completa tutti i trofei per diventare leggenda ✦
            </div>
            <div style={{textAlign:"center", display:"flex", gap:"10px", justifyContent:"center"}}>
              <Btn onClick={() => setShowTrophies(false)} style={{borderColor:C.gold, color:C.gold, fontSize:"11px"}}>Chiudi</Btn>
              <Btn onClick={() => {
                setStored(STORAGE_KEYS.achievements, {});
                setAchievements({});
              }} style={{fontSize:"11px", borderColor:C.red+"88", color:C.red, opacity:0.7}}>🗑 Azzera</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ALL-TIME STATS OVERLAY ═══ */}
      {showAllTimeStats && (() => {
        const alltime = getStored(STORAGE_KEYS.alltime, {});
        const totalRuns = alltime.totalRuns || 0;
        const totalWins = alltime.totalWins || 0;
        const winRate = totalRuns ? Math.round((totalWins / totalRuns) * 100) : 0;
        const money = alltime.totalMoneyEarned || 0;
        const cards = alltime.totalCardsScratched || 0;
        return (
          <div style={{
            position:"fixed", inset:0,
            background:"rgba(0,0,0,0.94)", zIndex:99990,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily: FONT, padding:"16px",
          }} onClick={() => setShowAllTimeStats(false)}>
            <div style={{
              background:"#08080f", border:`2px solid ${C.cyan}`,
              maxWidth:"560px", width:"96vw", maxHeight:"92vh", overflowY:"auto",
              padding:"18px 20px 16px",
              boxShadow:`0 0 40px ${C.cyan}44, inset 0 0 40px ${C.cyan}11`,
            }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{color:C.cyan, fontSize:"18px", fontWeight:"bold", letterSpacing:"4px", textAlign:"center", marginBottom:"2px", textShadow:`0 0 12px ${C.cyan}88`}}>
                📊 STATISTICHE ALL-TIME
              </div>
              <div style={{color:C.dim, fontSize:"10px", textAlign:"center", letterSpacing:"1px", marginBottom:"14px"}}>
                Tutto ciò che hai fatto dall'inizio dei tempi
              </div>

              {/* HERO: Win rate grande con barra */}
              <div style={{
                position:"relative", overflow:"hidden",
                background:"#0d0d14", border:`2px solid ${C.cyan}`,
                padding:"14px 16px", marginBottom:"14px",
                boxShadow:`0 0 16px ${C.cyan}33`,
              }}>
                {/* shimmer foil */}
                <div style={{
                  position:"absolute", inset:0, pointerEvents:"none",
                  background:`linear-gradient(110deg, transparent 30%, ${C.cyan}33 48%, ${C.cyan}77 50%, ${C.cyan}33 52%, transparent 70%)`,
                  backgroundSize:"220% 100%",
                  animation:"variantShimmer 3.6s linear infinite",
                  mixBlendMode:"screen",
                }} />
                <div style={{position:"relative", zIndex:2, display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px"}}>
                  <div>
                    <div style={{color:C.cyan, fontSize:"10px", letterSpacing:"2px", opacity:0.8}}>WIN RATE</div>
                    <div style={{color:C.gold, fontSize:"36px", fontWeight:"bold", letterSpacing:"2px", textShadow:`0 0 14px ${C.gold}aa`, lineHeight:1}}>
                      {winRate}%
                    </div>
                    <div style={{color:C.dim, fontSize:"10px", marginTop:"4px", letterSpacing:"1px"}}>
                      {totalWins} vittorie · {totalRuns} run
                    </div>
                  </div>
                  <div style={{fontSize:"56px", filter:`drop-shadow(0 0 12px ${C.gold}88)`, opacity: totalRuns ? 1 : 0.3}}>
                    {winRate >= 50 ? "🏆" : totalRuns ? "🎯" : "🕹️"}
                  </div>
                </div>
                {/* progress bar */}
                <div style={{marginTop:"10px", position:"relative", zIndex:2}}>
                  <div style={{height:"6px", background:"#1a1a22", border:"1px solid #2a2a3a", position:"relative"}}>
                    <div style={{
                      height:"100%", width:`${winRate}%`,
                      background:`linear-gradient(90deg, ${C.cyan}, ${C.gold})`,
                      boxShadow:`0 0 8px ${C.gold}aa`,
                      transition:"width 0.6s",
                    }} />
                  </div>
                </div>
              </div>

              {/* 4 stat cards in griglia */}
              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:"10px", marginBottom:"14px"}}>
                {[
                  {label:"RUN TOTALI", icon:"🎮", val: totalRuns, color: C.cyan},
                  {label:"VITTORIE", icon:"🏆", val: totalWins, color: C.gold},
                  {label:"GUADAGNI", icon:"💰", val: `€${money}`, color: C.green},
                  {label:"CARTE GRATTATE", icon:"🖐️", val: cards, color: C.magenta},
                ].map(s => (
                  <div key={s.label} style={{
                    background:"#0d0d14", border:`1px solid ${s.color}55`,
                    padding:"10px 12px",
                    display:"flex", flexDirection:"column", gap:"2px",
                    position:"relative", overflow:"hidden",
                  }}>
                    <div style={{display:"flex", alignItems:"center", gap:"6px"}}>
                      <span style={{fontSize:"16px", filter:`drop-shadow(0 0 4px ${s.color}88)`}}>{s.icon}</span>
                      <span style={{color:s.color, fontSize:"10px", letterSpacing:"1.5px", fontWeight:"bold", opacity:0.8}}>{s.label}</span>
                    </div>
                    <div style={{color:s.color, fontSize:"20px", fontWeight:"bold", letterSpacing:"1px", textShadow:`0 0 8px ${s.color}66`, lineHeight:1.1, marginTop:"2px"}}>
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* footer insight */}
              <div style={{
                color:C.cyan, fontSize:"10px", textAlign:"center",
                letterSpacing:"1px", marginBottom:"12px", opacity:0.9,
                borderTop:`1px solid ${C.cyan}33`, paddingTop:"10px",
              }}>
                {totalRuns === 0 ? "✦ Nessuna run completata ancora — inizia a grattare! ✦"
                  : totalRuns >= 100 ? `✦ Leggenda del grattino — ${totalRuns} run al tuo attivo ✦`
                  : totalRuns >= 10 ? `✦ Grattatore esperto — ${totalRuns} run completate ✦`
                  : `✦ Continua così — ${totalRuns} run e non fermarti ✦`}
              </div>

              <div style={{textAlign:"center"}}>
                <Btn onClick={() => setShowAllTimeStats(false)} style={{borderColor:C.cyan, color:C.cyan, fontSize:"11px"}}>Chiudi</Btn>
              </div>
            </div>
          </div>
        );
      })()}

      </div>{/* fine DESK */}

      {shellLog && <LogColumn log={log} />}

      </div>{/* fine 3-column */}

      {/* ── LOG STRIP (bottom) — ticker CSS dell'ultima voce ── */}
      {inRun && !wideShell && log.length > 0 && (() => {
        const latest = log[log.length - 1];
        const duration = Math.max(7, latest.text.length * 0.085);
        return (
          <div style={{
            width:"100%", flexShrink:0,
            borderTop:"1px solid #12121e",
            background:"#04040c",
            height:"30px",
            display:"flex", alignItems:"stretch",
            overflow:"hidden",
          }}>
            {/* Badge LOG */}
            <div style={{
              flexShrink:0,
              padding:"0 8px",
              display:"flex", alignItems:"center",
              color:C.dim, fontSize:"10px", letterSpacing:"1px", opacity:0.5,
              borderRight:"1px solid #12121e",
            }}>LOG</div>
            {/* Testo scorrevole */}
            <div style={{
              flex:1, position:"relative", overflow:"hidden",
              maskImage:"linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)",
              WebkitMaskImage:"linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)",
            }}>
              <div key={latest.id} style={{
                position:"absolute", top:0,
                whiteSpace:"nowrap", lineHeight:"30px",
                // Movimento ridotto: testo fermo. Con la sola regola CSS
                // l'animazione saltava alla fine e il testo restava fuori schermo.
                ...(reducedMotion
                  ? { left:"12px", right:"12px", overflow:"hidden", textOverflow:"ellipsis" }
                  : { left:"100%", animation:`newsTicker ${duration}s linear forwards`, willChange:"transform" }),
                color: latest.color || C.dim,
                fontSize:"10px",
                letterSpacing:"0.2px",
              }}>
                {latest.text}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
    </div>
  );
}

// HMR cleanup — evita che la musica si sovrapponga quando Vite ricarica il modulo
if (import.meta.hot) {
  import.meta.hot.dispose(() => { AudioEngine.stopMusic(); });
}
