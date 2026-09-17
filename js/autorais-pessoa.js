import { auth, db, storage } from '/js/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

const PESQUISADOR_UID = 'QuiQMjtXjOWNW2LCrot86rsHh0F2';
const TEMPO_MAXIMO_SEM_PROGRESSO = 30000;

const CONFIG = {
  poemas: {
    rotulo: 'Poemas autorais',
    conteudo: 'Poemas publicados',
    adicionar: 'Adicionar poema',
    voltar: '/topicos/poemas/autorais/autorais/autorais.html'
  },
  desenhos: {
    rotulo: 'Desenhos autorais',
    conteudo: 'Desenhos publicados',
    adicionar: 'Adicionar desenho',
    voltar: '/topicos/desenhos/autorais/autorais.html'
  },
  musica: {
    rotulo: 'Talento musical',
    conteudo: 'Músicas publicadas',
    adicionar: 'Adicionar música',
    voltar: '/topicos/musica/talento/talento.html'
  },
  curiosidades: {
    rotulo: 'Curiosidades autorais',
    conteudo: 'Curiosidades publicadas',
    adicionar: 'Adicionar curiosidade',
    voltar: '/topicos/curiosidades/autorais/autorais.html'
  }
};

const params = new URLSearchParams(location.search);
const secao = params.get('secao');
const pessoaId = params.get('id');
const novo = params.get('novo') === '1';
const config = CONFIG[secao];

const el = {
  voltar: document.getElementById('et-voltar'),
  rotulo: document.getElementById('et-rotulo-secao'),
  nome: document.getElementById('et-pessoa-nome'),
  descricao: document.getElementById('et-pessoa-descricao'),
  foto: document.getElementById('et-pessoa-foto'),
  tituloConteudos: document.getElementById('et-conteudos-titulo'),
  conteudos: document.getElementById('et-conteudos'),
  mensagem: document.getElementById('et-pagina-mensagem'),
  admin: document.getElementById('et-admin-acoes'),
  btnAdicionar: document.getElementById('et-btn-adicionar-conteudo'),
  btnEditar: document.getElementById('et-btn-editar-pessoa'),
  btnExcluir: document.getElementById('et-btn-excluir-pessoa')
};

if (!config || !pessoaId) {
  falharPagina('Página inválida. Volte para a revista e tente novamente.');
} else {
  iniciar();
}

