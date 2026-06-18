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
      nome: "Tempo Perdido",
      artista: "Legião Urbana",
      video: "mp4/Tempo perdido.mp4",
      descricao: "Uma das músicas mais emblemáticas do rock brasileiro, Tempo Perdido fala sobre a busca por sentido e identidade num mundo em constante mudança. Renato Russo canta sobre o medo de perder o tempo e a necessidade de viver com propósito, num chamado existencial que ecoa em gerações."
    },
    {
      nome: "Menino Bonito",
      artista: "Chico Chico",
      video: "mp4/Menino Bonito.mp4"
    },
    {
      nome: "Segundo Sol",
      artista: "Cássia Eller",
      video: "mp4/Segundo Sol.mp4"
    },
    {
      nome: "Erva Venenosa",
      artista: "Rita Lee",
      video: "mp4/Erva Venenosa.mp4"
    },
    {
      nome: "Pais e Filhos",
      artista: "Legião Urbana",
      video: "mp4/Pais e Filhos.mp4"
    },
    {
      nome: "Aliança",
      artista: "Tribalistas",
      video: "mp4/Alianca.mp4"
    },
    {
      nome: "Poema",
      artista: "Ney Matogrosso",
      video: "mp4/Poema.mp4"
    },
    {
      nome: "Epitáfio",
      artista: "Titãs",
      video: "mp4/Epitafio.mp4"
    },
    {
      nome: "Por Onde Andei",
      artista: "Nando Reis",
      video: "mp4/Por Onde Andei.mp4"
    },
    {
      nome: "Tempos Modernos",
      artista: "Lulu Santos",
      video: "mp4/Tempos Modernos.mp4"
    },
    {
      nome: "Terra de Gigantes",
      artista: "Engenheiros do Hawaii",
      video: "mp4/Terra de Gigantes.mp4"
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
