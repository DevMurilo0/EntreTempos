import { auth, db } from '/js/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
const PESQUISADOR_UID = 'QuiQMjtXjOWNW2LCrot86rsHh0F2';
const SECOES = new Set([
  'poemas',
  'poemas-conhecidos',
  'desenhos',
  'desenhos-conhecidos',
  'musica',
  'curiosidades',
  'curiosidades-gerais'
]);
const CLOUDINARY_CLOUD_NAME = 'uaisf2vc';
const CLOUDINARY_UPLOAD_PRESET = 'entre_tempos_upload';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
const CACHE_PREFIX = 'entretempos:participantes:';
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;
const SECOES_COM_LOADING = new Set(SECOES);
const RAIZ_ORDEM = '_ordem-secoes';

function otimizarImagemCloudinary(url, largura = 640, altura = 800) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  const transformacao = `f_auto,q_auto:good,w_${largura},h_${altura},c_limit`;
  return url.replace('/upload/', `/upload/${transformacao}/`);
}

const secao = document.body.dataset.autoraisSecao;

if (!SECOES.has(secao)) {
  console.warn('[autorais] seção não reconhecida:', secao);
} else {
  iniciarGaleria();
}

function iniciarGaleria() {
  const alvo = obterAlvoGaleria();
  const barra = criarBarraAdmin(alvo);
  const botaoAdicionar = barra.querySelector('[data-et-adicionar]');
  const botaoOrganizar = barra.querySelector('[data-et-organizar]');
  const modal = criarModalCadastro();
  const estadoOrdem = {
    ids: null,
    alvo,
    modal: null
  };

  document.body.appendChild(modal);

  let pesquisadorLogado = false;

  onAuthStateChanged(auth, (usuario) => {
    pesquisadorLogado = usuario?.uid === PESQUISADOR_UID;
    barra.classList.toggle('is-pesquisador', pesquisadorLogado);
  });

  botaoAdicionar.addEventListener('click', () => {
    if (!pesquisadorLogado) return;
    abrirModal(modal);
  });

  botaoOrganizar.addEventListener('click', () => {
    if (!pesquisadorLogado) return;
    abrirOrganizadorOrdem(estadoOrdem);
  });

  const loading = criarLoadingParticipantes();

  const cache = lerCacheParticipantes();

  if (cache.length) {
    renderizarParticipantes(alvo, cache, estadoOrdem);
    loading?.remover();
  }

  observarOrdem(estadoOrdem);
  observarParticipantes(alvo, loading, estadoOrdem);

  if (secao === 'poemas' || secao === 'poemas-conhecidos') {
    observarPoetasEstaticosRemovidos(alvo);
  }
}

function observarPoetasEstaticosRemovidos(alvo) {
  const ref = collection(
    db,
    'participantesAutorais',
    '_poetas-estaticos',
    'conteudos'
  );

  onSnapshot(
    ref,
    (snapshot) => {
      const prefixo = `${secao}--`;
      const removidos = new Set();

      snapshot.docs.forEach((item) => {
        if (!item.id.startsWith(prefixo)) return;
        if (item.data().removido !== true) return;
        removidos.add(item.id.slice(prefixo.length));
      });

      alvo
        .querySelectorAll('a.foto-nav:not([data-et-pessoa-dinamica])')
        .forEach((link) => {
          const href = link.getAttribute('href') || '';
          const slug = [...removidos].find((item) =>
            href.includes(`${item}/index.html`)
          );

          link.hidden = Boolean(slug);
        });
    },
    (erro) => {
      console.error('[autorais] Erro ao verificar poetas removidos:', erro);
    }
  );
}

