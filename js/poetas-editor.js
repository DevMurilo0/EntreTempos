import { auth, db } from '/js/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const PESQUISADOR_UID = 'QuiQMjtXjOWNW2LCrot86rsHh0F2';
const RAIZ_EDICOES = '_poetas-estaticos';
const CLOUDINARY_CLOUD_NAME = 'uaisf2vc';
const CLOUDINARY_UPLOAD_PRESET = 'entre_tempos_upload';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

const pessoaSection = document.querySelector('.pessoa-section');
const pessoaInfo = document.querySelector('.pessoa-info');
const nomeEl = document.querySelector('.pessoa-nome');
const fotoEl = document.querySelector('.foto-pessoa');
const contadorEl = document.querySelector('.contador-poemas');
const gradeEl = document.querySelector('.grade-envelopes');
const areaFolha = document.querySelector('.area-folha');

if (!document.querySelector('link[href="/css/autorais-admin.css"]')) {
  const estilosAdmin = document.createElement('link');
  estilosAdmin.rel = 'stylesheet';
  estilosAdmin.href = '/css/autorais-admin.css';
  document.head.appendChild(estilosAdmin);
}

if (!pessoaSection || !pessoaInfo || !nomeEl || !gradeEl || !areaFolha) {
  // Esta página não segue o layout antigo de poetas.
} else {
  iniciarEditorPoeta();
}

function iniciarEditorPoeta() {
  const caminho = location.pathname.split('/').filter(Boolean);
  const slug = document.body.dataset.etPersonId || caminho.at(-2) || 'poeta';
  const secao = document.body.dataset.etSecao || (location.pathname.includes('/conhecidos/')
    ? 'poemas-conhecidos'
    : 'poemas');
  const editorId = `${secao}--${slug}`;
  const voltarUrl = secao === 'poemas-conhecidos'
    ? '/topicos/poemas/conhecidos/conhecidos.html'
    : '/topicos/poemas/autorais/autorais/autorais.html';

  const baseOriginal = lerEstadoDaPagina();
  const ref = doc(db, 'participantesAutorais', RAIZ_EDICOES, 'conteudos', editorId);

  let dadosAtuais = baseOriginal;
  let pesquisador = false;

  const painel = criarPainelAdmin();
  pessoaSection.insertAdjacentElement('afterend', painel);

  const btnAdicionar = painel.querySelector('[data-adicionar-poema]');
  const btnEditar = painel.querySelector('[data-editar-tudo]');
  const btnRemover = painel.querySelector('[data-remover-pessoa]');

  onAuthStateChanged(auth, (usuario) => {
    pesquisador = usuario?.uid === PESQUISADOR_UID;
    painel.hidden = !pesquisador;
  });

  onSnapshot(
    ref,
    (snapshot) => {
      if (snapshot.exists()) {
        const dadosSnapshot = snapshot.data();

        if (dadosSnapshot.removido === true) {
          location.replace(voltarUrl);
          return;
        }

        dadosAtuais = normalizarDados(dadosSnapshot, baseOriginal);
        aplicarEstado(dadosAtuais);
      } else {
        dadosAtuais = baseOriginal;
      }
    },
    (erro) => {
      console.error('[poetas-editor] Erro ao carregar edições:', erro);
    }
  );

  btnAdicionar.addEventListener('click', () => {
    if (!pesquisador) return;
    abrirModalAdicionarPoema(dadosAtuais, ref, secao, slug);
  });

  btnEditar.addEventListener('click', () => {
    if (!pesquisador) return;
    abrirModalEdicao(dadosAtuais, ref, secao, slug);
  });

  btnRemover.addEventListener('click', async () => {
    if (!pesquisador) return;

    const confirmar = window.confirm(
      `Remover ${dadosAtuais.nome || 'esta pessoa'} da revista?`
    );

    if (!confirmar) return;

    btnRemover.disabled = true;
    btnRemover.textContent = 'Removendo...';

    try {
      await setDoc(
        ref,
        {
          tipo: 'edicao-poeta-estatico',
          secao,
          slug,
          removido: true,
          atualizadoEm: serverTimestamp(),
          atualizadoPor: auth.currentUser.uid
        },
        { merge: true }
      );

      location.replace(voltarUrl);
    } catch (erro) {
      console.error('[poetas-editor] Erro ao remover poeta:', erro);
      alert('Não foi possível remover esta pessoa agora.');
      btnRemover.disabled = false;
      btnRemover.textContent = 'Remover pessoa';
    }
  });
}

