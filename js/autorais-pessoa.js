import { auth, db } from '/js/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
const PESQUISADOR_UID = 'QuiQMjtXjOWNW2LCrot86rsHh0F2';
const CLOUDINARY_CLOUD_NAME = 'uaisf2vc';
const CLOUDINARY_UPLOAD_PRESET = 'entre_tempos_upload';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

const CONFIG = {
  poemas: {
    rotulo: 'Poemas autorais',
    conteudo: 'Poemas publicados',
    adicionar: 'Adicionar poema',
    voltar: '/topicos/poemas/autorais/autorais/autorais.html'
  },
  'poemas-conhecidos': {
    rotulo: 'Poetas conhecidos',
    conteudo: 'Poemas publicados',
    adicionar: 'Adicionar poema',
    voltar: '/topicos/poemas/conhecidos/conhecidos.html'
  },
  desenhos: {
    rotulo: 'Desenhos autorais',
    conteudo: 'Desenhos publicados',
    adicionar: 'Adicionar desenho',
    voltar: '/topicos/desenhos/autorais/autorais.html'
  },
  'desenhos-conhecidos': {
    rotulo: 'Artes conhecidas',
    conteudo: 'Obras publicadas',
    adicionar: 'Adicionar obra',
    voltar: '/topicos/desenhos/conhecidos/conhecidos.html'
  },
  musica: {
    rotulo: 'Talento musical',
    conteudo: 'Músicas publicadas',
    adicionar: 'Adicionar música',
    voltar: '/topicos/musica/talento/talento.html'
  },
  curiosidades: {
    rotulo: 'Curiosidades autorais',
    conteudo: 'Curiosidades publicadas',
    adicionar: 'Adicionar curiosidade',
    voltar: '/topicos/curiosidades/autorais/autorais.html'
  },
  'curiosidades-gerais': {
    rotulo: 'Curiosidades gerais',
    conteudo: 'Curiosidades publicadas',
    adicionar: 'Adicionar curiosidade',
    voltar: '/topicos/curiosidades/gerais/gerais.html'
  }
};

const TIPO_SECAO = {
  poemas: 'poemas',
  'poemas-conhecidos': 'poemas',
  desenhos: 'desenhos',
  'desenhos-conhecidos': 'desenhos',
  musica: 'musica',
  curiosidades: 'curiosidades',
  'curiosidades-gerais': 'curiosidades'
};

function otimizarImagemCloudinary(url, largura = 900, altura = 1200) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  const transformacao = `f_auto,q_auto:good,w_${largura},h_${altura},c_limit`;
  return url.replace('/upload/', `/upload/${transformacao}/`);
}

function normalizarVideoCloudinary(url) {
  if (
    !url ||
    !url.includes('res.cloudinary.com') ||
    !url.includes('/video/upload/')
  ) {
    return url;
  }

  const transformacao = 'f_mp4,vc_h264:baseline,ac_aac,q_auto:good';
  let resultado = url.replace(
    '/video/upload/',
    `/video/upload/${transformacao}/`
  );

  const queryIndex = resultado.indexOf('?');
  const query = queryIndex >= 0 ? resultado.slice(queryIndex) : '';
  let base = queryIndex >= 0 ? resultado.slice(0, queryIndex) : resultado;
  const ultimoSlash = base.lastIndexOf('/');
  const ultimoPonto = base.lastIndexOf('.');

  if (ultimoPonto > ultimoSlash) {
    base = `${base.slice(0, ultimoPonto)}.mp4`;
  } else {
    base += '.mp4';
  }

  return base + query;
}

const params = new URLSearchParams(location.search);
const secao = params.get('secao');
const tipoSecao = TIPO_SECAO[secao];
const pessoaId = params.get('id');
const novo = params.get('novo') === '1';
const config = CONFIG[secao];

const el = {
  voltar: document.getElementById('et-voltar'),
  rotulo: document.getElementById('et-rotulo-secao'),
  nome: document.getElementById('et-pessoa-nome'),
  descricao: document.getElementById('et-pessoa-descricao'),
  foto: document.getElementById('et-pessoa-foto'),
  tituloConteudos: document.getElementById('et-conteudos-titulo'),
  conteudos: document.getElementById('et-conteudos'),
  mensagem: document.getElementById('et-pagina-mensagem'),
  admin: document.getElementById('et-admin-acoes'),
  btnAdicionar: document.getElementById('et-btn-adicionar-conteudo'),
  btnEditar: document.getElementById('et-btn-editar-pessoa'),
  btnExcluir: document.getElementById('et-btn-excluir-pessoa')
};

if (!config || !tipoSecao || !pessoaId) {
  falharPagina('Página inválida. Volte para a revista e tente novamente.');
} else {
  iniciar();
}

