// ========================================================
// CYBER GLITCH — TERMINAL BOOT + RED GLITCH
// ========================================================

let CYBER_GLITCH_INSTANCE = null;

function initCyberGlitch(selector, options = {}) {
  const container = document.querySelector(selector);
  if (!container) return;

  destroyCyberGlitch();

  const {
    terminalOffsetY = 250,
    terminalOffsetX = 120,
    terminalBootDuration = 1800,
    glitchIntensity = 0.85,
    glitchSpeed = 110,
    scanlineOpacity = 0.18,
    flickerChance = 0.04,
    mouseInfluence = 0.7,
    redGlitchBootDuration = 900
  } = options;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "0"
  });

  container.appendChild(canvas);

  function resize() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  // STATE
  let phase = "terminal";
  let phaseStart = performance.now();
  let lastGlitch = performance.now();

  // MOUSE
  const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

  window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function mouseFactor() {
    const dx = mouse.x - canvas.width / 2;
    const dy = mouse.y - canvas.height / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const max = Math.max(canvas.width, canvas.height) / 2;
    return 1 - Math.min(dist / max, 1);
  }

  // TERMINAL DATA
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  const passwordLength = 14;
  let typedIndex = 0;

  function randomChar() {
    return charset[Math.floor(Math.random() * charset.length)];
  }

  function drawTerminal() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "18px monospace";
    ctx.fillStyle = "#ff2a2a";

    const baseY = canvas.height / 2 - terminalOffsetY;

    ctx.fillText("> ACCESSING SYSTEM", terminalOffsetX, baseY);
    ctx.fillText("> USER: FELIPE_O_PRATINHA", terminalOffsetX, baseY + 30);

    const pwd = Array.from({ length: passwordLength }, (_, i) =>
      i < typedIndex ? randomChar() : "*"
    ).join("");

    ctx.fillText(`> PASSWORD: ${pwd}`, terminalOffsetX, baseY + 60);

    if (typedIndex >= passwordLength) {
      ctx.fillStyle = "#00ff9c";
      ctx.fillText("> ACCESS GRANTED", terminalOffsetX, baseY + 100);
    }
  }

  // RED GLITCH EFFECT
  const noiseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@";
  const fontSize = 14;

  function drawScanlines(strength) {
    ctx.fillStyle = `rgba(255, 0, 0, ${scanlineOpacity * strength})`;
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 1);
    }
  }

  function drawTextNoise(strength) {
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = `rgba(255, 60, 60, ${0.15 * strength})`;

    const amount = 80 * glitchIntensity * strength;
    for (let i = 0; i < amount; i++) {
      ctx.fillText(
        noiseChars[Math.floor(Math.random() * noiseChars.length)],
        Math.random() * canvas.width,
        Math.random() * canvas.height
      );
    }
  }

  function drawGlitchLines(strength) {
    const slices = Math.floor(10 * glitchIntensity * strength);
    for (let i = 0; i < slices; i++) {
      const y = Math.random() * canvas.height;
      const h = 2 + Math.random() * 8;
      const shift = (Math.random() - 0.5) * 60 * strength;

      ctx.drawImage(
        canvas,
        0,
        y,
        canvas.width,
        h,
        shift,
        y,
        canvas.width,
        h
      );
    }
  }

  // ANIMATION
  function animate(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const elapsed = now - phaseStart;
    let strength = glitchIntensity;

    // TERMINAL
    if (phase === "terminal") {
      drawTerminal();

      if (elapsed > 120 && typedIndex < passwordLength) {
        typedIndex++;
        phaseStart = now;
      }

      if (typedIndex >= passwordLength && elapsed > terminalBootDuration) {
        phase = "red-boot";
        phaseStart = now;
      }
    }

    // RED GLITCH BOOT
    else if (phase === "red-boot") {
      strength = Math.min(elapsed / redGlitchBootDuration, 1) * 2;

      drawScanlines(strength);
      drawTextNoise(strength);
      drawGlitchLines(strength);

      if (elapsed >= redGlitchBootDuration) {
        phase = "red-loop";
        phaseStart = now;
      }
    }

    // RED GLITCH LOOP
    else {
      strength += mouseFactor() * mouseInfluence;

      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawScanlines(strength);
      drawTextNoise(strength);

      if (now - lastGlitch > glitchSpeed / strength) {
        drawGlitchLines(strength);
        lastGlitch = now;
      }

      if (Math.random() < flickerChance * strength) {
        ctx.fillStyle = "rgba(255,0,0,0.18)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    CYBER_GLITCH_INSTANCE.raf = requestAnimationFrame(animate);
  }

  CYBER_GLITCH_INSTANCE = {
    raf: requestAnimationFrame(animate),
    stop() {
      cancelAnimationFrame(this.raf);
      ro.disconnect();
      canvas.remove();
    }
  };

  return CYBER_GLITCH_INSTANCE;
}

function destroyCyberGlitch() {
  if (CYBER_GLITCH_INSTANCE) {
    CYBER_GLITCH_INSTANCE.stop();
    CYBER_GLITCH_INSTANCE = null;
  }
}