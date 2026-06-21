/* =============================================
   FILMES.JS — Entre Tempos · TOP 5 + Modal
   ============================================= */

const meses = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

const filmesPorMes = {
  5: [ // Junho
    {
      nome: "O Preço do Amanhã",
      diretor: "Andrew Niccol",
      video: "mp4/o-preco-do-amanha.mp4",
      descricao: "Em um futuro onde o tempo de vida se tornou a moeda oficial, as pessoas param de envelhecer aos 25 anos e precisam ganhar mais tempo para continuar vivendo. Quando Will Salas recebe uma enorme quantidade de anos de um desconhecido, ele passa a desafiar um sistema injusto que favorece os ricos e condena os pobres a lutar por cada minuto de existência."
    },
    {
      nome: "Como Eu Era Antes de Você",
      diretor: "Thea Sharrock",
      video: "mp4/como-eu-era-antes-de-voce.mp4",
      descricao: "Louisa Clark é uma jovem divertida e otimista que aceita trabalhar como cuidadora de Will Traynor, um homem rico que ficou tetraplégico após um acidente. Aos poucos, a relação entre os dois se transforma em uma profunda amizade e uma emocionante história de amor, marcada por reflexões sobre felicidade, liberdade e escolhas de vida."
    },
    {
      nome: "Interestelar",
      diretor: "Christopher Nolan",
      video: "mp4/interestelar.mp4",
      descricao: "Com a Terra enfrentando uma grave crise ambiental, um grupo de astronautas parte em uma missão através de um buraco de minhoca em busca de um novo planeta habitável. Liderado por Cooper, o grupo enfrenta desafios científicos e emocionais que exploram temas como sobrevivência, família, tempo e o futuro da humanidade."
    },
    {
      nome: "Como se Fosse a Primeira Vez",
      diretor: "Peter Segal",
      video: "mp4/como-se-fosse-a-primeira-vez.mp4",
      descricao: "Henry Roth se apaixona por Lucy Whitmore, mas descobre que ela sofre de perda de memória recente e esquece tudo o que aconteceu no dia anterior. Determinado a conquistá-la, ele encontra maneiras criativas de fazê-la se apaixonar novamente todos os dias, criando uma história romântica divertida e emocionante."
    },
    {
      nome: "Diário de uma Paixão",
      diretor: "Nick Cassavetes",
      video: "mp4/diario-de-uma-paixao.mp4",
      descricao: "A história acompanha Noah e Allie, dois jovens de classes sociais diferentes que vivem um intenso romance durante a juventude. Separados pelas circunstâncias da vida, eles enfrentam anos de distância, mas descobrem que o verdadeiro amor é capaz de resistir ao tempo, às dificuldades e às mudanças do destino."
    }
  ]
};


const mesAtual = new Date().getMonth();
let mesIndex = mesAtual;
let filmeAberto = null;

const modal       = document.getElementById('modalFilme');
const btnFechar   = document.getElementById('btnFechar');
const filmeTitulo = document.getElementById('filmeTitulo');
const filmeDiretor= document.getElementById('filmeDiretor');
const filmeDesc   = document.getElementById('filmeDescricao');
const filmeTrailer= document.getElementById('filmeTrailer');

function fecharModal() {
  modal.classList.remove('ativo');
  filmeAberto = null;
  document.body.style.overflow = '';
  filmeTrailer.pause();
  filmeTrailer.removeAttribute('src');
  filmeTrailer.load();
}

function abrirModal(filme) {
  filmeTitulo.textContent  = filme.nome;
  filmeDiretor.textContent = filme.diretor;
  filmeDesc.textContent    = filme.descricao;

  if (filme.video) {
    filmeTrailer.src = filme.video;
    filmeTrailer.parentElement.style.display = '';
  } else {
    filmeTrailer.removeAttribute('src');
    filmeTrailer.load();
    filmeTrailer.parentElement.style.display = 'none';
  }

  modal.classList.add('ativo');
  filmeAberto = filme;
  if (window.innerWidth <= 600) document.body.style.overflow = 'hidden';
}

function renderizar() {
  document.getElementById('mes-atual').textContent = meses[mesIndex];
  const lista = document.getElementById('lista-filmes');
  lista.innerHTML = '';
  const filmes = filmesPorMes[mesIndex];

  if (!filmes || filmes.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = '<p class="vazio">Em breve os filmes deste mês!</p>';
    lista.appendChild(li);
    return;
  }

  filmes.forEach((f, i) => {
    const li = document.createElement('li');
    li.classList.add('filme-item');
    li.style.animationDelay = `${i * 0.05}s`;
    const clicavel = f.descricao && f.nome !== '—';
    if (clicavel) li.classList.add('clicavel');

    li.innerHTML = `
      <span class="filme-num">${String(i + 1).padStart(2, '0')}</span>
      <div class="filme-info">
        <span class="filme-nome">${f.nome}</span>
        ${f.diretor ? `<span class="filme-dir">${f.diretor}</span>` : ''}
      </div>
    `;

    if (clicavel) li.addEventListener('click', () => abrirModal(f));
    lista.appendChild(li);
  });
}

// ── EVENTS ──
document.getElementById('seta-esq').addEventListener('click', () => {
  mesIndex = (mesIndex - 1 + 12) % 12;
  renderizar();
});
document.getElementById('seta-dir').addEventListener('click', () => {
  mesIndex = (mesIndex + 1) % 12;
  renderizar();
});

btnFechar.addEventListener('click', fecharModal);
modal.addEventListener('click', e => { if (e.target === modal) fecharModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && filmeAberto) fecharModal(); });

renderizar();