function obterAlvoGaleria() {
  const existente = document.querySelector('.fotos-navegacao');
  if (existente) return existente;

  const novo = document.createElement('section');
  novo.className = 'et-participantes-dinamicos et-ordem-lista et-ordem-lista--blocos';
  novo.setAttribute('aria-label', 'Pessoas e conteúdos da seção');

  const primeiroAutor = document.querySelector('.autor-bloco');

  if (primeiroAutor?.parentNode) {
    primeiroAutor.parentNode.insertBefore(novo, primeiroAutor);

    document.querySelectorAll('.divisor').forEach((divisor) => {
      const posicao = primeiroAutor.compareDocumentPosition(divisor);
      if (posicao & Node.DOCUMENT_POSITION_FOLLOWING) divisor.remove();
    });

    document.querySelectorAll('.autor-bloco[data-et-order-id]').forEach((bloco) => {
      novo.appendChild(bloco);
    });
  } else {
    const rodape = document.querySelector('[class*="rodape"]');
    (rodape?.parentNode || document.body).insertBefore(novo, rodape || null);
  }

  return novo;
}

function criarBarraAdmin(alvo) {
  const barra = document.createElement('div');
  barra.className = 'et-admin-barra';
  barra.innerHTML = `
    <button type="button" class="et-admin-adicionar" data-et-adicionar>
      <span class="et-admin-adicionar__mais" aria-hidden="true">+</span>
      <span>Adicionar pessoa</span>
    </button>
    <button type="button" class="et-admin-adicionar et-admin-organizar" data-et-organizar>
      <span aria-hidden="true">↕</span>
      <span>Organizar ordem</span>
    </button>
  `;

  alvo.parentNode.insertBefore(barra, alvo);
  return barra;
}

function observarParticipantes(alvo, loading, estadoOrdem) {
  const consulta = query(
    collection(db, 'participantesAutorais'),
    where('secao', '==', secao)
  );

  onSnapshot(consulta, (snapshot) => {
    const docs = snapshot.docs
      .filter((item) => item.data().ativo !== false)
      .sort((a, b) => obterMillis(a.data().criadoEm) - obterMillis(b.data().criadoEm))
      .map((item) => ({
        id: item.id,
        dados: item.data()
      }));

    renderizarParticipantes(alvo, docs, estadoOrdem);
    salvarCacheParticipantes(docs);
    loading?.remover();
  }, (erro) => {
    console.error('[autorais] Falha ao carregar participantes:', erro);
    loading?.erro();
  });
}

function renderizarParticipantes(alvo, participantes, estadoOrdem = null) {
  alvo.querySelectorAll('[data-et-pessoa-dinamica]').forEach((el) => el.remove());

  participantes.forEach((item) => {
    const card = criarCardPessoa(item.id, item.dados);

    if (alvo.classList.contains('et-ordem-lista--blocos') && estadoOrdem?.ids === null) {
      const primeiroEstatico = alvo.querySelector('[data-et-order-id^="static:"]');
      alvo.insertBefore(card, primeiroEstatico || null);
    } else {
      alvo.appendChild(card);
    }
  });

  aplicarOrdem(estadoOrdem);
}

function observarOrdem(estado) {
  const ordemRef = doc(
    db,
    'participantesAutorais',
    RAIZ_ORDEM,
    'conteudos',
    secao
  );

  onSnapshot(ordemRef, (snapshot) => {
    const ids = snapshot.exists() && Array.isArray(snapshot.data().ids)
      ? snapshot.data().ids.filter((id) => typeof id === 'string')
      : null;

    estado.ids = ids;
    aplicarOrdem(estado);
  }, (erro) => {
    console.error('[autorais] Falha ao carregar a ordem editorial:', erro);
  });
}

function itensOrdenaveis(alvo) {
  return [...alvo.querySelectorAll(':scope > [data-et-order-id]')]
    .filter((item) => !item.hidden);
}

function aplicarOrdem(estado) {
  if (!estado?.alvo || !Array.isArray(estado.ids)) return;

  const itens = itensOrdenaveis(estado.alvo);
  const porId = new Map(itens.map((item) => [item.dataset.etOrderId, item]));
  const ordenados = [];

  estado.ids.forEach((id) => {
    const item = porId.get(id);
    if (!item) return;
    ordenados.push(item);
    porId.delete(id);
  });

  // Itens novos ou antigos ainda sem configuração sempre entram no final.
  ordenados.push(...porId.values());
  ordenados.forEach((item) => estado.alvo.appendChild(item));
}

