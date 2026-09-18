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

