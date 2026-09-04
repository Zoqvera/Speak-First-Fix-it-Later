const DESKTOP_BREAKPOINT = 821;
const DESKTOP_WORDS_PER_PAGE = 500;
const TIMER_SECONDS = 5 * 60;
const TIMER_STORAGE_KEY = "sffil-global-timer";
const POSITION_STORAGE_KEY = "sffil-reading-position";

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
let currentPage = 0;
let timerInterval = null;
let resizeTimer = null;
let measureEl = null;
let timerState = loadTimerState();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isDesktop() {
  return window.innerWidth >= DESKTOP_BREAKPOINT;
}

function sectionToWords(section) {
  const paragraphs = String(section.text || "")
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);

  const words = [];
  paragraphs.forEach((paragraph, paragraphIndex) => {
    paragraph.split(/\s+/).filter(Boolean).forEach((word, wordIndex) => {
      words.push({
        value: word,
        paragraphBefore: paragraphIndex > 0 && wordIndex === 0
      });
    });
  });
  return words;
}

function wordsToText(words) {
  let text = "";
  words.forEach((word, index) => {
    if (index === 0) {
      text = word.value;
    } else if (word.paragraphBefore) {
      text += `\n\n${word.value}`;
    } else {
      text += ` ${word.value}`;
    }
  });
  return text;
}

function renderParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function pageHtml(section, text, sectionPageIndex) {
  const heading = sectionPageIndex === 0
    ? `<p class="chapter-kicker">${escapeHtml(section.title)}</p><h2>${escapeHtml(section.label)}</h2>`
    : "";
  return `${heading}${renderParagraphs(text)}`;
}

function ensureMeasureElement() {
  if (measureEl) return measureEl;
  measureEl = document.createElement("div");
  measureEl.className = "page-content page-content--measure";
  measureEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(measureEl);
  return measureEl;
}

function syncMeasureBox() {
  const measure = ensureMeasureElement();
  const rect = pageContentEl.getBoundingClientRect();
  measure.style.width = `${Math.max(1, rect.width)}px`;
  measure.style.height = `${Math.max(1, rect.height)}px`;
  return measure;
}

function contentFits(html, fontSize = null) {
  const measure = syncMeasureBox();
  measure.style.fontSize = fontSize ? `${fontSize}px` : "";
  measure.innerHTML = html;
  return measure.scrollHeight <= measure.clientHeight + 1;
}

function bestDesktopFontSize(html) {
  let low = 12.5;
  let high = 23;
  let best = low;

  for (let i = 0; i < 8; i += 1) {
    const mid = (low + high) / 2;
    if (contentFits(html, mid)) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }
  return Math.round(best * 4) / 4;
}

function paginateDesktopSection(section) {
  const words = sectionToWords(section);
  const sectionPages = [];

  for (let start = 0, sectionPageIndex = 0; start < words.length; start += DESKTOP_WORDS_PER_PAGE, sectionPageIndex += 1) {
    const slice = words.slice(start, start + DESKTOP_WORDS_PER_PAGE);
    const text = wordsToText(slice);
    const html = pageHtml(section, text, sectionPageIndex);
    const fontSize = bestDesktopFontSize(html);

    sectionPages.push({
      sectionId: section.id,
      sectionTitle: section.title,
      sectionLabel: section.label,
      sectionPageIndex,
      startWord: start,
      text,
      wordCount: slice.length,
      fontSize
    });
  }

  return sectionPages;
}

function paginateResponsiveSection(section) {
  const words = sectionToWords(section);
  const sectionPages = [];
  let start = 0;
  let sectionPageIndex = 0;

  while (start < words.length) {
    const remaining = words.length - start;
    let low = 1;
    let high = Math.min(remaining, 700);
    let best = 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const text = wordsToText(words.slice(start, start + mid));
      const html = pageHtml(section, text, sectionPageIndex);

      if (contentFits(html)) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const slice = words.slice(start, start + best);
    const text = wordsToText(slice);
    sectionPages.push({
      sectionId: section.id,
      sectionTitle: section.title,
      sectionLabel: section.label,
      sectionPageIndex,
      startWord: start,
      text,
      wordCount: slice.length,
      fontSize: null
    });

    start += best;
    sectionPageIndex += 1;
  }

  return sectionPages;
}

