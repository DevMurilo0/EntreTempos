# O padrão que se repete em quase toda seção

Se você entender essa estrutura de 3 níveis, já sabe navegar (e criar
conteúdo) em Poemas, Desenhos e Curiosidades sem perguntar nada pra
ninguém. Música e Filmes têm uma variação (ver
`04-secoes-especiais.md`), mas a lógica de fundo é a mesma.

```
topicos/<secao>/
├── <secao>.html          ← NÍVEL 1: hub da seção
├── <secao>.css
├── img/                    imagens do hub
├── autorais/               NÍVEL 2A: trabalhos dos alunos
│   ├── autorais.html       galeria de quem publicou
│   ├── autorais.css
│   ├── pessoa.css          ← estilo COMPARTILHADO pelas páginas de pessoa
│   └── <nome-do-aluno>/    NÍVEL 3: página individual do aluno
│       └── index.html
└── conhecidos/              NÍVEL 2B: obras de gente famosa/consagrada
    ├── conhecidos.html      galeria de quem tá catalogado
    ├── conhecidos.css
    ├── pessoa.css
    └── <nome-do-artista>/   NÍVEL 3: página individual do artista/autor
        └── index.html
```

## Nível 1 — o hub (`<secao>.html`)

É a página que abre quando alguém clica na pegada do menu. Sempre tem
a mesma cara: título grande, um parágrafo de apresentação da seção, e
**dois cards grandes de navegação** — um pra "Autorais" (produção dos
alunos) e outro pra "Conhecidos" (obras/artistas consagrados). Ver
`topicos/desenhos/desenhos.html` como referência limpa desse padrão.

## Nível 2 — a galeria (`autorais.html` / `conhecidos.html`)

Lista quem está catalogado naquela seção, cada um como um card/link
que leva pra página individual (nível 3). É aqui que normalmente
entram as pequenas imagens decorativas soltas pela página (a pasta
`img-decor/` ou `img/` local do nível 2) — elas não têm função, são só
estética, tipo os "adesivos" espalhados no fundo pra não ficar vazio.

## Nível 3 — a página da pessoa

Cada aluno/artista tem sua própria pasta com um `index.html` (às
vezes `nome.html`) e imagens/vídeos próprios. O estilo visual dessa
página quase sempre vem de um arquivo **`pessoa.css` compartilhado**
que fica um nível acima (dentro de `autorais/` ou `conhecidos/`) —
ele define as classes reutilizáveis:

- **`.foto-pessoa`** — a foto de perfil grande, sempre levemente
  rotacionada e com sombra (`drop-shadow`), endireita no hover.
- **`.pessoa-nome`**, **`.pessoa-info`** — cabeçalho com nome e
  legenda.
- **`.obra-imagem-box`** — moldura/caixa que envolve cada obra
  (poema, desenho, foto) exibida na página. **Não confundir com
  `.foto-pessoa`/`.foto-nav`** — essas duas são só pra retratos de
  gente, `.obra-imagem-box` é pro conteúdo em si. Trocar uma pela
  outra bagunça o tamanho/proporção.

Pra criar uma pessoa nova nessa seção: copia a pasta de alguém
parecido (ex.: `autorais/anna/`), renomeia, troca as imagens e o
texto, e confirma que o `<link>` do CSS aponta pro `pessoa.css`
compartilhado (não cria um novo do zero, seria retrabalho e ia
divergir do padrão visual).

## Casos com sub-sub-nível (leituras, obras específicas)

Em `poemas` e `curiosidades`, tem um nível extra dentro da página da
pessoa: uma subpasta `leituras/` com um `<nome>.html` por obra
específica (ex.: `curiosidades/autorais/leituras/jose/jose.html`),
usando um `leitura.css` próprio daquele conjunto. É o mesmo padrão de
sempre, só que aplicado a "uma obra dentro da página de uma pessoa"
em vez de "uma pessoa dentro da galeria".

## Resumo rápido pra decidir onde editar

| Quero mudar...                              | Vou em...                                      |
|----------------------------------------------|-------------------------------------------------|
| Texto de apresentação da seção inteira        | `<secao>/<secao>.html`                          |
| Quem aparece na lista de autorais/conhecidos  | `<secao>/autorais/autorais.html` (ou conhecidos)|
| Conteúdo de UMA pessoa específica             | `<secao>/autorais/<nome>/index.html`            |
| Visual de TODAS as páginas de pessoa da seção | `<secao>/autorais/pessoa.css`                   |
| Visual só de uma pessoa                       | evite — se precisar, `style="..."` inline pontual, não crie CSS novo pra uma pessoa só |
