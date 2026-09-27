const { createHash } = require('node:crypto');
const { once } = require('node:events');

const CLOUDINARY_CLOUD_NAME = 'uaisf2vc';
const TAMANHO_MAXIMO = 25 * 1024 * 1024;
const TEMPO_LIMITE_MS = 25_000;

function respostaJson(res, status, erro) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json({ erro });
}

function normalizarNomeArquivo(valor) {
  const base = String(valor || 'livro.pdf')
    .replace(/\.pdf$/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
  return `${base || 'livro'}.pdf`;
}

function analisarUrlCloudinary(valor) {
  const url = new URL(String(valor || ''));
  if (
    url.protocol !== 'https:'
    || url.hostname !== 'res.cloudinary.com'
    || url.port
    || url.username
    || url.password
  ) {
    throw new Error('URL de PDF não permitida.');
  }

  const partes = url.pathname.split('/').filter(Boolean);
  if (
    partes[0] !== CLOUDINARY_CLOUD_NAME
    || !['raw', 'image'].includes(partes[1])
    || partes[2] !== 'upload'
    || partes.length < 5
  ) {
    throw new Error('URL do Cloudinary inválida.');
  }

  const indiceVersao = partes.findIndex((parte, indice) => indice >= 3 && /^v\d+$/.test(parte));
  if (indiceVersao < 0 || indiceVersao === partes.length - 1) {
    throw new Error('Versão ou public_id ausente na URL do Cloudinary.');
  }

  const publicId = partes.slice(indiceVersao + 1).map(decodeURIComponent).join('/');
  if (!publicId.toLowerCase().endsWith('.pdf')) {
    throw new Error('O arquivo solicitado não é um PDF.');
  }

  url.search = '';
  url.hash = '';
  return {
    url: url.toString(),
    urlSanitizada: `${url.origin}${url.pathname}`,
    resourceType: partes[1],
    publicId
  };
}

function obterCredenciaisCloudinary() {
  // Configure somente no ambiente da Vercel. Nenhuma dessas credenciais é
  // enviada ao navegador ou registrada nos logs.
  let apiKey = process.env.CLOUDINARY_API_KEY || '';
  let apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME;

  if ((!apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
    try {
      const url = new URL(process.env.CLOUDINARY_URL);
      apiKey = decodeURIComponent(url.username);
      apiSecret = decodeURIComponent(url.password);
      cloudName = url.hostname;
    } catch (_) {
      return null;
    }
  }

  return apiKey && apiSecret && cloudName === CLOUDINARY_CLOUD_NAME
    ? { apiKey, apiSecret, cloudName }
    : null;
}

async function buscarComTimeout(url, opcoes = {}) {
  const controlador = new AbortController();
  const timer = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);
  try {
    return await fetch(url, { ...opcoes, signal: controlador.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function registrarRespostaCloudinary(etapa, resposta, urlSanitizada) {
  let mensagemCorpo = '';
  const contentType = resposta.headers.get('content-type') || '';
  if (/json|text/i.test(contentType)) {
    mensagemCorpo = (await resposta.clone().text().catch(() => '')).slice(0, 1000);
  }
  console.error('[download-pdf] resposta do Cloudinary', {
    etapa,
    status: resposta.status,
    contentType,
    contentLength: resposta.headers.get('content-length') || '',
    mensagemCloudinary: resposta.headers.get('x-cld-error') || '',
    mensagemCorpo,
    url: urlSanitizada
  });
}

async function resolverAssetId(arquivo, credenciais) {
  const endpoint = new URL(
    `https://api.cloudinary.com/v1_1/${credenciais.cloudName}/resources/`
      + `${arquivo.resourceType}/upload/${encodeURIComponent(arquivo.publicId)}`
  );
  const autorizacao = Buffer.from(`${credenciais.apiKey}:${credenciais.apiSecret}`).toString('base64');
  const resposta = await buscarComTimeout(endpoint, {
    headers: { Authorization: `Basic ${autorizacao}`, Accept: 'application/json' }
  });

  if (!resposta.ok) {
    await registrarRespostaCloudinary('admin-api', resposta, endpoint.origin + endpoint.pathname);
    return '';
  }

  const dados = await resposta.json().catch(() => ({}));
  return dados.asset_id || '';
}

async function baixarPorAssetId(assetId, credenciais) {
  const timestamp = Math.floor(Date.now() / 1000);
  const paraAssinar = `asset_id=${assetId}&timestamp=${timestamp}${credenciais.apiSecret}`;
  const signature = createHash('sha1').update(paraAssinar).digest('hex');
  const endpoint = new URL(
    `https://api.cloudinary.com/v1_1/${credenciais.cloudName}/asset/download`
  );
  endpoint.searchParams.set('asset_id', assetId);
  endpoint.searchParams.set('timestamp', String(timestamp));
  endpoint.searchParams.set('api_key', credenciais.apiKey);
  endpoint.searchParams.set('signature', signature);

  return buscarComTimeout(endpoint, { headers: { Accept: 'application/pdf' } });
}

async function transmitirPdf(resposta, res, nomeArquivo) {
  const tamanhoDeclarado = Number(resposta.headers.get('content-length') || 0);
  if (tamanhoDeclarado > TAMANHO_MAXIMO) throw new Error('PDF acima do limite de 25 MB.');
  if (!resposta.body) throw new Error('O Cloudinary retornou uma resposta vazia.');

  const leitor = resposta.body.getReader();
  const primeirosBlocos = [];
  let primeirosBytes = 0;
  let total = 0;

  while (primeirosBytes < 5) {
    const { done, value } = await leitor.read();
    if (done) break;
    const bloco = Buffer.from(value);
    primeirosBlocos.push(bloco);
    primeirosBytes += bloco.length;
    total += bloco.length;
    if (total > TAMANHO_MAXIMO) {
      await leitor.cancel().catch(() => {});
      throw new Error('PDF acima do limite de 25 MB.');
    }
  }

  const inicio = Buffer.concat(primeirosBlocos);
  if (inicio.length < 5 || inicio.subarray(0, 5).toString('ascii') !== '%PDF-') {
    await leitor.cancel().catch(() => {});
    throw new Error('O Cloudinary não retornou um PDF válido.');
  }

  res.status(200);
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
  if (tamanhoDeclarado) res.setHeader('Content-Length', String(tamanhoDeclarado));
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (!res.write(inicio)) await once(res, 'drain');

  while (true) {
    const { done, value } = await leitor.read();
    if (done) break;
    const bloco = Buffer.from(value);
    total += bloco.length;
    if (total > TAMANHO_MAXIMO) {
      await leitor.cancel().catch(() => {});
      res.destroy(new Error('PDF acima do limite de 25 MB.'));
      return;
    }
    if (!res.write(bloco)) await once(res, 'drain');
  }

  res.end();
}

module.exports = async function downloadPdf(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return respostaJson(res, 405, 'Método não permitido.');
  }

  let arquivo;
  try {
    arquivo = analisarUrlCloudinary(req.query?.url);
  } catch (erro) {
    return respostaJson(res, 400, erro.message || 'URL inválida.');
  }

  try {
    let resposta = await buscarComTimeout(arquivo.url, {
      redirect: 'error',
      headers: {
        Accept: 'application/pdf',
        'User-Agent': 'EntreTempos-PDF-Proxy/1.0'
      }
    });

    if (!resposta.ok) {
      await registrarRespostaCloudinary('cdn-publica', resposta, arquivo.urlSanitizada);

      const credenciais = obterCredenciaisCloudinary();
      if ([401, 403].includes(resposta.status) && credenciais) {
        await resposta.body?.cancel().catch(() => {});
        // Nunca confie no asset_id enviado pelo navegador: resolva-o a partir
        // da URL validada para impedir o uso do endpoint como proxy de ativos alheios.
        const assetId = await resolverAssetId(arquivo, credenciais);
        if (assetId) {
          resposta = await baixarPorAssetId(assetId, credenciais);
          if (!resposta.ok) {
            await registrarRespostaCloudinary(
              'asset-download',
              resposta,
              `https://api.cloudinary.com/v1_1/${credenciais.cloudName}/asset/download`
            );
          }
        }
      } else if ([401, 403].includes(resposta.status)) {
        console.error('[download-pdf] fallback autenticado indisponível', {
          credenciaisCloudinaryConfiguradas: false,
          url: arquivo.urlSanitizada
        });
      }
    }

    if (!resposta.ok) {
      return respostaJson(res, 502, 'Não foi possível obter o PDF no armazenamento.');
    }

    const nomeArquivo = normalizarNomeArquivo(req.query?.filename);
    return transmitirPdf(resposta, res, nomeArquivo);
  } catch (erro) {
    console.error('[download-pdf] falha ao obter PDF', {
      nome: erro?.name || 'Error',
      mensagem: erro?.message || 'Erro desconhecido',
      url: arquivo.urlSanitizada
    });
    if (res.headersSent) {
      res.destroy();
      return;
    }
    return respostaJson(res, 502, 'Não foi possível baixar o PDF agora. Tente novamente.');
  }
};
