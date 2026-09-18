# Grattini V3 — redesign integrale

Status: in progettazione. Nessuna schermata passa a `approvata` senza controllo nel gioco completo.

## Obiettivo

Re-immaginare l'intera presentazione di Grattini come un prodotto pixel-art nativo. La reference `combat-pilot-approved` definisce energia, contrasto e disciplina, ma non è un layout da incollare né un filtro da applicare al gioco legacy.

## Regole non negoziabili

1. Si sostituisce una schermata completa, inclusi shell e HUD; non si appoggia un pannello nuovo sopra la UI vecchia.
2. Le meccaniche, i dialoghi, le esclusive, le notizie, le gimmick, le griglie e i vincitori restano disponibili.
3. Gli asset precedenti non vengono eliminati: restano come fallback fino alla sostituzione verificata.
4. Pixel art reale: risoluzione nativa, palette controllata, bordi netti, cluster intenzionali, scaling intero quando possibile.
5. Niente vetro, blur, glow generico, gradienti morbidi, angoli arrotondati ornamentali o immagini raster semplicemente filtrate.
6. Ogni schermata viene controllata a 1280×720, 960×540, 640×360 e viewport touch stretta.
7. Si correggono overflow, gerarchie e accessibilità della reference; non se ne copiano i difetti.

## Architettura visiva comune da progettare prima delle schermate

- `GameShell`: viewport, safe area, sfondo, transizioni e scala logica.
- `RunHUD`: risorse persistenti, stato delle unghie, inventario e notizie.
- `SceneHeader`: titolo contestuale e stato della scena.
- `ActionRail`: comandi primari, scorciatoie e conferme.
- `DialogueLayer`: dialoghi, scelte ed esclusive senza cambiare geometria alla scena.
- `ModalLayer`: inventario, premi, tutorial e timing coerenti.
- token unici per palette, spaziatura 8 px, bordi, ombre dure, tipi e animazioni.

## Concept unificante

**La macchina della fortuna**: ricevitoria clandestina costruita con lamiera verniciata, plastica ingiallita, carta termica, display LED e biglietti stampati male. Il gratta-e-vinci è il linguaggio strutturale: dialoghi come scontrini, mappa come foglio perforato, premi come timbri, shop come banco fisico, combattimento come battle-ticket. Non è una skin.

## Ordine di produzione

| Fase | Documento | Dipendenze | Gate |
|---|---|---|---|
| 0 | `01-SHELL-HUD.md`, `11-PIXEL-ART-BIBLE.md` | nessuna | solo fondamenta e token, nessun nuovo wrapper sopra il legacy |
| 1 | `05-SCRATCH-TICKETS.md` | fondamenta | 17 famiglie real pixel-art, una alla volta |
| 2 | `06-NAILS-TOOLS.md` | fondamenta | nove stati, oggetti e cursori |
| 3 | `04-COMBAT.md` | ticket/dita | flusso intro→turno→timing→esito, shell sostituita |
| 4 | `03-MAP.md` | shell/HUD | quattro biomi e tutti gli stati nodo |
| 5 | `07-SHOP-INVENTORY.md` | shell/HUD/ticket | acquisto, slot, prestito, equipaggiamento |
| 6 | `08-EVENTS-DIALOGUES.md` | shell/HUD | ogni NPC, scelta, esclusiva e notizia |
| 7 | `09-INN-MINIGAMES.md` | shell/HUD | locanda, cella e minigiochi |
| 8 | `02-TITLE-TUTORIAL.md` | sistema maturo | ingresso e tutorial completi |
| 9 | `10-ENDINGS-META.md` | tutte | finali, cedole e meta; personaggi principali per ultimi |

## Definition of done per schermata

- inventario di tutti gli stati compilato;
- wireframe logico approvato prima dell'implementazione;
- asset manifest completo con fallback espliciti;
- nessun residuo visivo legacy involontario nella schermata;
- build e interazioni superate;
- screenshot delle quattro viewport confrontati insieme;
- audit su testo, centratura, collisioni, focus, touch e motion;
- commit e checkpoint pubblico solo dopo controllo visivo completo.
