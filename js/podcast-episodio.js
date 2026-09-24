import { auth, db } from '/js/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const PESQUISADOR_UID = 'QuiQMjtXjOWNW2LCrot86rsHh0F2';
const CLOUDINARY_CLOUD_NAME = 'uaisf2vc';
const CLOUDINARY_UPLOAD_PRESET = 'entre_tempos_upload';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

const params = new URLSearchParams(location.search);
const episodioId = params.get('id');
const abrirEdicaoInicial = params.get('editar') === '1';

if (!episodioId) {
  location.replace('../podcast.html');
} else {
  iniciar();
}

function iniciar() {
  const episodioRef = doc(
    db,
    'participantesAutorais',
    '_podcasts',
    'conteudos',
    episodioId
  );

  let dados = null;
  let pesquisador = false;
  let abriuPromptInicial = false;
  let likesIniciado = false;

  const el = {
    admin: document.getElementById('podcast-episodio-admin'),
    btnEditarBase: document.querySelector('[data-editar-base]'),
    btnRemover: document.querySelector('[data-remover-episodio]'),
    btnYoutube: document.querySelector('[data-editar-youtube]'),
    btnLink: document.querySelector('[data-adicionar-link]'),
    btnSobre: document.querySelector('[data-editar-sobre]'),
    btnBastidor: document.querySelector('[data-adicionar-bastidor]'),
    funcoesAdmin: document.getElementById('podcast-funcoes-admin'),
    btnFuncao: document.querySelector('[data-adicionar-funcao]'),
    videoMoldura: document.getElementById('video-moldura'),
    videoVazio: document.getElementById('podcast-video-vazio'),
    videoEtiqueta: document.getElementById('video-etiqueta'),
    fotoWrap: document.getElementById('episodio-foto-wrap'),
    foto: document.getElementById('episodio-foto'),
    numero: document.getElementById('episodio-numero'),
    cargo: document.getElementById('episodio-cargo'),
    nome: document.getElementById('episodio-nome'),
    descricao: document.getElementById('episodio-descricao'),
    like: document.getElementById('episodio-like'),
    links: document.getElementById('podcast-links'),
    linksLista: document.getElementById('podcast-links-lista'),
    sobre: document.getElementById('episodio-sobre'),
    bastidores: document.getElementById('episodio-bastidores'),
    grupos: document.getElementById('episodio-grupos')
  };

  onAuthStateChanged(auth, (usuario) => {
    pesquisador = usuario?.uid === PESQUISADOR_UID;
    atualizarControles();

    if (dados) {
      renderizarLinks();
      renderizarBastidores();
      renderizarGrupos();
    }

    if (
      pesquisador &&
      abrirEdicaoInicial &&
      dados &&
      !abriuPromptInicial &&
      !dados.youtubeUrl
    ) {
      abriuPromptInicial = true;
      setTimeout(() => abrirModalYoutube(), 180);
    }
  });

  onSnapshot(
    episodioRef,
    (snapshot) => {
      if (!snapshot.exists() || snapshot.data().ativo === false) {
        location.replace('../podcast.html');
        return;
      }

      dados = normalizarDados(snapshot.data());
      renderizar();
      atualizarControles();

      if (!likesIniciado) {
        likesIniciado = true;
        requestAnimationFrame(() => window.initLikes?.());
      }

      if (
        pesquisador &&
        abrirEdicaoInicial &&
        !abriuPromptInicial &&
        !dados.youtubeUrl
      ) {
        abriuPromptInicial = true;
        setTimeout(() => abrirModalYoutube(), 180);
      }
    },
    (erro) => {
      console.error('[podcast] Erro ao carregar episódio:', erro);
      document.getElementById('episodio-nome').textContent =
        'Não foi possível carregar este episódio.';
    }
  );

  el.btnEditarBase.addEventListener('click', () => {
    if (pesquisador && dados) abrirModalBase();
  });

  el.btnRemover.addEventListener('click', async () => {
    if (!pesquisador || !dados) return;

    const confirmar = confirm(
      `Remover o episódio ${dados.numero} — ${dados.nome}? Ele deixará de aparecer para os visitantes.`
    );

    if (!confirmar) return;

    el.btnRemover.disabled = true;

    try {
      await updateDoc(episodioRef, {
        ativo: false,
        atualizadoEm: serverTimestamp()
      });
      location.replace('../podcast.html');
    } catch (erro) {
      console.error('[podcast] Erro ao remover episódio:', erro);
      alert('Não foi possível remover este episódio agora.');
      el.btnRemover.disabled = false;
    }
  });

  el.btnYoutube.addEventListener('click', () => pesquisador && abrirModalYoutube());
  el.btnLink.addEventListener('click', () => pesquisador && abrirModalLink());
  el.btnSobre.addEventListener('click', () => pesquisador && abrirModalSobre());
  el.btnBastidor.addEventListener('click', () => pesquisador && abrirModalBastidor());
  el.btnFuncao.addEventListener('click', () => pesquisador && abrirModalGrupo(null));

  function atualizarControles() {
    el.admin.hidden = !pesquisador;
    el.funcoesAdmin.hidden = !pesquisador;

    [
      el.btnYoutube,
      el.btnLink,
      el.btnSobre,
      el.btnBastidor
    ].forEach((botao) => {
      if (botao) botao.hidden = !pesquisador;
    });
  }

  function renderizar() {
    document.title = `EP. ${dados.numero} — ${dados.nome} | Pod Aula Vaga`;

    el.numero.textContent = `EP: ${dados.numero}`;
    el.cargo.textContent = dados.cargo || 'Convidado';
    el.nome.textContent = dados.nome || 'Sem nome';
    el.descricao.textContent = dados.descricao || '';
    el.videoEtiqueta.textContent = `EP. ${dados.numero} · em exibição`;

    el.like.dataset.likeId = `podcast-${episodioId}`;

    if (dados.fotoUrl) {
      el.foto.src = otimizarImagem(dados.fotoUrl, 650, 820);
      el.foto.alt = dados.nome ? `Foto de ${dados.nome}` : 'Foto do convidado';
      el.fotoWrap.classList.remove('sem-foto');
    } else {
      el.foto.removeAttribute('src');
      el.fotoWrap.classList.add('sem-foto');
    }

    renderizarYoutube();
    renderizarLinks();
    renderizarSobre();
    renderizarBastidores();
    renderizarGrupos();
  }

  function renderizarYoutube() {
    el.videoMoldura.querySelector('iframe')?.remove();

    const embed = extrairYoutubeId(dados.youtubeUrl);

    if (!embed) {
      el.videoVazio.hidden = false;
      return;
    }

    el.videoVazio.hidden = true;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(embed)}`;
    iframe.title = `Pod Aula Vaga — Episódio ${dados.numero}`;
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;

    el.videoMoldura.insertBefore(
      iframe,
      el.videoMoldura.querySelector('.video-rodape')
    );
  }

  function renderizarLinks() {
    el.linksLista.replaceChildren();
    el.btnLink.textContent = dados.links.length ? 'Adicionar outro?' : '+ Adicionar link';

    if (!dados.links.length && !pesquisador) {
      el.links.hidden = true;
      return;
    }

    el.links.hidden = false;

    dados.links.forEach((link, indice) => {
      const item = document.createElement('div');
      item.className = 'podcast-link-item';

      const a = document.createElement('a');
      a.href = normalizarUrl(link.url);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = link.rotulo || 'Acessar link';

      item.appendChild(a);

      if (pesquisador) {
        const remover = document.createElement('button');
        remover.type = 'button';
        remover.className = 'podcast-remover-mini';
        remover.textContent = 'remover';
        remover.addEventListener('click', async () => {
          const links = dados.links.filter((_, i) => i !== indice);
          await salvar({ links });
        });
        item.appendChild(remover);
      }

      el.linksLista.appendChild(item);
    });
  }

  function renderizarSobre() {
    el.sobre.textContent =
      dados.sobreConversa || 'Ainda não há um texto sobre a conversa.';
  }

  function renderizarBastidores() {
    el.bastidores.replaceChildren();

    if (!dados.bastidores.length) {
      const vazio = document.createElement('div');
      vazio.className = 'podcast-bastidores-vazio';
      vazio.textContent = pesquisador
        ? 'Nenhum bastidor adicionado ainda.'
        : 'Bastidores em breve.';
      el.bastidores.appendChild(vazio);
      return;
    }

    dados.bastidores.forEach((midia, indice) => {
      const item = document.createElement('div');
      item.className = 'foto-galeria podcast-bastidor-item';

      if (midia.tipo === 'video') {
        const video = document.createElement('video');
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.src = normalizarVideoCloudinary(midia.url);
        item.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.src = otimizarImagem(midia.url, 1000, 760);
        img.alt = `Bastidor do episódio ${dados.numero}`;
        img.loading = 'lazy';
        img.decoding = 'async';
        item.appendChild(img);
      }

      if (pesquisador) {
        const remover = document.createElement('button');
        remover.type = 'button';
        remover.className = 'podcast-midia-remover';
        remover.textContent = '×';
        remover.setAttribute('aria-label', 'Remover mídia');
        remover.addEventListener('click', async () => {
          if (!confirm('Remover esta mídia dos bastidores?')) return;
          const bastidores = dados.bastidores.filter((_, i) => i !== indice);
          await salvar({ bastidores });
        });
        item.appendChild(remover);
      }

      el.bastidores.appendChild(item);
    });
  }

  function renderizarGrupos() {
    el.grupos.replaceChildren();

    dados.grupos.forEach((grupo, indiceGrupo) => {
      const bloco = document.createElement('div');
      bloco.className = 'bloco-entrevistadores podcast-grupo-participantes';

      const topo = document.createElement('div');
      topo.className = 'podcast-grupo-topo';

      const h2 = document.createElement('h2');
      h2.textContent = grupo.funcao || 'Participantes';
      topo.appendChild(h2);

      if (pesquisador) {
        const editar = document.createElement('button');
        editar.type = 'button';
        editar.className = 'podcast-editor-inline podcast-editor-inline--compacto';
        editar.textContent = 'Editar';
        editar.addEventListener('click', () => abrirModalGrupo(indiceGrupo));
        topo.appendChild(editar);
      }

      const grade = document.createElement('div');
      grade.className = 'grade-entrevistadores';

      grupo.participantes.forEach((pessoa) => {
        const card = document.createElement('div');
        card.className = 'entrevistador';

        const foto = document.createElement('div');
        foto.className = 'foto-entrevistador';

        if (pessoa.fotoUrl) {
          const img = document.createElement('img');
          img.src = otimizarImagem(pessoa.fotoUrl, 520, 420);
          img.alt = pessoa.nome ? `Foto de ${pessoa.nome}` : 'Participante';
          img.loading = 'lazy';
          img.decoding = 'async';
          foto.appendChild(img);
        } else {
          foto.classList.add('placeholder');
          foto.textContent = iniciais(pessoa.nome);
        }

        const nome = document.createElement('span');
        nome.textContent = pessoa.nome || 'Sem nome';

        card.append(foto, nome);

        if (pessoa.instagram) {
          const instagram = document.createElement('a');
          instagram.className = 'podcast-instagram';
          instagram.href = instagramHref(pessoa.instagram);
          instagram.target = '_blank';
          instagram.rel = 'noopener noreferrer';
          instagram.innerHTML =
            `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg><span>${escapeHtml(instagramLabel(pessoa.instagram))}</span>`;
          card.appendChild(instagram);
        }

        grade.appendChild(card);
      });

      bloco.append(topo, grade);
      el.grupos.appendChild(bloco);
    });
  }

  async function salvar(campos) {
    await updateDoc(episodioRef, {
      ...campos,
      atualizadoEm: serverTimestamp()
    });
  }

  function abrirModalBase() {
    const modal = criarModal({
      kicker: 'Gerenciar episódio',
      titulo: 'Editar dados',
      corpo: `
        <div class="podcast-form-grid">
          <div class="podcast-campo">
            <label>Número do episódio</label>
            <input name="numero" type="text" inputmode="numeric" maxlength="3" value="${escapeAttr(dados.numero)}">
          </div>
          <div class="podcast-campo">
            <label>Cargo / identificação</label>
            <input name="cargo" type="text" maxlength="70" value="${escapeAttr(dados.cargo)}">
          </div>
        </div>
        <div class="podcast-campo">
          <label>Nome</label>
          <input name="nome" type="text" maxlength="140" value="${escapeAttr(dados.nome)}">
        </div>
        <div class="podcast-campo">
          <label>Descrição</label>
          <textarea name="descricao" rows="6" maxlength="1200">${escapeHtml(dados.descricao)}</textarea>
        </div>
        <div class="podcast-form-grid">
          <div class="podcast-campo">
            <label>Entrevistador 1</label>
            <input name="entrevistador1" type="text" maxlength="120" value="${escapeAttr(dados.entrevistador1)}">
          </div>
          <div class="podcast-campo">
            <label>Entrevistador 2</label>
            <input name="entrevistador2" type="text" maxlength="120" value="${escapeAttr(dados.entrevistador2)}">
          </div>
        </div>
        <div class="podcast-campo podcast-campo--arquivo">
          <label>Trocar foto <small>(opcional)</small></label>
          <input name="foto" type="file" accept="image/*">
        </div>
      `,
      salvarTexto: 'Salvar alterações',
      async aoSalvar({ form, msg, progress, progressSpan }) {
        const atualizacao = {
          numero: formatarNumero(form.elements.numero.value),
          cargo: form.elements.cargo.value.trim(),
          nome: form.elements.nome.value.trim(),
          descricao: form.elements.descricao.value.trim(),
          entrevistador1: form.elements.entrevistador1.value.trim(),
          entrevistador2: form.elements.entrevistador2.value.trim()
        };

        const foto = form.elements.foto.files?.[0] || null;

        if (foto) {
          const erro = validarImagem(foto);
          if (erro) throw new Error(erro);

          progress.classList.add('is-visible');
          const upload = await enviarArquivo(foto, (percentual) => {
            progressSpan.style.width = `${percentual}%`;
            msg.textContent = `Enviando foto... ${Math.round(percentual)}%`;
          });

          atualizacao.fotoUrl = upload.url;
          atualizacao.fotoPublicId = upload.publicId;
          atualizacao.fotoResourceType = upload.resourceType;
        }

        await salvar(atualizacao);
      }
    });
    abrirModal(modal);
  }

  function abrirModalYoutube() {
    const modal = criarModal({
      kicker: 'Vídeo do episódio',
      titulo: 'YouTube',
      corpo: `
        <div class="podcast-campo">
          <label>URL do episódio no YouTube</label>
          <input name="youtubeUrl" type="url" inputmode="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value="${escapeAttr(dados?.youtubeUrl || '')}">
        </div>
      `,
      salvarTexto: 'Salvar URL',
      async aoSalvar({ form }) {
        const youtubeUrl = form.elements.youtubeUrl.value.trim();

        if (youtubeUrl && !extrairYoutubeId(youtubeUrl)) {
          throw new Error('Informe uma URL válida do YouTube.');
        }

        await salvar({ youtubeUrl });
      }
    });
    abrirModal(modal);
  }

  function abrirModalLink() {
    const modal = criarModal({
      kicker: 'Confira agora!',
      titulo: 'Adicionar link',
      corpo: `
        <div class="podcast-campo">
          <label>Onde leva este link?</label>
          <input name="rotulo" type="text" maxlength="80" placeholder="Instagram, YouTube, Spotify...">
        </div>
        <div class="podcast-campo">
          <label>Link</label>
          <input name="url" type="url" inputmode="url" placeholder="https://...">
        </div>
        <p class="podcast-ajuda">Depois de salvar, o botão “Adicionar link” continua disponível para adicionar outro.</p>
      `,
      salvarTexto: 'Adicionar link',
      async aoSalvar({ form }) {
        const rotulo = form.elements.rotulo.value.trim();
        const url = form.elements.url.value.trim();

        if (!rotulo || !url) throw new Error('Preencha o nome e o link.');
        if (!/^https?:\/\//i.test(normalizarUrl(url))) {
          throw new Error('Informe um link válido.');
        }

        await salvar({
          links: [...dados.links, { rotulo, url: normalizarUrl(url) }]
        });
      }
    });
    abrirModal(modal);
  }

  function abrirModalSobre() {
    const modal = criarModal({
      kicker: 'Episódio',
      titulo: 'Sobre a conversa',
      corpo: `
        <div class="podcast-campo">
          <label>Texto</label>
          <textarea name="sobre" rows="12" maxlength="8000">${escapeHtml(dados.sobreConversa)}</textarea>
        </div>
      `,
      salvarTexto: 'Salvar texto',
      async aoSalvar({ form }) {
        await salvar({
          sobreConversa: form.elements.sobre.value.trim()
        });
      }
    });
    abrirModal(modal);
  }

  function abrirModalBastidor() {
    const modal = criarModal({
      kicker: 'Bastidores',
      titulo: 'Adicionar mídia',
      corpo: `
        <div class="podcast-campo podcast-campo--arquivo">
          <label>Imagem ou vídeo</label>
          <input name="midia" type="file" accept="image/*,video/*">
        </div>
      `,
      salvarTexto: 'Adicionar aos bastidores',
      async aoSalvar({ form, msg, progress, progressSpan }) {
        const arquivo = form.elements.midia.files?.[0] || null;
        if (!arquivo) throw new Error('Escolha uma imagem ou vídeo.');

        const tipo = arquivo.type.startsWith('video/') ? 'video' : 'imagem';

        if (tipo === 'imagem') {
          const erro = validarImagem(arquivo);
          if (erro) throw new Error(erro);
        } else if (arquivo.size > 100 * 1024 * 1024) {
          throw new Error('O vídeo precisa ter no máximo 100 MB.');
        }

        progress.classList.add('is-visible');

        const upload = await enviarArquivo(arquivo, (percentual) => {
          progressSpan.style.width = `${percentual}%`;
          msg.textContent = `Enviando ${tipo}... ${Math.round(percentual)}%`;
        });

        await salvar({
          bastidores: [
            ...dados.bastidores,
            {
              tipo,
              url: upload.url,
              publicId: upload.publicId,
              resourceType: upload.resourceType
            }
          ]
        });
      }
    });
    abrirModal(modal);
  }

  function abrirModalGrupo(indiceGrupo) {
    const existente =
      indiceGrupo === null
        ? { funcao: '', participantes: [{ nome: '', fotoUrl: '', instagram: '' }] }
        : dados.grupos[indiceGrupo];

    const modal = criarModal({
      kicker: 'Participantes',
      titulo: indiceGrupo === null ? 'Nova função' : 'Editar função',
      corpo: `
        <div class="podcast-campo">
          <label>Função</label>
          <input name="funcao" type="text" maxlength="80"
            placeholder="Entrevistadores, Técnicos, Produtores..."
            value="${escapeAttr(existente.funcao || '')}">
        </div>

        <div class="podcast-participantes-form" data-participantes></div>

        <button type="button" class="podcast-btn podcast-btn--secundario" data-add-participante>
          + Adicionar participante
        </button>
      `,
      salvarTexto: 'Salvar função',
      antesDeAbrir({ modal, form }) {
        const container = modal.querySelector('[data-participantes]');
        const add = modal.querySelector('[data-add-participante]');

        const participantes = existente.participantes?.length
          ? existente.participantes
          : [{ nome: '', fotoUrl: '', instagram: '' }];

        participantes.forEach((pessoa) => adicionarLinhaParticipante(container, pessoa));

        add.addEventListener('click', () => {
          adicionarLinhaParticipante(container, {
            nome: '',
            fotoUrl: '',
            instagram: ''
          });
        });
      },
      async aoSalvar({ form, modal, msg, progress, progressSpan }) {
        const funcao = form.elements.funcao.value.trim();
        if (!funcao) throw new Error('Informe a função deste grupo.');

        const linhas = [...modal.querySelectorAll('[data-participante-linha]')];
        const participantes = [];

        for (let i = 0; i < linhas.length; i += 1) {
          const linha = linhas[i];
          const nome = linha.querySelector('[data-nome]').value.trim();
          const instagram = linha.querySelector('[data-instagram]').value.trim();
          const fotoInput = linha.querySelector('[data-foto]');
          const fotoAtual = linha.dataset.fotoAtual || '';

          if (!nome) continue;

          let fotoUrl = fotoAtual;

          const arquivo = fotoInput.files?.[0] || null;
          if (arquivo) {
            const erro = validarImagem(arquivo);
            if (erro) throw new Error(erro);

            progress.classList.add('is-visible');
            const upload = await enviarArquivo(arquivo, (percentual) => {
              progressSpan.style.width = `${percentual}%`;
              msg.textContent = `Enviando foto de ${nome}... ${Math.round(percentual)}%`;
            });
            fotoUrl = upload.url;
          }

          participantes.push({ nome, fotoUrl, instagram });
        }

        if (!participantes.length) {
          throw new Error('Adicione pelo menos um participante.');
        }

        const grupos = [...dados.grupos];
        const novoGrupo = { funcao, participantes };

        if (indiceGrupo === null) grupos.push(novoGrupo);
        else grupos[indiceGrupo] = novoGrupo;

        const atualizacao = { grupos };

        if (funcao.trim().toLowerCase() === 'entrevistadores') {
          atualizacao.entrevistador1 = participantes[0]?.nome || '';
          atualizacao.entrevistador2 = participantes[1]?.nome || '';
        }

        await salvar(atualizacao);
      }
    });

    abrirModal(modal);
  }

  function adicionarLinhaParticipante(container, pessoa) {
    const linha = document.createElement('fieldset');
    linha.className = 'podcast-participante-linha';
    linha.dataset.participanteLinha = 'true';
    linha.dataset.fotoAtual = pessoa.fotoUrl || '';

    linha.innerHTML = `
      <legend>Participante</legend>

      <div class="podcast-campo">
        <label>Nome</label>
        <input data-nome type="text" maxlength="120" value="${escapeAttr(pessoa.nome || '')}">
      </div>

      <div class="podcast-campo podcast-campo--arquivo">
        <label>Foto</label>
        <input data-foto type="file" accept="image/*">
        ${pessoa.fotoUrl ? '<small>Já existe uma foto. Escolha outra apenas se quiser trocar.</small>' : ''}
      </div>

      <div class="podcast-campo">
        <label>Instagram <small>(opcional)</small></label>
        <input data-instagram type="text" maxlength="180"
          placeholder="@usuario ou https://instagram.com/usuario"
          value="${escapeAttr(pessoa.instagram || '')}">
      </div>

      <button type="button" class="podcast-remover-linha" data-remover-participante>
        Remover participante
      </button>
    `;

    linha.querySelector('[data-remover-participante]').addEventListener('click', () => {
      linha.remove();
    });

    container.appendChild(linha);
  }

  function criarModal({ kicker, titulo, corpo, salvarTexto, aoSalvar, antesDeAbrir }) {
    const modal = document.createElement('div');
    modal.className = 'podcast-modal';
    modal.hidden = true;

    modal.innerHTML = `
      <div class="podcast-modal__caixa" role="dialog" aria-modal="true">
        <button class="podcast-modal__fechar" type="button" data-fechar aria-label="Fechar">×</button>
        <p class="podcast-modal__kicker">${escapeHtml(kicker)}</p>
        <h2 class="podcast-modal__titulo">${escapeHtml(titulo)}</h2>

        <form data-form novalidate>
          ${corpo}

          <p class="podcast-progresso" data-msg role="status" aria-live="polite"></p>
          <div class="podcast-progress" data-progress><span></span></div>

          <div class="podcast-modal__acoes">
            <button type="button" class="podcast-btn podcast-btn--secundario" data-cancelar>Cancelar</button>
            <button type="submit" class="podcast-btn podcast-btn--principal" data-salvar>${escapeHtml(salvarTexto)}</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const form = modal.querySelector('[data-form]');
    const msg = modal.querySelector('[data-msg]');
    const progress = modal.querySelector('[data-progress]');
    const progressSpan = progress.querySelector('span');
    const salvarBtn = modal.querySelector('[data-salvar]');
    let salvando = false;

    antesDeAbrir?.({ modal, form });

    const fechar = () => {
      if (salvando) return;
      modal.remove();
      document.body.classList.remove('podcast-modal-aberto');
    };

    modal.querySelector('[data-fechar]').addEventListener('click', fechar);
    modal.querySelector('[data-cancelar]').addEventListener('click', fechar);
    modal.addEventListener('click', (evento) => {
      if (evento.target === modal) fechar();
    });

    form.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      if (salvando) return;

      if (auth.currentUser?.uid !== PESQUISADOR_UID) {
        mostrarErro(msg, 'Sua sessão de pesquisador não está ativa.');
        return;
      }

      salvando = true;
      salvarBtn.disabled = true;
      salvarBtn.textContent = 'Salvando...';
      msg.classList.remove('is-erro');

      try {
        await aoSalvar({ form, modal, msg, progress, progressSpan });
        salvando = false;
        fechar();
      } catch (erro) {
        console.error('[podcast] Erro ao salvar:', erro);
        mostrarErro(msg, erro?.message || 'Não foi possível salvar agora.');
        salvarBtn.disabled = false;
        salvarBtn.textContent = salvarTexto;
        salvando = false;
      }
    });

    return modal;
  }
}