function iniciar() {
  const loadingPagina = criarLoadingPagina();
  let pessoaCarregada = false;
  let conteudosCarregados = false;

  const tentarFecharLoading = () => {
    if (pessoaCarregada && conteudosCarregados) {
      loadingPagina?.remover();
    }
  };

  el.voltar.href = config.voltar;
  el.rotulo.textContent = config.rotulo;
  el.tituloConteudos.textContent = config.conteudo;
  el.btnAdicionar.textContent = `+ ${config.adicionar}`;
  if (tipoSecao === 'poemas') {
    el.btnEditar.textContent = 'Editar tudo';
  }

  const pessoaRef = doc(db, 'participantesAutorais', pessoaId);
  const conteudosRef = collection(pessoaRef, 'conteudos');

  let dadosPessoa = null;
  let pesquisador = false;
  let abriuNovo = false;
  let documentosConteudo = [];

  onAuthStateChanged(auth, (usuario) => {
    pesquisador = usuario?.uid === PESQUISADOR_UID;
    el.admin.hidden = !pesquisador;
    renderizarConteudos(documentosConteudo, pesquisador);
    tentarAbrirNovo();
  });

  const pararPessoa = onSnapshot(
    pessoaRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        loadingPagina?.remover();
        falharPagina('Esta pessoa não existe mais ou foi removida.');
        return;
      }

      dadosPessoa = snapshot.data();

      if (dadosPessoa.secao !== secao) {
        loadingPagina?.remover();
        falharPagina('A seção informada não corresponde a esta pessoa.');
        return;
      }

      document.title = `${dadosPessoa.nome || 'Publicação'} | Entre Tempos`;
      el.nome.textContent = dadosPessoa.nome || 'Sem nome';
      el.descricao.textContent = dadosPessoa.descricao || '';
      el.foto.src = otimizarImagemCloudinary(dadosPessoa.fotoUrl || '/img/amp.png', 700, 900);
      el.foto.alt = dadosPessoa.nome ? `Foto de ${dadosPessoa.nome}` : 'Foto do participante';

      document.body.classList.add('et-pessoa-carregada');
      el.mensagem.textContent = '';
      pessoaCarregada = true;
      tentarFecharLoading();
      tentarAbrirNovo();
    },
    (erro) => {
      console.error('[autorais] Erro ao carregar pessoa:', erro);
      loadingPagina?.remover();
      falharPagina('Não foi possível carregar esta página agora.');
    }
  );

  const pararConteudos = onSnapshot(
    conteudosRef,
    (snapshot) => {
      documentosConteudo = snapshot.docs.sort(
        (a, b) => obterMillis(a.data().criadoEm) - obterMillis(b.data().criadoEm)
      );

      renderizarConteudos(documentosConteudo, pesquisador);
      conteudosCarregados = true;
      tentarFecharLoading();
    },
    (erro) => {
      console.error('[autorais] Erro ao carregar conteúdos:', erro);
      loadingPagina?.remover();
      el.conteudos.replaceChildren(criarAviso('Não foi possível carregar os conteúdos.'));
    }
  );

  el.btnAdicionar.addEventListener('click', () => {
    if (!pesquisador || !dadosPessoa) return;
    abrirModalConteudo(dadosPessoa);
  });

  el.btnEditar.addEventListener('click', () => {
    if (!pesquisador || !dadosPessoa) return;

    if (tipoSecao === 'poemas') {
      abrirModalEditarPoetaCompleto(
        dadosPessoa,
        pessoaRef,
        documentosConteudo
      );
      return;
    }

    abrirModalEditarPessoa(dadosPessoa, pessoaRef);
  });

  el.btnExcluir.addEventListener('click', async () => {
    if (!pesquisador || !dadosPessoa) return;

    const nomePessoa = dadosPessoa.nome || 'esta pessoa';
    const confirmar = window.confirm(
      `Remover ${nomePessoa} e todos os conteúdos cadastrados pelo sistema?`
    );

    if (!confirmar) return;

    el.btnExcluir.disabled = true;

    try {
      const snapshot = await getDocs(conteudosRef);

      for (const item of snapshot.docs) {
        await deleteDoc(item.ref);
      }

      await deleteDoc(pessoaRef);
      location.replace(config.voltar);
    } catch (erro) {
      console.error('[autorais] Erro ao remover pessoa:', erro);
      alert('Não foi possível remover agora. Confira sua conexão e as permissões do Firebase.');
      el.btnExcluir.disabled = false;
    }
  });

  function tentarAbrirNovo() {
    if (!novo || abriuNovo || !pesquisador || !dadosPessoa) return;

    abriuNovo = true;

    history.replaceState(
      {},
      '',
      `/topicos/autorais/pessoa.html?secao=${encodeURIComponent(secao)}&id=${encodeURIComponent(pessoaId)}`
    );

    setTimeout(() => abrirModalConteudo(dadosPessoa), 120);
  }

  window.addEventListener(
    'beforeunload',
    () => {
      pararPessoa?.();
      pararConteudos?.();
    },
    { once: true }
  );
}

