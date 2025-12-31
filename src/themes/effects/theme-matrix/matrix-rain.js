// ========================================================
// MATRIX RAIN — FILME
// ========================================================

let MATRIX_INSTANCE = null;

function initMatrixRain(selector, options = {}) {
  const container = document.querySelector(selector);
  if (!container) return;

  destroyMatrixRain();

  const {
    fallSpeed = 90,
    wordSpeed = 120,
    fontSize = 24,
    trailOpacity = 1,
    glowStrength = 0.6,
    depthLevels = 4,
    trailSize = 15
  } = options;

  // CHARSET MATRIX
  const katakana =
    'アァカサタナハマヤャラワガザダバパイィキシチニヒミリギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
  const hiragana =
    'あぁかさたなはまやゃらわがざだばぱいぃきしちにひみりぎじぢびぴうぅくすつぬふむゆゅるぐずづぷえぇけせてねへめれげぜでべぺおぉこそとのほもよょろをごぞどぼぽっん';
  const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';

  const chars = (katakana + hiragana + latin + nums).split('');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '0'
  });

  container.appendChild(canvas);

  function resize() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  function randomChar() {
    return chars[Math.floor(Math.random() * chars.length)];
  }

  let columns = [];

  function initColumns() {
    const count = Math.floor(canvas.width / fontSize);

    columns = Array.from({ length: count }, () => {
      const depth = Math.floor(Math.random() * depthLevels);

      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: fallSpeed * (0.6 + Math.random()),
        font: fontSize * (0.85 + Math.random() * 0.4),
        brightness: 0.35 + depth * 0.22,
        lastChange: performance.now(),
        trail: Array.from({ length: trailSize }, randomChar)
      };
    });
  }

  initColumns();

  let lastFrame = performance.now();
  let cleanAccumulator = 0;

  function draw(now) {
    const delta = now - lastFrame;
    lastFrame = now;

    cleanAccumulator += delta;

    // LIMPEZA CONTROLADA (ANTI FLASH VERDÃO)
    ctx.globalCompositeOperation = 'source-over';

    if (cleanAccumulator > 1200) {
      // reset invisível de energia acumulada
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cleanAccumulator = 0;
    } else {
      ctx.fillStyle = `rgba(0, 0, 0, ${trailOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // DESENHO
    columns.forEach(col => {
      if (now - col.lastChange > wordSpeed) {
        col.trail.unshift(randomChar());
        col.trail.pop();
        col.lastChange = now;
      }

      ctx.font = `${col.font}px monospace`;

      col.trail.forEach((char, i) => {
        const y = col.y - i * col.font;
        if (y < 0) return;

        if (i === 0) {
          // LEADING CHAR
          ctx.shadowColor = `rgba(0,255,120,${glowStrength})`;
          ctx.shadowBlur = 12;
          ctx.fillStyle = `rgba(180,255,200,${col.brightness + 0.35})`;
        } else {
          ctx.shadowBlur = 0;
          const alpha = Math.min(
            col.brightness * (1 - i / trailSize),
            0.55
          );
          ctx.fillStyle = `rgba(0,255,100,${alpha})`;
        }

        ctx.fillText(char, col.x, y);
      });

      col.y += (col.speed * delta) / 1000;

      if (col.y - trailSize * col.font > canvas.height) {
        col.y = 0;
        col.x = Math.random() * canvas.width;
        col.speed = fallSpeed * (0.6 + Math.random());
      }
    });

    MATRIX_INSTANCE.raf = requestAnimationFrame(draw);
  }

  MATRIX_INSTANCE = {
    raf: requestAnimationFrame(draw),
    stop() {
      cancelAnimationFrame(this.raf);
      ro.disconnect();
      canvas.remove();
    }
  };

  return MATRIX_INSTANCE;
}

function destroyMatrixRain() {
  if (MATRIX_INSTANCE) {
    MATRIX_INSTANCE.stop();
    MATRIX_INSTANCE = null;
  }
}