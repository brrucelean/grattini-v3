import { useEffect, useState } from "react";
import { AudioEngine } from "../../audio.js";
import { C } from "../../data/theme.js";
import { Tooltip } from "../Tooltip.jsx";
import { SH, edge } from "./shellTokens.js";

const VOLUME_EVENT = "grattini:volume-change";

export function VolumeControl({ compact = false, background = "transparent", borderColor = SH.line }) {
  const [volume, setVolumeState] = useState(AudioEngine.getVolume());

  useEffect(() => {
    const syncVolume = (event) => setVolumeState(event.detail ?? AudioEngine.getVolume());
    window.addEventListener(VOLUME_EVENT, syncVolume);
    return () => window.removeEventListener(VOLUME_EVENT, syncVolume);
  }, []);

  const setVolume = (nextVolume) => {
    AudioEngine.setVolume(nextVolume);
    setVolumeState(AudioEngine.getVolume());
    window.dispatchEvent(new CustomEvent(VOLUME_EVENT, { detail: AudioEngine.getVolume() }));
  };

  const muted = volume === 0;

  return (
    <Tooltip text="🔊 volume musicale — alzalo e GODITI l'8-bit bro">
      <span style={{
        display: "inline-flex", alignItems: "center", gap: compact ? "5px" : "8px", height: "32px",
        padding: compact ? "0 6px" : "0 8px", border: edge(borderColor), background, flexShrink: 0,
      }}>
        <button type="button" onClick={() => setVolume(muted ? 0.7 : 0)}
          aria-label={muted ? "Riattiva audio" : "Disattiva audio"}
          style={{ background: "none", border: "none", padding: 0, color: SH.dim, fontSize: "15px", lineHeight: 1, cursor: "pointer" }}>
          {muted ? "🔇" : volume < 0.4 ? "🔈" : "🔊"}
        </button>
        <input type="range" min="0" max="1" step="0.05" value={volume} aria-label="Volume"
          onChange={(event) => setVolume(parseFloat(event.target.value))}
          style={{ width: compact ? "52px" : "64px", height: "4px", accentColor: C.gold, cursor: "pointer" }} />
      </span>
    </Tooltip>
  );
}
