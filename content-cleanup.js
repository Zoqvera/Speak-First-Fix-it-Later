if (Array.isArray(window.BOOK_CONTENT)) {
  window.BOOK_CONTENT = window.BOOK_CONTENT.map(section => {
    if (section.id === "introducao" || section.id === "capitulo-1") {
      return { ...section, text: "" };
    }
    return section;
  });
}
