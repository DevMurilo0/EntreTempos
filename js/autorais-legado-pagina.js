import { auth, db } from '/js/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const PESQUISADOR_UID = 'QuiQMjtXjOWNW2LCrot86rsHh0F2';
const CLOUDINARY_CLOUD_NAME = 'uaisf2vc';
const CLOUDINARY_UPLOAD_PRESET = 'entre_tempos_upload';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
const RAIZ_LEGADOS = '_legados';

const secao = document.body.dataset.etSecao;
const pessoaId = document.body.dataset.etPersonId;
const tipoPagina = document.body.dataset.etTipo || 'pessoa';

const SELETORES = {
  nome: '.pessoa-nome, .musica-abertura-titulo, .curiosidade-abertura-titulo',
  descricao: '.pessoa-bio, .musica-abertura-resumo, .curiosidade-abertura-resumo',
  foto: '.foto-pessoa, .foto-musica, .foto-curiosidade',
  info: '.pessoa-info, .musica-abertura-info, .curiosidade-abertura-info',
  cabecalho: '.pessoa-section, .musica-abertura, .curiosidade-abertura',
  galeria: '.galeria, .musica-corpo, .curiosidade-corpo'
};

if (!document.querySelector('link[href="/css/autorais-admin.css"]')) {
  const estilosAdmin = document.createElement('link');
  estilosAdmin.rel = 'stylesheet';
  estilosAdmin.href = '/css/autorais-admin.css';
  document.head.appendChild(estilosAdmin);
}

if (secao && pessoaId && document.querySelector(SELETORES.nome)) {
  iniciar();
}

function iniciar() {
  const elementos = {
    nome: document.querySelector(SELETORES.nome),
    descricao: [...document.querySelectorAll(SELETORES.descricao)],
    foto: document.querySelector(SELETORES.foto),
    info: document.querySelector(SELETORES.info),
    cabecalho: document.querySelector(SELETORES.cabecalho),
    galeria: document.querySelector(SELETORES.galeria)
  };

  const fallback = lerFallback(elementos);
  const ref = doc(db, 'participantesAutorais', RAIZ_LEGADOS, 'conteudos', `${secao}--${pessoaId}`);
  let estado = fallback;
  let pesquisador = false;

  const painel = criarPainel();
  elementos.cabecalho.insertAdjacentElement('afterend', painel);

  onAuthStateChanged(auth, (usuario) => {
    pesquisador = usuario?.uid === PESQUISADOR_UID;
    painel.hidden = !pesquisador;
    document.body.classList.toggle('et-pesquisador', pesquisador);
    atualizarAcoesConteudos(elementos, estado, pesquisador, ref, fallback);
  });

  onSnapshot(ref, (snapshot) => {
    const salvo = snapshot.exists() ? snapshot.data() : null;

    if (salvo?.removido === true) {
      location.replace(document.body.dataset.etVoltar || '/');
      return;
    }

    estado = mesclarEstado(fallback, salvo);
    aplicarEstado(elementos, estado);
    atualizarAcoesConteudos(elementos, estado, pesquisador, ref, fallback);
  }, (erro) => {
    console.error('[autorais-legado] Falha ao carregar override:', erro);
  });

  painel.querySelector('[data-editar-pessoa]').addEventListener('click', () => {
    if (pesquisador) abrirModalPessoa(estado, ref);
  });

  painel.querySelector('[data-adicionar-conteudo]').addEventListener('click', () => {
    if (pesquisador) abrirModalConteudo(null, estado, ref, fallback);
  });

  painel.querySelector('[data-organizar]').addEventListener('click', () => {
    if (pesquisador) abrirModalOrdem(estado, ref, fallback);
  });

  painel.querySelector('[data-remover-pessoa]').addEventListener('click', async (evento) => {
    if (!pesquisador || !confirm(`Remover ${estado.nome || 'esta publicação'} da revista?`)) return;
    const botao = evento.currentTarget;
    botao.disabled = true;

    try {
      await salvarOverride(ref, estado, { removido: true });
    } catch (erro) {
      console.error('[autorais-legado] Falha ao remover:', erro);
      alert('Não foi possível remover agora.');
      botao.disabled = false;
    }
  });
}

