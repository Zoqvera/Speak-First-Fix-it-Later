(() => {
  const pageContent = document.getElementById("pageContent");
  if (!pageContent) return;

  function syncPartDividerStyle() {
    const kicker = pageContent.querySelector(".chapter-kicker");
    const isPartDivider = Boolean(kicker && kicker.textContent.trim().startsWith("PARTE "));
    pageContent.classList.toggle("is-part-divider", isPartDivider);
  }

  const observer = new MutationObserver(syncPartDividerStyle);
  observer.observe(pageContent, { childList: true, subtree: true, characterData: true });
  syncPartDividerStyle();
})();
