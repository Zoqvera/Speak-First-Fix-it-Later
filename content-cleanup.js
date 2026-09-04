function normalizeForDuplicateCheck(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function removeConsecutiveDuplicateSentences(paragraph) {
  const sentences = String(paragraph || "").match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [paragraph];
  const kept = [];
  let previous = "";

  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();
    const normalized = normalizeForDuplicateCheck(cleanSentence);
    const isAccidentalDuplicate = normalized.length >= 45 && normalized === previous;

    if (!isAccidentalDuplicate) kept.push(cleanSentence);
    previous = normalized;
  }

  return kept.join(" ").trim();
}

function removeNearbyDuplicateParagraphs(text) {
  const paragraphs = String(text || "")
    .split(/\n\s*\n/)
    .map(paragraph => removeConsecutiveDuplicateSentences(paragraph.trim()))
    .filter(Boolean);

  const kept = [];
  const recent = [];

  for (const paragraph of paragraphs) {
    const normalized = normalizeForDuplicateCheck(paragraph);
    const isLongEnoughToBeAccidentalDuplicate = normalized.length >= 40;
    const duplicateNearby = isLongEnoughToBeAccidentalDuplicate && recent.includes(normalized);

    if (!duplicateNearby) {
      kept.push(paragraph);
      recent.push(normalized);
      if (recent.length > 6) recent.shift();
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

try {
  localStorage.removeItem("sffil-local-book-content");
} catch (_) {}