function renderizarConteudos(docs, pesquisador) {
  if (!docs.length) {
    el.conteudos.replaceChildren(
      criarAviso('Ainda não há conteúdo publicado por esta pessoa.')
    );
    return;
  }

  const fragmento = document.createDocumentFragment();

  docs.forEach((item) => {
    fragmento.appendChild(criarConteudo(item.id, item.data(), pesquisador));
  });

  el.conteudos.replaceChildren(fragmento);
}

function criarConteudo(id, dados, pesquisador) {
  const artigo = document.createElement('article');
  artigo.className = `et-conteudo et-conteudo--${secao}`;
  artigo.dataset.conteudoId = id;

  const cabecalho = document.createElement('div');
  cabecalho.className = 'et-conteudo__cabecalho';

  const titulos = document.createElement('div');

  const titulo = document.createElement('h3');
  titulo.textContent = dados.titulo || tituloPadrao();

  const autor = document.createElement('p');
  autor.className = 'et-conteudo__autor';
  autor.textContent = dados.autor ? `por ${dados.autor}` : '';

  titulos.append(titulo, autor);
  cabecalho.appendChild(titulos);

  if (pesquisador) {
    const acoes = document.createElement('div');
    acoes.className = 'et-conteudo__acoes';

    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.className = 'et-mini-btn et-mini-btn--perigo';
    excluir.textContent = 'Remover';

    excluir.addEventListener('click', async () => {
      if (!confirm(`Remover “${dados.titulo || tituloPadrao()}”?`)) return;

      excluir.disabled = true;

      try {
        await deleteDoc(
          doc(db, 'participantesAutorais', pessoaId, 'conteudos', id)
        );
      } catch (erro) {
        console.error('[autorais] Erro ao remover conteúdo:', erro);
        alert('Não foi possível remover este conteúdo.');
        excluir.disabled = false;
      }
    });

    acoes.appendChild(excluir);
    cabecalho.appendChild(acoes);
  }

  artigo.appendChild(cabecalho);

  if (tipoSecao === 'poemas') {
    const texto = document.createElement('div');
    texto.className = 'et-poema-texto';
    texto.textContent = dados.texto || '';
    artigo.appendChild(texto);
  }

  if (tipoSecao === 'desenhos') {
    if (secao === 'desenhos-conhecidos' && dados.descricao) {
      artigo.appendChild(paragrafoDescricao(dados.descricao));
    }

    if (dados.imagemUrl) {
      const figura = document.createElement('figure');
      figura.className = 'et-midia-imagem';

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = otimizarImagemCloudinary(dados.imagemUrl, 1100, 1400);
      img.alt = dados.titulo || 'Desenho autoral';

      figura.appendChild(img);
      artigo.appendChild(figura);
    }
  }

  if (tipoSecao === 'musica') {
    if (dados.videoUrl) {
      const video = document.createElement('video');
      video.className = 'et-midia-video';
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';

      const source = document.createElement('source');
      source.src = normalizarVideoCloudinary(dados.videoUrl);
      source.type = 'video/mp4';

      video.appendChild(source);
      artigo.appendChild(video);
    }

    if (dados.descricao) {
      artigo.appendChild(paragrafoDescricao(dados.descricao));
    }
  }

  if (tipoSecao === 'curiosidades') {
    if (dados.descricao) {
      artigo.appendChild(paragrafoDescricao(dados.descricao));
    }

    const midias = document.createElement('div');
    midias.className = 'et-curiosidade-midias';

    if (dados.imagemUrl) {
      const figura = document.createElement('figure');
      figura.className = 'et-midia-imagem';

      if (dados.imagemRetratoMenor === true) {
        figura.classList.add('et-midia-retrato-menor');
      }

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = otimizarImagemCloudinary(
        dados.imagemUrl,
        dados.imagemRetratoMenor === true ? 720 : 1400,
        dados.imagemRetratoMenor === true ? 960 : 1400
      );
      img.alt = dados.titulo || 'Imagem da curiosidade';

      figura.appendChild(img);
      midias.appendChild(figura);
    }

    if (dados.videoUrl) {
      const video = document.createElement('video');
      video.className = 'et-midia-video';

      if (dados.videoRetratoMenor === true) {
        video.classList.add('et-midia-retrato-menor');
      }

      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';

      const source = document.createElement('source');
      source.src = normalizarVideoCloudinary(dados.videoUrl);
      source.type = 'video/mp4';

      video.appendChild(source);
      midias.appendChild(video);
    }

    if (midias.childElementCount) {
      artigo.appendChild(midias);
    }
  }

  return artigo;
}

