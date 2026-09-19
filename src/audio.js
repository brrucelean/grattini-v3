import { prefersReducedMotion } from "./utils/motion.js";

// ─── AUDIO ENGINE ────────────────────────────────────────────
export const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;        // nodo gain globale — volume istantaneo su tutto
  let bgIntervalId = null;
  let switchTimeoutId = null;
  let currentTheme = null;
  let pendingTheme = null;      // tema in attesa nel debounce (fix race A→B→A)
  let masterVolume = 0.7;
  let uiCleanup = null;
  const lastPlayed = new Map();

  const mayPlay = (key, cooldownMs) => {
    const now = performance.now();
    const last = lastPlayed.get(key) || 0;
    if (now - last < cooldownMs) return false;
    lastPlayed.set(key, now);
    return true;
  };

  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  };

  // Pool di buffer di rumore per lo scratch — generato una sola volta invece di
  // riempire ~3500 campioni con Math.random() ad ogni singolo mousemove/touchmove
  // (misurato: 205 GainNode + 12 AudioBuffer creati in 4s di scratch continuo).
  let scratchBufferPool = null;
  const getScratchBuffer = () => {
    const ac = getCtx();
    if (!scratchBufferPool || scratchBufferPool.length === 0 || scratchBufferPool[0].sampleRate !== ac.sampleRate) {
      const bufSize = Math.floor(ac.sampleRate * 0.08);
      scratchBufferPool = Array.from({ length: 6 }, () => {
        const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random()*2-1) * 0.25;
        return buf;
      });
    }
    return scratchBufferPool[Math.floor(Math.random() * scratchBufferPool.length)];
  };

  // Tutti i suoni passano per questo nodo — cambiare gain = volume immediato
  const getMaster = () => {
    const ac = getCtx();
    if (!masterGain || masterGain.context.state === "closed") {
      masterGain = ac.createGain();
      masterGain.gain.value = masterVolume;
      masterGain.connect(ac.destination);
    }
    return masterGain;
  };

  // Suona un tono — il volume individuale è relativo, masterGain gestisce il livello globale
  const playTone = (freq, dur, type="square", vol=0.08, startTime=0) => {
    if (masterVolume === 0) return;
    try {
      const ac = getCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(getMaster());
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ac.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startTime + dur);
      osc.start(ac.currentTime + startTime);
      osc.stop(ac.currentTime + startTime + dur + 0.01);
    } catch(e) {}
  };

  // Zelda-style harp pluck: attacco istantaneo, decay risonante, shimmer all'ottava
  const playHarp = (freq, vol = 0.05, startTime = 0) => {
    if (masterVolume === 0) return;
    try {
      const ac = getCtx();
      const t = ac.currentTime + startTime;
      // Corpo principale — triangle (caldo, armonico)
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "triangle"; osc.frequency.value = freq;
      osc.connect(g); g.connect(getMaster());
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t); osc.stop(t + 0.55);
      // Shimmer ottava — sine tenue, ritardo 40ms (effetto riverbero naturale)
      const osc2 = ac.createOscillator();
      const g2 = ac.createGain();
      osc2.type = "sine"; osc2.frequency.value = freq * 2;
      osc2.connect(g2); g2.connect(getMaster());
      g2.gain.setValueAtTime(0, t + 0.04);
      g2.gain.linearRampToValueAtTime(vol * 0.2, t + 0.06);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc2.start(t + 0.04); osc2.stop(t + 0.55);
    } catch(e) {}
  };

  // Fruscio breve e filtrato. Un solo generatore serve carta, CRT e impatti,
  // ma ogni famiglia ha banda e inviluppo propri: il mix resta coerente.
  const playNoise = ({ duration=.05, volume=.03, frequency=1800, q=.7, type="bandpass", startTime=0 } = {}) => {
    if (masterVolume === 0) return;
    try {
      const ac = getCtx();
      const length = Math.max(1, Math.floor(ac.sampleRate * duration));
      const buffer = ac.createBuffer(1, length, ac.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let i=0; i<length; i++) {
        const env = Math.sin(Math.PI * i / length);
        channel[i] = (Math.random() * 2 - 1) * env;
      }
      const source = ac.createBufferSource(); source.buffer = buffer;
      const filter = ac.createBiquadFilter(); filter.type = type; filter.frequency.value = frequency; filter.Q.value = q;
      const gain = ac.createGain(); const t = ac.currentTime + startTime;
      gain.gain.setValueAtTime(.0001, t);
      gain.gain.exponentialRampToValueAtTime(volume, t + Math.min(.012, duration * .25));
      gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
      source.connect(filter); filter.connect(gain); gain.connect(getMaster());
      source.start(t); source.stop(t + duration + .01);
    } catch {}
  };

  return {
    scratch: () => {
      if (!mayPlay("scratch", 38)) return;
      if (masterVolume === 0) return;
      try {
        const ac = getCtx();
        const src = ac.createBufferSource();
        src.buffer = getScratchBuffer();
        const filt = ac.createBiquadFilter();
        filt.type = "bandpass"; filt.frequency.value = 2500 + Math.random()*2000; filt.Q.value = 0.5;
        const gain = ac.createGain(); gain.gain.value = 0.20;
        src.connect(filt); filt.connect(gain); gain.connect(getMaster());
        src.start(); src.stop(ac.currentTime + 0.09);
      } catch(e) {}
    },
    win: () => {
      [523,659,784,1047].forEach((f,i) => setTimeout(()=>playTone(f,0.3,"square",0.12), i*110));
    },
    lose: () => {
      [330,220,150].forEach((f,i) => setTimeout(()=>playTone(f,0.25,"sawtooth",0.1), i*120));
    },
    // UI tattile: carta/plastica morbida, non bleeps da menu generico.
    hover: () => {
      if (!mayPlay("hover", 85)) return;
      playTone(1180 + Math.random()*90, .018, "sine", .018);
      playNoise({duration:.018, volume:.007, frequency:2800});
    },
    click: () => {
      if (!mayPlay("click", 32)) return;
      playTone(540 + Math.random()*35, .035, "triangle", .055);
      playTone(260, .045, "sine", .025, .008);
      playNoise({duration:.025, volume:.016, frequency:1450});
    },
    nailTap: () => {
      if (!mayPlay("nail", 55)) return;
      const variants = [410, 455, 505, 565];
      const f = variants[Math.floor(Math.random() * variants.length)];
      playTone(f, .032, "triangle", .038);
      playNoise({duration:.018, volume:.012, frequency:900 + Math.random()*350, q:.9});
    },
    cardTap: () => {
      if (!mayPlay("card", 55)) return;
      playNoise({duration:.06, volume:.027, frequency:1150 + Math.random()*260, q:.55});
      playTone(235 + Math.random()*24, .055, "sine", .026);
    },
    itemTap: () => {
      if (!mayPlay("item", 60)) return;
      playTone(760 + Math.random()*65, .035, "triangle", .035);
      playNoise({duration:.028, volume:.014, frequency:2100, q:1.1});
    },
    select: () => {
      playTone(720 + Math.random()*30, .045, "triangle", .045);
      playTone(1080, .055, "sine", .025, .025);
    },
    panelOpen: () => {
      if (!mayPlay("panel", 180)) return;
      playNoise({duration:.09, volume:.022, frequency:1050});
      playTone(190, .11, "sine", .035);
      playTone(430, .07, "triangle", .025, .04);
    },
    transition: () => {
      if (!mayPlay("transition", 260)) return;
      playNoise({duration:.12, volume:.018, frequency:820, q:.5});
      playTone(155, .14, "sine", .025);
    },
    reveal: () => {
      if (!mayPlay("reveal", 75)) return;
      playNoise({duration:.045, volume:.025, frequency:2350});
      playTone(880 + Math.random()*75, .06, "triangle", .04, .015);
    },
    error: () => {
      if (!mayPlay("error", 220)) return;
      playTone(155, .08, "square", .06);
      playTone(112, .10, "sawtooth", .045, .055);
    },
    purchase: () => {
      playNoise({duration:.055, volume:.025, frequency:1900});
      playTone(880, .055, "triangle", .055);
      playTone(1320, .09, "sine", .04, .055);
    },
    crtGlitch: () => {
      if (!mayPlay("crt", 5000)) return;
      playNoise({duration:.18, volume:.055, frequency:1550, q:.7});
      playTone(73, .14, "sawtooth", .018);
    },
    // "Voce" a blip degli NPC mentre il testo si scrive
    talkBlip: (freq) => playTone(freq, 0.04, "square", 0.05),
    // Scatto meccanico della mappa — "slot reel stop"
    mapTick: () => {
      playTone(300, 0.022, "square", 0.11);
      playTone(620, 0.012, "square", 0.05, 0.008);
    },
    dialogueTick: () => playTone(520 + Math.random()*160, 0.018, "square", 0.018),
    cash: () => {
      // Ka-ching! coin drop + register bell
      playTone(1200, 0.06, "square", 0.10);
      playTone(1800, 0.08, "square", 0.08, 0.06);
      playTone(2400, 0.12, "triangle", 0.06, 0.12);
      playHarp(1568, 0.08, 0.10); // G6 shimmer
    },
    // ─── SFX COMBATTIMENTO ─────────────────────────────────────
    heal: () => {
      // Cura: chime caldo ascendente + sparkle — sensazione positiva
      [523, 659, 880].forEach((f, i) => playHarp(f, 0.06, i * 0.07));
      playTone(1760, 0.18, "sine", 0.05, 0.14);
    },
    hitEnemy: () => {
      // Colpo inflitto: impatto secco "thud" + crack corto (diverso dal dolore player)
      playTone(180, 0.07, "square", 0.16);
      playTone(95, 0.13, "sawtooth", 0.13, 0.02);
      if (masterVolume === 0) return;
      try {
        const ac = getCtx();
        const bufSize = Math.floor(ac.sampleRate * 0.05);
        const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.35 * (1 - i / bufSize);
        const src = ac.createBufferSource(); src.buffer = buf;
        const g = ac.createGain(); g.gain.value = 0.5;
        src.connect(g); g.connect(getMaster()); src.start();
      } catch {}
    },
    perfectHit: () => {
      // Colpo PERFETTO: doppio ding brillante + shimmer
      playTone(1320, 0.08, "triangle", 0.12);
      playTone(1980, 0.14, "triangle", 0.09, 0.06);
      playHarp(2637, 0.06, 0.02);
    },
    parry: () => {
      // Parata riuscita: "cling" metallico acuto e corto
      playTone(2400, 0.05, "square", 0.10);
      playTone(3300, 0.10, "triangle", 0.07, 0.03);
      playTone(1600, 0.06, "square", 0.05, 0.01);
    },
    nailCrack: () => {
      // Crack secco + eco quando un'unghia si rompe
      playTone(80, 0.15, "sawtooth", 0.20);
      playTone(60, 0.25, "square", 0.12, 0.08);
      playTone(40, 0.4, "sawtooth", 0.06, 0.15);
    },
    china: () => {
      // Melodia pentatonica cinese — scale Do Re Mi Sol La
      const notes = [523, 587, 659, 784, 880, 784, 659, 523];
      notes.forEach((f, i) => playHarp(f, 0.08, i * 0.15));
      // Gong finale
      playTone(130, 1.5, "triangle", 0.12, notes.length * 0.15);
    },
    bossEntrance: () => {
      // Chord drammatico — minore, pesante
      [130, 156, 196, 262].forEach((f, i) => playTone(f, 0.8, "sawtooth", 0.10, i * 0.08));
      playTone(65, 1.2, "square", 0.08, 0.3); // sub bass
    },
    achievementJingle: () => {
      // 4 note ascendenti brillanti
      [523, 659, 784, 1047].forEach((f, i) => playHarp(f, 0.10, i * 0.12));
      playTone(1047, 0.4, "triangle", 0.06, 0.5); // sustain finale
    },
    scratchVariant: () => {
      // 3 varianti random di grattata
      if (masterVolume === 0) return;
      try {
        const ac = getCtx();
        const dur = 0.06 + Math.random() * 0.04;
        const bufSize = Math.floor(ac.sampleRate * dur);
        const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
        const data = buf.getChannelData(0);
        const pitch = 0.8 + Math.random() * 0.4;
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random()*2-1) * 0.20 * pitch;
        const src = ac.createBufferSource();
        src.buffer = buf; src.connect(getMaster()); src.start();
      } catch {}
    },
    painScream: () => {
      if (masterVolume === 0) return;
      try {
        const ac = getCtx();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain); gain.connect(getMaster());
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(520, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ac.currentTime + 0.55);
        gain.gain.setValueAtTime(0.28, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.65);
        osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.7);
        const bufSize = Math.floor(ac.sampleRate * 0.12);
        const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = (Math.random()*2-1) * 0.5;
        const src = ac.createBufferSource(); src.buffer = buf;
        const ng = ac.createGain();
        ng.gain.setValueAtTime(0.4, ac.currentTime);
        ng.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
        src.connect(ng); ng.connect(getMaster());
        src.start(); src.stop(ac.currentTime + 0.15);
      } catch(e) {}
    },
    // ── Ambient music ─────────────────────────────────────────
    playMusic: (theme) => {
      // Guard doppio: stessa pending O stesso tema già attivo → non ripartire
      if (theme === pendingTheme || (theme === currentTheme && pendingTheme === null)) return;
      pendingTheme = theme;
      clearTimeout(switchTimeoutId);
      switchTimeoutId = setTimeout(() => {
        clearInterval(bgIntervalId); bgIntervalId = null;
        currentTheme = theme;
        pendingTheme = null;
        if (theme) AudioEngine._startTheme(theme);
      }, 180);
    },
    _startTheme: (theme) => {
      // Bug fix: assicura che nessun interval precedente sopravviva (zombie fix)
      clearInterval(bgIntervalId); bgIntervalId = null;

      // ── 6 temi con atmosfera distinta ──────────────────────────
      // Note: tutte le frequenze in Hz, scala temperata
      const T = {
        // ESPLORAZIONE — C pentatonica, 75 BPM, calmo e curioso (mappa, pre-scratch)
        explore: {
          mel: [523,659,784,659, 523,440,392,440, 587,659,523,440, 392,523,440,392],
          har: [329,440,523,440, 329,277,261,277, 392,440,329,277, 261,329,277,261],
          bas: [130,196,130,196, 146,220,146,220],
          mv:0.030, hv:0.013, bv:0.022, t:400,
        },
        // CONCENTRAZIONE — D minore, 90 BPM, leggera tensione (durante la grattata)
        scratch: {
          mel: [587,659,698,659, 587,523,494,523, 587,698,784,698, 659,587,523,494],
          har: [349,392,440,392, 349,311,294,311, 349,440,523,440, 392,349,311,294],
          bas: [146,220,146,220, 123,185,123,185],
          mv:0.028, hv:0.012, bv:0.020, t:333,
        },
        // TABACCHERIA — Sol maggiore, 65 BPM, caldo e commerciale (shop)
        shop: {
          mel: [392,440,494,440, 392,330,294,330, 440,494,523,587, 523,494,440,392],
          har: [196,261,294,261, 196,196,196,196, 261,294,329,392, 329,294,261,220],
          bas: [98,146,98,146, 98,146,98,146],
          mv:0.026, hv:0.012, bv:0.020, t:462,
        },
        // LOCANDA — Fa maggiore, 60 BPM, rilassato e caldo (locanda, riposo)
        locanda: {
          mel: [349,392,440,392, 349,311,261,311, 392,440,523,440, 392,349,311,349],
          har: [220,246,277,246, 220,196,164,196, 246,277,329,277, 246,220,196,220],
          bas: [87,130,87,130, 87,130,87,130],
          mv:0.024, hv:0.011, bv:0.018, t:500,
        },
        // COMBATTIMENTO — La minore, 110 BPM, teso e ritmico (sfide, eventi)
        combat: {
          mel: [440,440,494,523, 440,392,330,349, 440,392,349,330, 294,330,349,392],
          har: [220,220,294,329, 220,196,164,174, 220,196,174,164, 147,164,174,196],
          bas: [110,110,165,110, 110,165,110,110],
          mv:0.036, hv:0.017, bv:0.028, t:272,
        },
        // BOSS — La frigio, 130 BPM, epico e inevitabile (Il Broker)
        boss: {
          mel: [440,392,349,294, 330,349,392,440, 494,440,392,349, 330,294,261,220],
          har: [220,196,174,147, 165,174,196,220, 247,220,196,174, 165,147,130,110],
          bas: [110,110,165,110, 110,146,110,110],
          mv:0.040, hv:0.020, bv:0.030, t:230,
        },
        // 🇨🇳 Quartiere Cinese — pentatonica C-D-E-G-A, arpa lenta, atmosfera zen
        chinaTown: {
          mel: [523,659,784,880,784, 659,523,440, 523,587,659,784, 880,784,659,523],
          har: [261,329,392,440,392, 329,261,220, 261,294,329,392, 440,392,329,261],
          bas: [130,196,130,196, 110,165,110,165],
          mv:0.028, hv:0.012, bv:0.020, t:420,
        },
        // 🐲 Boss Drago d'Oro — pentatonica minore aggressiva
        bossDrago: {
          mel: [440,523,587,659,784, 659,587,523, 440,392,349,440, 523,587,659,784],
          har: [220,261,294,329,392, 329,294,261, 220,196,174,220, 261,294,329,392],
          bas: [110,130,110,146, 110,130,110,98],
          mv:0.045, hv:0.022, bv:0.035, t:200,
        },
      };

      const th = T[theme] || T.explore;
      // La musica è il fondale, non il feedback: -4.7 dB circa rispetto agli
      // SFX. Vale soprattutto per explore, che parte nelle prime schermate.
      const MUSIC_MIX = 0.58;
      let i = 0;
      const step = () => {
        playHarp(th.mel[i % th.mel.length], th.mv * MUSIC_MIX);
        playTone(th.har[i % th.har.length], th.t / 1000 * 0.50, "sine", th.hv * MUSIC_MIX);
        if (i % 2 === 0) playHarp(th.bas[Math.floor(i / 2) % th.bas.length], th.bv * MUSIC_MIX);
        // Sparkle ogni 8 step — solo sui temi calmi (non combat/boss/china)
        if (i % 8 === 0 && (theme === "explore" || theme === "shop" || theme === "locanda" || theme === "chinaTown")) {
          playTone(th.mel[i % th.mel.length] * 2, 0.10, "sine", th.mv * 0.22 * MUSIC_MIX);
        }
        i++;
      };
      step();
      bgIntervalId = setInterval(step, th.t);
    },
    stopMusic: () => {
      clearTimeout(switchTimeoutId); switchTimeoutId = null;
      clearInterval(bgIntervalId); bgIntervalId = null;
      currentTheme = null; pendingTheme = null;
    },
    // Volume: assegnazione diretta — effetto immediato, niente race conditions
    setVolume: (v) => {
      masterVolume = Math.max(0, Math.min(1, v));
      if (masterGain) {
        masterGain.gain.cancelScheduledValues(getCtx().currentTime);
        masterGain.gain.value = masterVolume;
      }
    },
    getVolume: () => masterVolume,
    init: () => { try { getCtx(); } catch(e) {} },
    // Copre anche i molti <button> nativi delle schermate storiche. Hover/focus
    // sono delegati, con cooldown globale: attraversare una griglia non produce
    // una mitragliata. I Btn gestiscono già il proprio click e vengono esclusi.
    bindUI: () => {
      if (uiCleanup || typeof document === "undefined") return uiCleanup;
      const interactive = 'button:not(:disabled), [role="button"], [data-audio-interactive="true"]';
      const unlock = () => AudioEngine.init();
      const over = (e) => {
        if (e.pointerType === "touch") return;
        const el = e.target.closest?.(interactive);
        if (!el || el.contains(e.relatedTarget)) return;
        AudioEngine.hover();
      };
      const focus = (e) => { if (e.target.closest?.(interactive)) AudioEngine.hover(); };
      const down = (e) => {
        unlock();
        const el = e.target.closest?.(interactive);
        if (!el || el.classList.contains("btn-ui")) return;
        const family = el.dataset.audio;
        if (family === "nail") AudioEngine.nailTap();
        else if (family === "card") AudioEngine.cardTap();
        else if (family === "item") AudioEngine.itemTap();
        else AudioEngine.click();
      };
      document.addEventListener("pointerover", over, true);
      document.addEventListener("focusin", focus, true);
      document.addEventListener("pointerdown", down, true);
      document.addEventListener("keydown", unlock, {once:true});
      uiCleanup = () => {
        document.removeEventListener("pointerover", over, true);
        document.removeEventListener("focusin", focus, true);
        document.removeEventListener("pointerdown", down, true);
        uiCleanup = null;
      };
      return uiCleanup;
    },
  };
})();

