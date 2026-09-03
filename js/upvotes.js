/**
 * upvotes.js — Entre Tempos
 * Sistema de upvotes (estilo Reddit — só seta pra cima) compartilhado
 * via Firebase Firestore. Feito pra listas "TOP 5 / TOP 10" (Filmes,
 * Músicas, Livros): quem tem mais upvotes sobe pro topo da lista.
 *
 * Segue o mesmo esquema do likes.js (mesmo projeto Firebase, mesmo
 * jeito de identificar visitante com login anônimo), só que aqui cada
 * item tem uma coleção separada ('upvotes') porque a regra de negócio
 * é diferente: like é "múltiplos podem existir por página", upvote
 * aqui é usado pra ORDENAR uma lista.
 *
 * Cada item precisa de um `id` de texto único no site inteiro —
 * mesma convenção do likes.js: tipo + nome, ex: "filme-interestelar".
 *
 * Uso típico dentro do JS de uma página (filmes.js, musicas.js...):
 *
 *   import { escutarUpvotes, alternarUpvote, jaVotou } from '../../js/upvotes.js';
 *
 *   // pra cada item da lista, ao montar a página:
 *   votadoAtual[id] = await jaVotou(id);
 *   escutarUpvotes(id, (total) => { totais[id] = total; render(); });
 *
 *   // no clique do botão de seta:
 *   const votou = await alternarUpvote(id);
 *
 * O HTML do botão (o resto do JS monta isso dinamicamente nas
 * páginas de lista, não precisa escrever fixo):
 *   <button class="btn-upvote" data-upvote-id="filme-interestelar" aria-label="Votar">
 *     <span class="upvote-seta">▲</span>
 *     <span class="upvote-total">0</span>
 *   </button>
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

// Mesmo projeto Firebase do likes.js — a apiKey pública não é segredo,
// quem protege os dados de verdade são as regras do Firestore.
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

setPersistence(auth, browserLocalPersistence)
  .catch((err) => console.warn('[upvotes] não deu pra fixar persistência local:', err))
  .finally(() => {
    signInAnonymously(auth).catch((err) => {
      console.error('[upvotes] falha no login anônimo do Firebase:', err);
    });
  });

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUid = user.uid;
    resolveUidReady();
  }
});

function postRef(id) {
  return doc(db, 'upvotes', id);
}
function userVoteRef(id, uid) {
  return doc(db, 'upvotes', id, 'usuarios', uid);
}

// id -> função de cancelar o listener (evita duplicar onSnapshot se
// a página chamar escutarUpvotes de novo pro mesmo id)
const listenersAtivos = new Map();

/**
 * Escuta em tempo real o total de upvotes de um id. callback(total) é
 * chamado toda vez que o total mudar (o próprio voto ou de outra
 * pessoa). Retorna uma função pra cancelar esse listener específico.
 */
export function escutarUpvotes(id, callback) {
  if (listenersAtivos.has(id)) {
    listenersAtivos.get(id)();
    listenersAtivos.delete(id);
  }

  const unsub = onSnapshot(
    postRef(id),
    (snap) => callback(snap.exists() ? (snap.data().total || 0) : 0),
    (err) => console.error('[upvotes] falha ao escutar total:', id, err)
  );

  listenersAtivos.set(id, unsub);
  return unsub;
}

/** Cancela todos os listeners ativos (chame se sair de vez da página). */
export function pararTodosListeners() {
  listenersAtivos.forEach((unsub) => unsub());
  listenersAtivos.clear();
}

/** Confere se o usuário atual já votou nesse id específico. */
export async function jaVotou(id) {
  await uidReady;
  try {
    const snap = await getDoc(userVoteRef(id, currentUid));
    return snap.exists();
  } catch (err) {
    console.error('[upvotes] falha ao checar voto:', id, err);
    return false;
  }
}

/**
 * Alterna o voto do usuário atual: vota se ainda não tinha votado,
 * remove o voto se já tinha (igual a seta do Reddit "desligando" ao
 * clicar de novo). Retorna o novo estado (true = votou, false =
 * removeu o voto).
 */
export async function alternarUpvote(id) {
  await uidReady;
  const uRef = userVoteRef(id, currentUid);
  const pRef = postRef(id);

  const jaVotouAntes = (await getDoc(uRef)).exists();

  if (jaVotouAntes) {
    await deleteDoc(uRef);
    await updateDoc(pRef, { total: increment(-1) }).catch(() => {
      // se o doc do post já não existir por algum motivo, ignora
    });
    return false;
  }

  await setDoc(uRef, { votouEm: Date.now() });
  const postSnap = await getDoc(pRef);
  if (!postSnap.exists()) {
    await setDoc(pRef, { total: 1 });
  } else {
    await updateDoc(pRef, { total: increment(1) });
  }
  return true;
}

/** Promise que resolve quando o login anônimo terminar. */
export function uidPronto() {
  return uidReady;
}
