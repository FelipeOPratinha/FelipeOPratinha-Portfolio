const themeButton = document.getElementById("themeButton");
const themeDropdown = document.getElementById("themeDropdown");
const themeItems = document.querySelectorAll(".dropdown-item");

let activeBackground = null;
let activeColorBends = null;

// DESTRUIR EFEITO
function destroyVanta() {
  if (window.vantaEffect) {
    window.vantaEffect.destroy();
    window.vantaEffect = null;
  }

  const el = document.querySelector("#vanta-bg");
  if (!el) return;

  // REMOVE QUALQUER CANVAS QUE O VANTA DEIXOU
  el.querySelectorAll("canvas").forEach(c => c.remove());
}

// ESCOLHE O FUNDO ANIMADO DE ACORDO COM O TEMA
function applyBackgroundEffect(theme) {

  // LIMPA TUDO
  destroyVanta();

  activeBackground = null;

  switch (theme) {

    case "default":
      activeBackground = "vanta";
      setTimeout(initVantaSafe, 500);
      break;

    case "arc-raiders":
      activeBackground = "colorbends";
      activeColorBends = initColorBends("#vanta-bg", {
        colors: ["#5fffff", "#00ff75", "#ffeb00", "#ff0000"],
        rotation: 10,
        speed: 0.5,
        scale: 1,
        frequency: 1,
        warpStrength: 1,
        mouseInfluence: 1,
        parallax: 0.5,
        noise: 0.05,
        colorSharpness: 3.0,
        transparent: true
      });
      break;

    case "cyberpunk":
    case "matrix":
      activeBackground = "static";
      console.warn(`${theme.toUpperCase()} ainda sem efeito definido.`);
      break;
  }
}

function refreshActiveBackground() {
  if (activeBackground === "vanta") {
    initVantaSafe();
  }

  if (activeBackground === "colorbends" && activeColorBends) {
    activeColorBends.resize();
  }
}

let lastDPR = window.devicePixelRatio;

setInterval(() => {
  if (window.devicePixelRatio !== lastDPR) {
    lastDPR = window.devicePixelRatio;

    if (activeBackground === "colorbends" && activeColorBends) {
      activeColorBends.resize();
    }

    if (activeBackground === "vanta") {
      initVantaSafe();
    }
  }
}, 500);

window.addEventListener("resize", () => {
  refreshActiveBackground();
});

// FUNÇÃO PARA PEGAR VARIÁVEIS DO CSS
function getThemeVar(variable) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

// INICIALIZAÇÃO DO VANTA.JS
let vantaEffect = null;

function initVantaSafe() {
  const el = document.querySelector("#vanta-bg");
  if (!el) return;

  // VERIFICA SE CSS DO TEMA CARREGOU
  const bg = getThemeVar("--vanta-bg");
  const color = getThemeVar("--vanta-color");

  // CSS AINDA NÃO APLICADO
  if (!bg || bg.length < 4 || !color || color.length < 4) {
    return setTimeout(initVantaSafe, 500);
  }

  // DESTRUIR EFEITO EXISTENTE
  if (vantaEffect) vantaEffect.destroy();

  // CRIAR NOVO EFEITO
  window.vantaEffect = VANTA.NET({
    el: "#vanta-bg",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200,
    minWidth: 200,

    color: parseInt(color.replace("#", "0x")),
    backgroundColor: parseInt(bg.replace("#", "0x")),
    spacing: parseFloat(getThemeVar("--vanta-spacing")),
    maxDistance: parseFloat(getThemeVar("--vanta-maxdistance")),
  });
}

// LIMPAR VANTA AO FECHAR A PÁGINA
window.addEventListener("beforeunload", () => {
  if (window.vantaEffect) window.vantaEffect.destroy();
});

// ABRIR / FECHAR DROPDOWN
themeButton.addEventListener("click", () => {
  themeDropdown.classList.toggle("hidden");
});

// APLICAR TEMA
function loadTheme(themeName) {
  const link = document.getElementById("theme-stylesheet");

  // MARCA O TEMA NO HTML
  document.documentElement.setAttribute("data-theme", themeName);

  // TROCA O ARQUIVO CSS
  link.href = `./src/themes/theme-${themeName}.css`;

  // SALVA A ESCOLHA NO LOCAL STORAGE
  localStorage.setItem("selected-theme", themeName);

  // ATUALIZA O INDICADOR ATIVO
  updateActiveBullet(themeName);

  setTimeout(() => applyBackgroundEffect(themeName), 1000);
}

// MARCAR O TEMA ATUAL NO DROPDOWN
function updateActiveBullet(activeTheme) {
  themeItems.forEach(item => {
    const bullet = item.querySelector(".bullet");
    const theme = item.getAttribute("data-theme");

    if (theme === activeTheme) {
      bullet.classList.remove("hidden");
      bullet.classList.add("text-[var(--primary)]", "font-bold");
    } else {
      bullet.classList.add("hidden");
      bullet.classList.remove("text-[var(--primary)]", "font-bold");
    }
  });
}

// CLIQUE EM CADA ITEM DO DROPDOWN
themeItems.forEach(item => {
  item.addEventListener("click", () => {
    const theme = item.getAttribute("data-theme");
    loadTheme(theme);
    themeDropdown.classList.add("hidden");
  });
});

// FECHAR DROPDOWN AO CLICAR FORA
document.addEventListener("click", (e) => {
  if (!themeButton.contains(e.target) && !themeDropdown.contains(e.target)) {
    themeDropdown.classList.add("hidden");
  }
});

// CARREGAR O TEMA SALVO
const savedTheme = localStorage.getItem("selected-theme") || "default";

// EVITANDO RENDERIZAÇÃO ANTES DO CSS SER APLICADO
setTimeout(() => {
  loadTheme(savedTheme);
}, 300);