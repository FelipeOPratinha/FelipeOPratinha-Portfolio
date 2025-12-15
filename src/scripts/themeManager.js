const themeButton = document.getElementById("themeButton");
const themeDropdown = document.getElementById("themeDropdown");
const themeItems = document.querySelectorAll(".dropdown-item");

// ABRIR / FECHAR DROPDOWN
themeButton.addEventListener("click", () => {
  themeDropdown.classList.toggle("hidden");
});

// APLICAR TEMA
function loadTheme(themeName) {
  const link = document.getElementById("theme-stylesheet");

  // TROCA O ARQUIVO CSS
  link.href = `./src/themes/theme-${themeName}.css`;

  // SALVA A ESCOLHA NO LOCAL STORAGE
  localStorage.setItem("selected-theme", themeName);

  // ATUALIZA O INDICADOR ATIVO
  updateActiveBullet(themeName);

  // REINICIA O VANTA.JS
  requestAnimationFrame(() => {
    setTimeout(() => {
      initVantaSafe();
    }, 1000);
  });
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