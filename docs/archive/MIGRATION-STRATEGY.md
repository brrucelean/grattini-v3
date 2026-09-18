# Strategia V2 → V3

## Decisione raccomandata: shell V3 pulita

La V3 partirà da React 18 + Vite 5 e importerà progressivamente soltanto dati,
funzioni pure e controller verificati della V2.

Non verranno usati come fondamento:

- il root monolitico `scratchlite.jsx`;
- il tema V2;
- gli stili inline delle view;
- la shell HUD/sidebar corrente;
- emoji di sistema come iconografia finale;
- gli asset esistenti senza una decisione esplicita di conservazione o remake.

## Motivazione

Il fork tecnico ripulito porterebbe immediatamente nella V3 gli accoppiamenti
che il redesign deve separare. La shell pulita riduce il rischio di trasformare
la nuova UI in un tema applicato sopra la vecchia dashboard.

## Ordine di importazione

1. dati e costanti di gameplay verificati;
2. utility pure e generatori con test di parità;
3. contratto controller/view del combattimento;
4. harness degli stati del combat;
5. presentation layer V3, solo dopo approvazione del Visual System;
6. altre schermate, una per checkpoint.

## Regola di provenienza

Ogni modulo importato dovrà indicare:

- file e commit V2 di origine;
- modifiche funzionali, se presenti;
- motivo dell'importazione;
- test usato per verificare la parità.

