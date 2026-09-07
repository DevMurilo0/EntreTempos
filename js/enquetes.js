import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  collection, addDoc, getDocs, orderBy, query, doc, deleteDoc, 
  getDoc, runTransaction, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { escutarUpvotes, alternarUpvote, jaVotou, uidPronto } from './upvotes.js';

const btnAddEnquete = document.getElementById('btn-add-enquete');
const modalEnquete = document.getElementById('modal-enquete');
const formEnquete = document.getElementById('form-enquete');
const btnCancelar = document.getElementById('btn-cancelar-enquete');
const btnSalvar = document.getElementById('btn-salvar-enquete');
const mensagem = document.getElementById('enquete-mensagem');
const listaEnquetes = document.getElementById('lista-enquetes');

// Elementos de opções e formato
const formatoRadios = document.querySelectorAll('input[name="enquete-formato"]');
const campoOpcoesVotacao = document.getElementById('campo-opcoes-votacao');
const listaInputsOpcoes = document.getElementById('enquetes-lista-opcoes');
const btnAddOpcao = document.getElementById('btn-add-opcao');
const contadorOpcoes = document.getElementById('enquetes-contador-opcoes');

const MAX_OPCOES = 20;
const MIN_OPCOES = 2;
let listenersEnquetes = [];

function gerarId(nome) {
  return 'enquete-' + nome
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

let isAdmin = false;

onAuthStateChanged(auth, (usuario) => {
  if (usuario && !usuario.isAnonymous) {
    isAdmin = true;
    btnAddEnquete.style.display = 'block';
    document.body.classList.add('admin-logado');
  } else {
    isAdmin = false;
    btnAddEnquete.style.display = 'none';
    document.body.classList.remove('admin-logado');
  }
});

function atualizarOpcoesModal() {
  if (!listaInputsOpcoes) return;
  const linhas = listaInputsOpcoes.querySelectorAll('.enquetes-opcao-linha');
  const total = linhas.length;

  if (contadorOpcoes) {
    contadorOpcoes.textContent = `${total}/${MAX_OPCOES}`;
  }

  if (btnAddOpcao) {
    if (total >= MAX_OPCOES) {
      btnAddOpcao.disabled = true;
      btnAddOpcao.textContent = 'Limite de 20 opções atingido';
    } else {
      btnAddOpcao.disabled = false;
      btnAddOpcao.textContent = '+ Criar nova opção';
    }
  }

  linhas.forEach((linha, index) => {
    const input = linha.querySelector('.enquete-opcao-input');
    if (input) {
      input.placeholder = `Opção ${index + 1}`;
      input.setAttribute('aria-label', `Opção ${index + 1}`);
    }

    let btnRemover = linha.querySelector('.enquetes-btn-remover-opcao');
    if (total > MIN_OPCOES) {
      if (!btnRemover) {
        btnRemover = document.createElement('button');
        btnRemover.type = 'button';
        btnRemover.className = 'enquetes-btn-remover-opcao';
        btnRemover.innerHTML = '&times;';
        btnRemover.title = 'Remover opção';
        btnRemover.setAttribute('aria-label', 'Remover opção');
        btnRemover.addEventListener('click', () => {
          linha.remove();
          atualizarOpcoesModal();
        });
        linha.appendChild(btnRemover);
      }
    } else if (btnRemover) {
      btnRemover.remove();
    }
  });
}

function criarLinhaOpcao(valor = '') {
  if (!listaInputsOpcoes) return null;
  const div = document.createElement('div');
  div.className = 'enquetes-opcao-linha';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'enquetes-input enquete-opcao-input';
  input.value = valor;

  div.appendChild(input);
  listaInputsOpcoes.appendChild(div);
  atualizarOpcoesModal();
  return input;
}

function alternarModoVotacao(comVotacao) {
  if (!campoOpcoesVotacao) return;
  const inputConteudo = document.getElementById('enquete-conteudo');
  const tagConteudoOpcional = document.getElementById('tag-conteudo-opcional');

  if (comVotacao) {
    campoOpcoesVotacao.style.display = 'flex';
    if (inputConteudo) inputConteudo.required = false;
    if (tagConteudoOpcional) tagConteudoOpcional.textContent = '(opcional)';
    if (listaInputsOpcoes) {
      listaInputsOpcoes.querySelectorAll('.enquete-opcao-input').forEach((inp, i) => {
        inp.required = (i < MIN_OPCOES);
      });
    }
  } else {
    campoOpcoesVotacao.style.display = 'none';
    if (inputConteudo) inputConteudo.required = true;
    if (tagConteudoOpcional) tagConteudoOpcional.textContent = '(obrigatório)';
    if (listaInputsOpcoes) {
      listaInputsOpcoes.querySelectorAll('.enquete-opcao-input').forEach(inp => {
        inp.required = false;
      });
    }
  }
}

function resetarOpcoesModal() {
  if (!listaInputsOpcoes) return;
  listaInputsOpcoes.innerHTML = '';
  criarLinhaOpcao();
  criarLinhaOpcao();
  const radioCom = document.getElementById('formato-com-votacao');
  if (radioCom) radioCom.checked = true;
  alternarModoVotacao(true);
}

if (formatoRadios) {
  formatoRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      alternarModoVotacao(e.target.value === 'com-votacao');
    });
  });
}

