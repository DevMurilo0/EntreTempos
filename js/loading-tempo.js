const STYLE_ID = 'et-loading-tempo-style';

let overlayAtual = null;
let referenciasAtivas = 0;
let encerrando = false;

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

function garantirOverlay(texto) {
  garantirEstilo();

  if (!overlayAtual || !overlayAtual.isConnected) {
    overlayAtual = document.createElement('div');
    overlayAtual.className = 'et-loading-tempo';
    overlayAtual.innerHTML = `
      <div class="et-loading-tempo__papel" role="status" aria-live="polite">
        <img src="/img/amp.png" alt="" aria-hidden="true">
        <strong>Entre Tempos</strong>
        <span></span>
      </div>
    `;
    document.body.appendChild(overlayAtual);
    encerrando = false;
  }

  const span = overlayAtual.querySelector('.et-loading-tempo__papel span');
  if (span) span.textContent = texto;

  return overlayAtual;
}

function encerrarOverlay() {
  if (!overlayAtual || encerrando) return;
  encerrando = true;

  const alvo = overlayAtual;
  alvo.classList.add('is-saindo');

  setTimeout(() => {
    alvo.remove();
    if (overlayAtual === alvo) overlayAtual = null;
    encerrando = false;
  }, 320);
}

export function criarLoadingEntreTempos(texto = 'carregando o tempo...') {
  garantirOverlay(texto);
  referenciasAtivas += 1;

  let finalizado = false;

  return {
    remover() {
      if (finalizado) return;
      finalizado = true;
      referenciasAtivas = Math.max(0, referenciasAtivas - 1);

      if (referenciasAtivas === 0) {
        encerrarOverlay();
      }
    },

    erro(mensagem = 'Não foi possível atualizar agora.') {
      if (finalizado) return;

      const span = overlayAtual?.querySelector('.et-loading-tempo__papel span');
      if (span) span.textContent = mensagem;

      finalizado = true;
      referenciasAtivas = Math.max(0, referenciasAtivas - 1);

      if (referenciasAtivas === 0) {
        setTimeout(() => encerrarOverlay(), 850);
      }
    }
  };
}
