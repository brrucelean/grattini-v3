# Visual direction decision

Status: approved by the user on 2026-09-18.

## Locked direction

Use one visual language across the whole game: **Tabacchi Terminale** structure with the imperfect print texture of **Stampa Fuori Registro**. The previous A/B/C color-only comparison is retired.

The canonical visual reference is the original Combat Style Lab preserved by
the Git tag `combat-pilot-approved`. Its geometry and restraint are binding,
not merely inspirational:

- logical presentation frame based on 640×360 and an 8 px grid;
- flat charcoal/black panels with cream outlines and hard offset shadows;
- functional red/cyan/yellow accents on a restrained violet support color;
- compact information strips, ticket grids and receipt-like side panels;
- no glass cards, soft gradients, ornamental rounding, bloom or generic neon;
- new screens must translate their content into this grammar instead of
  decorating the legacy V2 layout.

## Non-negotiable interaction principles

- Preserve the existing game rules and screen structure unless a change is explicitly approved.
- Preserve every existing dialogue, exclusive, top news item and ticker, gimmick, scratch grid, symbol set, winner and outcome. Migration changes their presentation, not their existence or meaning.
- Scratching is a physical interaction, not a click-to-reveal shortcut.
- Every combat cell shows a large, redundant category sign before scratching:
  - `▲` = botta;
  - `◆` = parata;
  - `€` = premio.
- Category recognition never depends on small text or color alone.
- Scratch audio follows pointer movement; reveals and rewards have short, distinct confirmation sounds.
- The scratch brush is broad, continuous and interpolated between pointer events so the foil disappears evenly instead of leaving dotted holes.
- Audio should feel dry, papery and close-miked rather than sharp or metallic.
- The player must be able to reveal by keyboard as an accessible equivalent.
- Visual effects must reinforce tactile satisfaction without moving the combat grid.
- The five nails remain individually selectable. The active fingertip/nail is visible as the real pixel-art cursor; a separate full-hand illustration is not required and must not replace the original interaction.
- The overall art direction may be more overtly gambling-oriented—jackpot signage, prize-board hierarchy, printed ticket ornament—but must retain the DOS/PICO-8 pixel discipline and avoid soft casino gradients.

## Rollout

Apply this system to every screen in small presentation-only slices. Keep gameplay, balance, copy, and progression separate from the visual migration.
