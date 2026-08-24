# Entre Tempos — guia pra quem for mexer no código

Esse aqui não é um README de "instala e roda", porque não tem o que
instalar — o site é HTML/CSS/JS puro, sem build, sem framework, sem
Node. Isso aqui é o mapa do labirinto: pra que serve cada pasta, como
as coisas se conectam e o que NÃO fazer quando for mexer.



Se você chegou aqui sem contexto nenhum: **Entre Tempos** é a revista
eletrônica dos alunos da EREMPAF (Gravatá-PE). Cada seção da revista
(Poemas, Música, Filmes, Livros, Desenhos, Curiosidades, Podcast) é
uma "gaveta" temática dentro da pasta `topicos/`, e o menu principal
(`folha.html`) é uma cena animada com pegadas no chão que levam pra
cada uma.

## Onde está hospedado

- **Site ao vivo:** https://entre-tempos.vercel.app/
- **Repositório:** https://github.com/DevMurilo0/EntreTempos
- Deploy é automático: dá push na `main` e a Vercel builda sozinha
  (não tem passo de build de verdade, ela só serve os arquivos
  estáticos).

## Os documentos desse pacote

Cada arquivo aqui cobre uma parte do site. Não precisa ler tudo antes
de mexer em algo pontual — vai direto no que interessa:

1. **`01-visao-geral.md`** — como o site é organizado por fora
   (pastas, convenções de nome, o estilo "revista velha" que se repete
   em tudo). Leia esse primeiro, é a base de tudo.
2. **`02-pagina-inicial-e-menu.md`** — `index.html` (a capa) e
   `folha.html` (o menu com as pegadas). Como adicionar uma seção nova
   no menu.
3. **`03-padrao-topicos.md`** — o "molde" que toda seção (Poemas,
   Desenhos, Música, Curiosidades) segue: hub → autorais/conhecidos →
   página de pessoa. Entenda esse padrão uma vez e você entende 80%
   do repositório.
4. **`04-secoes-especiais.md`** — as seções que fogem do molde:
   Filmes (Top 5 com modal), Livros (Top 10 com modal), Música (Top +
   Talento Musical), Podcast (com busca) e a página "Sobre o Site"
   (equipe).
5. **`05-sistema-de-likes.md`** — o sistema de curtidas com Firebase,
   como plugar em uma página nova.
6. **`06-imagens-e-otimizacao.md`** — de onde vêm as imagens, os
   scripts Python que comprimem tudo, e as regras de nome de arquivo.
7. **`07-fazendo-mudancas-comuns.md`** — receita de bolo pra tarefas
   do dia a dia: trocar texto, adicionar um aluno numa seção, criar
   seção nova do zero.

## Regra de ouro

O site inteiro é estático. Não existe back-end próprio — a única peça
"viva" é o Firebase (curtidas, e existe um projeto separado de
notificações, ver `INSTRUCOES-BACKEND-SEPARADO.md` se você tiver
recebido esse arquivo também). Se alguém sugerir adicionar Node,
React ou qualquer build step só pra fazer algo que dá pra fazer com
HTML/CSS/JS direto — desconfie. O motivo do projeto ser assim é
manter simples pra qualquer aluno conseguir mexer sem precisar
aprender uma stack inteira antes.
