(() => {
  const theme = localStorage.getItem('araru:tema-global') || localStorage.getItem('biblioteca:tema') || 'dark';
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
})();
