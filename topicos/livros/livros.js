/* =============================================
   LIVROS.JS — Entre Tempos · Navegação por Mês + Modal + Upvotes
   ============================================= */

import { escutarUpvotes, alternarUpvote, jaVotou, pararTodosListeners } from '../../js/upvotes.js';
import {
  carregarTopConteudos, criarEditorTop, obterIdEditado,
  validarCapa, validarUrlHttp
} from '../../js/top-conteudos.js';

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
     LinkCompra -> Texto do link para compra do livro
                   kkrs
                   Para "linkTexto" do "linkCompra" é colocado
                   "Comprar" diretamente

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
      linkTexto: "Ler",
      linkCompra: "https://www.amazon.com.br/s?k=a+metamorfose+kafka&adgrpid=1136895997349840&hvadid=71056163436700&hvbmt=be&hvdev=c&hvlocphy=678&hvnetw=s&hvqmt=e&hvtargid=kwd-71056688898588%3Aloc-20&hydadcr=5757_13231176&mcid=ec4ccf503ee83eaba216b55f67ac0e2b&tag=msndesktopsta-20&ref=pd_sl_5qsil6crz8_e",
    },
    {
      titulo: "A Volta ao Mundo em 80 Dias",
      autor: "Júlio Verne",
      descricao: "O excêntrico inglês Phileas Fogg aposta que consegue dar a volta ao mundo em apenas 80 dias. Ao lado de seu fiel criado Passepartout, ele embarca em uma aventura repleta de desafios, imprevistos e descobertas através de diferentes países e culturas.",
      capa: "img_livros/80dias.webp",
      link: "https://www.netmundi.org/home/wp-content/uploads/2020/10/A-volta-ao-mundo-em-80-dias-julio-verne.pdf",
      linkTexto: "Ler",
      linkCompra: "https://www.amazon.com.br/s?k=A+Volta+ao+Mundo+em+80+Dias&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=17K1U66MXL2VY&sprefix=a+volta+ao+mundo+em+80+dias%2Caps%2C262&ref=nb_sb_noss_1"
    },
    {
      titulo: "Blecaute",
      autor: "Marcelo Rubens Paiva",
      descricao: "Três amigos ficam presos numa caverna depois de uma enchente. Quando saem, descobrem que todo mundo no mundo virou tipo estátua, parado, duro, sem vida. Eles parecem ser os únicos sobreviventes do planeta O livro acompanha a jornada desses três enquanto tentam sobreviver e entender o que aconteceu, e como isso vai mexendo com a cabeça e com a relação entre eles.",
      capa: "img_livros/blecaute.webp",
      link: "https://bibliopedra.wordpress.com/wp-content/uploads/2015/09/blecaute-marcelo-rubens-paiva.pdf",
      linkTexto: "Ler",
      linkCompra: "https://www.amazon.com.br/s?k=Blecaute&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=38F2AXFTD1TU1&sprefix=blecaute%2Caps%2C267&ref=nb_sb_noss_1"
    },
    {
      titulo: "O Retrato de Dorian Gray",
      autor: "Oscar Wilde",
      descricao: "Dorian Gray deseja permanecer eternamente jovem enquanto um retrato envelhece em seu lugar. À medida que mergulha em uma vida de excessos e corrupção moral, apenas a pintura revela as consequências de seus atos.",
      capa: "img_livros/retrato.webp",
      link: "https://www.jaimemoniz.com/images/docs/recursos/Oscar-Wilde-livro.pdf",
      linkTexto: "Ler",
      linkCompra: "https://www.amazon.com.br/s?k=O+Retrato+de+Dorian+Gray&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=YO0FO1ME2KXM&sprefix=o+retrato+de+dorian+gray%2Caps%2C251&ref=nb_sb_noss_1"
    },
    {
      titulo: "O Pequeno Príncipe",
      autor: "Antoine de Saint-Exupéry",
      descricao: "Um piloto perdido no deserto encontra um pequeno príncipe vindo de outro planeta. Por meio de encontros e reflexões poéticas, a obra aborda amizade, amor, infância, solidão e os valores essenciais da vida.",
      capa: "img_livros/pequenoprincipe.webp",
      link: "https://osaberdigital.com.br/wp-content/uploads/2024/11/O-Pequeno-Principe-Saint-Exupery-Zahar.pdf",
      linkTexto: "Ler",
      linkCompra: "https://www.amazon.com.br/s?k=O+Pequeno+Pr%C3%ADncipe&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=2W4VS6FJH56ZD&sprefix=o+pequeno+pr%C3%ADncipe%2Caps%2C271&ref=nb_sb_noss_1"
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
      linkCompra :"Link Amazon / Mercado Livre"
    }
  ]
  */
};

