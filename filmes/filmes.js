/* =============================================
   FILMES.JS — Entre Tempos · TOP 5 + Modal
   ============================================= */

const meses = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

const filmesPorMes = {
  5: [ // Junho
    { nome: "—", diretor: "", descricao: "" },
    { nome: "—", diretor: "", descricao: "" },
    { nome: "—", diretor: "", descricao: "" },
    { nome: "—", diretor: "", descricao: "" },
    { nome: "—", diretor: "", descricao: "" },
  ],
};


const mesAtual = new Date().getMonth();
let mesIndex = mesAtual;
let filmeAberto = null;

const modal       = document.getElementById('modalFilme');
const btnFechar   = document.getElementById('btnFechar');
const filmeTitulo = document.getElementById('filmeTitulo');
const filmeDiretor= document.getElementById('filmeDiretor');
const filmeDesc   = document.getElementById('filmeDescricao');

function fecharModal() {
  modal.classList.remove('ativo');
  filmeAberto = null;
  document.body.style.overflow = '';
}

function abrirModal(filme) {
  filmeTitulo.textContent  = filme.nome;
  filmeDiretor.textContent = filme.diretor;
  filmeDesc.textContent    = filme.descricao;
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
