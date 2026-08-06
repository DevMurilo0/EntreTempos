/**
 * likes.js — Entre Tempos
 * Sistema de curtidas local via localStorage.
 *
 * Uso:
 *   <button class="btn-like" data-like-id="julio-desenho-1" aria-label="Curtir">
 *     <span class="like-icon">♡</span>
 *     <span class="like-count">0</span>
 *   </button>
 *
 *   initLikes();  // chama após o DOM carregar
 */

(function () {
  'use strict';

  const KEY_COUNT = (id) => `et_like_count__${id}`;
  const KEY_ME    = (id) => `et_like_me__${id}`;

  function getCount(id) {
    return parseInt(localStorage.getItem(KEY_COUNT(id)) || '0', 10);
  }
  function setCount(id, n) {
    localStorage.setItem(KEY_COUNT(id), String(Math.max(0, n)));
  }
  function hasLiked(id) {
    return localStorage.getItem(KEY_ME(id)) === '1';
  }
  function setLiked(id, val) {
    localStorage.setItem(KEY_ME(id), val ? '1' : '0');
  }

  function updateButton(btn, id) {
    const liked = hasLiked(id);
    const count = getCount(id);
    const icon  = btn.querySelector('.like-icon');
    const label = btn.querySelector('.like-count');

    if (icon)  icon.textContent  = liked ? '♥' : '♡';
    if (label) label.textContent = count;

    btn.classList.toggle('liked', liked);
    btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
  }

  function handleClick(btn, id) {
    if (btn.dataset.animating) return;
    btn.dataset.animating = '1';

    const liked = hasLiked(id);
    const count = getCount(id);

    if (liked) {
      setLiked(id, false);
      setCount(id, count - 1);
    } else {
      setLiked(id, true);
      setCount(id, count + 1);
    }

    updateButton(btn, id);

    // animação de bounce
    btn.classList.add('like-bump');
    btn.addEventListener('animationend', () => {
      btn.classList.remove('like-bump');
      delete btn.dataset.animating;
    }, { once: true });
  }

  /**
   * Inicializa todos os botões .btn-like com data-like-id dentro do documento.
   * Pode ser chamado múltiplas vezes (idempotente — não duplica listeners).
   */
  function initLikes() {
    const buttons = document.querySelectorAll('.btn-like[data-like-id]');
    buttons.forEach(btn => {
      if (btn.dataset.likeInit) return; // já inicializado
      btn.dataset.likeInit = '1';

      const id = btn.dataset.likeId;
      updateButton(btn, id); // estado inicial

      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // não propaga para o card (lightbox etc.)
        handleClick(btn, id);
      });
    });
  }

  // Expõe globalmente
  window.initLikes = initLikes;
})();
