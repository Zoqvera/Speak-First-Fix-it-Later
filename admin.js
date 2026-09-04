const LOCAL_CONTENT_KEY = "sffil-local-book-content";
const DRAFT_KEY = "sffil-admin-draft";

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
const publishButton = document.getElementById("publishButton");
const publishStatus = document.getElementById("publishStatus");

function loadInitialSections() {
  try {
    const applied = JSON.parse(localStorage.getItem(LOCAL_CONTENT_KEY) || "null");
    if (Array.isArray(applied) && applied.length) return applied;
  } catch (_) {}
  return structuredClone(window.BOOK_CONTENT || []);
}

let sections = loadInitialSections();
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
  pageEstimateEl.textContent = "Paginação adaptativa conforme a tela";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  publishStatus.textContent = "Alterações ainda não aplicadas ao leitor.";
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
  const confirmed = window.confirm(`Excluir “${section.title || "esta seção"}”?`);
  if (!confirmed) return;

  sections.splice(activeIndex, 1);
  activeIndex = Math.min(activeIndex, sections.length - 1);
  renderSidebar();
  renderEditor();
  markDirty();
});

saveLocalButton.addEventListener("click", () => {
  persistActiveInputs();
  localStorage.setItem(DRAFT_KEY, JSON.stringify(sections));
  publishStatus.textContent = "Rascunho salvo neste navegador.";
  publishStatus.className = "publish-status is-success";
});

publishButton.addEventListener("click", () => {
  persistActiveInputs();
  localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(sections));
  localStorage.removeItem(DRAFT_KEY);
  publishStatus.textContent = "Alterações aplicadas. Ao abrir ou atualizar o livro neste navegador, o novo texto será usado.";
  publishStatus.className = "publish-status is-success";
});

const localDraft = localStorage.getItem(DRAFT_KEY);
if (localDraft) {
  try {
    const parsed = JSON.parse(localDraft);
    if (Array.isArray(parsed) && parsed.length) {
      const restore = window.confirm("Existe um rascunho local. Deseja restaurá-lo?");
      if (restore) sections = parsed;
    }
  } catch (_) {}
}

renderSidebar();
renderEditor();
