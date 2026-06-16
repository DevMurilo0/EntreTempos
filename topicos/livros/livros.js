/* =============================================
   LIVROS.JS — Entre Tempos · Navegação por Mês
   ============================================= */

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];


/*para mudar o mes é so colocar 6 no numero */
const livrosPorMes = {
  5: [
    {
      titulo: "A Metamorfose",
      autor: "Franz Kafka",
      descricao: "Gregor Samsa acorda transformado em um enorme inseto e passa a enfrentar o isolamento, o preconceito e a incompreensão da própria família. A obra é um dos maiores clássicos da literatura mundial e aborda temas como alienação, identidade e condição humana."
    },
    {
      titulo: "A Volta ao Mundo em 80 Dias",
      autor: "Júlio Verne",
      descricao: "O excêntrico inglês Phileas Fogg aposta que consegue dar a volta ao mundo em apenas 80 dias. Ao lado de seu fiel criado Passepartout, ele embarca em uma aventura repleta de desafios, imprevistos e descobertas através de diferentes países e culturas."
    },
    {
      titulo: "Blecaute",
      autor: "Marcelo Rubens Paiva",
      descricao: "Em meio ao caos provocado por uma grande interrupção de energia, a obra explora as reações humanas diante da insegurança, da vulnerabilidade e das transformações sociais que surgem quando a rotina é abruptamente interrompida."
    },
    {
      titulo: "O Retrato de Dorian Gray",
      autor: "Oscar Wilde",
      descricao: "Dorian Gray deseja permanecer eternamente jovem enquanto um retrato envelhece em seu lugar. À medida que mergulha em uma vida de excessos e corrupção moral, apenas a pintura revela as consequências de seus atos."
    },
    {
      titulo: "O Pequeno Príncipe",
      autor: "Antoine de Saint-Exupéry",
      descricao: "Um piloto perdido no deserto encontra um pequeno príncipe vindo de outro planeta. Por meio de encontros e reflexões poéticas, a obra aborda amizade, amor, infância, solidão e os valores essenciais da vida."
    }
  ]
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
