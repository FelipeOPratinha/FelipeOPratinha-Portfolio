const categorias = [
  { nome: "Coursera", pasta: "coursera", icon: "paperclip" },
  { nome: "Cisco", pasta: "cisco", icon: "paperclip" },
  { nome: "Data Science Academy", pasta: "data-science-academy", icon: "paperclip" },
  { nome: "Intercultural Discussions Brazil x China", pasta: "intercultural-discussions-brazil-and-china", icon: "paperclip" }
];

const certModal = document.getElementById("cert-modal");
const certModalTitle = document.getElementById("cert-modal-title");
const certModalView = document.getElementById("cert-modal-view");
const certModalClose = document.getElementById("cert-modal-close");

// FECHAR MODAL
certModalClose.addEventListener("click", fecharCertModal);
certModal.addEventListener("click", (e) => {
  if (e.target === certModal) fecharCertModal();
});

function fecharCertModal() {
  certModal.classList.add("hidden");
  certModalView.innerHTML = "";
  document.body.style.overflow = "";
}

// GERAR AS PREVIEWS DOS PDFS
async function gerarPreviewPDF(pdfUrl) {
  try {
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    const page = await pdf.getPage(1);

    const scale = 0.5;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    return canvas.toDataURL("image/png");

  } catch (error) {
    console.warn("Preview do PDF falhou, usando fallback:", pdfUrl);
    return "./src/assets/docs/certificados/preview-default.png";
  }
}

// FUNÇÃO PRINCIPAL DE CARREGAMENTO DOS CERTIFICADOS
async function carregarCertificados() {
  const container = document.getElementById("certificados-container");

  for (const categoria of categorias) {

    const jsonPath = `./src/assets/docs/certificados/${categoria.pasta}/index.json`;

    let lista = [];
    try {
      const response = await fetch(jsonPath);
      const data = await response.json();
      lista = data.certificados || [];
    } catch (e) {
      console.warn(`Sem index.json em: ${categoria.pasta}`);
      continue;
    }

    for (let i = 0; i < lista.length; i++) {
      const pdfName = lista[i];
      const caminho = `./src/assets/docs/certificados/${categoria.pasta}/${pdfName}`;

      // GERAR PREVIEW
      const preview = await gerarPreviewPDF(caminho);

      const card = document.createElement("div");
      card.className = "cert-card reveal fade-up glass-card transition cursor-pointer";

      card.innerHTML = `
        <div class="cert-preview mb-4">
          <img src="${preview}" class="cert-img" onerror="this.src='./src/assets/docs/certificados/preview-default.png'">
          <div class="cert-icon">
            <i data-feather="${categoria.icon}" class="w-5"></i>
          </div>
        </div>

        <h3 class="cert-title text-lg font-semibold text-[var(--primary)] mb-2">
          ${categoria.nome} | Certificado ${pdfName.replace(".pdf","")}
        </h3>

        <p class="text-gray-300 opacity-80 text-sm">Clique para visualizar</p>
      `;

      // ABRIR MODAL AO CLICAR NO CARD
      card.addEventListener("click", () => {
        certModal.classList.remove("hidden");
        certModalTitle.textContent = `${categoria.nome} | Certificado ${pdfName.replace(".pdf","")}`;
        document.body.style.overflow = "hidden";

        certModalView.innerHTML = `
          <iframe src="${caminho}" class="w-full h-[80vh] rounded-lg"></iframe>
        `;
      });

      container.appendChild(card);
    }
  }

  feather.replace();
}

carregarCertificados();