(() => {
  const label = document.getElementById("pageLabel");
  if (!label) return;

  function removeWordCount() {
    const current = label.textContent || "";
    const cleaned = current.replace(/\s*·\s*\d+\s+palavras?\s*$/i, "");
    if (cleaned !== current) label.textContent = cleaned;
  }

  removeWordCount();

  const observer = new MutationObserver(removeWordCount);
  observer.observe(label, {
    childList: true,
    characterData: true,
    subtree: true
  });
})();
