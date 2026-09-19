# 02 — Titolo, onboarding e tutorial unghie

Status: titolo e tutorial migrati (2026-09-19).

## Stati

Titolo, metaprogressione aperta, nuova run, tutorial pagine, selezione iniziale delle unghie, dialogo Carmelo, biglietto introduttivo.

## Direzione

Ingresso da sala giochi/tabacchi notturna costruito in pixel art reale. Il titolo è insegna e non semplice testo sopra una scena. Tutorial illustrato come foglio istruzioni stampato, integrato nella stessa macchina scenica.

## Asset da sostituire

Scena titolo, logo, Carmelo/Tabaccaio, icone meta, illustrazioni tutorial e cinque unghie iniziali.

## Gate

CTA sempre visibile, nessun contenuto sotto la piega, tutorial utilizzabile a touch, passaggio al primo biglietto senza cambio di linguaggio.

## Checkpoint 2026-09-18

- rimosso il logo ASCII corrotto;
- rimossi scena pittorica visibile, glitter, foil ed emoji dalle funzioni meta della title;
- introdotto `TitleScreen` come composizione completa, non card sovrapposta;
- verificati titolo e archivio a viewport reale desktop, 390×844 e 375×667;
- verificato il passaggio `INIZIA LA RUN` → tutorial unghie;
- build di produzione superata;
- fatto (2026-09-19): tutorial rifatto come **Il quaderno di Nonno Carmelo**
  (`components/intro/TutorialDesk.jsx`), stesso sistema della scena al
  bancone: 4 capitoli (Le dita · Il duello · La strada · La pedina), voce del
  vecchio scritta a macchina, illustrazione con sprite veri a sinistra, regole
  numerate a destra, navigazione fissa in basso, frecce ← → per sfogliare. Il
  testo non cita il bancone: in quel momento il giocatore non è ancora lì.
- fatto (2026-09-19): archivio della home = Trofei · Reliquie · Stats ·
  **Pedine** (collezione dei gettoni scoperti, `TokenCollection.jsx`). I
  Vintage sono stati rimossi del tutto (varianti delle carte in combattimento,
  collezione e trofeo "Collezionista Vintage"); i vecchi dati si puliscono al
  caricamento.