function lerFallback(elementos) {
  const conteudos = elementos.galeria
    ? obterElementosConteudo(elementos.galeria).map((elemento, indice) => lerConteudo(elemento, indice))
    : [];

  return {
    nome: elementos.nome.textContent.trim(),
    descricao: elementos.descricao.map((item) => item.textContent.trim()).filter(Boolean).join('\n\n'),
    fotoUrl: elementos.foto?.getAttribute('src') || '',
    instagram: '',
    conteudos
  };
}

function obterElementosConteudo(galeria) {
  if (secao.startsWith('desenhos')) {
    return [...galeria.querySelectorAll(':scope > .card-desenho, :scope > .obra')];
  }

  if (secao === 'musica') {
    return [...galeria.querySelectorAll(':scope > .bloco-texto, :scope > .bloco-midia')];
  }

  return [...galeria.querySelectorAll(':scope > .bloco-texto, :scope > .bloco-midia, :scope > .card-desenho')];
}

function lerConteudo(elemento, indice) {
  const tituloEl = elemento.querySelector('.card-titulo, .obra-titulo, .legenda-midia, h2, h3');
  const midia = elemento.matches('.bloco-texto')
    ? null
    : elemento.querySelector('img, video, audio, iframe');
  const paragrafos = elemento.matches('.bloco-texto')
    ? [...elemento.querySelectorAll('p')]
    : [];
  const descricaoEl = elemento.querySelector('.obra-texto, .obra-legenda');
  const origemEstavel = tituloEl?.textContent.trim() ||
    elemento.dataset.titulo ||
    paragrafos.map((item) => item.textContent.trim()).join(' ') ||
    midia?.getAttribute('src') ||
    `publicacao-${indice + 1}`;
  const titulo = tituloEl?.textContent.trim() || elemento.dataset.titulo || nomeArquivo(origemEstavel) || `Publicação ${indice + 1}`;
  const id = elemento.dataset.etContentId || criarSlug(origemEstavel);

  elemento.dataset.etContentId = id;
  elemento.dataset.etOrderId = `legacy-content:${id}`;

  return {
    id,
    titulo,
    descricao: paragrafos.length
      ? paragrafos.map((item) => item.textContent.trim()).filter(Boolean).join('\n\n')
      : descricaoEl?.textContent.trim() || '',
    midiaUrl: midia?.getAttribute('src') || '',
    midiaTipo: elemento.matches('.bloco-texto') ? 'texto' : midia?.tagName.toLowerCase() || 'img',
    ativo: true,
    _elemento: elemento
  };
}

function mesclarEstado(fallback, salvo) {
  if (!salvo) return fallback;
  const salvos = Array.isArray(salvo.conteudos) ? salvo.conteudos : [];
  const porId = new Map(salvos.map((item) => [item.id, item]));
  const conteudos = fallback.conteudos.map((item) => ({
    ...item,
    ...(porId.get(item.id) || {})
  }));

  salvos.forEach((item) => {
    if (!conteudos.some((existente) => existente.id === item.id)) conteudos.push(item);
  });

  const ordem = Array.isArray(salvo.ordemConteudos) ? salvo.ordemConteudos : [];
  conteudos.sort((a, b) => {
    const ia = ordem.indexOf(a.id);
    const ib = ordem.indexOf(b.id);
    return (ia < 0 ? Number.MAX_SAFE_INTEGER : ia) - (ib < 0 ? Number.MAX_SAFE_INTEGER : ib);
  });

  return {
    nome: typeof (salvo.nome ?? salvo.titulo) === 'string' ? (salvo.nome ?? salvo.titulo) : fallback.nome,
    descricao: typeof (salvo.descricao ?? salvo.descricaoConteudo) === 'string' ? (salvo.descricao ?? salvo.descricaoConteudo) : fallback.descricao,
    fotoUrl: typeof (salvo.fotoUrl ?? salvo.imagemUrl) === 'string' ? (salvo.fotoUrl ?? salvo.imagemUrl) : fallback.fotoUrl,
    instagram: typeof salvo.instagram === 'string' ? salvo.instagram : fallback.instagram,
    conteudos
  };
}

