# Visão geral

## A estrutura de pastas

```
├── index.html              # capa da revista
├── folha.html               # menu interativo (as pegadas)
├── css/                      # CSS global (style.css = capa, folha.css = menu)
├── js/                       # JS global (script.js = capa, likes.js = curtidas)
├── img/                      # imagens genéricas (capa + menu)
├── sobre-o-site/              # página "Por trás das câmeras" (equipe)
├── sitemap.xml                # pro Google indexar
└── topicos/                    # AQUI mora a revista de verdade
    ├── poemas/
    ├── filmes/
    ├── livros/
    ├── desenhos/
    ├── musica/
    ├── curiosidades/
    └── podcast/
```

Cada pasta dentro de `topicos/` é uma seção da revista e é
praticamente independente — tem seu próprio CSS, suas próprias
imagens, às vezes seu próprio JS. Isso é proposital: se você mexer no
CSS de `poemas/`, não tem risco nenhum de quebrar `filmes/`. Cada
seção só compartilha o essencial (fontes do Google Fonts e o sistema
de likes).

## A estética que se repete em tudo

Não é um framework de design, é um "jeitão" que se repete manualmente
em cada CSS novo. Se for criar uma página nova, siga isso:

- **Fontes:** `Bebas Neue` (títulos grandes), `Special Elite`
  (corpo de texto, parece máquina de escrever), `IM Fell English`
  (textos "antigos"), `Dancing Script`/`Caveat` (assinaturas e
  poemas manuscritos).
- **Paleta:** tons de papel envelhecido (`#f2e8d5`, `#ede0c0`,
  `#d4b87a`) + vermelho/dourado de selo antigo (`#c0392b`, `#c4a96b`).
- **Textura de fundo:** quase toda página tem um `body::before` fixo
  com a imagem
  `https://www.transparenttextures.com/patterns/aged-paper.webp` (ou
  `paper-fibers.png`/`cream-paper.png`) em opacidade baixa (~0.4), pra
  dar aquele ar de papel velho.
- **Elementos levemente rotacionados:** fotos, cards e "recortes"
  quase nunca ficam retos — um `transform: rotate(-2deg)` aqui, um
  `rotate(6deg)` ali, sempre com um `:hover` que endireita ou
  aumenta um pouco. É o que dá a sensação de "colado à mão".

Se uma página nova ficar "quadrada demais" ou com fonte padrão do
navegador, ela vai destoar visualmente do resto — vale a pena copiar
o cabeçalho de fontes/CSS de uma página parecida já existente em vez
de começar do zero.

## Convenções que valem pra tudo

- **Todo `<img>` decorativo leva `loading="lazy" decoding="async"`.**
  Isso é padrão em 100% do projeto — copiar esse hábito evita a
  página carregar imagem que nem está visível ainda.
- **Todo `header` de página interna tem um link "← Voltar"** que
  aponta pro nível acima (o hub do tópico, ou `folha.html` na raiz).
  Repare no caminho relativo: quanto mais fundo a página está na
  árvore de pastas, mais `../` ela precisa.
- **Nomes de arquivo e pasta em português, sem acento, minúsculo,
  com hífen** (`sobre-o-site`, `top-musica` viraria `top musica` só
  nesse caso específico — mas evite espaço em nome de pasta daqui pra
  frente, é pegadinha pra path quebrado).
- **Comentários no código são informais, às vezes engraçados** —
  isso é intencional, é a "voz" do projeto (dá uma olhada em
  `index.html` e `folha.html` pra sentir o tom). Não precisa forçar
  piada, mas também não precisa ficar formal demais nos comentários.

## O que NÃO usar

- Sem frameworks CSS (Bootstrap, Tailwind) — é vanilla CSS de
  propósito, pra manter o visual 100% autoral.
- Sem React/Vue/build step. É HTML servido direto.
- Sem back-end próprio pro site em si. A única exceção é o Firebase
  do sistema de likes (ver `05-sistema-de-likes.md`).
