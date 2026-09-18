# Grattini V3 — Backlog di gameplay

Idee nuove di meccanica, **fuori dal redesign visivo**. Ognuna richiede
progettazione, bilanciamento e commit separati. Il redesign prepara solo la sede
grafica.

Stato: `DA FARE` · `IN PROGETTAZIONE` · `IN SVILUPPO` · `FATTO`.

---

## G-01 — Pedine collezionabili · **DA FARE · PRIORITÀ ALTA**

Richiesta del proprietario, 2026-09-18: "la cosa della pedina dobbiamo
assolutamente bloccarla".

### Idea

La pedina che avanza sulla mappa non è decorazione: è un **oggetto**. Si compra
o si trova, e quella equipaggiata **modifica il gioco**. Non è il dito del
giocatore (si confonderebbe con il cursore): è un gettone da slot.

### Da progettare

1. **NPC spacciatore di pedine.** Nuovo personaggio. Nome di lavoro:
   "il Pedinaro" o il gestore della sala slot. Dove compare (nodo proprio,
   dentro il tabaccaio, evento), dialoghi, prezzi.
2. **Come si ottengono.** Acquisto dall'NPC, drop da eventi o boss, premio di
   ticket speciali.
3. **Quante se ne tengono.** Una equipaggiata alla volta? Collezione nello
   zaino? Cambio libero o solo in certi nodi?
4. **Catalogo effetti.** Esempi iniziali, tutti da bilanciare:
   - *Gettone d'ottone* — pedina base, nessun effetto;
   - *Cornetto rosso* — bonus fortuna entrando in un nodo evento;
   - *Dado truccato* — una volta per bioma salta una colonna della mappa;
   - *Fiche della sala* — sconto ai nodi tabaccaio.
5. **Persistenza.** Solo nella run, oppure sblocco permanente in meta
   (come reliquie e vintage)?
6. **Asset.** Uno sprite pixel-art per pedina (32×32 sulla mappa, 48×48
   nell'inventario), stessa bible (`redesign/11-PIXEL-ART-BIBLE.md`).

### Già pronto dal redesign

- La mappa orizzontale mostra una **pedina base** che avanza a scatti di nodo in
  nodo. Il componente accetta l'id della pedina: quando G-01 esisterà, basterà
  passargli quella equipaggiata.

### Criteri per chiuderla

Documento di design approvato, bilanciamento verificato su più run, NPC con
tutti i dialoghi, sprite per ogni pedina, nessuna regressione sul resto.
