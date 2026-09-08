/* =============================================
   FILMES.JS — Entre Tempos · TOP 5 + Modal + Upvotes
   ============================================= */

import { escutarUpvotes, alternarUpvote, jaVotou, pararTodosListeners } from '../../js/upvotes.js';
import {
  carregarTopConteudos, criarEditorTop, extrairYoutubeId,
  gerarYoutubeEmbedUrl, obterIdEditado
} from '../../js/top-conteudos.js';

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const filmesPorMes = {
  5: [ // Junho
    {
      id: "filme-preco-amanha",
      nome: "O Preço do Amanhã",
      diretor: "Andrew Niccol",
      video: "mp4/o-preco-do-amanha.mp4",
      descricao: "Em um futuro onde o tempo de vida se tornou a moeda oficial, as pessoas param de envelhecer aos 25 anos e precisam ganhar mais tempo para continuar vivendo. Quando Will Salas recebe uma enorme quantidade de anos de um desconhecido, ele passa a desafiar um sistema injusto que favorece os ricos e condena os pobres a lutar por cada minuto de existência."
    },
    {
      id: "filme-antes-de-voce",
      nome: "Como Eu Era Antes de Você",
      diretor: "Thea Sharrock",
      video: "mp4/como-eu-era-antes-de-voce.mp4",
      descricao: "Louisa Clark é uma jovem divertida e otimista que aceita trabalhar como cuidadora de Will Traynor, um homem rico que ficou tetraplégico após um acidente. Aos poucos, a relação entre os dois se transforma em uma profunda amizade e uma emocionante história de amor, marcada por reflexões sobre felicidade, liberdade e escolhas de vida."
    },
    {
      id: "filme-interestelar",
      nome: "Interestelar",
      diretor: "Christopher Nolan",
      video: "mp4/interestelar.mp4",
      descricao: "Com a Terra enfrentando uma grave crise ambiental, um grupo de astronautas parte em uma missão através de um buraco de minhoca em busca de um novo planeta habitável. Liderado por Cooper, o grupo enfrenta desafios científicos e emocionais que exploram temas como sobrevivência, família, tempo e o futuro da humanidade."
    },
    {
      id: "filme-primeira-vez",
      nome: "Como se Fosse a Primeira Vez",
      diretor: "Peter Segal",
      video: "mp4/como-se-fosse-a-primeira-vez.mp4",
      descricao: "Henry Roth se apaixona por Lucy Whitmore, mas descobre que ela sofre de perda de memória recente e esquece tudo o que aconteceu no dia anterior. Determinado a conquistá-la, ele encontra maneiras criativas de fazê-la se apaixonar novamente todos os dias, criando uma história romântica divertida e emocionante."
    },
    {
      id: "filme-diario-paixao",
      nome: "Diário de uma Paixão",
      diretor: "Nick Cassavetes",
      video: "mp4/diario-de-uma-paixao.mp4",
      descricao: "A história acompanha Noah e Allie, dois jovens de classes sociais diferentes que vivem um intenso romance durante a juventude. Separados pelas circunstâncias da vida, eles enfrentam anos de distância, mas descobrem que o verdadeiro amor é capaz de resistir ao tempo, às dificuldades e às mudanças do destino."
    }
  ]
};

const ANO_CONTEUDO_LEGADO = 2026;
const agora = new Date();
let mesIndex = agora.getMonth();
let anoIndex = agora.getFullYear();
let filmesAtuais = [];
let filmeAberto = null;

// caches locais por id: total de upvotes e se o usuário atual já votou
const totaisAtuais = {};
const votadoAtual = {};
const votandoAgora = new Set();
let carregamentoDoMes = 0;

const modal = document.getElementById('modalFilme');
const btnFechar = document.getElementById('btnFechar');
const filmeTitulo = document.getElementById('filmeTitulo');
const filmeDiretor = document.getElementById('filmeDiretor');
const filmeDesc = document.getElementById('filmeDescricao');
const filmeTrailer = document.getElementById('filmeTrailer');
const filmeYoutube = document.getElementById('filmeYoutube');

function obterFallback(ano, mes) {
  if (ano !== ANO_CONTEUDO_LEGADO) return [];
  return (filmesPorMes[mes - 1] || []).map((filme, indice) => ({
    id: filme.id,
    posicao: indice + 1,
    titulo: filme.nome,
    subtitulo: filme.diretor,
    descricao: filme.descricao,
    video: filme.video
  }));
}

