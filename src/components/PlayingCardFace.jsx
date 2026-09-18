import { memo } from "react";
import { FONT } from "../data/theme.js";

// ─── PLAYING CARD FACE — faccia di una carta da gioco vera ───────
// Sette e Mezzo: la carta impaginata come una carta francese stampata.
// Indice (valore sopra, seme sotto) in tutti e quattro gli angoli, quelli
// in basso capovolti; semi grandi su due colonne e tre righe che riempiono
// la carta; figura incorniciata per J/Q/K. Solo presentazione: valore, seme
// e punteggio arrivano immutati dalla cella.
//
// Misure in unità del contenitore (cqw/cqh), così la stessa carta funziona
// nella cella grattabile e in miniatura nel Banco.

const RED = "#d8173a";
const BLACK = "#16171b";

// Posizioni dei semi in % della carta (x, y), come sulle carte vere:
// colonne al 27% e 73%, righe al 15%, 50% e 85%. Nella metà bassa il seme
// è capovolto.
const L = 27, R = 73, M = 50, TOP = 15, MID = 50, BOT = 85;
const PIPS = {
  A: [[M, MID, "ace"]],
  "2": [[M, TOP], [M, BOT]],
  "3": [[M, TOP], [M, MID], [M, BOT]],
  "4": [[L, TOP], [R, TOP], [L, BOT], [R, BOT]],
  "5": [[L, TOP], [R, TOP], [M, MID], [L, BOT], [R, BOT]],
  "6": [[L, TOP], [R, TOP], [L, MID], [R, MID], [L, BOT], [R, BOT]],
  "7": [[L, TOP], [R, TOP], [M, 32.5], [L, MID], [R, MID], [L, BOT], [R, BOT]],
};

const FACE_NAME = { J: "FANTE", Q: "DONNA", K: "RE" };
const FACE_MARK = { J: "⚔", Q: "✿", K: "♛" };

function Index({ rank, suit, color, corner }) {
  const bottom = corner[0] === "b";
  const right = corner[1] === "r";
  return (
    <span aria-hidden style={{
      position: "absolute",
      [bottom ? "bottom" : "top"]: "3cqh",
      [right ? "right" : "left"]: "4cqw",
      width: "14cqw",
      display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 0.9,
      transform: bottom ? "rotate(180deg)" : "none",
      color, fontFamily: FONT, fontWeight: "bold",
    }}>
      <span style={{ fontSize: "17cqw" }}>{rank}</span>
      <span style={{ fontSize: "12cqw", marginTop: "1cqh" }}>{suit}</span>
    </span>
  );
}

function PlayingCardFaceImpl({ rank, suit, isRed }) {
  const color = isRed ? RED : BLACK;
  const pips = PIPS[rank];
  const isFace = !pips;

  return (
    <div role="img" aria-label={`${FACE_NAME[rank] || rank} di ${suitName(suit)}`} style={{
      position: "absolute", inset: 0, containerType: "size", overflow: "hidden",
      background: "#fdfbf5",
    }}>
      {["tl", "tr", "bl", "br"].map(c => <Index key={c} rank={rank} suit={suit} color={color} corner={c} />)}

      {pips && pips.map(([x, y, ace], i) => (
        <span key={i} aria-hidden style={{
          position: "absolute", left: `${x}%`, top: `${y}%`,
          transform: `translate(-50%,-50%)${y > MID ? " rotate(180deg)" : ""}`,
          fontSize: ace ? "62cqw" : "30cqw",
          lineHeight: 1, color,
        }}>{suit}</span>
      ))}

      {isFace && (
        // Figura: riquadro tra gli indici con doppio filo, emblema, lettera e seme.
        <div aria-hidden style={{
          position: "absolute", left: "21cqw", right: "21cqw", top: "11cqh", bottom: "11cqh",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "3cqh",
          border: `1.5cqw solid ${color}`, outline: `0.8cqw solid ${color}`, outlineOffset: "-4cqw",
          background: isRed ? "#fde6ea" : "#e8eaf1", color,
        }}>
          <span style={{ fontSize: "22cqw", lineHeight: 1 }}>{FACE_MARK[rank]}</span>
          <span style={{ fontFamily: FONT, fontWeight: "bold", fontSize: "34cqw", lineHeight: 0.9 }}>{rank}</span>
          <span style={{ fontSize: "22cqw", lineHeight: 1 }}>{suit}</span>
        </div>
      )}
    </div>
  );
}

function suitName(s) {
  return { "♠": "picche", "♥": "cuori", "♦": "quadri", "♣": "fiori" }[s] || s;
}

export const PlayingCardFace = memo(PlayingCardFaceImpl);
