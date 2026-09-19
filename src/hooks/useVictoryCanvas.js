import { useState, useRef, useCallback, useEffect } from "react";
import { AudioEngine } from "../audio.js";

export function useVictoryCanvas({ screen }) {
  const [victoryRevealed, setVictoryRevealed] = useState(false);
  const victoryCanvasRef = useRef(null);
  const victoryDrawing = useRef(false);

  useEffect(() => {
    if (screen !== "victory" || victoryRevealed) return;
    const canvas = victoryCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    // Oro a retino 2×2 (niente sfumature), bordo a gradini
    for (let y = 0; y < canvas.height; y += 2) for (let x = 0; x < canvas.width; x += 2) {
      ctx.fillStyle = (x + y) % 4 === 0 ? "#f2cf44" : "#e0b832";
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.fillStyle = "#fff1a8"; ctx.fillRect(0, 0, canvas.width, 3); ctx.fillRect(0, 0, 3, canvas.height);
    ctx.fillStyle = "#b3801f"; ctx.fillRect(0, canvas.height - 3, canvas.width, 3); ctx.fillRect(canvas.width - 3, 0, 3, canvas.height);
    ctx.fillStyle = "#5c3a0c";
    ctx.font = `bold 15px "Courier New"`;
    ctx.textAlign = "center";
    ctx.fillText("✦ GRATTA PER SCOPRIRE IL TUO DESTINO ✦", canvas.width/2, canvas.height/2 - 8);
    ctx.font = `12px "Courier New"`;
    ctx.fillText("[ usa il dito o il cursore ]", canvas.width/2, canvas.height/2 + 30);
  }, [screen, victoryRevealed]);

  const handleVictoryScratch = useCallback((clientX, clientY) => {
    if (victoryRevealed) return;
    const canvas = victoryCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top)  * (canvas.height / rect.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fill();
    AudioEngine.scratch();
    // check % revealed
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transp = 0;
    for (let i = 3; i < data.length; i += 4) { if (data[i] < 128) transp++; }
    if (transp / (canvas.width * canvas.height) > 0.52) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setVictoryRevealed(true);
      AudioEngine.bossEntrance();
    }
  }, [victoryRevealed]);

  return { victoryRevealed, setVictoryRevealed, victoryCanvasRef, victoryDrawing, handleVictoryScratch };
}
