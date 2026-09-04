(() => {
  const DESKTOP_CANONICAL_WORDS_PER_PAGE = 200;

  paginateDesktopSection = function(section) {
    const words = sectionToWords(section);
    const sectionPages = [];

    for (
      let start = 0, sectionPageIndex = 0;
      start < words.length;
      start += DESKTOP_CANONICAL_WORDS_PER_PAGE, sectionPageIndex += 1
    ) {
      const slice = words.slice(start, start + DESKTOP_CANONICAL_WORDS_PER_PAGE);
      const text = wordsToText(slice);
      const html = pageHtml(section, text, sectionPageIndex);
      const fontSize = bestDesktopFontSize(html);

      sectionPages.push({
        sectionId: section.id,
        sectionTitle: section.title,
        sectionLabel: section.label,
        sectionPageIndex,
        startWord: start,
        text,
        wordCount: slice.length,
        fontSize
      });
    }

    return sectionPages;
  };
})();
