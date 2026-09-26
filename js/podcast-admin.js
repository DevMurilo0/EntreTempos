import { auth, db } from '/js/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { criarLoadingEntreTempos } from '/js/loading-tempo.js';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const PESQUISADOR_UID = 'QuiQMjtXjOWNW2LCrot86rsHh0F2';
const CLOUDINARY_CLOUD_NAME = 'uaisf2vc';
const CLOUDINARY_UPLOAD_PRESET = 'entre_tempos_upload';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
const PODCASTS_REF = collection(db, 'participantesAutorais', '_podcasts', 'conteudos');

const lista = document.getElementById('lista-episodios');
const busca = document.querySelector('.busca-podcast');

if (lista) iniciar();

function iniciar() {
  const loading = criarLoadingEntreTempos();
  let primeiraLeitura = true;

  const barra = document.createElement('div');
  barra.className = 'podcast-admin-barra';
  barra.innerHTML = `
    <button type="button" class="podcast-admin-btn" data-novo-episodio>
      + Adicionar novo episódio
    </button>
  `;

  (busca || lista).insertAdjacentElement('beforebegin', barra);

  const modal = criarModalNovoEpisodio();
  document.body.appendChild(modal);

  let pesquisador = false;

  onAuthStateChanged(auth, (usuario) => {
    pesquisador = usuario?.uid === PESQUISADOR_UID;
    barra.classList.toggle('is-pesquisador', pesquisador);
  });

  barra.querySelector('[data-novo-episodio]').addEventListener('click', () => {
    if (!pesquisador) return;
    abrirModal(modal);
  });

  onSnapshot(
    PODCASTS_REF,
    (snapshot) => {
      const itens = snapshot.docs
        .map((item) => ({ id: item.id, dados: item.data() }))
        .filter((item) => item.dados.ativo !== false)
        .sort((a, b) => obterMillis(b.dados.criadoEm) - obterMillis(a.dados.criadoEm));

      renderizarCards(itens);

      if (primeiraLeitura) {
        primeiraLeitura = false;
        loading.remover();
      }
    },
    (erro) => {
      console.error('[podcast] Erro ao carregar episódios dinâmicos:', erro);

      if (primeiraLeitura) {
        primeiraLeitura = false;
        loading.erro('Não foi possível carregar os episódios agora.');
      }
    }
  );
}

function renderizarCards(itens) {
  lista
    .querySelectorAll('[data-podcast-dinamico="true"]')
    .forEach((el) => el.remove());

  const referencia = lista.querySelector('.card-episodio:not([data-podcast-dinamico="true"])');

  itens.forEach((item) => {
    const card = criarCard(item.id, item.dados);
    lista.insertBefore(card, referencia || lista.firstChild);
  });
}

function criarCard(id, dados) {
  const link = document.createElement('a');
  link.className = 'card-episodio';
  link.dataset.podcastDinamico = 'true';
  link.dataset.nome = dados.nome || '';
  link.dataset.outrosNomes = [dados.entrevistador1, dados.entrevistador2].filter(Boolean).join(' ');
  link.dataset.descricao = dados.descricao || '';
  link.dataset.tags = `${dados.cargo || ''} ${dados.numero || ''}`;
  link.dataset.podcast = 'Entre Tempos Podcast Pod Aula Vaga';
  link.href = `episodios/episodio.html?id=${encodeURIComponent(id)}`;

  const entrevistadores = [dados.entrevistador1, dados.entrevistador2]
    .filter(Boolean);

  const entrevistadoresTexto = entrevistadores.length
    ? `entrevistadores: ${entrevistadores.join(' e ')}`
    : 'entrevistadores a definir';

  link.innerHTML = `
    <div class="topo-card">
      <div class="capa-episodio ${dados.fotoUrl ? '' : 'sem-foto'}">
        ${dados.fotoUrl
          ? `<img src="${escapeAttr(otimizarImagem(dados.fotoUrl, 480, 480))}" alt="${escapeAttr(dados.nome || 'Convidado')}" loading="lazy" decoding="async">`
          : ''}
      </div>

      <div class="info-card">
        <div class="etiquetas">
          <span class="badge-cargo">${escapeHtml(dados.cargo || 'Convidado')}</span>
          <span class="badge-episodio">EP: ${escapeHtml(formatarNumero(dados.numero))}</span>
        </div>
        <h1 class="nome-convidado">${escapeHtml(dados.nome || 'Sem nome')}</h1>
        <p class="descricao-episodio">${escapeHtml(dados.descricao || '')}</p>
      </div>
    </div>
    <p class="entrevistadores">${escapeHtml(entrevistadoresTexto)}</p>
  `;

  return link;
}

