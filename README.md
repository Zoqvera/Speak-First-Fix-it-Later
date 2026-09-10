# Speak First. Fix It Later.

Livro digital de Flávio de Sousa Freitas sobre aprendizagem de inglês, autonomia, memória, motivação e disposição para errar durante o processo de aquisição da língua.

## Site publicado

https://zoqvera.github.io/Speak-First-Fix-it-Later/

## Estrutura do projeto

O projeto é estático e publicado pelo GitHub Pages a partir da branch `main`.

### Arquivos principais

- `index.html` — ponto de entrada do leitor e metadados de SEO.
- `styles.css` — estilos globais e responsividade.
- `app.js` — núcleo do leitor: paginação, navegação e persistência.
- `book-content.js` — conteúdo-base do livro.
- `capa.png` / `capa.webp` — imagens de capa utilizadas pelo leitor e por metadados sociais.
- `404.html` — página de erro do GitHub Pages.
- `sitemap.xml` e `robots.txt` — indexação e rastreamento.

### Conteúdo do livro

O conteúdo está distribuído entre arquivos de capítulos e arquivos de substituição/reflexões. A ordem efetiva de carregamento é definida em `index.html`.

Arquivos com nomes como `chapter-XX-reflections.js` substituem ou complementam capítulos anteriores. Arquivos como `introduction-override.js`, `epilogue.js` e `references.js` cuidam das seções editoriais correspondentes.

### Interface e comportamento do leitor

Os recursos do leitor foram separados em pequenos módulos, entre eles:

- `cover-page.js` / `cover-page.css` — capa e página de informações da obra.
- `reader-font-controls.js` / `.css` — ajuste de tamanho da fonte.
- `reader-transitions.js` / `.css` — efeitos de transição.
- `edge-page-navigation.js` / `.css` — navegação pelas bordas da página.
- `global-reading-progress.js` — progresso global de leitura.
- `page-jump-fix.js` e `page-jump-navigation-fix.js` — navegação direta por número de página.
- `desktop-page-density.js` e `desktop-total-book-pages.js` — ajustes específicos para desktop.
- `hide-word-count.js` — remove a contagem de palavras da interface.
- `analytics-events.js` — eventos enviados ao Google Analytics.

## Páginas de apoio e SEO

Além do leitor principal, o repositório contém páginas orientadas a buscas específicas e materiais em diretórios próprios, como `conteudos/`, `aprender-ingles-sozinho/` e outras páginas temáticas.

## Manutenção

Antes de alterar a ordem dos scripts em `index.html`, consulte `docs/ARCHITECTURE.md`. Alguns módulos funcionam como extensões do núcleo e dependem de serem carregados depois de `app.js`.

Evite renomear arquivos publicados sem atualizar simultaneamente todas as referências em HTML, metadados e páginas de apoio.

## Publicação

O GitHub Pages deve publicar a branch `main` a partir da raiz (`/`). O arquivo `.nojekyll` deve permanecer no repositório.

## Uso da obra

A página editorial do livro informa que a obra pode ser livremente copiada, reproduzida, distribuída, compartilhada e reutilizada, total ou parcialmente, em qualquer mídia ou formato, sem necessidade de autorização prévia do autor.
