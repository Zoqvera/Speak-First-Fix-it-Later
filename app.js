const WORDS_PER_PAGE = 320;
const TIMER_SECONDS = 5 * 60;
const TIMER_STORAGE_KEY = "sffil-global-timer";

const bookEl = document.getElementById("book");
const pageEl = document.getElementById("page");
const pageContentEl = document.getElementById("pageContent");
const pageLabelEl = document.getElementById("pageLabel");
const pageNumberEl = document.getElementById("pageNumber");
const timerEl = document.getElementById("timer");
const prevButton = document.getElementById("prevPage");
const nextButton = document.getElementById("nextPage");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const toc = document.getElementById("toc");
const tocButton = document.getElementById("tocButton");
const closeTocButton = document.getElementById("closeToc");
const tocList = document.getElementById("tocList");
const overlay = document.getElementById("overlay");

let pages = [];
let currentPage = Number(localStorage.getItem("sffil-current-page") || 0);
let timerInterval = null;
let timerState = loadTimerState();

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function sectionToWordStream(section) {
  const paragraphs = section.text
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);

  const stream = [];

  paragraphs.forEach((paragraph, index) => {
    paragraph.split(/\s+/).forEach(word => stream.push({ type: "word", value: word }));
    if (index < paragraphs.length - 1) stream.push({ type: "paragraph-break" });
  });

  return stream;
}

function chunkSection(section) {
  const stream = sectionToWordStream(section);
  const sectionPages = [];
  let currentTokens = [];
  let currentWordCount = 0;

  const flushPage = () => {
    if (!currentTokens.length) return;

    let text = "";
    currentTokens.forEach(token => {
      if (token.type === "paragraph-break") {
        text = text.trimEnd() + "\n\n";
      } else {
        text += `${token.value} `;
      }
    });

    sectionPages.push(text.trim());
    currentTokens = [];
    currentWordCount = 0;
  };

  stream.forEach(token => {
    if (token.type === "paragraph-break") {
      currentTokens.push(token);
      return;
    }

    currentTokens.push(token);
    currentWordCount += 1;

    if (currentWordCount === WORDS_PER_PAGE) flushPage();
  });

  flushPage();

  return sectionPages.map((text, sectionPageIndex) => ({
    sectionId: section.id,
    sectionTitle: section.title,
    sectionLabel: section.label,
    sectionPageIndex,
    text,
    wordCount: countWords(text)
  }));
}

function buildPages() {
  pages = window.BOOK_CONTENT.flatMap(chunkSection);
  if (!pages.length) {
    pages = [{ sectionId: "empty", sectionTitle: "Livro", sectionLabel: "", sectionPageIndex: 0, text: "Conteúdo em preparação.", wordCount: 3 }];
  }
  currentPage = Math.min(Math.max(currentPage, 0), pages.length - 1);
}

function renderParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function renderPage() {
  const page = pages[currentPage];
  const isFirstSectionPage = page.sectionPageIndex === 0;

  pageContentEl.innerHTML = `${isFirstSectionPage ? `<p class="chapter-kicker">${escapeHtml(page.sectionTitle)}</p><h2>${escapeHtml(page.sectionLabel)}</h2>` : ""}${renderParagraphs(page.text)}`;
  pageLabelEl.textContent = `Página ${currentPage + 1} · ${page.wordCount} palavras`;
  pageNumberEl.textContent = String(currentPage + 1);
  progressText.textContent = `${currentPage + 1} / ${pages.length}`;
  progressBar.style.width = `${((currentPage + 1) / pages.length) * 100}%`;
  prevButton.disabled = currentPage === 0;
  nextButton.disabled = currentPage === pages.length - 1;

  localStorage.setItem("sffil-current-page", String(currentPage));
}

function loadTimerState() {
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_STORAGE_KEY) || "null");
    if (!saved) return { running: false, remaining: TIMER_SECONDS, endAt: null };

    if (saved.running && saved.endAt) {
      const remaining = Math.max(0, Math.ceil((saved.endAt - Date.now()) / 1000));
      return {
        running: remaining > 0,
        remaining,
        endAt: remaining > 0 ? saved.endAt : null
      };
    }

    return {
      running: false,
      remaining: Number.isFinite(saved.remaining) ? Math.max(0, saved.remaining) : TIMER_SECONDS,
      endAt: null
    };
  } catch {
    return { running: false, remaining: TIMER_SECONDS, endAt: null };
  }
}

