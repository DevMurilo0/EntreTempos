let index = 0;
const slides = document.querySelector('.slides');
const totalSlides = document.querySelectorAll('.slide').length;

function nextSlide() {
  index++;
  if (index >= totalSlides) {
    index = 0;
  }
  slides.style.transform = `translateX(-${index * 100}%)`;
}

setInterval(nextSlide, 4000);

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
