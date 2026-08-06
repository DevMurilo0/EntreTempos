/**
 * likes.js — Entre Tempos
 * Sistema de curtidas compartilhado via Firebase Firestore.
 *
 * Uso (mesmo HTML de antes, nada muda):
 *   <button class="btn-like" data-like-id="julio-desenho-1" aria-label="Curtir">
 *     <span class="like-icon">♡</span>
 *     <span class="like-count">0</span>
 *   </button>
 *
 * Importante: este arquivo é um módulo ES. No HTML, troque a tag antiga por:
 *   <script type="module" src="js/likes.js"></script>
 *
 * initLikes() continua disponível globalmente (window.initLikes), então
 * qualquer chamada manual que você já tenha (ex: depois de abrir um lightbox
 * com conteúdo dinâmico) continua funcionando igual.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc,
  updateDoc, increment, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCC_MH5a5WvD602F9Y7JnAzYpJow3i1axA",
  authDomain: "entretempos-27471.firebaseapp.com",
  projectId: "entretempos-27471",
  storageBucket: "entretempos-27471.firebasestorage.app",
  messagingSenderId: "448383791330",
  appId: "1:448383791330:web:b19cafc6ce5311292c6ebb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUid = null;
const unsubscribers = new Map(); // id -> função pra cancelar o listener em tempo real

function postRef(id) {
  return doc(db, 'curtidas', id);
}
function userLikeRef(id, uid) {
  return doc(db, 'curtidas', id, 'usuarios', uid);
}

function renderButton(btn, total, liked) {
  const icon = btn.querySelector('.like-icon');
  const label = btn.querySelector('.like-count');

  if (icon) icon.textContent = liked ? '♥' : '♡';
  if (label) label.textContent = total;

  btn.classList.toggle('liked', liked);
  btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
}

function bump(btn) {
  btn.classList.add('like-bump');
  btn.addEventListener('animationend', () => {
    btn.classList.remove('like-bump');
  }, { once: true });
}

async function handleClick(btn, id) {
  if (btn.dataset.animating || !currentUid) return;
  btn.dataset.animating = '1';
  btn.disabled = true;

  try {
    const uRef = userLikeRef(id, currentUid);
    const pRef = postRef(id);
    const already = await getDoc(uRef);

    if (already.exists()) {
      // descurtir
      await deleteDoc(uRef);
      await updateDoc(pRef, { total: increment(-1) }).catch(async () => {
        // se o post ainda não existe por algum motivo, ignora
      });
    } else {
      // curtir
      const postSnap = await getDoc(pRef);
      if (!postSnap.exists()) {
        await setDoc(pRef, { total: 1 });
      } else {
        await updateDoc(pRef, { total: increment(1) });
      }
      await setDoc(uRef, { curtiuEm: Date.now() });
    }

    bump(btn);
  } catch (err) {
    console.error('Erro ao curtir:', err);
  } finally {
    delete btn.dataset.animating;
    btn.disabled = false;
  }
}

function setupButton(btn) {
  const id = btn.dataset.likeId;

  // registra o clique JÁ, antes de qualquer chamada assíncrona.
  // assim, mesmo que getDoc/onSnapshot falhem (ex: regra do Firestore
  // ainda não publicada), o botão continua clicável.
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // não propaga pro card (lightbox etc.)
    handleClick(btn, id);
  });

  // estado inicial: já curtiu nesse dispositivo/uid?
  const uRef = userLikeRef(id, currentUid);
  getDoc(uRef)
    .then((likedSnap) => renderButton(btn, 0, likedSnap.exists()))
    .catch((err) => console.error(`[likes] falha ao checar curtida de "${id}":`, err));

  // escuta o total em tempo real — se outra pessoa curtir, o número
  // atualiza sozinho na tela, sem precisar dar refresh
  const pRef = postRef(id);
  const unsub = onSnapshot(
    pRef,
    (snap) => {
      const total = snap.exists() ? (snap.data().total || 0) : 0;
      renderButton(btn, total, btn.classList.contains('liked'));
    },
    (err) => console.error(`[likes] falha ao escutar total de "${id}":`, err)
  );
  unsubscribers.set(id, unsub);
}

/**
 * Inicializa todos os botões .btn-like com data-like-id dentro do documento.
 * Pode ser chamado múltiplas vezes (idempotente — não duplica listeners).
 */
function initLikes() {
  const start = () => {
    const buttons = document.querySelectorAll('.btn-like[data-like-id]');
    buttons.forEach(btn => {
      if (btn.dataset.likeInit) return; // já inicializado
      btn.dataset.likeInit = '1';
      setupButton(btn);
    });
  };

  if (currentUid) {
    start();
  } else {
    // ainda não logou anonimamente — espera e tenta de novo
    const check = setInterval(() => {
      if (currentUid) {
        clearInterval(check);
        start();
      }
    }, 100);
  }
}

signInAnonymously(auth).catch((err) => {
  console.error('Falha no login anônimo do Firebase:', err);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUid = user.uid;
  }
});

// Expõe globalmente, igual antes
window.initLikes = initLikes;