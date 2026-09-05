import { db } from './firebase-config.js';
import { collection, doc, getDoc, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const formulario = document.getElementById('formulario-inscricao');
const botao = document.getElementById('botao-enviar');
const mensagem = document.getElementById('mensagem-formulario');
let enviando = false;

const termosBloqueados = {
  palavroes: [
    'arrombada', 'arrombado', 'bosta', 'cacete', 'caralho', 'caralhos', 'cuzao',
    'desgracada', 'desgracado', 'fdp', 'foder', 'merda', 'merdas',
    'porra', 'porras', 'puta', 'puto'
  ],
  ofensivos: [
    'babaca', 'corna', 'corno', 'cretina', 'cretino', 'escrota', 'escroto',
    'idiota', 'imbecil', 'mongoloide', 'nojenta', 'nojento', 'otaria', 'otario',
    'retardada', 'retardado', 'vagabunda', 'vagabundo'
  ],
  sexuais: [
    'boquete', 'ejaculacao', 'masturbacao', 'orgasmo', 'pornografia', 'pornografico',
    'porno', 'punheta', 'transar', 'estupro'
  ],
  anatomiaExplicita: [
    'anus', 'bucata', 'buceta', 'bucetas', 'clitoris', 'cu', 'penis', 'piroca', 'pirocas',
    'testiculo', 'testiculos', 'vagina', 'vaginas', 'vulva', 'xota'
  ],
  doencas: [
    'aids', 'cancer', 'coronavirus', 'covid', 'dengue', 'diabetes', 'ebola',
    'gonorreia', 'hanseniase', 'hepatite', 'herpes', 'hiv', 'lepra', 'malaria',
    'sifilis', 'tuberculose'
  ]
};

const frasesBloqueadas = [
  'filha da puta', 'filho da puta', 'foda-se', 'tomar no cu', 'vai se foder', 'vai tomar no cu'
];

const padroesDeFraseNoNome = [
  /\beu (?:te )?(?:amo|odeio)\b/u,
  /\beu (?:gosto|nao gosto|sou|quero|vou|acho)\b/u,
  /\bvoce (?:e|eh|nao e|nao eh)\b/u,
  /\b(?:melhor|pior) que\b/u,
  /\bisso (?:nao )?(?:e|eh)\b/u,
  /\bmeu nome (?:e|eh)\b/u,
  /\bnao (?:gosto|sou|quero)\b/u
];

const padroesCompactadosDeFrase = [
  /^eute(?:amo|odeio)$/u,
  /^eugostode\p{L}+$/u,
  /^eusou\p{L}+$/u,
  /^voce(?:e|eh)\p{L}+$/u,
  /^issonao(?:e|eh)meunome$/u,
  /^meunome(?:e|eh)\p{L}+$/u,
  /^(?:lula|bolsonaro)(?:melhor|pior)que(?:lula|bolsonaro)$/u
];

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem-formulario mensagem-formulario--${tipo}`;
  mensagem.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
}

function normalizarTexto(valor) {
  return valor
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizarLeetToken(token) {
  if (!/\p{L}/u.test(token) || !/\d/u.test(token)) return token;
  const substituicoes = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't' };
  return token.replace(/[013457]/g, (numero) => substituicoes[numero]);
}

const listaConsolidada = new Set(
  Object.values(termosBloqueados).flat().map((termo) => normalizarTexto(termo))
);
const sequenciasBloqueadas = frasesBloqueadas.map((frase) => normalizarTexto(frase).split(' '));

function contemSequencia(tokens, sequencia) {
  if (sequencia.length > tokens.length) return false;
  return tokens.some((_, inicio) => sequencia.every((termo, indice) => tokens[inicio + indice] === termo));
}

function obterTrechosSoletrados(tokens) {
  const trechos = [];
  let trechoAtual = '';

  tokens.forEach((token) => {
    if (Array.from(token).length === 1) {
      trechoAtual += token;
    } else {
      if (trechoAtual.length >= 2) trechos.push(normalizarLeetToken(trechoAtual));
      trechoAtual = '';
    }
  });
  if (trechoAtual.length >= 2) trechos.push(normalizarLeetToken(trechoAtual));
  return trechos;
}

function contemConteudoBloqueado(valor) {
  const normalizado = normalizarTexto(valor);
  if (!normalizado) return false;

  const tokens = normalizado.split(' ');
  const tokensLeet = tokens.map(normalizarLeetToken);
  const termoExato = tokens.some((token, indice) =>
    listaConsolidada.has(token) || listaConsolidada.has(tokensLeet[indice])
  );
  const fraseExata = sequenciasBloqueadas.some((sequencia) =>
    contemSequencia(tokens, sequencia) || contemSequencia(tokensLeet, sequencia)
  );
  const termoSoletrado = obterTrechosSoletrados(tokens).some((trecho) => listaConsolidada.has(trecho));
  return termoExato || fraseExata || termoSoletrado;
}

function nomeValido(nome) {
  const letras = nome.match(/\p{L}/gu) || [];
  if (letras.length < 2 || !/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u.test(nome)) return false;

  const normalizado = normalizarTexto(nome);
  const palavras = normalizado ? normalizado.split(' ') : [];
  const compactado = palavras.join('');
  if (palavras.length > 6) return false;

  return !padroesDeFraseNoNome.some((padrao) => padrao.test(normalizado))
    && !padroesCompactadosDeFrase.some((padrao) => padrao.test(compactado));
}

function normalizarContato(contato) {
  const pareceProvedorEmail = /^@(gmail|hotmail|outlook|yahoo)\.[A-Za-z]{2,}$/i.test(contato);
  const instagram = !pareceProvedorEmail
    && /^@(?=.{2,30}$)(?=.*[A-Za-z0-9])(?!.*\.\.)(?!.*\.$)[A-Za-z0-9._]+$/.test(contato);
  if (instagram) return `instagram:${contato.slice(1).toLowerCase()}`;

  const email = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(contato);
  if (email) return `email:${contato.toLowerCase()}`;

  const telefoneFormatado = /^[+\d\s()-]+$/.test(contato);
  let digitos = contato.replace(/\D/g, '');
  if (!telefoneFormatado || digitos.length < 10 || digitos.length > 15) return null;
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;
  return `whatsapp:${digitos}`;
}

async function gerarHashSha256(valor) {
  const bytes = new TextEncoder().encode(valor);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function descricaoValida(descricao) {
  const letras = descricao.match(/\p{L}/gu) || [];
  if (letras.length < 5) return false;

  const compacto = normalizarTexto(descricao).replace(/[^\p{L}\p{N}]/gu, '');
  if (/^(.)\1{9,}$/u.test(compacto) || /^(.{2,12})\1{3,}$/u.test(compacto)) return false;

  const palavras = normalizarTexto(descricao).match(/[\p{L}\p{N}]+/gu) || [];
  return !(palavras.length >= 6 && new Set(palavras).size === 1);
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (enviando) return;

  const nome = formulario.elements.nome.value.trim();
  const contato = formulario.elements.contato.value.trim();
  const descricao = formulario.elements.descricao.value.trim();

  if (!nome || !contato || !descricao) {
    mostrarMensagem('Preencha todos os campos antes de enviar.', 'erro');
    return;
  }

  if (nome.length > 100 || contato.length > 150 || descricao.length > 2000) {
    mostrarMensagem('Um dos campos ultrapassou o limite de caracteres.', 'erro');
    return;
  }

  if (!nomeValido(nome)) {
    mostrarMensagem('Digite um nome válido.', 'erro');
    return;
  }

  if (contemConteudoBloqueado(nome)) {
    mostrarMensagem('Revise o conteúdo antes de enviar.', 'erro');
    return;
  }

  const contatoNormalizado = normalizarContato(contato);
  if (!contatoNormalizado) {
    mostrarMensagem('Informe um Instagram, e-mail ou WhatsApp válido.', 'erro');
    return;
  }

  if (contemConteudoBloqueado(descricao)) {
    mostrarMensagem('Revise o conteúdo antes de enviar.', 'erro');
    return;
  }

  if (!descricaoValida(descricao)) {
    mostrarMensagem('Conte com um pouco mais de detalhes como gostaria de participar.', 'erro');
    return;
  }

  enviando = true;
  botao.disabled = true;
  botao.textContent = 'Enviando...';
  mensagem.textContent = '';

  let contatoRef = null;
  let commitIniciado = false;

  try {
    const hashDoContato = await gerarHashSha256(contatoNormalizado);
    contatoRef = doc(db, 'contatosUsados', hashDoContato);
    const contatoExistente = await getDoc(contatoRef);

    if (contatoExistente.exists()) {
      mostrarMensagem('Esse contato já enviou uma inscrição.', 'erro');
      return;
    }

    const inscricaoRef = doc(collection(db, 'inscricoes'));
    const batch = writeBatch(db);

    batch.set(inscricaoRef, {
      nome,
      contato,
      descricao,
      criadoEm: serverTimestamp(),
      status: 'nova'
    });
    batch.set(contatoRef, { criadoEm: serverTimestamp() });
    commitIniciado = true;
    await batch.commit();

    formulario.reset();
    mostrarMensagem('Inscrição enviada com sucesso!', 'sucesso');
  } catch (erro) {
    console.error('[inscricoes] Erro ao enviar:', erro);
    const permissaoNegada = erro?.code === 'permission-denied' || erro?.code === 'firestore/permission-denied';
    let duplicidadeConfirmada = false;

    if (permissaoNegada && commitIniciado && contatoRef) {
      try {
        duplicidadeConfirmada = (await getDoc(contatoRef)).exists();
      } catch (erroVerificacao) {
        console.error('[inscricoes] Erro ao verificar contato após falha:', erroVerificacao);
      }
    }

    mostrarMensagem(duplicidadeConfirmada
      ? 'Esse contato já enviou uma inscrição.'
      : 'Não foi possível enviar agora. Tente novamente.', 'erro');
  } finally {
    enviando = false;
    botao.disabled = false;
    botao.textContent = 'Enviar';
  }
});
