# Registro bug separato dal redesign

## COPY-001 — Sanguinante e premio al 25%

Stato: confermato su V2 `78d27a3`.

- il tutorial dichiara che `Sanguinante` mantiene il premio pieno;
- `src/data/nails.js` assegna a `sanguinante.mult` il valore `1.0`;
- il primo avviso di Nonno Carmelo afferma invece che, facendo sanguinare
  l'unghia, la vincita viene ridotta al 25%;
- il 25% appartiene allo stato `Marcia` (`mult: 0.25`).

Correzione proposta: aggiornare soltanto il copy dell'avviso nella V3. Nessuna
modifica al bilanciamento. La correzione resterà separata dai commit visuali.

