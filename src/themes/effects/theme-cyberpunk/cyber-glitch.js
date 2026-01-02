// ========================================================
// CYBER GLITCH — TERMINAL + RED GLITCH + PIRATE SKULL MINIGAME
// ========================================================

let CYBER_GLITCH_INSTANCE = null;
const DEBUG_RADIUS = false;

function initCyberGlitch(selector, options = {}) {
  const container = document.querySelector(selector);
  if (!container) return;
  
  destroyCyberGlitch();
  
  const isMobile = window.matchMedia("(pointer: coarse)").matches;
  const {
    terminalOffsetY = (isMobile ? 250 : 350),
    terminalOffsetX = 40,
    terminalBootDuration = 1800,
    glitchIntensity = 0.85,
    glitchSpeed = 110,
    scanlineOpacity = 0.18,
    mouseInfluence = 0,
    redGlitchBootDuration = 900,
    skullOffsetX = 0,
    skullOffsetY = 40,
    skullScale = (isMobile ? 0.3 : 0.8),
    blinkSpeed = 3200,
    jawSpeed = 1400,
    jawOpenAmount = 14,
    boneLength = 124,
    boneThickness = 8,
    boneAngle = Math.PI / 8,
    avoidSelector = ".hero-card"
  } = options;

  // ===============================
  // CANVAS
  // ===============================
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

  // ===============================
  // VIEWPORT
  // ===============================
  let vw = 0;
  let vh = 0;
  let dpr = 1;

  // ===============================
  // RESIZE / FORBIDDEN ZONE
  // ===============================
  let forbiddenZone = null;

  function updateForbiddenZone() {
    if (!avoidSelector) {
      forbiddenZone = null;
      return;
    }

    const el = document.querySelector(avoidSelector);
    if (!el) {
      forbiddenZone = null;
      return;
    }

    const r = el.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();

    forbiddenZone = {
      x: r.left - c.left,
      y: r.top - c.top,
      w: r.width,
      h: r.height
    };
  }

  function isInsideForbidden(x, y, radius) {
    if (!forbiddenZone) return false;

    return !(
      x + radius < forbiddenZone.x ||
      x - radius > forbiddenZone.x + forbiddenZone.w ||
      y + radius < forbiddenZone.y ||
      y - radius > forbiddenZone.y + forbiddenZone.h
    );
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    vw = Math.max(1, Math.floor(container.clientWidth));
    vh = Math.max(1, Math.floor(container.clientHeight));

    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);

    canvas.style.width = vw + "px";
    canvas.style.height = vh + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    updateForbiddenZone();
  }

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  // ===============================
  // STATE
  // ===============================
  let phase = "terminal";
  let phaseStart = performance.now();
  let lastGlitch = performance.now();

  // ===============================
  // COMBO SYSTEM
  // ===============================
  let combo = 0;
  let comboTimer = 0;
  const COMBO_TIMEOUT = 1200;

  const COMBO_TIERS = [
    { value: 10, color: "#ffffff" },
    { value: 50, color: "#ff2a2a" },
    { value: 100, color: "#ff6b00" },
    { value: 200, color: "#ffaa00" },
    { value: 300, color: "#ffe600" },
    { value: 400, color: "#c8ff00" },
    { value: 500, color: "#6bff00" },
    { value: 1000, color: "#00ff9c" },
    { value: 1500, color: "#00ffd5" },
    { value: 2000, color: "#00e5ff" },
    { value: 3000, color: "#00b7ff" },
    { value: 4000, color: "#008cff" },
    { value: 5000, color: "#0066ff" },
    { value: 10000, color: "#7a5cff" },
    { value: 15000, color: "#9b5cff" },
    { value: 30000, color: "#c45cff" },
    { value: 40000, color: "#ff5ce1" },
    { value: 50000, color: "#ff3bbd" },
    { value: 75000, color: "#ff1f7a" },
    { value: 100000, color: "#ff0000" }
  ];

  function getComboColor(value) {
    let color = "#ffffff";
    for (const tier of COMBO_TIERS) {
      if (value >= tier.value) color = tier.color;
    }
    return color;
  }

  // ===============================
  // SCREEN SHAKE
  // ===============================
  let shakeStrength = 0;

  function applyScreenShake() {
    if (shakeStrength <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * shakeStrength,
      y: (Math.random() - 0.5) * shakeStrength
    };
  }

  // ===============================
  // MULTI SKULL + EXPLOSIONS
  // ===============================
  const skulls = [];
  const explosions = [];
  const TELEPORTS_TO_SPAWN = isMobile ? 5 : 20;

  function getSkullSafeRadius() {
    return (10 + 70 + boneLength / 2) * skullScale;
  }

  function randomSafePosition(radius) {
    while (true) {
      const x = radius + Math.random() * (vw - radius * 2);
      const y = radius + Math.random() * (vh - radius * 2);
      if (!isInsideForbidden(x, y, radius)) return { x, y };
    }
  }

  function createSkull() {
    const r = getSkullSafeRadius();
    const pos = randomSafePosition(r);
    return {
      x: pos.x,
      y: pos.y,
      hovered: false,
      radius: r,
      teleports: 0
    };
  }

  skulls.push(createInitialSkull());

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function isSafePosition(x, y, radius) {
    if (x - radius < 0 || x + radius > vw || y - radius < 0 || y + radius > vh) return false;
    return !isInsideForbidden(x, y, radius);
  }

  function findSafeNear(cx, cy, radius) {
    cx = clamp(cx, radius, vw - radius);
    cy = clamp(cy, radius, vh - radius);
    if (isSafePosition(cx, cy, radius)) return { x: cx, y: cy };

    const stepR = Math.max(16, radius * 0.25);
    const stepA = 18;

    const maxR = Math.max(vw, vh);

    for (let ring = stepR; ring <= maxR; ring += stepR) {
      for (let a = 0; a < 360; a += stepA) {
        const rad = (a * Math.PI) / 180;
        const x = clamp(cx + Math.cos(rad) * ring, radius, vw - radius);
        const y = clamp(cy + Math.sin(rad) * ring, radius, vh - radius);

        if (isSafePosition(x, y, radius)) return { x, y };
      }
    }

    return randomSafePosition(radius);
  }

  function createInitialSkull() {
    const r = getSkullSafeRadius();

    const centerX = vw / 2;
    const centerY = vh / 2;

    const pos = findSafeNear(centerX, centerY, r);

    return {
      x: pos.x,
      y: pos.y,
      hovered: false,
      radius: r,
      teleports: 0
    };
  }

  // ===============================
  // POINTER / MOUSE / TOUCH
  // ===============================
  const mouse = { x: vw / 2, y: vh / 2 };

  function getParallax() {
    if (isMobile) return { px: 0, py: 0 };
    return {
      px: (mouse.x - vw / 2) * 0.05,
      py: (mouse.y - vh / 2) * 0.05
    };
  }

  function getSkullCenter(skull) {
    const { px, py } = getParallax();
    return {
      x: skull.x + skullOffsetX + px,
      y: skull.y + skullOffsetY + py
    };
  }

  function isMouseOverSkull(mx, my, skull) {
    const c = getSkullCenter(skull);
    const dx = mx - c.x;
    const dy = my - c.y;
    return dx * dx + dy * dy <= skull.radius * skull.radius;
  }

  function interactAt(x, y) {
    for (const skull of skulls) {
      if (isMouseOverSkull(x, y, skull)) {
        explosions.push(createExplosion(skull.x, skull.y));

        combo++;
        comboTimer = performance.now();
        if (combo >= 5) shakeStrength = Math.min(combo * 1.2, 14);

        teleportSkull(skull);
        break;
      }
    }
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    skulls.forEach(skull => {
      const over = isMouseOverSkull(mouse.x, mouse.y, skull);

      if (!skull.hovered && over) {
        skull.hovered = true;
        interactAt(mouse.x, mouse.y);
      }

      if (!over) skull.hovered = false;
    });
  }

  function onTouchStart(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;

    mouse.x = x;
    mouse.y = y;

    interactAt(x, y);
  }

  if (!isMobile) {
    window.addEventListener("mousemove", onMouseMove, { passive: true });
  } else {
    window.addEventListener("touchstart", onTouchStart, { passive: true });
  }

  function mouseFactor() {
    if (isMobile) return 0;

    const dx = mouse.x - vw / 2;
    const dy = mouse.y - vh / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const max = Math.max(vw, vh) / 2;
    return 1 - Math.min(dist / max, 1);
  }

  // ===============================
  // TERMINAL / GLITCH
  // ===============================
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  const passwordLength = 14;
  let typedIndex = 0;

  function randomChar() {
    return charset[Math.floor(Math.random() * charset.length)];
  }

  function drawTerminal() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, vw, vh);

    ctx.font = "18px monospace";
    ctx.fillStyle = "#ff2a2a";

    const baseY = vh / 2 - terminalOffsetY;
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

  function drawScanlines(strength) {
    ctx.fillStyle = `rgba(255,0,0,${scanlineOpacity * strength})`;
    for (let y = 0; y < vh; y += 4) {
      ctx.fillRect(0, y, vw, 1);
    }
  }

  function drawTextNoise(strength) {
    ctx.font = "14px monospace";
    ctx.fillStyle = `rgba(255,60,60,${0.15 * strength})`;

    const count = Math.floor(80 * glitchIntensity * strength);
    for (let i = 0; i < count; i++) {
      ctx.fillText(randomChar(), Math.random() * vw, Math.random() * vh);
    }
  }

  function drawGlitchLines(strength) {
    const lines = Math.floor(10 * glitchIntensity * strength);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    for (let i = 0; i < lines; i++) {
      const y = Math.random() * vh;
      const h = 2 + Math.random() * 8;
      const shift = (Math.random() - 0.5) * 60 * strength;

      const yPx = Math.floor(y * dpr);
      const hPx = Math.max(1, Math.floor(h * dpr));
      const shiftPx = Math.floor(shift * dpr);

      ctx.drawImage(
        canvas,
        0,
        yPx,
        canvas.width,
        hPx,
        shiftPx,
        yPx,
        canvas.width,
        hPx
      );
    }

    ctx.restore();
  }

  // ===============================
  // SKULL / EXPLOSION
  // ===============================
  function teleportSkull(skull) {
    const r = getSkullSafeRadius();
    const pos = randomSafePosition(r);
    skull.x = pos.x;
    skull.y = pos.y;

    skull.teleports++;
    if (skull.teleports % TELEPORTS_TO_SPAWN === 0) {
      skulls.push(createSkull());
    }
  }

  function createExplosion(x, y) {
    return {
      x,
      y,
      start: performance.now(),
      duration: 260,
      particles: Array.from({ length: 14 }, () => ({
        angle: Math.random() * Math.PI * 2
      }))
    };
  }

  function drawExplosion(exp, now) {
    let t = (now - exp.start) / exp.duration;
    t = Math.max(0, Math.min(t, 1));
    if (t >= 1) return false;

    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = "rgba(255,0,0,0.9)";
    ctx.lineWidth = 2;

    exp.particles.forEach(p => {
      const dist = t * 80;
      ctx.beginPath();
      ctx.moveTo(exp.x, exp.y);
      ctx.lineTo(exp.x + Math.cos(p.angle) * dist, exp.y + Math.sin(p.angle) * dist);
      ctx.stroke();
    });

    ctx.fillStyle = "rgba(255,0,0,0.15)";
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, Math.max(0.001, t * 60), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return true;
  }

  // ===============================
  // COMBO HUD
  // ===============================
  function drawCombo(now) {
    if (combo <= 0) return;

    const pulse = 1 + Math.sin(now / 120) * 0.1;
    ctx.save();
    ctx.translate((isMobile ? (vw / 20) : (vw / 100)), 100);
    ctx.scale(pulse, pulse);
    ctx.font = "bold italic 24px monospace";
    ctx.fillStyle = getComboColor(combo);
    ctx.fillText(`x${combo.toLocaleString("pt-BR")}`, 0, 0);
    ctx.restore();
  }

  // ===============================
  // DEBUG HITBOX
  // ===============================
  function drawHitbox(skull) {
    if (!DEBUG_RADIUS) return;

    const c = getSkullCenter(skull);

    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, skull.radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,255,255,0.75)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,0,0,0.9)";
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ===============================
  // SKULL DRAW
  // ===============================
  function drawSkull(strength, now, skull) {
    const blink = Math.sin((now / blinkSpeed) * Math.PI * 2) > 0.96 ? 2 : 18;

    const jawOpen =
      (Math.sin((now / jawSpeed) * Math.PI * 2) + 1) * (jawOpenAmount / 2);

    const c = getSkullCenter(skull);

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(skullScale, skullScale);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,80,80,0.85)";
    ctx.fillStyle = "rgba(0,0,0,0.6)";

    ctx.beginPath();
    ctx.ellipse(0, -40, 80, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "rgba(255,0,0,0.9)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "rgba(255,0,0,0.9)";
    ctx.fillRect(-45, -60, 25, blink);
    ctx.fillRect(20, -60, 25, blink);
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.lineTo(-8, -15);
    ctx.lineTo(8, -15);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-55, 10 + jawOpen);
    ctx.lineTo(-35, 55 + jawOpen);
    ctx.lineTo(35, 55 + jawOpen);
    ctx.lineTo(55, 10 + jawOpen);
    ctx.stroke();

    ctx.lineWidth = 1;
    for (let i = -20; i <= 20; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 55 + jawOpen);
      ctx.lineTo(i, 40 + jawOpen);
      ctx.stroke();
    }

    ctx.lineWidth = boneThickness;
    ctx.strokeStyle = "rgba(255,80,80,0.85)";
    ctx.fillStyle = "rgba(255,80,80,0.9)";

    function drawBone(angle) {
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-boneLength / 2, 0);
      ctx.lineTo(boneLength / 2, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-boneLength / 2, 0, boneThickness, 0, Math.PI * 2);
      ctx.arc(boneLength / 2, 0, boneThickness, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(0, 85 + jawOpen);
    drawBone(boneAngle);
    drawBone(-boneAngle);
    ctx.restore();

    ctx.restore();
  }

  // ===============================
  // LOOP
  // ===============================
  function animate(now) {
    const shake = applyScreenShake();
    shakeStrength *= 0.9;

    ctx.setTransform(dpr, 0, 0, dpr, shake.x, shake.y);
    ctx.clearRect(-50, -50, vw + 100, vh + 100);

    if (combo > 0 && now - comboTimer > COMBO_TIMEOUT) {
      combo = 0;
      shakeStrength = 0;
    }

    const elapsed = now - phaseStart;
    let strength = glitchIntensity;

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
    } else if (phase === "red-boot") {
      strength = Math.min(elapsed / redGlitchBootDuration, 1) * 2;
      drawScanlines(strength);
      drawTextNoise(strength);
      drawGlitchLines(strength);

      if (elapsed >= redGlitchBootDuration) {
        phase = "red-loop";
        phaseStart = now;
      }
    } else {
      strength += mouseFactor() * mouseInfluence;

      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, vw, vh);

      drawScanlines(strength);
      drawTextNoise(strength);

      if (!isMobile && now - lastGlitch > glitchSpeed / Math.max(0.001, strength)) {
        drawGlitchLines(strength);
        lastGlitch = now;
      }

      for (let i = explosions.length - 1; i >= 0; i--) {
        if (!drawExplosion(explosions[i], now)) explosions.splice(i, 1);
      }

      skulls.forEach(skull => {
        drawHitbox(skull);
        drawSkull(strength, now, skull);
      });

      drawCombo(now);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CYBER_GLITCH_INSTANCE.raf = requestAnimationFrame(animate);
  }

  // ===============================
  // START / STOP
  // ===============================
  CYBER_GLITCH_INSTANCE = {
    raf: requestAnimationFrame(animate),
    stop() {
      cancelAnimationFrame(this.raf);
      ro.disconnect();

      if (!isMobile) {
        window.removeEventListener("mousemove", onMouseMove);
      } else {
        window.removeEventListener("touchstart", onTouchStart);
      }

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