function saveTimerState() {
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
}

function renderTimer() {
  const seconds = timerState.running && timerState.endAt
    ? Math.max(0, Math.ceil((timerState.endAt - Date.now()) / 1000))
    : timerState.remaining;

  if (timerState.running) timerState.remaining = seconds;

  if (seconds === 0 && timerState.running) {
    timerState.running = false;
    timerState.endAt = null;
    timerState.remaining = 0;
    saveTimerState();
    clearInterval(timerInterval);
    timerInterval = null;
  }

  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  timerEl.textContent = `${minutes}:${secs}`;
  timerEl.classList.toggle("is-expired", seconds === 0);
  timerEl.classList.toggle("is-running", timerState.running);

  if (seconds === 0) {
    timerEl.setAttribute("aria-label", "Tempo encerrado. Clique para reiniciar o cronômetro de 5 minutos");
    timerEl.title = "Clique para reiniciar";
  } else if (timerState.running) {
    timerEl.setAttribute("aria-label", `${minutes} minutos e ${secs} segundos restantes`);
    timerEl.title = "Cronômetro em andamento";
  } else {
    timerEl.setAttribute("aria-label", "Iniciar cronômetro de 5 minutos");
    timerEl.title = "Clique para iniciar";
  }
}

function startTimer() {
  if (timerState.running) return;

  if (timerState.remaining <= 0) {
    timerState.remaining = TIMER_SECONDS;
  }

  timerState.running = true;
  timerState.endAt = Date.now() + timerState.remaining * 1000;
  saveTimerState();
  renderTimer();

  clearInterval(timerInterval);
  timerInterval = setInterval(renderTimer, 250);
}

function initializeTimer() {
  renderTimer();
  if (timerState.running) {
    timerInterval = setInterval(renderTimer, 250);
  }
}

function turnTo(targetIndex, direction) {
  if (targetIndex < 0 || targetIndex >= pages.length || targetIndex === currentPage) return;
  if (pageEl.classList.contains("turn-next") || pageEl.classList.contains("turn-prev")) return;

  const animationClass = direction === "next" ? "turn-next" : "turn-prev";
  pageEl.classList.add(animationClass);

  window.setTimeout(() => {
    currentPage = targetIndex;
    renderPage();
  }, 305);

  pageEl.addEventListener("animationend", () => {
    pageEl.classList.remove(animationClass);
  }, { once: true });
}

function buildToc() {
  tocList.innerHTML = "";
  window.BOOK_CONTENT.forEach(section => {
    const pageIndex = pages.findIndex(page => page.sectionId === section.id);
    if (pageIndex < 0) return;
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<strong>${escapeHtml(section.title)}</strong><br><span>${escapeHtml(section.label)}</span>`;
    button.addEventListener("click", () => {
      const direction = pageIndex >= currentPage ? "next" : "prev";
      closeToc();
      turnTo(pageIndex, direction);
    });
    tocList.appendChild(button);
  });
}

function openToc() {
  toc.classList.add("is-open");
  toc.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
}

function closeToc() {
  toc.classList.remove("is-open");
  toc.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
}

prevButton.addEventListener("click", () => turnTo(currentPage - 1, "prev"));
nextButton.addEventListener("click", () => turnTo(currentPage + 1, "next"));
tocButton.addEventListener("click", openToc);
closeTocButton.addEventListener("click", closeToc);
overlay.addEventListener("click", closeToc);
timerEl.addEventListener("click", startTimer);

document.addEventListener("keydown", event => {
  if (event.key === "ArrowRight" || event.key === "PageDown") turnTo(currentPage + 1, "next");
  if (event.key === "ArrowLeft" || event.key === "PageUp") turnTo(currentPage - 1, "prev");
  if (event.key === "Escape") closeToc();
});

let touchStartX = null;
bookEl.addEventListener("touchstart", event => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

bookEl.addEventListener("touchend", event => {
  if (touchStartX === null) return;
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) > 55) {
    delta < 0 ? turnTo(currentPage + 1, "next") : turnTo(currentPage - 1, "prev");
  }
  touchStartX = null;
}, { passive: true });

buildPages();
buildToc();
renderPage();
initializeTimer();
