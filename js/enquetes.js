import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, addDoc, getDocs, orderBy, query, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { escutarUpvotes, alternarUpvote, jaVotou } from './upvotes.js';

const btnAddEnquete = document.getElementById('btn-add-enquete');
const modalEnquete = document.getElementById('modal-enquete');
const formEnquete = document.getElementById('form-enquete');
const btnCancelar = document.getElementById('btn-cancelar-enquete');
const btnSalvar = document.getElementById('btn-salvar-enquete');
const mensagem = document.getElementById('enquete-mensagem');
const listaEnquetes = document.getElementById('lista-enquetes');

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

btnAddEnquete.addEventListener('click', () => {
  modalEnquete.hidden = false;
  document.body.classList.add('enquetes-modal-aberto');
  formEnquete.reset();
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

  if (!nome || !tipoSelecionado || !conteudo) {
    mensagem.textContent = 'Preencha todos os campos.';
    return;
  }

  const tipoArray = [tipoSelecionado];

  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';
  mensagem.textContent = '';

  try {
    await addDoc(collection(db, "enquetes"), {
      nome: nome,
      tipo: tipoArray,
      conteudo: conteudo,
      dataCriacao: new Date().toISOString()
    });
    
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

async function carregarEnquetes() {
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
      
      const detalhes = document.createElement('div');
      detalhes.className = 'enquetes-item-detalhe';
      const conteudo = document.createElement('p');
      conteudo.textContent = data.conteudo;
      detalhes.appendChild(conteudo);
      
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
      
      div.appendChild(topo);
      div.appendChild(detalhes);
      div.appendChild(acoes);
      
      listaEnquetes.appendChild(div);
    });
  } catch (erro) {
    console.error("Erro ao carregar enquetes:", erro);
    listaEnquetes.innerHTML = '<div class="enquetes-mensagem-estado enquetes-mensagem-erro">Erro ao carregar as enquetes.</div>';
  }
}

document.addEventListener('DOMContentLoaded', carregarEnquetes);
