# Entre Tempos · Revista Eletrônica



## Sobre o Projeto

**Entre Tempos** é uma revista eletrônica interativa desenvolvida com o intuito de celebrar e divulgar diferentes vertentes culturais e artísticas. O site apresenta uma interface imersiva e poética, que guia o leitor através de "pegadas" no tempo, explorando tópicos que vão desde a arte mais sutil até curiosidades do cotidiano.



## Propósito

O principal objetivo do projeto é oferecer uma experiência de leitura fluida e esteticamente agradável, onde o usuário pode explorar seções como Desenhos, Filmes, Livros, Música, Poemas e Curiosidades. Cada tópico serve como um pequeno universo, permitindo que os criadores e colaboradores compartilhem recomendações, textos autorais e obras conhecidas. 



## Tecnologias Envolvidas

O projeto foi construído utilizando as bases da web para garantir velocidade, leveza e facilidade de manutenção:

- **HTML5**: Semântica e estruturação das páginas.
- **CSS3 (Vanilla)**: Estilização completa, uso de variáveis, animações, media queries para responsividade e layouts. Feito sem o uso de frameworks externos para garantir um visual 100% autêntico e customizado (estilo artesanal/vintage).
- **JavaScript**: Interatividade da página, rotação dinâmica de elementos (como as etiquetas de menu em `folha.html`) e manipulação de classes.



---



## Estrutura do Código

O repositório está organizado de forma simples e modular, separando as responsabilidades para facilitar o trabalho de novos desenvolvedores e mantenedores de conteúdo:

```text
├── index.html          # Página inicial / capa da revista
├── folha.html          # O menu interativo (a tela com a lua, livros e as pegadas)
├── css/                # Folhas de estilo globais (incluindo o CSS do folha.html)
├── js/                 # Scripts globais
├── img/                # Todos os recursos visuais e decorativos genéricos
└── topicos/            # Pasta contendo os temas centrais da revista
    ├── curiosidades/   # HTML, imagens e CSS específicos para a seção de Curiosidades
    ├── desenhos/       # HTML, imagens e CSS específicos para a seção de Desenhos
    ├── filmes/         # HTML, imagens e CSS específicos para a seção de Filmes
    ├── livros/         # ...
    ├── musica/         # ...
    └── poemas/         # ...
```

- **`folha.html`**: É o coração da navegação. Usa JavaScript nativo (array `categories`) para injetar dinamicamente as categorias e posicionar as "pegadas" e "etiquetas" na tela de modo criativo.
- **Tópicos (`/topicos`)**: Cada assunto (ex: `/desenhos`) possui sua própria pasta contendo o arquivo HTML principal, um arquivo CSS particular (ex: `desenhos.css`), imagens exclusivas do tópico e subdivisões internas (como "autorais" e "conhecidos").



---



## Como Fazer Futuras Atualizações

Se você é um desenvolvedor ou contribuidor querendo modificar o conteúdo ou adicionar novas páginas, siga as diretrizes abaixo:



### 1. Alterar Textos ou Imagens de uma Seção Existente

Vá até o arquivo `.html` do respectivo tópico. Exemplo: para mudar a descrição da página de Desenhos, abra `topicos/desenhos/desenhos.html`. 
As novas imagens devem ser salvas na pasta `img/` do tópico correspondente, preferencialmente no formato `.webp` ou `.png` (para manter transparências) a fim de otimizar o carregamento.



### 2. Modificar Estilos e Responsividade (CSS)

Sempre que precisar alterar cores, espaçamentos ou responsividade de uma página específica, vá até o arquivo CSS **daquela página** (ex: `topicos/desenhos/desenhos.css`). 
- **Dica Mobile:** O projeto possui pontos de quebra (*Breakpoints*) para dispositivos móveis configurados em `@media (max-width: 768px)`. Faça todas as adaptações mobile dentro desse bloco para manter a coesão visual e não quebrar o layout do desktop.



### 3. Adicionar uma Nova Categoria no Menu (folha.html)

Se a revista ganhar um novo tema no futuro (ex: "Fotografia"), siga os passos:

1. Crie a pasta `topicos/fotografia/` e adicione os arquivos base (`fotografia.html` e `fotografia.css`).
2. Abra o arquivo `folha.html` e localize o array `categories` na tag `<script>`.
3. Adicione um novo objeto à lista, respeitando o padrão de classes `fp--X`:
   ```javascript
   { label: "", href: "/topicos/fotografia/fotografia.html", cls: "fp--7", rotate: 90, tagImg: "Etiqueta-fotografia.webp" }
   ```
4. Em seguida, vá até o arquivo `css/folha.css`, adicione as regras de posicionamento para o novo elemento (`.fp--7 { top: X%; left: Y%; }`) e configure as rotações e animações de *hover* da nova categoria, tanto para desktop quanto para o bloco de mobile.



### 4. Executando o Projeto Localmente

Por ser um projeto puramente estático (sem banco de dados ou Node.js em background), não há processos complexos de instalação:

1. Clone o repositório ou abra a pasta do projeto no VSCode (ou seu editor favorito).
2. Utilize a extensão **Live Server** e clique em *Go Live* ou simplesmente abra o arquivo `index.html` no seu navegador.