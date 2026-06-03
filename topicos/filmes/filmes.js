/* =============================================
   FILMES.JS — Entre Tempos · Top 5 Filmes
   ============================================= */

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const filmesPorMes = {
  5: [ // Junho
    {
      nome: "—",
      diretor: ""
    },
    {
      nome: "—",
      diretor: ""
    },
    {
      nome: "—",
      diretor: ""
    },
    {
      nome: "—",
      diretor: ""
    },
    {
      nome: "—",
      diretor: ""
    },
  ],
};

const mesAtual = new Date().getMonth();
let mesIndex = mesAtual;

/* ── MODAL ── */
function abrirModal(filme) {
  const antigo = document.getElementById('filme-modal');
  if (antigo) antigo.remove();

  const modal = document.createElement('div');
  modal.id = 'filme-modal';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-caixa">
      <button class="modal-fechar" aria-label="Fechar">✕</button>
      <div class="modal-cabecalho">
        <span class="modal-num">🎬</span>
        <div>
          <div class="modal-nome">${filme.nome}</div>
          <div class="modal-dir">${filme.diretor}</div>
        </div>
      </div>
      ${filme.descricao ? `<p class="modal-desc">${filme.descricao}</p>` : ''}
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('modal-visivel'));

  modal.querySelector('.modal-fechar').addEventListener('click', fecharModal);
  modal.querySelector('.modal-overlay').addEventListener('click', fecharModal);
}

function fecharModal() {
  const modal = document.getElementById('filme-modal');
  if (!modal) return;
  modal.classList.remove('modal-visivel');
  setTimeout(() => modal.remove(), 300);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharModal();
});

/* ── RENDERIZAR LISTA ── */
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
    const num = String(i + 1).padStart(2, '0');
    const li = document.createElement('li');
    li.classList.add('filme-item');
    li.style.animationDelay = `${i * 0.05}s`;

    const clicavel = f.descricao && f.nome !== '—';

    li.innerHTML = `
      <span class="filme-num">${num}</span>
      <div class="filme-info">
        <span class="filme-nome">${f.nome}</span>
        ${f.diretor ? `<span class="filme-dir">${f.diretor}</span>` : ''}
      </div>
      ${clicavel ? `<span class="filme-toggle-icone">▶</span>` : ''}
    `;

    if (clicavel) {
      li.classList.add('clicavel');
      li.addEventListener('click', () => abrirModal(f));
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