function normalizarDados(dados) {
  return {
    numero: formatarNumero(dados.numero),
    cargo: dados.cargo || '',
    nome: dados.nome || '',
    descricao: dados.descricao || '',
    fotoUrl: dados.fotoUrl || '',
    entrevistador1: dados.entrevistador1 || '',
    entrevistador2: dados.entrevistador2 || '',
    youtubeUrl: dados.youtubeUrl || '',
    sobreConversa: dados.sobreConversa || '',
    links: Array.isArray(dados.links) ? dados.links : [],
    bastidores: Array.isArray(dados.bastidores) ? dados.bastidores : [],
    grupos: Array.isArray(dados.grupos) ? dados.grupos : []
  };
}

function abrirModal(modal) {
  modal.hidden = false;
  document.body.classList.add('podcast-modal-aberto');
  requestAnimationFrame(() => modal.querySelector('input, textarea')?.focus());
}

function validarImagem(arquivo) {
  if (!arquivo.type.startsWith('image/')) return 'Escolha uma imagem válida.';
  if (arquivo.size > 10 * 1024 * 1024) return 'A imagem precisa ter no máximo 10 MB.';
  return '';
}

function enviarArquivo(arquivo, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append('file', arquivo);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);
    xhr.responseType = 'json';
    xhr.timeout = 10 * 60 * 1000;

    xhr.upload.addEventListener('progress', (evento) => {
      if (!evento.lengthComputable) return;
      onProgress?.((evento.loaded / evento.total) * 100);
    });

    xhr.addEventListener('load', () => {
      const resposta = xhr.response || {};
      if (xhr.status >= 200 && xhr.status < 300 && resposta.secure_url) {
        onProgress?.(100);
        resolve({
          url: resposta.secure_url,
          publicId: resposta.public_id || '',
          resourceType: resposta.resource_type || ''
        });
        return;
      }

      reject(new Error(resposta?.error?.message || 'O Cloudinary recusou o arquivo.'));
    });

    xhr.addEventListener('error', () => reject(new Error('Falha de rede durante o upload.')));
    xhr.addEventListener('timeout', () => reject(new Error('O upload demorou tempo demais.')));
    xhr.send(formData);
  });
}

