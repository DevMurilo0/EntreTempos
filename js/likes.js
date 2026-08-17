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
 * Importante: este arquivo é um módulo ES. No HTML, use:
 *   <script type="module" src="js/likes.js"></script>
 *
 * initLikes() continua disponível globalmente (window.initLikes), então
 * qualquer chamada manual que você já tenha (ex: depois de abrir um lightbox
 * com conteúdo dinâmico) continua funcionando igual — inclusive pra botões
 * que aparecem na página DEPOIS da carga inicial.
 *
 * ── O QUE MUDOU NESSA VERSÃO (performance) ──
 * Antes: cada botão fazia sua própria leitura (getDoc) pra saber se você já
 * curtiu, e abria seu próprio listener (onSnapshot) pra saber o total. Numa
 * página com 8 desenhos, isso virava 16 idas e vindas ao servidor.
 *
 * Agora:
 *   1. UMA única consulta (collection group) descobre de uma vez só TODOS
 *      os posts que você já curtiu, em qualquer página do site.
 *   2. UM único listener por página escuta os totais de todos os botões
 *      visíveis ao mesmo tempo (query com "in", em lotes de até 30 ids).
 *   3. Cache offline habilitado — na segunda visita, os números aparecem
 *      na hora, vindos do cache local, enquanto sincroniza em segundo plano.
 *
 * ── SETUP NECESSÁRIO NO FIRESTORE (só uma vez) ──
 * Na primeira vez que a collection group query rodar, o Firestore vai
 * lançar um erro no console do navegador com um link pra criar o índice
 * composto necessário. É só abrir o link e clicar em "criar índice" —
 * leva menos de um minuto pra ficar pronto.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  initializeFirestore, doc, getDoc, setDoc, deleteDoc,
  updateDoc, increment, onSnapshot,
  collection, collectionGroup, query, where, documentId, getDocs,
  persistentLocalCache, persistentSingleTabManager
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

// Cache offline: recarrega do disco local antes de bater no servidor.
// Se o navegador não suportar (aba anônima restrita, etc.), cai pro
// comportamento padrão sem quebrar nada.
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
  });
} catch (err) {
  console.warn('[likes] cache offline indisponível, seguindo sem ele:', err);
  const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  db = getFirestore(app);
}

const auth = getAuth(app);

let currentUid = null;
let resolveUidReady;
const uidReady = new Promise((resolve) => { resolveUidReady = resolve; });

// registro global: id do post -> conjunto de botões que o representam
// (normalmente 1 botão por id, mas suporta duplicados sem problema)
const buttonsByPostId = new Map();
// ids cujos totais já têm um listener ativo (evita duplicar onSnapshot)
const idsComListener = new Set();
// preenchido uma única vez com os posts que o usuário já curtiu
let likedIdsDoUsuario = null;
let buscaCurtidasEmAndamento = null;

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

function renderTodosOsBotoesDoId(id) {
  const botoes = buttonsByPostId.get(id);
  if (!botoes) return;
  botoes.forEach((btn) => {
    const state = btn._likeState;
    if (!state) return;
    renderButton(btn, state.total, state.liked === null ? false : state.liked);
  });
}

