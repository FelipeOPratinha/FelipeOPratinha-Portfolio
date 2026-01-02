const openMenu = document.getElementById("openMenu");
const closeMenu = document.getElementById("closeMenu");
const sidebar = document.getElementById("sidebar");

// ABRIR SIDEBAR
openMenu?.addEventListener("click", () => {
  sidebar.style.right = "0px";
});

// FECHAR SIDEBAR
function closeSidebar() {
  sidebar.style.right = "-300px";
}

closeMenu?.addEventListener("click", closeSidebar);

// FECHAR AO CLICAR EM QUALQUER SEÇÃO DO SIDEBAR
const sidebarLinks = sidebar.querySelectorAll("li, a, i");
sidebarLinks.forEach((el) => {
  el.addEventListener("click", () => {
    closeSidebar();
  });
});

// FECHAR AO CLICAR FORA DO SIDEBAR
document.addEventListener("click", (e) => {
  const clickedInsideSidebar = sidebar.contains(e.target);
  const clickedOpenButton = openMenu.contains(e.target);

  if (!clickedInsideSidebar && !clickedOpenButton) {
    closeSidebar();
  }
});

// NAVBAR SCROLL EFFECT
const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("bg-[var(--card-bg)]/70", "backdrop-blur-xl", "py-2");
  } else {
    navbar.classList.remove("bg-[var(--card-bg)]/70", "backdrop-blur-xl", "py-2");
  }
});

// REVEAL NO SCROLL
function revealOnScroll() {
  const reveals = document.querySelectorAll(".reveal");

  for (let i = 0; i < reveals.length; i++) {
    const windowHeight = window.innerHeight;
    const elementTop = reveals[i].getBoundingClientRect().top;
    const revealPoint = -40;

    if (elementTop < windowHeight - revealPoint) {
      reveals[i].classList.add("active");
    } else {
      reveals[i].classList.remove("active");
    }
  }
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("DOMContentLoaded", revealOnScroll);

// SKILL ICONS
function applySkillIcons() {
  document.querySelectorAll(".skill-card").forEach(card => {
    const icon = card.getAttribute("data-icon");
    if (icon) {
      card.style.setProperty("--icon-url", `url('../assets/icons/skill-icons/${icon}.svg')`);
    }
  });
}

applySkillIcons();

//EXPANDIR SKILL CARDS
document.querySelectorAll(".skill-card").forEach(card => {
  card.addEventListener("click", () => {
    card.classList.toggle("open");
  });

  const focus = Number(card.getAttribute("data-focus"));
  const tech = Number(card.getAttribute("data-tech"));
  const desc = card.getAttribute("data-desc");

  const details = document.createElement("div");
  details.classList.add("skill-details");

  details.innerHTML = `
    <div class="skill-detail-row mt-6 mb-2 align-center align-middle">
      <i data-feather="target" class="w-4"></i> Nível de foco
    </div>
    <div class="skill-bullets">
      ${[1,2,3].map(n => `
        <div class="skill-bullet level-${n} ${n <= focus ? "active" : ""}" data-label="${n === 1 ? "Baixo" : n === 2 ? "Intermediário" : "Alto"}"></div>
      `).join("")}
    </div>

    <div class="skill-detail-row" style="margin-top:12px;">
      <i data-feather="bar-chart-2" class="w-4"></i> Nível técnico
    </div>
    <div class="skill-bullets">
      ${[1,2,3].map(n => `
        <div class="skill-bullet level-${n} ${n <= tech ? "active" : ""}" data-label="${n === 1 ? "Baixo" : n === 2 ? "Intermediário" : "Alto"}"></div>
      `).join("")}
    </div>

    <div class="skill-detail-row" style="margin-top:12px;">
      <i data-feather="file-text" class="w-4"></i> Experiência
    </div>
    <p class="skill-desc text-justify">${desc}</p>
  `;

  card.appendChild(details);
});

feather.replace();