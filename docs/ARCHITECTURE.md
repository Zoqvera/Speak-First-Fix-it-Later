# Arquitetura do repositório

Este documento descreve a organização técnica do livro digital **Speak First. Fix It Later.** e serve como referência para manutenção.

## 1. Entrada da aplicação

`index.html` é o ponto de entrada do site. Ele concentra:

- metadados de SEO;
- Open Graph e Twitter Cards;
- Schema.org;
- estrutura do leitor;
- ordem de carregamento de CSS;
- ordem de carregamento de JavaScript.

A ordem dos scripts deve ser tratada como parte da arquitetura. Alguns arquivos alteram funções declaradas anteriormente e, portanto, precisam ser carregados depois do núcleo.

## 2. Núcleo do leitor

`app.js` contém o comportamento-base:

- montagem e paginação do livro;
- navegação;
- cálculo das páginas;
- persistência da posição de leitura;
- criação do sumário;
- adaptação entre desktop e mobile.

`styles.css` contém a base visual do leitor e as regras responsivas globais.

## 3. Camada de conteúdo

`book-content.js` inicializa o conteúdo-base.

Os capítulos e reflexões são carregados depois, por meio de arquivos específicos. Há três padrões principais:

- `chapter-XX.js` — conteúdo de capítulo;
- `chapter-XX-reflections.js` — versão em reflexões;
- `chapters-XX-YY.js` — agrupamento histórico de capítulos.

Arquivos editoriais especiais:

- `introduction-override.js` — introdução atual;
- `epilogue.js` — epílogo;
- `references.js` — referências bibliográficas;
- `content-cleanup.js` — normalização do conteúdo carregado.

## 4. Extensões do leitor

Os arquivos abaixo estendem o comportamento do núcleo sem substituir a aplicação inteira:

- `cover-page.js` / `cover-page.css` — capa e informações editoriais;
- `reader-font-controls.js` / `.css` — tamanho da fonte;
- `reader-transitions.js` / `.css` — transições entre páginas;
- `edge-page-navigation.js` / `.css` — navegação pelas bordas;
- `global-reading-progress.js` — cálculo global do progresso;
- `page-jump-fix.js` — correções do campo de página em dispositivos móveis;
- `page-jump-navigation-fix.js` — salto direto para uma página;
- `desktop-page-density.js` — densidade de conteúdo no desktop;
- `desktop-total-book-pages.js` — ajuste da paginação total em desktop;
- `hide-word-count.js` — remove a contagem de palavras da interface;
- `analytics-events.js` — instrumentação do Google Analytics.

## 5. SEO e páginas auxiliares

A raiz contém `sitemap.xml`, `robots.txt` e `404.html`.

Diretórios temáticos, como `conteudos/` e páginas orientadas a buscas específicas, são páginas independentes do leitor. Não devem ser movidos sem revisar URLs indexadas, links internos, sitemap e canonical URLs.

## 6. Imagens

`capa.png` é usada pelo leitor. `capa.webp` é usada nos metadados sociais e estruturados.

Antes de remover qualquer imagem histórica ou alternativa, confirme que ela não é usada por páginas secundárias ou materiais externos.

## 7. Regras de manutenção

1. Não alterar a ordem de carregamento dos scripts sem verificar dependências.
2. Não mover arquivos publicados sem atualizar todas as referências.
3. Não remover páginas temáticas sem atualizar `sitemap.xml` e links internos.
4. Preservar `.nojekyll`, pois o site é servido diretamente pelo GitHub Pages.
5. Preferir alterações pequenas e rastreáveis em vez de grandes reestruturações que possam quebrar URLs públicas.
6. Validar desktop e mobile depois de mudanças em paginação, layout ou tipografia.

## 8. Direção recomendada para refatorações futuras

A raiz ainda concentra muitos arquivos porque o projeto evoluiu incrementalmente. Uma reorganização física em pastas como `assets/`, `css/`, `js/` e `content/` é possível, mas deve ser feita em uma única alteração coordenada, atualizando todos os caminhos no mesmo commit e preservando as URLs públicas das páginas indexadas.
