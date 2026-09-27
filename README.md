# Entre Tempos

> Revista eletrônica escolar produzida por estudantes da Escola de Referência Professor Antônio Farias (EREMPAF), em Gravatá, Pernambuco.

**Site:** https://entretempos.blog.br/

A **Entre Tempos** é uma revista eletrônica escolar criada para reunir produção artística, cultura, recomendações e participação estudantil em um espaço digital próprio.

O projeto mistura a linguagem visual de uma revista impressa com recursos interativos da web. A navegação foi construída com uma identidade editorial inspirada em papel, colagens, carimbos, fotografias e elementos gráficos espalhados pelas páginas.

---

## O projeto

A revista reúne diferentes áreas de conteúdo:

- **Poemas**
- **Desenhos**
- **Filmes**
- **Livros**
- **Música**
- **Curiosidades**
- **Podcast**
- **Enquetes**

Além do conteúdo editorial, o site possui recursos para participação e atualização da própria revista, como Tops mensais, votos, gerenciamento de conteúdo e envio de interesse pelo **Faça Parte**.

O objetivo é criar um espaço onde trabalhos, opiniões, recomendações e produções dos estudantes possam continuar disponíveis para além da sala de aula.

---

## Principais recursos

### Conteúdo editorial

As seções ficam organizadas dentro de `topicos/` e possuem páginas próprias, estilos e comportamentos específicos.

Algumas áreas utilizam uma estrutura de galeria e páginas autorais; outras, como **Filmes**, **Livros** e **Música**, possuem rankings mensais administráveis.

### Tops e upvotes

Os Tops de conteúdos podem ser atualizados pelos pesquisadores da revista e possuem sistema de **upvotes**.

A classificação exibida ao público é definida dinamicamente pelos votos, mantendo a identidade de cada conteúdo independentemente da posição ocupada no ranking.

### Faça Parte

A página `faca-parte.html` permite que estudantes enviem interesse em participar da revista, informando nome, contato e como gostariam de contribuir.

As inscrições são armazenadas no **Firebase Firestore** e podem ser acompanhadas pela equipe responsável.

### Área dos pesquisadores

O projeto possui uma área reservada em `admin/`, usada pelos pesquisadores para acessar ferramentas internas e gerenciar informações da revista.

Entre os recursos administrativos estão o acompanhamento de inscrições e a edição de conteúdos que possuem gerenciamento integrado ao site.

### Podcast

A seção de podcast possui listagem de episódios e páginas individuais. Os metadados são armazenados no Firestore e a mídia é integrada ao **Cloudinary**.

### SEO e métricas

O projeto também possui:

- domínio próprio;
- `sitemap.xml`;
- `robots.txt`;
- URLs canônicas;
- metadados Open Graph;
- dados estruturados em JSON-LD;
- integração com Google Search Console;
- Google tag para métricas de acesso.

---

## Tecnologias

O projeto mantém uma arquitetura simples, sem framework de interface ou etapa obrigatória de build.

### Front-end

- **HTML5**
- **CSS3**
- **JavaScript ES Modules**
- **Google Fonts**

### Dados e serviços

- **Firebase / Firestore** — conteúdo dinâmico, inscrições, votos e outros dados da revista
- **Firebase Authentication** — autenticação utilizada pelos recursos que precisam identificar usuários
- **Cloudinary** — armazenamento e entrega de mídia usada por partes do projeto
- **Vercel** — hospedagem e deploy
- **Google Search Console** — acompanhamento de indexação
- **Google tag / Analytics** — métricas de acesso

---

## Estrutura do repositório

