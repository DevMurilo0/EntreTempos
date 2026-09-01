/* =============================================
   MUSICA.JS — Entre Tempos · Navegação por Mês
   ============================================= */
const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const musicasPorMes = {
  7: [ // Agosto (índice 0–11)
    {
      nome: "Vento Ventania",
      artista: "Biquini Cavadão",
      video: "video/Vento Ventania.mp4",
      descricao: "A música surge em um momento em que o Rock já havia passado por um boom, Vento Ventania deu um up e capturou um sentimento universal: a vontade de sumir em momentos de crise. O vento é uma personificação, a ele é pedido para que seja o guia de uma viagem sem roteiro, sem obrigações e sem, em alguns casos, passagens de volta. O compositor dessa letra, Bruno Gouveia, em homenagem ao filho de 2 anos e 10 meses que morreu em decorrência de um acidente de helicóptero, cantou essa música no dia do velório de Gabriel, o filho dele."
    },
    {
      nome: "Zé Ninguém",
      artista: "Biquini Cavadão",
      video: "video/Zé Ninguém.mp4",
      descricao: "Em 1990 o Brasil estava passando por um momento difícil e histórico, o confisco das poupanças pelo governo Fernando Collor de Melo. Cenário marcado por forte crise econômica, inflação alta, desilusão política e o contraste entre o que era dito oficialmente e a verdadeira realidade do povo brasileiro. A música já foi usada em protesto de esquerda e de direita."
    },
    {
      nome: "Conselho",
      artista: "Fundo de Quintal",
      video: "video/Conselho.mp4",
      descricao: "Você está na bad? Escuta o samba Conselho. A letra foi composta por Almir Guineto, em 1986, e nasceu de uma discussão criativa entre os autores. Essa música virou um verdadeiro hino contra o baixo astral."
    },
    {
      nome: "Pra Melhorar",
      artista: "Marisa Monte, Seu Jorge e Flor Maria",
      video: "video/Pra Melhorar.mp4",
      descricao: "A letra nasceu de um encontro musical nos Estados Unidos entre Marisa, Seu Jorge e a jovem Flor Maria Jorge, quando ela tinha apenas 12 anos. A mensagem central da letra fala sobre dias melhores, superação de tempestades e renovação da esperança."
    },
    {
      nome: "Sol de Giz de Cera",
      artista: "Emicida",
      video: "video/Sol de Giz de Cera.mp4",
      descricao: "Homenagem lúdica à Estela, filha de Emicida. A letra retrata a paternidade ativa e imaginativa, onde o pai vira \"rei, pirata e samurai\" e enfrenta o dia a dia duro (\"Dom Quixote doidão, de espada na mão\") para voltar para casa com a filha. Um bom exemplo de intertextualidade com a obra literária \"Dom Quixote\", de Miguel de Cervantes."
    },
    {
      nome: "Conversas de Botas Batidas",
      artista: "Los Hermanos",
      video: "video/Conversas de Botas Batidas.mp4",
      descricao: "A letra foi inspirada no desabamento real do Hotel Linda do Rosário, no Rio de Janeiro, ocorrido em setembro de 2002. Minutos antes da queda, os estalos chamaram atenção dos moradores; o porteiro, preocupado, bateu de porta em porta para que todos saíssem. Nos escombros estavam os corpos de um casal abraçado, dois amantes que se encontravam às escondidas no hotel. Marcelo Camelo criou um diálogo entre os apaixonados ao ouvirem as batidas. A canção dialoga com a obra \"Linda do Rosário\", de Adriana Varejão, exposta em Brumadinho."
    },
    {
      nome: "Só os Loucos Sabem",
      artista: "Charlie Brown Jr.",
      video: "video/Só os Loucos Sabem.mp4",
      descricao: "Inspirada na transformação de um amigo de longa data que mudou de vida ao encontrar paz espiritual, além de refletir a dualidade do próprio Chorão, que parecia durão por fora, mas era sensível por dentro. Ele recebeu a música em um show quando uma fã mostrou um folder do irmão dela, falecido e fã da banda. A história dessa e de outras letras de Chorão está no livro escrito por Gazon: \"Se não eu, quem vai fazer você feliz?\""
    },
    {
      nome: "Manguetown",
      artista: "Chico Science",
      video: "video/Manguetown.mp4",
      descricao: "Manguetown é uma música de protesto contra a degradação dos mangues na cidade de Recife. O mangue serve de sustento para muitas famílias. Por meio da canção, Chico Science traduz em som e poesia a identidade, os contrastes e a realidade urbana periférica de Recife, retratada no trecho \"onde os urubus têm casa e eu não tenho asas\"."
    },
    {
      nome: "Negro Drama",
      artista: "Racionais MC's",
      video: "video/Negro Drama.mp4",
      descricao: "A letra retrata com crueza a realidade do negro no Brasil, unindo vivências de exclusão social, racismo, pobreza, violência urbana e a ascensão financeira conquistada por meio do rap."
    },
    {
      nome: "Que País é Este",
      artista: "Legião Urbana",
      video: "video/Que País é Este.mp4",
      descricao: "A letra faz uma crítica forte e irônica aos problemas políticos e sociais brasileiros que perpassam nosso país desde a época em que a música foi criada. Hoje é mais do que necessário ouvir essa canção para refletir sobre nosso papel em uma sociedade democrática, um papel que não deve ser passivo."
    },
  ],
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

/* =============================================
   SISTEMA DE VOTOS — estilo Reddit
   Cada voto fica salvo no localStorage do aparelho
   (por navegador/dispositivo, cada telefone/PC guarda o seu).
   ============================================= */
const VOTOS_KEY = 'et_votos_musicas';

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function carregarVotos() {
  try { return JSON.parse(localStorage.getItem(VOTOS_KEY)) || {}; }
  catch (e) { return {}; }
}
function salvarVotos(v) { localStorage.setItem(VOTOS_KEY, JSON.stringify(v)); }

let votosState = carregarVotos();

function votar(id, direcao) {
  const atual = votosState[id] || { score: 0, meuVoto: 0 };
  if (atual.meuVoto === direcao) {
    atual.score -= direcao;
    atual.meuVoto = 0;
  } else {
    atual.score += direcao - atual.meuVoto;
    atual.meuVoto = direcao;
  }
  votosState[id] = atual;
  salvarVotos(votosState);
  renderizar();
}

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

  const musicasOriginal = musicasPorMes[mesIndex];
  if (!musicasOriginal || musicasOriginal.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = '<p class="vazio">Em breve as músicas deste mês!</p>';
    lista.appendChild(li);
    return;
  }

  // cada música recebe um id estável (mês + nome) pra guardar o voto dela
  const musicas = musicasOriginal.map((m, i) => {
    const id = `${mesIndex}-${slugify(m.nome)}`;
    const v = votosState[id] || { score: 0, meuVoto: 0 };
    return { ...m, id, ordemOriginal: i, score: v.score, meuVoto: v.meuVoto };
  });

  // ordena pelo placar (maior pro topo); empate mantém a ordem original
  musicas.sort((a, b) => b.score - a.score || a.ordemOriginal - b.ordemOriginal);

  musicas.forEach((m, i) => {
    const num = String(i + 1).padStart(2, '0');
    const li = document.createElement('li');
    li.classList.add('musica-item');
    li.style.animationDelay = `${i * 0.05}s`;

    const clicavel = (m.video || m.descricao) && m.nome !== '—';

    li.innerHTML = `
      <div class="voto-coluna" data-id="${m.id}">
        <button class="voto-btn voto-up ${m.meuVoto === 1 ? 'ativo' : ''}" aria-label="Votar a favor">▲</button>
        <span class="voto-score">${m.score}</span>
        <button class="voto-btn voto-down ${m.meuVoto === -1 ? 'ativo' : ''}" aria-label="Votar contra">▼</button>
      </div>
      <span class="musica-num">${num}</span>
      <div class="musica-info">
        <span class="musica-nome">${m.nome}</span>
        ${m.artista ? `<span class="musica-artista">${m.artista}</span>` : ''}
      </div>
      ${clicavel ? `<span class="musica-toggle-icone">▶</span>` : ''}
    `;

    li.querySelector('.voto-up').addEventListener('click', (e) => {
      e.stopPropagation();
      votar(m.id, 1);
    });
    li.querySelector('.voto-down').addEventListener('click', (e) => {
      e.stopPropagation();
      votar(m.id, -1);
    });

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