function aplicarEstado(elementos, dados) {
  elementos.nome.textContent = dados.nome || '';
  if (elementos.foto && dados.fotoUrl) {
    elementos.foto.src = dados.fotoUrl;
    elementos.foto.alt = dados.nome ? `Foto de ${dados.nome}` : elementos.foto.alt;
  }

  aplicarDescricao(elementos, dados.descricao);
  aplicarInstagram(elementos, dados.instagram);
  aplicarConteudos(elementos.galeria, dados.conteudos);
  document.title = `${dados.nome || 'Publicação'} | Entre Tempos`;
}

function aplicarDescricao(elementos, descricao) {
  if (!elementos.info) return;
  const existentes = [...elementos.info.querySelectorAll(SELETORES.descricao)];
  const referencia = elementos.info.querySelector('[class*="contador"], [data-et-instagram]');
  existentes.forEach((item) => item.remove());

  separarParagrafos(descricao).forEach((texto) => {
    const p = document.createElement('p');
    p.className = secao === 'musica'
      ? 'musica-abertura-resumo'
      : secao.startsWith('curiosidades')
        ? 'curiosidade-abertura-resumo'
        : 'pessoa-bio';
    p.textContent = texto;
    elementos.info.insertBefore(p, referencia);
  });
}

function aplicarInstagram(elementos, usuario) {
  if (!elementos.info) return;
  let link = elementos.info.querySelector('[data-et-instagram]');

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
    elementos.info.appendChild(link);
  }

  link.href = `https://www.instagram.com/${encodeURIComponent(usuario)}/`;
  link.textContent = `@${usuario}`;
}

function aplicarConteudos(galeria, conteudos) {
  if (!galeria) return;

  conteudos.forEach((conteudo) => {
    let elemento = galeria.querySelector(`[data-et-content-id="${CSS.escape(conteudo.id)}"]`);
    if (!elemento && conteudo.ativo !== false) {
      elemento = criarElementoConteudo(conteudo);
      galeria.appendChild(elemento);
    }
    if (!elemento) return;

    elemento.hidden = conteudo.ativo === false;
    atualizarElementoConteudo(elemento, conteudo);
    galeria.appendChild(elemento);
  });
}

function atualizarElementoConteudo(elemento, conteudo) {
  const titulo = elemento.querySelector('.card-titulo, .obra-titulo, .legenda-midia, .et-legado-publicacao__titulo, h2, h3');
  if (titulo) titulo.textContent = conteudo.titulo || 'Sem título';
  elemento.dataset.titulo = conteudo.titulo || '';

  let descricao = elemento.querySelector('.obra-texto, .et-legado-publicacao__descricao');
  if (elemento.matches('.bloco-texto')) {
    const paragrafos = [...elemento.querySelectorAll('p')];
    descricao = paragrafos[0] || null;
    paragrafos.slice(1).forEach((item) => item.remove());
  }
  if (descricao && conteudo.descricao !== undefined) descricao.textContent = conteudo.descricao || '';

  if (conteudo.midiaTipo === 'texto') return;

  let midia = elemento.querySelector('img, video, audio');
  const tagEsperada = ['video', 'audio'].includes(conteudo.midiaTipo) ? conteudo.midiaTipo : 'img';
  if (midia && midia.tagName.toLowerCase() !== tagEsperada && conteudo.midiaUrl) {
    const novaMidia = document.createElement(tagEsperada);
    if (tagEsperada === 'img') novaMidia.alt = conteudo.titulo || '';
    else novaMidia.controls = true;
    midia.replaceWith(novaMidia);
    midia = novaMidia;
  }
  if (midia && conteudo.midiaUrl) {
    midia.src = conteudo.midiaUrl;
    elemento.dataset.img = conteudo.midiaUrl;
  }
}

function criarElementoConteudo(conteudo) {
  const artigo = document.createElement('article');
  artigo.className = 'et-legado-publicacao';
  artigo.dataset.etContentId = conteudo.id;
  artigo.dataset.etOrderId = `legacy-content:${conteudo.id}`;

  const titulo = document.createElement('h3');
  titulo.className = 'et-legado-publicacao__titulo';
  titulo.textContent = conteudo.titulo || 'Sem título';

  const descricao = document.createElement('p');
  descricao.className = 'et-legado-publicacao__descricao';
  descricao.textContent = conteudo.descricao || '';
  artigo.append(titulo, descricao);

  if (conteudo.midiaUrl) {
    const tag = ['video', 'audio'].includes(conteudo.midiaTipo) ? conteudo.midiaTipo : 'img';
    const midia = document.createElement(tag);
    midia.src = conteudo.midiaUrl;
    if (tag !== 'img') midia.controls = true;
    else midia.alt = conteudo.titulo || '';
    artigo.appendChild(midia);
  }

  return artigo;
}

