import { useState, useEffect } from "react";

// ─── UNA SOLA GRAFICA: IL PALCO DESKTOP ─────────────────────────
// Niente più versione telefono/tablet (richiesta dell'utente): il gioco si
// disegna sempre su un palco di almeno STAGE_MIN_W × STAGE_MIN_H px. Se la
// finestra è più piccola, il palco si rimpicciolisce in proporzione (scale)
// come un videogioco. Su schermi molto alti (telefono in verticale) il palco
// resta al massimo 4:3 e il resto è nero sopra e sotto.
// Tutti i componenti leggono queste misure "virtuali": per loro la larghezza
// è sempre da desktop (vw ≥ 1280), quindi isMobile è sempre false.
export const STAGE_MIN_W = 1280;
export const STAGE_MIN_H = 720;

export function stageMetrics() {
  const rw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const rh = typeof window !== "undefined" ? window.innerHeight : 800;
  const scale = Math.min(1, rw / STAGE_MIN_W, rh / STAGE_MIN_H);
  const w = rw / scale;
  const h = Math.min(rh / scale, w * 0.75);
  return { scale, w, h };
}

export function useIsMobile() {
  const [m, setM] = useState(stageMetrics);

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setM(stageMetrics()));
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return {
    vw: m.w,
    vh: m.h,
    scale: m.scale,
    isMobile: false,
    isPortrait: false,
  };
}
