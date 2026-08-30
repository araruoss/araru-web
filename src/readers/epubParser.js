import JSZip from 'jszip';
import { sanitizeReaderHtml, sanitizeReaderUrl } from './sanitize.js';

function normalizarCaminho(caminho = '') {
  const resultado = [];
  for (const parte of caminho.split('/')) {
    if (!parte || parte === '.') continue;
    if (parte === '..') resultado.pop();
    else resultado.push(parte);
  }
  return resultado.join('/');
}

function resolverCaminho(base, relativo) {
  return normalizarCaminho(`${base.split('/').slice(0, -1).join('/')}/${relativo}`);
}

function mimeDoArquivo(nome = '') {
  return { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', css: 'text/css' }[nome.split('.').pop()?.toLowerCase()] || 'application/octet-stream';
}

export async function parseEpub(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const texto = (nome) => zip.file(nome)?.async('string');
  const parser = new DOMParser();
  const container = parser.parseFromString(await texto('META-INF/container.xml'), 'application/xml');
  const rootfile = container.querySelector('rootfile')?.getAttribute('full-path');
  if (!rootfile) throw new Error('EPUB sem arquivo OPF');
  const opf = parser.parseFromString(await texto(rootfile), 'application/xml');
  const manifest = new Map([...opf.getElementsByTagName('item')].map((item) => [item.getAttribute('id'), { href: resolverCaminho(rootfile, item.getAttribute('href') || ''), tipo: item.getAttribute('media-type') || '' }]));
  const spine = [...opf.getElementsByTagName('itemref')].map((item) => manifest.get(item.getAttribute('idref'))).filter((item) => item?.href);
  const estilos = [];
  for (const item of manifest.values()) if (item.tipo === 'text/css' && zip.file(item.href)) estilos.push(await zip.file(item.href).async('string'));
  const secoes = [];
  for (const item of spine) {
    const entrada = zip.file(item.href);
    if (!entrada) continue;
    const documento = parser.parseFromString(await entrada.async('string'), 'application/xhtml+xml');
    documento.querySelectorAll('script,iframe,object,embed').forEach((elemento) => elemento.remove());
    for (const imagem of documento.querySelectorAll('img, image')) {
      const atributo = imagem.hasAttribute('href') ? 'href' : 'src';
      const valor = imagem.getAttribute(atributo) || imagem.getAttribute('xlink:href');
      const seguro = sanitizeReaderUrl(valor, { allowDataImage: true });
      if (!seguro || seguro.startsWith('data:')) continue;
      const nome = resolverCaminho(item.href, valor.split('#')[0]);
      const arquivo = zip.file(nome);
      if (!arquivo) continue;
      const dataUrl = `data:${mimeDoArquivo(nome)};base64,${await arquivo.async('base64')}`;
      imagem.setAttribute(atributo, dataUrl);
      if (imagem.hasAttribute('xlink:href')) imagem.setAttribute('xlink:href', dataUrl);
    }
    const corpo = documento.querySelector('body');
    if (corpo) secoes.push(`<section class="epub-secao">${sanitizeReaderHtml(corpo.innerHTML)}</section>`);
  }
  return `<style>${estilos.join('\n')}\n.epub-secao { width: 100%; }\n.epub-secao img, .epub-secao svg { width: var(--reader-media-width, 100%) !important; max-width: none !important; height: auto !important; display: block; }</style>${secoes.join('\n')}`;
}