function criarPainel() {
  const painel = document.createElement('section');
  painel.className = 'et-poeta-admin';
  painel.hidden = true;
  painel.innerHTML = `
    <span class="et-poeta-admin__rotulo">Gerenciar conteúdo legado</span>
    <div class="et-poeta-admin__acoes">
      <button type="button" class="et-btn et-btn--principal" data-editar-pessoa>${tipoPagina === 'conteudo' ? 'Editar conteúdo' : 'Editar pessoa'}</button>
      <button type="button" class="et-btn et-btn--secundario" data-adicionar-conteudo>+ Adicionar publicação</button>
      <button type="button" class="et-btn et-btn--secundario" data-organizar>Organizar publicações</button>
      <button type="button" class="et-btn et-btn--perigo" data-remover-pessoa>Remover ${tipoPagina === 'conteudo' ? 'conteúdo' : 'pessoa'}</button>
    </div>`;
  return painel;
}

function atualizarAcoesConteudos(elementos, estado, pesquisador, ref, fallback) {
  elementos.galeria?.querySelectorAll('[data-et-legado-acoes]').forEach((item) => item.remove());
  if (!pesquisador || !elementos.galeria) return;

  estado.conteudos.forEach((conteudo) => {
    if (conteudo.ativo === false) return;
    const elemento = elementos.galeria.querySelector(`[data-et-content-id="${CSS.escape(conteudo.id)}"]`);
    if (!elemento) return;

    const acoes = document.createElement('div');
    acoes.className = 'et-legado-acoes';
    acoes.dataset.etLegadoAcoes = 'true';

    const editar = botaoAcao('Editar', () => abrirModalConteudo(conteudo, estado, ref, fallback));
    const remover = botaoAcao('Remover', async () => {
      if (!confirm(`Remover “${conteudo.titulo || 'esta publicação'}”?`)) return;
      const atualizados = estado.conteudos.map((item) => item.id === conteudo.id ? { ...item, ativo: false } : item);
      await salvarOverride(ref, estado, { conteudos: limparConteudos(atualizados) });
    }, true);
    acoes.append(editar, remover);
    elemento.prepend(acoes);
  });
}

function botaoAcao(texto, acao, perigo = false) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = `et-mini-btn${perigo ? ' et-mini-btn--perigo' : ''}`;
  botao.textContent = texto;
  botao.addEventListener('click', (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
    Promise.resolve(acao()).catch((erro) => {
      console.error('[autorais-legado] Falha na ação:', erro);
      alert('Não foi possível concluir esta ação.');
    });
  });
  return botao;
}

function abrirModalPessoa(dados, ref) {
  const modal = criarModal('Editar pessoa', `
    <div class="et-campo"><label>Nome</label><input name="nome" maxlength="160" value="${escapeHtml(dados.nome)}"></div>
    <div class="et-campo"><label>Descrição</label><textarea name="descricao" rows="8" maxlength="8000">${escapeHtml(dados.descricao)}</textarea></div>
    <div class="et-campo"><label>Instagram (opcional)</label><input name="instagram" maxlength="120" value="${escapeHtml(dados.instagram)}" placeholder="@usuario"></div>
    <div class="et-campo et-arquivo"><label>Nova foto (opcional)</label><input name="foto" type="file" accept="image/*"></div>
  `, async (form, msg) => {
    const instagram = normalizarInstagram(form.elements.instagram.value);
    if (!instagram.ok) throw new Error(instagram.mensagem);
    let fotoUrl = dados.fotoUrl;
    const arquivo = form.elements.foto.files?.[0];
    if (arquivo) {
      msg.textContent = 'Enviando foto...';
      fotoUrl = (await enviarArquivo(arquivo)).url;
    }
    await salvarOverride(ref, dados, {
      nome: form.elements.nome.value.trim(),
      descricao: form.elements.descricao.value.trim(),
      instagram: instagram.usuario,
      fotoUrl
    });
  });
  document.body.appendChild(modal);
}