function abrirModalConteudo(dadosPessoa) {
  const modal = document.createElement('div');
  modal.className = 'et-modal';

  modal.innerHTML = `
    <div class="et-modal__caixa" role="dialog" aria-modal="true" aria-labelledby="et-conteudo-modal-titulo">
      <button type="button" class="et-modal__fechar" data-fechar aria-label="Fechar">×</button>
      <p class="et-modal__kicker">${escapeHtml(config.rotulo)}</p>
      <h2 class="et-modal__titulo" id="et-conteudo-modal-titulo">${escapeHtml(config.adicionar)}</h2>

      <form data-form novalidate>
        ${camposConteudoHtml(dadosPessoa)}

        <p class="et-progresso" data-msg role="status" aria-live="polite"></p>
        <div class="et-progress-bar" data-barra><span></span></div>

        <div class="et-modal__acoes">
          <button type="button" class="et-btn et-btn--secundario" data-cancelar>Cancelar</button>
          <button type="submit" class="et-btn et-btn--principal" data-salvar>Publicar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.classList.add('et-modal-aberto');

  const form = modal.querySelector('[data-form]');
  const msg = modal.querySelector('[data-msg]');
  const barra = modal.querySelector('[data-barra]');
  const barraSpan = barra.querySelector('span');
  const salvar = modal.querySelector('[data-salvar]');

  let salvando = false;

  const fechar = () => {
    if (salvando) return;

    modal.remove();
    document.body.classList.remove('et-modal-aberto');
  };

  modal.querySelector('[data-fechar]').addEventListener('click', fechar);
  modal.querySelector('[data-cancelar]').addEventListener('click', fechar);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) fechar();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (salvando) return;

    if (auth.currentUser?.uid !== PESQUISADOR_UID) {
      erroMsg(msg, 'Sua sessão de pesquisador não está ativa.');
      return;
    }

    const validacao = validarConteudo(form);

    if (!validacao.ok) {
      erroMsg(msg, validacao.mensagem);
      return;
    }

    salvando = true;
    salvar.disabled = true;
    salvar.textContent = 'Publicando...';
    msg.classList.remove('is-erro');

    const conteudoRef = doc(
      collection(db, 'participantesAutorais', pessoaId, 'conteudos')
    );

    const dados = {
      tipo:
        tipoSecao === 'poemas' ? 'poema' :
        tipoSecao === 'desenhos' ? 'desenho' :
        tipoSecao === 'musica' ? 'musica' :
        'curiosidade',
      titulo: form.elements.titulo?.value.trim() || '',
      autor: form.elements.autor?.value.trim() || '',
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
      criadoPor: auth.currentUser.uid
    };

    try {
      if (tipoSecao === 'poemas') {
        dados.tipo = 'poema';
        dados.texto = form.elements.texto.value.trim();
      }

      if (tipoSecao === 'desenhos') {
        dados.tipo = 'desenho';

        if (secao === 'desenhos-conhecidos') {
          dados.descricao = form.elements.descricao?.value.trim() || '';
        }

        const arquivo = form.elements.imagem.files?.[0] || null;

        if (arquivo) {
          barra.classList.add('is-visible');
          barraSpan.style.width = '0%';

          const upload = await enviarComMensagem(
            arquivo,
            msg,
            barraSpan,
            'Enviando desenho'
          );

          dados.imagemUrl = upload.url;
          dados.imagemPublicId = upload.publicId;
          dados.imagemResourceType = upload.resourceType;
        }
      }

      if (tipoSecao === 'musica') {
        dados.tipo = 'musica';
        dados.descricao = form.elements.descricao.value.trim();

        const arquivo = form.elements.video.files?.[0] || null;

        if (arquivo) {
          barra.classList.add('is-visible');
          barraSpan.style.width = '0%';

          const upload = await enviarComMensagem(
            arquivo,
            msg,
            barraSpan,
            'Enviando vídeo'
          );

          dados.videoUrl = upload.url;
          dados.videoPublicId = upload.publicId;
          dados.videoResourceType = upload.resourceType;
        }
      }

      if (tipoSecao === 'curiosidades') {
        dados.tipo = 'curiosidade';
        dados.descricao = form.elements.descricao.value.trim();
        dados.imagemRetratoMenor = form.elements.imagemRetratoMenor?.checked === true;
        dados.videoRetratoMenor = form.elements.videoRetratoMenor?.checked === true;

        const imagem = form.elements.imagem.files?.[0] || null;
        const video = form.elements.video.files?.[0] || null;

        if (imagem) {
          barra.classList.add('is-visible');
          barraSpan.style.width = '0%';

          const uploadImagem = await enviarComMensagem(
            imagem,
            msg,
            barraSpan,
            'Enviando imagem'
          );

          dados.imagemUrl = uploadImagem.url;
          dados.imagemPublicId = uploadImagem.publicId;
          dados.imagemResourceType = uploadImagem.resourceType;
        }

        if (video) {
          barra.classList.add('is-visible');
          barraSpan.style.width = '0%';

          const uploadVideo = await enviarComMensagem(
            video,
            msg,
            barraSpan,
            'Enviando vídeo'
          );

          dados.videoUrl = uploadVideo.url;
          dados.videoPublicId = uploadVideo.publicId;
          dados.videoResourceType = uploadVideo.resourceType;
        }
      }

      msg.textContent = 'Salvando publicação...';
      await setDoc(conteudoRef, dados);

      salvando = false;
      fechar();
    } catch (erro) {
      console.error('[autorais] Falha ao publicar conteúdo:', erro);

      erroMsg(msg, mensagemErroUpload(erro));
      barra.classList.remove('is-visible');
      barraSpan.style.width = '0%';

      salvando = false;
      salvar.disabled = false;
      salvar.textContent = 'Publicar';
    }
  });

  requestAnimationFrame(() => {
    form.querySelector('input, textarea')?.focus();
  });
}

function abrirModalEditarPoetaCompleto(dadosPessoa, pessoaRef, documentosConteudo) {
  const modal = document.createElement('div');
  modal.className = 'et-modal et-modal--poeta';

  const poemasHtml = documentosConteudo.map((item, indice) => {
    const dados = item.data();

    return `
      <fieldset class="et-poeta-poema" data-poema-id="${escapeHtml(item.id)}">
        <legend>Poema ${indice + 1}</legend>

        <div class="et-campo">
          <label for="et-poema-titulo-${indice}">Título</label>
          <input
            id="et-poema-titulo-${indice}"
            name="titulo-${indice}"
            type="text"
            maxlength="160"
            value="${escapeHtml(dados.titulo || '')}"
          >
        </div>

        <div class="et-campo">
          <label for="et-poema-autor-${indice}">Autor / assinatura</label>
          <input
            id="et-poema-autor-${indice}"
            name="autor-${indice}"
            type="text"
            maxlength="160"
            value="${escapeHtml(dados.autor || dadosPessoa.nome || '')}"
          >
        </div>

        <div class="et-campo">
          <label for="et-poema-texto-${indice}">Texto do poema</label>
          <textarea
            id="et-poema-texto-${indice}"
            name="texto-${indice}"
            rows="11"
            maxlength="20000"
          >${escapeHtml(dados.texto || '')}</textarea>
        </div>
      </fieldset>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="et-modal__caixa et-modal__caixa--poeta" role="dialog" aria-modal="true" aria-labelledby="et-editar-poeta-titulo">
      <button type="button" class="et-modal__fechar" data-fechar aria-label="Fechar">×</button>
      <p class="et-modal__kicker">Gerenciar poeta</p>
      <h2 class="et-modal__titulo" id="et-editar-poeta-titulo">Editar tudo</h2>

      <form data-form novalidate>
        <div class="et-campo">
          <label for="et-editar-poeta-nome">Nome</label>
          <input
            id="et-editar-poeta-nome"
            name="nome"
            type="text"
            maxlength="120"
            value="${escapeHtml(dadosPessoa.nome || '')}"
          >
        </div>

        <div class="et-campo">
          <label for="et-editar-poeta-descricao">Descrição</label>
          <textarea
            id="et-editar-poeta-descricao"
            name="descricao"
            rows="8"
            maxlength="5000"
          >${escapeHtml(dadosPessoa.descricao || '')}</textarea>
        </div>

        <div class="et-campo et-arquivo">
          <label for="et-editar-poeta-foto">Trocar imagem <small>(opcional)</small></label>
          <input id="et-editar-poeta-foto" name="foto" type="file" accept="image/*">
        </div>

        <div class="et-poeta-poemas-editor">
          <h3>Poemas</h3>
          ${poemasHtml || '<p class="et-estado-vazio">Ainda não há poemas cadastrados.</p>'}
        </div>

        <p class="et-progresso" data-msg role="status" aria-live="polite"></p>
        <div class="et-progress-bar" data-barra><span></span></div>

        <div class="et-modal__acoes">
          <button type="button" class="et-btn et-btn--secundario" data-cancelar>Cancelar</button>
          <button type="submit" class="et-btn et-btn--principal" data-salvar>Salvar tudo</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.classList.add('et-modal-aberto');

  const form = modal.querySelector('[data-form]');
  const msg = modal.querySelector('[data-msg]');
  const barra = modal.querySelector('[data-barra]');
  const barraSpan = barra.querySelector('span');
  const salvar = modal.querySelector('[data-salvar]');

  let salvando = false;

  const fechar = () => {
    if (salvando) return;
    modal.remove();
    document.body.classList.remove('et-modal-aberto');
  };

  modal.querySelector('[data-fechar]').addEventListener('click', fechar);
  modal.querySelector('[data-cancelar]').addEventListener('click', fechar);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) fechar();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (salvando) return;

    if (auth.currentUser?.uid !== PESQUISADOR_UID) {
      erroMsg(msg, 'Sua sessão de pesquisador não está ativa.');
      return;
    }

    const novaFoto = form.elements.foto.files?.[0] || null;

    if (
      novaFoto &&
      (!novaFoto.type.startsWith('image/') || novaFoto.size > 10 * 1024 * 1024)
    ) {
      erroMsg(msg, 'A nova foto precisa ser uma imagem de até 10 MB.');
      return;
    }

    salvando = true;
    salvar.disabled = true;
    salvar.textContent = 'Salvando...';
    msg.classList.remove('is-erro');

    const atualizacaoPessoa = {
      nome: form.elements.nome.value.trim(),
      descricao: form.elements.descricao.value.trim(),
      atualizadoEm: serverTimestamp()
    };

    try {
      if (novaFoto) {
        barra.classList.add('is-visible');
        barraSpan.style.width = '0%';

        const upload = await enviarComMensagem(
          novaFoto,
          msg,
          barraSpan,
          'Enviando nova foto'
        );

        atualizacaoPessoa.fotoUrl = upload.url;
        atualizacaoPessoa.fotoPublicId = upload.publicId;
        atualizacaoPessoa.fotoResourceType = upload.resourceType;
      } else {
        msg.textContent = 'Salvando perfil e poemas...';
      }

      await updateDoc(pessoaRef, atualizacaoPessoa);

      for (let indice = 0; indice < documentosConteudo.length; indice += 1) {
        const item = documentosConteudo[indice];

        await updateDoc(
          doc(db, 'participantesAutorais', pessoaId, 'conteudos', item.id),
          {
            titulo: form.elements[`titulo-${indice}`]?.value.trim() || '',
            autor: form.elements[`autor-${indice}`]?.value.trim() || '',
            texto: form.elements[`texto-${indice}`]?.value.trim() || '',
            atualizadoEm: serverTimestamp()
          }
        );
      }

      salvando = false;
      fechar();
    } catch (erro) {
      console.error('[autorais] Falha ao editar poeta:', erro);
      erroMsg(msg, mensagemErroUpload(erro));

      barra.classList.remove('is-visible');
      barraSpan.style.width = '0%';

      salvando = false;
      salvar.disabled = false;
      salvar.textContent = 'Salvar tudo';
    }
  });

  requestAnimationFrame(() => form.elements.nome?.focus());
}

