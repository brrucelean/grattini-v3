# Grattini V3

Repository separato per il redesign visivo pixel-art di Grattini.

## 🎮 Gioca subito

### [▶ APRI GRATTINI V3 NEL BROWSER](https://brrucelean.github.io/grattini-v3/)

Il link apre sempre l'ultima versione pubblicata del gioco. Dopo ogni modifica
attendi il completamento della pubblicazione GitHub Pages e ricarica la pagina.

Direzione creativa:

> Videogioco DOS/PICO-8 incontra gratta-e-vinci italiano stampato male nel 1997.

## Stato

Il progetto contiene ora **il gioco completo** importato dalla baseline V2
verificata (`78d27a3`). Dialoghi, notiziario, gimmick, biglietti, combattimenti,
eventi, negozi, locanda, mappa, trofei, reliquie, statistiche e finali sono
presenti. La nuova direzione visiva viene applicata progressivamente senza
ridurre il contenuto o modificare il bilanciamento.

- V2 funzionale di riferimento: <https://github.com/brrucelean/grattini-v2-redesign>
- **stato, decisioni e ordine di lavoro: [`docs/STATUS.md`](docs/STATUS.md)**
- altri documenti: [`docs/`](docs/) (fasi concluse in [`docs/archive/`](docs/archive/))
- stack: React 18 + Vite 5
- pilot approvato conservato nel tag Git `combat-pilot-approved`

## Sviluppo

```bash
npm ci
npm run dev
npm run build
```

Direzione approvata: struttura **Tabacchi Terminale**, stampa imperfetta,
segnaletica gambling leggibile e interazioni di grattata tattili/ASMR.
