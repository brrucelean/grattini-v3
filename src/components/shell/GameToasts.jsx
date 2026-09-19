import { FONT } from "../../data/theme.js";
import { GOLD, bevel } from "../map/mapTheme.js";

// ─── AVVISI CHE SPARISCONO DA SOLI ───────────────────────────────
// Per le notizie da leggere al volo (un grattatore finito, un effetto
// esaurito): compaiono in alto al centro, uno sotto l'altro, e se ne vanno da
// soli dopo qualche secondo. Niente OK da premere. Stato in scratchlite
// (showToast); la riga nello scontrino resta comunque.

export function GameToasts({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div aria-live="polite" style={{
      position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", zIndex: 99994,
      display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none", fontFamily: FONT,
    }}>
      <style>{`@keyframes toastIn { 0% { transform: translateY(-10px); opacity: 0; } 100% { transform: none; opacity: 1; } }
        @keyframes toastOut { 0%, 82% { opacity: 1; } 100% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .game-toast { animation: none !important; } }`}</style>
      {toasts.map(t => (
        <div key={t.id} className="game-toast" role="status" style={{
          display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 10, alignItems: "center",
          minWidth: 260, maxWidth: 420, padding: "8px 12px", background: "#16130f", color: "#f2e6c8",
          boxShadow: `${bevel(GOLD, 1)}, 4px 4px 0 #000`,
          animation: `toastIn .18s steps(3), toastOut ${t.ms}ms steps(8) forwards`,
        }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>{t.emoji}</span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            {t.title && <span style={{ fontSize: 10, letterSpacing: 2, color: GOLD.mid }}>{t.title}</span>}
            <span style={{ fontSize: 12, lineHeight: 1.35 }}>{t.text}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
