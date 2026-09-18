import { memo } from "react";
import { FONT } from "../data/theme.js";

// ─── PLAYING CARD FACE — faccia di una carta da gioco vera ───────
// Sette e Mezzo: al posto di "4♥" scritto al centro, la carta com'è davvero:
// indice (valore + seme) negli angoli, semi disposti come sulle carte
// francesi per A–7, figura incorniciata per J/Q/K. Solo presentazione:
// valore, seme e punteggio arrivano immutati dalla cella.
//
// Si ridimensiona sul contenitore (container query), così funziona sia nella
// cella grattabile sia nelle carte piccole del Banco.

const RED = "#c8161d";
const BLACK = "#15161a";

// Posizioni dei semi in % dell'area centrale (x, y). flip = seme capovolto
// nella metà bassa, come sulle carte stampate.
const PIPS = {
  A: [[50, 50, "big"]],
  "2": [[50, 12], [50, 88]],
  "3": [[50, 12], [50, 50], [50, 88]],
  "4": [[25, 12], [75, 12], [25, 88], [75, 88]],
  "5": [[25, 12], [75, 12], [50, 50], [25, 88], [75, 88]],
  "6": [[25, 12], [75, 12], [25, 50], [75, 50], [25, 88], [75, 88]],
  "7": [[25, 12], [75, 12], [50, 31], [25, 50], [75, 50], [25, 88], [75, 88]],
};

const FACE_NAME = { J: "FANTE", Q: "DONNA", K: "RE" };
const FACE_MARK = { J: "⚔", Q: "✿", K: "♛" };

function Corner({ rank, suit, color, flip }) {
  return (
    <span aria-hidden style={{
      position: "absolute",
      ...(flip ? { right: "5cqmin", bottom: "5cqmin", transform: "rotate(180deg)" } : { left: "5cqmin", top: "5cqmin" }),
      display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 0.95,
      color, fontFamily: FONT, fontWeight: "bold",
    }}>
      <span style={{ fontSize: "16cqmin" }}>{rank}</span>
      <span style={{ fontSize: "13cqmin" }}>{suit}</span>
    </span>
  );
}

function PlayingCardFaceImpl({ rank, suit, isRed, compact = false }) {
  const color = isRed ? RED : BLACK;
  const pips = PIPS[rank];
  const isFace = !pips;

  return (
    <div role="img" aria-label={`${FACE_NAME[rank] || rank} di ${suitName(suit)}`} style={{
      position: "absolute", inset: 0, containerType: "size",
      background: "#fbf8ef",
      boxShadow: `inset 0 0 0 2px #fbf8ef, inset 0 0 0 3px ${color}33`,
    }}>
      <Corner rank={rank} suit={suit} color={color} />
      {!compact && <Corner rank={rank} suit={suit} color={color} flip />}

      {/* Area centrale: tra gli indici */}
      <div style={{ position: "absolute", left: "24%", right: "24%", top: "16%", bottom: "16%" }}>
        {pips && pips.map(([x, y, big], i) => (
          <span key={i} aria-hidden style={{
            position: "absolute", left: `${x}%`, top: `${y}%`,
            transform: `translate(-50%,-50%)${y > 50 ? " rotate(180deg)" : ""}`,
            fontSize: big ? "46cqmin" : compact ? "20cqmin" : "18cqmin",
            lineHeight: 1, color,
          }}>{suit}</span>
        ))}

        {isFace && (
          // Figura: riquadro con doppio filo, lettera grande, emblema e seme.
          <div aria-hidden style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "2cqmin",
            border: `0.9cqmin solid ${color}`, outline: `0.9cqmin solid ${color}55`, outlineOffset: "1.2cqmin",
            background: isRed ? "#fde8e4" : "#e9ebf2", color,
          }}>
            <span style={{ fontSize: "16cqmin", lineHeight: 1 }}>{FACE_MARK[rank]}</span>
            <span style={{ fontFamily: FONT, fontWeight: "bold", fontSize: "30cqmin", lineHeight: 0.9 }}>{rank}</span>
            <span style={{ fontSize: "14cqmin", lineHeight: 1 }}>{suit}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function suitName(s) {
  return { "♠": "picche", "♥": "cuori", "♦": "quadri", "♣": "fiori" }[s] || s;
}

export const PlayingCardFace = memo(PlayingCardFaceImpl);