function rotuloItemOrdem(item) {
  return (
    item.querySelector('.foto-nav-nome, .et-pessoa-card__nome, h1, h2, h3')
      ?.textContent.trim() ||
    item.getAttribute('aria-label') ||
    'Item sem título'
  );
}

function abrirOrganizadorOrdem(estado) {
  estado.modal?.remove();

  const itens = itensOrdenaveis(estado.alvo);
  const modal = document.createElement('div');
  modal.className = 'et-modal';
  modal.innerHTML = `
    <div class="et-modal__caixa et-modal__caixa--ordem" role="dialog" aria-modal="true" aria-labelledby="et-ordem-titulo">
      <button type="button" class="et-modal__fechar" data-fechar aria-label="Fechar">×</button>
      <p class="et-modal__kicker">Entre Tempos · pesquisadores</p>
      <h2 class="et-modal__titulo" id="et-ordem-titulo">Organizar ordem</h2>
      <p class="et-ordem-ajuda">Arraste no computador ou use as setas para definir a ordem editorial.</p>
      <ol class="et-ordem-lista-admin" data-lista></ol>
      <p class="et-progresso" data-msg role="status" aria-live="polite"></p>
      <div class="et-modal__acoes">
        <button type="button" class="et-btn et-btn--secundario" data-cancelar>Cancelar</button>
        <button type="button" class="et-btn et-btn--principal" data-salvar>Salvar ordem</button>
      </div>
    </div>
  `;

  const lista = modal.querySelector('[data-lista]');
  const mensagem = modal.querySelector('[data-msg]');
  const salvar = modal.querySelector('[data-salvar]');

  itens.forEach((item) => {
    lista.appendChild(criarItemOrganizador(item.dataset.etOrderId, rotuloItemOrdem(item)));
  });

  if (!itens.length) {
    lista.innerHTML = '<li class="et-estado-vazio">Não há itens para organizar.</li>';
    salvar.disabled = true;
  }

  let arrastado = null;

  lista.addEventListener('dragstart', (evento) => {
    const item = evento.target.closest('[data-order-id]');
    if (!item) return;
    arrastado = item;
    item.classList.add('is-arrastando');
    evento.dataTransfer.effectAllowed = 'move';
  });

  lista.addEventListener('dragover', (evento) => {
    if (!arrastado) return;
    evento.preventDefault();
    const destino = evento.target.closest('[data-order-id]');
    if (!destino || destino === arrastado) return;
    const retangulo = destino.getBoundingClientRect();
    const depois = evento.clientY > retangulo.top + retangulo.height / 2;
    lista.insertBefore(arrastado, depois ? destino.nextSibling : destino);
  });

  lista.addEventListener('dragend', () => {
    arrastado?.classList.remove('is-arrastando');
    arrastado = null;
    atualizarBotoesOrdem(lista);
  });

  lista.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-mover]');
    if (!botao) return;
    const item = botao.closest('[data-order-id]');
    const direcao = botao.dataset.mover;

    if (direcao === 'cima' && item.previousElementSibling) {
      lista.insertBefore(item, item.previousElementSibling);
    } else if (direcao === 'baixo' && item.nextElementSibling) {
      lista.insertBefore(item.nextElementSibling, item);
    }

    atualizarBotoesOrdem(lista);
    botao.focus();
  });

  const fechar = () => {
    modal.remove();
    document.body.classList.remove('et-modal-aberto');
    estado.modal = null;
  };

  modal.querySelector('[data-fechar]').addEventListener('click', fechar);
  modal.querySelector('[data-cancelar]').addEventListener('click', fechar);
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fechar();
  });

  salvar.addEventListener('click', async () => {
    if (auth.currentUser?.uid !== PESQUISADOR_UID) {
      mostrarErro(mensagem, 'Sua sessão de pesquisador não está ativa.');
      return;
    }

    const ids = [...lista.querySelectorAll('[data-order-id]')]
      .map((item) => item.dataset.orderId);

    salvar.disabled = true;
    mensagem.classList.remove('is-erro');
    mensagem.textContent = 'Salvando ordem...';

    try {
      await setDoc(doc(
        db,
        'participantesAutorais',
        RAIZ_ORDEM,
        'conteudos',
        secao
      ), {
        tipo: 'ordem-editorial',
        secao,
        ids,
        atualizadoEm: serverTimestamp(),
        atualizadoPor: auth.currentUser.uid
      });

      estado.ids = ids;
      aplicarOrdem(estado);
      mensagem.textContent = 'Ordem salva.';
      setTimeout(fechar, 700);
    } catch (erro) {
      console.error('[autorais] Falha ao salvar a ordem editorial:', erro);
      mostrarErro(mensagem, 'Não foi possível salvar a ordem. Confira sua conexão e as permissões do Firebase.');
      salvar.disabled = false;
    }
  });

  document.body.appendChild(modal);
  document.body.classList.add('et-modal-aberto');
  estado.modal = modal;
  atualizarBotoesOrdem(lista);
  requestAnimationFrame(() => modal.querySelector('[data-fechar]')?.focus());
}

