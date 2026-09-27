export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Método não permitido.');
  }

  const { url, filename } = req.query || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).send('URL do PDF não informada.');
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).send('URL do PDF inválida.');
  }

  const caminhoPermitido =
    parsed.hostname === 'res.cloudinary.com' &&
    (
      parsed.pathname.startsWith('/uaisf2vc/raw/upload/') ||
      parsed.pathname.startsWith('/uaisf2vc/image/upload/')
    ) &&
    parsed.pathname.toLowerCase().endsWith('.pdf');

  if (!caminhoPermitido) {
    return res.status(400).send('Origem do PDF não permitida.');
  }

  try {
    const resposta = await fetch(parsed.toString());

    if (!resposta.ok) {
      return res.status(resposta.status).send('Não foi possível obter o PDF.');
    }

    const tipo = resposta.headers.get('content-type') || '';
    if (!tipo.toLowerCase().includes('pdf') && !parsed.pathname.toLowerCase().endsWith('.pdf')) {
      return res.status(415).send('O arquivo retornado não é um PDF.');
    }

    const arrayBuffer = await resposta.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 25 * 1024 * 1024) {
      return res.status(413).send('O PDF excede o limite de 25 MB.');
    }

    const nomeBase = String(filename || 'livro')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/\.pdf$/i, '') || 'livro';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('Content-Disposition', `attachment; filename="${nomeBase}.pdf"`);
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(200).send(buffer);
  } catch (erro) {
    console.error('[download-pdf] erro:', erro);
    return res.status(502).send('Não foi possível baixar o PDF agora.');
  }
}
