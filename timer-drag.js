(() => {
  const timer = document.getElementById("timer");
  if (!timer) return;

  const STORAGE_KEY = "sffil-timer-position";
  const EDGE_MARGIN = 8;
  const DRAG_THRESHOLD = 6;
  const MOBILE_BREAKPOINT = 820;

  timer.style.touchAction = "none";
  timer.style.userSelect = "none";
  timer.style.cursor = "grab";

  let dragging = false;
  let moved = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function viewportBounds() {
    const rect = timer.getBoundingClientRect();
    return {
      maxLeft: Math.max(EDGE_MARGIN, window.innerWidth - rect.width - EDGE_MARGIN),
      maxTop: Math.max(EDGE_MARGIN, window.innerHeight - rect.height - EDGE_MARGIN)
    };
  }

  function setPosition(left, top, persist = false) {
    const bounds = viewportBounds();
    const safeLeft = clamp(left, EDGE_MARGIN, bounds.maxLeft);
    const safeTop = clamp(top, EDGE_MARGIN, bounds.maxTop);

    timer.style.left = `${safeLeft}px`;
    timer.style.top = `${safeTop}px`;
    timer.style.right = "auto";
    timer.style.bottom = "auto";

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ left: safeLeft, top: safeTop }));
      } catch (_) {}
    }
  }

  function setMobileDefaultPosition() {
    const page = document.getElementById("page");
    if (!page) return false;

    const pageRect = page.getBoundingClientRect();
    const timerRect = timer.getBoundingClientRect();

    // Matches the mobile reference: timer sits inside the page,
    // aligned to the upper-right area of the page topbar.
    const left = pageRect.right - timerRect.width - 28;
    const top = pageRect.top + 4;
    setPosition(left, top, false);
    return true;
  }

  function restorePosition() {
    // On mobile, always open in the reference position. The reader can still
    // drag the timer freely afterwards during the current session.
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMobileDefaultPosition());
      });
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
        setPosition(saved.left, saved.top, false);
      }
    } catch (_) {}
  }

  timer.addEventListener("pointerdown", event => {
    if (event.button !== undefined && event.button !== 0) return;

    const rect = timer.getBoundingClientRect();
    dragging = true;
    moved = false;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    timer.style.cursor = "grabbing";
    timer.classList.add("is-dragging");
    timer.setPointerCapture?.(pointerId);
  });

  timer.addEventListener("pointermove", event => {
    if (!dragging || event.pointerId !== pointerId) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!moved && Math.hypot(dx, dy) >= DRAG_THRESHOLD) moved = true;
    if (!moved) return;

    event.preventDefault();
    setPosition(startLeft + dx, startTop + dy, false);
  });

  function finishDrag(event) {
    if (!dragging || (event.pointerId !== undefined && event.pointerId !== pointerId)) return;

    dragging = false;
    timer.style.cursor = "grab";
    timer.classList.remove("is-dragging");

    if (moved) {
      const rect = timer.getBoundingClientRect();
      setPosition(rect.left, rect.top, true);
    }

    try {
      if (pointerId !== null && timer.hasPointerCapture?.(pointerId)) {
        timer.releasePointerCapture(pointerId);
      }
    } catch (_) {}
    pointerId = null;
  }

  timer.addEventListener("pointerup", finishDrag);
  timer.addEventListener("pointercancel", finishDrag);

  // Prevent the timer click action from firing after a drag gesture.
  timer.addEventListener("click", event => {
    if (!moved) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    moved = false;
  }, true);

  window.addEventListener("resize", () => {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      setMobileDefaultPosition();
      return;
    }

    const rect = timer.getBoundingClientRect();
    setPosition(rect.left, rect.top, false);
  });

  restorePosition();
})();