function fecharModal() {
  modal.classList.remove('ativo');
  filmeAberto = null;
  document.body.style.overflow = '';
  filmeTrailer.pause();
  filmeTrailer.removeAttribute('src');
  filmeTrailer.load();
  filmeYoutube.removeAttribute('src');
  filmeYoutube.hidden = true;
}

function abrirModal(filme) {
  filmeTitulo.textContent = filme.titulo;
  filmeDiretor.textContent = filme.subtitulo;
  filmeDesc.textContent = filme.descricao;

  const embedUrl = gerarYoutubeEmbedUrl(filme.youtubeId);
  if (embedUrl) {
    filmeYoutube.src = embedUrl;
    filmeYoutube.title = `Trailer de ${filme.titulo}`;
    filmeYoutube.hidden = false;
    filmeTrailer.hidden = true;
    filmeTrailer.removeAttribute('src');
  } else if (filme.video) {
    filmeTrailer.src = filme.video;
    filmeTrailer.hidden = false;
    filmeYoutube.hidden = true;
    filmeYoutube.removeAttribute('src');
    filmeTrailer.parentElement.style.display = '';
  } else {
    filmeTrailer.removeAttribute('src');
    filmeTrailer.load();
    filmeTrailer.hidden = true;
    filmeYoutube.hidden = true;
    filmeTrailer.parentElement.style.display = 'none';
  }
  if (embedUrl) filmeTrailer.parentElement.style.display = '';

  modal.classList.add('ativo');
  filmeAberto = filme;
  if (window.innerWidth <= 600) document.body.style.overflow = 'hidden';
}

/**
 * Ordena os filmes do mês por total de upvotes (maior primeiro).
 * Em empate, mantém a ordem original cadastrada em filmesPorMes.
 */
function ordenarPorUpvotes(filmes) {
  return filmes
    .map((f) => ({ filme: f, total: totaisAtuais[f.id] ?? 0 }))
    .sort((a, b) => b.total - a.total || a.filme.posicao - b.filme.posicao)
    .map(x => x.filme);
}

async function votar(btn, id) {
  if (votandoAgora.has(id)) return;
  votandoAgora.add(id);
  btn.disabled = true;

  try {
    votadoAtual[id] = await alternarUpvote(id);
  } catch (err) {
    console.error('[filmes] erro ao votar:', id, err);
  } finally {
    votandoAgora.delete(id);
    renderizar();
  }
}

function renderizar(animar = false) {
  document.getElementById('mes-atual').textContent = `${meses[mesIndex]} ${anoIndex}`;
  const lista = document.getElementById('lista-filmes');
  lista.replaceChildren();

  if (!filmesAtuais.length) {
    const li = document.createElement('li');
    const vazio = document.createElement('p');
    vazio.className = 'vazio';
    vazio.textContent = 'Em breve os filmes deste mês!';
    li.appendChild(vazio);
    lista.appendChild(li);
    return;
  }

  const filmes = ordenarPorUpvotes(filmesAtuais);

  filmes.forEach((f, i) => {
    const li = document.createElement('li');
    li.classList.add('filme-item');
    li.style.animation = animar ? '' : 'none';
    if (animar) li.style.animationDelay = `${i * 0.05}s`;
    const clicavel = f.descricao && f.titulo !== '—';
    if (clicavel) li.classList.add('clicavel');

    const total = totaisAtuais[f.id] ?? 0;
    const votado = !!votadoAtual[f.id];

    const btnUpvote = document.createElement('button');
    btnUpvote.className = `btn-upvote${votado ? ' votado' : ''}`;
    btnUpvote.dataset.upvoteId = f.id;
    btnUpvote.setAttribute('aria-label', `Votar em ${f.titulo}`);
    btnUpvote.setAttribute('aria-pressed', String(votado));
    btnUpvote.disabled = votandoAgora.has(f.id);
    const seta = document.createElement('span');
    seta.className = 'upvote-seta';
    seta.textContent = '▲';
    const totalEl = document.createElement('span');
    totalEl.className = 'upvote-total';
    totalEl.textContent = String(total);
    btnUpvote.append(seta, totalEl);
    const numero = document.createElement('span');
    numero.className = 'filme-num';
    numero.textContent = String(i + 1).padStart(2, '0');
    const info = document.createElement('div');
    info.className = 'filme-info';
    const nome = document.createElement('span');
    nome.className = 'filme-nome';
    nome.textContent = f.titulo;
    info.appendChild(nome);
    if (f.subtitulo) {
      const diretor = document.createElement('span');
      diretor.className = 'filme-dir';
      diretor.textContent = f.subtitulo;
      info.appendChild(diretor);
    }
    li.append(btnUpvote, numero, info);
    btnUpvote.addEventListener('click', (e) => {
      e.stopPropagation();
      votar(btnUpvote, f.id);
    });

    if (clicavel) {
      li.addEventListener('click', (e) => {
        if (e.target.closest('.btn-upvote')) return;
        abrirModal(f);
      });
    }

    lista.appendChild(li);
  });
}