function iniciar() {
  el.voltar.href = config.voltar;
  el.rotulo.textContent = config.rotulo;
  el.tituloConteudos.textContent = config.conteudo;
  el.btnAdicionar.textContent = `+ ${config.adicionar}`;

  const pessoaRef = doc(db, 'participantesAutorais', pessoaId);
  const conteudosRef = collection(pessoaRef, 'conteudos');

  let dadosPessoa = null;
  let pesquisador = false;
  let abriuNovo = false;
  let documentosConteudo = [];

  onAuthStateChanged(auth, (usuario) => {
    pesquisador = usuario?.uid === PESQUISADOR_UID;
    el.admin.hidden = !pesquisador;
    renderizarConteudos(documentosConteudo, pesquisador);
    tentarAbrirNovo();
  });

  const pararPessoa = onSnapshot(
    pessoaRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        falharPagina('Esta pessoa não existe mais ou foi removida.');
        return;
      }

      dadosPessoa = snapshot.data();

      if (dadosPessoa.secao !== secao) {
        falharPagina('A seção informada não corresponde a esta pessoa.');
        return;
      }

      document.title = `${dadosPessoa.nome || 'Publicação'} | Entre Tempos`;
      el.nome.textContent = dadosPessoa.nome || 'Sem nome';
      el.descricao.textContent = dadosPessoa.descricao || '';
      el.foto.src = dadosPessoa.fotoUrl || '/img/amp.png';
      el.foto.alt = dadosPessoa.nome ? `Foto de ${dadosPessoa.nome}` : 'Foto do participante';

      document.body.classList.add('et-pessoa-carregada');
      el.mensagem.textContent = '';
      tentarAbrirNovo();
    },
    (erro) => {
      console.error('[autorais] Erro ao carregar pessoa:', erro);
      falharPagina('Não foi possível carregar esta página agora.');
    }
  );

  const pararConteudos = onSnapshot(
    conteudosRef,
    (snapshot) => {
      documentosConteudo = snapshot.docs.sort(
        (a, b) => obterMillis(a.data().criadoEm) - obterMillis(b.data().criadoEm)
      );

      renderizarConteudos(documentosConteudo, pesquisador);
    },
    (erro) => {
      console.error('[autorais] Erro ao carregar conteúdos:', erro);
      el.conteudos.replaceChildren(criarAviso('Não foi possível carregar os conteúdos.'));
    }
  );

  el.btnAdicionar.addEventListener('click', () => {
    if (!pesquisador || !dadosPessoa) return;
    abrirModalConteudo(dadosPessoa);
  });

  el.btnEditar.addEventListener('click', () => {
    if (!pesquisador || !dadosPessoa) return;
    abrirModalEditarPessoa(dadosPessoa, pessoaRef);
  });

  el.btnExcluir.addEventListener('click', async () => {
    if (!pesquisador || !dadosPessoa) return;

    const nomePessoa = dadosPessoa.nome || 'esta pessoa';
    const confirmar = window.confirm(
      `Remover ${nomePessoa} e todos os conteúdos cadastrados pelo sistema?`
    );

    if (!confirmar) return;

    el.btnExcluir.disabled = true;

    try {
      const snapshot = await getDocs(conteudosRef);

      for (const item of snapshot.docs) {
        const dados = item.data();
        await apagarArquivosDoConteudo(dados);
        await deleteDoc(item.ref);
      }

      if (dadosPessoa.fotoPath) {
        await deleteObject(ref(storage, dadosPessoa.fotoPath)).catch(() => {});
      }

      await deleteDoc(pessoaRef);
      location.replace(config.voltar);
    } catch (erro) {
      console.error('[autorais] Erro ao remover pessoa:', erro);
      alert('Não foi possível remover agora. Confira sua conexão e as permissões do Firebase.');
      el.btnExcluir.disabled = false;
    }
  });

  function tentarAbrirNovo() {
    if (!novo || abriuNovo || !pesquisador || !dadosPessoa) return;

    abriuNovo = true;

    history.replaceState(
      {},
      '',
      `/topicos/autorais/pessoa.html?secao=${encodeURIComponent(secao)}&id=${encodeURIComponent(pessoaId)}`
    );

    setTimeout(() => abrirModalConteudo(dadosPessoa), 120);
  }

  window.addEventListener(
    'beforeunload',
    () => {
      pararPessoa?.();
      pararConteudos?.();
    },
    { once: true }
  );
}

function renderizarConteudos(docs, pesquisador) {
  if (!docs.length) {
    el.conteudos.replaceChildren(
      criarAviso('Ainda não há conteúdo publicado por esta pessoa.')
    );
    return;
  }

  const fragmento = document.createDocumentFragment();

  docs.forEach((item) => {
    fragmento.appendChild(criarConteudo(item.id, item.data(), pesquisador));
  });

  el.conteudos.replaceChildren(fragmento);
}

