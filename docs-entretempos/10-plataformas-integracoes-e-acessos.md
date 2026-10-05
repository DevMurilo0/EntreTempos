# Plataformas, integrações e acessos — Entre Tempos

Este arquivo documenta o papel de cada serviço. Ele NÃO deve conter senhas reais.

## GitHub

**Função:** código-fonte e histórico.

- Repositório: `DevMurilo0/EntreTempos`
- Branch de produção: conferir no repositório/Vercel antes de alterar fluxo.
- Acesso ideal para novo programador: convite como colaborador, em vez de compartilhar senha da conta principal.

Nunca compartilhar:

- senha GitHub;
- token pessoal;
- recovery codes;
- cookie de sessão.

## Vercel

**Função:** hospedagem e deploy do site.

- Produção: `https://entretempos.blog.br/`
- Host antigo redirecionado: `entretempos.vercel.app`

Acesso deve ser concedido pela equipe/projeto da Vercel quando possível.

Verificar em caso de manutenção:

- projeto conectado ao GitHub;
- domínio;
- deploy mais recente;
- logs de deploy;
- DNS/domínio.

## Domínio

**Função:** manter o endereço público independente da hospedagem.

- Domínio: `entretempos.blog.br`

No inventário privado deve constar:

- registrador;
- e-mail proprietário;
- 2FA;
- data de renovação;
- local seguro da senha.

Nunca publicar senha do registrador.

## Firebase

**Função:** autenticação e banco de dados.

- Project ID: `entretempos-27471`
- Auth domain: `entretempos-27471.firebaseapp.com`

Serviços usados:

- Authentication;
- Firestore.

A configuração web existente no JavaScript é pública. Ela não substitui regras de segurança.

Novo programador deve ser adicionado ao projeto Google/Firebase pelo mecanismo de permissões da conta, sem receber senha da conta principal.

## Firebase Authentication

Usado para:

- pesquisador por e-mail/senha;
- visitantes anônimos em likes/upvotes.

A conta de pesquisador deve permanecer controlada.

No inventário privado registrar:

- e-mail da conta editorial;
- quem é o responsável;
- método de recuperação;
- onde a senha está guardada.

Não colocar essa senha neste repositório.

## Firestore

Usado para:

- inscrições;
- participantes;
- publicações;
- conteúdo legado/overrides;
- ordem editorial;
- Tops;
- upvotes;
- curtidas;
- podcast dinâmico.

As regras efetivas precisam ser consultadas no Firebase Console porque não há `firestore.rules` versionado atualmente.

## Cloudinary

**Função:** armazenar mídia enviada pela interface.

- Cloud name: `uaisf2vc`
- Upload preset: `entre_tempos_upload`

Usos:

- fotos;
- imagens;
- capas;
- vídeos;
- mídia de podcast.

O upload preset usado no cliente precisa continuar compatível com os formatos/tamanhos necessários.

No inventário privado registrar:

- e-mail proprietário da conta;
- onde a senha está guardada;
- API key, se algum backend futuro precisar;
- API secret somente em cofre/variável de ambiente, nunca no front-end.

## Google Analytics / Google tag

**Função:** métricas de acesso.

ID inserido nas páginas:

`G-GJFVC2LH9T`

Acesso deve ser compartilhado pela propriedade/conta do Google Analytics.

Não compartilhar a senha do Google.

## Google Search Console

**Função:** acompanhar indexação, sitemap e presença no Google.

Propriedade associada ao domínio/site deve ser conferida na conta Google responsável.

Itens importantes:

- sitemap;
- páginas indexadas;
- erros de rastreamento;
- canonical;
- domínio oficial.

Acesso deve ser concedido adicionando o e-mail do novo responsável à propriedade.

## Contas Google

Firebase, Analytics e Search Console podem estar ligados à mesma conta Google ou a contas diferentes.

A documentação pública não deve afirmar um e-mail específico sem confirmação.

No inventário privado, registrar para cada plataforma:

- e-mail;
- proprietário;
- recuperação;
- 2FA;
- nível de acesso;
- onde a senha está guardada.

## Como transferir o projeto para outro programador

A ordem recomendada é:

1. adicionar no GitHub;
2. adicionar no projeto Vercel;
3. adicionar no Firebase/Google Cloud;
4. adicionar no Analytics;
5. adicionar no Search Console;
6. adicionar no Cloudinary, se o plano/conta permitir membros;
7. adicionar acesso ao domínio;
8. testar login e deploy;
9. somente depois remover acessos antigos, se necessário.

Evite entregar uma lista de senhas como forma principal de transferência. Prefira convites e permissões individuais.
