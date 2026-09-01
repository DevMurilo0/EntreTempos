/* =============================================
   LIVROS.JS — Entre Tempos · Navegação por Mês + Modal
   ============================================= */
const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

/* ═══════════════════════════════════════════════════════════
   COMO ADICIONAR OS LIVROS DE UM MÊS

   Cada mês é uma chave numérica de 0 a 11 (0 = Janeiro, 1 =
   Fevereiro, ... 5 = Junho, 6 = Julho, ... 11 = Dezembro).
   Dentro de cada mês, é uma lista de livros na ordem do Top 10.

   Para cada livro, preencha:
     titulo     -> nome do livro
     autor      -> nome do autor (opcional, pode remover a linha)
     descricao  -> texto que aparece dentro do pop-up
     capa       -> caminho da imagem da capa (coloque o arquivo
                   dentro da pasta img/ e aponte pra ele aqui;
                   se deixar em branco, usa uma capa genérica)
     link       -> URL para baixar o PDF ou comprar o livro
     linkTexto  -> texto do botão do link (ex.: "Baixar PDF" ou
                   "Comprar livro"). Se não preencher, usa
                   "Baixar / Comprar" como padrão.

   Para criar um mês novo: copie um bloco inteiro (a chave
   numérica + a lista de livros com { } entre colchetes [ ]),
   troque o número da chave e o conteúdo de cada livro.
   ═══════════════════════════════════════════════════════════ */

const livrosPorMes = {
  5: [ // Junho
    {
      titulo: "A Metamorfose",
      autor: "Franz Kafka",
      descricao: "Gregor Samsa acorda transformado em um enorme inseto e passa a enfrentar o isolamento, o preconceito e a incompreensão da própria família. A obra é um dos maiores clássicos da literatura mundial e aborda temas como alienação, identidade e condição humana.",
      capa: "img_livros/metamorfose.webp",
      link: "https://colegiocngparanagua.com.br/wp-content/uploads/2021/02/A-METAMORFOSE.pdf",
      linkTexto: "Ler"
    },
    {
      titulo: "A Volta ao Mundo em 80 Dias",
      autor: "Júlio Verne",
      descricao: "O excêntrico inglês Phileas Fogg aposta que consegue dar a volta ao mundo em apenas 80 dias. Ao lado de seu fiel criado Passepartout, ele embarca em uma aventura repleta de desafios, imprevistos e descobertas através de diferentes países e culturas.",
      capa: "img_livros/80dias.webp",
      link: "https://www.netmundi.org/home/wp-content/uploads/2020/10/A-volta-ao-mundo-em-80-dias-julio-verne.pdf",
      linkTexto: "Ler"
    },
    {
      titulo: "Blecaute",
      autor: "Marcelo Rubens Paiva",
      descricao: "Três amigos ficam presos numa caverna depois de uma enchente. Quando saem, descobrem que todo mundo no mundo virou tipo estátua, parado, duro, sem vida. Eles parecem ser os únicos sobreviventes do planeta O livro acompanha a jornada desses três enquanto tentam sobreviver e entender o que aconteceu, e como isso vai mexendo com a cabeça e com a relação entre eles.",
      capa: "img_livros/blecaute.webp",
      link: "https://bibliopedra.wordpress.com/wp-content/uploads/2015/09/blecaute-marcelo-rubens-paiva.pdf",
      linkTexto: "Ler"
    },
    {
      titulo: "O Retrato de Dorian Gray",
      autor: "Oscar Wilde",
      descricao: "Dorian Gray deseja permanecer eternamente jovem enquanto um retrato envelhece em seu lugar. À medida que mergulha em uma vida de excessos e corrupção moral, apenas a pintura revela as consequências de seus atos.",
      capa: "img_livros/retrato.webp",
      link: "https://www.jaimemoniz.com/images/docs/recursos/Oscar-Wilde-livro.pdf",
      linkTexto: "Ler"
    },
    {
      titulo: "O Pequeno Príncipe",
      autor: "Antoine de Saint-Exupéry",
      descricao: "Um piloto perdido no deserto encontra um pequeno príncipe vindo de outro planeta. Por meio de encontros e reflexões poéticas, a obra aborda amizade, amor, infância, solidão e os valores essenciais da vida.",
      capa: "img_livros/pequenoprincipe.webp",
      link: "https://osaberdigital.com.br/wp-content/uploads/2024/11/O-Pequeno-Principe-Saint-Exupery-Zahar.pdf",
      linkTexto: "Ler"
    }
  ]

  /* Para adicionar Julho, é só descomentar o bloco abaixo,
     apagar os exemplos e preencher com os livros de verdade:

  , 6: [ // Julho
    {
      titulo: "Nome do livro",
      autor: "Nome do autor",
      descricao: "Descrição do livro que vai aparecer no pop-up.",
      capa: "img/nome-da-capa.webp",
      link: "https://link-para-baixar-ou-comprar.com",
      linkTexto: "Baixar PDF"
    }
  ]
  */
};

