// ─── FX — eventi visivi di gioco ─────────────────────────────────
// Impatti e power-up avvisano chi disegna (lente liquida, aura…) senza
// conoscerlo. I suoni semantici di audio.js sono già il punto unico di questi
// momenti, quindi è da lì che partono.
//
// kind: "impact" | "powerup" · strength: 0…1.4 (1 = colpo pieno)

const EVT = "grattini:fx";

export function emitFx(kind, strength = 1) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVT, { detail: { kind, strength } }));
}

export function onFx(handler) {
  const fn = (e) => handler(e.detail);
  window.addEventListener(EVT, fn);
  return () => window.removeEventListener(EVT, fn);
}
