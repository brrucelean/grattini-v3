# 11 — Pixel-art bible e pipeline asset

## Standard tecnico

- Palette madre: 24 colori; massimo 4 colori locali aggiuntivi per famiglia.
- PNG indexed; alpha binario 0/255 per sprite e UI.
- Outline nativo 1 px; 2 px soltanto per boss o hero ticket.
- Cluster intenzionali da 2–6 px; vietati pixel casuali e pillow shading.
- Massimo tre livelli di luce per materiale.
- Dithering soltanto manuale 2×2/4×4 su superfici grandi.
- `image-rendering: pixelated`; scaling 1×/2×/3×/4×, mai frazionario. Il layout attorno è adattivo (D-01).

## Dimensioni native

| Famiglia | Dimensione |
|---|---|
| Ticket | 320×240 (decisione D-02 in `STATUS.md`) |
| Scene | 320×180 |
| Room | 160×112 o 192×128 |
| Personaggio | 64×96 |
| Boss | 96×128 |
| Nodo mappa | 32×32 o 48×48 |
| Oggetto | 32×32; hero 48×48 |
| HUD | 16×16 o 24×24 |
| Dito/cursore | 48×48 o 56×56 |
| Categoria combat | 48×48 |
| Particelle | 8/12/16 px |

## Inventario runtime

- 17 ticket V3: usati, ma ancora raster ridotti con falso dithering; tutti da rifare.
- 9 unghie + 9 cursori: solo 5 hanno una variante V3, ancora non gold standard.
- 15 cursori con oggetto.
- 8 icone HUD runtime.
- circa 40 oggetti runtime.
- 3 simboli combat e `scene-combat`.
- 24 sprite personaggio potenzialmente runtime.
- 11 scene e 5 room.
- effetti scratch/canvas procedurali da quantizzare, non necessariamente da sostituire con PNG.

## Pacchetti

1. Ticket pilota Fortuna Flash: risoluzione, safe area e griglia per-card.
2. Sedici ticket restanti, in batch da quattro ma approvati singolarmente.
3. Superficie scratch, brush, polvere e audio.
4. Nove dita/unghie e quindici cursori-oggetto.
5. Kit combat.
6. Otto icone HUD e quaranta oggetti.
7. Quattro biomi, room e scene.
8. Personaggi principali per ultimi.

## Gate automatico e manuale

Dimensione esatta, palette indexed, alpha binario, nessun colore fuori palette, bounding box coerente, hotspot documentato, peso controllato, nome registrato, test a 1×/2× e dimensione reale, silhouette in nero e grayscale, contrasto su fondo chiaro/scuro, screenshot before/after.

## Rischi da risolvere prima dei ticket definitivi

- `ScratchCardView` usa una sola play-area per immagini differenti.
- I ticket 364×273 vengono mostrati fino a 620 px con scala frazionaria.
- `TicketHeader` usa dimensioni fluide che possono produrre baseline non intere.
- Il registry automatico rende selezionabili anche asset esperimento o morti.

