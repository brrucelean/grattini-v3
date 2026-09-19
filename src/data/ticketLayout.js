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
  // Misurate sui pixel dell'arte V3 (2026-09-18): header = interno crema del
  // cartiglio meno 2,5% ai lati e 2% sopra/sotto; play = pannello scuro meno
  // 2% ai lati e 2,5% sopra/sotto, così le celle non toccano mai la cornice.
  boccaDrago:        { play:{top:46.1, left:6.9, right:6.7, bottom:12}, header:{top:12.6, left:56.9, right:8, bottom:65.7, dir:"col", print:true} },
  doppioOnulla:      { play:{top:44.6, left:6.1, right:6.1, bottom:11.7}, header:{top:6.8, left:47.3, right:6.1, bottom:65, dir:"col", print:true} },
  fintoMilionario:   { play:{top:52, left:6.4, right:6.7, bottom:12.8}, header:{top:11.9, left:50.6, right:6.1, bottom:59.9, dir:"col", print:true} },
  fortunaFlash:      { play:{top:46.8, left:5.6, right:6.1, bottom:11.3}, header:{top:14.8, left:44.3, right:12.4, bottom:69.4, dir:"col", print:true} },
  grattaCombina:     { play:{top:43.3, left:7, right:7, bottom:11.4}, header:{top:8.6, left:58.9, right:7.5, bottom:67.8, dir:"col", print:true} },
  jackpotMix:        { play:{top:46.8, left:8.6, right:8.6, bottom:14.2}, header:{top:9, left:49.2, right:6.9, bottom:66.8, dir:"col", print:true} },
  labirinto:         { play:{top:46.5, left:7.4, right:7.4, bottom:14.8}, header:{top:10.5, left:54.5, right:8.2, bottom:70.7, dir:"col", print:true} },
  mahjong:           { play:{top:48.3, left:6.7, right:6.7, bottom:11.3}, header:{top:8.2, left:54.1, right:8.3, bottom:64.3, dir:"col", print:true} },
  maledetto:         { play:{top:49, left:7.2, right:7.2, bottom:12}, header:{top:16.3, left:45.9, right:6.6, bottom:64.6, dir:"col", print:true} },
  mappaTesor0:       { play:{top:45.8, left:8.4, right:7.7, bottom:11.8}, header:{top:7.7, left:58.2, right:7.5, bottom:65.9, dir:"col", print:true} },
  miliardario:       { play:{top:46.8, left:8.3, right:8.3, bottom:12.4}, header:{top:13.4, left:49.8, right:6.1, bottom:64.6, dir:"col", print:true} },
  portaFortuna:      { play:{top:46.5, left:7.8, right:7.8, bottom:13.5}, header:{top:7.9, left:48.9, right:8.3, bottom:66.5, dir:"col", print:true} },
  puzzle:            { play:{top:47.6, left:7.5, right:7.5, bottom:11.3}, header:{top:8.6, left:49.5, right:6.1, bottom:64.6, dir:"col", print:true} },
  ruota:             { play:{top:46.5, left:8.6, right:8.6, bottom:13.1}, header:{top:11.9, left:55, right:6.9, bottom:67.2, dir:"col", print:true} },
  setteEMezzo:       { play:{top:45.4, left:6.9, right:6.9, bottom:11.3}, header:{top:9.7, left:44.3, right:7.4, bottom:67.2, dir:"col", print:true} },
  tredici:           { play:{top:50.1, left:6.1, right:6.1, bottom:10.9}, header:{top:15.2, left:52.8, right:8.5, bottom:60.6, dir:"col", print:true} },
  turistaPerSempre:  { play:{top:51.2, left:8.6, right:8.6, bottom:13.5}, header:{top:13.7, left:54.7, right:10.2, bottom:62.1, dir:"col", print:true} },
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
  grattaCombina:    { l:2, t:2, r:54, b:36 },
  jackpotMix:       { l:3, t:3, r:43, b:37 },
  labirinto:        { l:2, t:2, r:50, b:38 },
  mahjong:          { l:3, t:3, r:47, b:40 },
  maledetto:        { l:3, t:3, r:40, b:38 },
  mappaTesor0:      { l:2, t:2, r:53, b:39 },
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