function abrirModalEditarPessoa(dadosPessoa, pessoaRef) {
  const modal = document.createElement('div');
  modal.className = 'et-modal';

  modal.innerHTML = `
    <div class="et-modal__caixa" role="dialog" aria-modal="true" aria-labelledby="et-editar-pessoa-titulo">
      <button type="button" class="et-modal__fechar" data-fechar aria-label="Fechar">×</button>
      <p class="et-modal__kicker">Gerenciar pessoa</p>
      <h2 class="et-modal__titulo" id="et-editar-pessoa-titulo">Editar perfil</h2>

      <form data-form novalidate>
        <div class="et-campo">
          <label for="et-editar-nome">Nome <small>(opcional)</small></label>
          <input id="et-editar-nome" name="nome" type="text" maxlength="120">
        </div>

        <div class="et-campo">
          <label for="et-editar-descricao">Descrição <small>(opcional)</small></label>
          <textarea id="et-editar-descricao" name="descricao" maxlength="1200"></textarea>
        </div>

        <div class="et-campo et-arquivo">
          <label for="et-editar-foto">Trocar imagem <small>(opcional)</small></label>
          <input id="et-editar-foto" name="foto" type="file" accept="image/*">
        </div>

        <p class="et-progresso" data-msg role="status" aria-live="polite"></p>
        <div class="et-progress-bar" data-barra><span></span></div>

        <div class="et-modal__acoes">
          <button type="button" class="et-btn et-btn--secundario" data-cancelar>Cancelar</button>
          <button type="submit" class="et-btn et-btn--principal" data-salvar>Salvar alterações</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.classList.add('et-modal-aberto');

  const form = modal.querySelector('[data-form]');
  form.elements.nome.value = dadosPessoa.nome || '';
  form.elements.descricao.value = dadosPessoa.descricao || '';

  const msg = modal.querySelector('[data-msg]');
  const barra = modal.querySelector('[data-barra]');
  const barraSpan = barra.querySelector('span');
  const salvar = modal.querySelector('[data-salvar]');

  let salvando = false;

  const fechar = () => {
    if (salvando) return;

    modal.remove();
    document.body.classList.remove('et-modal-aberto');
  };

  modal.querySelector('[data-fechar]').addEventListener('click', fechar);
  modal.querySelector('[data-cancelar]').addEventListener('click', fechar);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) fechar();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (salvando) return;

    const nome = form.elements.nome.value.trim();
    const descricao = form.elements.descricao.value.trim();
    const novaFoto = form.elements.foto.files?.[0] || null;

    if (
      novaFoto &&
      (!novaFoto.type.startsWith('image/') ||
        novaFoto.size > 10 * 1024 * 1024)
    ) {
      erroMsg(msg, 'A nova foto precisa ser uma imagem de até 10 MB.');
      return;
    }

    salvando = true;
    salvar.disabled = true;
    salvar.textContent = 'Salvando...';

    const atualizacao = {
      nome,
      descricao,
      atualizadoEm: serverTimestamp()
    };

    try {
      if (novaFoto) {
        barra.classList.add('is-visible');
        barraSpan.style.width = '0%';

        const upload = await enviarComMensagem(
          novaFoto,
          msg,
          barraSpan,
          'Enviando nova foto'
        );

        atualizacao.fotoUrl = upload.url;
        atualizacao.fotoPublicId = upload.publicId;
        atualizacao.fotoResourceType = upload.resourceType;
      } else {
        msg.textContent = 'Salvando alterações...';
      }

      await updateDoc(pessoaRef, atualizacao);

      salvando = false;
      fechar();
    } catch (erro) {
      console.error('[autorais] Falha ao editar pessoa:', erro);

      erroMsg(msg, mensagemErroUpload(erro));

      barra.classList.remove('is-visible');
      barraSpan.style.width = '0%';

      salvando = false;
      salvar.disabled = false;
      salvar.textContent = 'Salvar alterações';
    }
  });

  requestAnimationFrame(() => form.elements.nome.focus());
}

function criarLoadingPagina() {
  const overlay = document.createElement('div');
  overlay.className = 'et-loading-pagina-dinamica';
  overlay.innerHTML = `
    <div class="et-loading-pagina-dinamica__papel" role="status" aria-live="polite">
      <img src="/img/amp.png" alt="" aria-hidden="true">
      <strong>Entre Tempos</strong>
      <span>carregando o tempo...</span>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .et-loading-pagina-dinamica {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: grid;
      place-items: center;
      padding: 24px;
      background: #f2e8d5;
      background-image: radial-gradient(rgba(104,75,45,.05) 1px, transparent 1px);
      background-size: 5px 5px;
      opacity: 1;
      transition: opacity .28s ease, visibility .28s ease;
    }

    .et-loading-pagina-dinamica.is-saindo {
      opacity: 0;
      visibility: hidden;
    }

    .et-loading-pagina-dinamica__papel {
      min-width: min(88vw, 320px);
      padding: 30px 28px;
      text-align: center;
      color: #3e3228;
      background: #fffaf0;
      border-left: 5px solid #9b3e3e;
      box-shadow: 8px 12px 28px rgba(50,30,15,.18);
      font-family: 'Special Elite', serif;
    }

    .et-loading-pagina-dinamica__papel img {
      display: block;
      width: clamp(58px, 12vw, 82px);
      height: auto;
      margin: 0 auto 16px;
      object-fit: contain;
      filter: drop-shadow(0 7px 8px rgba(61,42,27,.16));
      animation: etLoadingPaginaAmp 1.35s ease-in-out infinite alternate;
    }

    .et-loading-pagina-dinamica__papel strong,
    .et-loading-pagina-dinamica__papel span {
      display: block;
    }

    .et-loading-pagina-dinamica__papel strong {
      margin-bottom: 8px;
      font-size: 22px;
      letter-spacing: 2px;
    }

    .et-loading-pagina-dinamica__papel span {
      color: #7a6a50;
      font-size: 13px;
      letter-spacing: 1px;
    }

    @keyframes etLoadingPaginaAmp {
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
    }
  };
}