function criarPainelAdmin() {
  const painel = document.createElement('section');
  painel.className = 'et-poeta-admin';
  painel.hidden = true;
  painel.setAttribute('aria-label', 'Ferramentas dos pesquisadores');

  painel.innerHTML = `
    <span class="et-poeta-admin__rotulo">Gerenciar publicação</span>
    <div class="et-poeta-admin__acoes">
      <button type="button" class="et-btn et-btn--principal" data-adicionar-poema>+ Adicionar poema</button>
      <button type="button" class="et-btn et-btn--secundario" data-editar-tudo>Editar tudo</button>
      <button type="button" class="et-btn et-btn--perigo" data-remover-pessoa>Remover pessoa</button>
    </div>
  `;

  return painel;
}

function lerEstadoDaPagina() {
  const descricao = [...pessoaInfo.querySelectorAll('.pessoa-bio')]
    .map((p) => p.textContent.trim())
    .filter(Boolean)
    .join('\n\n');

  const poemas = [...areaFolha.querySelectorAll('.poema')].map((artigo, indice) => {
    const envelope = gradeEl.querySelector(`[data-alvo="${artigo.id}"]`);
    const titulo =
      artigo.querySelector('.poema-titulo')?.textContent.trim() ||
      envelope?.querySelector('.env-titulo')?.textContent.trim() ||
      `Poema ${indice + 1}`;

    const id = artigo.dataset.etContentId || criarSlug(titulo);
    artigo.dataset.etContentId = id;

    return {
      id,
      titulo,
      autor: artigo.querySelector('.poema-data')?.textContent.trim() || nomeEl.textContent.trim(),
      texto: extrairTextoPoema(artigo.querySelector('.poema-texto'))
    };
  });

  return {
    nome: nomeEl.textContent.trim(),
    descricao,
    fotoUrl: fotoEl?.getAttribute('src') || '',
    instagram: '',
    poemas
  };
}

function normalizarDados(dados, fallback) {
  return {
    nome: typeof dados.nome === 'string' ? dados.nome : fallback.nome,
    descricao: typeof dados.descricao === 'string' ? dados.descricao : fallback.descricao,
    fotoUrl: typeof dados.fotoUrl === 'string' ? dados.fotoUrl : fallback.fotoUrl,
    instagram: typeof dados.instagram === 'string' ? dados.instagram : fallback.instagram,
    poemas: Array.isArray(dados.poemas)
      ? dados.poemas.map((poema, i) => ({
          id: typeof poema?.id === 'string'
            ? poema.id
            : fallback.poemas[i]?.id || criarSlug(poema?.titulo || `poema-${i + 1}`),
          titulo: typeof poema?.titulo === 'string'
            ? poema.titulo
            : fallback.poemas[i]?.titulo || `Poema ${i + 1}`,
          autor: typeof poema?.autor === 'string'
            ? poema.autor
            : fallback.poemas[i]?.autor || dados.nome || fallback.nome,
          texto: typeof poema?.texto === 'string'
            ? poema.texto
            : fallback.poemas[i]?.texto || ''
        }))
      : fallback.poemas
  };
}

