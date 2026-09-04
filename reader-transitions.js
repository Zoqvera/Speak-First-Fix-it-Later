(() => {
  const STORAGE_KEY = "sffil-page-transition";
  const DEFAULT_TRANSITION = "slide";
  const VALID = new Set(["slide", "fade", "flip", "none"]);
  const picker = document.getElementById("pageTransition");
  const page = document.getElementById("page");

  function loadPreference() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return VALID.has(saved) ? saved : DEFAULT_TRANSITION;
  }

  function applyPreference(value, persist = true) {
    const mode = VALID.has(value) ? value : DEFAULT_TRANSITION;
    document.body.dataset.pageTransition = mode;
    if (picker) picker.value = mode;
    if (persist) localStorage.setItem(STORAGE_KEY, mode);
    return mode;
  }

  applyPreference(loadPreference(), false);

  picker?.addEventListener("change", () => applyPreference(picker.value));

  if (typeof window.turnTo !== "undefined") {
    window.turnTo = function(targetIndex, direction) {
      if (targetIndex < 0 || targetIndex >= pages.length || targetIndex === currentPage) return;
      if (page.classList.contains("turn-next") || page.classList.contains("turn-prev")) return;

      const mode = document.body.dataset.pageTransition || DEFAULT_TRANSITION;
      const animationClass = direction === "next" ? "turn-next" : "turn-prev";

      if (mode === "none" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        currentPage = targetIndex;
        renderPage();
        return;
      }

      const swapDelay = mode === "flip" ? 305 : mode === "fade" ? 170 : 215;
      const fallbackCleanup = mode === "flip" ? 700 : mode === "fade" ? 430 : 560;

      page.classList.add(animationClass);
      window.setTimeout(() => {
        currentPage = targetIndex;
        renderPage();
      }, swapDelay);

      const cleanup = () => page.classList.remove(animationClass);
      page.addEventListener("animationend", cleanup, { once: true });
      window.setTimeout(cleanup, fallbackCleanup);
    };
  }
})();
