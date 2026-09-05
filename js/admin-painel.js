import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const lista = document.getElementById('lista-inscricoes');
const mensagem = document.getElementById('mensagem-painel');
const filtros = document.querySelector('.contagens');
const modalRemocao = document.getElementById('modal-remocao');
const nomeRemocao = document.getElementById('nome-remocao');
const erroRemocao = document.getElementById('erro-remocao');
const botaoCancelarRemocao = document.getElementById('cancelar-remocao');
const botaoConfirmarRemocao = document.getElementById('confirmar-remocao');
const atualizando = new Set();
const rotulos = { nova: 'Nova', vista: 'Vista', aceita: 'Aceita' };
let pararListener = null;
let documentosAtuais = [];
let filtroAtual = 'todas';
let remocaoSelecionada = null;
let removendo = false;

function irParaLogin() {
  window.location.replace('login.html');
}

function abrirModalRemocao(id, nome, elementoAcionador) {
  remocaoSelecionada = { id, elementoAcionador };
  nomeRemocao.textContent = nome;
  erroRemocao.textContent = '';
  modalRemocao.hidden = false;
  document.body.classList.add('modal-aberto');
  botaoCancelarRemocao.focus();
}

function fecharModalRemocao() {
  if (removendo) return;
  const elementoAcionador = remocaoSelecionada?.elementoAcionador;
  modalRemocao.hidden = true;
  document.body.classList.remove('modal-aberto');
  nomeRemocao.textContent = '';
  erroRemocao.textContent = '';
  remocaoSelecionada = null;
  if (elementoAcionador?.isConnected) elementoAcionador.focus();
}

function formatarData(timestamp) {
  if (!timestamp?.toDate) return 'Registrando data...';
  const data = timestamp.toDate();
  const dia = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(data);
  const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(data);
  return `${dia} às ${hora}`;
}

function criarTexto(rotulo, valor) {
  const bloco = document.createElement('div');
  bloco.className = 'detalhe-inscricao';
  const titulo = document.createElement('h3');
  titulo.textContent = rotulo;
  const texto = document.createElement('p');
  texto.textContent = valor;
  bloco.append(titulo, texto);
  return bloco;
}

function criarAcoes(id, status) {
  const acoes = document.createElement('div');
  acoes.className = 'acoes-inscricao';
  if (status === 'nova') {
    const vista = document.createElement('button');
    vista.type = 'button';
    vista.textContent = 'Marcar como vista';
    vista.className = 'acao-secundaria';
    vista.dataset.id = id;
    vista.dataset.status = 'vista';
    acoes.appendChild(vista);
  } else if (status === 'vista') {
    const vista = document.createElement('span');
    vista.className = 'acao-confirmada';
    vista.textContent = '✓ Vista';
    acoes.appendChild(vista);
  }
  if (status !== 'aceita') {
    const aceitar = document.createElement('button');
    aceitar.type = 'button';
    aceitar.textContent = 'Aceitar';
    aceitar.className = 'acao-principal';
    aceitar.dataset.id = id;
    aceitar.dataset.status = 'aceita';
    acoes.appendChild(aceitar);
  } else {
    const aceita = document.createElement('span');
    aceita.className = 'acao-confirmada acao-confirmada--aceita';
    aceita.textContent = '✓ Aceita';
    acoes.appendChild(aceita);
  }
  const remover = document.createElement('button');
  remover.type = 'button';
  remover.textContent = 'Remover';
  remover.className = 'acao-remover';
  remover.dataset.id = id;
  remover.dataset.acao = 'remover';
  acoes.appendChild(remover);
  return acoes;
}

function criarCard(documento) {
  const dados = documento.data();
  const status = rotulos[dados.status] ? dados.status : 'nova';
  const card = document.createElement('article');
  card.className = `inscricao inscricao--${status}`;
  const topo = document.createElement('header');
  topo.className = 'topo-inscricao';
  const identificacao = document.createElement('div');
  const nome = document.createElement('h2');
  nome.textContent = dados.nome || 'Sem nome';
  const data = document.createElement('time');
  data.textContent = formatarData(dados.criadoEm);
  identificacao.append(nome, data);
  const etiqueta = document.createElement('span');
  etiqueta.className = `status-inscricao status-inscricao--${status}`;
  etiqueta.textContent = rotulos[status];
  topo.append(identificacao, etiqueta);
  card.append(topo, criarTexto('Contato', dados.contato || ''), criarTexto('Como gostaria de fazer parte', dados.descricao || ''), criarAcoes(documento.id, status));
  return card;
}

