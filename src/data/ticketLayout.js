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
