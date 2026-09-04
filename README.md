# Speak First. Fix It Later.

Speak First. Fix It Later. mostra que aprender inglês exige mais do que gramática: é preciso motivação, memória, vocabulário e coragem para errar. Com ciência, humor e estratégias práticas, o livro ensina a transformar erros em progresso e o estudo em uma jornada mais leve, eficiente e possível.

## Leitor web

O repositório agora inclui a primeira versão do leitor digital do livro.

### Funcionalidades

- Paginação automática em blocos de 320 palavras.
- Efeito visual de virada de página.
- Cronômetro regressivo de 5 minutos em cada página.
- O cronômetro fica vermelho quando chega a 00:00.
- Progresso de leitura salvo no navegador.
- Estado do cronômetro de cada página preservado no navegador.
- Navegação por botões, teclado e swipe em dispositivos móveis.
- Sumário lateral.
- Layout responsivo.
- Fonte Literata para leitura longa e Inter para a interface.

### Estrutura

- `index.html` — estrutura do leitor.
- `styles.css` — identidade visual, responsividade e animações.
- `app.js` — paginação, navegação, cronômetros e persistência.
- `book-content.js` — conteúdo do livro.

### Como adicionar capítulos

Adicione objetos ao array `window.BOOK_CONTENT` em `book-content.js`:

```js
{
  id: "capitulo-2",
  title: "Capítulo 2",
  label: "Título do capítulo",
  text: `Texto completo do capítulo...`
}
```

O leitor faz a paginação automaticamente.

### GitHub Pages

O projeto é totalmente estático e está preparado para GitHub Pages. Configure Pages para publicar a branch `main` a partir da pasta raiz (`/`).
