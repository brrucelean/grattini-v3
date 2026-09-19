import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/tiny5/400.css";
import Grattini from "./scratchlite.jsx";
import { AudioEngine } from "./audio.js";

ReactDOM.createRoot(document.getElementById("root")).render(
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
