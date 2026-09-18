# Inventario preliminare degli asset V2

## Quantità

| Tipo | File |
|---|---:|
| WEBP | 148 |
| PNG | 15 |
| Totale directory immagini | circa 14 MB |

Nel sorgente JS/JSX sono state rilevate oltre 1.000 occorrenze di glifi emoji
Unicode. Il conteggio include duplicati e testi narrativi, ma conferma che le
emoji costituiscono oggi una parte strutturale dell'iconografia.

## Famiglie

- scene e sfondi;
- ritratti e sprite NPC;
- ticket completi e card art;
- unghie e cursori;
- HUD;
- oggetti, reliquie e impianti;
- texture e bezel.

## Decisione preliminare

| Gruppo | Trattamento V3 |
|---|---|
| Dati identificativi e nomi | conservare |
| Scene ad alta risoluzione | reinterpretare, non filtrare |
| Ritratti NPC | ridisegnare con densità sprite comune |
| Ticket completi | rifare dentro silhouette e sistema approvati |
| Emoji informative | sostituire con sprite originali |
| Cursori | ridisegnare sulla griglia V3 |
| Audio procedurale | conservare inizialmente, poi valutare il sound system |
| ASCII | conservare solo se parte della grammatica approvata |

## Provenienza e licenze

Il repository V2 dichiara “tutti i diritti riservati” e non documenta ancora la
provenienza/licenza di ogni singolo asset. Nessun asset deve essere promosso
automaticamente in V3. Prima dell'importazione serve un registro con autore,
fonte, licenza e decisione `keep/remake/remove`.