function camposConteudoHtml(dadosPessoa) {
  const nome = escapeHtml(dadosPessoa.nome || '');

  const comuns = `
    <div class="et-campo">
      <label for="et-conteudo-titulo">Nome / título <small>(opcional)</small></label>
      <input id="et-conteudo-titulo" name="titulo" type="text" maxlength="160">
    </div>

    <div class="et-campo">
      <label for="et-conteudo-autor">Quem criou / escreveu <small>(opcional)</small></label>
      <input id="et-conteudo-autor" name="autor" type="text" maxlength="160" value="${nome}">
    </div>
  `;

  if (tipoSecao === 'poemas') {
    return `${comuns}
      <div class="et-campo">
        <label for="et-conteudo-texto">Poema <small>(opcional)</small></label>
        <textarea id="et-conteudo-texto" name="texto" rows="12" maxlength="20000"></textarea>
      </div>`;
  }

  if (tipoSecao === 'desenhos') {
    const descricaoObra = secao === 'desenhos-conhecidos'
      ? `
        <div class="et-campo">
          <label for="et-conteudo-descricao">Descrição da obra <small>(opcional)</small></label>
          <textarea id="et-conteudo-descricao" name="descricao" rows="5" maxlength="4000"></textarea>
        </div>
      `
      : '';

    return `${comuns}
      ${descricaoObra}
      <div class="et-campo et-arquivo">
        <label for="et-conteudo-imagem">Imagem da obra <small>(opcional)</small></label>
        <input id="et-conteudo-imagem" name="imagem" type="file" accept="image/*">
      </div>`;
  }

  if (tipoSecao === 'musica') {
    return `
      <div class="et-campo">
        <label for="et-conteudo-titulo">Título da música <small>(opcional)</small></label>
        <input id="et-conteudo-titulo" name="titulo" type="text" maxlength="160">
      </div>

      <div class="et-campo">
        <label for="et-conteudo-descricao">Descrição da música <small>(opcional)</small></label>
        <textarea id="et-conteudo-descricao" name="descricao" rows="6" maxlength="3500"></textarea>
      </div>

      <div class="et-campo et-arquivo">
        <label for="et-conteudo-video">Vídeo da música <small>(opcional)</small></label>
        <input id="et-conteudo-video" name="video" type="file" accept="video/*">
      </div>`;
  }

  return `${comuns}
    <div class="et-campo">
      <label for="et-conteudo-descricao">Texto / descrição da curiosidade <small>(opcional)</small></label>
      <textarea id="et-conteudo-descricao" name="descricao" rows="7" maxlength="12000"></textarea>
    </div>

    <div class="et-campo et-arquivo">
      <label for="et-conteudo-imagem">Imagem <small>(opcional)</small></label>
      <input id="et-conteudo-imagem" name="imagem" type="file" accept="image/*">

      <label class="et-opcao-retrato">
        <input name="imagemRetratoMenor" type="checkbox">
        <span>
          <strong>Retrato menor</strong>
          <small>Exibir esta imagem em um quadro compacto.</small>
        </span>
      </label>
    </div>

    <div class="et-campo et-arquivo">
      <label for="et-conteudo-video">Vídeo <small>(opcional)</small></label>
      <input id="et-conteudo-video" name="video" type="file" accept="video/*">

      <label class="et-opcao-retrato">
        <input name="videoRetratoMenor" type="checkbox">
        <span>
          <strong>Retrato menor</strong>
          <small>Exibir este vídeo em tamanho compacto.</small>
        </span>
      </label>
    </div>`;
}

