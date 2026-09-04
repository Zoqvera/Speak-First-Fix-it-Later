(() => {
  const STORAGE_KEY = "sffil-book-font-scale";
  const LEVELS = [0.85, 1, 1.15, 1.3];
  const DESKTOP_BASE_FONT = 17;
  const DESKTOP_MAX_WORDS = 200;

  function closestLevel(value) {
    return LEVELS.reduce((best, level) =>
      Math.abs(level - value) < Math.abs(best - value) ? level : best,
      LEVELS[1]
    );
  }

  function loadScale() {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(stored) ? closestLevel(stored) : 1;
  }

  let scale = loadScale();

  function applyScale() {
    document.documentElement.style.setProperty("--book-font-scale", String(scale));
    localStorage.setItem(STORAGE_KEY, String(scale));
  }

  applyScale();

  if (typeof paginateDesktopSection === "function") {
    paginateDesktopSection = function(section) {
      const words = sectionToWords(section);
      const sectionPages = [];
      let start = 0;
      let sectionPageIndex = 0;
      const targetFontSize = DESKTOP_BASE_FONT * scale;

      while (start < words.length) {
        const remaining = words.length - start;
        let low = 1;
        let high = Math.min(remaining, DESKTOP_MAX_WORDS);
        let best = 1;

        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          const text = wordsToText(words.slice(start, start + mid));
          const html = pageHtml(section, text, sectionPageIndex);

          if (contentFits(html, targetFontSize)) {
            best = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        const slice = words.slice(start, start + best);
        sectionPages.push({
          sectionId: section.id,
          sectionTitle: section.title,
          sectionLabel: section.label,
          sectionPageIndex,
          startWord: start,
          text: wordsToText(slice),
          wordCount: slice.length,
          fontSize: targetFontSize
        });

        start += best;
        sectionPageIndex += 1;
      }

      return sectionPages;
    };
  }

  const controls = document.querySelector(".reader-controls");
  const pageJump = document.getElementById("pageJumpForm");
  if (!controls || !pageJump) return;

  const wrapper = document.createElement("div");
  wrapper.className = "font-size-control";
  wrapper.setAttribute("aria-label", "Tamanho do texto do livro");

  const label = document.createElement("span");
  label.className = "font-size-control__label";
  label.textContent = "Texto";

  const decreaseButton = document.createElement("button");
  decreaseButton.type = "button";
  decreaseButton.className = "font-size-control__button";
  decreaseButton.textContent = "A−";
  decreaseButton.setAttribute("aria-label", "Diminuir tamanho do texto do livro");

  const value = document.createElement("span");
  value.className = "font-size-control__value";
  value.setAttribute("aria-live", "polite");

  const increaseButton = document.createElement("button");
  increaseButton.type = "button";
  increaseButton.className = "font-size-control__button";
  increaseButton.textContent = "A+";
  increaseButton.setAttribute("aria-label", "Aumentar tamanho do texto do livro");

  wrapper.append(label, decreaseButton, value, increaseButton);
  controls.insertBefore(wrapper, pageJump);

  function updateControlState() {
    const index = LEVELS.indexOf(scale);
    value.textContent = `${Math.round(scale * 100)}%`;
    decreaseButton.disabled = index <= 0;
    increaseButton.disabled = index >= LEVELS.length - 1;
  }

  function rebuildKeepingReadingPosition() {
    const anchor = typeof getReadingAnchor === "function" ? getReadingAnchor() : null;
    pageContentEl.style.fontSize = "";

    requestAnimationFrame(() => {
      buildPages(anchor);
      buildToc();
      renderPage();
    });
  }

  function setScale(nextScale) {
    const normalized = closestLevel(nextScale);
    if (normalized === scale) return;
    scale = normalized;
    applyScale();
    updateControlState();
    rebuildKeepingReadingPosition();
  }

  decreaseButton.addEventListener("click", () => {
    const index = LEVELS.indexOf(scale);
    if (index > 0) setScale(LEVELS[index - 1]);
  });

  increaseButton.addEventListener("click", () => {
    const index = LEVELS.indexOf(scale);
    if (index < LEVELS.length - 1) setScale(LEVELS[index + 1]);
  });

  window.addEventListener("storage", event => {
    if (event.key !== STORAGE_KEY) return;
    const incoming = closestLevel(Number(event.newValue));
    if (!Number.isFinite(incoming) || incoming === scale) return;
    scale = incoming;
    applyScale();
    updateControlState();
    rebuildKeepingReadingPosition();
  });

  updateControlState();
})();