const CAPA_PADRAO = "img/capa_destaque.webp";

/* =============================================
   SISTEMA DE VOTOS — estilo Reddit
   Cada voto fica salvo no localStorage do aparelho
   (por navegador/dispositivo, cada telefone/PC guarda o seu).
   ============================================= */
const VOTOS_KEY = 'et_votos_livros';

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function carregarVotos() {
  try { return JSON.parse(localStorage.getItem(VOTOS_KEY)) || {}; }
  catch (e) { return {}; }
}
function salvarVotos(v) { localStorage.setItem(VOTOS_KEY, JSON.stringify(v)); }

let votosState = carregarVotos();

function votar(id) {
  const atual = votosState[id] || { score: 0, meuVoto: 0 };
  if (atual.meuVoto === 1) {
    atual.score -= 1;
    atual.meuVoto = 0;
  } else {
    atual.score += 1;
    atual.meuVoto = 1;
  }
  votosState[id] = atual;
  salvarVotos(votosState);
  renderizar();
}

const mesAtual = new Date().getMonth(); // 0–11
let mesIndex = mesAtual;

const modal = document.getElementById('modal-livro');
const modalCapa = document.getElementById('modal-livro-capa');
const modalTitulo = document.getElementById('modal-livro-titulo');
const modalAutor = document.getElementById('modal-livro-autor');
const modalDesc = document.getElementById('modal-livro-desc');
const modalLink = document.getElementById('modal-livro-link');

function abrirModal(livro) {
  modalCapa.src = livro.capa || CAPA_PADRAO;
  modalCapa.alt = livro.titulo || '';
  modalTitulo.textContent = livro.titulo || '';
  modalAutor.textContent = livro.autor || '';
  modalAutor.style.display = livro.autor ? 'block' : 'none';
  modalDesc.textContent = livro.descricao || '';

  if (livro.link) {
    modalLink.href = livro.link;
    modalLink.textContent = livro.linkTexto || 'Baixar / Comprar';
    modalLink.style.display = 'inline-flex';
  } else {
    modalLink.style.display = 'none';
  }

  modal.classList.add('aberto');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  modal.classList.remove('aberto');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* fecha ao clicar fora da caixa, no X, ou apertando Esc */
modal.addEventListener('click', (e) => {
  if (e.target === modal) fecharModal();
});
document.getElementById('modal-fechar').addEventListener('click', fecharModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharModal();
});

function renderizar() {
  document.getElementById('mes-atual').textContent = meses[mesIndex];
  const lista = document.getElementById('lista-livros');
  lista.innerHTML = '';

  const livrosOriginal = livrosPorMes[mesIndex];

  if (!livrosOriginal || livrosOriginal.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = '<p class="vazio">Em breve os livros deste mês!</p>';
    lista.appendChild(li);
    return;
  }

  // cada livro recebe um id estável (mês + título) pra guardar o voto dele
  const livros = livrosOriginal.map((l, i) => {
    const id = `${mesIndex}-${slugify(l.titulo)}`;
    const v = votosState[id] || { score: 0, meuVoto: 0 };
    return { ...l, id, ordemOriginal: i, score: v.score, meuVoto: v.meuVoto };
  });

  // ordena pelo placar (maior pro topo); empate mantém a ordem original
  livros.sort((a, b) => b.score - a.score || a.ordemOriginal - b.ordemOriginal);

  livros.forEach((l, i) => {
    const num = String(i + 1).padStart(2, '0');
    const li = document.createElement('li');
    li.classList.add('livro-item');
    li.style.animationDelay = `${i * 0.05}s`;
    li.innerHTML = `
      <div class="voto-coluna" data-id="${l.id}">
        <button class="voto-btn voto-up ${l.meuVoto === 1 ? 'ativo' : ''}" aria-label="Votar a favor">▲</button>
        <span class="voto-score">${l.score}</span>
      </div>
      <span class="livro-num">${num}</span>
      <div class="livro-info">
        <span class="livro-titulo">${l.titulo}</span>
        ${l.autor ? `<span class="livro-autor">${l.autor}</span>` : ''}
      </div>
      <span class="livro-abrir">ver detalhes →</span>
    `;

    li.querySelector('.voto-up').addEventListener('click', (e) => {
      e.stopPropagation();
      votar(l.id);
    });

    /* clicar no livro abre o pop-up com capa, descrição e link */
    li.addEventListener('click', () => abrirModal(l));

    lista.appendChild(li);
  });
}

document.getElementById('seta-esq').addEventListener('click', () => {
  mesIndex = (mesIndex - 1 + 12) % 12;
  renderizar();
});

document.getElementById('seta-dir').addEventListener('click', () => {
  mesIndex = (mesIndex + 1) % 12;
  renderizar();
});

renderizar();
