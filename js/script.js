// ===================================
// script.js - Entre Tempos
// o cerebro da pagina inicial
// sem framework, sem frescura, vanilla JS raiz
// ===================================

// slide atual do carrossel
let index = 0;

const slides = document.querySelector('.slides');
const totalSlides = document.querySelectorAll('.slide').length;

// autoplay do carrossel - troca de banner a cada 4 segundos
// se ninguem clicar ele fica rodando sozinho feliz da vida
let autoplay = setInterval(nextSlide, 4000);
let autoplayAtivo = true;
let pauseTimeout;

// vai pro slide N (com loop, pq ninguem quer erro de index)
function goToSlide(n) {
  index = (n + totalSlides) % totalSlides;
  slides.style.transform = `translateX(-${index * 100}%)`;
}

// proximo slide - simples assim
function nextSlide() {
  goToSlide(index + 1);
}

// slide anterior - tbm simples
function prevSlide() {
  goToSlide(index - 1);
}

// pausa o autoplay quando o usuario clica na seta
// depois de 7 segundos volta a rodar sozinho
// pq a gente respeita a vontade do usuario mas nem tanto kkk
function pausarAutoplay() {
  clearInterval(autoplay);
  autoplayAtivo = false;

  clearTimeout(pauseTimeout);

  pauseTimeout = setTimeout(() => {
    autoplay = setInterval(nextSlide, 4000);
    autoplayAtivo = true;
  }, 7000);
}

// seta pra frente
document.querySelector('.next').addEventListener('click', () => {
  nextSlide();
  pausarAutoplay();
});

// seta pra tras
document.querySelector('.prev').addEventListener('click', () => {
  prevSlide();
  pausarAutoplay();
});

// quando a pagina carrega...
window.addEventListener('load', function() {

  // limita o scroll pra nao passar da ultima secao
  // isso aqui evita aquele scroll infinito pro vazio
  const limitarScroll = () => {
    const organizadores = document.querySelector('.organizadores');
    const acessoFolha = document.querySelector('.acesso-folha');
    if (organizadores && acessoFolha) {
      const maxScroll = acessoFolha.offsetTop + acessoFolha.offsetHeight - window.innerHeight;
      if (window.scrollY > maxScroll) {
        window.scrollTo(0, maxScroll);
      }
    }
  };
  window.addEventListener('scroll', limitarScroll);

  // AMPULHETA GIRATÓRIA
  // clica e ela gira 180° - easter egg bonitinho
  // Davi sugeriu isso e ficou mto bom na moral
  const ampulheta = document.querySelector('.ampulheta');
  let graus = 0;
  let tocando = false;

  // no celular (touch) - previne o click fantasma
  ampulheta.addEventListener('touchend', function(e) {
    e.preventDefault();
    tocando = true;
    graus += 180;
    ampulheta.style.transition = 'transform 0.5s ease';
    ampulheta.style.transform = `rotate(${graus}deg)`;
    setTimeout(() => { tocando = false; }, 300);
  }, { passive: false });

  // no PC (click)
  ampulheta.addEventListener('click', function() {
    if (tocando) return; // ignora se acabou de tocar
    graus += 180;
    ampulheta.style.transition = 'transform 0.5s ease';
    ampulheta.style.transform = `rotate(${graus}deg)`;
  });
});
