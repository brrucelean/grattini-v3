import { C, FONT } from "../data/theme.js";
import { inset } from "../data/ticketLayout.js";

// ─── HEADER DEL BIGLIETTO ────────────────────────────────────
// Titolo + badge costo/max dentro al cartiglio dell'arte, posizionati con
// TICKET_LAYOUT. Usato SIA dal biglietto giocabile (ScratchCardView) SIA
// dall'anteprima (TicketThumb): stessa impaginazione in entrambi, così non
// possono divergere. Tutte le misure sono in unità container-query (cqw/cqh),
// quindi scalano da sole col riquadro, grande o piccolo che sia.
// `compact` = anteprima: niente badge COSTO/MAX (costo e premio max sono già
// scritti nel pannello informativo accanto) così il titolo si prende tutta la
// fascia. Su cartigli bassi come quello di Doppio o Nulla — alto il 7,5% del
// biglietto — a dimensione ridotta titolo e badge finivano uno sopra l'altro.
// Corpo del titolo: il più grande tra "tutto su una riga" e "su due righe
// bilanciate", senza mai spezzare una parola. Tiny5 ≈ 0,78 em per carattere.
function titleSize(name, compact, headerRow) {
  if (headerRow) return "clamp(7px, min(6.5cqw, 62cqh), 30px)";
  const words = name.toUpperCase().split(/\s+/);
  const longest = Math.max(...words.map(w => w.length));
  const W = compact ? 118 : 100, H = compact ? 70 : 46;
  const one = `min(${(W / (name.length * 0.78)).toFixed(1)}cqw, ${H}cqh)`;
  const perLine2 = Math.max(longest, Math.ceil(name.length / 2));
  const two = `min(${(W / (perLine2 * 0.78)).toFixed(1)}cqw, ${(H / 2.1).toFixed(1)}cqh)`;
  return `clamp(7px, max(${one}, ${two}), 34px)`;
}

export function TicketHeader({ card, accent, layout, compact = false }) {
  const headerRow = layout.header.dir === "row";
  const printHeader = layout.header.print === true;

  // Alone cromatico "da sala giochi": neon accento + sfrangiatura ciano/magenta.
  const haloTitle = [
    `0 0 6px ${accent}`, `0 0 14px ${accent}cc`, `0 0 26px ${accent}66`,
    `-1.5px 0 6px ${C.cyan}88`, `1.5px 0 6px ${C.magenta}88`,
    "0 2px 3px #000", "-1px -1px 0 #000", "1px 1px 0 #000",
  ].join(", ");

  const neonPill = (bg, label) => (
    <span style={{
      fontSize: "clamp(5px, min(3.4cqw, 30cqh), 13px)",
      color: "#000", fontWeight: "bold", fontFamily: FONT,
      background: bg, padding: "0.15em 0.6em", letterSpacing: "1px",
      whiteSpace: "nowrap", lineHeight: 1.5,
      border: `1px solid ${bg}`,
      boxShadow: printHeader ? "none" : `0 0 8px ${bg}cc, 0 0 18px ${bg}55, 0 1px 2px #000`,
    }}>{label}</span>
  );

  return (
    <div style={{
      position: "absolute", inset: inset(layout.header), zIndex: 3,
      containerType: "size",
      display: "flex", pointerEvents: "none",
      flexDirection: headerRow ? "row" : "column",
      alignItems: "center",
      justifyContent: headerRow ? "space-between" : "center",
      gap: headerRow ? "2%" : "0.35em",
    }}>
      {/* Titolo — come un vero gratta e vinci, dentro al cartiglio dell'arte */}
      <div style={{
        color: printHeader ? "#123f42" : "#fff", fontWeight: "bold",
        // Titoli lunghi ("La Mappa del Tesoro", "Turista per Sempre") vanno a
        // capo su due righe bilanciate invece di uscire dal cartiglio o finire
        // con i puntini. Corpo scelto sulla parola più lunga: mai tagliata.
        fontSize: titleSize(card.name, compact, headerRow),
        letterSpacing: printHeader ? "1px" : "1.5px", lineHeight: 1.05,
        WebkitTextStroke: printHeader ? "0" : `0.6px ${accent}`,
        textShadow: printHeader ? "none" : haloTitle,
        animation: printHeader ? "none" : "ticketNeon 3.2s ease-in-out infinite",
        fontFamily: FONT, textAlign: "center",
        maxWidth: "100%", whiteSpace: "normal", textWrap: "balance", overflowWrap: "normal",
        textTransform: "uppercase",
      }}>
        {card.name}
      </div>
      {/* Badge costo / max — pill neon, mai sopra il titolo */}
      {!compact && (
        <div style={{
          display: "flex", gap: "0.5em", flexWrap: "nowrap",
          justifyContent: "center", alignItems: "center",
        }}>
          {neonPill(C.gold, `COSTO €${card.cost}`)}
          {neonPill(C.green, `MAX €${card.maxPrize}`)}
        </div>
      )}
    </div>
  );
}

// Respiro neon dell'insegna. Serve a chi monta TicketHeader fuori da
// ScratchCardView (che definisce già la stessa @keyframes al suo interno).
export const TICKET_NEON_KEYFRAMES = `
  @keyframes ticketNeon {
    0%, 100% { filter: brightness(1); }
    45%      { filter: brightness(1.16); }
    52%      { filter: brightness(0.97); }
  }
`;
