const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Dados por mês — adicione as músicas de cada mês aqui
const musicasPorMes = {
  // Exemplo já preenchido com as músicas da foto
  4: [ // índice 4 = Maio
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

const mesAtual = new Date().getMonth(); // 0-11
let mesIndex = mesAtual;

function renderizar() {
  document.getElementById('mes-atual').textContent = meses[mesIndex];

  const lista = document.getElementById('lista-musicas');
  lista.innerHTML = '';

  const musicas = musicasPorMes[mesIndex];

  if (!musicas || musicas.length === 0) {
    lista.innerHTML = '<p class="vazio">Em breve as músicas deste mês!</p>';
    return;
  }

  musicas.forEach((m, i) => {
    const li = document.createElement('li');
    li.style.animationDelay = `${i * 0.05}s`;
    li.innerHTML = `
      <span class="numero">${i + 1}</span>
      <div class="info-musica">
        <span class="nome-musica">${m.nome}</span>
        ${m.artista ? `<span class="artista">${m.artista}</span>` : ''}
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
