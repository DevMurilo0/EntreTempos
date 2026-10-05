# Manual técnico para programadores — Entre Tempos

## 1. Estado atual do projeto

O Entre Tempos é um front-end em HTML, CSS e JavaScript ES Modules, sem framework obrigatório e sem etapa de build para a maior parte do site.

Principais serviços externos:

- GitHub — código-fonte;
- Vercel — hospedagem e deploy;
- Firebase Authentication — autenticação;
- Firebase Firestore — dados dinâmicos;
- Cloudinary — imagens e vídeos enviados pelo painel;
- Google Analytics / Google tag — métricas;
- Google Search Console — indexação;
- Registro do domínio — domínio `entretempos.blog.br`.

## 2. GitHub e deploy

Repositório:

`DevMurilo0/EntreTempos`

Fluxo esperado:

1. trabalhar em cópia local;
2. revisar `git status`;
3. validar alterações;
4. commit;
5. push para a branch usada em produção;
6. Vercel publica a nova versão.

Nunca usar `git push --force` como solução comum para conflitos.

Antes de commit:

```bash
git status
git diff --check
rg -n '^(<<<<<<<|=======|>>>>>>>)' .
```

## 3. Vercel

O site público é:

`https://entretempos.blog.br/`

O `vercel.json` atualmente cuida principalmente do redirecionamento do host antigo `entretempos.vercel.app` para o domínio oficial.

Não há backend próprio relevante no estado atual do repositório.

## 4. Firebase

Projeto:

`entretempos-27471`

O módulo central é:

`js/firebase-config.js`

Ele exporta:

- `app`
- `db`
- `auth`

A configuração web do Firebase é carregada no cliente. Esses identificadores não devem ser tratados como senha.

### Authentication

O projeto usa dois modos principais:

- conta de pesquisador por e-mail/senha;
- autenticação anônima para visitantes em recursos como likes/upvotes.

A autorização editorial não depende apenas de “estar logado”: vários módulos verificam se o usuário corresponde à conta autorizada de pesquisador.

O identificador dessa conta está atualmente hardcoded como constante em mais de um arquivo. Se a conta editorial mudar, procure por:

`PESQUISADOR_UID`
`ADMIN_UID`

e revise todas as ocorrências.

### Firestore

Coleções importantes observadas no código:

#### `inscricoes`

Dados enviados pelo “Faça Parte”.

Campos típicos:

- nome;
- contato;
- descricao;
- criadoEm;
- status.

#### `contatosUsados`

Evita múltiplas inscrições usando o mesmo contato normalizado/hash.

#### `participantesAutorais`

É a base do sistema editorial de pessoas e publicações.

Documentos normais representam pessoas. Cada pessoa pode ter subcoleção:

`conteudos`

Campos de pessoa podem incluir:

- nome;
- descricao;
- instagram;
- fotoUrl;
- fotoPublicId;
- fotoResourceType;
- secao;
- ativo;
- criadoEm;
- atualizadoEm;
- criadoPor.

Subdocumentos de conteúdo variam por seção: poema, desenho, música ou curiosidade.

Também existem estruturas especiais sob a mesma coleção, incluindo:

- `_ordem-secoes` — ordem editorial;
- `_legados` — overrides/estado de conteúdos antigos;
- `_poetas-estaticos` — compatibilidade com poetas antigos;
- `_podcasts` — episódios gerenciados pela interface atual.

#### `topConteudos`

Documentos por tipo/mês/ano.

ID:

`tipo-ano-mes`

Exemplos de tipo:

- filmes;
- musicas;
- livros.

Cada documento guarda um array `itens`.

#### `upvotes`

Documento por conteúdo:

`upvotes/{id}`

Campos incluem o total. Cada voto individual fica em:

`upvotes/{id}/usuarios/{uid}`

#### `curtidas`

Estrutura equivalente para likes:

`curtidas/{id}`
`curtidas/{id}/usuarios/{uid}`

## 5. Regras do Firestore

No estado atual do repositório não há arquivo `firestore.rules` versionado.

Isso significa que, ao dar manutenção, as regras efetivas devem ser conferidas no Firebase Console.

Essa é uma dependência operacional importante: alterar autenticação ou estrutura de coleções sem conferir regras pode quebrar gravações ou expor escrita indevida.

Recomendação técnica futura: versionar regras do Firestore no repositório, desde que não haja segredo dentro delas.

## 6. Cloudinary

Configurações públicas usadas pelo front-end:

- cloud name: `uaisf2vc`
- upload preset: `entre_tempos_upload`

Uploads são feitos diretamente do navegador por preset unsigned.

Usos:

- fotos de participantes;
- imagens de obras;
- vídeos;
- capas de livros;
- fotos de podcast.

Limites aplicados pelo front-end:

- imagens: **10 MB**;
- vídeos editoriais: **100 MB**.

