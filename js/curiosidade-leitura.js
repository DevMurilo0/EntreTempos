import { db } from '/js/firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const parametros = new URLSearchParams(location.search);
const secao = parametros.get('secao') === 'curiosidades' ? 'curiosidades' : 'curiosidades-gerais';
const legadoId = parametros.get('id');
const pessoaId = parametros.get('pessoa');
const conteudoId = parametros.get('conteudo');

const leitura = document.querySelector('[data-leitura]');
const estado = document.querySelector('[data-estado]');
const voltar = document.querySelector('[data-voltar]');
voltar.href = secao === 'curiosidades'
  ? '/topicos/curiosidades/autorais/autorais.html'
  : '/topicos/curiosidades/gerais/gerais.html';

carregar();

async function carregar() {
  try {
    let dados;
    let pessoa = {};

    if (legadoId) {
      const snapshot = await getDoc(doc(
        db, 'participantesAutorais', '_legados', 'conteudos', `${secao}--${legadoId}`
      ));
      if (!snapshot.exists() || snapshot.data().ativo === false || snapshot.data().removido === true) {
        throw new Error('Conteúdo não encontrado.');
      }
      dados = snapshot.data();
    } else if (pessoaId && conteudoId) {
      const [pessoaSnapshot, conteudoSnapshot] = await Promise.all([
        getDoc(doc(db, 'participantesAutorais', pessoaId)),
        getDoc(doc(db, 'participantesAutorais', pessoaId, 'conteudos', conteudoId))
      ]);
      if (!conteudoSnapshot.exists() || conteudoSnapshot.data().ativo === false) {
        throw new Error('Conteúdo não encontrado.');
      }
      pessoa = pessoaSnapshot.exists() ? pessoaSnapshot.data() : {};
      dados = conteudoSnapshot.data();
    } else {
      throw new Error('Link de leitura incompleto.');
    }

    renderizar(dados, pessoa);
  } catch (erro) {
    estado.querySelector('p').textContent = erro.message || 'Não foi possível carregar esta curiosidade.';
  }
}

function renderizar(dados, pessoa) {
  const titulo = dados.titulo || pessoa.nome || 'Curiosidade';
  const descricao = dados.descricaoConteudo || dados.descricao || pessoa.descricao || '';
  const texto = dados.texto || dados.conteudo || descricao;
  const imagemUrl = dados.imagemUrl || pessoa.fotoUrl || '/topicos/curiosidades/gerais/img/placeholder-retrato.svg';

  document.title = `${titulo} | Entre Tempos`;
  document.querySelector('meta[name="description"]').content = descricao.slice(0, 160);
  document.querySelector('[data-titulo]').textContent = titulo;
  document.querySelector('[data-resumo]').textContent = descricao;

  const imagem = document.querySelector('[data-imagem]');
  imagem.src = imagemUrl;
  imagem.alt = titulo;

  const textoEl = document.querySelector('[data-texto]');
  const paragrafos = String(texto).split(/\n{2,}/).filter(Boolean);
  textoEl.replaceChildren(...(paragrafos.length ? paragrafos : ['Conteúdo em atualização.']).map((trecho) => {
    const paragrafo = document.createElement('p');
    paragrafo.textContent = trecho;
    return paragrafo;
  }));

  if (dados.videoUrl) {
    const video = document.querySelector('[data-video]');
    video.src = dados.videoUrl;
    document.querySelector('[data-video-wrap]').hidden = false;
  }

  estado.remove();
  leitura.hidden = false;
}
