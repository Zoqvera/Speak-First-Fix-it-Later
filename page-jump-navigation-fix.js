(() => {
  const form = document.getElementById("pageJumpForm");
  const input = document.getElementById("pageJumpInput");
  if (!form || !input) return;

  let jumpLockUntil = 0;

  // During a direct page jump, mobile browsers may fire resize events while
  // the virtual keyboard closes. Ignore those events briefly so the requested
  // page is not replaced by a repagination of the previous reading position.
  window.addEventListener("resize", event => {
    if (Date.now() < jumpLockUntil) {
      event.stopImmediatePropagation();
    }
  }, true);

  form.addEventListener("submit", event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const targetPage = Number(String(input.value || "").trim());
    const totalPages = Array.isArray(pages) ? pages.length : 0;
    const valid = Number.isInteger(targetPage) && targetPage >= 1 && targetPage <= totalPages;

    if (!valid) {
      form.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");
      input.focus();
      input.select?.();
      return;
    }

    form.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    jumpLockUntil = Date.now() + 900;

    // Remove any page-turn animation that could block or delay a direct jump.
    pageEl.classList.remove("turn-next", "turn-prev");

    currentPage = targetPage - 1;
    renderPage();
    input.value = String(targetPage);

    try {
      localStorage.setItem("sffil-current-page", String(currentPage));
      const page = pages[currentPage];
      if (page) {
        localStorage.setItem("sffil-reading-position", JSON.stringify({
          sectionId: page.sectionId,
          startWord: page.startWord || 0
        }));
      }
    } catch (_) {}

    input.blur();
  }, true);
})();