if (btnAddOpcao) {
  btnAddOpcao.addEventListener('click', () => {
    const total = listaInputsOpcoes.querySelectorAll('.enquetes-opcao-linha').length;
    if (total < MAX_OPCOES) {
      const novoInput = criarLinhaOpcao();
      if (novoInput) novoInput.focus();
    }
  });
}

btnAddEnquete.addEventListener('click', () => {
  modalEnquete.hidden = false;
  document.body.classList.add('enquetes-modal-aberto');
  formEnquete.reset();
  resetarOpcoesModal();
  mensagem.textContent = '';
});

btnCancelar.addEventListener('click', () => {
  modalEnquete.hidden = true;
  document.body.classList.remove('enquetes-modal-aberto');
});

formEnquete.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nome = document.getElementById('enquete-nome').value.trim();
  const tipoSelecionado = document.getElementById('enquete-tipo').value;
  const conteudo = document.getElementById('enquete-conteudo').value.trim();
  const modoVotacao = document.querySelector('input[name="enquete-formato"]:checked')?.value || 'com-votacao';
  const isComVotacao = modoVotacao === 'com-votacao';

  if (!nome || !tipoSelecionado) {
    mensagem.textContent = 'Preencha o nome e o tipo da enquete.';
    return;
  }

  if (!isComVotacao && !conteudo) {
    mensagem.textContent = 'Para enquetes sem votação, o campo conteúdo é obrigatório.';
    return;
  }

  let opcoesFinais = [];
  if (isComVotacao) {
    const inputs = listaInputsOpcoes.querySelectorAll('.enquete-opcao-input');
    inputs.forEach((inp, idx) => {
      const val = inp.value.trim();
      if (val) {
        opcoesFinais.push({
          id: idx,
          texto: val,
          votos: 0
        });
      }
    });

    if (opcoesFinais.length < MIN_OPCOES) {
      mensagem.textContent = 'Para enquetes com votação, preencha pelo menos 2 opções.';
      return;
    }

    if (opcoesFinais.length > MAX_OPCOES) {
      mensagem.textContent = 'O limite máximo é de 20 opções por enquete.';
      return;
    }
  }

  const tipoArray = [tipoSelecionado];

  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';
  mensagem.textContent = '';

  try {
    const dadosEnquete = {
      nome: nome,
      tipo: tipoArray,
      conteudo: conteudo,
      dataCriacao: new Date().toISOString(),
      comVotacao: isComVotacao
    };

    if (isComVotacao) {
      dadosEnquete.opcoes = opcoesFinais;
      dadosEnquete.totalVotos = 0;
    }

    await addDoc(collection(db, "enquetes"), dadosEnquete);
    
    modalEnquete.hidden = true;
    document.body.classList.remove('enquetes-modal-aberto');
    carregarEnquetes();
  } catch (erro) {
    console.error("Erro ao adicionar enquete: ", erro);
    mensagem.textContent = 'Erro ao salvar a enquete. Tente novamente.';
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar';
  }
});