function validarConteudo(form) {
  if (tipoSecao === 'desenhos') {
    const imagem = form.elements.imagem.files?.[0] || null;

    if (imagem) {
      const erro = validarImagem(imagem);
      if (erro) return { ok: false, mensagem: erro };
    }
  }

  if (tipoSecao === 'musica') {
    const video = form.elements.video.files?.[0] || null;

    if (video) {
      const erro = validarVideo(video);
      if (erro) return { ok: false, mensagem: erro };
    }
  }

  if (tipoSecao === 'curiosidades') {
    const imagem = form.elements.imagem.files?.[0] || null;
    const video = form.elements.video.files?.[0] || null;

    if (imagem) {
      const erro = validarImagem(imagem);
      if (erro) return { ok: false, mensagem: erro };
    }

    if (video) {
      const erro = validarVideo(video);
      if (erro) return { ok: false, mensagem: erro };
    }
  }

  return { ok: true };
}

function validarImagem(arquivo) {
  if (!arquivo.type.startsWith('image/')) {
    return 'Escolha uma imagem válida.';
  }

  if (arquivo.size > 10 * 1024 * 1024) {
    return 'A imagem precisa ter no máximo 10 MB.';
  }

  return '';
}

function validarVideo(arquivo) {
  if (!arquivo.type.startsWith('video/')) {
    return 'Escolha um vídeo válido.';
  }

  if (arquivo.size > 100 * 1024 * 1024) {
    return 'O vídeo precisa ter no máximo 100 MB.';
  }

  return '';
}