function aplicarEstado(dados) {
  nomeEl.textContent = dados.nome || '';
  if (fotoEl && dados.fotoUrl) {
    fotoEl.src = dados.fotoUrl;
    fotoEl.alt = dados.nome ? `Foto de ${dados.nome}` : fotoEl.alt;
  }
  aplicarInstagram(dados.instagram);

  [...pessoaInfo.querySelectorAll('.pessoa-bio')].forEach((p) => p.remove());

  const referencia = contadorEl;
  separarParagrafos(dados.descricao).forEach((texto) => {
    const p = document.createElement('p');
    p.className = 'pessoa-bio';
    p.textContent = texto;
    pessoaInfo.insertBefore(p, referencia || null);
  });

  garantirEstruturaPoemas(dados.poemas);

  const artigos = [...areaFolha.querySelectorAll('.poema')];
  const envelopes = [...gradeEl.querySelectorAll('.envelope')];

  dados.poemas.forEach((poema, indice) => {
    const artigo = artigos[indice];
    if (!artigo) return;

    const titulo = artigo.querySelector('.poema-titulo');
    const autor = artigo.querySelector('.poema-data');
    const assinatura = artigo.querySelector('.poema-assinatura');
    const texto = artigo.querySelector('.poema-texto');
    const envelope = envelopes.find((env) => env.dataset.alvo === artigo.id);
    const envNumero = envelope?.querySelector('.env-numero');
    const envTitulo = envelope?.querySelector('.env-titulo');
    const numero = romano(indice + 1);
    artigo.dataset.etContentId = poema.id;

    const numeroPoema = artigo.querySelector('.poema-numero');
    if (numeroPoema) numeroPoema.textContent = `Poema ${numero}`;
    if (titulo) titulo.textContent = poema.titulo || `Poema ${indice + 1}`;
    if (autor) autor.textContent = poema.autor || dados.nome || '';
    if (assinatura) assinatura.textContent = poema.autor ? `— ${poema.autor}` : '';
    if (envNumero) envNumero.textContent = numero;
    if (envTitulo) envTitulo.textContent = poema.titulo || `Poema ${indice + 1}`;
    if (texto) renderizarTextoPoema(texto, poema.texto || '');
  });

  artigos.slice(dados.poemas.length).forEach((artigo) => artigo.remove());
  envelopes.slice(dados.poemas.length).forEach((envelope) => envelope.remove());

  if (contadorEl) {
    const total = dados.poemas.length;
    contadorEl.textContent = `${total} ${total === 1 ? 'poema' : 'poemas'}`;
  }

  reativarEnvelopes();
  document.title = `${dados.nome || 'Poeta'} — Poemas | Entre Tempos`;
}

function garantirEstruturaPoemas(poemas) {
  poemas.forEach((poema, indice) => {
    const id = `poema-${indice + 1}`;

    if (!gradeEl.querySelector(`[data-alvo="${id}"]`)) {
      gradeEl.appendChild(criarEnvelope(id, poema, indice));
    }

    if (!document.getElementById(id)) {
      areaFolha.appendChild(criarArtigoPoema(id, poema, indice));
    }

    const artigo = document.getElementById(id);
    if (artigo) artigo.dataset.etContentId = poema.id;
  });
}

function criarEnvelope(id, poema, indice) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'envelope';
  botao.dataset.alvo = id;

  const numero = document.createElement('span');
  numero.className = 'env-numero';
  numero.textContent = romano(indice + 1);

  const titulo = document.createElement('span');
  titulo.className = 'env-titulo';
  titulo.textContent = poema.titulo || `Poema ${indice + 1}`;

  const aba = document.createElement('span');
  aba.className = 'env-aba';

  botao.append(numero, titulo, aba);
  return botao;
}

function criarArtigoPoema(id, poema, indice) {
  const artigo = document.createElement('article');
  artigo.className = 'poema';
  artigo.id = id;

  const numero = document.createElement('p');
  numero.className = 'poema-numero';
  numero.textContent = `Poema ${romano(indice + 1)}`;

  const titulo = document.createElement('h3');
  titulo.className = 'poema-titulo';
  titulo.textContent = poema.titulo || `Poema ${indice + 1}`;

  const autor = document.createElement('p');
  autor.className = 'poema-data';
  autor.textContent = poema.autor || nomeEl.textContent.trim();

  const texto = document.createElement('div');
  texto.className = 'poema-texto';
  renderizarTextoPoema(texto, poema.texto || '');

  const assinatura = document.createElement('p');
  assinatura.className = 'poema-assinatura';
  assinatura.textContent = poema.autor ? `— ${poema.autor}` : '';

  artigo.append(numero, titulo, autor, texto, assinatura);
  return artigo;
}