function criarConteudo(id, dados, pesquisador) {
  const artigo = document.createElement('article');
  artigo.className = `et-conteudo et-conteudo--${secao}`;

  const cabecalho = document.createElement('div');
  cabecalho.className = 'et-conteudo__cabecalho';

  const titulos = document.createElement('div');

  const titulo = document.createElement('h3');
  titulo.textContent = dados.titulo || tituloPadrao();

  const autor = document.createElement('p');
  autor.className = 'et-conteudo__autor';
  autor.textContent = dados.autor ? `por ${dados.autor}` : '';

  titulos.append(titulo, autor);
  cabecalho.appendChild(titulos);

  if (pesquisador) {
    const acoes = document.createElement('div');
    acoes.className = 'et-conteudo__acoes';

    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.className = 'et-mini-btn et-mini-btn--perigo';
    excluir.textContent = 'Remover';

    excluir.addEventListener('click', async () => {
      if (!confirm(`Remover “${dados.titulo || tituloPadrao()}”?`)) return;

      excluir.disabled = true;

      try {
        await apagarArquivosDoConteudo(dados);
        await deleteDoc(
          doc(db, 'participantesAutorais', pessoaId, 'conteudos', id)
        );
      } catch (erro) {
        console.error('[autorais] Erro ao remover conteúdo:', erro);
        alert('Não foi possível remover este conteúdo.');
        excluir.disabled = false;
      }
    });

    acoes.appendChild(excluir);
    cabecalho.appendChild(acoes);
  }

  artigo.appendChild(cabecalho);

  if (secao === 'poemas') {
    const texto = document.createElement('div');
    texto.className = 'et-poema-texto';
    texto.textContent = dados.texto || '';
    artigo.appendChild(texto);
  }

  if (secao === 'desenhos') {
    if (dados.imagemUrl) {
      const figura = document.createElement('figure');
      figura.className = 'et-midia-imagem';

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = dados.imagemUrl;
      img.alt = dados.titulo || 'Desenho autoral';

      figura.appendChild(img);
      artigo.appendChild(figura);
    }

    if (dados.descricao) {
      artigo.appendChild(paragrafoDescricao(dados.descricao));
    }
  }

  if (secao === 'musica') {
    if (dados.videoUrl) {
      const video = document.createElement('video');
      video.className = 'et-midia-video';
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.src = dados.videoUrl;
      artigo.appendChild(video);
    }

    if (dados.descricao) {
      artigo.appendChild(paragrafoDescricao(dados.descricao));
    }
  }

  if (secao === 'curiosidades') {
    if (dados.descricao) {
      artigo.appendChild(paragrafoDescricao(dados.descricao));
    }

    if (dados.imagemUrl) {
      const figura = document.createElement('figure');
      figura.className = 'et-midia-imagem';

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = dados.imagemUrl;
      img.alt = dados.titulo || 'Imagem da curiosidade';

      figura.appendChild(img);
      artigo.appendChild(figura);
    }

    if (dados.videoUrl) {
      const video = document.createElement('video');
      video.className = 'et-midia-video';
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.src = dados.videoUrl;
      artigo.appendChild(video);
    }
  }

  return artigo;
}

