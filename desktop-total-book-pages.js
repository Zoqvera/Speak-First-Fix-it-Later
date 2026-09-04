(() => {
  if (typeof isDesktop !== "function") return;

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

  function buildWholeBookDesktopPages(anchor = getReadingAnchor()) {
    const wholeBookPages = [makeCoverPage()];

    for (const section of bookContent) {
      const sectionPages = paginateDesktopSection(section);
      for (const page of sectionPages) {
        wholeBookPages.push(page);
      }
    }

    pages = wholeBookPages;

    pages.forEach((page, index) => {
      page.globalPageNumber = index + 1;
      page.totalBookPages = pages.length;
    });

    restoreReadingAnchor(anchor);
  }

  function renderWholeBookProgress() {
    if (!Array.isArray(pages) || !pages.length) return;

    const absolutePage = currentPage + 1;
    const totalBookPages = pages.length;
    const page = pages[currentPage];

    progressText.textContent = `${absolutePage} / ${totalBookPages}`;
    progressBar.style.width = `${(absolutePage / totalBookPages) * 100}%`;
    pageNumberEl.textContent = String(absolutePage);

    pageJumpInput.max = String(totalBookPages);
    pageJumpInput.value = String(absolutePage);

    if (page?.sectionId === "cover") {
      pageLabelEl.textContent = "Capa";
    } else {
      pageLabelEl.textContent = `Página ${absolutePage} de ${totalBookPages}`;
    }
  }

  const previousRenderPage = renderPage;
  renderPage = function() {
    previousRenderPage();
    if (isDesktop()) renderWholeBookProgress();
  };

  const previousBuildPages = buildPages;
  buildPages = function(anchor = getReadingAnchor()) {
    if (isDesktop()) {
      buildWholeBookDesktopPages(anchor);
      return;
    }
    previousBuildPages(anchor);
  };

  function rebuildDesktopWholeBook() {
    if (!isDesktop()) return;
    const anchor = getReadingAnchor();
    pageContentEl.style.fontSize = "";
    buildWholeBookDesktopPages(anchor);
    buildToc();
    renderPage();
  }

  window.addEventListener("resize", () => {
    window.setTimeout(rebuildDesktopWholeBook, 120);
  });

  window.setTimeout(rebuildDesktopWholeBook, 0);
})();
