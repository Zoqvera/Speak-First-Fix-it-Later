function normalizeForDuplicateCheck(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function removeNearbyDuplicateParagraphs(text) {
  const paragraphs = String(text || "")
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);

  const kept = [];
  const recent = [];

  for (const paragraph of paragraphs) {
    const normalized = normalizeForDuplicateCheck(paragraph);
    const isLongEnoughToBeAccidentalDuplicate = normalized.length >= 80;
    const duplicateNearby = isLongEnoughToBeAccidentalDuplicate && recent.includes(normalized);

    if (!duplicateNearby) {
      kept.push(paragraph);
      recent.push(normalized);
      if (recent.length > 4) recent.shift();
    }
  }

  return kept.join("\n\n");
}

if (Array.isArray(window.BOOK_CONTENT)) {
  window.BOOK_CONTENT = window.BOOK_CONTENT.map(section => ({
    ...section,
    text: removeNearbyDuplicateParagraphs(section.text)
  }));
}
