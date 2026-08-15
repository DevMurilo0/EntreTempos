/**
 * podcast-data.js — Entre Tempos
 * Leitura pública da coleção "podcasts" no Firestore, usada pela seção
 * de Podcast (listagem + página de episódio).
 *
 * Reaproveita o MESMO projeto/app Firebase já usado pelo sistema de
 * curtidas (js/likes.js) — não é um segundo projeto, é só um segundo
 * módulo lendo do mesmo Firestore. Se algum dia esta página também
 * precisar de curtidas, dá pra importar likes.js junto sem conflito:
 * o getApps()/getApp() abaixo evita o erro de "app já inicializado".
 *
 * Não usa Auth Anônima — a leitura dos episódios é pública (ver regra
 * do Firestore em docs-entretempos/08-podcast-cloudinary-firestore.md),
 * diferente das curtidas, que precisam saber "quem curtiu".
 *
 * Cada vídeo mora na Cloudinary (CDN); aqui só lemos os METADADOS
 * (título, descrição, URL do vídeo, thumbnail etc.) — nunca o vídeo em si.
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCC_MH5a5WvD602F9Y7JnAzYpJow3i1axA",
  authDomain: "entretempos-27471.firebaseapp.com",
  projectId: "entretempos-27471",
  storageBucket: "entretempos-27471.firebasestorage.app",
  messagingSenderId: "448383791330",
  appId: "1:448383791330:web:b19cafc6ce5311292c6ebb"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const NOME_COLECAO = "podcasts";

/**
 * Busca todos os episódios, ordenados pelo campo "ordem" (crescente).
 * Retorna [] em caso de erro (a UI decide o que mostrar) — nunca lança.
 */
export async function listarEpisodios() {
  try {
    const q = query(collection(db, NOME_COLECAO), orderBy("ordem", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("[podcast-data] falha ao listar episódios:", err);
    return null; // null = erro (diferente de [] = lista vazia de verdade)
  }
}

/**
 * Busca um episódio específico pelo id do documento (ex: "episodio-01").
 * Retorna null se não existir OU se der erro.
 */
export async function buscarEpisodio(id) {
  if (!id) return null;
  try {
    const ref = doc(db, NOME_COLECAO, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error("[podcast-data] falha ao buscar episódio:", err);
    return null;
  }
}
