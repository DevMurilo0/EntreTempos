# Página inicial (`index.html`) e menu (`folha.html`)

## `index.html` — a capa

É a primeira coisa que o visitante vê. Usa `css/style.css` e
`js/script.js`. As partes principais, de cima pra baixo:

- **Hero** (`.hero-text`): título "Revista Entre Tempos" com uma
  ampulheta (`img/inicial/ampulheta.webp`) que **gira 180° quando
  você clica nela** — é um easter egg, o código tá em `script.js`
  (evento de `click` e `touchend` separados, porque no celular precisa
  prevenir o "click fantasma" depois do toque).
- **Carrossel** (`.carousel`): 3 banners que trocam sozinhos a cada 4
  segundos. Se o usuário clicar na seta, o autoplay pausa por 7
  segundos e depois volta. Pra adicionar um banner novo: solta a
  imagem em `img/inicial/`, cria um `<div class="slide">` novo dentro
  de `.slides` e ajusta a lógica de índice em `script.js`
  (`totalSlides` já pega automaticamente pela quantidade de
  `.slide`, então normalmente nem precisa mexer no JS).
- **Guia de Conteúdos** (`.guia-conteudos`): os 6 cards que resumem
  cada seção (Filmes, Poemas, Livros, Desenhos, Curiosidades,
  Músicas). São só cards informativos, não tem link — quem leva pro
  menu de verdade é o botão "Vamos lá" lá embaixo.
- **Chamada da equipe:** botão que leva pra `sobre-o-site/index.html`.
- **Botão final "Vamos lá"** (`.acesso-folha`): leva pro `folha.html`,
  o menu de verdade.

### Sobre os stickers

Tem duas versões dos mesmos adesivos decorativos: uma pro desktop
(espalhados pela página, cada um numa posição fixa via CSS) e outra
pro mobile (`.stickers-mobile`, agrupados embaixo do título "A
Revista"). Isso é proposital — no celular, adesivo espalhado por toda
a tela vira bagunça. Se for adicionar um sticker novo, lembra de
pensar nas duas versões.

## `folha.html` — o menu interativo

Essa é a página mais "programada" do projeto — o menu inteiro (as
pegadas + etiquetas) é gerado via JavaScript, não é HTML escrito à
mão. A cena tem: uma lua, uma pilha de livros, um bilhete e 4
polaroids soltas pra dar ambientação — mas as **pegadas com as
etiquetas de cada seção são criadas dinamicamente** a partir de um
array.

### Como adicionar uma seção nova no menu

Isso é a tarefa mais comum que vai aparecer. O passo a passo:

1. Abra `folha.html` e ache o array `categories` (dentro da tag
   `<script>`, no fim do arquivo).
2. Adicione um objeto novo na lista, seguindo o padrão:
   ```js
   { label: "", href: "/topicos/fotografia/fotografia.html", cls: "fp--8", rotate: 90, tagImg: "Etiqueta-fotografia.webp" }
   ```
   - `cls`: precisa ser único (`fp--1` até `fp--7` já estão em uso,
     então a próxima seria `fp--8`).
   - `href`: caminho absoluto a partir da raiz do site (repara no `/`
     no começo).
   - `rotate`: ângulo em graus da pegada (pode ser qualquer valor,
     é só estético — ajuste até parecer natural na cena).
   - `tagImg`: nome do arquivo da etiqueta, que precisa estar salvo em
     `img/folha/`.
3. Desenhe/exporte a etiqueta nova (mesmo estilo das outras, aged
   paper com o nome da seção) e salve em `img/folha/Etiqueta-nome.webp`.
4. Abra `css/folha.css` e adicione as regras de posicionamento pra
   classe nova (`.fp--8 { top: X%; left: Y%; }`), tanto pro bloco
   desktop quanto pro bloco `@media (max-width: 768px)` — sem isso a
   pegada nova nasce em `(0,0)` e some atrás de outra.
5. O JS já cuida de criar o elemento `<div class="footprint-group">`
   (a pegada, que gira) e o `<a class="tag-group">` (a etiqueta, que
   NÃO gira junto — fica sempre legível).

### Por que a etiqueta não gira junto com a pegada

É proposital: a pegada roda pra parecer "pisada torta no chão", mas
a etiqueta (que tem o texto/nome da seção) precisa ficar legível, daí
ela é um elemento separado, posicionado por cima, sem herdar a
rotação do `.footprint-group`. Se um dia quiser criar uma pegada nova
e ela nascer com a etiqueta torta, provavelmente esse é o motivo —
confira se `tag-group` está fora do `wrap` que recebe o `rotate`.
