import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/tiny5/400.css";
import Grattini from "./scratchlite.jsx";
import { AudioEngine } from "./audio.js";

// #root non deve mai scorrere (vedi overflow:clip in index.html): riserva per
// i browser senza "clip", dove il focus di un pulsante lo spostava di lato.
const rootEl = document.getElementById("root");
rootEl.addEventListener("scroll", () => { rootEl.scrollLeft = 0; rootEl.scrollTop = 0; }, { passive: true });

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <Grattini />
  </React.StrictMode>
);

// Disturbo CRT raro e sincronizzato a un breve "zzzt" analogico. L'audio
// viene creato soltanto dopo la prima interazione, come richiesto dai browser.
let crtTimer;

function triggerCrtGlitch() {
  if (!document.hidden) {
    document.documentElement.classList.remove("crt-glitch");
    void document.documentElement.offsetWidth;
    document.documentElement.classList.add("crt-glitch");
    window.setTimeout(() => document.documentElement.classList.remove("crt-glitch"), 600);
    AudioEngine.crtGlitch();
  }
  crtTimer = window.setTimeout(triggerCrtGlitch, 45000 + Math.random() * 15000);
}

function armCrtGlitch() {
  if (crtTimer) return;
  AudioEngine.init();
  crtTimer = window.setTimeout(triggerCrtGlitch, 45000 + Math.random() * 15000);
}

window.addEventListener("pointerdown", armCrtGlitch, { once:true, passive:true });
window.addEventListener("keydown", armCrtGlitch, { once:true });
