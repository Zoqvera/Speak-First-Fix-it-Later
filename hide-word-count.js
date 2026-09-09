(() => {
  const originalRenderPage = renderPage;

  renderPage = function() {
    originalRenderPage();

    const page = pages[currentPage];
    if (!page) return;

    if (page.sectionId === "cover") {
      pageLabelEl.textContent = "Capa";
    } else if (page.sectionId === "rights-citation") {
      pageLabelEl.textContent = "Informações da obra";
    } else {
      pageLabelEl.textContent = `Página ${currentPage + 1}`;
    }
  };

  if (Array.isArray(pages) && pages.length) {
    renderPage();
  }
})();
