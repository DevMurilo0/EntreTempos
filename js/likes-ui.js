import { initLikes } from './likes.js';

const CSS_URL = '/css/likes-dinamicos.css';
if (!document.querySelector('link[href="' + CSS_URL + '"]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);
}

/**
 * Uma publicação = um identificador estável. Não use índices, pois as obras
 * podem ser reorganizadas pelo pesquisador sem perder as curtidas.
 */
export function criarBotaoCurtida(id, tipo = 'publicação') {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'btn-like et-like-dinamico';
  botao.dataset.likeId = id;
  botao.dataset.likeLabel = 'Curtir ' + tipo;
  botao.dataset.unlikeLabel = 'Remover curtida de ' + tipo;
  botao.setAttribute('aria-label', botao.dataset.likeLabel);
  botao.setAttribute('aria-pressed', 'false');

  const icone = document.createElement('span');
  icone.className = 'like-icon';
  icone.textContent = '♡';
  icone.setAttribute('aria-hidden', 'true');

  const contagem = document.createElement('span');
  contagem.className = 'like-count';
  contagem.textContent = '0';

  botao.append(icone, contagem);
  return botao;
}

/** Para as galerias geradas por Firestore, sem duplicar listeners. */
export function ativarCurtidas() {
  queueMicrotask(initLikes);
}
