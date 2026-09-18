import { FONT } from "../../data/theme.js";
import { nailRank, isDamagedNail } from "../../utils/nail.js";
import { fmtMoney } from "../../utils/money.js";
import { Asset } from "../Asset.jsx";

// ─── LOCANDA (desktop) — insegna + listino delle stanze ──────────
// Stesso linguaggio della soglia: pannelli neri a dithering con filo oro,
// niente neon, glow o luccichii. Sul fondo resta il dipinto della locanda
// (scene-locanda, messo da scratchlite): richiesto dall'utente. In alto
// l'insegna (oste, nome, frase, come stanno le tue unghie), sotto il listino:
// cinque stanze affiancate, ognuna dice cosa cura A TE adesso, cosa rischi e
// quanto costa. Stesse stanze, prezzi e callback della versione mobile.

const GOLD = "#c9a24a", INK = "#e8dcc0", MUTED = "#8a7a5a", RED = "#e07a6a", GREEN = "#7fcf98", ROSE = "#d68ab4";
const BLACK = "repeating-conic-gradient(#121014 0% 25%, #17141a 0% 50%) 0 0 / 4px 4px";
const frame = (edge = GOLD) => `inset 0 0 0 2px #050304, inset 0 0 0 3px ${edge}, inset 0 0 0 5px #050304, 5px 5px 0 #050304`;

// Cosa fa ciascuna stanza, in parole semplici (le regole sono in useNodeHandlers.handleRest).
const ROOM_COPY = {
  "Per Terra":       { effect: "Unghie a metà strada", detail: "Ogni unghia rovinata risale verso Sana. Le morte restano morte.", risk: "50%: un ladro ti sveglia e devi combattere" },
  "Bettola":         { effect: "Cura 1 unghia", detail: "Prima le rovinate, poi resuscita una morta.", risk: "25%: ti rubano un oggetto dallo zaino" },
  "Camera Media":    { effect: "Cura 2 unghie", detail: "Prima le rovinate, poi le morte. Si dorme tranquilli." },
  "Suite":           { effect: "Cura 5 unghie", detail: "Lenzuola di seta: fino a cinque unghie tornano Sane, anche le morte." },
  "Manicure Kawaii": { effect: "Tutte KAWAII", detail: "Ogni unghia, anche morta, diventa Kawaii: premi ×2." },
};

// Quante delle TUE unghie cambierebbero dormendo in quella stanza.
function roomPreview(room, nails) {
  const damaged = nails.filter(isDamagedNail).length;
  const dead = nails.filter(n => n.state === "morta").length;
  if (room.isFloor) return damaged;
  if (room.kawaii) return nails.filter(n => n.state === "morta" || nailRank(n.state) < nailRank("kawaii")).length;
  const fixed = Math.min(room.heals, damaged);
  return fixed + Math.min(room.heals - fixed, dead);
}

function RoomCard({ room, player, onRest }) {
  const copy = ROOM_COPY[room.name] || { effect: room.desc, detail: "" };
  const gap = room.cost - player.money;
  const canAfford = room.isFloor || gap <= 0;
  const changes = roomPreview(room, player.nails || []);
  const edge = room.kawaii ? ROSE : room.name === "Suite" ? GOLD : "#3a3026";
  const label = !canAfford ? `TI MANCANO €${fmtMoney(gap)}` : room.cost > 0 ? `DORMI · €${room.cost}` : "DORMI · GRATIS";

  return (
    <article aria-label={room.name} style={{
      background: BLACK, boxShadow: frame(edge), padding: "14px 14px 16px", minWidth: 0,
      display: "grid", gridTemplateRows: "auto auto auto 1fr auto auto", gap: "8px", textAlign: "center",
      opacity: canAfford ? 1 : 0.62,
    }}>
      {/* la stanza: sprite su un fondo incassato */}
      <div style={{ height: 100, background: "#0a0806", boxShadow: "inset 3px 3px 0 #050304, inset -1px -1px 0 #2a241c",
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <Asset id={room.img} emoji={room.emoji} size={88} style={{ width: 88, height: 88, objectFit: "contain" }} />
      </div>
      <span style={{ fontSize: "17px", color: room.kawaii ? ROSE : GOLD, letterSpacing: "1px", lineHeight: 1.1 }}>{room.name}</span>
      <span style={{ fontSize: "14px", color: INK }}>{copy.effect}</span>
      <span style={{ fontSize: "12px", color: MUTED, lineHeight: 1.45 }}>{copy.detail}</span>
      {/* riga rischio: sempre presente, così i bottoni restano allineati */}
      <span style={{ fontSize: "12px", lineHeight: 1.4, minHeight: "2.8em", color: copy.risk ? RED : GREEN }}>
        {copy.risk ? `⚠ ${copy.risk}` : "Nessun rischio"}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ fontSize: "11px", letterSpacing: "1px", color: changes > 0 ? INK : MUTED }}>
          {changes > 0 ? `Sistema ${changes} ${changes === 1 ? "tua unghia" : "tue unghie"}` : "Le tue unghie non ne hanno bisogno"}
        </span>
        <button type="button" onClick={canAfford ? () => onRest(room) : undefined} disabled={!canAfford} style={{
          height: "40px", fontFamily: FONT, fontSize: "14px", letterSpacing: "2px", border: "none",
          cursor: canAfford ? "pointer" : "default",
          background: canAfford ? "#1d1810" : "#141013", color: canAfford ? GOLD : RED,
          boxShadow: canAfford ? `inset 0 0 0 2px ${GOLD}, 3px 3px 0 #050304` : `inset 0 0 0 1px ${RED}66`,
        }}>{label}</button>
      </div>
    </article>
  );
}