/**
 * Escuta em tempo real o total de upvotes de todos os filmes do mês
 * atual e confere se o usuário já votou em cada um. Sempre que um
 * total mudar (voto próprio ou de outra pessoa), a lista é
 * reordenada e redesenhada sozinha — é isso que faz o item com mais
 * upvotes subir pro "TOP 1".
 */
async function carregarUpvotesDoMes() {
  const carregamentoAtual = ++carregamentoDoMes;
  const filmesFallback = obterFallback(anoIndex, mesIndex + 1);
  filmesAtuais = filmesFallback;
  pararTodosListeners();

  // O fallback aparece imediatamente enquanto o documento mensal é consultado.
  renderizar(true);

  try {
    const resultado = await carregarTopConteudos('filmes', anoIndex, mesIndex + 1);
    if (carregamentoAtual !== carregamentoDoMes) return;
    if (resultado.existe) filmesAtuais = resultado.itens;
  } catch (erro) {
    console.warn('[filmes] usando conteúdo local; Firestore indisponível:', erro);
  }

  if (carregamentoAtual !== carregamentoDoMes) return;
  const filmes = filmesAtuais;
  renderizar(true);

  for (const f of filmes) {
    escutarUpvotes(f.id, (total) => {
      totaisAtuais[f.id] = total;
      renderizar();
    });
  }

  await Promise.all(filmes.map(async (f) => {
    if (f.id in votadoAtual) return;
    const votou = await jaVotou(f.id);
    if (carregamentoAtual === carregamentoDoMes) votadoAtual[f.id] = votou;
  }));

  if (carregamentoAtual === carregamentoDoMes) renderizar();
}

// ── EVENTS ──
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

btnFechar.addEventListener('click', fecharModal);
modal.addEventListener('click', e => { if (e.target === modal) fecharModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && filmeAberto) fecharModal(); });

criarEditorTop({
  tipo: 'filmes',
  limite: 5,
  botao: document.getElementById('btn-gerenciar-top'),
  titulo: 'Gerenciar Top 5 · Filmes',
  campos: [
    { nome: 'titulo', label: 'Nome do filme', obrigatorio: true },
    { nome: 'subtitulo', label: 'Diretor', obrigatorio: true },
    { nome: 'descricao', label: 'Descrição', tipo: 'textarea', obrigatorio: true },
    { nome: 'youtubeUrl', label: 'Link do trailer no YouTube', tipo: 'url', placeholder: 'https://youtu.be/...' }
  ],
  obterPeriodo: () => ({ mes: mesIndex + 1, ano: anoIndex }),
  carregarPeriodo: async (mes, ano) => {
    mesIndex = mes - 1;
    anoIndex = ano;
    await carregarUpvotesDoMes();
  },
  obterItens: () => filmesAtuais,
  montarItem: (valores, anterior, posicao) => {
    const youtubeId = valores.youtubeUrl ? extrairYoutubeId(valores.youtubeUrl) : '';
    if (!anterior?.video && !youtubeId) return { erro: 'Informe um link válido do YouTube.' };
    if (valores.youtubeUrl && !youtubeId) return { erro: 'Informe um link válido do YouTube.' };
    return {
      item: {
        ...(anterior?.video && !youtubeId ? { video: anterior.video } : {}),
        id: obterIdEditado('filmes', anterior, valores.titulo),
        posicao,
        titulo: valores.titulo,
        subtitulo: valores.subtitulo,
        descricao: valores.descricao,
        youtubeUrl: valores.youtubeUrl,
        youtubeId
      }
    };
  },
  aoSalvar: carregarUpvotesDoMes
});

carregarUpvotesDoMes();
