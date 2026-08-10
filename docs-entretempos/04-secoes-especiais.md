# Seções que fogem do padrão (Filmes, Livros, Música, Podcast, Sobre o Site)

O padrão de "hub → autorais/conhecidos → pessoa" (ver
`03-padrao-topicos.md`) cobre Poemas, Desenhos e Curiosidades. As
seções abaixo têm uma lógica própria, cada uma explicada aqui.

## Filmes — Top 5 mensal com modal

Arquivos: `topicos/filmes/filmes.html` + `filmes.css` + `filmes.js`.

Tudo funciona a partir de **um objeto `filmesPorMes` dentro do
`filmes.js`**, indexado por número do mês (`0` = Janeiro, `5` =
Junho, etc — segue o índice do `Date().getMonth()` do JS). Cada mês é
uma lista de até 5 filmes, cada um com `nome`, `diretor`, `video`
(caminho do `.mp4` dentro de `mp4/`) e `descricao`.

**Pra adicionar o Top 5 de um mês novo:** copia o bloco de um mês
existente, troca a chave numérica e o conteúdo. Se o mês ainda não
tem filmes cadastrados, a página mostra automaticamente "Em breve os
filmes deste mês!" — não precisa criar bloco vazio.

O usuário navega entre meses com as setas (`seta-esq`/`seta-dir`,
looping de Dezembro pra Janeiro e vice-versa) e clica num filme pra
abrir um modal com a descrição e o trailer em vídeo (`filmeTrailer`).
O vídeo é pausado e descarregado (`.load()`) ao fechar o modal — isso
é de propósito, pra não ficar buffer de vídeo rodando escondido.

## Livros — Top 10 mensal com modal

Arquivos: `topicos/livros/livros.html` + `livros.css` + `livros.js`.
Mesmíssima lógica de Filmes (objeto `livrosPorMes` por número de mês,
navegação por seta, modal ao clicar), só que cada item tem `titulo`,
`autor`, `descricao`, `capa` (caminho da imagem em `img_livros/`),
`link` (URL externa pra ler/baixar o livro) e `linkTexto` (texto do
botão — usa "Baixar / Comprar" se não preencher). O próprio arquivo
`livros.js` já tem um comentário-tutorial completo no topo explicando
campo por campo — vale ler antes de mexer.

## Música — duas sub-seções dentro de um hub

`topicos/musica/musica.html` é o hub e leva pra dois lugares:

- **`top musica/top.html`** — o Top 10 de músicas do mês, seguindo o
  mesmíssimo padrão de Filmes/Livros (`musicasPorMes` dentro de
  `top musica/musica.js`, cada item com `nome`, `artista`, `video`,
  `descricao`).
- **`talento/talento.html`** — "Talento Musical": cada aluno com
  talento musical tem sua própria pasta (`talento/<Nome>/`) contendo
  `index.html` + `style.css` (usa o `pessoa.css` compartilhado da
  pasta `talento/`) + uma foto de capa + vídeos com botão de curtir
  (ver `05-sistema-de-likes.md`).

  **Cuidado com uma pasta duplicada/obsoleta:** existe
  `topicos/musica/top musica/talento/` com cópias antigas de
  Fernanda e Humberto que **não é** a versão usada pelo site (a
  ativa, referenciada pelo hub, é `topicos/musica/talento/`). Também
  tem uma pasta estranha aninhada em
  `topicos/musica/talento/img/Humberto/` que parece sobra de um
  copy-paste. Antes de "limpar" isso, confirme com quem mexeu por
  último — mas ao **adicionar** um aluno novo, use sempre
  `topicos/musica/talento/<Nome>/`, nunca a pasta dentro de
  `top musica/`.

## Podcast — busca em tempo real

`topicos/podcast/podcast.html` lista os episódios como cards e tem um
campo de busca (`#campo-busca`) que filtra em tempo real (evento
`input`, função `filtrarEpisodios()` no `<script>` do próprio HTML) —
por nome do entrevistado, apelido, assunto, tags ou nome do podcast.
Cada episódio individual mora em
`episodios/episodio-N/episodio-N.html`, usando `episodio.css`
compartilhado. Pra adicionar um episódio novo: cria a pasta
`episodios/episodio-N/`, copia a estrutura de um episódio existente,
e adiciona o card correspondente em `podcast.html` com os
dados/tags certos pra busca funcionar.

## Sobre o Site — a equipe por trás da revista

`sobre-o-site/index.html` + `style.css`. É a página "Por trás das
câmeras" (linkada da capa). Tem uma seção "Desenvolvedores da
Revista" com um card por dev (Murilo, Davi, Anna, Cícera), cada um
com um `<h3>` nome + uma `<div class="decoracoes-dev">` com ícones
soltos ao redor da foto — cada dev tem sua própria variação da classe
(`decoracoes-davi`, `decoracoes-anna`, `decoracoes-cicera`) porque os
ícones/hobbies são diferentes pessoa a pessoa (Murilo:
café/notebook/xadrez; Davi: gaita/java/github; etc). As imagens desses
ícones ficam em `sobre-o-site/img/decoracoes/`.

**Pra adicionar uma pessoa nova nessa seção:** copia o bloco de card
de um dev existente, troca a foto de perfil, o nome, e cria uma
classe `decoracoes-<nome>` nova com os ícones que fizerem sentido pra
essa pessoa (import os `.webp` certos em
`sobre-o-site/img/decoracoes/` e posiciona via CSS em
`sobre-o-site/style.css`).