async function alternarVotoOpcao(enqueteDocId, opcaoId) {
  await uidPronto();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado");

  const enqueteRef = doc(db, "enquetes", enqueteDocId);
  const votoRef = doc(db, "enquetes", enqueteDocId, "votos", uid);

  return await runTransaction(db, async (transaction) => {
    const enqueteSnap = await transaction.get(enqueteRef);
    if (!enqueteSnap.exists()) throw new Error("Enquete não encontrada");

    const enqueteData = enqueteSnap.data();
    const opcoes = (enqueteData.opcoes || []).map(o => ({ ...o }));
    let totalVotos = enqueteData.totalVotos || 0;

    const votoSnap = await transaction.get(votoRef);
    const jaVotou = votoSnap.exists();
    const votoAnterior = jaVotou ? votoSnap.data().opcaoId : null;

    if (jaVotou && votoAnterior === opcaoId) {
      // Desfazer voto
      const op = opcoes.find(o => o.id === opcaoId);
      if (op) op.votos = Math.max(0, (op.votos || 0) - 1);
      totalVotos = Math.max(0, totalVotos - 1);

      transaction.delete(votoRef);
      transaction.update(enqueteRef, { opcoes, totalVotos });
      localStorage.removeItem('enquete_voto_' + enqueteDocId);
      return null;
    } else if (jaVotou) {
      // Trocar de opção
      const opAntiga = opcoes.find(o => o.id === votoAnterior);
      if (opAntiga) opAntiga.votos = Math.max(0, (opAntiga.votos || 0) - 1);

      const opNova = opcoes.find(o => o.id === opcaoId);
      if (opNova) opNova.votos = (opNova.votos || 0) + 1;

      transaction.set(votoRef, { opcaoId, votouEm: Date.now() });
      transaction.update(enqueteRef, { opcoes });
      localStorage.setItem('enquete_voto_' + enqueteDocId, String(opcaoId));
      return opcaoId;
    } else {
      // Primeiro voto
      const opNova = opcoes.find(o => o.id === opcaoId);
      if (opNova) opNova.votos = (opNova.votos || 0) + 1;
      totalVotos = totalVotos + 1;

      transaction.set(votoRef, { opcaoId, votouEm: Date.now() });
      transaction.update(enqueteRef, { opcoes, totalVotos });
      localStorage.setItem('enquete_voto_' + enqueteDocId, String(opcaoId));
      return opcaoId;
    }
  });
}

async function obterVotoUsuario(enqueteDocId) {
  const salvoLocal = localStorage.getItem('enquete_voto_' + enqueteDocId);
  try {
    await uidPronto();
    const uid = auth.currentUser?.uid;
    if (!uid) return salvoLocal !== null ? parseInt(salvoLocal, 10) : null;
    const votoSnap = await getDoc(doc(db, "enquetes", enqueteDocId, "votos", uid));
    if (votoSnap.exists()) {
      const opcaoId = votoSnap.data().opcaoId;
      localStorage.setItem('enquete_voto_' + enqueteDocId, String(opcaoId));
      return opcaoId;
    } else {
      localStorage.removeItem('enquete_voto_' + enqueteDocId);
      return null;
    }
  } catch (err) {
    console.warn("Não foi possível verificar voto remoto, usando local:", err);
    return salvoLocal !== null ? parseInt(salvoLocal, 10) : null;
  }
}

