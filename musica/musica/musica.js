/* =============================================
   MUSICA.JS — Entre Tempos · Navegação por Mês
   ============================================= */

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const musicasPorMes = {
  5: [ // Junho (índice 0–11)
    { nome: "Tempo Perdido",  artista: "Legião Urbana" },
    { nome: "Menino Bonito",  artista: "Chico Chico" },
    { nome: "Segundo Sol",    artista: "Cássia Eller" },
    { nome: "Erva Venenosa",  artista: "Rita Lee" },
    { nome: "Pais e Filhos",  artista: "Elis Regina" },
    { nome: "Aliança",        artista: "Tribalistas" },
    { nome: "—",              artista: "" },
    { nome: "—",              artista: "" },
    { nome: "—",              artista: "" },
    { nome: "Árvore",         artista: "Edson Gomes" },
  ],
};

const mesAtual = new Date().getMonth(); // 0–11
let mesIndex = mesAtual;

function renderizar() {
  // Atualiza o label do mês
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
    li.innerHTML = `
      <span class="musica-num">${num}</span>
      <div class="musica-info">
        <span class="musica-nome">${m.nome}</span>
        ${m.artista ? `<span class="musica-artista">${m.artista}</span>` : ''}
      </div>
    `;
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
