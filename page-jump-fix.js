(() => {
  const input = document.getElementById("pageJumpInput");
  const form = document.getElementById("pageJumpForm");

  if (input && form) {
    // Mobile browsers resize the viewport when the virtual keyboard opens.
    // While the page field is being edited, prevent that resize from triggering
    // the reader's repagination routine, which would overwrite the typed value.
    window.addEventListener("resize", event => {
      if (document.activeElement === input) {
        event.stopImmediatePropagation();
      }
    }, true);

    input.addEventListener("focus", () => {
      requestAnimationFrame(() => input.select());
    });

    input.addEventListener("input", () => {
      const digitsOnly = input.value.replace(/\D+/g, "");
      if (digitsOnly !== input.value) input.value = digitsOnly;
    });

    form.addEventListener("submit", () => {
      window.setTimeout(() => input.blur(), 360);
    });
  }

  function rebalanceLastPages(section, sectionPages, desktop) {
    if (!Array.isArray(sectionPages) || sectionPages.length < 2) return sectionPages;

    const previous = sectionPages[sectionPages.length - 2];
    const last = sectionPages[sectionPages.length - 1];
    const shortTail = last.wordCount < Math.max(70, Math.floor(previous.wordCount * 0.45));
    if (!shortTail) return sectionPages;

    const words = sectionToWords(section);
    const start = previous.startWord;
    const total = previous.wordCount + last.wordCount;
    if (total < 40) return sectionPages;

    const combined = words.slice(start, start + total);
    const target = Math.floor(total / 2);
    let chosen = null;

    for (let offset = 0; offset < total; offset += 1) {
      const candidates = [target - offset, target + offset];
      for (const split of candidates) {
        if (split < 20 || split > total - 20) continue;

        const firstWords = combined.slice(0, split);
        const secondWords = combined.slice(split);
        const firstText = wordsToText(firstWords);
        const secondText = wordsToText(secondWords);
        const firstHtml = pageHtml(section, firstText, previous.sectionPageIndex);
        const secondHtml = pageHtml(section, secondText, last.sectionPageIndex);

        if (!desktop && (!contentFits(firstHtml) || !contentFits(secondHtml))) continue;

        chosen = {
          firstWords,
          secondWords,
          firstText,
          secondText,
          firstHtml,
          secondHtml
        };
        break;
      }
      if (chosen) break;
    }

    if (!chosen) return sectionPages;

    const balanced = sectionPages.slice(0, -2);
    balanced.push({
      ...previous,
      text: chosen.firstText,
      wordCount: chosen.firstWords.length,
      fontSize: desktop ? bestDesktopFontSize(chosen.firstHtml) : null
    });
    balanced.push({
      ...last,
      startWord: start + chosen.firstWords.length,
      text: chosen.secondText,
      wordCount: chosen.secondWords.length,
      fontSize: desktop ? bestDesktopFontSize(chosen.secondHtml) : null
    });
    return balanced;
  }

  const originalDesktopPaginate = paginateDesktopSection;
  const originalResponsivePaginate = paginateResponsiveSection;

  paginateDesktopSection = function(section) {
    return rebalanceLastPages(section, originalDesktopPaginate(section), true);
  };

  paginateResponsiveSection = function(section) {
    return rebalanceLastPages(section, originalResponsivePaginate(section), false);
  };

  const refreshBalancedPagination = () => {
    if (document.activeElement === input) return;
    window.setTimeout(() => repaginate(), 0);
  };

  if (document.readyState === "complete") refreshBalancedPagination();
  else window.addEventListener("load", refreshBalancedPagination, { once: true });
})();