function abrirModalConteudo(conteudo, estado, ref) {
  const atual = conteudo || { id: '', titulo: '', descricao: '', midiaUrl: '', midiaTipo: secao === 'musica' ? 'video' : 'img' };
  const modal = criarModal(conteudo ? 'Editar publicação' : 'Adicionar publicação', `
    <div class="et-campo"><label>Título</label><input name="titulo" maxlength="200" value="${escapeHtml(atual.titulo)}"></div>
    <div class="et-campo"><label>Descrição</label><textarea name="descricao" rows="6" maxlength="10000">${escapeHtml(atual.descricao)}</textarea></div>
    <div class="et-campo"><label>Tipo de publicação</label><select name="midiaTipo"><option value="texto"${atual.midiaTipo === 'texto' ? ' selected' : ''}>Texto</option><option value="img"${atual.midiaTipo === 'img' ? ' selected' : ''}>Imagem</option><option value="video"${atual.midiaTipo === 'video' ? ' selected' : ''}>Vídeo</option><option value="audio"${atual.midiaTipo === 'audio' ? ' selected' : ''}>Áudio</option></select></div>
    <div class="et-campo et-arquivo"><label>Nova mídia (opcional)</label><input name="midia" type="file" accept="image/*,video/*,audio/*"></div>
  `, async (form, msg) => {
    const titulo = form.elements.titulo.value.trim();
    let midiaUrl = atual.midiaUrl;
    const arquivo = form.elements.midia.files?.[0];
    if (arquivo) {
      msg.textContent = 'Enviando mídia...';
      midiaUrl = (await enviarArquivo(arquivo)).url;
    }
    const novo = {
      id: atual.id || criarIdNovo(titulo || 'publicacao'),
      titulo,
      descricao: form.elements.descricao.value.trim(),
      midiaTipo: form.elements.midiaTipo.value,
      midiaUrl,
      ativo: true
    };
    const conteudos = conteudo
      ? estado.conteudos.map((item) => item.id === conteudo.id ? novo : item)
      : [...estado.conteudos, novo];
    await salvarOverride(ref, estado, {
      conteudos: limparConteudos(conteudos),
      ordemConteudos: conteudos.map((item) => item.id)
    });
  });
  document.body.appendChild(modal);
}

function abrirModalOrdem(estado, ref) {
  const ativos = estado.conteudos.filter((item) => item.ativo !== false);
  const linhas = ativos.map((item, indice) => `
    <li class="et-ordem-item" data-id="${escapeHtml(item.id)}">
      <span class="et-ordem-item__nome">${escapeHtml(item.titulo || 'Sem título')}</span>
      <span class="et-ordem-item__acoes">
        <button type="button" data-mover="cima"${indice === 0 ? ' disabled' : ''}>↑</button>
        <button type="button" data-mover="baixo"${indice === ativos.length - 1 ? ' disabled' : ''}>↓</button>
      </span>
    </li>`).join('');
  const modal = criarModal('Organizar publicações', `<ol class="et-ordem-lista-admin" data-lista>${linhas}</ol>`, async (form) => {
    const idsAtivos = [...form.querySelectorAll('[data-id]')].map((item) => item.dataset.id);
    const removidos = estado.conteudos.filter((item) => item.ativo === false).map((item) => item.id);
    await salvarOverride(ref, estado, { ordemConteudos: [...idsAtivos, ...removidos] });
  });
  const lista = modal.querySelector('[data-lista]');
  lista?.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-mover]');
    if (!botao) return;
    const item = botao.closest('[data-id]');
    if (botao.dataset.mover === 'cima' && item.previousElementSibling) lista.insertBefore(item, item.previousElementSibling);
    if (botao.dataset.mover === 'baixo' && item.nextElementSibling) lista.insertBefore(item.nextElementSibling, item);
    [...lista.children].forEach((linha, indice, todos) => {
      linha.querySelector('[data-mover="cima"]').disabled = indice === 0;
      linha.querySelector('[data-mover="baixo"]').disabled = indice === todos.length - 1;
    });
  });
  document.body.appendChild(modal);
}