function reativarEnvelopes() {
  [...gradeEl.querySelectorAll('.envelope')].forEach((envelope) => {
    const clone = envelope.cloneNode(true);
    envelope.replaceWith(clone);
    clone.addEventListener('click', () => alternarPoema(clone));
  });
}

function alternarPoema(envelope) {
  const envelopes = [...gradeEl.querySelectorAll('.envelope')];
  const poemas = [...areaFolha.querySelectorAll('.poema')];
  const alvoId = envelope.dataset.alvo;
  const jaAtivo = envelope.classList.contains('ativo');

  envelopes.forEach((item) => item.classList.remove('ativo'));

  if (jaAtivo) {
    poemas.forEach((poema) => {
      poema.classList.remove('visivel');
      poema.classList.add('saindo');
      setTimeout(() => poema.classList.remove('saindo'), 400);
    });
    areaFolha.classList.remove('aberta');
    return;
  }

  envelope.classList.add('ativo');

  const poemaAtivo = areaFolha.querySelector('.poema.visivel');
  const poemaAlvo = document.getElementById(alvoId);
  if (!poemaAlvo) return;

  if (poemaAtivo && poemaAtivo !== poemaAlvo) {
    poemaAtivo.classList.remove('visivel');
    poemaAtivo.classList.add('saindo');

    setTimeout(() => {
      poemaAtivo.classList.remove('saindo');
      poemaAlvo.classList.add('visivel');
    }, 280);
  } else {
    poemaAlvo.classList.add('visivel');
  }

  areaFolha.classList.add('aberta');
}

