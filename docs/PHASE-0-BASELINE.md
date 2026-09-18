# Fase 0 — Baseline ed evidenze

Data audit: 2026-09-18.

## Stato verificato della V2

| Voce | Risultato |
|---|---|
| Repository | `brrucelean/grattini-v2-redesign` |
| Branch predefinita | `main` |
| Commit `main` | `78d27a325672565dee6b23a8d6026ecf2b2dcdee` |
| Branch sperimentale | `visual/pixel-art-combat-v1` |
| Commit sperimentale | `811cbb30f69100bf047298df7c4624462a4aaf54` |
| Installazione | `npm ci` riuscito |
| Build | `npm run build` riuscito |
| Stato della copia di audit | pulito |

La V2 è stata clonata esclusivamente in una directory temporanea per l'audit.
Non è stata modificata e la branch sperimentale non è stata usata come base.

## Prima evidenza a 640×360

La baseline è stata avviata localmente e osservata con viewport esatto
`640×360`.

Problemi riprodotti:

- la schermata titolo non mostra l'intera composizione nel viewport;
- il tutorial delle unghie taglia intestazione e pulsante di avanzamento;
- il tutorial del combattimento richiede scorrimento verticale;
- la schermata di Nonno Carmelo mostra HUD e dialogo, ma i ticket finiscono
  sotto la piega;
- il layout attuale tratta 640×360 come un viewport responsive, non come una
  risoluzione virtuale indivisibile.

Questa evidenza rende necessario un canvas virtuale con letterbox e scaling
intero. Non è una decisione sullo stile: è un vincolo geometrico verificato.

## Copertura ancora necessaria

- completare almeno una run rappresentativa;
- vittoria, game over e boss;
- quattro biomi;
- Furia, Fortezza, attacco, parata e denaro;
- tutti i tipi di ticket e relativi stati;
- mappa, shop, locanda, inventario, debito, reliquie e impianti;
- eventi e minigiochi;
- mouse, tastiera e touch;
- viewport piccoli e scale intere supportate;
- `prefers-reduced-motion`;
- screenshot comparativi organizzati per stato.

## Blocco asset reference

L'immagine reference `360_F_1445096984_ONyyYe43yu8AUZeQXsSRjoDGNhmtREID.jpg`
non era presente né nel workspace V3 né nella cartella Download ispezionata.
Serve una nuova copia prima dello studio formale dei ticket in Fase 1.

