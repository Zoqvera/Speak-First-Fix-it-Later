(() => {
  const page = document.getElementById("page");
  const prev = document.getElementById("prevPage");
  const next = document.getElementById("nextPage");

  // Remove os controles visuais antigos depois que app.js já registrou suas referências.
  prev?.remove();
  next?.remove();

  if (!page) return;

  function isInteractiveTarget(target) {
    return Boolean(target.closest("a, button, input, select, textarea, label, [contenteditable='true']"));
  }

  function hasTextSelection() {
    const selection = window.getSelection?.();
    return Boolean(selection && !selection.isCollapsed && String(selection).trim());
  }

  function navigateFromPointer(clientX, target) {
    if (isInteractiveTarget(target) || hasTextSelection()) return;

    const rect = page.getBoundingClientRect();
    if (!rect.width) return;

    const edgeWidth = Math.min(140, Math.max(56, rect.width * 0.16));
    const distanceFromLeft = clientX - rect.left;
    const distanceFromRight = rect.right - clientX;

    if (distanceFromLeft <= edgeWidth) {
      turnTo(currentPage - 1, "prev");
    } else if (distanceFromRight <= edgeWidth) {
      turnTo(currentPage + 1, "next");
    }
  }

  page.addEventListener("click", event => {
    navigateFromPointer(event.clientX, event.target);
  });

  page.classList.add("edge-navigation-enabled");
})();
