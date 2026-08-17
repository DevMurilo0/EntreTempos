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
 * No HTML:
 *   <script type="module" src="js/likes.js"></script>
 *
 * initLikes() continua disponível globalmente (window.initLikes).
 *
 * ── VERSÃO REESCRITA (mais simples, de propósito) ──
 * A versão anterior usava uma collection group query em lote pra
 * descobrir "quais posts o usuário já curtiu" de uma vez só. Isso
 * exige um índice composto no Firestore e regras específicas pra
 * collection group — se qualquer um dos dois não estiver certo, a
 * busca falha silenciosamente e a página "esquece" as curtidas a
 * cada reload.
 *
 * Essa versão troca isso por uma verificação simples e direta POR
 * BOTÃO: um getDoc (curtiu?) e um onSnapshot (total em tempo real)
 * por id. Mais chamadas ao Firestore, mas cada uma é um doc único —
 * não depende de índice composto nem de regra de collection group.
 * Pra um site com algumas dezenas de curtidas por página isso não
 * é problema de performance nenhum.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc,
  updateDoc, increment, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged,
  setPersistence, browserLocalPersistence
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
let resolveUidReady;
const uidReady = new Promise((resolve) => { resolveUidReady = resolve; });

// ids que já têm um onSnapshot ativo (evita duplicar listener se
// initLikes() for chamado de novo pra conteúdo dinâmico)
const idsComListener = new Set();

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

  const state = btn._likeState;
  const wasLiked = state.liked;
  const nextLiked = !wasLiked;

  // atualização otimista: reage na hora, sem esperar o Firestore
  state.liked = nextLiked;
  state.total = Math.max(0, state.total + (nextLiked ? 1 : -1));
  renderButton(btn, state.total, nextLiked);
  if (nextLiked) bump(btn);

  const uRef = userLikeRef(id, currentUid);
  const pRef = postRef(id);

  try {
    if (!nextLiked) {
      // descurtir
      await deleteDoc(uRef);
      await updateDoc(pRef, { total: increment(-1) }).catch(() => {
        // se o post ainda não existe por algum motivo, ignora
      });
    } else {
      // curtir — verifica antes se já existe pra nunca contar 2x
      const jaCurtiu = await getDoc(uRef);
      if (!jaCurtiu.exists()) {
        await setDoc(uRef, { curtiuEm: Date.now() });
        const postSnap = await getDoc(pRef);
        if (!postSnap.exists()) {
          await setDoc(pRef, { total: 1 });
        } else {
          await updateDoc(pRef, { total: increment(1) });
        }
      }
    }
  } catch (err) {
    console.error('[likes] erro ao curtir/descurtir:', id, err);
    // deu erro de verdade: desfaz a atualização otimista
    state.liked = wasLiked;
    state.total = Math.max(0, state.total + (wasLiked ? 1 : -1));
    renderButton(btn, state.total, wasLiked);
  } finally {
    delete btn.dataset.animating;
    btn.disabled = false;
  }
}

/**
 * Confere no Firestore se o usuário atual já curtiu esse id específico
 * (um getDoc simples — sem query, sem índice composto necessário).
 */
async function carregarEstadoInicial(btn, id) {
  const uRef = userLikeRef(id, currentUid);
  try {
    const snap = await getDoc(uRef);
    btn._likeState.liked = snap.exists();
  } catch (err) {
    console.error('[likes] falha ao checar curtida do usuário:', id, err);
    btn._likeState.liked = false;
  }
  renderButton(btn, btn._likeState.total, btn._likeState.liked);
}

/**
 * Abre um listener em tempo real no total daquele post específico.
 */
function escutarTotal(id) {
  if (idsComListener.has(id)) return;
  idsComListener.add(id);

  onSnapshot(
    postRef(id),
    (snap) => {
      const total = snap.exists() ? (snap.data().total || 0) : 0;
      document.querySelectorAll(`.btn-like[data-like-id="${CSS.escape(id)}"]`)
        .forEach((btn) => {
          if (!btn._likeState) return;
          btn._likeState.total = total;
          renderButton(btn, total, btn._likeState.liked);
        });
    },
    (err) => console.error('[likes] falha ao escutar total:', id, err)
  );
}

function registrarBotao(btn) {
  const id = btn.dataset.likeId;

  btn._likeState = { liked: false, total: 0 };

  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // não propaga pro card (lightbox etc.)
    handleClick(btn, id);
  });

  uidReady.then(async () => {
    await carregarEstadoInicial(btn, id);
    escutarTotal(id);
  });
}

/**
 * Inicializa todos os botões .btn-like com data-like-id dentro do documento.
 * Pode ser chamado múltiplas vezes (idempotente — não duplica listeners).
 */
function initLikes() {
  const buttons = Array.from(document.querySelectorAll('.btn-like[data-like-id]'))
    .filter((btn) => !btn.dataset.likeInit);

  if (buttons.length === 0) return;

  buttons.forEach((btn) => {
    btn.dataset.likeInit = '1';
    registrarBotao(btn);
  });
}

setPersistence(auth, browserLocalPersistence)
  .catch((err) => console.warn('[likes] não deu pra fixar persistência local:', err))
  .finally(() => {
    signInAnonymously(auth).catch((err) => {
      console.error('Falha no login anônimo do Firebase:', err);
    });
  });

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUid = user.uid;
    resolveUidReady();
  }
});

// Expõe globalmente, igual antes
window.initLikes = initLikes;