const CAPA_PADRAO = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="480" viewBox="0 0 320 480">
    <rect width="320" height="480" fill="#8c3b3b"/>
    <rect x="18" y="18" width="284" height="444" fill="#f2e8d5" stroke="#c4a96b" stroke-width="5"/>
    <path d="M58 112h204M58 350h204" stroke="#8c3b3b" stroke-width="3"/>
    <text x="160" y="222" text-anchor="middle" font-family="serif" font-size="31" fill="#3e3228">ENTRE</text>
    <text x="160" y="262" text-anchor="middle" font-family="serif" font-size="31" fill="#3e3228">TEMPOS</text>
    <text x="160" y="302" text-anchor="middle" font-family="serif" font-size="18" fill="#7a6a50">LIVRO</text>
  </svg>
`)}`;

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const ANO_CONTEUDO_LEGADO = 2026;
const agora = new Date();
let mesIndex = agora.getMonth();
let anoIndex = agora.getFullYear();
let livrosAtuais = [];

function obterFallback(ano, mes) {
  if (ano !== ANO_CONTEUDO_LEGADO) return [];
  return (livrosPorMes[mes - 1] || []).map((livro, indice) => ({
    id: `${mes - 1}-${slugify(livro.titulo)}`,
    posicao: indice + 1,
    titulo: livro.titulo,
    subtitulo: livro.autor || '',
    descricao: livro.descricao,
    pdfUrl: livro.link || '',
    capa: livro.capa || '',
    linkCompra: livro.linkCompra || ''
  }));
}

// caches locais por id: total de upvotes e se o usuário atual já votou
const totaisAtuais = {};
const votadoAtual = {};
const votandoAgora = new Set();
let carregamentoDoMes = 0;

const modal = document.getElementById('modal-livro');
const modalCapa = document.getElementById('modal-livro-capa');
const modalTitulo = document.getElementById('modal-livro-titulo');
const modalAutor = document.getElementById('modal-livro-autor');
const modalDesc = document.getElementById('modal-livro-desc');
const modalLink = document.getElementById('modal-livro-link');
const modalLinkCompra = document.getElementById('modal-livro-link-compra');

