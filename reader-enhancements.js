(() => {
  const page = document.getElementById("page");
  const pageLabel = document.getElementById("pageLabel");
  const pageJumpForm = document.getElementById("pageJumpForm");
  const pageJumpInput = document.getElementById("pageJumpInput");
  const prev = document.getElementById("prevPage");
  const next = document.getElementById("nextPage");

  // 1. Navegação direta por número de página + proteção contra o teclado móvel.
  if (pageJumpForm && pageJumpInput) {
    let jumpLockUntil = 0;

    window.addEventListener("resize", event => {
      if (document.activeElement === pageJumpInput || Date.now() < jumpLockUntil) {
        event.stopImmediatePropagation();
      }
    }, true);

    pageJumpInput.addEventListener("focus", () => {
      requestAnimationFrame(() => pageJumpInput.select());
    });

    pageJumpInput.addEventListener("input", () => {
      const digitsOnly = pageJumpInput.value.replace(/\D+/g, "");
      if (digitsOnly !== pageJumpInput.value) pageJumpInput.value = digitsOnly;
    });

    pageJumpForm.addEventListener("submit", event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const targetPage = Number(String(pageJumpInput.value || "").trim());
      const totalPages = Array.isArray(pages) ? pages.length : 0;
      const valid = Number.isInteger(targetPage) && targetPage >= 1 && targetPage <= totalPages;

      if (!valid) {
        pageJumpForm.classList.add("is-invalid");
        pageJumpInput.setAttribute("aria-invalid", "true");
        pageJumpInput.focus();
        pageJumpInput.select?.();
        return;
      }

      pageJumpForm.classList.remove("is-invalid");
      pageJumpInput.removeAttribute("aria-invalid");
      jumpLockUntil = Date.now() + 900;

      page?.classList.remove("turn-next", "turn-prev");
      currentPage = targetPage - 1;
      renderPage();
      pageJumpInput.value = String(targetPage);

      try {
        localStorage.setItem("sffil-current-page", String(currentPage));
        const current = pages[currentPage];
        if (current) {
          localStorage.setItem("sffil-reading-position", JSON.stringify({
            sectionId: current.sectionId,
            startWord: current.startWord || 0
          }));
        }
      } catch (_) {}

      window.setTimeout(() => pageJumpInput.blur(), 0);
    }, true);
  }

  // 2. Navegação por clique nas bordas; os botões visuais antigos não são usados.
  prev?.remove();
  next?.remove();

  if (page) {
    function isInteractiveTarget(target) {
      return Boolean(target.closest("a, button, input, select, textarea, label, [contenteditable='true']"));
    }

    function hasTextSelection() {
      const selection = window.getSelection?.();
      return Boolean(selection && !selection.isCollapsed && String(selection).trim());
    }

    page.addEventListener("click", event => {
      if (isInteractiveTarget(event.target) || hasTextSelection()) return;

      const rect = page.getBoundingClientRect();
      if (!rect.width) return;

      const edgeWidth = Math.min(140, Math.max(56, rect.width * 0.16));
      const distanceFromLeft = event.clientX - rect.left;
      const distanceFromRight = rect.right - event.clientX;

      if (distanceFromLeft <= edgeWidth) {
        turnTo(currentPage - 1, "prev");
      } else if (distanceFromRight <= edgeWidth) {
        turnTo(currentPage + 1, "next");
      }
    });

    page.classList.add("edge-navigation-enabled");
  }

  // 3. Garante que a interface nunca exponha a contagem técnica de palavras.
  if (pageLabel) {
    function removeWordCount() {
      const current = pageLabel.textContent || "";
      const cleaned = current.replace(/\s*·\s*\d+\s+palavras?\s*$/i, "");
      if (cleaned !== current) pageLabel.textContent = cleaned;
    }

    removeWordCount();
    const observer = new MutationObserver(removeWordCount);
    observer.observe(pageLabel, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
})();
