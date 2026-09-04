window.BOOK_CONTENT = Array.isArray(window.BOOK_CONTENT) ? window.BOOK_CONTENT : [];

const BOOK_PART_DIVIDERS = [
  {
    id: "parte-1",
    title: "PARTE I — ANTES DO INGLÊS, EXISTE O APRENDIZ",
    label: "",
    text: "\u200B",
    insertAfter: "introducao"
  },
  {
    id: "parte-2",
    title: "PARTE II — PERMITA-SE SER RUIM",
    label: "",
    text: "\u200B",
    insertAfter: "capitulo-4"
  },
  {
    id: "parte-3",
    title: "PARTE III — CONSTRUINDO O PRÉDIO",
    label: "",
    text: "\u200B",
    insertAfter: "capitulo-8"
  },
  {
    id: "parte-4",
    title: "PARTE IV — O CÉREBRO QUE APRENDE",
    label: "",
    text: "\u200B",
    insertAfter: "capitulo-11"
  },
  {
    id: "parte-5",
    title: "PARTE V — TRANSFORME INGLÊS EM VIDA",
    label: "",
    text: "\u200B",
    insertAfter: "capitulo-15"
  },
  {
    id: "parte-6",
    title: "PARTE VI — O APRENDIZ QUE NÃO DESISTE",
    label: "",
    text: "\u200B",
    insertAfter: "capitulo-19"
  }
];

const dividersByAnchor = new Map(BOOK_PART_DIVIDERS.map(part => [part.insertAfter, part]));
const existingIds = new Set(window.BOOK_CONTENT.map(section => section.id));
const reorderedContent = [];

for (const section of window.BOOK_CONTENT) {
  if (String(section.id || "").startsWith("parte-")) continue;
  reorderedContent.push(section);
  const divider = dividersByAnchor.get(section.id);
  if (divider && !existingIds.has(divider.id)) {
    reorderedContent.push({
      id: divider.id,
      title: divider.title,
      label: divider.label,
      text: divider.text
    });
  }
}

window.BOOK_CONTENT = reorderedContent;
