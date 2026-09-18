# 03 — Mappa e progressione

## Stati

Quattro biomi, nodo corrente, raggiungibile, visitato, bloccato, segreto, élite, boss, scorciatoia, requisito economico e pre-nodo.

## Re-immaginazione

La mappa diventa un vero tabellone clandestino stampato e annotato, non una rete legacy con effetto pixel. Percorsi, quartieri e rischio devono leggersi tramite forma, timbro e silhouette oltre al colore.

## Da preservare

Grafo, reachability, ordine delle righe, segreti, élite, boss, eventi, tooltip, navigazione tastiera/touch e notizie superiori.

## Asset

Quattro fondali/tileset coerenti, set completo icone nodo, marker giocatore, timbri stato, cornici pre-nodo e indicatori percorso.

## Gate

Nessuna etichetta collide con uno sprite; nodo corrente inequivocabile; legenda non dipende dal colore; ogni bioma è distinto mantenendo lo stesso sistema.


## Checkpoint 2026-09-18 — mappa-slot desktop

Direzione (STATUS D-03): mappa orizzontale come schermo di una slot da tabacchi,
in pixel art. Implementata in `src/components/map/MapBoard.jsx` da 1024 px in su;
sotto resta `MapView`.

- **Percorso orizzontale:** ingresso a sinistra, jackpot (boss) a destra; ogni
  riga del grafo è una colonna numerata come una payline. Atto intero visibile
  senza scorrere a 1024×768, 1280×720 e 1920×1080.
- **Testata:** nome del "gioco" del bioma (`mapTheme.js`), modificatore,
  targa JACKPOT con il boss, fila di lampadine a due fotogrammi.
- **Nodi come simboli di slot:** casella piena del colore di famiglia con
  cornice oro a gradini (ombre interne dure, niente blur) e glifo di famiglia
  nell'angolo (▲ pericolo, ● neutro, ✚ sicuro, ? evento, ✦ segreto, ★ élite).
- **Segreti:** casella argento a patina finché bloccati.
- **Visitati:** timbro PAGATO, grigi; il percorso fatto è ripassato in oro.
- **Pedina:** gettone d'ottone (`Pedina.jsx`) che salta a scatti sul nodo scelto
  prima di entrarci; sede pronta per le pedine collezionabili (FEATURE-BACKLOG G-01).
- Stessa logica di prima: nodi, connessioni, raggiungibilità, segreti con soglia
  di fortuna, élite, tooltip e `onSelectNode` invariati.

Aperto:

- sprite pixel-art dei simboli nodo e della pedina (oggi sprite legacy / emoji);
- temi degli altri tre biomi da verificare in partita;
- mascotte del bioma ai bordi del cabinet;
- tablet e telefono.