export function LocandaDesk({ rooms, player, onRest, onLeave }) {
  const nails = player.nails || [];
  const damaged = nails.filter(isDamagedNail).length;
  const dead = nails.filter(n => n.state === "morta").length;
  const status = damaged + dead === 0
    ? "Le tue unghie stanno bene."
    : [damaged && `${damaged} ${damaged === 1 ? "rovinata" : "rovinate"}`, dead && `${dead} ${dead === 1 ? "morta" : "morte"}`].filter(Boolean).join(" · ");

  return (
    <div style={{
      width: "100%", height: "100%", boxSizing: "border-box", padding: "20px", overflowY: "auto",
      display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", fontFamily: FONT, color: INK, minHeight: 0,
    }}>
      {/* ══ L'insegna ══ */}
      <header style={{
        width: "min(100%, 640px)", boxSizing: "border-box", background: BLACK, boxShadow: frame("#4f9a6a"),
        padding: "18px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center",
      }}>
        <div style={{ width: 112, height: 112, padding: "4px", boxSizing: "border-box", background: "#0a0806",
          boxShadow: `inset 0 0 0 2px ${GOLD}, 4px 4px 0 #050304`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <Asset id="spr-locanda" emoji="🏨" size={104} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <span style={{ fontSize: "11px", letterSpacing: "2px", padding: "2px 8px", color: "#0b090b", background: "#4f9a6a" }}>SICURO</span>
        <span style={{ fontSize: "30px", color: GOLD, letterSpacing: "1px", lineHeight: 1 }}>Locanda</span>
        <span style={{ fontSize: "14px", lineHeight: 1.5, fontStyle: "italic" }}>«Riposati, viaggiatore. Le tue unghie ne hanno bisogno.»</span>
        <span style={{ fontSize: "12px", letterSpacing: "1px", color: MUTED }}>
          Hai <b style={{ color: GOLD }}>€{fmtMoney(player.money)}</b> · unghie: <span style={{ color: damaged + dead ? RED : GREEN }}>{status}</span>
        </span>
      </header>

      {/* ══ Il listino ══ */}
      <div style={{ width: "min(100%, 1180px)", display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={{ fontSize: "12px", letterSpacing: "3px", color: MUTED, textAlign: "center" }}>LISTINO DELLE STANZE</span>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${rooms.length}, minmax(0,1fr))`, gap: "12px" }}>
          {rooms.map(room => <RoomCard key={room.name} room={room} player={player} onRest={onRest} />)}
        </div>
      </div>

      <button type="button" onClick={onLeave} style={{
        width: "min(100%, 240px)", height: "42px", flexShrink: 0, cursor: "pointer", fontFamily: FONT, fontSize: "15px", letterSpacing: "2px",
        background: "transparent", color: MUTED, border: "none", boxShadow: `inset 0 0 0 2px ${MUTED}`,
      }}>VAI VIA →</button>
    </div>
  );
}
