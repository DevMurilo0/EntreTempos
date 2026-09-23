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

const pessoaSection = document.querySelector('.pessoa-section');
const pessoaInfo = document.querySelector('.pessoa-info');
const nomeEl = document.querySelector('.pessoa-nome');
const contadorEl = document.querySelector('.contador-poemas');
const gradeEl = document.querySelector('.grade-envelopes');
const areaFolha = document.querySelector('.area-folha');

if (!pessoaSection || !pessoaInfo || !nomeEl || !gradeEl || !areaFolha) {
  // Esta página não segue o layout antigo de poetas.
} else {
  iniciarEditorPoeta();
}

function iniciarEditorPoeta() {
  const caminho = location.pathname.split('/').filter(Boolean);
  const slug = caminho.at(-2) || 'poeta';
  const secao = location.pathname.includes('/conhecidos/')
    ? 'poemas-conhecidos'
    : 'poemas';
  const editorId = `${secao}--${slug}`;

  const baseOriginal = lerEstadoDaPagina();
  const ref = doc(db, 'participantesAutorais', RAIZ_EDICOES, 'conteudos', editorId);

  let dadosAtuais = baseOriginal;
  let pesquisador = false;

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'et-btn et-btn--principal et-poeta-editar';
  botao.textContent = 'Editar tudo';
  botao.hidden = true;
  pessoaInfo.appendChild(botao);

  onAuthStateChanged(auth, (usuario) => {
    pesquisador = usuario?.uid === PESQUISADOR_UID;
    botao.hidden = !pesquisador;
  });

  onSnapshot(
    ref,
    (snapshot) => {
      if (snapshot.exists()) {
        dadosAtuais = normalizarDados(snapshot.data(), baseOriginal);
        aplicarEstado(dadosAtuais);
      } else {
        dadosAtuais = baseOriginal;
      }
    },
    (erro) => {
      console.error('[poetas-editor] Erro ao carregar edições:', erro);
    }
  );

  botao.addEventListener('click', () => {
    if (!pesquisador) return;
    abrirModalEdicao(dadosAtuais, ref);
  });
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

    return {
      titulo,
      autor: artigo.querySelector('.poema-data')?.textContent.trim() || nomeEl.textContent.trim(),
      texto: extrairTextoPoema(artigo.querySelector('.poema-texto'))
    };
  });

  return {
    nome: nomeEl.textContent.trim(),
    descricao,
    poemas
  };
}

function normalizarDados(dados, fallback) {
  return {
    nome: typeof dados.nome === 'string' ? dados.nome : fallback.nome,
    descricao: typeof dados.descricao === 'string' ? dados.descricao : fallback.descricao,
    poemas: Array.isArray(dados.poemas) && dados.poemas.length
      ? dados.poemas.map((poema, i) => ({
          titulo: typeof poema?.titulo === 'string' ? poema.titulo : fallback.poemas[i]?.titulo || `Poema ${i + 1}`,
          autor: typeof poema?.autor === 'string' ? poema.autor : fallback.poemas[i]?.autor || dados.nome || fallback.nome,
          texto: typeof poema?.texto === 'string' ? poema.texto : fallback.poemas[i]?.texto || ''
        }))
      : fallback.poemas
  };
}

function aplicarEstado(dados) {
  nomeEl.textContent = dados.nome || '';

  [...pessoaInfo.querySelectorAll('.pessoa-bio')].forEach((p) => p.remove());

  const referencia = contadorEl || pessoaInfo.querySelector('.et-poeta-editar');
  const paragrafos = separarParagrafos(dados.descricao);

  paragrafos.forEach((texto) => {
    const p = document.createElement('p');
    p.className = 'pessoa-bio';
    p.textContent = texto;
    pessoaInfo.insertBefore(p, referencia || null);
  });

  const artigos = [...areaFolha.querySelectorAll('.poema')];
  const envelopes = [...gradeEl.querySelectorAll('.envelope')];

  artigos.forEach((artigo, indice) => {
    const poema = dados.poemas[indice];
    if (!poema) return;

    const titulo = artigo.querySelector('.poema-titulo');
    const autor = artigo.querySelector('.poema-data');
    const assinatura = artigo.querySelector('.poema-assinatura');
    const texto = artigo.querySelector('.poema-texto');
    const envTitulo = envelopes[indexPorAlvo(envelopes, artigo.id)]?.querySelector('.env-titulo');

    if (titulo) titulo.textContent = poema.titulo || `Poema ${indice + 1}`;
    if (autor) autor.textContent = poema.autor || dados.nome || '';
    if (assinatura) assinatura.textContent = poema.autor ? `— ${poema.autor}` : '';
    if (envTitulo) envTitulo.textContent = poema.titulo || `Poema ${indice + 1}`;
    if (texto) renderizarTextoPoema(texto, poema.texto || '');
  });

  if (contadorEl) {
    const total = artigos.length;
    contadorEl.textContent = `${total} ${total === 1 ? 'poema' : 'poemas'}`;
  }

  document.title = `${dados.nome || 'Poeta'} — Poemas | Entre Tempos`;
}

function indexPorAlvo(envelopes, alvoId) {
  return envelopes.findIndex((env) => env.dataset.alvo === alvoId);
}

function abrirModalEdicao(dados, ref) {
  const modal = document.createElement('div');
  modal.className = 'et-modal et-modal--poeta';

  const poemasHtml = dados.poemas.map((poema, indice) => `
    <fieldset class="et-poeta-poema" data-poema="${indice}">
      <legend>Poema ${indice + 1}</legend>

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
      msg.textContent = 'Sua sessão de pesquisador não está ativa.';
      msg.classList.add('is-erro');
      return;
    }

    const nome = form.elements.nome.value.trim();
    const descricao = form.elements.descricao.value.trim();

    const poemas = dados.poemas.map((_, indice) => ({
      titulo: form.elements[`titulo-${indice}`].value.trim(),
      autor: form.elements[`autor-${indice}`].value.trim(),
      texto: form.elements[`texto-${indice}`].value.trim()
    }));

    salvando = true;
    salvar.disabled = true;
    salvar.textContent = 'Salvando...';
    msg.classList.remove('is-erro');
    msg.textContent = 'Salvando alterações...';

    try {
      await setDoc(
        ref,
        {
          tipo: 'edicao-poeta-estatico',
          nome,
          descricao,
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
      msg.textContent = 'Não foi possível salvar agora. Confira sua conexão e tente novamente.';
      msg.classList.add('is-erro');
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

function escapeHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
