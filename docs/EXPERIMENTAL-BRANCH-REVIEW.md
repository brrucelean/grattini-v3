# Revisione della branch sperimentale V2

Branch esaminata in sola lettura: `visual/pixel-art-combat-v1` a `811cbb3`.

## Materiale utile

- riconosce il contrasto mondo scuro / ticket saturi;
- propone categorie distinguibili tramite colore, label e pattern;
- separa un'area diario dal tavolo;
- vieta blur, glow e scaling frazionario;
- non include asset commerciali delle reference.

## Motivi per non continuarla

- vive nel repository V2, contrariamente alla separazione richiesta;
- modifica direttamente `CombatView` e `scratchlite` prima di stabilizzare il
  confine controller/view;
- contiene un solo style frame, non 2–3 alternative confrontabili;
- il preview dichiarato combat usa un contenitore `640×720`, non il master
  `640×360`;
- il documento visual system è troppo breve per coprire tipografia italiana,
  safe area, semantica completa, accessibilità, texture e anatomia ticket;
- il font del pilot è un segnaposto in codice e non una soluzione licenziata;
- sotto 640×360 propone scroll a 1×, senza risolvere la strategia touch/mobile;
- eredita ancora modifiche dentro la view legacy e quindi non dimostra parità
  funzionale attraverso un contratto isolato.

Conclusione: usare la branch solo come controprova e raccolta di ipotesi. Nessun
file verrà copiato automaticamente nella V3.