```text
EntreTempos/
├── index.html               # Página inicial da revista
├── folha.html               # Navegação principal entre as seções
├── faca-parte.html          # Formulário para novos participantes
│
├── admin/                   # Login e painel dos pesquisadores
├── css/                     # Estilos globais e compartilhados
├── js/                      # Lógica compartilhada e integrações
├── img/                     # Imagens e elementos gráficos gerais
│
├── topicos/
│   ├── autorais/
│   ├── curiosidades/
│   ├── desenhos/
│   ├── enquetes/
│   ├── filmes/
│   ├── livros/
│   ├── musica/
│   ├── podcast/
│   └── poemas/
│
├── docs-entretempos/        # Documentação e anotações internas
├── robots.txt
├── sitemap.xml
└── vercel.json
```

### Arquivos JavaScript importantes

Alguns módulos compartilhados ajudam a conectar as diferentes partes do projeto:

- `js/firebase-config.js` — configuração do Firebase utilizada pelo front-end;
- `js/upvotes.js` — sistema de votação dos Tops;
- `js/top-conteudos.js` — carregamento e gerenciamento compartilhado dos Tops;
- `js/faca-parte.js` — envio das inscrições do Faça Parte;
- `js/admin-login.js` e `js/admin-painel.js` — área dos pesquisadores;
- `js/podcast-data.js` — leitura dos episódios do podcast;
- `js/podcast-admin.js` — gerenciamento dos episódios;
- `js/likes.js` — sistema de curtidas;
- `js/enquetes.js` — funcionamento das enquetes.

---

## Executando localmente

Não há uma etapa de build obrigatória.

Clone o repositório:

```bash
git clone https://github.com/DevMurilo0/EntreTempos.git
cd EntreTempos
```

Depois sirva a pasta por HTTP. Por exemplo, com Python:

```bash
python3 -m http.server 5500
```

E acesse:

```text
http://localhost:5500
```

Também é possível usar extensões como **Live Server** no VS Code.

> Abrir os arquivos diretamente com `file://` não é recomendado, pois o projeto utiliza módulos JavaScript, caminhos absolutos e serviços externos.

---

## Deploy

O site é hospedado na **Vercel**.

A branch principal é usada para o deploy do projeto, e o domínio público é:

**https://entretempos.blog.br/**

O arquivo `vercel.json` contém configurações específicas utilizadas pela hospedagem, incluindo o redirecionamento do endereço antigo da Vercel para o domínio oficial.

---

## Atualizando conteúdo

Antes de editar uma seção, identifique se o conteúdo é:

1. **estático**, escrito diretamente no HTML/JavaScript da página; ou
2. **dinâmico**, carregado do Firestore e gerenciado pela interface dos pesquisadores.

Isso evita editar manualmente um conteúdo que, na prática, é controlado pelo banco de dados.

As páginas de **Filmes**, **Livros** e **Música**, por exemplo, compartilham parte da infraestrutura de Tops e gerenciamento.

---

## Imagens e mídia

Sempre que possível, as imagens estáticas do repositório utilizam formatos otimizados, especialmente `.webp`.

O projeto também possui scripts auxiliares para otimização de mídia e usa Cloudinary em recursos que precisam de armazenamento externo.

Evite adicionar arquivos muito grandes diretamente ao repositório quando não for necessário.

---

## Documentação interna

A pasta `docs-entretempos/` contém documentação complementar sobre a organização e a evolução do projeto.

Parte desse material foi escrita em fases anteriores da Entre Tempos, então o próprio código atual deve ser considerado a referência principal quando houver diferença entre documentação antiga e implementação.

---

## Identidade do projeto

A Entre Tempos não tenta parecer um portal institucional tradicional.

A direção visual faz parte da experiência da revista: tipografia expressiva, colagens, papéis, carimbos, objetos recortados, texturas e elementos com aparência artesanal são características intencionais do projeto.

Ao criar novas páginas, a prioridade é manter essa linguagem visual sem comprometer legibilidade, responsividade e desempenho.

---

## Projeto escolar

A **Entre Tempos** é uma revista eletrônica escolar sem fins lucrativos, desenvolvida por estudantes da **Escola de Referência Professor Antônio Farias — EREMPAF**, em Gravatá, Pernambuco.

**Entre tempos, a palavra permanece.**
