(() => {
  const originalBuildPagesWithCover = buildPages;
  const originalRenderPageWithCover = renderPage;

  function makeCoverPage() {
    return {
      sectionId: "cover",
      sectionTitle: "Capa",
      sectionLabel: "",
      sectionPageIndex: 0,
      startWord: 0,
      text: "",
      wordCount: 0,
      fontSize: null,
      isCover: true
    };
  }

  function stampGlobalNumbers() {
    pages.forEach((page, index) => {
      page.globalPageNumber = index + 1;
      page.totalBookPages = pages.length;
    });
  }

  function buildDesktopBookPages(anchor = getReadingAnchor()) {
    const allContentPages = [];

    for (const section of bookContent) {
      const sectionPages = paginateDesktopSection(section);
      for (const page of sectionPages) allContentPages.push(page);
    }

    pages = [makeCoverPage(), ...allContentPages];

    if (!allContentPages.length) {
      pages.push({
        sectionId: "empty",
        sectionTitle: "Livro",
        sectionLabel: "",
        sectionPageIndex: 0,
        startWord: 0,
        text: "Conteúdo em preparação.",
        wordCount: 3,
        fontSize: null
      });
    }

    stampGlobalNumbers();
    restoreReadingAnchor(anchor);
  }

  buildPages = function(anchor = getReadingAnchor()) {
    if (isDesktop()) {
      buildDesktopBookPages(anchor);
      return;
    }

    originalBuildPagesWithCover(anchor);
    stampGlobalNumbers();
  };

  function applyGlobalProgress() {
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
  }

  renderPage = function() {
    originalRenderPageWithCover();
    applyGlobalProgress();
  };

  function rebuildGlobalDesktopPagination() {
    if (!isDesktop()) {
      applyGlobalProgress();
      return;
    }

    const anchor = getReadingAnchor();
    pageContentEl.style.fontSize = "";
    buildDesktopBookPages(anchor);
    buildToc();
    renderPage();
  }

  window.addEventListener("resize", () => {
    window.setTimeout(() => {
      if (isDesktop()) rebuildGlobalDesktopPagination();
      else applyGlobalProgress();
    }, 80);
  });

  window.setTimeout(() => {
    if (isDesktop()) {
      rebuildGlobalDesktopPagination();
    } else {
      stampGlobalNumbers();
      applyGlobalProgress();
    }
  }, 0);
})();
