import { auth, db, storage } from '/js/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

const PESQUISADOR_UID = 'QuiQMjtXjOWNW2LCrot86rsHh0F2';
const SECOES = new Set(['poemas', 'desenhos', 'musica', 'curiosidades']);

const secao = document.body.dataset.autoraisSecao;
if (!SECOES.has(secao)) {
  console.warn('[autorais] seção não reconhecida:', secao);
} else {
  iniciarGaleria();
}

function iniciarGaleria() {
  const alvo = obterAlvoGaleria();
  const barra = criarBarraAdmin(alvo);
  const botaoAdicionar = barra.querySelector('[data-et-adicionar]');
  const modal = criarModalCadastro();
  document.body.appendChild(modal);

  let pesquisadorLogado = false;

  onAuthStateChanged(auth, (usuario) => {
    pesquisadorLogado = usuario?.uid === PESQUISADOR_UID;
    barra.classList.toggle('is-pesquisador', pesquisadorLogado);
  });

  botaoAdicionar.addEventListener('click', () => {
    if (!pesquisadorLogado) return;
    abrirModal(modal);
  });

  observarParticipantes(alvo);
}

function obterAlvoGaleria() {
  const existente = document.querySelector('.fotos-navegacao');
  if (existente) return existente;

  const novo = document.createElement('section');
  novo.className = 'et-participantes-dinamicos';
  novo.setAttribute('aria-label', 'Autores adicionados pelos pesquisadores');

  const primeiroAutor = document.querySelector('.autor-bloco');
  if (primeiroAutor?.parentNode) {
    primeiroAutor.parentNode.insertBefore(novo, primeiroAutor);
  } else {
    const rodape = document.querySelector('[class*="rodape"]');
    (rodape?.parentNode || document.body).insertBefore(novo, rodape || null);
  }

  return novo;
}

function criarBarraAdmin(alvo) {
  const barra = document.createElement('div');
  barra.className = 'et-admin-barra';
  barra.innerHTML = `
    <button type="button" class="et-admin-adicionar" data-et-adicionar>
      <span class="et-admin-adicionar__mais" aria-hidden="true">+</span>
      <span>Adicionar pessoa</span>
    </button>
  `;

  alvo.parentNode.insertBefore(barra, alvo);
  return barra;
}

function observarParticipantes(alvo) {
  const consulta = query(
    collection(db, 'participantesAutorais'),
    where('secao', '==', secao)
  );

  onSnapshot(consulta, (snapshot) => {
    alvo.querySelectorAll('[data-et-pessoa-dinamica]').forEach((el) => el.remove());

    const docs = snapshot.docs
      .filter((item) => item.data().ativo !== false)
      .sort((a, b) => obterMillis(a.data().criadoEm) - obterMillis(b.data().criadoEm));

    docs.forEach((item) => {
      alvo.appendChild(criarCardPessoa(item.id, item.data()));
    });
  }, (erro) => {
    console.error('[autorais] Falha ao carregar participantes:', erro);
  });
}

function criarCardPessoa(id, dados) {
  const link = document.createElement('a');
  link.className = 'et-pessoa-card';
  link.dataset.etPessoaDinamica = 'true';
  link.href = `/topicos/autorais/pessoa.html?secao=${encodeURIComponent(secao)}&id=${encodeURIComponent(id)}`;
  link.setAttribute('aria-label', `Ver publicações de ${dados.nome || 'participante'}`);

  const moldura = document.createElement('span');
  moldura.className = 'et-pessoa-card__foto';

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = dados.fotoUrl || '/img/amp.png';
  img.alt = dados.nome ? `Foto de ${dados.nome}` : 'Foto do participante';
  moldura.appendChild(img);

  const nome = document.createElement('span');
  nome.className = 'et-pessoa-card__nome';
  nome.textContent = dados.nome || 'Sem nome';

  link.append(moldura, nome);

  if (dados.descricao) {
    const descricao = document.createElement('span');
    descricao.className = 'et-pessoa-card__descricao';
    descricao.textContent = dados.descricao;
    link.appendChild(descricao);
  }

  return link;
}