function criarModalNovoEpisodio() {
  const modal = document.createElement('div');
  modal.className = 'podcast-modal';
  modal.hidden = true;

  modal.innerHTML = `
    <div class="podcast-modal__caixa" role="dialog" aria-modal="true" aria-labelledby="podcast-novo-titulo">
      <button class="podcast-modal__fechar" type="button" data-fechar aria-label="Fechar">×</button>
      <p class="podcast-modal__kicker">Entre Tempos · pesquisadores</p>
      <h2 class="podcast-modal__titulo" id="podcast-novo-titulo">Novo episódio</h2>

      <form data-form novalidate>
        <div class="podcast-form-grid">
          <div class="podcast-campo">
            <label for="podcast-numero">Número do episódio</label>
            <input id="podcast-numero" name="numero" type="text" inputmode="numeric" maxlength="3" placeholder="01">
          </div>

          <div class="podcast-campo">
            <label for="podcast-cargo">Cargo / identificação</label>
            <input id="podcast-cargo" name="cargo" type="text" maxlength="70" placeholder="Professor, estudante, poetista...">
          </div>
        </div>

        <div class="podcast-campo">
          <label for="podcast-nome">Nome do convidado</label>
          <input id="podcast-nome" name="nome" type="text" maxlength="140">
        </div>

        <div class="podcast-campo">
          <label for="podcast-descricao">Descrição curta</label>
          <textarea id="podcast-descricao" name="descricao" rows="5" maxlength="1200"></textarea>
        </div>

        <div class="podcast-campo podcast-campo--arquivo">
          <label for="podcast-foto">Foto do convidado</label>
          <input id="podcast-foto" name="foto" type="file" accept="image/*">
        </div>

        <div class="podcast-form-separador">
          <h3>Entrevistadores</h3>
          <p>Os dois nomes já vão aparecer no card do episódio e serão criados na página interna.</p>
        </div>

        <div class="podcast-form-grid">
          <div class="podcast-campo">
            <label for="podcast-entrevistador-1">Entrevistador 1</label>
            <input id="podcast-entrevistador-1" name="entrevistador1" type="text" maxlength="120">
          </div>

          <div class="podcast-campo">
            <label for="podcast-entrevistador-2">Entrevistador 2</label>
            <input id="podcast-entrevistador-2" name="entrevistador2" type="text" maxlength="120">
          </div>
        </div>

        <p class="podcast-progresso" data-msg role="status" aria-live="polite"></p>
        <div class="podcast-progress" data-progress><span></span></div>

        <div class="podcast-modal__acoes">
          <button type="button" class="podcast-btn podcast-btn--secundario" data-cancelar>Cancelar</button>
          <button type="submit" class="podcast-btn podcast-btn--principal" data-salvar>Criar episódio →</button>
        </div>
      </form>
    </div>
  `;

  const form = modal.querySelector('[data-form]');
  const msg = modal.querySelector('[data-msg]');
  const progresso = modal.querySelector('[data-progress]');
  const progressoSpan = progresso.querySelector('span');
  const salvar = modal.querySelector('[data-salvar]');
  let salvando = false;

  const fechar = () => {
    if (salvando) return;
    modal.hidden = true;
    document.body.classList.remove('podcast-modal-aberto');
    form.reset();
    msg.textContent = '';
    msg.classList.remove('is-erro');
    progresso.classList.remove('is-visible');
    progressoSpan.style.width = '0%';
  };

  modal.querySelector('[data-fechar]').addEventListener('click', fechar);
  modal.querySelector('[data-cancelar]').addEventListener('click', fechar);
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fechar();
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (salvando) return;

    if (auth.currentUser?.uid !== PESQUISADOR_UID) {
      mostrarErro(msg, 'Sua sessão de pesquisador não está ativa.');
      return;
    }

    const numero = formatarNumero(form.elements.numero.value.trim());
    const cargo = form.elements.cargo.value.trim();
    const nome = form.elements.nome.value.trim();
    const descricao = form.elements.descricao.value.trim();
    const entrevistador1 = form.elements.entrevistador1.value.trim();
    const entrevistador2 = form.elements.entrevistador2.value.trim();
    const foto = form.elements.foto.files?.[0] || null;

    if (!numero || !nome || !cargo || !descricao || !entrevistador1 || !entrevistador2) {
      mostrarErro(msg, 'Preencha número, cargo, nome, descrição e os dois entrevistadores.');
      return;
    }

    if (!foto) {
      mostrarErro(msg, 'Escolha a foto do convidado.');
      return;
    }

    const erroFoto = validarImagem(foto);
    if (erroFoto) {
      mostrarErro(msg, erroFoto);
      return;
    }

    salvando = true;
    salvar.disabled = true;
    salvar.textContent = 'Criando...';
    msg.classList.remove('is-erro');

    try {
      progresso.classList.add('is-visible');
      progressoSpan.style.width = '0%';

      const upload = await enviarArquivo(foto, (percentual) => {
        progressoSpan.style.width = `${percentual}%`;
        msg.textContent = `Enviando foto... ${Math.round(percentual)}%`;
      });

      const episodioRef = doc(PODCASTS_REF);

      msg.textContent = 'Criando página do episódio...';

      await setDoc(episodioRef, {
        tipo: 'podcast-episodio',
        ativo: true,
        numero,
        cargo,
        nome,
        descricao,
        fotoUrl: upload.url,
        fotoPublicId: upload.publicId,
        fotoResourceType: upload.resourceType,
        entrevistador1,
        entrevistador2,
        youtubeUrl: '',
        sobreConversa: '',
        links: [],
        bastidores: [],
        grupos: [
          {
            funcao: 'Entrevistadores',
            participantes: [
              { nome: entrevistador1, fotoUrl: '', instagram: '' },
              { nome: entrevistador2, fotoUrl: '', instagram: '' }
            ]
          }
        ],
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        criadoPor: auth.currentUser.uid
      });

      window.location.href = `episodios/episodio.html?id=${encodeURIComponent(episodioRef.id)}&editar=1`;
    } catch (erro) {
      console.error('[podcast] Erro ao criar episódio:', erro);
      mostrarErro(msg, mensagemErro(erro));
      progresso.classList.remove('is-visible');
      progressoSpan.style.width = '0%';
      salvar.disabled = false;
      salvar.textContent = 'Criar episódio →';
      salvando = false;
    }
  });

  return modal;
}

