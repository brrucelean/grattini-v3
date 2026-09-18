# Registro bug separato dal redesign

## COPY-001 — Sanguinante e premio al 25%

Stato: confermato su V2 `78d27a3`.

- il tutorial dichiara che `Sanguinante` mantiene il premio pieno;
- `src/data/nails.js` assegna a `sanguinante.mult` il valore `1.0`;
- il primo avviso di Nonno Carmelo afferma invece che, facendo sanguinare
  l'unghia, la vincita viene ridotta al 25%;
- il 25% appartiene allo stato `Marcia` (`mult: 0.25`).

Stato: **corretto**. Solo copy, nessuna modifica al bilanciamento:

- `src/data/art.js` → `first_warning`: "se la fai sanguinare" → "se la fai marcire";
- `src/components/ScratchCardView.jsx`: il modale "abbandona ora", che compare
  solo con unghia marcia, diceva "unghia insanguinata" → ora "unghia marcia".

## TEST-001 — Check di bilanciamento non allineato ai target

Stato: segnalazione da validare, nessuna correzione autorizzata.

`node scripts/check-balance.mjs` segnala:

- `fortunaFlash`: EV F0 `+28%` contro target `0%`;
- `ruota`: EV F0 `-34%` contro target `-2%`;
- `cerotto`: rapporto valore/prezzo `1,67`, marcato potenzialmente eccessivo.

Il redesign deve preservare i valori V2. L'anomalia va verificata con il
proprietario del bilanciamento in un intervento funzionale separato.

## A11Y-001 — Ticket speciali dipendenti dal gesto canvas

Stato: confermato su `Il Miliardario` e dal rendering di `ScratchCell`.

Il ticket standard osservato espone `Gratta Tutto in Una Volta`; le meccaniche
incluse in `NO_MATCH_MECHANICS` non espongono la stessa alternativa. Lo scratch
di `ScratchCell` usa mouse/touch canvas e non ha un controllo da tastiera
equivalente per rivelare la cella.

La V3 dovrà mantenere il gesto principale ma offrire un percorso equivalente
per tastiera e tecnologie assistive, senza cambiare probabilità o risultati.

