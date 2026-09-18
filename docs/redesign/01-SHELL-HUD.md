# 01 — Shell globale e HUD

## Problema attuale

La shell legacy rimane visibile attorno alle viste ridisegnate e fa sembrare ogni intervento un riquadro incollato. Sfondo scenico, HUD, ticker, contenuto e modali non condividono una geometria unica.

## Risultato richiesto

Una sola macchina scenica pixel-art che possiede l'intero viewport. Ogni schermata dichiara quali zone usa; nessuna vista disegna un secondo cabinet completo dentro il primo.

## Contenuti da preservare

- denaro, fortuna, HP/unghie, tumore, grattamania, clip e cappello;
- inventario ed equipaggiamento;
- NewsTicker e notifiche;
- NPC commenti, tooltip, log e modali;
- mouse, tastiera e touch.

## Nuovo layout

- fascia superiore: notizia contestuale + risorse essenziali;
- stage centrale: scena corrente, sempre proprietaria dello spazio;
- rail laterale o inferiore adattivo: unghie/inventario/azioni;
- layer assoluti condivisi: dialoghi, timing, premi e tutorial;
- mobile: rail inferiore, HUD compresso a simbolo+valore, ticker su una riga.

## File coinvolti

`src/scratchlite.jsx`, `HUD.jsx`, `NewsTicker.jsx`, `NailSidebar.jsx`, `DialogueBox.jsx`, `LogPanel.jsx`, `Btn.jsx`, token in `src/styles`.

## Gate

- nessuna vista riceve una cornice concorrente;
- HUD non copre il contenuto a 640×360;
- tutte le risorse hanno simbolo, numero e stato accessibile;
- cambio schermata senza salti dimensionali.


## Checkpoint 2026-09-18 — shell desktop

Wireframe approvato (artifact "Shell Grattini V3"). Implementato da 1024 px in su;
sotto resta la shell legacy (priorità desktop, `STATUS.md` D-01 punto 7).

- `src/components/shell/RunBar.jsx` — barra 48 px: soldi, grattini, vite, stati
  attivi, volume, zaino. Stati attivi come dati in `statusChips.js`.
- `src/components/shell/NailRail.jsx` — colonna sinistra 192 px, unico selettore
  delle unghie. Modulare: 1–11 dita, gruppi MANO DESTRA / MANO SINISTRA / PIEDE
  (campo `nail.hand` opzionale, altrimenti per indice), righe dense sopra le 6 dita.
  Verificato con 11 dita a 1280×720 senza scroll.
- `src/components/shell/LogColumn.jsx` — scontrino a destra 224 px su mappa,
  eventi e nodi; sostituisce la riga log in fondo.
- `src/components/shell/TickerRow.jsx` — notizie 24 px, solo sulla mappa.
- Rimossi su desktop: scanline e alone del DESK, grana pellicola e vignettatura
  (queste ultime ovunque).
- Le emoji restano come fallback dentro `Asset` finché non arrivano gli sprite.

Aperto:

- combattimento: rail e log propri di `CombatView` da unificare con la shell (04);
- negozio: `ShopZainoRail` da fondere nello zaino della shell (07);
- finali e titolo: nascondere la barra (10);
- tablet e telefono.
