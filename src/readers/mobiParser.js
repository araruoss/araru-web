export function parseMobiHtml(conteudo = '', resolveResourceUrl = (value) => value) {
  const documento = new DOMParser().parseFromString(conteudo, 'text/html');
  documento.querySelectorAll('script, iframe, object, embed, base').forEach((elemento) => elemento.remove());
  documento.querySelectorAll('*').forEach((elemento) => {
    for (const atributo of [...elemento.attributes]) if (/^on/i.test(atributo.name)) elemento.removeAttribute(atributo.name);
    for (const atributo of ['src', 'href', 'poster']) {
      const value = elemento.getAttribute(atributo);
      if (value && !value.startsWith('#')) elemento.setAttribute(atributo, resolveResourceUrl(value));
    }
  });
  const corpo = documento.body?.innerHTML || conteudo;
  return `<style>
    .mobi-conteudo { overflow-wrap: anywhere; }
    .mobi-conteudo img, .mobi-conteudo svg, .mobi-conteudo video { display: block; max-width: 100% !important; height: auto !important; margin: 1rem auto; }
    .mobi-conteudo table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
    .mobi-conteudo pre { max-width: 100%; overflow-x: auto; white-space: pre-wrap; }
    .mobi-conteudo p, .mobi-conteudo li { line-height: inherit !important; }
  </style>${corpo}`;
}
