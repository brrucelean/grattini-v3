# 04 — Combattimento completo

## Stati

Intro, turno giocatore, 0–3 grattate, risoluzione, timing attacco, timing parata, danno, scudo, denaro, furia, fine turno, vittoria, élite e boss.

## Errore da non ripetere

Non inserire il Combat Style Lab come cabinet centrato dentro il vecchio HUD. La scena combat deve sostituire shell contestuale, HUD, log, navigazione e fondo durante tutto il duello.

La causa tecnica è nota: oggi il combat è annidato contemporaneamente in HUD persistente, NailSidebar, DESK con scanline/sfondo e ShopZainoRail. CombatView aggiunge poi un secondo cabinet, un secondo log e una seconda UI unghie. La migrazione deve rimuovere questi quattro involucri durante il combattimento, non decorarli.

## Nuova composizione

- fascia nemico: ritratto, nome, HP, intenti e stato;
- banco principale: biglietti grattabili veri, leggibili per simbolo e forma;
- scontrino/log stabile: turno, bottino, effetti e messaggi senza reflow;
- rail unghie integrata nella shell, con dito reale come cursore;
- timing e risultati come layer della stessa scena, non modali generici.

## Piano implementativo

1. Introdurre `CombatShell` come ramo sibling nel router di `scratchlite.jsx`.
2. Durante combat non renderizzare HUD, NailSidebar, DESK legacy o ShopZainoRail.
3. Integrare in una utility bar unica News, wallet, grattini, bioma, zaino e audio.
4. Lasciare a CombatView tutta la logica esistente ma suddividerne la presentazione in enemy strip, grid, receipt e footer.
5. Usare CSS grid/container query; mai `transform: scale()` sul canvas grattabile.
6. Receipt desktop da 184 px; sotto 600 px diventa summary strip con log drawer.
7. Footer con cinque unghie come unica selezione; nessuna mano extra e nessuna sidebar duplicata.
8. Zaino/equipaggiamento conservati in un drawer combat coerente.
9. Z-index: arena 0, feedback 20, timing 40, drawer 60, modale critica 100.

La reference fornisce ritmo, palette e durezza. Dimensioni e gerarchie vanno ridisegnate sui contenuti reali per impedire overflow.

## Gate

Tutte le fasi mantengono geometria stabile; nomi lunghi e boss non rompono il frame; scratch resta fisico; simboli BOTTA/PARATA/PREMIO dominanti; nessun pezzo di HUD legacy resta attorno; una sola barra soldi, una sola UI unghie e un solo log; verifiche a 390×844, 768×1024 e 1366×768.
