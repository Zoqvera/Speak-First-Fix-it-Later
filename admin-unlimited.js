(() => {
  const textArea = document.getElementById("sectionText");
  if (!textArea) return;

  textArea.removeAttribute("maxlength");
  try { textArea.maxLength = -1; } catch (_) {}

  textArea.addEventListener("paste", event => {
    const clipboard = event.clipboardData;
    if (!clipboard) return;

    const pastedText = clipboard.getData("text/plain");
    if (typeof pastedText !== "string") return;

    event.preventDefault();

    const start = textArea.selectionStart ?? textArea.value.length;
    const end = textArea.selectionEnd ?? start;
    const before = textArea.value.slice(0, start);
    const after = textArea.value.slice(end);

    textArea.value = before + pastedText + after;
    const caret = start + pastedText.length;
    textArea.setSelectionRange(caret, caret);

    textArea.dispatchEvent(new Event("input", { bubbles: true }));
  });
})();
