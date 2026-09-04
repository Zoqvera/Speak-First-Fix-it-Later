(() => {
  const input = document.getElementById("pageJumpInput");
  const form = document.getElementById("pageJumpForm");
  if (!input || !form) return;

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
})();
