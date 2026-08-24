import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import PdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker';

// Entrega o worker pelo pipeline do Vite e passa a instância diretamente ao
// PDF.js. Assim o leitor não depende do MIME atribuído a um arquivo .mjs pelo
// servidor, proxy ou túnel usado para publicar a aplicação.
if (typeof Worker !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();
}

export function openPdf(options) {
  return pdfjsLib.getDocument(options);
}
