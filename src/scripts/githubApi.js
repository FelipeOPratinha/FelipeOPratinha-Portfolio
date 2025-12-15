const modal = document.getElementById("project-modal");
const modalTitle = document.getElementById("modal-title");
const modalMedia = document.getElementById("modal-media");
const modalClose = document.getElementById("modal-close");

modalClose.addEventListener("click", () => {
  modal.classList.add("hidden");
  modalMedia.innerHTML = "";
  document.body.style.overflow = "";
});

// FECHAR MODAL AO CLICAR FORA
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
    modalMedia.innerHTML = "";
    document.body.style.overflow = "";
  }
});

async function carregarRepos() {
  const resposta = await fetch("https://api.github.com/users/FelipeOPratinha/repos");
  const repos = await resposta.json();

  const projetos = repos.filter(repo =>
    ["Me-Chame-Ja-LES", "Mogi-AgroMapa"].includes(repo.name)
  );

  const container = document.getElementById("repos-container");

  for (const repo of projetos) {
    
    // PERCENTUAIS DE LINGUAGENS
    const langs = await fetch(repo.languages_url).then(r => r.json());
    const total = Object.values(langs).reduce((a,b)=>a+b, 0);

    const porcentagens = Object.entries(langs).map(([lang, value]) => ({
      nome: lang,
      percent: ((value / total) * 100).toFixed(1) + "%"
    }));

    // CARREGAR ARQUIVO index.json DO PROJETO
    const jsonPath = `./src/assets/images/projetos/${repo.name}/index.json`;

    let listaImgs = [];
    let listaVids = [];

    try {
      const response = await fetch(jsonPath);
      const data = await response.json();

      listaImgs = data.img || [];
      listaVids = data.vid || [];

    } catch (e) {
      console.warn(`Sem index.json em: ${repo.name}`);
    }

    const card = document.createElement("div");
    card.className = "project-card";

    card.innerHTML = `
      <div class="project-carousel" data-index="0">

        ${listaImgs.map(src =>
          `<img src="./src/assets/images/projetos/${repo.name}/img/${src}"
                class="carousel-img"
                onerror="this.style.display='none'">`
        ).join("")}

        <button class="carousel-btn left">
          <div class="flex self-center"><i data-feather="chevrons-left" class="w-5"></i></div>
        </button>
        <button class="carousel-btn right">
          <div class="flex self-center"><i data-feather="chevrons-right" class="w-5"></i></div>
        </button>
      </div>

      <div class="project-content">
        <h3 class="project-title">${repo.name}</h3>

        <p class="project-desc text-justify">${repo.description || "Sem descrição"}</p>

        <div class="project-techs">
          ${porcentagens.map(p => `
            <span class="tech-tag" data-percent="${p.percent}">
              ${p.nome}
            </span>
          `).join("")}
        </div>

        <div class="flex justify-end mt-4">
          <a href="${repo.html_url}" class="project-link py-3 px-4 hover:text-[var(--text-color)] hover:bg-[var(--bg-color-github)] rounded-lg transition cursor-pointer" target="_blank">Ver no GitHub →</a>
        </div>
      </div>
    `;
    
    container.appendChild(card);

    feather.replace();

    // SISTEMA DE CARROSSEL
    const carousel = card.querySelector(".project-carousel");
    const imgs = carousel.querySelectorAll(".carousel-img");
    let index = 0;

    function mostrarImagem(i) {
      imgs.forEach(img => img.classList.remove("active"));
      if (imgs[i]) imgs[i].classList.add("active");
    }

    mostrarImagem(0);

    // BOTÃO ESQUERDA
    carousel.querySelector(".left").addEventListener("click", () => {
      index = (index - 1 + imgs.length) % imgs.length;
      mostrarImagem(index);
    });

    // BOTÃO DIREITA
    carousel.querySelector(".right").addEventListener("click", () => {
      index = (index + 1) % imgs.length;
      mostrarImagem(index);
    });

    // AUTO PLAY AO PASSAR O MOUSE
    let interval = null;

    // INICIAR AUTO-PLAY
    function startAutoplay() {
      if (interval) return;
      interval = setInterval(() => {
        index = (index + 1) % imgs.length;
        mostrarImagem(index);
      }, 5000);
    }

    // PARAR AUTO-PLAY E VOLTAR PARA PRIMEIRA IMAGEM
    function stopAutoplay() {
      clearInterval(interval);
      interval = null;
      index = 0;
      mostrarImagem(0);
    }

    // EVENTOS DE MOUSE
    card.addEventListener("mouseenter", startAutoplay);
    card.addEventListener("mouseleave", stopAutoplay);

    // ABRIR MODAL AO CLICAR NO TÍTULO
    card.querySelector(".project-title").addEventListener("click", (e) => {
      e.stopPropagation();
      modal.classList.remove("hidden");
      modalTitle.textContent = repo.name;
      document.body.style.overflow = "hidden";

      let html = "";

      // PRIMEIRO CARREGA OS VÍDEOS
      if (listaVids.length > 0) {
        listaVids.forEach(video => {
          html += `
            <video controls class="mb-4 w-full rounded-lg shadow-lg">
              <source src="./src/assets/images/projetos/${repo.name}/vid/${video}" type="video/mp4">
              Seu navegador não suporta vídeos.
            </video>
          `;
        });
      } else {
        // MOSTRAR IMAGEM PADRÃO QUANDO NÃO EXISTE VÍDEO
        html += `
          <div class="modal-img-wrapper mb-4">
            <img src="./src/assets/images/projetos/${repo.name}/vid/preview-default.png" class="modal-img cert-img opacity-80">
          </div>
        `;
      }

      // DEPOIS CARREGA AS IMAGENS
      listaImgs.forEach(img => {
        html += `
          <div class="modal-img-wrapper mb-4">
            <img src="./src/assets/images/projetos/${repo.name}/img/${img}" onerror="this.style.display='none'" class="modal-img" />
            <button class="img-full-btn"><i data-feather="maximize-2" class="w-5"></i></button>
          </div>
        `;
      });

      modalMedia.innerHTML = html;

      feather.replace();

      // AJUSTAR BOTÃO DE TELA CHEIA
      setTimeout(() => {
        const btns = modalMedia.querySelectorAll(".img-full-btn");
        const imgs = Array.from(modalMedia.querySelectorAll(".modal-img"))
          // IGNORAR IMAGEM preview-default.png
          .filter(img => !img.src.includes("preview-default.png"));

        btns.forEach((btn, i) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();

            const img = imgs[i];
            if (!img) return;

            if (img.requestFullscreen) img.requestFullscreen();
            else if (img.webkitRequestFullscreen) img.webkitRequestFullscreen();
            else if (img.msRequestFullscreen) img.msRequestFullscreen();
          });
        });
      }, 50);
    });

  }
}

carregarRepos();