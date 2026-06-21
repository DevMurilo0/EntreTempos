/* =============================================
   MUSICA.JS — Entre Tempos · Navegação por Mês
   ============================================= */
const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const musicasPorMes = {
  5: [ // Junho (índice 0–11)
    {
      nome: "Oração Ao Tempo",
      artista: "Cateano Veloso",
      video: "mp4/Caetano Veloso - Oração Ao Tempo.mp4",
      descricao: "Uma música poética que trata o tempo como uma força viva, capaz de transformar tudo ao nosso redor. Caetano fala sobre as mudanças que acontecem com o passar dos anos, mostrando que o tempo carrega memórias, aprendizados e novas possibilidades."
    },
    {
      nome: "Epitáfio",
      artista: "Titãs",
      video: "mp4/Epitafio.mp4",
      descricao: "A canção apresenta uma reflexão sobre a vida, escolhas e arrependimentos. A letra imagina uma pessoa olhando para sua própria história e pensando nas coisas que poderia ter feito, trazendo uma mensagem sobre aproveitar melhor o presente."
    },
    {
      nome: "Era Uma Vez",
      artista: "Kell Smith",
      video: "mp4/Kell Smith - Era Uma Vez.mp4",
      descricao: "Uma música marcada pela nostalgia, que relembra a infância, os sonhos e a inocência de tempos passados. A canção fala sobre como crescemos e mudamos, mas algumas lembranças continuam fazendo parte de quem somos."
    },
    {
      nome: "Poema",
      artista: "Ney Matogrosso",
      video: "mp4/Poema.mp4",
      descricao: "Uma música sensível e cheia de expressão artística, que utiliza a poesia para transmitir emoções profundas. A obra traz uma atmosfera reflexiva, falando sobre sentimentos, experiências e a forma como enxergamos a vida."
    },
    {
      nome: "Por Onde Andei",
      artista: "Nando Reis",
      video: "mp4/Por Onde Andei.mp4",
      descricao: "A música fala sobre caminhos percorridos, lembranças e a busca por respostas dentro de si mesmo. A letra transmite uma sensação de saudade e reflexão sobre momentos, pessoas e lugares que fizeram parte da trajetória de alguém."
    },
    {
      nome: "Preciso Me Encontrar",
      artista: "Cartola",
      video: "mp4/Preciso me encontrar.mp4",
      descricao: "Uma das grandes obras da música brasileira sobre autoconhecimento. A canção fala sobre a necessidade de se afastar, refletir e descobrir a própria identidade, mostrando sentimentos de solidão, mudança e busca por paz interior."
    },
    {
      nome: "Tempo Perdido",
      artista: "Legião Urbana",
      video: "mp4/Tempo perdido.mp4",
      descricao: "Uma música que aborda a passagem do tempo, a juventude e as incertezas da vida. Apesar do título, a mensagem mostra que sempre existe a oportunidade de recomeçar e valorizar os momentos que ainda temos."
    },
    {
      nome: "Tempos Modernos",
      artista: "Lulu Santos",
      video: "mp4/Tempos Modernos.mp4",
      descricao: "Uma canção que transmite esperança e otimismo diante das mudanças do mundo. Lulu Santos fala sobre acreditar no futuro e buscar dias melhores, mesmo em meio às dificuldades da vida moderna."
    },
    {
      nome: "Terras De Gigantes",
      artista: "Engenheiros do Hawaii",
      video: "mp4/Terra de Gigantes.mp4",
      descricao: "A música apresenta uma reflexão sobre amadurecimento e sobre viver em um mundo cheio de desafios. A letra fala sobre crescimento, sonhos e a sensação de tentar encontrar seu espaço em uma realidade cada vez mais complexa."
    },
    {
      nome: "Velha Infancia",
      artista: "Tribalistas",
      video: "mp4/Tribalistas - Velha Infancia.mp4",
      descricao: "Uma música romântica que celebra o amor, o carinho e a conexão entre duas pessoas. A letra traz uma sensação de conforto e simplicidade, mostrando um relacionamento baseado em afeto, parceria e momentos especiais."
    },
  ],
};

const mesAtual = new Date().getMonth();
let mesIndex = mesAtual;

/* ── MODAL ── */
function abrirModal(musica) {
  const antigo = document.getElementById('musica-modal');
  if (antigo) antigo.remove();

  const modal = document.createElement('div');
  modal.id = 'musica-modal';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-caixa">
      <button class="modal-fechar" aria-label="Fechar">✕</button>
      <div class="modal-cabecalho">
        <span class="modal-num">♪</span>
        <div>
          <div class="modal-nome">${musica.nome}</div>
          <div class="modal-artista">${musica.artista}</div>
        </div>
      </div>
      ${musica.video ? `
        <div class="musica-video">
          <video controls width="100%">
            <source src="${musica.video}" type="video/mp4">
            Seu navegador não suporta vídeo.
          </video>
        </div>
      ` : ''}
      ${musica.descricao ? `<p class="modal-desc">${musica.descricao}</p>` : ''}
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('modal-visivel'));

  modal.querySelector('.modal-fechar').addEventListener('click', fecharModal);
  modal.querySelector('.modal-overlay').addEventListener('click', fecharModal);
}

function fecharModal() {
  const modal = document.getElementById('musica-modal');
  if (!modal) return;
  const video = modal.querySelector('video');
  if (video) video.pause();
  modal.classList.remove('modal-visivel');
  setTimeout(() => modal.remove(), 300);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharModal();
});

/* ── RENDERIZAR LISTA ── */
function renderizar() {
  document.getElementById('mes-atual').textContent = meses[mesIndex];

  const lista = document.getElementById('lista-musicas');
  lista.innerHTML = '';

  const musicas = musicasPorMes[mesIndex];
  if (!musicas || musicas.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = '<p class="vazio">Em breve as músicas deste mês!</p>';
    lista.appendChild(li);
    return;
  }

  musicas.forEach((m, i) => {
    const num = String(i + 1).padStart(2, '0');
    const li = document.createElement('li');
    li.classList.add('musica-item');
    li.style.animationDelay = `${i * 0.05}s`;

    const clicavel = (m.video || m.descricao) && m.nome !== '—';

    li.innerHTML = `
      <span class="musica-num">${num}</span>
      <div class="musica-info">
        <span class="musica-nome">${m.nome}</span>
        ${m.artista ? `<span class="musica-artista">${m.artista}</span>` : ''}
      </div>
      ${clicavel ? `<span class="musica-toggle-icone">▶</span>` : ''}
    `;

    if (clicavel) {
      li.classList.add('clicavel');
      li.addEventListener('click', () => abrirModal(m));
    }

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

/* ── CD RITA LEE: clique para girar 3 voltas e parar ── */
const cd = document.querySelector('.cd-destaque');
cd.addEventListener('click', () => {
  cd.classList.remove('girando');
  void cd.offsetWidth;
  cd.classList.add('girando');
});

cd.addEventListener('animationend', () => {
  cd.classList.remove('girando');
});