function atualizarContagens(documentos) {
  const dados = documentos.map((item) => item.data());
  document.getElementById('total-inscricoes').textContent = dados.length;
  document.getElementById('total-novas').textContent = dados.filter((item) => item.status === 'nova').length;
  document.getElementById('total-vistas').textContent = dados.filter((item) => item.status === 'vista').length;
  document.getElementById('total-aceitas').textContent = dados.filter((item) => item.status === 'aceita').length;
}

function renderizarInscricoes() {
  const documentosFiltrados = filtroAtual === 'todas'
    ? documentosAtuais
    : documentosAtuais.filter((item) => item.data().status === filtroAtual);
  lista.replaceChildren(...documentosFiltrados.map(criarCard));

  if (!documentosAtuais.length) {
    mensagem.textContent = 'Ainda não chegou nenhum bilhete.';
  } else if (!documentosFiltrados.length) {
    mensagem.textContent = 'Nenhuma inscrição neste filtro.';
  } else {
    mensagem.textContent = '';
  }
  mensagem.className = 'mensagem-admin mensagem-painel';
}

function carregarInscricoes() {
  pararListener = onSnapshot(query(collection(db, 'inscricoes'), orderBy('criadoEm', 'desc')), (snapshot) => {
    documentosAtuais = snapshot.docs;
    atualizarContagens(documentosAtuais);
    renderizarInscricoes();
  }, () => {
    mensagem.textContent = 'Não foi possível carregar as inscrições.';
    mensagem.className = 'mensagem-admin mensagem-painel mensagem-admin--erro';
  });
}

onAuthStateChanged(auth, (usuario) => {
  if (!usuario || usuario.isAnonymous) {
    if (pararListener) pararListener();
    irParaLogin();
    return;
  }
  document.body.classList.remove('bloqueado');
  if (!pararListener) carregarInscricoes();
});

filtros.addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-filtro]');
  if (!botao) return;
  filtroAtual = botao.dataset.filtro;
  filtros.querySelectorAll('button[data-filtro]').forEach((item) => {
    const ativo = item === botao;
    item.classList.toggle('ativo', ativo);
    item.setAttribute('aria-pressed', String(ativo));
  });
  renderizarInscricoes();
});

lista.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('button[data-id]');
  if (!botao || atualizando.has(botao.dataset.id)) return;

  if (botao.dataset.acao === 'remover') {
    const documento = documentosAtuais.find((item) => item.id === botao.dataset.id);
    const nome = documento?.data().nome || 'Sem nome';
    abrirModalRemocao(botao.dataset.id, nome, botao);
    return;
  }

  atualizando.add(botao.dataset.id);
  botao.disabled = true;
  try {
    await updateDoc(doc(db, 'inscricoes', botao.dataset.id), { status: botao.dataset.status });
  } catch (erro) {
    mensagem.textContent = 'Não foi possível atualizar o status.';
    mensagem.className = 'mensagem-admin mensagem-painel mensagem-admin--erro';
    botao.disabled = false;
  } finally {
    atualizando.delete(botao.dataset.id);
  }
});

botaoCancelarRemocao.addEventListener('click', fecharModalRemocao);

modalRemocao.addEventListener('click', (evento) => {
  if (evento.target === modalRemocao) fecharModalRemocao();
});

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && !modalRemocao.hidden) fecharModalRemocao();
});

botaoConfirmarRemocao.addEventListener('click', async () => {
  if (!remocaoSelecionada || removendo) return;
  const { id } = remocaoSelecionada;
  removendo = true;
  atualizando.add(id);
  botaoConfirmarRemocao.disabled = true;
  botaoCancelarRemocao.disabled = true;
  botaoConfirmarRemocao.textContent = 'Removendo...';
  erroRemocao.textContent = '';

  try {
    await deleteDoc(doc(db, 'inscricoes', id));
    removendo = false;
    fecharModalRemocao();
  } catch (erro) {
    console.error('[admin] Erro ao remover inscrição:', erro);
    erroRemocao.textContent = 'Não foi possível remover esta inscrição.';
  } finally {
    removendo = false;
    atualizando.delete(id);
    botaoConfirmarRemocao.disabled = false;
    botaoCancelarRemocao.disabled = false;
    botaoConfirmarRemocao.textContent = 'Remover';
  }
});

document.getElementById('botao-sair').addEventListener('click', async () => {
  try {
    await signOut(auth);
  } finally {
    irParaLogin();
  }
});
