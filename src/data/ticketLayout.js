// ─── TICKET LAYOUT — impaginazione per-biglietto ─────────────
// Le 17 illustrazioni sono state generate senza lock di composizione: banner e
// pannello di gioco cadono in punti diversi su ogni biglietto, quindi un overlay
// unico non impagina bene ovunque. Ogni carta dichiara le SUE due zone, in
// percentuali del box 4:3 del biglietto:
//
//   play   → il rettangolo scuro dell'arte: la griglia delle celle lo riempie
//   header → il cartiglio vuoto dove va il titolo (+ badge costo/max);
//            dir:"row" per fasce basse e larghe (titolo a sinistra, badge a
//            destra), dir:"col" per i cartigli veri e propri.
//
// NON serve modificarlo a mano: in dev apri ?ticket=<id>&edit=1, trascini i
// riquadri sopra il biglietto e premi SALVA — questo file viene riscritto.
// Vedi vite-plugin-ticket-layout.js e TicketLayoutEditor.jsx.
export const TICKET_LAYOUT = {
  fortunaFlash:     { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  setteEMezzo:      { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  portaFortuna:     { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  fintoMilionario:  { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  puzzle:           { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  boccaDrago:       { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  miliardario:      { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  tredici:          { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  maledetto:        { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  ruota:            { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  labirinto:        { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  grattaCombina:    { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  mappaTesor0:      { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  doppioOnulla:     { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  mahjong:          { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  jackpotMix:       { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
  turistaPerSempre: { play:{top:45.2, left:5.5, right:5.5, bottom:9.2}, header:{top:10.5, left:42, right:8.5, bottom:65.5, dir:"col", print:true} },
};

export const TICKET_LAYOUT_FALLBACK = {
  play:   { top:40, left:6, right:6, bottom:6 },
  header: { top:2,  left:6, right:6, bottom:86, dir:"row" },
};

// Layout effettivo di una carta (con fallback se non ancora impaginata).
export function ticketLayout(cardId) {
  return TICKET_LAYOUT[cardId] || TICKET_LAYOUT_FALLBACK;
}

// inset CSS da un rect in percentuali
export const inset = r => `${r.top}% ${r.right}% ${r.bottom}% ${r.left}%`;

// ─── RITAGLIO DELL'ILLUSTRAZIONE ─────────────────────────────
// In tutti i 17 biglietti V3 l'elemento distintivo (drago, dadi, ruota…) sta
// in alto a sinistra. Le miniature (negozio) mostrano solo quello: niente
// bordo esterno invecchiato, niente cartiglio del titolo, niente cornice del
// pannello da grattare.
//
// Per ogni biglietto: la zona dell'illustrazione in percentuali dell'arte
// (l/t = margine sinistro/alto, r/b = dove iniziano cartiglio e pannello),
// misurata a mano su griglia al 5% con 2% di sicurezza. Tutte le miniature
// hanno le stesse proporzioni: la zona viene ristretta al centro fino a
// TICKET_ART_ASPECT, così nessun bordo rientra.
export const TICKET_ART_ASPECT = 160 / 109;
const ART_W = 364, ART_H = 273;
const ART_ZONE = {
  boccaDrago:       { l:3, t:3, r:49, b:38 },
  doppioOnulla:     { l:3, t:3, r:41, b:37 },
  fintoMilionario:  { l:3, t:3, r:44, b:41 },
  fortunaFlash:     { l:3, t:3, r:38, b:38 },
  grattaCombina:    { l:3, t:3, r:43, b:35 },
  jackpotMix:       { l:3, t:3, r:43, b:37 },
  labirinto:        { l:3, t:3, r:47, b:37 },
  mahjong:          { l:3, t:3, r:47, b:40 },
  maledetto:        { l:3, t:3, r:40, b:38 },
  mappaTesor0:      { l:3, t:3, r:46, b:38 },
  miliardario:      { l:3, t:3, r:45, b:37 },
  portaFortuna:     { l:3, t:3, r:42, b:37 },
  puzzle:           { l:3, t:3, r:45, b:36 },
  ruota:            { l:3, t:3, r:45, b:38 },
  setteEMezzo:      { l:3, t:3, r:38, b:37 },
  tredici:          { l:3, t:3, r:44, b:39 },
  turistaPerSempre: { l:3, t:3, r:44, b:40 },
};
const ART_ZONE_FALLBACK = { l:3, t:3, r:40, b:36 };

export function ticketArtCrop(cardId) {
  const z = ART_ZONE[cardId] || ART_ZONE_FALLBACK;
  // in pixel dell'arte
  let x = z.l * ART_W / 100, y = z.t * ART_H / 100;
  let w = (z.r - z.l) * ART_W / 100, h = (z.b - z.t) * ART_H / 100;
  // restringi al centro il lato in eccesso
  if (w / h > TICKET_ART_ASPECT) { const nw = h * TICKET_ART_ASPECT; x += (w - nw) / 2; w = nw; }
  else { const nh = w / TICKET_ART_ASPECT; y += (h - nh) / 2; h = nh; }
  return { left: x / ART_W * 100, top: y / ART_H * 100, width: w / ART_W * 100, height: h / ART_H * 100 };
}