function otimizarImagem(url, largura, altura) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace(
    '/upload/',
    `/upload/f_auto,q_auto:good,w_${largura},h_${altura},c_fill,g_auto/`
  );
}

function normalizarVideoCloudinary(url) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/video/upload/')) return url;

  let resultado = url.replace(
    '/video/upload/',
    '/video/upload/f_mp4,vc_h264:baseline,ac_aac,q_auto:good/'
  );

  const queryIndex = resultado.indexOf('?');
  const query = queryIndex >= 0 ? resultado.slice(queryIndex) : '';
  let base = queryIndex >= 0 ? resultado.slice(0, queryIndex) : resultado;
  const slash = base.lastIndexOf('/');
  const ponto = base.lastIndexOf('.');

  if (ponto > slash) base = `${base.slice(0, ponto)}.mp4`;
  else base += '.mp4';

  return base + query;
}

function extrairYoutubeId(url) {
  const valor = String(url || '').trim();
  if (!valor) return '';

  try {
    const parsed = new URL(valor);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || '';

    if (host.endsWith('youtube.com')) {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v') || '';

      const partes = parsed.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live'].includes(partes[0])) return partes[1] || '';
    }
  } catch {
    return '';
  }

  return '';
}

function normalizarUrl(url) {
  const valor = String(url || '').trim();
  if (!valor) return '';
  if (/^https?:\/\//i.test(valor)) return valor;
  return `https://${valor}`;
}

function instagramHref(valor) {
  const texto = String(valor || '').trim();
  if (/^https?:\/\//i.test(texto)) return texto;
  return `https://www.instagram.com/${texto.replace(/^@/, '')}/`;
}

function instagramLabel(valor) {
  const texto = String(valor || '').trim();
  if (!texto) return '';

  if (/^https?:\/\//i.test(texto)) {
    try {
      const partes = new URL(texto).pathname.split('/').filter(Boolean);
      return partes[0] ? `@${partes[0]}` : 'Instagram';
    } catch {
      return 'Instagram';
    }
  }

  return texto.startsWith('@') ? texto : `@${texto}`;
}

function formatarNumero(valor) {
  const limpo = String(valor || '').replace(/\D/g, '');
  if (!limpo) return '--';
  return limpo.padStart(2, '0').slice(-3);
}

function iniciais(nome) {
  return String(nome || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0] || '')
    .join('')
    .toUpperCase();
}

function mostrarErro(el, texto) {
  el.textContent = texto;
  el.classList.add('is-erro');
}

function escapeHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(valor) {
  return escapeHtml(valor);
}
