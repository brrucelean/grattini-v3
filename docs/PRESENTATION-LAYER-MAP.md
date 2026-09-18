# Mappa preliminare del presentation layer V2

## Flusso

```text
stato globale e navigazione
  src/scratchlite.jsx
        ↓
controller/hook di dominio
  useNodeHandlers, useScratchHandlers, useShopHandlers,
  useEventHandlers, useNailHandlers, useItemHandlers
        ↓
view
  CombatView, ScratchCardView, MapView, ShopView, EventView
        ↓
primitive
  Btn, HUD, NailSidebar, TicketHeader, TicketThumb,
  ScratchCell, DialogueBox, Tooltip
        ↓
token, animazioni e asset
  theme.js, styles.js, animations.js, registry.js,
  WEBP/PNG, ASCII, emoji, WebAudio
```

## Dimensioni e accoppiamenti principali

| Modulo | Righe | Stili inline osservati | Rischio |
|---|---:|---:|---|
| `scratchlite.jsx` | 4.284 | 532 | routing, stato, shell e numerose schermate inline |
| `ScratchCardView.jsx` | 1.404 | 122 | scratch, regole, canvas, feedback e rendering |
| `CombatView.jsx` | 1.175 | 76 | controller combat, timing, audio, particelle e view |
| `ShopView.jsx` | 939 | 72 | generazione offerta e catalogo accoppiati |
| `MapView.jsx` | 829 | 46 | geometria responsive e rendering nodi accoppiati |
| `EventView.jsx` | 815 | 41 | contenuti, stato locale e composizione NPC |

## Confine proposto per il pilot

```text
CombatController
  stato del turno, comandi, esiti deterministici, callback V2
        ↓ contratto esplicito
CombatScene
  geometria fissa 640×360 e sole primitive V3
        ↓
Pixel primitives + sprite originali
```

Non è previsto un grande refactor preventivo. Il controller verrà estratto solo
quanto basta per rendere la nuova scena sostituibile e confrontabile.

