import { memo } from "react";
import { Asset } from "../Asset.jsx";
import { GOLD } from "./mapTheme.js";

// ─── PEDINA — il gettone del giocatore sulla mappa ───────────────
// Oggi c'è solo la pedina base (gettone d'ottone). Le pedine collezionabili
// sono una meccanica da progettare: docs/FEATURE-BACKLOG.md, G-01.
// Quando esisteranno basterà passare il loro id: lo sprite `pedina-<id>` si
// accende da solo tramite Asset, il gettone disegnato resta come riserva.
export const PEDINE = {
  ottone: { name: "Gettone d'ottone", face: "G", c: GOLD },
};

function PedinaImpl({ id = "ottone", size = 28 }) {
  const p = PEDINE[id] || PEDINE.ottone;
  const u = Math.max(2, Math.round(size / 14)); // "pixel" del gettone
  return (
    <span role="img" aria-label={`Pedina: ${p.name}`} style={{
      width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>
      <Asset id={`pedina-${id}`} size={size} emoji={
        // Gettone ottagonale a gradini: bordo scuro, anello chiaro, faccia piena.
        <span style={{
          width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center",
          background: p.c.mid, color: p.c.dark,
          clipPath: `polygon(${u * 2}px 0, calc(100% - ${u * 2}px) 0, 100% ${u * 2}px, 100% calc(100% - ${u * 2}px), calc(100% - ${u * 2}px) 100%, ${u * 2}px 100%, 0 calc(100% - ${u * 2}px), 0 ${u * 2}px)`,
          boxShadow: `inset 0 0 0 ${u}px ${p.c.dark}, inset ${u * 2}px ${u * 2}px 0 0 ${p.c.hi}, inset -${u * 2}px -${u * 2}px 0 0 ${p.c.lo}`,
          fontSize: Math.round(size * 0.5), fontWeight: "bold", lineHeight: 1,
        }}>{p.face}</span>
      } />
    </span>
  );
}

export const Pedina = memo(PedinaImpl);