function criarItemOrganizador(id, rotulo) {
  const item = document.createElement('li');
  item.className = 'et-ordem-item';
  item.dataset.orderId = id;
  item.draggable = true;

  const alca = document.createElement('span');
  alca.className = 'et-ordem-item__alca';
  alca.setAttribute('aria-hidden', 'true');
  alca.textContent = '⋮⋮';

  const nome = document.createElement('span');
  nome.className = 'et-ordem-item__nome';
  nome.textContent = rotulo;

  const acoes = document.createElement('span');
  acoes.className = 'et-ordem-item__acoes';

  ['cima', 'baixo'].forEach((direcao) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.dataset.mover = direcao;
    botao.textContent = direcao === 'cima' ? '↑' : '↓';
    botao.setAttribute('aria-label', `Mover ${rotulo} para ${direcao}`);
    acoes.appendChild(botao);
  });

  item.append(alca, nome, acoes);
  return item;
}

function atualizarBotoesOrdem(lista) {
  const itens = [...lista.querySelectorAll('[data-order-id]')];

  itens.forEach((item, indice) => {
    item.querySelector('[data-mover="cima"]').disabled = indice === 0;
    item.querySelector('[data-mover="baixo"]').disabled = indice === itens.length - 1;
  });
}

function chaveCache() {
  return `${CACHE_PREFIX}${secao}`;
}

function lerCacheParticipantes() {
  try {
    const bruto = localStorage.getItem(chaveCache());
    if (!bruto) return [];

    const cache = JSON.parse(bruto);

    if (
      !cache ||
      !Array.isArray(cache.itens) ||
      Date.now() - Number(cache.salvoEm || 0) > CACHE_MAX_AGE
    ) {
      localStorage.removeItem(chaveCache());
      return [];
    }

    return cache.itens;
  } catch {
    return [];
  }
}

function salvarCacheParticipantes(participantes) {
  try {
    const itens = participantes.map((item) => ({
      id: item.id,
      dados: {
        nome: item.dados.nome || '',
        descricao: item.dados.descricao || '',
        fotoUrl: item.dados.fotoUrl || '',
        instagram: item.dados.instagram || '',
        secao,
        ativo: item.dados.ativo !== false,
        criadoEmMs: obterMillis(item.dados.criadoEm)
      }
    }));

    localStorage.setItem(
      chaveCache(),
      JSON.stringify({ salvoEm: Date.now(), itens })
    );
  } catch {
    // Cache é apenas uma otimização; falhar aqui não impede o site.
  }
}

