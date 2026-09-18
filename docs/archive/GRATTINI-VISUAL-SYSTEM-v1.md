# GRATTINI VISUAL SYSTEM v1

Stato: proposta di Fase 1, in attesa della selezione di una direzione.

## Principio

> Videogioco DOS/PICO-8 incontra gratta-e-vinci italiano stampato male nel 1997.

Il mondo è scuro, urbano e disciplinato. I ticket sono il picco cromatico:
commerciali, sgargianti, rumorosi e desiderabili. Il feedback è breve e usa
colori semantici riservati.

## Canvas e geometria

- frame logico: `640×360`;
- griglia compositiva: `8×8` pixel logici;
- scale ammesse nella build di gioco: ×1, ×2, ×3, ×4, ×6;
- nessun ridimensionamento frazionario del frame;
- letterbox quando il viewport supera il rapporto del frame;
- sotto 640 px il laboratorio resta a ×1 con scroll orizzontale; la build di
  gioco richiederà una decisione esplicita tra scena scalata e layout touch;
- coordinate del combat invarianti fra intro, turno, timing e fine turno.

## Combat master

| Area | Coordinate | Dimensione |
|---|---:|---:|
| Nemico, HP e intenti | 8, 8 | 624×64 |
| Tavolo 3×3 | 8, 80 | 448×224 |
| Diario/scontrino | 464, 80 | 168×224 |
| Unghie e azione | 8, 312 | 624×40 |

I nove hit target sono `144×69` e non cambiano dimensione durante il turno. Il
timing è un overlay a coordinate fisse e non smonta il tavolo sottostante.

## Palette semantica

Ogni direzione può rimappare i pigmenti, ma conserva i ruoli:

| Ruolo | Uso |
|---|---|
| World | sfondo e vuoto |
| Panel 1/2 | superfici della scena |
| Ink | testo primario e bordi strutturali |
| Dim | testo secondario e stato inattivo |
| Enemy/Attack | pericolo e danno |
| Defense | protezione e parata |
| Money | premio, economia e CTA positiva |
| Paper | pelle, carta e highlight non emissivi |

Attacco, difesa e denaro usano sempre anche simbolo, pattern e label:
triangolo/BOTTA, rombo/PARATA, moneta/PREMIO.

## Tipografia

Tiny5 è usato nel laboratorio:

- licenza SIL Open Font License 1.1;
- bitmap a 5 pixel, variabile in larghezza;
- supporto Latin esteso, inclusi accenti italiani ed euro;
- nessun antialias simulato, text-shadow morbido o fallback decorativo.

Prima del pilot verrà verificato il set di glifi direttamente nella build.

## Primitive

- pannelli rettangolari con bordi da 2 o 4 px;
- ombra netta traslata di 4 o 8 px;
- pulsanti con stato focus visibile da 3 px;
- nessun border-radius ornamentale;
- pattern netti e dithering, mai blur o gradienti morbidi;
- icone costruite su silhouette semplici, non emoji di sistema;
- animazioni a step o traslazioni intere.

## Anatomia ticket

1. testata nera `GRATTA E VINCI`;
2. pigmento categoria;
3. pattern categoria leggibile senza colore;
4. area argento `GRATTA`;
5. simbolo grande dopo il reveal;
6. label categoria;
7. titolo commerciale;
8. seriale.

La reference fotografica fornita viene usata soltanto per la grammatica:
blocchi saturi, jackpot, numeri grandi, stelle/burst, griglie e varianti di
formato. Non viene inclusa né copiata.

## Movimento e accessibilità

- timing utilizzabile con click/touch e barra spaziatrice;
- focus visibile su ogni controllo;
- `aria-live` per il messaggio di esito;
- categorie mai affidate al solo colore;
- `prefers-reduced-motion` disattiva sweep e transizioni;
- nessun contenuto essenziale affidato a scanline, rumore o animazione.

## Direzioni proposte

### A — Tabacchi Terminale

Equilibrio consigliato. Mondo carbone/verde sporco, carta crema e ticket
rosso-ciano-giallo. La reference commerciale resta protagonista senza rendere
la scena un casinò generico.

### B — Notte in Sala Giochi

Più teatrale: viola scuro, insegne e contrasto da sala giochi. Offre energia,
ma rischia di riavvicinarsi al neon della V2.

### C — Stampa Fuori Registro

Più materica: marroni, carta e sdoppiamento ciano/rosso. È la proposta più
originale, ma richiede particolare cura per non ridurre la leggibilità.

Raccomandazione: **A come base**, con texture selettive della C sui ticket.

