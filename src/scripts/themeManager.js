const themeButton = document.getElementById("themeButton");
const themeDropdown = document.getElementById("themeDropdown");
const themeItems = document.querySelectorAll(".dropdown-item");

// ALTERNAR DROPDOWN DE TEMAS
themeButton.addEventListener("click", () => {
  themeDropdown.classList.toggle("hidden");
});

// CARREGAR TEMA
function loadTheme(themeName) {
  const link = document.getElementById("theme-stylesheet");
  link.href = `./themes/theme-${themeName}.css`;
  localStorage.setItem("selected-theme", themeName);

  updateActiveBullet(themeName);

  // REINICIAR VANTA
  setTimeout(() => {
    initVanta();
  }, 50);
}

// ATUALIZA O INDICADOR NO TEMA ATIVO
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

// CARREGAR TEMA SALVO E SETAR O INDICADOR INICIAL
const savedTheme = localStorage.getItem("selected-theme") || "default";
loadTheme(savedTheme);