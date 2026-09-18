# V3 asset recreation manifest

Status: approved scope. Replace every one of the **163 original raster assets** with purpose-built V3 pixel art. The generated hand experiment is not part of the production scope; the existing finger/nail interaction remains. The complete scratch-ticket family is the first production priority; principal characters are deliberately last.

## Production rules

- Create a new sibling asset first (`*-v3.png`); never overwrite the V2 source before visual approval.
- Characters are true low-resolution indexed sprites, normally 64×96 with 24 colors maximum.
- Nails, cursors and HUD objects use fixed native pixel canvases and nearest-neighbor scaling.
- Scenes are newly composed pixel-art environments, not pixel filters over the old images.
- Tickets preserve every original mechanic and grid but receive new printed artwork, iconography and scratch surfaces.
- Validate each family inside the real game before replacing the next family.

## 1. Characters and map sprites — 24

`anziana`, `bambino`, `boss`, `chirurgo`, `drago`, `evento`, `guantaio`, `ladro`, `locanda`, `macellaio`, `maestroTe`, `mendicante`, `miniboss`, `napoletano`, `poliziotto`, `romanaccio`, `sacerdote`, `spacciatore`, `start`, `streamer`, `stregone`, `tabaccaio`, `vecchio`, `zaino`.

The Tabaccaio is the first style anchor and already has a non-destructive V3 sibling.

## 2. Nail-state sprites — 9

`graffiata`, `kawaii`, `marcia`, `morta`, `piede`, `polliceVerde`, `sana`, `sanguinante`, `unghiaNera`.

## 3. Cursor/finger sprites — 24

Nine finger cursors matching the nail states above, plus fifteen held-item cursors:

`bottone`, `bullone`, `chiaveOttone`, `coltelloAffilato`, `discoRotto`, `fasciaPolso`, `gettoneLavaggio`, `guantoBoss`, `guantoFerro`, `monetaCinese`, `moneta_argento`, `moneta_oro`, `plettro`, `portaChiavi`, `unghiaFinta`.

## 4. Items and equipment — 40

`baddie`, `bottone`, `bullone`, `cappelloSbirro`, `cerotto`, `chiaveOttone`, `clipVirale`, `coltelloAffilato`, `cornetto`, `cremaRinforzante`, `dadoTruccato`, `discoRotto`, `disinfettante`, `fasciaPolso`, `ferro`, `gettoneLavaggio`, `giornalettoPorno`, `guantoBoss`, `guantoFerro`, `malocchio`, `manekiNeko`, `manoProtesica`, `marcione`, `monetaCinese`, `moneta_argento`, `moneta_oro`, `neonato`, `occhioTigre`, `oro`, `plastica`, `plettro`, `portaChiavi`, `sacra`, `sieroRicrescita`, `sigaretta`, `sigarettaErba`, `smalto`, `tesseraVIP`, `timbroVincente`, `unghiaFinta`.

## 5. HUD — 9

`cappello`, `clip`, `fortuna`, `grattamania`, `grattino`, `hp`, `soldi`, `tumore`, `zaino`.

## 6. Combat category assets — 3

`combattimento`, `denaro`, `difesa`.

These will follow the approved large redundant symbols and remain recognizable without text or color.

## 7. Ticket thumbnails — 17

`boccaDrago`, `doppioOnulla`, `fintoMilionario`, `fortunaFlash`, `grattaCombina`, `jackpotMix`, `labirinto`, `mahjong`, `maledetto`, `mappaTesor0`, `miliardario`, `portaFortuna`, `puzzle`, `ruota`, `setteEMezzo`, `tredici`, `turistaPerSempre`.

Progress: complete. All seventeen V3 ticket artworks supply their live shop, gallery and gameplay thumbnails.

## 8. Full ticket artwork — 18

The seventeen named tickets above plus `_template`. Each ticket keeps its unique grid and win logic.

Progress: all seventeen named tickets completed and integrated. Every original grid, cost, maximum prize, special mechanic and win rule is unchanged. The legacy `_template` remains only as a fallback source and is no longer shown by any completed V3 ticket.

## 9. Rooms — 5

`bettola`, `cameramedia`, `kawaii`, `perterra`, `suite`.

## 10. Full-screen scenes — 11

Four biome scenes plus `cella`, `combat`, `gameover`, `locanda`, `shop`, `title`, `victory`.

## 11. Shared/environment assets — 3

`bezel-crt`, `tex-gold`, `misc-nograttino`.

## Recommended production order

1. Common ticket template, scratch material and ASMR scratch interaction.
2. All seventeen full ticket families and their seventeen thumbnails, one mechanic at a time.
3. Nail states and finger cursors.
4. Combat category assets and combat scene.
5. Four biome scenes and supporting map elements.
6. Items, equipment and held-item cursors.
7. Shop/inn rooms, remaining scenes and meta/HUD assets.
8. All map characters, with Tabaccaio, Sacerdote, Ladro and Boss completed last.