function abrirModalAdicionarPoema(dados, ref, secao, slug) {
  const modal = document.createElement('div');
  modal.className = 'et-modal et-modal--poeta';

  modal.innerHTML = `
    <div class="et-modal__caixa et-modal__caixa--poeta" role="dialog" aria-modal="true" aria-labelledby="et-poeta-adicionar-titulo">
      <button type="button" class="et-modal__fechar" data-fechar aria-label="Fechar">×</button>
      <p class="et-modal__kicker">Poetas</p>
      <h2 class="et-modal__titulo" id="et-poeta-adicionar-titulo">Adicionar poema</h2>

      <form data-form>
        <div class="et-campo">
          <label for="et-novo-poema-titulo">Título</label>
          <input id="et-novo-poema-titulo" name="titulo" type="text" maxlength="160">
        </div>

        <div class="et-campo">
          <label for="et-novo-poema-autor">Autor / assinatura</label>
          <input id="et-novo-poema-autor" name="autor" type="text" maxlength="160" value="${escapeHtml(dados.nome || '')}">
        </div>

        <div class="et-campo">
          <label for="et-novo-poema-texto">Texto do poema</label>
          <textarea id="et-novo-poema-texto" name="texto" rows="13" maxlength="20000"></textarea>
        </div>

        <p class="et-progresso" data-msg role="status" aria-live="polite"></p>

        <div class="et-modal__acoes">
          <button type="button" class="et-btn et-btn--secundario" data-cancelar>Cancelar</button>
          <button type="submit" class="et-btn et-btn--principal" data-salvar>Publicar poema</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.classList.add('et-modal-aberto');

  const form = modal.querySelector('[data-form]');
  const msg = modal.querySelector('[data-msg]');
  const salvar = modal.querySelector('[data-salvar]');
  let salvando = false;

  const fechar = () => {
    if (salvando) return;
    modal.remove();
    document.body.classList.remove('et-modal-aberto');
  };

  modal.querySelector('[data-fechar]').addEventListener('click', fechar);
  modal.querySelector('[data-cancelar]').addEventListener('click', fechar);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) fechar();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (salvando) return;

    if (auth.currentUser?.uid !== PESQUISADOR_UID) {
      mostrarErro(msg, 'Sua sessão de pesquisador não está ativa.');
      return;
    }

    const novoPoema = {
      id: `${criarSlug(form.elements.titulo.value.trim() || 'poema')}-${Date.now().toString(36)}`,
      titulo: form.elements.titulo.value.trim(),
      autor: form.elements.autor.value.trim(),
      texto: form.elements.texto.value.trim()
    };

    if (!novoPoema.titulo && !novoPoema.texto) {
      mostrarErro(msg, 'Preencha pelo menos o título ou o texto do poema.');
      return;
    }

    const poemas = [...dados.poemas, novoPoema];

    salvando = true;
    salvar.disabled = true;
    salvar.textContent = 'Publicando...';
    msg.classList.remove('is-erro');
    msg.textContent = 'Salvando novo poema...';

    try {
      await setDoc(
        ref,
        {
          tipo: 'edicao-poeta-estatico',
          secao,
          slug,
          removido: false,
          nome: dados.nome || '',
          descricao: dados.descricao || '',
          fotoUrl: dados.fotoUrl || '',
          instagram: dados.instagram || '',
          poemas,
          atualizadoEm: serverTimestamp(),
          atualizadoPor: auth.currentUser.uid
        },
        { merge: true }
      );

      salvando = false;
      fechar();
    } catch (erro) {
      console.error('[poetas-editor] Erro ao adicionar poema:', erro);
      mostrarErro(msg, 'Não foi possível adicionar o poema agora.');
      salvar.disabled = false;
      salvar.textContent = 'Publicar poema';
      salvando = false;
    }
  });

  requestAnimationFrame(() => form.elements.titulo.focus());
}

function abrirModalEdicao(dados, ref, secao, slug) {
  const modal = document.createElement('div');
  modal.className = 'et-modal et-modal--poeta';

  const poemasHtml = dados.poemas.map((poema, indice) => `
    <fieldset class="et-poeta-poema" data-poema="${indice}" data-poema-id="${escapeHtml(poema.id || criarSlug(poema.titulo))}">
      <legend>Poema ${indice + 1}</legend>

      <div class="et-poeta-poema__acoes">
        <button type="button" class="et-mini-btn" data-mover="cima" aria-label="Mover poema para cima">↑</button>
        <button type="button" class="et-mini-btn" data-mover="baixo" aria-label="Mover poema para baixo">↓</button>
        <button type="button" class="et-mini-btn et-mini-btn--perigo" data-remover-poema>Remover poema</button>
      </div>

      <div class="et-campo">
        <label>Título</label>
        <input name="titulo-${indice}" type="text" maxlength="160" value="${escapeHtml(poema.titulo || '')}">
      </div>

      <div class="et-campo">
        <label>Autor / assinatura</label>
        <input name="autor-${indice}" type="text" maxlength="160" value="${escapeHtml(poema.autor || '')}">
      </div>

      <div class="et-campo">
        <label>Texto do poema</label>
        <textarea name="texto-${indice}" rows="11" maxlength="20000">${escapeHtml(poema.texto || '')}</textarea>
      </div>
    </fieldset>
  `).join('');

  modal.innerHTML = `
    <div class="et-modal__caixa et-modal__caixa--poeta" role="dialog" aria-modal="true" aria-labelledby="et-poeta-editor-titulo">
      <button type="button" class="et-modal__fechar" data-fechar aria-label="Fechar">×</button>
      <p class="et-modal__kicker">Poetas</p>
      <h2 class="et-modal__titulo" id="et-poeta-editor-titulo">Editar tudo</h2>

      <form data-form>
        <div class="et-campo">
          <label for="et-poeta-nome">Nome</label>
          <input id="et-poeta-nome" name="nome" type="text" maxlength="120" value="${escapeHtml(dados.nome || '')}">
        </div>

        <div class="et-campo">
          <label for="et-poeta-descricao">Descrição</label>
          <textarea id="et-poeta-descricao" name="descricao" rows="8" maxlength="5000">${escapeHtml(dados.descricao || '')}</textarea>
        </div>

        <div class="et-campo">
          <label for="et-poeta-instagram">Instagram (opcional)</label>
          <input id="et-poeta-instagram" name="instagram" type="text" maxlength="120" value="${escapeHtml(dados.instagram || '')}" placeholder="@usuario">
        </div>

        <div class="et-campo et-arquivo">
          <label for="et-poeta-foto">Nova foto (opcional)</label>
          <input id="et-poeta-foto" name="foto" type="file" accept="image/*">
        </div>

        <div class="et-poeta-poemas-editor">
          <h3>Poemas</h3>
          ${poemasHtml}
        </div>

        <p class="et-progresso" data-msg role="status" aria-live="polite"></p>

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
  const salvar = modal.querySelector('[data-salvar]');
  let salvando = false;

  atualizarBotoesPoemas(modal);
  modal.querySelector('.et-poeta-poemas-editor').addEventListener('click', (event) => {
    const fieldset = event.target.closest('[data-poema-id]');
    if (!fieldset) return;

    if (event.target.closest('[data-remover-poema]')) {
      if (confirm('Remover este poema? O HTML original continuará preservado como fallback.')) {
        fieldset.remove();
        atualizarBotoesPoemas(modal);
      }
      return;
    }

    const mover = event.target.closest('[data-mover]')?.dataset.mover;
    if (mover === 'cima' && fieldset.previousElementSibling?.matches('fieldset')) {
      fieldset.parentNode.insertBefore(fieldset, fieldset.previousElementSibling);
    } else if (mover === 'baixo' && fieldset.nextElementSibling) {
      fieldset.parentNode.insertBefore(fieldset.nextElementSibling, fieldset);
    }
    atualizarBotoesPoemas(modal);
  });

  const fechar = () => {
    if (salvando) return;
    modal.remove();
    document.body.classList.remove('et-modal-aberto');
  };

  modal.querySelector('[data-fechar]').addEventListener('click', fechar);
  modal.querySelector('[data-cancelar]').addEventListener('click', fechar);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) fechar();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (salvando) return;

    if (auth.currentUser?.uid !== PESQUISADOR_UID) {
      mostrarErro(msg, 'Sua sessão de pesquisador não está ativa.');
      return;
    }

    const nome = form.elements.nome.value.trim();
    const descricao = form.elements.descricao.value.trim();
    const instagramResultado = normalizarInstagram(form.elements.instagram.value);
    if (!instagramResultado.ok) {
      mostrarErro(msg, instagramResultado.mensagem);
      return;
    }

    const poemas = [...form.querySelectorAll('[data-poema-id]')].map((fieldset) => {
      const indice = fieldset.dataset.poema;
      return {
        id: fieldset.dataset.poemaId,
        titulo: form.elements[`titulo-${indice}`].value.trim(),
        autor: form.elements[`autor-${indice}`].value.trim(),
        texto: form.elements[`texto-${indice}`].value.trim()
      };
    });

    salvando = true;
    salvar.disabled = true;
    salvar.textContent = 'Salvando...';
    msg.classList.remove('is-erro');
    msg.textContent = 'Salvando alterações...';

    try {
      let fotoUrl = dados.fotoUrl || '';
      const foto = form.elements.foto.files?.[0];
      if (foto) {
        msg.textContent = 'Enviando foto...';
        fotoUrl = (await enviarArquivo(foto)).url;
      }

      await setDoc(
        ref,
        {
          tipo: 'edicao-poeta-estatico',
          secao,
          slug,
          removido: false,
          nome,
          descricao,
          fotoUrl,
          instagram: instagramResultado.usuario,
          poemas,
          atualizadoEm: serverTimestamp(),
          atualizadoPor: auth.currentUser.uid
        },
        { merge: true }
      );

      salvando = false;
      fechar();
    } catch (erro) {
      console.error('[poetas-editor] Erro ao salvar:', erro);
      mostrarErro(msg, 'Não foi possível salvar agora. Confira sua conexão e tente novamente.');
      salvar.disabled = false;
      salvar.textContent = 'Salvar tudo';
      salvando = false;
    }
  });

  requestAnimationFrame(() => form.elements.nome.focus());
}