function criarModalCadastro() {
  const modal = document.createElement('div');
  modal.className = 'et-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="et-modal__caixa" role="dialog" aria-modal="true" aria-labelledby="et-nova-pessoa-titulo">
      <button type="button" class="et-modal__fechar" data-et-fechar aria-label="Fechar">×</button>
      <p class="et-modal__kicker">Entre Tempos · pesquisadores</p>
      <h2 class="et-modal__titulo" id="et-nova-pessoa-titulo">Adicionar pessoa</h2>

      <form data-et-form-pessoa novalidate>
        <div class="et-campo">
          <label for="et-pessoa-nome">Nome</label>
          <input id="et-pessoa-nome" name="nome" type="text" maxlength="120" autocomplete="name" required>
        </div>

        <div class="et-campo">
          <label for="et-pessoa-descricao">Descrição</label>
          <textarea id="et-pessoa-descricao" name="descricao" maxlength="1200" rows="5" required></textarea>
        </div>

        <div class="et-campo et-arquivo">
          <label for="et-pessoa-foto">Imagem da pessoa</label>
          <input id="et-pessoa-foto" name="foto" type="file" accept="image/*" required>
          <img class="et-preview" data-et-preview alt="Prévia da imagem selecionada">
        </div>

        <p class="et-progresso" data-et-mensagem role="status" aria-live="polite"></p>
        <div class="et-progress-bar" data-et-barra><span></span></div>

        <div class="et-modal__acoes">
          <button type="button" class="et-btn et-btn--secundario" data-et-cancelar>Cancelar</button>
          <button type="submit" class="et-btn et-btn--principal" data-et-salvar>Salvar e adicionar conteúdo →</button>
        </div>
      </form>
    </div>
  `;

  const form = modal.querySelector('[data-et-form-pessoa]');
  const inputFoto = form.elements.foto;
  const preview = modal.querySelector('[data-et-preview]');
  const mensagem = modal.querySelector('[data-et-mensagem]');
  const barra = modal.querySelector('[data-et-barra]');
  const barraInterna = barra.querySelector('span');
  const salvar = modal.querySelector('[data-et-salvar]');
  let previewUrl = null;
  let salvando = false;

  inputFoto.addEventListener('change', () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const arquivo = inputFoto.files?.[0];
    if (!arquivo) {
      preview.classList.remove('is-visible');
      preview.removeAttribute('src');
      return;
    }

    previewUrl = URL.createObjectURL(arquivo);
    preview.src = previewUrl;
    preview.classList.add('is-visible');
  });

  function fechar() {
    if (salvando) return;
    fecharModal(modal);
    form.reset();
    mensagem.textContent = '';
    mensagem.classList.remove('is-erro');
    barra.classList.remove('is-visible');
    barraInterna.style.width = '0%';
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    preview.classList.remove('is-visible');
    preview.removeAttribute('src');
  }

  modal.querySelector('[data-et-fechar]').addEventListener('click', fechar);
  modal.querySelector('[data-et-cancelar]').addEventListener('click', fechar);
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fechar();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !modal.hidden) fechar();
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (salvando) return;

    const usuario = auth.currentUser;
    if (usuario?.uid !== PESQUISADOR_UID) {
      mostrarErro(mensagem, 'Sua sessão de pesquisador não está ativa.');
      return;
    }

    const nome = form.elements.nome.value.trim();
    const descricao = form.elements.descricao.value.trim();
    const foto = form.elements.foto.files?.[0];

    if (!nome || !descricao || !foto) {
      mostrarErro(mensagem, 'Preencha nome, descrição e imagem.');
      return;
    }

    if (!foto.type.startsWith('image/')) {
      mostrarErro(mensagem, 'Escolha um arquivo de imagem válido.');
      return;
    }

    if (foto.size > 15 * 1024 * 1024) {
      mostrarErro(mensagem, 'A imagem precisa ter no máximo 15 MB.');
      return;
    }

    salvando = true;
    salvar.disabled = true;
    salvar.textContent = 'Salvando...';
    mensagem.textContent = 'Enviando a imagem...';
    mensagem.classList.remove('is-erro');
    barra.classList.add('is-visible');

    const pessoaRef = doc(collection(db, 'participantesAutorais'));
    let fotoPath = null;

    try {
      fotoPath = `conteudosAutorais/${secao}/${pessoaRef.id}/perfil/perfil-${Date.now()}-${nomeArquivoSeguro(foto.name)}`;
      const fotoUrl = await enviarArquivo(foto, fotoPath, (percentual) => {
        barraInterna.style.width = `${percentual}%`;
        mensagem.textContent = `Enviando a imagem... ${Math.round(percentual)}%`;
      });

      mensagem.textContent = 'Criando a página da pessoa...';

      await setDoc(pessoaRef, {
        nome,
        descricao,
        fotoUrl,
        fotoPath,
        secao,
        ativo: true,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        criadoPor: usuario.uid
      });

      window.location.href = `/topicos/autorais/pessoa.html?secao=${encodeURIComponent(secao)}&id=${encodeURIComponent(pessoaRef.id)}&novo=1`;
    } catch (erro) {
      console.error('[autorais] Falha ao adicionar pessoa:', erro);
      if (fotoPath) {
        deleteObject(ref(storage, fotoPath)).catch(() => {});
      }
      mostrarErro(mensagem, mensagemErroFirebase(erro));
      barra.classList.remove('is-visible');
      barraInterna.style.width = '0%';
    } finally {
      salvando = false;
      salvar.disabled = false;
      salvar.textContent = 'Salvar e adicionar conteúdo →';
    }
  });

  return modal;
}

function abrirModal(modal) {
  modal.hidden = false;
  document.body.classList.add('et-modal-aberto');
  requestAnimationFrame(() => modal.querySelector('input')?.focus());
}

function fecharModal(modal) {
  modal.hidden = true;
  document.body.classList.remove('et-modal-aberto');
}

function enviarArquivo(arquivo, caminho, onProgress) {
  return new Promise((resolve, reject) => {
    const referencia = ref(storage, caminho);
    const tarefa = uploadBytesResumable(referencia, arquivo, {
      contentType: arquivo.type || 'application/octet-stream'
    });

    tarefa.on('state_changed', (snapshot) => {
      const percentual = snapshot.totalBytes
        ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        : 0;
      onProgress?.(percentual);
    }, reject, async () => {
      try {
        resolve(await getDownloadURL(tarefa.snapshot.ref));
      } catch (erro) {
        reject(erro);
      }
    });
  });
}

function nomeArquivoSeguro(nome) {
  const partes = String(nome || 'arquivo').split('.');
  const extensao = partes.length > 1 ? partes.pop().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const base = partes.join('.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'arquivo';
  return extensao ? `${base}.${extensao}` : base;
}

function obterMillis(timestamp) {
  try {
    return timestamp?.toMillis?.() || 0;
  } catch {
    return 0;
  }
}

function mostrarErro(elemento, texto) {
  elemento.textContent = texto;
  elemento.classList.add('is-erro');
}

function mensagemErroFirebase(erro) {
  const codigo = erro?.code || '';
  if (codigo.includes('unauthorized') || codigo.includes('permission-denied')) {
    return 'Sem permissão para salvar. Confira as regras do Firebase e a sessão de pesquisador.';
  }
  if (codigo.includes('storage/unknown') || codigo.includes('storage/object-not-found')) {
    return 'O Firebase Storage não respondeu como esperado. Confira se o Storage está ativado.';
  }
  return 'Não foi possível salvar agora. Tente novamente.';
}
