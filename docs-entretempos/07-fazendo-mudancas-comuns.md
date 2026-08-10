# Receitas pra tarefas do dia a dia

Coisas que vão pedir com frequência, resumidas em passo a passo.

## "Muda esse texto/imagem de uma seção que já existe"

1. Acha o `.html` certo (ver a tabela em `03-padrao-topicos.md` se
   não souber de cara em qual nível a informação está).
2. Edita o texto direto no HTML, ou troca a imagem: salva o arquivo
   novo dentro da pasta `img/` daquele mesmo tópico (de preferência
   `.webp`), e ajusta o `src` do `<img>` pra apontar pro nome novo.
3. Se for imagem grande (foto tirada de celular, por exemplo), passa
   pelo `optimize_media.py` antes de subir (ver
   `06-imagens-e-otimizacao.md`) — evita subir foto de 8MB pro
   repositório.

## "Adiciona um aluno/artista novo numa seção com autorais/conhecidos"

(Poemas, Desenhos, Curiosidades — o padrão de 3 níveis)

1. Dentro de `topicos/<secao>/autorais/` (ou `conhecidos/`), copia a
   pasta de alguém parecido como base — ex: `autorais/anna/` vira
   `autorais/novo-nome/`.
2. Troca as imagens da pasta pelas do novo aluno, edita o texto do
   `index.html`.
3. Confirma que o CSS da página continua apontando pro `pessoa.css`
   compartilhado daquele nível (não duplica CSS).
4. Volta pra `autorais.html` (o nível 2, a galeria) e adiciona um
   card/link novo apontando pra pasta que você acabou de criar.

## "Adiciona um filme/livro/música no Top do mês"

(Filmes, Livros, Top Música)

1. Abre o `.js` da seção (`filmes.js`, `livros.js`, ou
   `top musica/musica.js`).
2. Acha (ou cria) o bloco do mês certo dentro do objeto
   `filmesPorMes`/`livrosPorMes`/`musicasPorMes` — a chave é o número
   do mês, `0` = Janeiro até `11` = Dezembro.
3. Copia um item existente dentro da lista daquele mês e edita os
   campos.
4. Solta o arquivo de vídeo/capa na pasta `mp4/` ou `img_livros/`
   correspondente, e aponta o caminho certo no campo `video`/`capa`.

## "Adiciona um aluno em Talento Musical"

1. Cria a pasta `topicos/musica/talento/<Nome>/` (a pasta ativa é
   essa, **não** a de dentro de `top musica/` — ver o aviso em
   `04-secoes-especiais.md`).
2. Copia a estrutura de outra pessoa (`index.html` + `style.css` +
   vídeos) como base.
3. Se quiser sistema de curtidas nos vídeos dessa pessoa, segue
   `05-sistema-de-likes.md` — lembra de dar um `data-like-id` único.
4. Adiciona o link/card novo em `talento.html`.

## "Cria uma seção inteiramente nova na revista" (tipo "Fotografia")

1. Cria a pasta `topicos/fotografia/` com `fotografia.html` +
   `fotografia.css` + `img/` — usa o hub de outra seção
   (`topicos/desenhos/desenhos.html` é uma referência limpa) como
   ponto de partida, trocando texto e imagens.
2. Se a seção nova for seguir o padrão autorais/conhecidos, cria as
   subpastas `autorais/` e `conhecidos/` com a mesma estrutura das
   outras seções (ver `03-padrao-topicos.md`).
3. Adiciona a categoria nova no menu `folha.html` — passo a passo
   completo em `02-pagina-inicial-e-menu.md`.
4. Roda `optimize_media.py` depois de colocar todas as imagens, antes
   de commitar.

## "O site tá com scroll horizontal estranho numa página nova"

Bug conhecido que já apareceu antes: elemento decorativo posicionado
com `transform`/`left` negativo empurra o conteúdo pra fora da tela.
A correção que já funcionou: garantir `overflow-x: hidden` tanto no
`html` quanto no `body` daquele CSS — só no `body` não resolve
sozinho.

## "Quero commitar e ver no ar"

Não tem passo de build — é só:

```bash
git add .
git commit -m "descrição do que mudou"
git push
```

A Vercel builda e publica sozinha em https://entre-tempos.vercel.app/
alguns segundos depois do push na branch principal.
