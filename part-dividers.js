window.BOOK_CONTENT = Array.isArray(window.BOOK_CONTENT) ? window.BOOK_CONTENT : [];

// Todas as divisões por PARTES foram removidas. Este arquivo agora apenas
// garante que eventuais divisores antigos não permaneçam no conteúdo carregado.
window.BOOK_CONTENT = window.BOOK_CONTENT.filter(
  section => !String(section.id || "").startsWith("parte-")
);
