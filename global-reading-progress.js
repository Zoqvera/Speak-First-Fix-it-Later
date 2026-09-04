(() => {
  const applyGlobalProgress = () => {
    if (!Array.isArray(pages) || !pages.length) return;

    const absolutePage = Math.min(Math.max(currentPage + 1, 1), pages.length);
    const totalPages = pages.length;
    const current = pages[currentPage];

    if (progressText) progressText.textContent = `${absolutePage} / ${totalPages}`;
    if (progressBar) progressBar.style.width = `${(absolutePage / totalPages) * 100}%`;

    if (pageNumberEl) pageNumberEl.textContent = String(absolutePage);

    if (pageJumpInput) {
      pageJumpInput.max = String(totalPages);
      pageJumpInput.value = String(absolutePage);
    }

    if (pageLabelEl && current?.sectionId !== "cover") {
      const words = Number.isFinite(current?.wordCount) ? current.wordCount : 0;
      pageLabelEl.textContent = words > 0
        ? `Página ${absolutePage} de ${totalPages} · ${words} palavras`
        : `Página ${absolutePage} de ${totalPages}`;
    }
  };

  const originalRenderPageWithGlobalProgress = renderPage;
  renderPage = function() {
    originalRenderPageWithGlobalProgress();
    applyGlobalProgress();
  };

  const originalBuildPagesWithGlobalProgress = buildPages;
  buildPages = function(anchor = getReadingAnchor()) {
    originalBuildPagesWithGlobalProgress(anchor);
    pages.forEach((page, index) => {
      page.globalPageNumber = index + 1;
      page.totalBookPages = pages.length;
    });
  };

  window.addEventListener("resize", () => {
    window.setTimeout(applyGlobalProgress, 60);
  });

  window.setTimeout(() => {
    if (Array.isArray(pages) && pages.length) {
      pages.forEach((page, index) => {
        page.globalPageNumber = index + 1;
        page.totalBookPages = pages.length;
      });
      applyGlobalProgress();
    }
  }, 0);
})();
