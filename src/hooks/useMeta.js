import { useState, useCallback } from "react";
import { ACHIEVEMENTS } from "../data/achievements.js";
import { AudioEngine } from "../audio.js";
import { STORAGE_KEYS, getStored, setStored, removeStored } from "../utils/storage.js";

export function useMeta() {
  // Solo trofei che esistono ancora: il "Collezionista Vintage" è stato tolto
  // insieme alla meccanica dei vintage, e falserebbe il conteggio (18/17).
  const [achievements, setAchievements] = useState(() => {
    const stored = getStored(STORAGE_KEYS.achievements, {});
    const known = new Set(ACHIEVEMENTS.map(a => a.id));
    const clean = Object.fromEntries(Object.entries(stored).filter(([id]) => known.has(id)));
    if (Object.keys(clean).length !== Object.keys(stored).length) setStored(STORAGE_KEYS.achievements, clean);
    removeStored(STORAGE_KEYS.vintageLegacy); // vecchia collezione vintage
    return clean;
  });
  const [activeCedola, setActiveCedola] = useState(() => getStored(STORAGE_KEYS.cedola, null));
  const [pendingCedoleOffer, setPendingCedoleOffer] = useState(null);
  const [achievementToast, setAchievementToast] = useState(null);
  const [showTrophies, setShowTrophies] = useState(false);
  const [showReliquie, setShowReliquie] = useState(false);
  const [discoveredRelics, setDiscoveredRelics] = useState(() => getStored(STORAGE_KEYS.relicsDiscovered, []));
  const [enabledRelics, setEnabledRelics] = useState(() => getStored(STORAGE_KEYS.relicsEnabled, []));
  const [showAllTimeStats, setShowAllTimeStats] = useState(false);
  // G-01: catalogo dei gettoni visti almeno una volta (solo vetrina, nessun effetto)
  const [discoveredTokens, setDiscoveredTokens] = useState(() => getStored(STORAGE_KEYS.tokensDiscovered, []));

  const discoverToken = useCallback((tokenId) => {
    setDiscoveredTokens(prev => {
      if (prev.includes(tokenId)) return prev;
      const next = [...prev, tokenId];
      setStored(STORAGE_KEYS.tokensDiscovered, next);
      return next;
    });
  }, []);

  const discoverRelic = useCallback((relicId) => {
    setDiscoveredRelics(prev => {
      if (prev.includes(relicId)) return prev;
      const next = [...prev, relicId];
      setStored(STORAGE_KEYS.relicsDiscovered, next);
      return next;
    });
  }, []);

  const unlockAchievement = useCallback((id) => {
    setAchievements(prev => {
      if (prev[id]) return prev; // already unlocked
      const updated = { ...prev, [id]: { unlockedAt: Date.now() } };
      setStored(STORAGE_KEYS.achievements, updated);
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) {
        AudioEngine.achievementJingle();
        setAchievementToast(ach);
        setTimeout(() => setAchievementToast(null), 3000);
      }
      return updated;
    });
  }, []);

  const updateAllTimeStats = useCallback((runStats) => {
    const existing = getStored(STORAGE_KEYS.alltime, {});
    const updated = {
      totalRuns: (existing.totalRuns || 0) + 1,
      totalWins: (existing.totalWins || 0) + (runStats._isWin ? 1 : 0),
      totalMoneyEarned: (existing.totalMoneyEarned || 0) + (runStats.moneyEarned || 0),
      totalCardsScratched: (existing.totalCardsScratched || 0) + (runStats.cardsScratched || 0),
    };
    setStored(STORAGE_KEYS.alltime, updated);
  }, []);

  // Impostazioni → azzera progressi. parts: { trophies, relics, tokens, stats }.
  // Solo dati locali della metaprogressione; la run in corso non si tocca.
  const resetMeta = useCallback((parts) => {
    if (parts.trophies) {
      setAchievements({}); removeStored(STORAGE_KEYS.achievements);
      removeStored(STORAGE_KEYS.totalScratches); // contatore dei trofei "gratta N volte"
    }
    if (parts.relics) {
      setDiscoveredRelics([]); removeStored(STORAGE_KEYS.relicsDiscovered);
      setEnabledRelics([]); removeStored(STORAGE_KEYS.relicsEnabled);
    }
    if (parts.tokens) { setDiscoveredTokens([]); removeStored(STORAGE_KEYS.tokensDiscovered); }
    if (parts.stats) removeStored(STORAGE_KEYS.alltime);
  }, []);

  return {
    resetMeta,
    achievements, setAchievements,
    activeCedola, setActiveCedola,
    pendingCedoleOffer, setPendingCedoleOffer,
    achievementToast, setAchievementToast,
    showTrophies, setShowTrophies,
    showReliquie, setShowReliquie,
    discoveredRelics, setDiscoveredRelics, discoverRelic,
    enabledRelics, setEnabledRelics,
    showAllTimeStats, setShowAllTimeStats,
    unlockAchievement,
    updateAllTimeStats,
    discoveredTokens, discoverToken,
  };
}