function abrirModalConteudo(dadosPessoa) {
  const modal = document.createElement('div');
  modal.className = 'et-modal';

  modal.innerHTML = `
    <div class="et-modal__caixa" role="dialog" aria-modal="true" aria-labelledby="et-conteudo-modal-titulo">
      <button type="button" class="et-modal__fechar" data-fechar aria-label="Fechar">×</button>
      <p class="et-modal__kicker">${escapeHtml(config.rotulo)}</p>
      <h2 class="et-modal__titulo" id="et-conteudo-modal-titulo">${escapeHtml(config.adicionar)}</h2>

      <form data-form novalidate>
        ${camposConteudoHtml(dadosPessoa)}

        <p class="et-progresso" data-msg role="status" aria-live="polite"></p>
        <div class="et-progress-bar" data-barra><span></span></div>

        <div class="et-modal__acoes">
          <button type="button" class="et-btn et-btn--secundario" data-cancelar>Cancelar</button>
          <button type="submit" class="et-btn et-btn--principal" data-salvar>Publicar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.classList.add('et-modal-aberto');

  const form = modal.querySelector('[data-form]');
  const msg = modal.querySelector('[data-msg]');
  const barra = modal.querySelector('[data-barra]');
  const barraSpan = barra.querySelector('span');
  const salvar = modal.querySelector('[data-salvar]');

  let salvando = false;

  const fechar = () => {
    if (salvando) return;

    modal.remove();
    document.body.classList.remove('et-modal-aberto');
  };

  modal.querySelector('[data-fechar]').addEventListener('click', fechar);
  modal.querySelector('[data-cancelar]').addEventListener('click', fechar);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) fechar();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (salvando) return;

    if (auth.currentUser?.uid !== PESQUISADOR_UID) {
      erroMsg(msg, 'Sua sessão de pesquisador não está ativa.');
      return;
    }

    const validacao = validarConteudo(form);

    if (!validacao.ok) {
      erroMsg(msg, validacao.mensagem);
      return;
    }

    salvando = true;
    salvar.disabled = true;
    salvar.textContent = 'Publicando...';
    msg.classList.remove('is-erro');

    const conteudoRef = doc(
      collection(db, 'participantesAutorais', pessoaId, 'conteudos')
    );

    const dados = {
      tipo: secao === 'musica' ? 'musica' : secao.slice(0, -1),
      titulo: form.elements.titulo.value.trim(),
      autor: form.elements.autor.value.trim(),
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
      criadoPor: auth.currentUser.uid
    };

    const pathsCriados = [];

    try {
      if (secao === 'poemas') {
        dados.tipo = 'poema';
        dados.texto = form.elements.texto.value.trim();
      }

      if (secao === 'desenhos') {
        dados.tipo = 'desenho';
        dados.descricao = form.elements.descricao.value.trim();

        const arquivo = form.elements.imagem.files?.[0] || null;

        if (arquivo) {
          barra.classList.add('is-visible');
          barraSpan.style.width = '0%';

          const caminho = caminhoConteudo(
            conteudoRef.id,
            'imagem',
            arquivo.name
          );

          dados.imagemPath = caminho;
          dados.imagemUrl = await enviarComMensagem(
            arquivo,
            caminho,
            msg,
            barraSpan,
            'Enviando desenho'
          );

          pathsCriados.push(caminho);
        }
      }

      if (secao === 'musica') {
        dados.tipo = 'musica';
        dados.descricao = form.elements.descricao.value.trim();

        const arquivo = form.elements.video.files?.[0] || null;

        if (arquivo) {
          barra.classList.add('is-visible');
          barraSpan.style.width = '0%';

          const caminho = caminhoConteudo(
            conteudoRef.id,
            'video',
            arquivo.name
          );

          dados.videoPath = caminho;
          dados.videoUrl = await enviarComMensagem(
            arquivo,
            caminho,
            msg,
            barraSpan,
            'Enviando vídeo'
          );

          pathsCriados.push(caminho);
        }
      }

      if (secao === 'curiosidades') {
        dados.tipo = 'curiosidade';
        dados.descricao = form.elements.descricao.value.trim();

        const imagem = form.elements.imagem.files?.[0] || null;
        const video = form.elements.video.files?.[0] || null;

        if (imagem) {
          barra.classList.add('is-visible');
          barraSpan.style.width = '0%';

          const caminho = caminhoConteudo(
            conteudoRef.id,
            'imagem',
            imagem.name
          );

          dados.imagemPath = caminho;
          dados.imagemUrl = await enviarComMensagem(
            imagem,
            caminho,
            msg,
            barraSpan,
            'Enviando imagem'
          );

          pathsCriados.push(caminho);
        }

        if (video) {
          barra.classList.add('is-visible');
          barraSpan.style.width = '0%';

          const caminho = caminhoConteudo(
            conteudoRef.id,
            'video',
            video.name
          );

          dados.videoPath = caminho;
          dados.videoUrl = await enviarComMensagem(
            video,
            caminho,
            msg,
            barraSpan,
            'Enviando vídeo'
          );

          pathsCriados.push(caminho);
        }
      }

      msg.textContent = 'Salvando publicação...';
      await setDoc(conteudoRef, dados);

      salvando = false;
      fechar();
    } catch (erro) {
      console.error('[autorais] Falha ao publicar conteúdo:', erro);

      for (const caminho of pathsCriados) {
        await deleteObject(ref(storage, caminho)).catch(() => {});
      }

      erroMsg(msg, mensagemErroFirebase(erro));
      barra.classList.remove('is-visible');
      barraSpan.style.width = '0%';

      salvando = false;
      salvar.disabled = false;
      salvar.textContent = 'Publicar';
    }
  });

  requestAnimationFrame(() => {
    form.querySelector('input, textarea')?.focus();
  });
}

function abrirModalEditarPessoa(dadosPessoa, pessoaRef) {
  const modal = document.createElement('div');
  modal.className = 'et-modal';

  modal.innerHTML = `
    <div class="et-modal__caixa" role="dialog" aria-modal="true" aria-labelledby="et-editar-pessoa-titulo">
      <button type="button" class="et-modal__fechar" data-fechar aria-label="Fechar">×</button>
      <p class="et-modal__kicker">Gerenciar pessoa</p>
      <h2 class="et-modal__titulo" id="et-editar-pessoa-titulo">Editar perfil</h2>

      <form data-form novalidate>
        <div class="et-campo">
          <label for="et-editar-nome">Nome <small>(opcional)</small></label>
          <input id="et-editar-nome" name="nome" type="text" maxlength="120">
        </div>

        <div class="et-campo">
          <label for="et-editar-descricao">Descrição <small>(opcional)</small></label>
          <textarea id="et-editar-descricao" name="descricao" maxlength="1200"></textarea>
        </div>

        <div class="et-campo et-arquivo">
          <label for="et-editar-foto">Trocar imagem <small>(opcional)</small></label>
          <input id="et-editar-foto" name="foto" type="file" accept="image/*">
        </div>

        <p class="et-progresso" data-msg role="status" aria-live="polite"></p>
        <div class="et-progress-bar" data-barra><span></span></div>

        <div class="et-modal__acoes">
          <button type="button" class="et-btn et-btn--secundario" data-cancelar>Cancelar</button>
          <button type="submit" class="et-btn et-btn--principal" data-salvar>Salvar alterações</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.classList.add('et-modal-aberto');

  const form = modal.querySelector('[data-form]');
  form.elements.nome.value = dadosPessoa.nome || '';
  form.elements.descricao.value = dadosPessoa.descricao || '';

  const msg = modal.querySelector('[data-msg]');
  const barra = modal.querySelector('[data-barra]');
  const barraSpan = barra.querySelector('span');
  const salvar = modal.querySelector('[data-salvar]');

  let salvando = false;

  const fechar = () => {
    if (salvando) return;

    modal.remove();
    document.body.classList.remove('et-modal-aberto');
  };

  modal.querySelector('[data-fechar]').addEventListener('click', fechar);
  modal.querySelector('[data-cancelar]').addEventListener('click', fechar);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) fechar();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (salvando) return;

    const nome = form.elements.nome.value.trim();
    const descricao = form.elements.descricao.value.trim();
    const novaFoto = form.elements.foto.files?.[0] || null;

    if (
      novaFoto &&
      (!novaFoto.type.startsWith('image/') ||
        novaFoto.size > 15 * 1024 * 1024)
    ) {
      erroMsg(msg, 'A nova foto precisa ser uma imagem de até 15 MB.');
      return;
    }

    salvando = true;
    salvar.disabled = true;
    salvar.textContent = 'Salvando...';

    const atualizacao = {
      nome,
      descricao,
      atualizadoEm: serverTimestamp()
    };

    let novoPath = null;

    try {
      if (novaFoto) {
        barra.classList.add('is-visible');
        barraSpan.style.width = '0%';

        novoPath = `conteudosAutorais/${secao}/${pessoaId}/perfil/perfil-${Date.now()}-${nomeArquivoSeguro(novaFoto.name)}`;

        atualizacao.fotoPath = novoPath;
        atualizacao.fotoUrl = await enviarComMensagem(
          novaFoto,
          novoPath,
          msg,
          barraSpan,
          'Enviando nova foto'
        );
      } else {
        msg.textContent = 'Salvando alterações...';
      }

      await updateDoc(pessoaRef, atualizacao);

      if (
        novaFoto &&
        dadosPessoa.fotoPath &&
        dadosPessoa.fotoPath !== novoPath
      ) {
        await deleteObject(ref(storage, dadosPessoa.fotoPath)).catch(() => {});
      }

      salvando = false;
      fechar();
    } catch (erro) {
      console.error('[autorais] Falha ao editar pessoa:', erro);

      if (novoPath) {
        await deleteObject(ref(storage, novoPath)).catch(() => {});
      }

      erroMsg(msg, mensagemErroFirebase(erro));

      barra.classList.remove('is-visible');
      barraSpan.style.width = '0%';

      salvando = false;
      salvar.disabled = false;
      salvar.textContent = 'Salvar alterações';
    }
  });

  requestAnimationFrame(() => form.elements.nome.focus());
}

