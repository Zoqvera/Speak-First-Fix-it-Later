(() => {
  const originalPageHtml = pageHtml;
  const originalRenderPage = renderPage;
  const originalBuildToc = buildToc;

  pageHtml = function(section, text, sectionPageIndex) {
    if (section?.sectionId === "cover" || section?.id === "cover" || section?.isCover) {
      return `
        <div class="book-cover-page" role="img" aria-label="Capa do livro Speak First. Fix It Later.">
          <img src="capa.png" alt="Capa do livro Speak First. Fix It Later." class="book-cover-image" />
        </div>
      `;
    }
    return originalPageHtml(section, text, sectionPageIndex);
  };

  buildPages = function(anchor = getReadingAnchor()) {
    const paginate = isDesktop() ? paginateDesktopSection : paginateResponsiveSection;
    const contentPages = bookContent.flatMap(paginate);

    pages = [{
      sectionId: "cover",
      sectionTitle: "Capa",
      sectionLabel: "",
      sectionPageIndex: 0,
      startWord: 0,
      text: "",
      wordCount: 0,
      fontSize: null,
      isCover: true
    }, ...contentPages];

    if (!contentPages.length) {
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

    restoreReadingAnchor(anchor);
  };

  buildToc = function() {
    originalBuildToc();

    const coverButton = document.createElement("button");
    coverButton.type = "button";
    coverButton.innerHTML = `<strong>Capa</strong><br><span>Início do livro</span>`;
    coverButton.addEventListener("click", () => {
      const direction = currentPage === 0 ? "next" : "prev";
      closeToc();
      if (currentPage !== 0) turnTo(0, direction);
    });

    tocList.prepend(coverButton);
  };

  renderPage = function() {
    originalRenderPage();
    const page = pages[currentPage];
    const isCover = page?.sectionId === "cover";
    pageContentEl.classList.toggle("is-cover", isCover);
    if (isCover) {
      pageContentEl.style.fontSize = "";
      pageLabelEl.textContent = "Capa";
    }
  };

  window.setTimeout(() => {
    if (!pages.some(page => page.sectionId === "cover")) {
      const anchor = getReadingAnchor();
      buildPages(anchor);
      buildToc();
      renderPage();
    } else {
      buildToc();
    }
  }, 0);
})();
