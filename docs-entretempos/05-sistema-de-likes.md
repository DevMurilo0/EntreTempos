# Sistema de curtidas (likes)

A única parte "viva" do site — tudo mais é estático, mas os likes
persistem de verdade num banco (Firebase Firestore), com contagem
compartilhada entre todo mundo que visita.

Arquivo: `js/likes.js`. É um **módulo ES** (usa `import`), então
qualquer HTML que for usar precisa carregar assim:

```html
<script type="module" src="/js/likes.js"></script>
```

(repara o `type="module"` — sem isso o `import` do Firebase quebra
silenciosamente)

## Como funciona por baixo dos panos

- Login anônimo automático via Firebase Auth
  (`signInAnonymously`) — cada visitante ganha um UID anônimo, sem
  precisar cadastro nem login de verdade. É esse UID que identifica
  "quem já curtiu o quê" (pra não deixar curtir 2x, e pra descurtir
  funcionar).
- Cada "coisa curtível" tem um `id` de texto único, que vira um
  documento na coleção `curtidas` do Firestore, com um campo `total`.
  Se a pessoa curte, tem um sub-documento em
  `curtidas/<id>/usuarios/<uid>` marcando que ela curtiu.
- O número de curtidas atualiza **em tempo real pra todo mundo** via
  `onSnapshot` — se outra pessoa curtir enquanto você está com a
  página aberta, o número muda sozinho na tela, sem precisar dar
  refresh.

## Como usar numa página nova

Só precisa desse HTML — o `likes.js` faz o resto sozinho assim que a
página carrega:

```html
<button class="btn-like" data-like-id="ID-UNICO-AQUI" aria-label="Curtir">
  <span class="like-icon">♡</span>
  <span class="like-count">0</span>
</button>
```

O `data-like-id` é o que importa: **precisa ser único no site
inteiro** (não só na página). Convenção usada no projeto: algo tipo
`julio-desenho-1`, `bruno-video-2` — nome da pessoa + tipo de
conteúdo + número. Se dois botões em páginas diferentes usarem o
mesmo `data-like-id` por engano, eles vão compartilhar a mesma
contagem sem querer.

Se o botão for criado dinamicamente via JavaScript (depois que a
página já carregou — ex: abrindo um lightbox com conteúdo novo),
chame `window.initLikes()` manualmente depois de inserir o botão no
DOM. A função é idempotente (não duplica listener se chamar de novo
em cima do que já foi inicializado), então é seguro chamar de novo
"por garantia".

## As credenciais do Firebase estão no código, e tá tudo bem

`likes.js` tem a `firebaseConfig` (apiKey, authDomain, etc) direto no
código-fonte, visível pra qualquer um que abrir o "Ver código-fonte"
do navegador. **Isso não é uma falha de segurança** — chave do
Firebase Web SDK é pública por natureza, ela só identifica qual
projeto Firebase usar; quem protege os dados de verdade são as
**regras de segurança do Firestore**, configuradas no painel do
Firebase (não no repositório). Se algum dia o site parecer estar
sendo abusado (likes falsos em massa, etc), o ajuste é lá nas regras
do Firestore, não em esconder essa chave.
