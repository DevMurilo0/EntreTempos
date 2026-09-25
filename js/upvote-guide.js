(() => {
  const contexto = document.documentElement.dataset.upvoteContext || document.body?.dataset.upvoteContext || '';
  if (!contexto) return;

  const chave = `entretempos:upvote-intro:${contexto}:v1`;

  try {
    if (localStorage.getItem(chave) === '1') return;
  } catch {}

  const textos = {
    musicas: 'Vote nas músicas que você gosta!',
    livros: 'Vote nos livros que você gosta!',
    filmes: 'Vote nos filmes que você gosta!'
  };

  const mensagem = textos[contexto] || 'Vote nos conteúdos que você gosta!';
  const seletor = '.btn-upvote, .voto-btn';

  let guia = null;
  let observer = null;
  let raf = 0;
  let iniciado = false;

  function alvoVisual(botao) {
    return botao.closest('.voto-coluna') || botao;
  }

  function visivel(el) {
    const r = el.getBoundingClientRect();
    return (
      r.width > 0 &&
      r.height > 0 &&
      r.bottom > 24 &&
      r.top < window.innerHeight - 24 &&
      r.right > 0 &&
      r.left < window.innerWidth
    );
  }

  function criarAlvo(original) {
    const r = original.getBoundingClientRect();
    const wrap = document.createElement('div');
    wrap.className = 'et-upvote-guide__alvo';

    const largura = Math.max(r.width + 8, 50);
    const altura = Math.max(r.height + 8, 50);

    wrap.style.left = `${Math.max(6, r.left - 4)}px`;
    wrap.style.top = `${Math.max(6, r.top - 4)}px`;
    wrap.style.width = `${largura}px`;
    wrap.style.height = `${altura}px`;

    const clone = original.cloneNode(true);
    clone.removeAttribute('id');
    clone.disabled = true;
    clone.setAttribute('aria-hidden', 'true');
    clone.tabIndex = -1;
    wrap.appendChild(clone);

    return wrap;
  }

  function atualizarAlvos() {
    if (!guia) return;

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (!guia) return;

      const container = guia.querySelector('.et-upvote-guide__alvos');
      if (!container) return;

      const botoes = [...document.querySelectorAll(seletor)]
        .map(alvoVisual)
        .filter((el, indice, lista) => lista.indexOf(el) === indice)
        .filter(visivel);

      container.replaceChildren(...botoes.map(criarAlvo));
    });
  }

  function fechar() {
    if (!guia) return;

    try {
      localStorage.setItem(chave, '1');
    } catch {}

    observer?.disconnect();
    window.removeEventListener('resize', atualizarAlvos);
    window.removeEventListener('scroll', atualizarAlvos, true);

    guia.classList.add('is-saindo');
    const atual = guia;
    guia = null;

    setTimeout(() => atual.remove(), 240);
  }

  function mostrar() {
    if (iniciado || guia) return;

    const botoes = [...document.querySelectorAll(seletor)].filter(visivel);
    if (!botoes.length) return;

    iniciado = true;

    guia = document.createElement('div');
    guia.className = 'et-upvote-guide';
    guia.setAttribute('role', 'dialog');
    guia.setAttribute('aria-modal', 'true');
    guia.setAttribute('aria-label', 'Como votar');

    guia.innerHTML = `
      <div class="et-upvote-guide__backdrop" aria-hidden="true"></div>
      <div class="et-upvote-guide__alvos" aria-hidden="true"></div>
      <div class="et-upvote-guide__mensagem">
        <strong>${mensagem}</strong>
        <button type="button">Entendi</button>
      </div>
    `;

    document.body.appendChild(guia);
    atualizarAlvos();

    guia.querySelector('button')?.addEventListener('click', fechar);
    guia.querySelector('.et-upvote-guide__backdrop')?.addEventListener('click', fechar);

    window.addEventListener('resize', atualizarAlvos);
    window.addEventListener('scroll', atualizarAlvos, true);
  }

  function observar() {
    observer = new MutationObserver(() => {
      if (document.querySelector(seletor)) verificarViewport();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener('scroll', verificarViewport, { passive: true });
    window.addEventListener('resize', verificarViewport);

    verificarViewport();
  }

  let timerViewport = 0;
  function verificarViewport() {
    clearTimeout(timerViewport);
    timerViewport = setTimeout(() => {
      if (iniciado) return;

      const temVisivel = [...document.querySelectorAll(seletor)].some(visivel);
      if (!temVisivel) return;

      window.removeEventListener('scroll', verificarViewport);
      window.removeEventListener('resize', verificarViewport);
      observer?.disconnect();
      mostrar();
    }, 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observar, { once: true });
  } else {
    observar();
  }
})();
