import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export const ADMIN_UID = 'QuiQMjtXjOWNW2LCrot86rsHh0F2';

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function observarPesquisador(callback) {
  return onAuthStateChanged(auth, (usuario) => {
    callback(Boolean(usuario && usuario.uid === ADMIN_UID), usuario);
  });
}

export function criarDocumentoId(tipo, ano, mes) {
  return `${tipo}-${Number(ano)}-${String(Number(mes)).padStart(2, '0')}`;
}

export async function carregarTopConteudos(tipo, ano, mes) {
  const referencia = doc(db, 'topConteudos', criarDocumentoId(tipo, ano, mes));
  const snapshot = await getDoc(referencia);
  if (!snapshot.exists()) return { existe: false, itens: [] };

  const dados = snapshot.data();
  return {
    existe: true,
    itens: Array.isArray(dados.itens) ? dados.itens : []
  };
}

export async function salvarTopConteudos(tipo, ano, mes, itens) {
  if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
    throw new Error('Usuário sem permissão para editar este conteúdo.');
  }

  const referencia = doc(db, 'topConteudos', criarDocumentoId(tipo, ano, mes));
  const itensOrdenados = [...itens].sort((a, b) => a.posicao - b.posicao);
  await setDoc(referencia, {
    tipo,
    ano: Number(ano),
    mes: Number(mes),
    itens: itensOrdenados,
    atualizadoEm: serverTimestamp()
  });
  return itensOrdenados;
}

export async function removerItemTop(tipo, ano, mes, itens, posicao) {
  const restantes = itens.filter((item) => item.posicao !== Number(posicao));
  return salvarTopConteudos(tipo, ano, mes, restantes);
}

export function gerarIdConteudo(tipo) {
  const prefixos = { filmes: 'filme', musicas: 'musica', livros: 'livro' };
  const prefixo = prefixos[tipo] || tipo.replace(/s$/, '') || 'conteudo';
  const uuid = globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `${prefixo}-${uuid}`;
}

