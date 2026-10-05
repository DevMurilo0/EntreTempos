# Manual dos pesquisadores — Entre Tempos

Este manual é para quem administra conteúdo da revista sem precisar editar código.

## 1. Entrando na área dos pesquisadores

Acesso:

`https://entretempos.blog.br/admin/login.html`

Use o e-mail e a senha da conta de pesquisador cadastrada no Firebase Authentication.

O sistema mantém a sessão salva no navegador. Se uma conta diferente da autorizada entrar, o site encerra essa sessão.

**Não compartilhe a senha em grupos, planilhas públicas ou no GitHub.**

## 2. Inscrições do “Faça Parte”

O painel de inscrições fica em:

`/admin/painel.html`

Cada inscrição mostra:

- nome;
- contato;
- como a pessoa gostaria de participar;
- data;
- status.

Status disponíveis:

- **Nova** — ainda não tratada;
- **Vista** — já foi conferida;
- **Aceita** — participação aprovada.

Ações:

- **Marcar como vista**;
- **Aceitar**;
- **Remover**.

Remover é definitivo no painel. Antes de remover, confirme se aquela inscrição realmente não precisa mais ser consultada.

## 3. Pessoas da revista

O sistema compartilhado de participantes atende:

- Poemas Autorais;
- Poetas Conhecidos;
- Desenhos Autorais;
- Artistas Conhecidos;
- Talentos Musicais;
- Curiosidades Autorais;
- Curiosidades Gerais, quando a seção usa o mesmo gerenciamento.

Quando o pesquisador está autenticado, aparecem controles administrativos nas páginas compatíveis.

### Adicionar pessoa

Campos:

- **Nome** — nome que será exibido;
- **Descrição** — pequena apresentação;
- **Instagram** — opcional;
- **Imagem da pessoa** — opcional.

O Instagram aceita:

- `usuario`
- `@usuario`
- `https://instagram.com/usuario`
- `https://www.instagram.com/usuario/`

O sistema normaliza para o usuário do Instagram.

A imagem deve ser um arquivo de imagem com até **10 MB**.

Depois de salvar a pessoa, o sistema encaminha para a página individual para adicionar o primeiro conteúdo.

## 4. Editar perfil

Na página da pessoa, pesquisadores podem alterar:

- nome;
- descrição;
- Instagram;
- foto.

Se não escolher uma nova foto, a foto atual é mantida.

## 5. Publicações por tipo

### Poemas

Campos principais:

- nome/título;
- autor/assinatura;
- texto do poema.

Existe também o fluxo **Editar tudo** para poetas, permitindo editar perfil e poemas existentes em uma única tela.

### Desenhos

Campos:

- nome/título;
- quem criou;
- imagem da obra.

Para artistas conhecidos também pode existir descrição da obra.

Imagem: até **10 MB**.

### Talentos Musicais

Campos:

- título da música;
- descrição;
- vídeo.

Vídeo: até **100 MB**.

O vídeo enviado vai para o Cloudinary; não é colocado diretamente no repositório Git.

### Curiosidades

Campos possíveis:

- nome/título;
- autor;
- texto/descrição;
- imagem;
- vídeo;
- opção de retrato menor para imagem/vídeo.

Imagens: até **10 MB**.  
Vídeos: até **100 MB**.

### Conteúdo antigo/legado

Alguns conteúdos já existiam no HTML antes do sistema administrativo.

Quando houver botão de edição, o pesquisador pode editar sem precisar mexer no arquivo HTML. A edição passa a ser registrada no Firestore e substitui visualmente os dados antigos.

Ao remover um item legado, o sistema pode marcá-lo como removido no Firestore em vez de apagar fisicamente o HTML original.

## 6. Organizar ordem

Nas galerias com **Organizar ordem**:

- no computador, arraste os itens;
- no celular, use as setas ↑ e ↓;
- finalize em **Salvar ordem**.

A ordem fica registrada no Firestore e passa a valer para os visitantes.

Itens antigos e novos podem fazer parte da mesma ordem editorial.

## 7. Tops de Filmes, Livros e Músicas

Os Tops possuem gerenciamento por mês e ano.

Ao abrir **Gerenciar Top**, escolha:

- mês;
- ano;
- posição visual.

A posição mostrada ao público pode mudar com os upvotes. O conteúdo mantém um ID próprio; os votos pertencem ao conteúdo, não ao número do Top.

### Filmes

Preencha:

- nome do filme;
- diretor;
- descrição;
- link do trailer no YouTube.

Use links normais do YouTube/YouTu.be. O sistema extrai o ID do vídeo.

### Livros

Preencha:

- título;
- autor;
- descrição;
- link “Ler online” — opcional;
- capa do livro;
- link para comprar.

A capa deve ser uma imagem de até **10 MB**.

Não existe mais upload/download de PDF dentro do sistema de livros.

### Músicas do Top

Preencha:

- nome da música;
- artista;
- descrição;
- link do vídeo no YouTube.

## 8. Upvotes

Visitantes votam usando a seta ▲.

Os votos alteram a classificação visual automaticamente. Em empate, o sistema usa a posição editorial anterior como critério de desempate.

Pesquisadores não devem renomear IDs manualmente no banco para “corrigir posição”; o ranking é calculado pelos votos.

## 9. Podcast

Na seção do podcast, o pesquisador pode adicionar novo episódio.

Campos iniciais:

- número do episódio;
- cargo/identificação do convidado;
- nome;
- descrição curta;
- foto;
- entrevistador 1;
- entrevistador 2.

Todos esses campos são exigidos na criação atual.

Depois o sistema abre a página interna do episódio para continuidade da edição.

A foto deve ser uma imagem de até **10 MB** e é enviada ao Cloudinary.

## 10. Boas práticas para pesquisadores

- Revise ortografia antes de salvar.
- Não coloque senha, telefone privado ou dado sensível dentro de descrições públicas.
- Use imagens autorizadas.
- Prefira títulos claros.
- Em Instagram, informe apenas o perfil da pessoa com autorização.
- Não remova conteúdo sem ter certeza.
- Antes de substituir mídia, confirme se o arquivo correto foi selecionado.
- Não edite diretamente o Firestore se a interface do site já oferece aquele controle.