function criarModal(titulo, campos, aoSalvar) {
  const modal = document.createElement('div');
  modal.className = 'et-modal';
  modal.innerHTML = `
    <div class="et-modal__caixa" role="dialog" aria-modal="true">
      <button type="button" class="et-modal__fechar" data-fechar aria-label="Fechar">×</button>
      <p class="et-modal__kicker">Entre Tempos · pesquisadores</p>
      <h2 class="et-modal__titulo">${escapeHtml(titulo)}</h2>
      <form data-form>${campos}<p class="et-progresso" data-msg></p><div class="et-modal__acoes"><button type="button" class="et-btn et-btn--secundario" data-cancelar>Cancelar</button><button type="submit" class="et-btn et-btn--principal" data-salvar>Salvar</button></div></form>
    </div>`;
  document.body.classList.add('et-modal-aberto');
  const form = modal.querySelector('[data-form]');
  const msg = modal.querySelector('[data-msg]');
  const fechar = () => { modal.remove(); document.body.classList.remove('et-modal-aberto'); };
  modal.querySelector('[data-fechar]').addEventListener('click', fechar);
  modal.querySelector('[data-cancelar]').addEventListener('click', fechar);
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (auth.currentUser?.uid !== PESQUISADOR_UID) return;
    const salvar = form.querySelector('[data-salvar]');
    salvar.disabled = true;
    msg.textContent = 'Salvando...';
    try {
      await aoSalvar(form, msg);
      fechar();
    } catch (erro) {
      console.error('[autorais-legado] Falha ao salvar:', erro);
      msg.textContent = erro.message || 'Não foi possível salvar agora.';
      msg.classList.add('is-erro');
      salvar.disabled = false;
    }
  });
  requestAnimationFrame(() => form.querySelector('input, textarea, button')?.focus());
  return modal;
}

async function salvarOverride(ref, estado, alteracoes) {
  const base = {
    tipo: tipoPagina,
    secao,
    legadoId: pessoaId,
    removido: false,
    nome: estado.nome || '',
    descricao: estado.descricao || '',
    fotoUrl: estado.fotoUrl || '',
    instagram: estado.instagram || '',
    conteudos: limparConteudos(estado.conteudos || []),
    atualizadoEm: serverTimestamp(),
    atualizadoPor: auth.currentUser.uid
  };
  const payload = { ...base, ...alteracoes };
  if (tipoPagina === 'conteudo') {
    payload.titulo = payload.nome;
    payload.descricaoConteudo = payload.descricao;
    payload.imagemUrl = payload.fotoUrl;
  }
  await setDoc(ref, payload, { merge: true });
}

function limparConteudos(conteudos) {
  return conteudos.map(({ _elemento, ...item }) => item);
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
      } else reject(new Error(xhr.response?.error?.message || 'O Cloudinary recusou o arquivo.'));
    });
    xhr.addEventListener('error', () => reject(new Error('Falha de rede durante o upload.')));
    xhr.addEventListener('timeout', () => reject(new Error('O upload demorou tempo demais.')));
    xhr.send(dados);
  });
}

function normalizarInstagram(valor) {
  let usuario = String(valor || '').trim();
  if (!usuario) return { ok: true, usuario: '' };
  if (/^https?:\/\//i.test(usuario)) {
    try {
      const url = new URL(usuario);
      if (url.hostname.replace(/^www\./, '') !== 'instagram.com') throw new Error();
      usuario = url.pathname.split('/').filter(Boolean)[0] || '';
    } catch {
      return { ok: false, mensagem: 'Informe um perfil válido do Instagram.' };
    }
  }
  usuario = usuario.replace(/^@/, '');
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(usuario)) return { ok: false, mensagem: 'Instagram inválido.' };
  return { ok: true, usuario: usuario.toLowerCase() };
}

function criarSlug(valor) {
  return String(valor || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'publicacao';
}

function criarIdNovo(titulo) {
  return `${criarSlug(titulo)}-${Date.now().toString(36)}`;
}

function nomeArquivo(caminho) {
  const parte = String(caminho || '').split(/[/?#]/).filter(Boolean).at(-1) || '';
  return decodeURIComponent(parte).replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim();
}

function separarParagrafos(texto) {
  return String(texto || '').split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
}

function escapeHtml(valor) {
  return String(valor || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}