// ─── PARTICLE SYSTEM (glitter silver dust) ───────────────────
export const ParticleSystem = (() => {
  let canvas = null;
  let ctx = null;
  let particles = [];
  let animId = null;
  const COLORS = ["#c8c8c8","#e8e8e8","#ffffff","#d4af37","#f0f0f0","#fffacd","#aaaaaa","#b8b8b8"];

  const init = () => {
    if (canvas) return;
    canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
  };

  const tick = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.alpha > 0.02);
    for (const p of particles) {
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.018 + Math.random() * 0.012;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      if (p.rect) {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (particles.length > 0) {
      animId = requestAnimationFrame(tick);
    } else {
      animId = null;
    }
  };

  const BLOOD_COLORS = ["#ff0000","#cc0000","#8b0000","#ff2222","#dd0011","#aa0000","#ff4444"];
  const MAX_PARTICLES = 300; // cap — con scratch molto rapido su più celle l'array cresceva senza limite
  return {
    spawn(x, y, count = 10, bloodMode = false) {
      // prefers-reduced-motion: niente coriandoli/glitter. È un layer puramente
      // decorativo su canvas, quindi il CSS non può spegnerlo: va fermato qui.
      if (prefersReducedMotion()) return;
      init();
      const palette = bloodMode ? BLOOD_COLORS : COLORS;
      for (let i = 0; i < count; i++) {
        const rect = Math.random() > 0.4;
        particles.push({
          x: x + (Math.random() - 0.5) * 24,
          y: y + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 4.5,
          vy: -(Math.random() * 3 + 1),
          gravity: 0.08 + Math.random() * 0.1,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.25,
          color: palette[Math.floor(Math.random() * palette.length)],
          alpha: 0.85 + Math.random() * 0.15,
          rect,
          w: rect ? Math.random() * 5 + 2 : 0,
          h: rect ? Math.random() * 3 + 1 : 0,
          r: rect ? 0 : Math.random() * 2 + 1,
        });
      }
      // Le più vecchie sono anche le più sbiadite (alpha più basso) — rimuoverle
      // per prime è il taglio meno visibile.
      if (particles.length > MAX_PARTICLES) {
        particles.splice(0, particles.length - MAX_PARTICLES);
      }
      if (!animId) animId = requestAnimationFrame(tick);
    },
  };
})();
