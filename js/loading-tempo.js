const STYLE_ID = 'et-loading-tempo-style';

function garantirEstilo() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .et-loading-tempo {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: grid;
      place-items: center;
      padding: 24px;
      background: #f2e8d5;
      background-image: radial-gradient(rgba(104,75,45,.05) 1px, transparent 1px);
      background-size: 5px 5px;
      opacity: 1;
      visibility: visible;
      transition: opacity .28s ease, visibility .28s ease;
    }

    .et-loading-tempo.is-saindo {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .et-loading-tempo__papel {
      min-width: min(88vw, 320px);
      padding: 30px 28px;
      text-align: center;
      color: #3e3228;
      background: #fffaf0;
      border-left: 5px solid #9b3e3e;
      box-shadow: 8px 12px 28px rgba(50,30,15,.18);
      font-family: 'Special Elite', serif;
    }

    .et-loading-tempo__papel img {
      display: block;
      width: clamp(58px, 12vw, 82px);
      height: auto;
      margin: 0 auto 16px;
      object-fit: contain;
      filter: drop-shadow(0 7px 8px rgba(61,42,27,.16));
      transform-origin: center;
      animation: etLoadingTempoAmp 1.35s ease-in-out infinite alternate;
    }

    .et-loading-tempo__papel strong,
    .et-loading-tempo__papel span {
      display: block;
    }

    .et-loading-tempo__papel strong {
      margin-bottom: 8px;
      font-size: 22px;
      letter-spacing: 2px;
    }

    .et-loading-tempo__papel span {
      color: #7a6a50;
      font-size: 13px;
      letter-spacing: 1px;
    }

    @keyframes etLoadingTempoAmp {
      from { transform: translateY(0) rotate(-2deg); }
      to { transform: translateY(-5px) rotate(2deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .et-loading-tempo__papel img {
        animation: none;
      }
    }
  `;

  document.head.appendChild(style);
}

export function criarLoadingEntreTempos(texto = 'carregando o tempo...') {
  garantirEstilo();

  const existente = document.querySelector('.et-loading-tempo');
  if (existente) {
    return {
      remover() {
        existente.classList.add('is-saindo');
        setTimeout(() => existente.remove(), 320);
      },
      erro(mensagem = 'Não foi possível atualizar agora.') {
        const span = existente.querySelector('.et-loading-tempo__papel span');
        if (span) span.textContent = mensagem;
        setTimeout(() => {
          existente.classList.add('is-saindo');
          setTimeout(() => existente.remove(), 320);
        }, 850);
      }
    };
  }

  const overlay = document.createElement('div');
  overlay.className = 'et-loading-tempo';
  overlay.innerHTML = `
    <div class="et-loading-tempo__papel" role="status" aria-live="polite">
      <img src="/img/amp.png" alt="" aria-hidden="true">
      <strong>Entre Tempos</strong>
      <span></span>
    </div>
  `;

  overlay.querySelector('span').textContent = texto;
  document.body.appendChild(overlay);

  let removido = false;

  return {
    remover() {
      if (removido) return;
      removido = true;
      overlay.classList.add('is-saindo');
      setTimeout(() => overlay.remove(), 320);
    },
    erro(mensagem = 'Não foi possível atualizar agora.') {
      if (removido) return;
      const span = overlay.querySelector('.et-loading-tempo__papel span');
      if (span) span.textContent = mensagem;
      setTimeout(() => this.remover(), 850);
    }
  };
}
