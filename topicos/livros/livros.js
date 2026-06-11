/* =============================================
   LIVROS.JS — Entre Tempos · Navegação por Mês
   ============================================= */

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const livrosPorMes = {
  5: [ // Junho (índice 0–11)
    { titulo: "—", autor: "" },
    { titulo: "—", autor: "" },
    { titulo: "—", autor: "" },
    { titulo: "—", autor: "" },
    { titulo: "—", autor: "" },
    { titulo: "—", autor: "" },
    { titulo: "—", autor: "" },
    { titulo: "—", autor: "" },
    { titulo: "—", autor: "" },
    { titulo: "—", autor: "" },
  ],
  // Para adicionar outros meses, copie o bloco acima:
  // 6: [ // Julho
  //   { titulo: "Nome do Livro", autor: "Nome do Autor" },
  //   ...
  // ],
};

const mesAtual = new Date().getMonth(); // 0–11
let mesIndex = mesAtual;

function renderizar() {
  document.getElementById('mes-atual').textContent = meses[mesIndex];

  const lista = document.getElementById('lista-livros');
  lista.innerHTML = '';

  const livros = livrosPorMes[mesIndex];

  if (!livros || livros.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = '<p class="vazio">Em breve os livros deste mês!</p>';
    lista.appendChild(li);
    return;
  }

  livros.forEach((l, i) => {
    const num = String(i + 1).padStart(2, '0');
    const li = document.createElement('li');
    li.classList.add('livro-item');
    li.style.animationDelay = `${i * 0.05}s`;
    li.innerHTML = `
      <span class="livro-num">${num}</span>
      <div class="livro-info">
        <span class="livro-titulo">${l.titulo}</span>
        ${l.autor ? `<span class="livro-autor">${l.autor}</span>` : ''}
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