function extrairTextoPoema(container) {
  if (!container) return '';

  const clone = container.cloneNode(true);
  clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));

  const paragrafos = [...clone.querySelectorAll('p')];
  if (paragrafos.length) {
    return paragrafos
      .map((p) => normalizarQuebras(p.textContent))
      .filter(Boolean)
      .join('\n\n');
  }

  return normalizarQuebras(clone.textContent);
}

function renderizarTextoPoema(container, texto) {
  container.replaceChildren();

  const blocos = separarParagrafos(texto);
  if (!blocos.length) return;

  blocos.forEach((bloco) => {
    const p = document.createElement('p');
    const linhas = bloco.split('\n');

    linhas.forEach((linha, indice) => {
      if (indice) p.appendChild(document.createElement('br'));
      p.appendChild(document.createTextNode(linha));
    });

    container.appendChild(p);
  });
}

function separarParagrafos(texto) {
  return String(texto || '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((trecho) => trecho.trim())
    .filter(Boolean);
}

function normalizarQuebras(texto) {
  return String(texto || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function romano(numero) {
  const mapa = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];

  let valor = numero;
  let resultado = '';

  mapa.forEach(([n, simbolo]) => {
    while (valor >= n) {
      resultado += simbolo;
      valor -= n;
    }
  });

  return resultado;
}

function mostrarErro(elemento, mensagem) {
  elemento.textContent = mensagem;
  elemento.classList.add('is-erro');
}

function aplicarInstagram(usuario) {
  let link = pessoaInfo.querySelector('[data-et-instagram]');
  if (!usuario) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement('a');
    link.dataset.etInstagram = 'true';
    link.className = 'et-perfil__instagram';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    pessoaInfo.appendChild(link);
  }
  link.href = `https://www.instagram.com/${encodeURIComponent(usuario)}/`;
  link.textContent = `@${usuario}`;
}

function atualizarBotoesPoemas(modal) {
  const itens = [...modal.querySelectorAll('[data-poema-id]')];
  itens.forEach((item, indice) => {
    item.querySelector('[data-mover="cima"]').disabled = indice === 0;
    item.querySelector('[data-mover="baixo"]').disabled = indice === itens.length - 1;
    const legenda = item.querySelector('legend');
    if (legenda) legenda.textContent = `Poema ${indice + 1}`;
  });
}

function normalizarInstagram(valor) {
  let usuario = String(valor || '').trim();
  if (!usuario) return { ok: true, usuario: '' };
  if (/^https?:\/\//i.test(usuario)) {
    try {
      const url = new URL(usuario);
      if (url.hostname.toLowerCase().replace(/^www\./, '') !== 'instagram.com') throw new Error();
      usuario = url.pathname.split('/').filter(Boolean)[0] || '';
    } catch {
      return { ok: false, mensagem: 'Informe um usuário ou URL válida do Instagram.' };
    }
  }
  usuario = usuario.replace(/^@/, '');
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(usuario)) {
    return { ok: false, mensagem: 'Instagram inválido.' };
  }
  return { ok: true, usuario: usuario.toLowerCase() };
}

function enviarArquivo(arquivo) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const dados = new FormData();
    dados.append('file', arquivo);
    dados.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);
    xhr.responseType = 'json';
    xhr.timeout = 10 * 60 * 1000;
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response?.secure_url) {
        resolve({ url: xhr.response.secure_url });
      } else reject(new Error(xhr.response?.error?.message || 'O Cloudinary recusou a imagem.'));
    });
    xhr.addEventListener('error', () => reject(new Error('Falha de rede durante o upload.')));
    xhr.addEventListener('timeout', () => reject(new Error('O upload demorou tempo demais.')));
    xhr.send(dados);
  });
}

function criarSlug(valor) {
  return String(valor || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `poema-${Date.now().toString(36)}`;
}

function escapeHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
