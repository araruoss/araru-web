export async function fetchComicIndex(url, signal) {
  const response = await fetch(url, { signal, credentials: 'include' });
  if (!response.ok) throw new Error('indice');
  return response.json();
}

export async function fetchComicPage(url) {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error('pagina');
  return response.blob();
}