function camposConteudoHtml(dadosPessoa) {
  const nome = escapeHtml(dadosPessoa.nome || '');

  const comuns = `
    <div class="et-campo">
      <label for="et-conteudo-titulo">Nome / título <small>(opcional)</small></label>
      <input id="et-conteudo-titulo" name="titulo" type="text" maxlength="160">
    </div>

    <div class="et-campo">
      <label for="et-conteudo-autor">Quem criou / escreveu <small>(opcional)</small></label>
      <input id="et-conteudo-autor" name="autor" type="text" maxlength="160" value="${nome}">
    </div>
  `;

  if (secao === 'poemas') {
    return `${comuns}
      <div class="et-campo">
        <label for="et-conteudo-texto">Poema <small>(opcional)</small></label>
        <textarea id="et-conteudo-texto" name="texto" rows="12" maxlength="20000"></textarea>
      </div>`;
  }

  if (secao === 'desenhos') {
    return `${comuns}
      <div class="et-campo">
        <label for="et-conteudo-descricao">Descrição <small>(opcional)</small></label>
        <textarea id="et-conteudo-descricao" name="descricao" rows="4" maxlength="2500"></textarea>
      </div>

      <div class="et-campo et-arquivo">
        <label for="et-conteudo-imagem">Imagem do desenho <small>(opcional)</small></label>
        <input id="et-conteudo-imagem" name="imagem" type="file" accept="image/*">
      </div>`;
  }

  if (secao === 'musica') {
    return `${comuns}
      <div class="et-campo">
        <label for="et-conteudo-descricao">Descrição da música / apresentação <small>(opcional)</small></label>
        <textarea id="et-conteudo-descricao" name="descricao" rows="5" maxlength="3500"></textarea>
      </div>

      <div class="et-campo et-arquivo">
        <label for="et-conteudo-video">Vídeo da música <small>(opcional)</small></label>
        <input id="et-conteudo-video" name="video" type="file" accept="video/*">
      </div>`;
  }

  return `${comuns}
    <div class="et-campo">
      <label for="et-conteudo-descricao">Texto / descrição da curiosidade <small>(opcional)</small></label>
      <textarea id="et-conteudo-descricao" name="descricao" rows="7" maxlength="12000"></textarea>
    </div>

    <div class="et-campo et-arquivo">
      <label for="et-conteudo-imagem">Imagem <small>(opcional)</small></label>
      <input id="et-conteudo-imagem" name="imagem" type="file" accept="image/*">
    </div>

    <div class="et-campo et-arquivo">
      <label for="et-conteudo-video">Vídeo <small>(opcional)</small></label>
      <input id="et-conteudo-video" name="video" type="file" accept="video/*">
    </div>`;
}

