import { auth } from './firebase-config.js';
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const PESQUISADOR_UID = 'QuiQMjtXjOWNW2LCrot86rsHh0F2';

const formulario = document.getElementById('formulario-login');
const campoEmail = document.getElementById('email');
const campoSenha = document.getElementById('senha');
const botao = document.getElementById('botao-entrar');
const mensagem = document.getElementById('mensagem-login');
let entrando = false;

// Mantém a sessão do pesquisador salva neste navegador/perfil.
const persistenciaPronta = setPersistence(auth, browserLocalPersistence).catch((erro) => {
  console.error('[admin] Não foi possível configurar persistência local:', erro);
});

// Se o pesquisador já estiver autenticado, não pede e-mail/senha novamente.
onAuthStateChanged(auth, (usuario) => {
  if (usuario?.uid === PESQUISADOR_UID) {
    window.location.replace('painel.html');
    return;
  }

  // Se houver alguma conta real diferente da autorizada, encerra essa sessão.
  if (usuario && !usuario.isAnonymous && usuario.uid !== PESQUISADOR_UID) {
    signOut(auth).catch((erro) => {
      console.error('[admin] Não foi possível encerrar uma sessão não autorizada:', erro);
    });
  }
});

function mostrarMensagem(texto) {
  mensagem.textContent = texto;
  mensagem.className = 'mensagem-admin mensagem-admin--erro';
  mensagem.setAttribute('role', 'alert');
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (entrando) return;

  const email = campoEmail.value.trim();
  const senha = campoSenha.value;

  if (!email || !senha) {
    mostrarMensagem('Preencha o e-mail e a senha.');
    (email ? campoSenha : campoEmail).focus();
    return;
  }

  entrando = true;
  botao.disabled = true;
  botao.textContent = 'Entrando...';
  mensagem.textContent = '';

  try {
    await persistenciaPronta;

    const credencial = await signInWithEmailAndPassword(auth, email, senha);

    if (credencial.user.uid !== PESQUISADOR_UID) {
      await signOut(auth);
      mostrarMensagem('Esta conta não possui acesso de pesquisador.');
      return;
    }

    window.location.replace('painel.html');
  } catch (erro) {
    console.error('[admin] Falha no login:', erro);
    campoSenha.value = '';
    mostrarMensagem('E-mail ou senha incorretos.');
    campoSenha.focus();
  } finally {
    entrando = false;
    botao.disabled = false;
    botao.textContent = 'Entrar';
  }
});
