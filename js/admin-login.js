import { auth } from './firebase-config.js';
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const formulario = document.getElementById('formulario-login');
const campoEmail = document.getElementById('email');
const campoSenha = document.getElementById('senha');
const botao = document.getElementById('botao-entrar');
const mensagem = document.getElementById('mensagem-login');
let entrando = false;

onAuthStateChanged(auth, (usuario) => {
  if (usuario && !usuario.isAnonymous) {
    window.location.replace('painel.html');
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
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, email, senha);
    window.location.replace('painel.html');
  } catch (erro) {
    campoSenha.value = '';
    mostrarMensagem('E-mail ou senha incorretos.');
    campoSenha.focus();
  } finally {
    entrando = false;
    botao.disabled = false;
    botao.textContent = 'Entrar';
  }
});