function abrirModal(modal) {
  modal.hidden = false;
  document.body.classList.add('podcast-modal-aberto');
  requestAnimationFrame(() => modal.querySelector('input')?.focus());
}

function validarImagem(arquivo) {
  if (!arquivo.type.startsWith('image/')) return 'Escolha uma imagem válida.';
  if (arquivo.size > 10 * 1024 * 1024) return 'A imagem precisa ter no máximo 10 MB.';
  return '';
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

      if (xhr.status >= 200 && xhr.status < 300 && resposta.secure_url) {
        onProgress?.(100);
        resolve({
          url: resposta.secure_url,
          publicId: resposta.public_id || '',
          resourceType: resposta.resource_type || ''
        });
        return;
      }

      const erro = new Error(resposta?.error?.message || 'O Cloudinary recusou o arquivo.');
      erro.code = 'cloudinary/upload-failed';
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

function otimizarImagem(url, largura, altura) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace(
    '/upload/',
    `/upload/f_auto,q_auto:good,w_${largura},h_${altura},c_fill,g_auto/`
  );
}

function formatarNumero(valor) {
  const limpo = String(valor || '').replace(/\D/g, '');
  if (!limpo) return '';
  return limpo.padStart(2, '0').slice(-3);
}

function obterMillis(timestamp) {
  try {
    return timestamp?.toMillis?.() || 0;
  } catch {
    return 0;
  }
}

function mostrarErro(el, texto) {
  el.textContent = texto;
  el.classList.add('is-erro');
}

function mensagemErro(erro) {
  const codigo = erro?.code || '';

  if (codigo === 'cloudinary/network-error') {
    return 'Não foi possível enviar a foto. Confira sua conexão.';
  }

  if (codigo === 'cloudinary/timeout') {
    return 'O upload demorou demais. Tente novamente.';
  }

  if (codigo.includes('permission-denied')) {
    return 'Sua conta de pesquisador não tem permissão para salvar.';
  }

  return 'Não foi possível criar o episódio agora.';
}

function escapeHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(valor) {
  return escapeHtml(valor);
}