function getReadingAnchor() {
  if (pages[currentPage]) {
    return {
      sectionId: pages[currentPage].sectionId,
      startWord: pages[currentPage].startWord || 0
    };
  }

  try {
    return JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function restoreReadingAnchor(anchor) {
  if (!anchor || !pages.length) {
    const legacy = Number(localStorage.getItem("sffil-current-page") || 0);
    currentPage = Math.min(Math.max(legacy, 0), pages.length - 1);
    return;
  }

  let bestIndex = pages.findIndex(page =>
    page.sectionId === anchor.sectionId &&
    anchor.startWord >= page.startWord &&
    anchor.startWord < page.startWord + page.wordCount
  );

  if (bestIndex < 0) bestIndex = pages.findIndex(page => page.sectionId === anchor.sectionId);
  currentPage = bestIndex >= 0 ? bestIndex : 0;
}

function buildPages(anchor = getReadingAnchor()) {
  const paginate = isDesktop() ? paginateDesktopSection : paginateResponsiveSection;
  pages = window.BOOK_CONTENT.flatMap(paginate);

  if (!pages.length) {
    pages = [{
      sectionId: "empty",
      sectionTitle: "Livro",
      sectionLabel: "",
      sectionPageIndex: 0,
      startWord: 0,
      text: "Conteúdo em preparação.",
      wordCount: 3,
      fontSize: null
    }];
  }

  restoreReadingAnchor(anchor);
}

function saveReadingPosition() {
  const page = pages[currentPage];
  if (!page) return;
  localStorage.setItem("sffil-current-page", String(currentPage));
  localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify({
    sectionId: page.sectionId,
    startWord: page.startWord || 0
  }));
}

function renderPage() {
  const page = pages[currentPage];
  if (!page) return;

  pageContentEl.style.fontSize = page.fontSize ? `${page.fontSize}px` : "";
  pageContentEl.innerHTML = pageHtml(page, page.text, page.sectionPageIndex);
  pageLabelEl.textContent = `Página ${currentPage + 1} · ${page.wordCount} palavras`;
  pageNumberEl.textContent = String(currentPage + 1);
  progressText.textContent = `${currentPage + 1} / ${pages.length}`;
  progressBar.style.width = `${((currentPage + 1) / pages.length) * 100}%`;
  prevButton.disabled = currentPage === 0;
  nextButton.disabled = currentPage === pages.length - 1;
  saveReadingPosition();
}

function loadTimerState() {
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_STORAGE_KEY) || "null");
    if (!saved) return { running: false, remaining: TIMER_SECONDS, endAt: null };

    if (saved.running && saved.endAt) {
      const remaining = Math.max(0, Math.ceil((saved.endAt - Date.now()) / 1000));
      return { running: remaining > 0, remaining, endAt: remaining > 0 ? saved.endAt : null };
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
  if (timerState.remaining <= 0) timerState.remaining = TIMER_SECONDS;
  timerState.running = true;
  timerState.endAt = Date.now() + timerState.remaining * 1000;
  saveTimerState();
  renderTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(renderTimer, 250);
}

function initializeTimer() {
  renderTimer();
  if (timerState.running) timerInterval = setInterval(renderTimer, 250);
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

  pageEl.addEventListener("animationend", () => pageEl.classList.remove(animationClass), { once: true });
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

function repaginate() {
  const anchor = getReadingAnchor();
  pageContentEl.style.fontSize = "";
  requestAnimationFrame(() => {
    buildPages(anchor);
    buildToc();
    renderPage();
  });
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

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(repaginate, 220);
});

async function initializeReader() {
  if (document.fonts?.ready) await document.fonts.ready;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  buildPages(null);
  buildToc();
  renderPage();
  initializeTimer();
}

initializeReader();