function validarConteudo(form) {
  if (secao === 'desenhos') {
    const imagem = form.elements.imagem.files?.[0] || null;

    if (imagem) {
      const erro = validarImagem(imagem);
      if (erro) return { ok: false, mensagem: erro };
    }
  }

  if (secao === 'musica') {
    const video = form.elements.video.files?.[0] || null;

    if (video) {
      const erro = validarVideo(video);
      if (erro) return { ok: false, mensagem: erro };
    }
  }

  if (secao === 'curiosidades') {
    const imagem = form.elements.imagem.files?.[0] || null;
    const video = form.elements.video.files?.[0] || null;

    if (imagem) {
      const erro = validarImagem(imagem);
      if (erro) return { ok: false, mensagem: erro };
    }

    if (video) {
      const erro = validarVideo(video);
      if (erro) return { ok: false, mensagem: erro };
    }
  }

  return { ok: true };
}

function validarImagem(arquivo) {
  if (!arquivo.type.startsWith('image/')) {
    return 'Escolha uma imagem válida.';
  }

  if (arquivo.size > 15 * 1024 * 1024) {
    return 'A imagem precisa ter no máximo 15 MB.';
  }

  return '';
}

function validarVideo(arquivo) {
  if (!arquivo.type.startsWith('video/')) {
    return 'Escolha um vídeo válido.';
  }

  if (arquivo.size > 100 * 1024 * 1024) {
    return 'O vídeo precisa ter no máximo 100 MB.';
  }

  return '';
}

function caminhoConteudo(conteudoId, tipo, nomeArquivo) {
  return `conteudosAutorais/${secao}/${pessoaId}/conteudos/${conteudoId}/${tipo}-${Date.now()}-${nomeArquivoSeguro(nomeArquivo)}`;
}

