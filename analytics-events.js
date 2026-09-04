(() => {
  const EVENT_PREFIX = "sffil-ga4";
  const MILESTONES = [10, 25, 50, 75, 90, 100];
  let lastPageKey = null;
  let lastChapterKey = null;

  function sendEvent(name, params = {}) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, {
      book_title: "Speak First. Fix It Later.",
      ...params
    });
  }

  function getCurrentReadingState() {
    if (!Array.isArray(pages) || !pages.length) return null;
    const page = pages[currentPage];
    if (!page) return null;

    const pageNumber = Number.isFinite(page.globalPageNumber)
      ? page.globalPageNumber
      : currentPage + 1;
    const totalPages = Number.isFinite(page.totalBookPages)
      ? page.totalBookPages
      : pages.length;
    const progressPercent = totalPages > 0
      ? Math.min(100, Math.max(0, Math.round((pageNumber / totalPages) * 100)))
      : 0;

    return {
      page,
      pageNumber,
      totalPages,
      progressPercent,
      sectionId: String(page.sectionId || "unknown"),
      sectionTitle: String(page.sectionTitle || ""),
      sectionLabel: String(page.sectionLabel || "")
    };
  }

  function trackBookOpen() {
    const key = `${EVENT_PREFIX}-book-open`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    sendEvent("book_open", {
      page_location: window.location.href,
      page_title: document.title
    });
  }

  function trackReadingProgress(state) {
    for (const milestone of MILESTONES) {
      if (state.progressPercent < milestone) continue;
      const key = `${EVENT_PREFIX}-progress-${milestone}`;
      if (sessionStorage.getItem(key)) continue;
      sessionStorage.setItem(key, "1");
      sendEvent("reading_progress", {
        progress_percent: milestone,
        current_page: state.pageNumber,
        total_pages: state.totalPages,
        section_id: state.sectionId,
        section_title: state.sectionTitle,
        section_label: state.sectionLabel
      });
    }
  }

  function trackBookCompleted(state) {
    if (state.pageNumber !== state.totalPages) return;
    const key = `${EVENT_PREFIX}-book-completed`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    sendEvent("book_completed", {
      current_page: state.pageNumber,
      total_pages: state.totalPages,
      progress_percent: 100,
      section_id: state.sectionId,
      section_title: state.sectionTitle,
      section_label: state.sectionLabel
    });
  }

  function trackPageAndChapter() {
    const state = getCurrentReadingState();
    if (!state) return;

    const pageKey = `${state.sectionId}:${state.pageNumber}:${state.totalPages}`;
    if (pageKey !== lastPageKey) {
      lastPageKey = pageKey;
      sendEvent("book_page_view", {
        current_page: state.pageNumber,
        total_pages: state.totalPages,
        progress_percent: state.progressPercent,
        section_id: state.sectionId,
        section_title: state.sectionTitle,
        section_label: state.sectionLabel,
        section_page_index: Number(state.page.sectionPageIndex || 0) + 1
      });
    }

    const chapterKey = state.sectionId;
    if (chapterKey !== lastChapterKey) {
      lastChapterKey = chapterKey;
      sendEvent("chapter_view", {
        section_id: state.sectionId,
        section_title: state.sectionTitle,
        section_label: state.sectionLabel,
        current_page: state.pageNumber,
        total_pages: state.totalPages,
        progress_percent: state.progressPercent
      });
    }

    trackReadingProgress(state);
    trackBookCompleted(state);
  }

  function trackLinkClicks() {
    document.addEventListener("click", event => {
      const link = event.target.closest("a");
      if (!link) return;

      if (link.classList.contains("learning-guides-link")) {
        sendEvent("learning_guides_click", {
          link_url: link.href,
          link_text: (link.textContent || "").trim()
        });
      }

      if (link.classList.contains("teacher-site-button")) {
        sendEvent("teacher_site_click", {
          link_url: link.href,
          link_text: (link.textContent || "").trim()
        });
      }
    });
  }

  function hookReaderRendering() {
    if (typeof renderPage === "function") {
      const previousRenderPage = renderPage;
      renderPage = function(...args) {
        const result = previousRenderPage.apply(this, args);
        window.setTimeout(trackPageAndChapter, 0);
        return result;
      };
    }

    const pageNumberNode = document.getElementById("pageNumber");
    if (pageNumberNode && "MutationObserver" in window) {
      const observer = new MutationObserver(() => trackPageAndChapter());
      observer.observe(pageNumberNode, { childList: true, characterData: true, subtree: true });
    }
  }

  function initializeAnalyticsEvents() {
    trackBookOpen();
    trackLinkClicks();
    hookReaderRendering();
    window.setTimeout(trackPageAndChapter, 250);
    window.setTimeout(trackPageAndChapter, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAnalyticsEvents, { once: true });
  } else {
    initializeAnalyticsEvents();
  }
})();