async function carregarEnquetes() {
  listenersEnquetes.forEach(unsub => unsub());
  listenersEnquetes = [];

  try {
    const q = query(collection(db, "enquetes"), orderBy("dataCriacao", "desc"));
    const querySnapshot = await getDocs(q);
    
    listaEnquetes.innerHTML = '';
    
    if (querySnapshot.empty) {
      listaEnquetes.innerHTML = '<div class="enquetes-mensagem-estado">Nenhuma enquete encontrada.</div>';
      return;
    }
    
    function ordenarLista() {
      const itens = Array.from(listaEnquetes.children);
      itens.sort((a, b) => {
        const upA = parseInt(a.getAttribute('data-upvotes') || '0', 10);
        const upB = parseInt(b.getAttribute('data-upvotes') || '0', 10);
        if (upA !== upB) return upB - upA; // maior upvote primeiro
        return (b.getAttribute('data-criacao') || '').localeCompare(a.getAttribute('data-criacao') || ''); // desempate por criação
      });
      itens.forEach(item => listaEnquetes.appendChild(item));
    }
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const div = document.createElement('div');
      div.className = 'enquetes-item';
      div.setAttribute('data-upvotes', '0');
      div.setAttribute('data-criacao', data.dataCriacao || '');
      
      const topo = document.createElement('div');
      topo.className = 'enquetes-item-topo';
      
      const tituloContainer = document.createElement('div');
      const titulo = document.createElement('h2');
      titulo.className = 'enquetes-item-titulo';
      titulo.textContent = data.nome;
      
      const tipoTags = document.createElement('div');
      tipoTags.className = 'enquetes-tipo-tags';
      
      (data.tipo || []).forEach(t => {
        const span = document.createElement('span');
        span.className = 'enquetes-tag';
        span.textContent = t;
        tipoTags.appendChild(span);
      });
      
      tituloContainer.appendChild(titulo);
      tituloContainer.appendChild(tipoTags);
      topo.appendChild(tituloContainer);
      div.appendChild(topo);
      
      if (data.conteudo && data.conteudo.trim().length > 0) {
        const detalhes = document.createElement('div');
        detalhes.className = 'enquetes-item-detalhe';
        const conteudo = document.createElement('p');
        conteudo.textContent = data.conteudo;
        detalhes.appendChild(conteudo);
        div.appendChild(detalhes);
      }

      // Bloco de votação (caso a enquete possua opções de voto)
      const possuiVotacao = Boolean(data.comVotacao && Array.isArray(data.opcoes) && data.opcoes.length > 0);

      if (possuiVotacao) {
        const tagVotacao = document.createElement('span');
        tagVotacao.className = 'enquetes-tag enquetes-tag-votacao';
        tagVotacao.textContent = 'Votação';
        tipoTags.appendChild(tagVotacao);

        const blocoVotacao = document.createElement('div');
        blocoVotacao.className = 'enquetes-votacao-bloco';

        const tituloVotacao = document.createElement('h3');
        tituloVotacao.className = 'enquetes-votacao-titulo';
        tituloVotacao.textContent = 'Opções de Voto';
        blocoVotacao.appendChild(tituloVotacao);

        const listaOpcoesEl = document.createElement('div');
        listaOpcoesEl.className = 'enquetes-opcoes-voto-lista';
        blocoVotacao.appendChild(listaOpcoesEl);

        const rodapeVotacao = document.createElement('div');
        rodapeVotacao.className = 'enquetes-votacao-rodape';

        const totalVotosSpan = document.createElement('span');
        totalVotosSpan.className = 'enquetes-total-votos';
        rodapeVotacao.appendChild(totalVotosSpan);

        const dicaVotacao = document.createElement('span');
        dicaVotacao.className = 'enquetes-votacao-dica';
        dicaVotacao.textContent = 'Clique para votar ou alternar seu voto';
        rodapeVotacao.appendChild(dicaVotacao);

        blocoVotacao.appendChild(rodapeVotacao);
        div.appendChild(blocoVotacao);

        let votoAtual = null;

        function renderizarOpcoes(opcoes, totalVotos) {
          listaOpcoesEl.innerHTML = '';
          const total = typeof totalVotos === 'number' ? totalVotos : opcoes.reduce((acc, o) => acc + (o.votos || 0), 0);
          totalVotosSpan.textContent = `Total: ${total} ${total === 1 ? 'voto' : 'votos'}`;

          opcoes.forEach(opcao => {
            const votos = opcao.votos || 0;
            const perc = total > 0 ? Math.round((votos / total) * 100) : 0;
            const isVotado = votoAtual === opcao.id;

            const item = document.createElement('div');
            item.className = 'enquetes-opcao-voto-item' + (isVotado ? ' votado' : '');
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-pressed', isVotado ? 'true' : 'false');

            const barra = document.createElement('div');
            barra.className = 'enquetes-opcao-barra';
            barra.style.width = `${perc}%`;
            item.appendChild(barra);

            const info = document.createElement('div');
            info.className = 'enquetes-opcao-info';

            const esquerda = document.createElement('div');
            esquerda.className = 'enquetes-opcao-esquerda';

            const radio = document.createElement('div');
            radio.className = 'enquetes-opcao-radio';
            const dot = document.createElement('div');
            dot.className = 'enquetes-opcao-radio-dot';
            radio.appendChild(dot);

            const texto = document.createElement('span');
            texto.className = 'enquetes-opcao-texto';
            texto.textContent = opcao.texto;

            esquerda.appendChild(radio);
            esquerda.appendChild(texto);
            info.appendChild(esquerda);

            const stats = document.createElement('div');
            stats.className = 'enquetes-opcao-stats';
            stats.textContent = `${votos} ${votos === 1 ? 'voto' : 'votos'} (${perc}%)`;
            info.appendChild(stats);

            item.appendChild(info);

            const executarVoto = async () => {
              if (item.classList.contains('processando')) return;
              item.classList.add('processando');
              try {
                const novoVoto = await alternarVotoOpcao(docSnapshot.id, opcao.id);
                votoAtual = novoVoto;
              } catch (erroVoto) {
                console.error("Erro ao registrar voto:", erroVoto);
                alert("Não foi possível registrar o seu voto. Tente novamente.");
              } finally {
                item.classList.remove('processando');
              }
            };

            item.addEventListener('click', executarVoto);
            item.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                executarVoto();
              }
            });

            listaOpcoesEl.appendChild(item);
          });
        }

        renderizarOpcoes(data.opcoes || [], data.totalVotos || 0);

        obterVotoUsuario(docSnapshot.id).then(voto => {
          votoAtual = voto;
          renderizarOpcoes(data.opcoes || [], data.totalVotos || 0);
        });

        const unsub = onSnapshot(doc(db, "enquetes", docSnapshot.id), (snap) => {
          if (snap.exists()) {
            const snapData = snap.data();
            if (snapData.opcoes) {
              renderizarOpcoes(snapData.opcoes, snapData.totalVotos);
            }
          }
        });
        listenersEnquetes.push(unsub);
      }

      const acoes = document.createElement('div');
      acoes.className = 'enquetes-item-acoes';
      
      const enqueteId = gerarId(data.nome);

      const btnUpvote = document.createElement('button');
      btnUpvote.className = 'enquetes-btn-upvote btn-upvote';
      btnUpvote.setAttribute('data-upvote-id', enqueteId);
      btnUpvote.setAttribute('aria-label', 'Votar');
      
      const seta = document.createElement('span');
      seta.className = 'upvote-seta';
      seta.textContent = '▲';
      
      const totalSpan = document.createElement('span');
      totalSpan.className = 'upvote-total';
      totalSpan.textContent = '0';
      
      btnUpvote.appendChild(seta);
      btnUpvote.appendChild(totalSpan);
      
      jaVotou(enqueteId).then(votou => {
        if (votou) btnUpvote.classList.add('voted');
      });
      
      escutarUpvotes(enqueteId, (total) => {
        totalSpan.textContent = total;
        div.setAttribute('data-upvotes', total);
        ordenarLista();
      });
      
      btnUpvote.addEventListener('click', async () => {
        btnUpvote.disabled = true;
        try {
          const agoraVotou = await alternarUpvote(enqueteId);
          if (agoraVotou) {
            btnUpvote.classList.add('voted');
          } else {
            btnUpvote.classList.remove('voted');
          }
        } catch (erro) {
          console.error("Erro no upvote:", erro);
          alert("Não foi possível dar upvote.");
        } finally {
          btnUpvote.disabled = false;
        }
      });
      
      const btnDeletar = document.createElement('button');
      btnDeletar.className = 'enquetes-btn-deletar';
      btnDeletar.textContent = 'Deletar enquete';
      btnDeletar.addEventListener('click', async () => {
        if (confirm(`Tem certeza que deseja deletar "${data.nome}"?`)) {
          btnDeletar.disabled = true;
          try {
            await deleteDoc(doc(db, "enquetes", docSnapshot.id));
            await deleteDoc(doc(db, "upvotes", enqueteId));
            div.remove();
          } catch (erro) {
            console.error("Erro ao deletar:", erro);
            btnDeletar.disabled = false;
            alert("Erro ao deletar a enquete.");
          }
        }
      });
      
      acoes.appendChild(btnUpvote);
      acoes.appendChild(btnDeletar);
      div.appendChild(acoes);
      
      listaEnquetes.appendChild(div);
    });
  } catch (erro) {
    console.error("Erro ao carregar enquetes:", erro);
    listaEnquetes.innerHTML = '<div class="enquetes-mensagem-estado enquetes-mensagem-erro">Erro ao carregar as enquetes.</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  resetarOpcoesModal();
  carregarEnquetes();
});
