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
      youtube: "r53NJwUkDso",
      descricao: "Uma das músicas mais emblemáticas do rock brasileiro, Tempo Perdido fala sobre a busca por sentido e identidade num mundo em constante mudança. Renato Russo canta sobre o medo de perder o tempo e a necessidade de viver com propósito, num chamado existencial que ecoa em gerações."
    },
    { nome: "Menino Bonito",  artista: "Chico Chico" },
    { nome: "Segundo Sol",    artista: "Cássia Eller" },
    { nome: "Erva Venenosa",  artista: "Rita Lee" },
    { nome: "Pais e Filhos",  artista: "Legião Urbana" },
    { nome: "Aliança",        artista: "Tribalistas" },
    { nome: "—",              artista: "" },
    { nome: "—",              artista: "" },
    { nome: "—",              artista: "" },
    { nome: "Árvore",         artista: "Edson Gomes" },
  ],
};

const mesAtual = new Date().getMonth();
let mesIndex = mesAtual;

/* ── MODAL ── */
function abrirModal(musica) {
  // remove modal anterior se existir
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
      <a class="modal-botao-yt" href="https://www.youtube.com/watch?v=${musica.youtube}" target="_blank" rel="noopener">
        <span class="modal-play-icone">▶</span>
        Assistir clipe no YouTube
      </a>
      ${musica.descricao ? `<p class="modal-desc">${musica.descricao}</p>` : ''}
    </div>
  `;

  document.body.appendChild(modal);

  // anima entrada
  requestAnimationFrame(() => modal.classList.add('modal-visivel'));

  // fechar ao clicar no X ou no overlay
  modal.querySelector('.modal-fechar').addEventListener('click', fecharModal);
  modal.querySelector('.modal-overlay').addEventListener('click', fecharModal);
}

function fecharModal() {
  const modal = document.getElementById('musica-modal');
  if (!modal) return;
  modal.classList.remove('modal-visivel');
  setTimeout(() => modal.remove(), 300);
}

// fecha com ESC
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

    const clicavel = (m.youtube || m.descricao) && m.nome !== '—';

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