async function handleClick(btn, id) {
  if (btn.dataset.animating || !currentUid) return;
  btn.dataset.animating = '1';
  btn.disabled = true;

  const state = btn._likeState;
  const wasLiked = state && state.liked !== null ? state.liked : btn.classList.contains('liked');
  const nextLiked = !wasLiked;

  // atualização otimista: destaca/desmarca na hora, sem esperar o Firestore
  if (state) {
    state.liked = nextLiked;
    state.total = Math.max(0, state.total + (nextLiked ? 1 : -1));
    renderButton(btn, state.total, nextLiked);
  } else {
    renderButton(btn, 0, nextLiked);
  }
  if (nextLiked) bump(btn);

  try {
    const uRef = userLikeRef(id, currentUid);
    const pRef = postRef(id);

    if (!nextLiked) {
      // descurtir
      await deleteDoc(uRef);
      await updateDoc(pRef, { total: increment(-1) }).catch(() => {
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
      // grava o uid como campo (além do id do documento) — é o que permite
      // a consulta em lote "quais posts esse uid já curtiu" funcionar
      await setDoc(uRef, { curtiuEm: Date.now(), uid: currentUid });
    }
  } catch (err) {
    console.error('Erro ao curtir:', err);
    // deu erro de verdade: desfaz a atualização otimista
    if (state) {
      state.liked = wasLiked;
      state.total = Math.max(0, state.total + (wasLiked ? 1 : -1));
      renderButton(btn, state.total, wasLiked);
    }
  } finally {
    delete btn.dataset.animating;
    btn.disabled = false;
  }
}

/**
 * Busca UMA vez (não por botão) todos os ids de posts que o uid atual
 * já curtiu, em qualquer parte do site, usando uma collection group query.
 * Resultado fica guardado em cache (likedIdsDoUsuario) pro resto da sessão.
 */
async function garantirLikedIdsDoUsuario() {
  if (likedIdsDoUsuario) return likedIdsDoUsuario;
  if (buscaCurtidasEmAndamento) return buscaCurtidasEmAndamento;

  buscaCurtidasEmAndamento = (async () => {
    try {
      const q = query(collectionGroup(db, 'usuarios'), where('uid', '==', currentUid));
      const snap = await getDocs(q);
      const ids = new Set();
      snap.forEach((docSnap) => {
        // path: curtidas/{postId}/usuarios/{uid}
        const postId = docSnap.ref.parent.parent?.id;
        if (postId) ids.add(postId);
      });
      likedIdsDoUsuario = ids;
    } catch (err) {
      console.error('[likes debug] FALHOU a busca. code:', err.code, '| message:', err.message, err);
      likedIdsDoUsuario = new Set(); // segue sem travar a página
    }
    console.log('[likes debug] posts que o Firestore acha que este uid já curtiu:', likedIdsDoUsuario ? [...likedIdsDoUsuario] : null);
    return likedIdsDoUsuario;
  })();

  return buscaCurtidasEmAndamento;
}

/**
 * Abre um único listener escutando os totais de vários ids de uma vez
 * (query "in", limite de 30 ids por consulta — divide em lotes se precisar).
 */
function escutarTotaisEmLote(ids) {
  const pendentes = ids.filter((id) => !idsComListener.has(id));
  if (pendentes.length === 0) return;
  pendentes.forEach((id) => idsComListener.add(id));

  const LOTE = 30;
  for (let i = 0; i < pendentes.length; i += LOTE) {
    const grupo = pendentes.slice(i, i + LOTE);
    const q = query(collection(db, 'curtidas'), where(documentId(), 'in', grupo));

    onSnapshot(
      q,
      (snap) => {
        // ids que sumiram do resultado (post sem doc ainda = total 0)
        const vistos = new Set();

        snap.forEach((docSnap) => {
          vistos.add(docSnap.id);
          const total = docSnap.data().total || 0;
          const botoes = buttonsByPostId.get(docSnap.id);
          if (!botoes) return;
          botoes.forEach((btn) => {
            if (btn._likeState) btn._likeState.total = total;
          });
          renderTodosOsBotoesDoId(docSnap.id);
        });

        grupo.forEach((id) => {
          if (vistos.has(id)) return;
          const botoes = buttonsByPostId.get(id);
          if (!botoes) return;
          botoes.forEach((btn) => {
            if (btn._likeState) btn._likeState.total = 0;
          });
          renderTodosOsBotoesDoId(id);
        });
      },
      (err) => console.error('[likes] falha ao escutar totais em lote:', err)
    );
  }
}

function registrarBotao(btn) {
  const id = btn.dataset.likeId;

  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // não propaga pro card (lightbox etc.)
    handleClick(btn, id);
  });

  const state = { liked: null, total: 0 };
  btn._likeState = state;

  if (!buttonsByPostId.has(id)) buttonsByPostId.set(id, new Set());
  buttonsByPostId.get(id).add(btn);
}

/**
 * Inicializa todos os botões .btn-like com data-like-id dentro do documento.
 * Pode ser chamado múltiplas vezes (idempotente — não duplica listeners nem
 * refaz buscas já feitas).
 */
function initLikes() {
  const buttons = Array.from(document.querySelectorAll('.btn-like[data-like-id]'))
    .filter((btn) => !btn.dataset.likeInit);

  if (buttons.length === 0) return;

  buttons.forEach((btn) => {
    btn.dataset.likeInit = '1';
    registrarBotao(btn);
  });

  uidReady.then(async () => {
    const ids = buttons.map((btn) => btn.dataset.likeId);

    // 1 busca única (cacheada) pro "já curtiu?" de todos os ids conhecidos
    const likedIds = await garantirLikedIdsDoUsuario();
    buttons.forEach((btn) => {
      const state = btn._likeState;
      if (state) state.liked = likedIds.has(btn.dataset.likeId);
      renderButton(btn, state ? state.total : 0, state ? !!state.liked : false);
    });

    // 1 listener (em lotes de até 30) pros totais de todos os ids da página
    escutarTotaisEmLote(ids);
  });
}

signInAnonymously(auth).catch((err) => {
  console.error('Falha no login anônimo do Firebase:', err);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    const uidAnterior = localStorage.getItem('_debug_likes_uid');
    console.log('[likes debug] uid atual:', user.uid, '| uid da visita anterior:', uidAnterior, '| MUDOU?', uidAnterior !== null && uidAnterior !== user.uid);
    localStorage.setItem('_debug_likes_uid', user.uid);

    currentUid = user.uid;
    resolveUidReady();
  }
});

// Expõe globalmente, igual antes
window.initLikes = initLikes;