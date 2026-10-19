const STYLE_ID = 'et-loading-tempo-style';

let overlayAtual = null;
let referenciasAtivas = 0;
let encerrando = false;
let timerAparicao = null;
let timerSaida = null;

function garantirEstilo() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .et-loading-tempo {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity .2s ease, visibility .2s ease;
    }

    .et-loading-tempo.is-visivel {
      opacity: 1;
      visibility: visible;
    }

    .et-loading-tempo.is-saindo {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .et-loading-tempo__papel {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      max-width: calc(100vw - 36px);
      text-align: left;
      color: #3e3228;
      background: #fffaf0;
      border-left: 5px solid #9b3e3e;
      box-shadow: 8px 12px 28px rgba(50,30,15,.18);
      font-family: 'Special Elite', serif;
    }

    .et-loading-tempo__papel img {
      display: block;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      margin: 0;
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
      margin-bottom: 0;
      font-size: 14px;
      letter-spacing: 2px;
    }

    .et-loading-tempo__papel span {
      color: #7a6a50;
      font-size: 11px;
      letter-spacing: .3px;
    }

    @keyframes etLoadingTempoAmp {
      from { transform: translateY(0) rotate(-2deg); }
      to { transform: translateY(-5px) rotate(2deg); }
    }

    @media (prefers-reduced-motion: reduce) {      /* A transição nunca deve bloquear interação. */

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
  if (timerSaida !== null) {
    clearTimeout(timerSaida);
    timerSaida = null;
    encerrando = false;
    overlayAtual.classList.remove('is-saindo');
  }
  clearTimeout(timerAparicao);
  timerAparicao = setTimeout(() => {
    if (overlayAtual && referenciasAtivas > 0) {
      overlayAtual.classList.add('is-visivel');
    }
  }, 240);

  const span = overlayAtual.querySelector('.et-loading-tempo__papel span');
  if (span) span.textContent = texto;

  return overlayAtual;
}

function encerrarOverlay() {
  if (!overlayAtual || encerrando) return;
  encerrando = true;
  clearTimeout(timerAparicao);
  timerAparicao = null;

  const alvo = overlayAtual;
  alvo.classList.remove('is-visivel');
  alvo.classList.add('is-saindo');

  timerSaida = setTimeout(() => {
    if (referenciasAtivas === 0) {
      alvo.remove();
      if (overlayAtual === alvo) overlayAtual = null;
    }
    timerSaida = null;
    encerrando = false;
  }, 220);
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
