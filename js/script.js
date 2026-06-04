let index = 0;

const slides = document.querySelector('.slides');
const totalSlides = document.querySelectorAll('.slide').length;

let autoplay = setInterval(nextSlide, 4000);
let autoplayAtivo = true;
let pauseTimeout;

function goToSlide(n) {
  index = (n + totalSlides) % totalSlides;
  slides.style.transform = `translateX(-${index * 100}%)`;
}

function nextSlide() {
  goToSlide(index + 1);
}

function prevSlide() {
  goToSlide(index - 1);
}

function pausarAutoplay() {
  clearInterval(autoplay);
  autoplayAtivo = false;

  clearTimeout(pauseTimeout);

  pauseTimeout = setTimeout(() => {
    autoplay = setInterval(nextSlide, 4000);
    autoplayAtivo = true;
  }, 7000);
}

document.querySelector('.next').addEventListener('click', () => {
  nextSlide();
  pausarAutoplay();
});

document.querySelector('.prev').addEventListener('click', () => {
  prevSlide();
  pausarAutoplay();
});

window.addEventListener('load', function() {
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

  // Ampulheta gira 180° a cada toque/clique
  const ampulheta = document.querySelector('.ampulheta');
  let graus = 0;
  let tocando = false;

  ampulheta.addEventListener('touchend', function(e) {
    e.preventDefault();
    tocando = true;
    graus += 180;
    ampulheta.style.transition = 'transform 0.5s ease';
    ampulheta.style.transform = `rotate(${graus}deg)`;
    setTimeout(() => { tocando = false; }, 300);
  }, { passive: false });

  ampulheta.addEventListener('click', function() {
    if (tocando) return;
    graus += 180;
    ampulheta.style.transition = 'transform 0.5s ease';
    ampulheta.style.transform = `rotate(${graus}deg)`;
  });
});
