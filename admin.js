const REPO_OWNER = "Zoqvera";
const REPO_NAME = "Speak-First-Fix-it-Later";
const CONTENT_PATH = "book-content.js";
const BRANCH = "main";
const DESKTOP_WORDS_PER_PAGE = 500;

const sectionList = document.getElementById("sectionList");
const sectionCount = document.getElementById("sectionCount");
const editorForm = document.getElementById("editorForm");
const sectionIdInput = document.getElementById("sectionId");
const sectionTitleInput = document.getElementById("sectionTitle");
const sectionLabelInput = document.getElementById("sectionLabel");
const sectionTextInput = document.getElementById("sectionText");
const wordCountEl = document.getElementById("wordCount");
const pageEstimateEl = document.getElementById("pageEstimate");
const addSectionButton = document.getElementById("addSection");
const deleteSectionButton = document.getElementById("deleteSection");
const saveLocalButton = document.getElementById("saveLocal");
const githubTokenInput = document.getElementById("githubToken");
const publishButton = document.getElementById("publishButton");
const publishStatus = document.getElementById("publishStatus");

let sections = structuredClone(window.BOOK_CONTENT || []);
let activeIndex = sections.length ? 0 : -1;

function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `secao-${Date.now()}`;
}

function serializeBookContent(data) {
  const rows = data.map(section => {
    const safeText = String(section.text || "")
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$\{/g, "\\${");

    return `  {\n    id: ${JSON.stringify(section.id || "")},\n    title: ${JSON.stringify(section.title || "")},\n    label: ${JSON.stringify(section.label || "")},\n    text: \`${safeText}\`\n  }`;
  });

  return `window.BOOK_CONTENT = [\n${rows.join(",\n")}\n];\n`;
}

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function persistActiveInputs() {
  if (activeIndex < 0 || !sections[activeIndex]) return;
  sections[activeIndex] = {
    id: sectionIdInput.value.trim(),
    title: sectionTitleInput.value.trim(),
    label: sectionLabelInput.value.trim(),
    text: sectionTextInput.value
  };
}

function updateMetrics() {
  const words = countWords(sectionTextInput.value);
  wordCountEl.textContent = `${words.toLocaleString("pt-BR")} palavras`;
  const desktopPages = words ? Math.ceil(words / DESKTOP_WORDS_PER_PAGE) : 0;
  pageEstimateEl.textContent = `${desktopPages} ${desktopPages === 1 ? "página no desktop" : "páginas no desktop"} · paginação adaptativa em telas menores`;
}

function renderSidebar() {
  sectionList.innerHTML = "";
  sectionCount.textContent = `${sections.length} ${sections.length === 1 ? "seção" : "seções"}`;

  sections.forEach((section, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `section-item${index === activeIndex ? " is-active" : ""}`;
    button.innerHTML = `<strong>${escapeHtml(section.title || "Sem título")}</strong><span>${escapeHtml(section.label || section.id || "Sem identificação")}</span>`;
    button.addEventListener("click", () => {
      persistActiveInputs();
      activeIndex = index;
      renderEditor();
      renderSidebar();
    });
    sectionList.appendChild(button);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEditor() {
  const section = sections[activeIndex];
  editorForm.hidden = !section;
  if (!section) return;

  sectionIdInput.value = section.id || "";
  sectionTitleInput.value = section.title || "";
  sectionLabelInput.value = section.label || "";
  sectionTextInput.value = section.text || "";
  updateMetrics();
}

function markDirty() {
  publishStatus.textContent = "Alterações ainda não publicadas.";
  publishStatus.className = "publish-status";
}

[sectionIdInput, sectionTitleInput, sectionLabelInput, sectionTextInput].forEach(input => {
  input.addEventListener("input", () => {
    persistActiveInputs();
    updateMetrics();
    renderSidebar();
    markDirty();
  });
});

addSectionButton.addEventListener("click", () => {
  persistActiveInputs();
  const title = `Nova seção ${sections.length + 1}`;
  sections.push({ id: slugify(title), title, label: "", text: "" });
  activeIndex = sections.length - 1;
  renderSidebar();
  renderEditor();
  sectionTitleInput.focus();
  markDirty();
});

deleteSectionButton.addEventListener("click", () => {
  if (activeIndex < 0) return;
  const section = sections[activeIndex];
  const confirmed = window.confirm(`Excluir “${section.title || "esta seção"}”? Esta ação só será definitiva depois de publicar.`);
  if (!confirmed) return;

  sections.splice(activeIndex, 1);
  activeIndex = Math.min(activeIndex, sections.length - 1);
  renderSidebar();
  renderEditor();
  markDirty();
});

saveLocalButton.addEventListener("click", () => {
  persistActiveInputs();
  localStorage.setItem("sffil-admin-draft", JSON.stringify(sections));
  publishStatus.textContent = "Rascunho salvo neste navegador.";
  publishStatus.className = "publish-status is-success";
});

async function fetchCurrentFile(token) {
  const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONTENT_PATH}?ref=${BRANCH}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Token inválido ou expirado.");
    if (response.status === 403) throw new Error("O token não tem permissão para editar este repositório.");
    throw new Error(`Não foi possível ler o arquivo no GitHub (${response.status}).`);
  }

  return response.json();
}

async function publishToGitHub() {
  persistActiveInputs();
  const token = githubTokenInput.value.trim();

  if (!token) {
    publishStatus.textContent = "Informe um token do GitHub para publicar.";
    publishStatus.className = "publish-status is-error";
    githubTokenInput.focus();
    return;
  }

  publishButton.disabled = true;
  publishStatus.textContent = "Publicando…";
  publishStatus.className = "publish-status";

  try {
    const currentFile = await fetchCurrentFile(token);
    const content = serializeBookContent(sections);

    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONTENT_PATH}`, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: JSON.stringify({
        message: "Atualiza conteúdo do livro pelo painel administrativo",
        content: utf8ToBase64(content),
        sha: currentFile.sha,
        branch: BRANCH
      })
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      throw new Error(details.message || `Falha ao publicar (${response.status}).`);
    }

    localStorage.removeItem("sffil-admin-draft");
    publishStatus.textContent = "Publicado. O GitHub Pages será atualizado em instantes.";
    publishStatus.className = "publish-status is-success";
  } catch (error) {
    publishStatus.textContent = error.message || "Falha ao publicar.";
    publishStatus.className = "publish-status is-error";
  } finally {
    publishButton.disabled = false;
  }
}

publishButton.addEventListener("click", publishToGitHub);

const localDraft = localStorage.getItem("sffil-admin-draft");
if (localDraft) {
  try {
    const parsed = JSON.parse(localDraft);
    if (Array.isArray(parsed) && parsed.length) {
      const restore = window.confirm("Existe um rascunho local não publicado. Deseja restaurá-lo?");
      if (restore) sections = parsed;
    }
  } catch (_) {}
}

renderSidebar();
renderEditor();