function enviarComMensagem(arquivo, caminho, msg, barra, rotulo) {
  return enviarArquivo(arquivo, caminho, (percentual) => {
    barra.style.width = `${percentual}%`;
    msg.textContent = `${rotulo}... ${Math.round(percentual)}%`;
  });
}

function enviarArquivo(arquivo, caminho, onProgress) {
  return new Promise((resolve, reject) => {
    const tarefa = uploadBytesResumable(
      ref(storage, caminho),
      arquivo,
      {
        contentType: arquivo.type || 'application/octet-stream'
      }
    );

    let finalizado = false;
    let timer = null;

    const limparTimer = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };

    const armarTimer = () => {
      limparTimer();

      timer = setTimeout(() => {
        if (finalizado) return;

        finalizado = true;
        tarefa.cancel();

        const erro = new Error('Upload sem progresso por tempo demais.');
        erro.code = 'storage/upload-stalled';
        reject(erro);
      }, TEMPO_MAXIMO_SEM_PROGRESSO);
    };

    armarTimer();

    tarefa.on(
      'state_changed',
      (snapshot) => {
        if (finalizado) return;

        armarTimer();

        const percentual = snapshot.totalBytes
          ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          : 0;

        onProgress?.(percentual);
      },
      (erro) => {
        if (finalizado) return;

        finalizado = true;
        limparTimer();
        reject(erro);
      },
      async () => {
        if (finalizado) return;

        finalizado = true;
        limparTimer();

        try {
          resolve(await getDownloadURL(tarefa.snapshot.ref));
        } catch (erro) {
          reject(erro);
        }
      }
    );
  });
}

async function apagarArquivosDoConteudo(dados) {
  const paths = [dados.imagemPath, dados.videoPath].filter(Boolean);

  for (const caminho of paths) {
    await deleteObject(ref(storage, caminho)).catch((erro) => {
      if (erro?.code !== 'storage/object-not-found') throw erro;
    });
  }
}

function tituloPadrao() {
  if (secao === 'poemas') return 'Poema';
  if (secao === 'desenhos') return 'Desenho';
  if (secao === 'musica') return 'Música';
  return 'Curiosidade';
}

function paragrafoDescricao(texto) {
  const p = document.createElement('p');
  p.className = 'et-conteudo__descricao';
  p.textContent = texto;
  return p;
}

function criarAviso(texto) {
  const p = document.createElement('p');
  p.className = 'et-pagina-vazio';
  p.textContent = texto;
  return p;
}

function falharPagina(texto) {
  if (el?.mensagem) el.mensagem.textContent = texto;
  if (el?.conteudos) el.conteudos.replaceChildren();
}

function obterMillis(timestamp) {
  try {
    return timestamp?.toMillis?.() || 0;
  } catch {
    return 0;
  }
}

function nomeArquivoSeguro(nome) {
  const partes = String(nome || 'arquivo').split('.');
  const extensao = partes.length > 1
    ? partes.pop().toLowerCase().replace(/[^a-z0-9]/g, '')
    : '';

  const base = partes.join('.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'arquivo';

  return extensao ? `${base}.${extensao}` : base;
}

function erroMsg(elm, texto) {
  elm.textContent = texto;
  elm.classList.add('is-erro');
}

function mensagemErroFirebase(erro) {
  const codigo = erro?.code || '';

  if (codigo.includes('storage/upload-stalled')) {
    return 'O upload não iniciou. Confira o Firebase Storage. Se o projeto estiver no plano Spark, o Storage precisa ser atualizado para o plano Blaze.';
  }

  if (
    codigo.includes('unauthorized') ||
    codigo.includes('permission-denied') ||
    codigo.includes('storage/unauthorized')
  ) {
    return 'Sem permissão para enviar o arquivo. Confira as regras do Storage e sua sessão de pesquisador.';
  }

  if (
    codigo.includes('storage/unknown') ||
    codigo.includes('storage/object-not-found') ||
    codigo.includes('storage/quota-exceeded') ||
    codigo.includes('storage/retry-limit-exceeded')
  ) {
    return 'O Firebase Storage recusou o upload. Confira se o Storage está ativo e se o projeto está no plano Blaze.';
  }

  return 'Não foi possível concluir agora. Tente novamente.';
}

function escapeHtml(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