function adicionarPessoaAoCache(id, dados) {
  try {
    const atuais = lerCacheParticipantes()
      .filter((item) => item.id !== id);

    atuais.push({
      id,
      dados: {
        nome: dados.nome || '',
        descricao: dados.descricao || '',
        fotoUrl: dados.fotoUrl || '',
        instagram: dados.instagram || '',
        secao,
        ativo: true,
        criadoEmMs: Date.now()
      }
    });

    localStorage.setItem(
      chaveCache(),
      JSON.stringify({ salvoEm: Date.now(), itens: atuais })
    );
  } catch {
    // Cache é apenas uma otimização.
  }
}

function criarLoadingParticipantes() {
  if (!SECOES_COM_LOADING.has(secao)) return null;

  const overlay = document.createElement('div');
  overlay.className = 'et-loading-participantes';
  overlay.innerHTML = `
    <div class="et-loading-participantes__papel" role="status" aria-live="polite">
      <img
        class="et-loading-participantes__ampulheta"
        src="/img/amp.png"
        alt=""
        aria-hidden="true"
      >
      <strong>Entre Tempos</strong>
      <span>carregando o tempo...</span>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .et-loading-participantes {
      position: fixed;
      inset: 0;
      z-index: 9998;
      display: grid;
      place-items: center;
      padding: 24px;
      background: #f2e8d5;
      background-image: radial-gradient(rgba(104,75,45,.05) 1px, transparent 1px);
      background-size: 5px 5px;
      opacity: 1;
      transition: opacity .28s ease, visibility .28s ease;
    }

    .et-loading-participantes.is-saindo {
      opacity: 0;
      visibility: hidden;
    }

    .et-loading-participantes__papel {
      min-width: min(88vw, 320px);
      padding: 30px 28px;
      text-align: center;
      color: #3e3228;
      background: #fffaf0;
      border-left: 5px solid #9b3e3e;
      box-shadow: 8px 12px 28px rgba(50,30,15,.18);
      font-family: 'Special Elite', serif;
    }

    .et-loading-participantes__papel strong,
    .et-loading-participantes__papel span {
      display: block;
    }

    .et-loading-participantes__papel strong {
      margin-bottom: 8px;
      font-size: 22px;
      letter-spacing: 2px;
    }

    .et-loading-participantes__papel span {
      color: #7a6a50;
      font-size: 13px;
      letter-spacing: 1px;
    }

    .et-loading-participantes__ampulheta {
      display: block;
      width: clamp(58px, 12vw, 82px);
      height: auto;
      margin: 0 auto 16px;
      object-fit: contain;
      filter: drop-shadow(0 7px 8px rgba(61, 42, 27, .16));
      transform-origin: center;
      animation: etLoadingAmpulheta 1.35s ease-in-out infinite alternate;
    }

    @keyframes etLoadingAmpulheta {
      from { transform: translateY(0) rotate(-2deg); }
      to { transform: translateY(-5px) rotate(2deg); }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  let removido = false;

  return {
    remover() {
      if (removido) return;
      removido = true;
      overlay.classList.add('is-saindo');
      setTimeout(() => {
        overlay.remove();
        style.remove();
      }, 320);
    },
    erro() {
      const texto = overlay.querySelector('span');
      if (texto) texto.textContent = 'Não foi possível atualizar agora.';
      setTimeout(() => this.remover(), 900);
    }
  };
}

function criarCardPessoa(id, dados) {
  const link = document.createElement('a');
  link.dataset.etPessoaDinamica = 'true';
  link.dataset.etOrderId = `dynamic:${id}`;
  link.href = `/topicos/autorais/pessoa.html?secao=${encodeURIComponent(secao)}&id=${encodeURIComponent(id)}`;
  link.setAttribute('aria-label', `Ver publicações de ${dados.nome || 'participante'}`);

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = otimizarImagemCloudinary(dados.fotoUrl || '/img/amp.png', 640, 800);
  img.alt = dados.nome ? `Foto de ${dados.nome}` : 'Foto do participante';

  const nome = document.createElement('span');
  nome.textContent = dados.nome || 'Sem nome';

  if (
    secao === 'musica' ||
    secao === 'poemas-conhecidos' ||
    secao === 'desenhos-conhecidos'
  ) {
    link.className = 'foto-nav et-pessoa-card--navegacao';
    nome.className = 'foto-nav-nome';
    link.append(img, nome);
    return link;
  }

  link.className = 'et-pessoa-card';

  const moldura = document.createElement('span');
  moldura.className = 'et-pessoa-card__foto';
  moldura.appendChild(img);

  nome.className = 'et-pessoa-card__nome';
  link.append(moldura, nome);

  if (dados.descricao) {
    const descricao = document.createElement('span');
    descricao.className = 'et-pessoa-card__descricao';
    descricao.textContent = dados.descricao;
    link.appendChild(descricao);
  }

  return link;
}

function criarModalCadastro() {
  const modal = document.createElement('div');
  modal.className = 'et-modal';
  modal.hidden = true;

  modal.innerHTML = `
    <div class="et-modal__caixa" role="dialog" aria-modal="true" aria-labelledby="et-nova-pessoa-titulo">
      <button type="button" class="et-modal__fechar" data-et-fechar aria-label="Fechar">×</button>
      <p class="et-modal__kicker">Entre Tempos · pesquisadores</p>
      <h2 class="et-modal__titulo" id="et-nova-pessoa-titulo">Adicionar pessoa</h2>

      <form data-et-form-pessoa novalidate>
        <div class="et-campo">
          <label for="et-pessoa-nome">Nome <small>(opcional)</small></label>
          <input id="et-pessoa-nome" name="nome" type="text" maxlength="120" autocomplete="name">
        </div>

        <div class="et-campo">
          <label for="et-pessoa-descricao">Descrição <small>(opcional)</small></label>
          <textarea id="et-pessoa-descricao" name="descricao" maxlength="1200" rows="5"></textarea>
        </div>

        <div class="et-campo">
          <label for="et-pessoa-instagram">Instagram <small>(opcional)</small></label>
          <input id="et-pessoa-instagram" name="instagram" type="text" maxlength="120" inputmode="url" placeholder="@usuario ou instagram.com/usuario">
        </div>

        <div class="et-campo et-arquivo">
          <label for="et-pessoa-foto">Imagem da pessoa <small>(opcional)</small></label>
          <input id="et-pessoa-foto" name="foto" type="file" accept="image/*">
          <img class="et-preview" data-et-preview alt="Prévia da imagem selecionada">
        </div>

        <p class="et-progresso" data-et-mensagem role="status" aria-live="polite"></p>
        <div class="et-progress-bar" data-et-barra><span></span></div>

        <div class="et-modal__acoes">
          <button type="button" class="et-btn et-btn--secundario" data-et-cancelar>Cancelar</button>
          <button type="submit" class="et-btn et-btn--principal" data-et-salvar>Salvar e adicionar conteúdo →</button>
        </div>
      </form>
    </div>
  `;

  const form = modal.querySelector('[data-et-form-pessoa]');
  const inputFoto = form.elements.foto;
  const preview = modal.querySelector('[data-et-preview]');
  const mensagem = modal.querySelector('[data-et-mensagem]');
  const barra = modal.querySelector('[data-et-barra]');
  const barraInterna = barra.querySelector('span');
  const salvar = modal.querySelector('[data-et-salvar]');

  let previewUrl = null;
  let salvando = false;

  inputFoto.addEventListener('change', () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const arquivo = inputFoto.files?.[0];

    if (!arquivo) {
      preview.classList.remove('is-visible');
      preview.removeAttribute('src');
      previewUrl = null;
      return;
    }

    previewUrl = URL.createObjectURL(arquivo);
    preview.src = previewUrl;
    preview.classList.add('is-visible');
  });

  function fechar() {
    if (salvando) return;

    fecharModal(modal);
    form.reset();
    mensagem.textContent = '';
    mensagem.classList.remove('is-erro');
    barra.classList.remove('is-visible');
    barraInterna.style.width = '0%';

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    previewUrl = null;
    preview.classList.remove('is-visible');
    preview.removeAttribute('src');
  }

  modal.querySelector('[data-et-fechar]').addEventListener('click', fechar);
  modal.querySelector('[data-et-cancelar]').addEventListener('click', fechar);

  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fechar();
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !modal.hidden) fechar();
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (salvando) return;

    const usuario = auth.currentUser;

    if (usuario?.uid !== PESQUISADOR_UID) {
      mostrarErro(mensagem, 'Sua sessão de pesquisador não está ativa.');
      return;
    }

    const nome = form.elements.nome.value.trim();
    const descricao = form.elements.descricao.value.trim();
    const instagramResultado = normalizarInstagram(form.elements.instagram.value);
    const foto = form.elements.foto.files?.[0] || null;

    if (!instagramResultado.ok) {
      mostrarErro(mensagem, instagramResultado.mensagem);
      return;
    }

    const instagram = instagramResultado.usuario;

    if (foto && !foto.type.startsWith('image/')) {
      mostrarErro(mensagem, 'Escolha um arquivo de imagem válido.');
      return;
    }

    if (foto && foto.size > 10 * 1024 * 1024) {
      mostrarErro(mensagem, 'A imagem precisa ter no máximo 10 MB.');
      return;
    }

    salvando = true;
    salvar.disabled = true;
    salvar.textContent = 'Salvando...';
    mensagem.classList.remove('is-erro');

    const pessoaRef = doc(collection(db, 'participantesAutorais'));
    let fotoUrl = '';
    let fotoPublicId = '';
    let fotoResourceType = '';

    try {
      if (foto) {
        barra.classList.add('is-visible');
        barraInterna.style.width = '0%';
        mensagem.textContent = 'Enviando a imagem...';

        const upload = await enviarArquivo(foto, (percentual) => {
          barraInterna.style.width = `${percentual}%`;
          mensagem.textContent = `Enviando a imagem... ${Math.round(percentual)}%`;
        });

        fotoUrl = upload.url;
        fotoPublicId = upload.publicId;
        fotoResourceType = upload.resourceType;
      } else {
        barra.classList.remove('is-visible');
        mensagem.textContent = 'Criando a página da pessoa...';
      }

      mensagem.textContent = 'Criando a página da pessoa...';

      await setDoc(pessoaRef, {
        nome,
        descricao,
        instagram,
        fotoUrl,
        fotoPublicId,
        fotoResourceType,
        secao,
        ativo: true,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        criadoPor: usuario.uid
      });

      adicionarPessoaAoCache(pessoaRef.id, {
        nome,
        descricao,
        fotoUrl,
        instagram
      });

      window.location.href = `/topicos/autorais/pessoa.html?secao=${encodeURIComponent(secao)}&id=${encodeURIComponent(pessoaRef.id)}&novo=1`;
    } catch (erro) {
      console.error('[autorais] Falha ao adicionar pessoa:', erro);

      mostrarErro(mensagem, mensagemErroUpload(erro));

      barra.classList.remove('is-visible');
      barraInterna.style.width = '0%';
    } finally {
      salvando = false;
      salvar.disabled = false;
      salvar.textContent = 'Salvar e adicionar conteúdo →';
    }
  });

  return modal;
}

function abrirModal(modal) {
  modal.hidden = false;
  document.body.classList.add('et-modal-aberto');
  requestAnimationFrame(() => modal.querySelector('input')?.focus());
}

function fecharModal(modal) {
  modal.hidden = true;
  document.body.classList.remove('et-modal-aberto');
}

function enviarArquivo(arquivo, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const dados = new FormData();

    dados.append('file', arquivo);
    dados.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);
    xhr.responseType = 'json';
    xhr.timeout = 10 * 60 * 1000;

    xhr.upload.addEventListener('progress', (evento) => {
      if (!evento.lengthComputable) return;
      onProgress?.((evento.loaded / evento.total) * 100);
    });

    xhr.addEventListener('load', () => {
      const resposta = xhr.response || {};

      if (
        xhr.status >= 200 &&
        xhr.status < 300 &&
        resposta.secure_url
      ) {
        onProgress?.(100);

        resolve({
          url: resposta.secure_url,
          publicId: resposta.public_id || '',
          resourceType: resposta.resource_type || ''
        });
        return;
      }

      const erro = new Error(
        resposta?.error?.message || 'O Cloudinary recusou o arquivo.'
      );
      erro.code = 'cloudinary/upload-failed';
      erro.status = xhr.status;
      reject(erro);
    });

    xhr.addEventListener('error', () => {
      const erro = new Error('Falha de rede durante o upload.');
      erro.code = 'cloudinary/network-error';
      reject(erro);
    });

    xhr.addEventListener('timeout', () => {
      const erro = new Error('O upload demorou tempo demais.');
      erro.code = 'cloudinary/timeout';
      reject(erro);
    });

    xhr.send(dados);
  });
}

function obterMillis(timestamp) {
  try {
    if (typeof timestamp === 'number') return timestamp;
    if (typeof timestamp?.criadoEmMs === 'number') return timestamp.criadoEmMs;
    return timestamp?.toMillis?.() || 0;
  } catch {
    return 0;
  }
}

function mostrarErro(elemento, texto) {
  elemento.textContent = texto;
  elemento.classList.add('is-erro');
}

function normalizarInstagram(valor) {
  const entrada = String(valor || '').trim();
  if (!entrada) return { ok: true, usuario: '' };

  let usuario = entrada;

  if (/^https?:\/\//i.test(entrada)) {
    try {
      const url = new URL(entrada);
      const host = url.hostname.toLowerCase().replace(/^www\./, '');

      if (host !== 'instagram.com') {
        return {
          ok: false,
          mensagem: 'Informe um usuário ou uma URL válida do Instagram.'
        };
      }

      const partes = url.pathname.split('/').filter(Boolean);
      if (partes.length !== 1) {
        return {
          ok: false,
          mensagem: 'Informe a URL do perfil, como instagram.com/usuario.'
        };
      }

      usuario = partes[0];
    } catch {
      return {
        ok: false,
        mensagem: 'Informe um usuário ou uma URL válida do Instagram.'
      };
    }
  } else {
    usuario = entrada.replace(/^@/, '');
  }

  if (!/^[a-zA-Z0-9._]{1,30}$/.test(usuario)) {
    return {
      ok: false,
      mensagem: 'O Instagram deve ter até 30 caracteres e usar apenas letras, números, ponto ou sublinhado.'
    };
  }

  return { ok: true, usuario: usuario.toLowerCase() };
}

function mensagemErroUpload(erro) {
  const codigo = erro?.code || '';
  const mensagem = erro?.message || '';

  if (codigo === 'cloudinary/network-error') {
    return 'Não foi possível enviar o arquivo. Confira sua conexão e tente novamente.';
  }

  if (codigo === 'cloudinary/timeout') {
    return 'O upload demorou demais. Tente novamente com uma conexão mais estável.';
  }

  if (codigo === 'cloudinary/upload-failed') {
    return mensagem
      ? `O Cloudinary recusou o arquivo: ${mensagem}`
      : 'O Cloudinary recusou o arquivo. Confira o formato e o tamanho.';
  }

  if (codigo.includes('permission-denied')) {
    return 'Sua sessão de pesquisador não tem permissão para salvar os dados.';
  }

  return 'Não foi possível salvar agora. Tente novamente.';
}
