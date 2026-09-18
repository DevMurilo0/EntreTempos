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
const SECOES = new Set(['poemas', 'desenhos', 'musica', 'curiosidades']);
const CLOUDINARY_CLOUD_NAME = 'uaisf2vc';
const CLOUDINARY_UPLOAD_PRESET = 'entre_tempos_upload';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
const CACHE_PREFIX = 'entretempos:participantes:';
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;
const SECOES_COM_LOADING = new Set(['poemas', 'desenhos', 'musica']);

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
  const modal = criarModalCadastro();

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

  const loading = criarLoadingParticipantes();

  const cache = lerCacheParticipantes();

  if (cache.length) {
    renderizarParticipantes(alvo, cache);
    loading?.remover();
  }

  observarParticipantes(alvo, loading);
}

function obterAlvoGaleria() {
  const existente = document.querySelector('.fotos-navegacao');
  if (existente) return existente;

  const novo = document.createElement('section');
  novo.className = 'et-participantes-dinamicos';
  novo.setAttribute('aria-label', 'Autores adicionados pelos pesquisadores');

  const primeiroAutor = document.querySelector('.autor-bloco');

  if (primeiroAutor?.parentNode) {
    primeiroAutor.parentNode.insertBefore(novo, primeiroAutor);
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
  `;

  alvo.parentNode.insertBefore(barra, alvo);
  return barra;
}

function observarParticipantes(alvo, loading) {
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

    renderizarParticipantes(alvo, docs);
    salvarCacheParticipantes(docs);
    loading?.remover();
  }, (erro) => {
    console.error('[autorais] Falha ao carregar participantes:', erro);
    loading?.erro();
  });
}

function renderizarParticipantes(alvo, participantes) {
  alvo.querySelectorAll('[data-et-pessoa-dinamica]').forEach((el) => el.remove());

  participantes.forEach((item) => {
    alvo.appendChild(criarCardPessoa(item.id, item.dados));
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
  link.href = `/topicos/autorais/pessoa.html?secao=${encodeURIComponent(secao)}&id=${encodeURIComponent(id)}`;
  link.setAttribute('aria-label', `Ver publicações de ${dados.nome || 'participante'}`);

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = otimizarImagemCloudinary(dados.fotoUrl || '/img/amp.png', 640, 800);
  img.alt = dados.nome ? `Foto de ${dados.nome}` : 'Foto do participante';

  const nome = document.createElement('span');
  nome.textContent = dados.nome || 'Sem nome';

  if (secao === 'musica') {
    link.className = 'foto-nav et-pessoa-card--musica';
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
    const foto = form.elements.foto.files?.[0] || null;

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
        fotoUrl
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
