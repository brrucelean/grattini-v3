import { memo } from "react";
import { NewsTicker } from "../NewsTicker.jsx";
import { SH, edge } from "./shellTokens.js";

// ─── TICKER ROW — striscia notizie a tutta larghezza (24 px) ─────
// Contenuto e rotazione invariati (NewsTicker); cambia solo la sede.
function TickerRowImpl({ currentBiome }) {
  return (
    <div role="marquee" aria-label="Notizie del quartiere" style={{
      height:`${SH.tickerH}px`, flexShrink:0, boxSizing:"border-box", width:"100%", alignSelf:"stretch",
      display:"flex", alignItems:"center", padding:`0 ${SH.gap}px`,
      background:"#000", borderBottom: edge(SH.line), fontFamily: SH.font,
      overflow:"hidden",
    }}>
      <NewsTicker currentBiome={currentBiome} flat />
    </div>
  );
}

export const TickerRow = memo(TickerRowImpl);
