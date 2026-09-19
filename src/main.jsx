import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/tiny5/400.css";
import Grattini from "./scratchlite.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Grattini />
  </React.StrictMode>
);

// Disturbo CRT raro e sincronizzato a un breve "zzzt" analogico. L'audio
// viene creato soltanto dopo la prima interazione, come richiesto dai browser.
let crtAudio;
let crtTimer;

function playCrtNoise() {
  if (!crtAudio || document.hidden) return;
  const duration = 0.18;
  const length = Math.floor(crtAudio.sampleRate * duration);
  const buffer = crtAudio.createBuffer(1, length, crtAudio.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    const envelope = Math.sin(Math.PI * i / length);
    channel[i] = (Math.random() * 2 - 1) * envelope;
  }
  const source = crtAudio.createBufferSource();
  const band = crtAudio.createBiquadFilter();
  const gain = crtAudio.createGain();
  band.type = "bandpass";
  band.frequency.value = 1550;
  band.Q.value = 0.7;
  gain.gain.setValueAtTime(0.0001, crtAudio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.055, crtAudio.currentTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, crtAudio.currentTime + duration);
  source.connect(band).connect(gain).connect(crtAudio.destination);
  source.buffer = buffer;
  source.start();
}

function triggerCrtGlitch() {
  if (!document.hidden) {
    document.documentElement.classList.remove("crt-glitch");
    void document.documentElement.offsetWidth;
    document.documentElement.classList.add("crt-glitch");
    window.setTimeout(() => document.documentElement.classList.remove("crt-glitch"), 600);
    playCrtNoise();
  }
  crtTimer = window.setTimeout(triggerCrtGlitch, 45000 + Math.random() * 15000);
}

function armCrtGlitch() {
  if (crtTimer) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    crtAudio = new AudioContext();
    crtAudio.resume?.();
  }
  crtTimer = window.setTimeout(triggerCrtGlitch, 45000 + Math.random() * 15000);
}

window.addEventListener("pointerdown", armCrtGlitch, { once:true, passive:true });
window.addEventListener("keydown", armCrtGlitch, { once:true });