function enviarComMensagem(arquivo, msg, barra, rotulo) {
  return enviarArquivo(arquivo, (percentual) => {
    barra.style.width = `${percentual}%`;
    msg.textContent = `${rotulo}... ${Math.round(percentual)}%`;
  });
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

function tituloPadrao() {
  if (tipoSecao === 'poemas') return 'Poema';
  if (tipoSecao === 'desenhos') return secao === 'desenhos-conhecidos' ? 'Obra' : 'Desenho';
  if (tipoSecao === 'musica') return 'Música';
  return 'Curiosidade';
}

function paragrafoDescricao(texto) {
  const p = document.createElement('p');
  p.className = 'et-conteudo__descricao';
  p.textContent = texto;
  return p;
}

function criarAviso(texto) {
  const p = document.createElement('p');
  p.className = 'et-pagina-vazio';
  p.textContent = texto;
  return p;
}

function falharPagina(texto) {
  if (el?.mensagem) el.mensagem.textContent = texto;
  if (el?.conteudos) el.conteudos.replaceChildren();
}

function obterMillis(timestamp) {
  try {
    return timestamp?.toMillis?.() || 0;
  } catch {
    return 0;
  }
}

function erroMsg(elm, texto) {
  elm.textContent = texto;
  elm.classList.add('is-erro');
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

  return 'Não foi possível concluir agora. Tente novamente.';
}

function escapeHtml(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