Os uploads armazenam normalmente:

- `secure_url`;
- `public_id`;
- `resource_type`.

Nunca colocar no front-end:

- Cloudinary API Secret;
- credencial de Admin API;
- token privado.

## 7. Sistema compartilhado de participantes

Arquivos centrais:

- `js/autorais-galeria.js`
- `js/autorais-pessoa.js`
- `js/poetas-editor.js`
- `css/autorais-admin.css`

Seções reconhecidas:

- `poemas`
- `poemas-conhecidos`
- `desenhos`
- `desenhos-conhecidos`
- `musica`
- `curiosidades`
- `curiosidades-gerais`

O valor vem de `data-autorais-secao` no `body`.

Evite criar implementações paralelas por seção quando a infraestrutura compartilhada pode ser estendida.

## 8. Conteúdo legado

Parte do conteúdo ainda existe diretamente em HTML.

A arquitetura atual suporta override por Firestore:

HTML antigo → fallback  
Firestore com override → dado editado prevalece

Não apague URLs antigas ou páginas únicas sem necessidade.

Ao adicionar suporte administrativo a legado:

- use ID estável;
- não use índice visual como identidade;
- prefira marcar removido/ativo no Firestore;
- preserve o HTML como fallback quando possível.

## 9. Ordem editorial

A ordem de pessoas/cards é salva em estrutura especial do Firestore.

IDs de ordem não devem depender do texto visível.

Itens novos sem configuração devem entrar no final.

A interface suporta drag-and-drop e setas.

## 10. Tops e ranking

Arquivo compartilhado:

`js/top-conteudos.js`

Ele controla:

- período mês/ano;
- posições do editor;
- carregar/salvar `topConteudos`;
- IDs estáveis;
- atualização do ranking administrativo.

O ranking público usa `js/upvotes.js`.

Importante:

- `posicao` é desempate/base editorial;
- ranking visual é calculado pelos upvotes;
- IDs não devem mudar quando a posição visual muda.

## 11. Likes e upvotes

`js/likes.js` e `js/upvotes.js` usam Authentication anônima para identificar visitantes.

A persistência é local ao navegador.

Não substitua isso por IP, fingerprint ou dado pessoal sem necessidade.

## 12. Faça Parte

Arquivos principais:

- `faca-parte.html`
- `js/faca-parte.js`
- `admin/login.html`
- `admin/painel.html`
- `js/admin-login.js`
- `js/admin-painel.js`

O formulário grava no Firestore e o painel atualiza status em tempo real.

## 13. Podcast

Arquivos principais:

- `js/podcast-admin.js`
- `js/podcast-data.js`
- páginas dentro de `topicos/podcast/`

A implementação atual possui código histórico que ainda referencia a coleção `podcasts` em `podcast-data.js`, enquanto o painel novo usa a estrutura `participantesAutorais/_podcasts/conteudos`.

Antes de unificar ou remover código, confirme qual fluxo cada página está usando. Não migre dados “no escuro”.

## 14. Analytics e Search Console

A maior parte das páginas inclui a Google tag:

`G-GJFVC2LH9T`

A configuração Firebase também possui um `measurementId` próprio, mas isso não significa que seja o ID usado pelas páginas públicas.

Ao revisar métricas, trate o ID inserido via `gtag.js` como a referência do site atual.

SEO também depende de:

- `sitemap.xml`;
- `robots.txt`;
- canonical;
- Open Graph;
- domínio oficial.

## 15. Domínio

Domínio oficial:

`entretempos.blog.br`

Se houver migração de hospedagem:

1. não cancelar o domínio;
2. atualizar DNS;
3. manter redirecionamentos do domínio/host antigo;
4. revisar canonical, sitemap e Search Console.

## 16. Credenciais e segredos

Não guardar em Git:

- senhas;
- e-mails + senhas em texto;
- códigos 2FA;
- chaves de recuperação;
- Firebase Admin SDK;
- Cloudinary API Secret;
- token GitHub;
- cookies;
- arquivos `.env` com segredo.

Use um gerenciador de senhas ou cofre privado.

O documento `10-plataformas-integracoes-e-acessos.md` explica quais contas precisam existir e como transferir acesso.

## 17. Pontos de atenção atuais

- documentação antiga ainda descreve o projeto como puramente estático;
- não há regras Firestore versionadas no repositório;
- existe código de podcast em duas estruturas de dados diferentes;
- o UID editorial está repetido em múltiplos módulos;
- conteúdos antigos e novos convivem;
- mudanças em Cloudinary/preset podem afetar vários formulários ao mesmo tempo.

Antes de refatoração grande, testar:

- visitante não autenticado;
- pesquisador;
- celular;
- cadastro/edição;
- upload;
- ordem editorial;
- likes/upvotes;
- Top por mês;
- podcast;
- Faça Parte.
