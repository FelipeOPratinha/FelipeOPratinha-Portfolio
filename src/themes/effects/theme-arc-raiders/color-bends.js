// ========================================================
// COLOR BENDS — WEBGL VANILLA (ReactBits)
// ========================================================

let COLOR_BENDS_ACTIVE = null;

function initColorBends(selector, opts = {}) {
  const defaults = {
    colors: [],
    rotation: 45,
    speed: 0.2,
    autoRotate: 0,
    scale: 1,
    frequency: 1,
    warpStrength: 1,
    mouseInfluence: 1,
    parallax: 0.5,
    noise: 0,
    colorSharpness: 2.0,
    transparent: true
  };

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width  = Math.floor(container.clientWidth * dpr);
    canvas.height = Math.floor(container.clientHeight * dpr);

    canvas.style.width  = container.clientWidth + "px";
    canvas.style.height = container.clientHeight + "px";

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.canvas, canvas.width, canvas.height);
  }

  const p = { ...defaults, ...opts };
  const container = document.querySelector(selector);
  if (!container) return console.warn("ColorBends: container not found");

  if (COLOR_BENDS_ACTIVE) COLOR_BENDS_ACTIVE.stop();

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  container.appendChild(canvas);

  const gl =
    canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true }) ||
    canvas.getContext("experimental-webgl");

  if (!gl) {
    console.warn("WebGL not supported");
    return;
  }

  // ================= SHADERS =================

  const vertSrc = `
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragSrc = `
    precision highp float;
    #define MAX_COLORS 8

    uniform vec2 uCanvas;
    uniform float uTime;
    uniform float uSpeed;
    uniform vec2 uRot;
    uniform int uColorCount;
    uniform vec3 uColors[MAX_COLORS];
    uniform int uTransparent;
    uniform float uScale;
    uniform float uFrequency;
    uniform float uWarpStrength;
    uniform vec2 uPointer;
    uniform float uMouseInfluence;
    uniform float uParallax;
    uniform float uNoise;
    uniform float uColorSharpness;

    varying vec2 vUv;

    void main() {
      float t = uTime * uSpeed;
      vec2 p = vUv * 2.0 - 1.0;
      p += uPointer * uParallax * 0.1;

      vec2 rp = vec2(
        p.x * uRot.x - p.y * uRot.y,
        p.x * uRot.y + p.y * uRot.x
      );

      vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
      q /= max(uScale, 0.0001);
      q /= 0.5 + 0.2 * dot(q, q);
      q += 0.2 * cos(t) - 7.56;

      vec3 col = vec3(0.0);
      float a = 1.0;

      if (uColorCount > 0) {
        vec2 s = q;
        vec3 sumCol = vec3(0.0);
        float cover = 0.0;

        for (int i = 0; i < MAX_COLORS; i++) {
          if (i >= uColorCount) break;
          s -= 0.01;
          vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
          float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
          float k = clamp(uWarpStrength, 0.0, 1.0);
          float mixK = pow(k, 0.3);
          float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
          vec2 disp = (r - s) * k;
          vec2 warped = s + disp * gain;
          float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
          float m = mix(m0, m1, mixK);
          float w = 1.0 - exp(-6.0 / exp(6.0 * m));
          w = pow(clamp(w, 0.0001, 1.0), uColorSharpness);
          sumCol += uColors[i] * w;
          cover = max(cover, w);
        }

        col = clamp(sumCol, 0.0, 1.0);
        a = uTransparent > 0 ? cover : 1.0;
      }

      if (uNoise > 0.0001) {
        float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898,78.233))) * 43758.5453);
        col += (n - 0.5) * uNoise;
      }

      gl_FragColor = vec4(col * a, a);
    }
  `;

  // ================= COMPILE =================

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
    }
    return s;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(program);
  gl.useProgram(program);

  // ================= GEOMETRY =================

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1,-1, 1,-1, -1,1, 1,1]),
    gl.STATIC_DRAW
  );

  const posLoc = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // ================= UNIFORMS =================

  const U = name => gl.getUniformLocation(program, name);

  const u = {
    canvas: U("uCanvas"),
    time: U("uTime"),
    speed: U("uSpeed"),
    rot: U("uRot"),
    colorCount: U("uColorCount"),
    colors: U("uColors"),
    transparent: U("uTransparent"),
    scale: U("uScale"),
    freq: U("uFrequency"),
    warp: U("uWarpStrength"),
    pointer: U("uPointer"),
    mouse: U("uMouseInfluence"),
    parallax: U("uParallax"),
    noise: U("uNoise"),
    uColorSharpness: U("uColorSharpness")
  };

  function hexToRGB(h) {
    const v = parseInt(h.replace("#",""), 16);
    return [(v>>16&255)/255, (v>>8&255)/255, (v&255)/255];
  }

  const colorData = new Float32Array(8 * 3);
  p.colors.slice(0,8).forEach((c,i)=>{
    colorData.set(hexToRGB(c), i*3);
  });

  gl.uniform3fv(u.colors, colorData);
  gl.uniform1i(u.colorCount, p.colors.length);
  gl.uniform1f(u.speed, p.speed);
  gl.uniform1f(u.scale, p.scale);
  gl.uniform1f(u.freq, p.frequency);
  gl.uniform1f(u.warp, p.warpStrength);
  gl.uniform1f(u.mouse, p.mouseInfluence);
  gl.uniform1f(u.parallax, p.parallax);
  gl.uniform1f(u.noise, p.noise);
  gl.uniform1f(u.uColorSharpness, p.colorSharpness);
  gl.uniform1i(u.transparent, p.transparent ? 1 : 0);

  // ================= INTERACTION =================

  let mx = 0, my = 0;
  container.addEventListener("pointermove", e => {
    const r = container.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width) * 2 - 1;
    my = -(((e.clientY - r.top) / r.height) * 2 - 1);
  });

  function resize() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform2f(u.canvas, canvas.width, canvas.height);
  }

  resizeCanvas();

  const ro = new ResizeObserver(() => {
    resizeCanvas();
  });
  ro.observe(container);

  let start = performance.now();
  let running = true;

  function loop(t) {
    if (!running) return;
    const time = (t - start) / 1000;
    const deg = (p.rotation + p.autoRotate * time) * Math.PI / 180;
    gl.uniform1f(u.time, time);
    gl.uniform2f(u.rot, Math.cos(deg), Math.sin(deg));
    gl.uniform2f(u.pointer, mx, my);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  COLOR_BENDS_ACTIVE = {
    stop() {
      running = false;
      ro.disconnect();
      canvas.remove();
    },
    resize() {
      resizeCanvas();
    }
  };

  return COLOR_BENDS_ACTIVE;
}