function normalizarTitulo(titulo) {
  return String(titulo || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function obterIdEditado(tipo, itemAnterior, tituloNovo) {
  if (!itemAnterior?.id) return gerarIdConteudo(tipo);
  const mesmoTitulo = normalizarTitulo(itemAnterior.titulo) === normalizarTitulo(tituloNovo);
  return mesmoTitulo ? itemAnterior.id : gerarIdConteudo(tipo);
}

export function extrairYoutubeId(valor) {
  let url;
  try {
    url = new URL(String(valor || '').trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();
  let id = '';

  if (host === 'youtu.be') {
    id = url.pathname.split('/').filter(Boolean)[0] || '';
  } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
    if (url.pathname === '/watch') {
      id = url.searchParams.get('v') || '';
    } else {
      const partes = url.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts'].includes(partes[0])) id = partes[1] || '';
    }
  }

  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export function gerarYoutubeEmbedUrl(youtubeId) {
  return /^[A-Za-z0-9_-]{11}$/.test(String(youtubeId || ''))
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}`
    : '';
}

export function validarUrlHttp(valor) {
  try {
    const url = new URL(String(valor || '').trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validarCapa(valor) {
  const capa = String(valor || '').trim();
  if (!capa) return true;
  if (/^[a-z][a-z\d+.-]*:/i.test(capa)) {
    try {
      return new URL(capa).protocol === 'https:';
    } catch {
      return false;
    }
  }
  return !capa.startsWith('//') && !capa.includes('\\');
}

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

export function criarEditorTop(configuracao) {
  const {
    tipo, limite, botao, titulo, campos, obterPeriodo,
    carregarPeriodo, obterItens, montarItem, aoSalvar
  } = configuracao;

  const overlay = criarElemento('div', 'editor-top');
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  const caixa = criarElemento('section', 'editor-top__caixa');
  caixa.setAttribute('role', 'dialog');
  caixa.setAttribute('aria-modal', 'true');

  const fechar = criarElemento('button', 'editor-top__fechar', '×');
  fechar.type = 'button';
  fechar.setAttribute('aria-label', 'Fechar gerenciamento');
  const cabecalho = criarElemento('div', 'editor-top__cabecalho');
  const etiqueta = criarElemento('span', 'editor-top__etiqueta', 'Edição de conteúdo');
  const heading = criarElemento('h2', 'editor-top__titulo', titulo);
  heading.id = `editor-top-titulo-${tipo}`;
  caixa.setAttribute('aria-labelledby', heading.id);
  cabecalho.append(etiqueta, heading);

  const periodo = criarElemento('div', 'editor-top__periodo');
  const labelMes = criarElemento('label', '', 'Mês');
  const campoMes = document.createElement('select');
  NOMES_MESES.forEach((nome, indice) => {
    const opcao = document.createElement('option');
    opcao.value = String(indice + 1);
    opcao.textContent = nome;
    campoMes.appendChild(opcao);
  });
  labelMes.appendChild(campoMes);
  const labelAno = criarElemento('label', '', 'Ano');
  const campoAno = document.createElement('input');
  campoAno.type = 'number';
  campoAno.min = '2000';
  campoAno.max = '2100';
  labelAno.appendChild(campoAno);
  periodo.append(labelMes, labelAno);

  const slots = criarElemento('div', 'editor-top__slots');
  slots.setAttribute('role', 'tablist');
  const botoesSlots = [];
  for (let posicao = 1; posicao <= limite; posicao += 1) {
    const slot = criarElemento('button', 'editor-top__slot', `TOP ${posicao}`);
    slot.type = 'button';
    slot.dataset.posicao = String(posicao);
    slot.setAttribute('role', 'tab');
    slot.addEventListener('click', () => selecionarPosicao(posicao));
    botoesSlots.push(slot);
    slots.appendChild(slot);
  }

  const formulario = criarElemento('form', 'editor-top__form');
  const posicaoLabel = criarElemento('p', 'editor-top__posicao', 'Posição: TOP 1');
  formulario.appendChild(posicaoLabel);
  const inputs = {};
  campos.forEach((campo) => {
    const grupo = criarElemento('label', 'editor-top__campo');
    grupo.appendChild(criarElemento('span', '', campo.label));
    const input = campo.tipo === 'textarea'
      ? document.createElement('textarea')
      : document.createElement('input');
    if (campo.tipo !== 'textarea') input.type = campo.tipo || 'text';
    if (campo.placeholder) input.placeholder = campo.placeholder;
    if (campo.obrigatorio) input.required = true;
    input.name = campo.nome;
    grupo.appendChild(input);
    formulario.appendChild(grupo);
    inputs[campo.nome] = input;
  });

  const mensagem = criarElemento('p', 'editor-top__mensagem');
  mensagem.setAttribute('role', 'status');
  mensagem.setAttribute('aria-live', 'polite');
  const acoes = criarElemento('div', 'editor-top__acoes');
  const remover = criarElemento('button', 'editor-top__remover', 'Remover desta posição');
  remover.type = 'button';
  const cancelar = criarElemento('button', 'editor-top__cancelar', 'Cancelar');
  cancelar.type = 'button';
  const salvar = criarElemento('button', 'editor-top__salvar', 'Salvar posição');
  salvar.type = 'submit';
  acoes.append(remover, cancelar, salvar);
  formulario.append(mensagem, acoes);

  const confirmacao = criarElemento('div', 'editor-top__confirmacao');
  confirmacao.hidden = true;
  const textoConfirmacao = criarElemento('p', '', '');
  const acoesConfirmacao = criarElemento('div', 'editor-top__acoes');
  const voltarConfirmacao = criarElemento('button', 'editor-top__cancelar', 'Voltar');
  voltarConfirmacao.type = 'button';
  const confirmarRemocao = criarElemento('button', 'editor-top__salvar', 'Remover');
  confirmarRemocao.type = 'button';
  acoesConfirmacao.append(voltarConfirmacao, confirmarRemocao);
  confirmacao.append(textoConfirmacao, acoesConfirmacao);

  caixa.append(fechar, cabecalho, periodo, slots, formulario, confirmacao);
  overlay.appendChild(caixa);
  document.body.appendChild(overlay);

  let posicaoAtual = 1;
  let itemAtual = null;
  let processando = false;

  function mostrarMensagem(texto, erro = false) {
    mensagem.textContent = texto;
    mensagem.classList.toggle('editor-top__mensagem--erro', erro);
  }

  function atualizarSlots() {
    const itens = obterItens();
    botoesSlots.forEach((slot) => {
      const posicao = Number(slot.dataset.posicao);
      const preenchido = itens.some((item) => item.posicao === posicao);
      slot.classList.toggle('editor-top__slot--preenchido', preenchido);
      slot.classList.toggle('editor-top__slot--selecionado', posicao === posicaoAtual);
      slot.setAttribute('aria-selected', String(posicao === posicaoAtual));
      slot.title = preenchido ? 'Posição preenchida' : 'Posição vazia';
    });
  }

  function selecionarPosicao(posicao) {
    posicaoAtual = posicao;
    itemAtual = obterItens().find((item) => item.posicao === posicao) || null;
    posicaoLabel.textContent = `Posição: TOP ${posicao}`;
    campos.forEach((campo) => {
      inputs[campo.nome].value = itemAtual?.[campo.nome] || '';
    });
    remover.hidden = !itemAtual;
    confirmacao.hidden = true;
    formulario.hidden = false;
    mostrarMensagem(itemAtual ? 'Posição preenchida. Edite e salve.' : 'Posição vazia. Cadastre um novo conteúdo.');
    atualizarSlots();
  }

  async function mudarPeriodo() {
    const mes = Number(campoMes.value);
    const ano = Number(campoAno.value);
    if (ano < 2000 || ano > 2100) return;
    mostrarMensagem('Carregando período...');
    await carregarPeriodo(mes, ano);
    selecionarPosicao(1);
  }

  function fecharEditor() {
    if (processando) return;
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('editor-top-aberto');
    botao.focus();
  }

  function abrirEditor() {
    const atual = obterPeriodo();
    campoMes.value = String(atual.mes);
    campoAno.value = String(atual.ano);
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('editor-top-aberto');
    selecionarPosicao(1);
    fechar.focus();
  }

  botao.addEventListener('click', abrirEditor);
  fechar.addEventListener('click', fecharEditor);
  cancelar.addEventListener('click', fecharEditor);
  overlay.addEventListener('click', (evento) => {
    if (evento.target === overlay) fecharEditor();
  });
  campoMes.addEventListener('change', mudarPeriodo);
  campoAno.addEventListener('change', mudarPeriodo);

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (processando) return;
    const valores = Object.fromEntries(campos.map((campo) => [campo.nome, inputs[campo.nome].value.trim()]));
    const resultado = montarItem(valores, itemAtual, posicaoAtual);
    if (resultado.erro) {
      mostrarMensagem(resultado.erro, true);
      return;
    }

    processando = true;
    salvar.disabled = true;
    remover.disabled = true;
    salvar.textContent = 'Salvando...';
    try {
      const itens = obterItens().filter((item) => item.posicao !== posicaoAtual);
      itens.push(resultado.item);
      const { mes, ano } = obterPeriodo();
      await salvarTopConteudos(tipo, ano, mes, itens);
      await aoSalvar();
      itemAtual = obterItens().find((item) => item.posicao === posicaoAtual) || resultado.item;
      atualizarSlots();
      mostrarMensagem('Conteúdo salvo. A lista já foi atualizada.');
    } catch (erro) {
      console.error(`[${tipo}] erro ao salvar conteúdo:`, erro);
      mostrarMensagem('Não foi possível salvar. Verifique sua conexão e permissão.', true);
    } finally {
      processando = false;
      salvar.disabled = false;
      remover.disabled = false;
      salvar.textContent = 'Salvar posição';
    }
  });

  remover.addEventListener('click', () => {
    if (!itemAtual) return;
    textoConfirmacao.textContent = `Remover “${itemAtual.titulo}” do Top ${posicaoAtual}?`;
    formulario.hidden = true;
    confirmacao.hidden = false;
    voltarConfirmacao.focus();
  });
  voltarConfirmacao.addEventListener('click', () => {
    confirmacao.hidden = true;
    formulario.hidden = false;
    remover.focus();
  });
  confirmarRemocao.addEventListener('click', async () => {
    if (!itemAtual || processando) return;
    processando = true;
    confirmarRemocao.disabled = true;
    confirmarRemocao.textContent = 'Removendo...';
    try {
      const { mes, ano } = obterPeriodo();
      await removerItemTop(tipo, ano, mes, obterItens(), posicaoAtual);
      await aoSalvar();
      selecionarPosicao(posicaoAtual);
      mostrarMensagem('Conteúdo removido. As outras posições foram preservadas.');
    } catch (erro) {
      console.error(`[${tipo}] erro ao remover conteúdo:`, erro);
      confirmacao.hidden = true;
      formulario.hidden = false;
      mostrarMensagem('Não foi possível remover este conteúdo.', true);
    } finally {
      processando = false;
      confirmarRemocao.disabled = false;
      confirmarRemocao.textContent = 'Remover';
    }
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !overlay.hidden) fecharEditor();
  });

  observarPesquisador((autorizado) => {
    botao.hidden = !autorizado;
    if (!autorizado && !overlay.hidden) fecharEditor();
  });

  return { atualizarSlots };
}
