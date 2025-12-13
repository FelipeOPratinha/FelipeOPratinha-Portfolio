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

    // CARROUSSEL DE IMAGENS
    const imagens = [
      `./assets/images/projetos/${repo.name}/img/1.png`,
      `./assets/images/projetos/${repo.name}/img/2.png`,
      `./assets/images/projetos/${repo.name}/img/3.png`
    ];

    const card = document.createElement("div");
    card.className = "project-card";

    card.innerHTML = `
      <div class="project-carousel" data-index="0">
        ${imagens.map(src => `<img src="${src}" class="carousel-img" onerror="this.style.display='none'">`).join("")}

        <button class="carousel-btn left"><div class="flex self-center"><i data-feather="chevrons-left" class="w-5"></i></div></button>
        <button class="carousel-btn right"><div class="flex self-center"><i data-feather="chevrons-right" class="w-5"></i></div></button>
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

    // MOSTRAR PRIMEIRA IMAGEM INICIALMENTE
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

    // AUTO PLAY DAS IMAGENS
    setInterval(() => {
      index = (index + 1) % imgs.length;
      mostrarImagem(index);
    }, 10000);

    // ABRIR MODAL AO CLICAR NO TÍTULO
    card.querySelector(".project-title").addEventListener("click", (e) => {
      e.stopPropagation();
      modal.classList.remove("hidden");
      modalTitle.textContent = repo.name;
      document.body.style.overflow = "hidden";

      // CAMINHOS DAS MÍDIAS
      const imagensGrandes = [
        `./assets/images/projetos/${repo.name}/img/1.png`,
        `./assets/images/projetos/${repo.name}/img/2.png`,
        `./assets/images/projetos/${repo.name}/img/3.png`
      ];

      const videos = [
        `./assets/images/projetos/${repo.name}/vid/1.mp4`
      ];

      // CRIAR HTML DAS MÍDIAS
      let html = "";

      // INSERIR VÍDEOS PRIMEIRO
      videos.forEach(video => {
        html += `
          <video controls class="mb-4">
            <source src="${video}" type="video/mp4">
            Seu navegador não suporta vídeos.
          </video>
        `;
      });

      // LOGO DEPOIS INSERIR AS IMAGENS
      imagensGrandes.forEach(img => {
        html += `
          <div class="modal-img-wrapper mb-4">
            <img src="${img}" onerror="this.style.display='none'" class="modal-img" />

            <button class="img-full-btn"><i data-feather="maximize-2" class="w-5"></i></button>
          </div>
        `;
      });

      modalMedia.innerHTML = html;

      // ATIVANDO ICONES NO MODAL
      feather.replace();

      // ATIVANDO BOTÃO DE TELA CHEIA NAS IMAGENS
      setTimeout(() => {
        const btns = modalMedia.querySelectorAll(".img-full-btn");
        const imgs = modalMedia.querySelectorAll(".modal-img");

        btns.forEach((btn, i) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const img = imgs[i];

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