function abrirModal(livro) {
  modalCapa.src = livro.capa || CAPA_PADRAO;
  modalCapa.alt = livro.titulo || '';
  modalTitulo.textContent = livro.titulo || '';
  modalAutor.textContent = livro.subtitulo || '';
  modalAutor.style.display = livro.subtitulo ? 'block' : 'none';
  modalDesc.textContent = livro.descricao || '';

  if (livro.pdfUrl && validarUrlHttp(livro.pdfUrl)) {
    modalLink.href = livro.pdfUrl;
    modalLink.textContent = 'Ler PDF ↗';
    modalLink.style.display = 'inline-flex';
  } else {
    modalLink.style.display = 'none';
  }

  if (livro.linkCompra) {
    modalLinkCompra.href = livro.linkCompra;
    modalLinkCompra.textContent = 'Comprar';
    modalLinkCompra.style.display = 'inline-flex';
  } else {
    modalLinkCompra.style.display = 'none';
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

/**
 * Ordena os livros do mês por total de upvotes (maior primeiro).
 * Em empate, mantém a ordem original cadastrada em livrosPorMes.
 */
function ordenarPorUpvotes(livros) {
  return livros
    .map((l) => ({ livro: l, total: totaisAtuais[l.id] ?? 0 }))
    .sort((a, b) => b.total - a.total || a.livro.posicao - b.livro.posicao)
    .map(x => x.livro);
}

async function votar(btn, id) {
  if (votandoAgora.has(id)) return;
  votandoAgora.add(id);
  btn.disabled = true;

  try {
    votadoAtual[id] = await alternarUpvote(id);
  } catch (err) {
    console.error('[livros] erro ao votar:', id, err);
  } finally {
    votandoAgora.delete(id);
    renderizar();
  }
}

function renderizar(animar = false) {
  document.getElementById('mes-atual').textContent = `${meses[mesIndex]} ${anoIndex}`;
  const lista = document.getElementById('lista-livros');
  lista.replaceChildren();

  if (!livrosAtuais.length) {
    const li = document.createElement('li');
    const vazio = document.createElement('p');
    vazio.className = 'vazio';
    vazio.textContent = 'Em breve os livros deste mês!';
    li.appendChild(vazio);
    lista.appendChild(li);
    return;
  }

  const livros = ordenarPorUpvotes(livrosAtuais);

  livros.forEach((l, i) => {
    const num = String(i + 1).padStart(2, '0');
    const li = document.createElement('li');
    li.classList.add('livro-item');
    li.style.animation = animar ? '' : 'none';
    if (animar) li.style.animationDelay = `${i * 0.05}s`;

    const total = totaisAtuais[l.id] ?? 0;
    const votado = !!votadoAtual[l.id];

    const votoColuna = document.createElement('div');
    votoColuna.className = 'voto-coluna';
    votoColuna.dataset.id = l.id;
    const btnVoto = document.createElement('button');
    btnVoto.className = `voto-btn voto-up${votado ? ' ativo' : ''}`;
    btnVoto.setAttribute('aria-label', `Votar em ${l.titulo}`);
    btnVoto.setAttribute('aria-pressed', String(votado));
    btnVoto.disabled = votandoAgora.has(l.id);
    btnVoto.textContent = '▲';
    const score = document.createElement('span');
    score.className = 'voto-score';
    score.textContent = String(total);
    votoColuna.append(btnVoto, score);
    const numero = document.createElement('span');
    numero.className = 'livro-num';
    numero.textContent = num;
    const info = document.createElement('div');
    info.className = 'livro-info';
    const titulo = document.createElement('span');
    titulo.className = 'livro-titulo';
    titulo.textContent = l.titulo;
    info.appendChild(titulo);
    if (l.subtitulo) {
      const autor = document.createElement('span');
      autor.className = 'livro-autor';
      autor.textContent = l.subtitulo;
      info.appendChild(autor);
    }
    const abrir = document.createElement('span');
    abrir.className = 'livro-abrir';
    abrir.textContent = 'ver detalhes →';
    li.append(votoColuna, numero, info, abrir);
    btnVoto.addEventListener('click', (e) => {
      e.stopPropagation();
      votar(btnVoto, l.id);
    });

    /* clicar no livro abre o pop-up com capa, descrição e link */
    li.addEventListener('click', (e) => {
      if (e.target.closest('.voto-coluna')) return;
      abrirModal(l);
    });

    lista.appendChild(li);
  });
}

/**
 * Escuta em tempo real o total de upvotes de todos os livros do mês
 * atual e confere se o usuário já votou em cada um. Sempre que um
 * total mudar (voto próprio ou de outra pessoa), a lista é
 * reordenada e redesenhada sozinha.
 */
async function carregarUpvotesDoMes() {
  const carregamentoAtual = ++carregamentoDoMes;
  livrosAtuais = obterFallback(anoIndex, mesIndex + 1);
  pararTodosListeners();

  // A lista aparece já; votos e placares são sincronizados em segundo plano.
  renderizar(true);

  try {
    const resultado = await carregarTopConteudos('livros', anoIndex, mesIndex + 1);
    if (carregamentoAtual !== carregamentoDoMes) return;
    if (resultado.existe) livrosAtuais = resultado.itens;
  } catch (erro) {
    console.warn('[livros] usando conteúdo local; Firestore indisponível:', erro);
  }

  if (carregamentoAtual !== carregamentoDoMes) return;
  const livros = livrosAtuais;
  renderizar(true);

  for (const l of livros) {
    escutarUpvotes(l.id, (total) => {
      totaisAtuais[l.id] = total;
      renderizar();
    });
  }

  await Promise.all(livros.map(async (l) => {
    if (l.id in votadoAtual) return;
    const votou = await jaVotou(l.id);
    if (carregamentoAtual === carregamentoDoMes) votadoAtual[l.id] = votou;
  }));

  if (carregamentoAtual === carregamentoDoMes) renderizar();
}

document.getElementById('seta-esq').addEventListener('click', () => {
  if (mesIndex === 0) {
    mesIndex = 11;
    anoIndex -= 1;
  } else mesIndex -= 1;
  carregarUpvotesDoMes();
});

document.getElementById('seta-dir').addEventListener('click', () => {
  if (mesIndex === 11) {
    mesIndex = 0;
    anoIndex += 1;
  } else mesIndex += 1;
  carregarUpvotesDoMes();
});

criarEditorTop({
  tipo: 'livros',
  limite: 5,
  botao: document.getElementById('btn-gerenciar-top'),
  titulo: 'Gerenciar Top 5 · Livros',
  campos: [
    { nome: 'titulo', label: 'Título', obrigatorio: true },
    { nome: 'subtitulo', label: 'Autor', obrigatorio: true },
    { nome: 'descricao', label: 'Descrição', tipo: 'textarea', obrigatorio: true },
    { nome: 'pdfUrl', label: 'Link do PDF', tipo: 'url', placeholder: 'https://site.com/livro.pdf', obrigatorio: true },
    { nome: 'capa', label: 'Capa (caminho local ou URL HTTPS)', placeholder: 'img_livros/capa.webp' }
  ],
  obterPeriodo: () => ({ mes: mesIndex + 1, ano: anoIndex }),
  carregarPeriodo: async (mes, ano) => {
    mesIndex = mes - 1;
    anoIndex = ano;
    await carregarUpvotesDoMes();
  },
  obterItens: () => livrosAtuais,
  montarItem: (valores, anterior, posicao) => {
    if (!validarUrlHttp(valores.pdfUrl)) return { erro: 'Informe um link HTTP ou HTTPS válido para o PDF.' };
    if (!validarCapa(valores.capa)) return { erro: 'Use um caminho local ou uma URL HTTPS válida para a capa.' };
    return {
      item: {
        id: obterIdEditado('livros', anterior, valores.titulo),
        posicao,
        titulo: valores.titulo,
        subtitulo: valores.subtitulo,
        descricao: valores.descricao,
        pdfUrl: valores.pdfUrl,
        capa: valores.capa,
        ...(anterior?.linkCompra ? { linkCompra: anterior.linkCompra } : {})
      }
    };
  },
  aoSalvar: carregarUpvotesDoMes
});

carregarUpvotesDoMes();
