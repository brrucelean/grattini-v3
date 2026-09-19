# GRATTINI V3 — Audio Design System

## Obiettivo

Il suono deve far percepire materia: carta, patina argentata, plastica dei tasti,
monete, ottone e un vecchio CRT. Il riferimento qualitativo è un'interfaccia da
casino molto tattile e musicale, senza imitare asset o frasi sonore di altri giochi.
Ogni feedback deve essere breve, leggibile e meno forte dell'evento che conferma.

## Audit (19 settembre 2026)

### Già coperto

- musica procedurale per esplorazione, gratta, negozio, locanda, combattimento e boss;
- gratta, vincita, perdita e incasso;
- dialoghi dattiloscritti e voci NPC;
- avanzamento mappa;
- colpo, perfetto, parata, cura, rottura unghia, dolore e ingresso boss;
- achievement e tema Quartiere Cinese;
- mute/volume nel Run Bar e HUD.

### Lacune rilevate

- pulsanti nativi e tessere non avevano una risposta uniforme;
- hover/focus quasi sempre muti;
- cambio schermata e pannelli privi di materia sonora;
- acquisti e tentativi non validi non avevano una firma dedicata;
- completamento della grattata non era distinto dal fruscio continuo;
- il rumore CRT usava un secondo AudioContext e ignorava mute/master volume;
- la grattata poteva creare troppi nodi audio durante movimenti rapidi.

## Famiglie sonore

| Famiglia | Materiale | Firma | Picco relativo |
|---|---|---|---:|
| UI hover | vetro/plastica | tick sinusoidale + polvere quasi muta | 0.018 |
| UI press | tasto meccanico | doppio corpo 540/260 Hz + click filtrato | 0.055 |
| Unghia | cheratina/polpastrello | 5 firme per dito, 330–760 Hz + micro-variazioni | 0.040 |
| Biglietto | cartoncino | colpo carta filtrato + corpo morbido | 0.027 |
| Oggetto | metallo/plastica | tick brillante + micro-rumore | 0.035 |
| Transizione | carta trascinata | fruscio medio + thump morbido | 0.025 |
| Apertura pannello | cassetto | soffio corto, corpo basso, fermo alto | 0.035 |
| Zaino | tela/zip/fibbia | fruscio lungo + doppio fermo apertura/chiusura | 0.038 |
| Slot | rulli/camma/campana | avvio, tick crescenti, 3 stop, esito per tier | 0.062 max |
| Scratch | patina argentata | rumore band-pass variabile | 0.20 nel bus SFX |
| Reveal | carta scoperta | carta secca + piccolo ping | 0.040 |
| Acquisto | moneta/cassa | click carta + due armoniche ascendenti | 0.055 |
| Errore | meccanismo bloccato | doppio tono basso discendente | 0.060 |
| CRT | scarica analogica | burst band-pass + ronzio 73 Hz | 0.055 |
| Premio | gettoni/campanello | arpeggio brillante esistente | 0.12 max |
| Combat | impatti distinti | basso/rumore, metallo, shimmer | 0.20 max |

I valori sono moltiplicati dal master (`0…1`). Nessun suono bypassa il master.
Un compressore master morbido (-20 dB, ratio 5:1) contiene jackpot, incassi e
impatti sovrapposti senza alzare artificialmente hover e feedback minuti.

## Matrice evento → suono

| Area | Evento | Funzione | Regola |
|---|---|---|---|
| Globale | primo input | `init` | sblocca WebAudio |
| Globale | hover/focus interattivo | `hover` | cooldown 85 ms; niente hover touch |
| Globale | pressione elemento nativo | `click` | cooldown 32 ms |
| Unghie | selezione dito | `nailTap` | 4 pitch discreti; cooldown 55 ms |
| Grattini | selezione biglietto | `cardTap` | carta, non click cabinet |
| Oggetti | equip/uso/selezione | `itemTap` | materiale più brillante |
| Globale | cambio schermata | `transition` | cooldown 260 ms |
| CRT | glitch raro | `crtGlitch` | stesso master/mute; cooldown 5 s di sicurezza |
| Grattino | trascinamento | `scratch` | cooldown 38 ms; buffer riciclati |
| Grattino | soglia reveal 35% | `reveal` | una volta per casella |
| Grattino | esito | `win` / `lose` | esistente |
| Negozio | acquisto riuscito | `purchase` | dopo addebito valido |
| Negozio | fondi/zaino insufficienti | `error` | cooldown 220 ms |
| Denaro | saldo aumenta | `cash` | esistente |
| Mappa | movimento pedina | `mapTick` | tre scatti cadenzati esistenti |
| Dialoghi | caratteri | `talkBlip` / `dialogueTick` | ogni terzo carattere |
| Combat | colpo/parata/perfetto/cura | funzioni dedicate | esistente, priorità alta |
| Meta | achievement | `achievementJingle` | esistente |

## Gerarchia e limiti

1. Esito importante (vittoria, boss, morte) — può dominare il mix per meno di 1 s.
2. Azione del giocatore (scratch, colpo, acquisto) — chiara ma breve.
3. UI (click, reveal, transizione) — sotto l'azione.
4. Hover/focus — appena percepibile; mai una nota per ogni pixel attraversato.
5. Musica — base continua a volume ridotto, non deve mascherare lo scratch.

La musica procedurale usa `MUSIC_MIX = 0.58` (circa -4,7 dB alla sorgente):
resta chiaramente sotto hover, scratch, dialoghi e premi anche con master al 100%.

Cooldown minimi: hover 85 ms, scratch 38 ms, reveal 75 ms, errore 220 ms,
transizione 260 ms. Gli hover touch sono esclusi. Le variazioni di pitch sono
limitate a circa ±4–7% per evitare sia monotonia sia caos.

## Implementazione

- `src/audio.js` è l'unica sorgente WebAudio e l'unico master volume.
- `AudioEngine.bindUI()` usa event delegation: copre anche schermate lazy e legacy.
- Gli elementi custom non semantici dichiarano `data-audio-interactive="true"`.
- `data-audio="nail|card|item"` sceglie il materiale; i pulsanti restano cabinet.
- Il glitch CRT chiama `AudioEngine.crtGlitch()`; nessun AudioContext parallelo.
- I typewriter vengono smontati quando il relativo dialogo non è visibile: in
  particolare `IntroDesk` non resta attivo dietro la schermata di scratch.
- `prefers-reduced-motion` non spegne l'audio: movimento e udito sono preferenze
  differenti. Il controllo volume/mute resta l'autorità dell'utente.

## Prossimo passaggio consigliato

Dopo un playtest completo con cuffie: separare, se serve, slider musica e SFX;
registrare tre micro-foley originali (moneta, patina, tasto ricevitoria) e usarli
come layer sotto la sintesi mantenendo gli stessi eventi e cooldown.
