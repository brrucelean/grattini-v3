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


## MECH-001 — Sette e Mezzo: mani perdenti vincibili a €0

Stato: **corretto** (2026-09-18).

Il generatore verificava che una mano perdente non battesse il banco solo
nell'ordine di generazione, ma il giocatore gratta le carte nell'ordine che
vuole. Su 20.000 biglietti il 75% delle mani perdenti aveva un ordine vincente
e il 30% di tutti i biglietti, grattati a caso, mostrava "stai vincendo" con
premio €0. Ora una mano perdente non ha alcun sottoinsieme di carte con somma
tra banco e 7½ (`_isUnwinnableSetteEMezzoHand`); se non se ne trova una, il
banco fa 7½. Verifica: 0 mani perdenti vincibili, vincita reale 34,3% = attesa,
RTP 103%.

## BAL-001 — Tredici: vincita reale 3,4% invece di 14%

Stato: **risolto (19/09/2026)**. Ogni cella prende il numero al primo tocco
seguendo una sequenza stampata (`_sum13Plan`): la vincente tocca 13 esatto,
la perdente lo salta. prizeMax 520→440. Verifica 20.000 biglietti: vince
14,5%, RTP 93%.

Le carte vincenti contengono coppie che fanno 13 più riempitivi da 1 a 6, ma
le celle sono coperte: grattando in qualunque ordine si arriva a esattamente 13
solo nel 24% delle carte vincenti. Su 20.000 biglietti: vincita 3,4%, RTP 25%
(obiettivo evTarget 0, cioè ~100%).

## BAL-002 — Gratta & Combina: RTP 19–27% invece di 90%

Stato: **risolto (19/09/2026)**. 5 simboli, 25% vuoti, €15 a combo, MEGA ×3.
Verifica 20.000 partite: tieni fermo A 92%, alterna 89%, a caso 64%; MEGA 6,6%.

Le celle sono coperte ("?"), quindi il giocatore non può scegliere gli
abbinamenti. Con strategia casuale, alternata o "tieni fermo A" l'RTP resta
fra 19% e 27%; MEGA COMBO sotto l'1%.

## BAL-003 — Mappa del Tesoro: RTP 119% con gli indizi di distanza

Stato: **risolto (19/09/2026)**. Bombe 4→5, premi invariati (€30 per X, €75
bonus). Verifica 20.000 partite: giocatore che usa gli indizi 91%, chi incassa
dopo la prima X 51%.

Un giocatore che usa gli indizi di distanza per scegliere le celle trova
entrambe le X nel 31% dei casi: RTP 119% contro l'obiettivo 90%.
