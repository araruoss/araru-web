import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useLivros } from '../hooks/useLivros.js';
import { useFeatureFlags } from '../hooks/useFeatureFlags.js';
import { adicionarUltimoLido, getReadingProgress, saveReadingProgress } from '../utils/localStorage.js';
import { ReaderDock, ReaderErrorBoundary, ReaderSettings as ReaderOptions, ReaderShell } from '../components/reader/ReaderShell.jsx';
import { ReaderZoomControls } from '../components/reader/ReaderZoomControls.jsx';
import { adaptivePrefetchWindow, capabilitiesFor, engineNameFor } from '../readers/core.js';
import { calculatePdfScale } from '../readers/zoom.js';
import { useReaderZoom } from '../readers/useReaderZoom.js';
import { recordReaderMetric } from '../lib/telemetry.js';
import { backendUrl, bookContentUrl, bookPagesUrl } from '../lib/api.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { sanitizeReaderHtml } from '../readers/sanitize.js';

const PAGE_TURN_STORAGE_KEY = 'biblioteca:page-turn-mode';
const TEXT_THEMES = {
  claro: { background: '#ffffff', color: '#0f172a' },
  sepia: { background: '#f4ecd8', color: '#4a3622' },
  escuro: { background: '#0f172a', color: '#e2e8f0' }
};

function descartarRecurso(alvo, metodo, contexto) {
  const funcao = alvo?.[metodo];
  if (typeof funcao !== 'function') return;

  try {
    const resultado = funcao.call(alvo);
    if (resultado && typeof resultado.catch === 'function') {
      void resultado.catch((erro) => {
        if (import.meta.env.DEV) console.warn(`[reader cleanup] ${contexto}`, erro);
      });
    }
  } catch (erro) {
    if (import.meta.env.DEV) console.warn(`[reader cleanup] ${contexto}`, erro);
  }
}

function erroCancelamento(erro) {
  return erro?.name === 'AbortError' || erro?.name === 'RenderingCancelledException';
}

function clamp(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor));
}

function easeOutCubic(valor) {
  return 1 - ((1 - valor) ** 3);
}

function buildStaticPageClip(direction, foldStart, width, height, anchorY) {
  const seamBleed = Math.min(18, Math.max(4, width * 0.025));

  if (direction === 'next') {
    return `polygon(0px 0px, ${foldStart + seamBleed}px 0px, ${foldStart}px ${anchorY}px, ${foldStart + seamBleed}px ${height}px, 0px ${height}px)`;
  }

  return `polygon(${width}px 0px, ${width}px ${height}px, ${foldStart - seamBleed}px ${height}px, ${foldStart}px ${anchorY}px, ${foldStart - seamBleed}px 0px)`;
}

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const atualizar = () => setReduceMotion(media.matches);
    atualizar();
    media.addEventListener?.('change', atualizar);
    return () => media.removeEventListener?.('change', atualizar);
  }, []);

  return reduceMotion;
}

function useReaderControls(delay = 3200) {
  const [controlsVisible, setControlsVisible] = useState(true);

  const hideControls = useCallback(() => {
    setControlsVisible(true);
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
  }, []);

  const toggleControls = useCallback(() => {
    setControlsVisible(true);
  }, []);

  useEffect(() => {
    showControls();
  }, [showControls]);

  return { controlsVisible, showControls, hideControls, toggleControls };
}

function detectarFormato(livro = {}) {
  livro = livro || {};
  const supported = ['pdf', 'epub', 'mobi', 'cbz', 'cbr'];
  const candidates = [livro.formato, livro.extension, livro.originalFilename, livro.filename, livro.files?.[0]?.formato, livro.files?.[0]?.extension];
  for (const candidate of candidates) {
    const value = String(candidate || '').toLowerCase().replace(/^\./, '').trim();
    if (supported.includes(value)) return value;
    const extension = value.match(/\.(pdf|epub|mobi|cbz|cbr)$/)?.[1];
    if (extension) return extension;
  }
  return '';
}

function getPageTurnMode(livroId) {
  return 'none';
}

function setPageTurnMode(livroId, mode) {
  if (!livroId) return;
  window.localStorage.setItem(`${PAGE_TURN_STORAGE_KEY}:${livroId}`, mode);
}

function usePageTurn({ enabled, currentPage, pageCount, viewportWidth, mode, reducedMotion, canTurn, onCommit }) {
  const pointerRef = useRef(null);
  const animationFrameRef = useRef(0);
  const settleTimerRef = useRef(null);
  const [turn, setTurn] = useState({
    phase: 'idle',
    direction: null,
    progress: 0,
    offset: 0,
    targetPage: null,
    pointerRatioY: 0.78
  });

  const limparAnimacao = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    clearTimeout(settleTimerRef.current);
  }, []);

  useEffect(() => () => limparAnimacao(), [limparAnimacao]);

  const atualizarTurn = useCallback((proximo) => {
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => setTurn(proximo));
  }, []);

  const finalizar = useCallback((committed, direction, targetPage) => {
    limparAnimacao();
    settleTimerRef.current = window.setTimeout(() => {
      setTurn({ phase: 'idle', direction: null, progress: 0, offset: 0, targetPage: null, pointerRatioY: 0.78 });
      if (committed) onCommit(targetPage, direction);
    }, reducedMotion || mode === 'none' ? 0 : 220);
  }, [limparAnimacao, mode, onCommit, reducedMotion]);

  const iniciarPorBotao = useCallback((direction) => {
    if (!enabled || turn.phase !== 'idle') return false;
    const targetPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    if (targetPage < 1 || targetPage > pageCount) return false;
    if (!canTurn(direction, targetPage)) return false;
    if (reducedMotion || mode === 'none') {
      onCommit(targetPage, direction);
      return true;
    }
    setTurn({ phase: 'settling', direction, progress: 0, offset: 0, targetPage, pointerRatioY: 0.78 });
    requestAnimationFrame(() => {
      setTurn({
        phase: 'settling',
        direction,
        progress: 1,
        offset: direction === 'next' ? -viewportWidth : viewportWidth,
        targetPage,
        pointerRatioY: 0.78
      });
      finalizar(true, direction, targetPage);
    });
    return true;
  }, [canTurn, currentPage, enabled, finalizar, mode, onCommit, pageCount, reducedMotion, turn.phase, viewportWidth]);

  const onPointerDown = useCallback((event) => {
    if (!enabled || turn.phase !== 'idle' || event.pointerType === 'mouse' || event.button !== 0) return;
    if (event.target.closest('button, input, select, textarea, a')) return;
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      bounds: event.currentTarget.getBoundingClientRect(),
      started: false,
      blocked: false,
      direction: null
    };
  }, [enabled, turn.phase]);

  const onPointerMove = useCallback((event) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId || pointer.blocked) return;
    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!pointer.started) {
      if (absX < 12) return;
      if (absX <= absY * 1.2) {
        if (absY > 18) pointer.blocked = true;
        return;
      }
      const direction = dx < 0 ? 'next' : 'previous';
      const targetPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
      if (targetPage < 1 || targetPage > pageCount || !canTurn(direction, targetPage)) {
        pointer.blocked = true;
        return;
      }
      pointer.started = true;
      pointer.direction = direction;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    const width = Math.max(1, viewportWidth);
    const ratioY = clamp((event.clientY - pointer.bounds.top) / Math.max(1, pointer.bounds.height), 0.04, 0.96);
    const offset = clamp(
      dx,
      pointer.direction === 'next' ? -width : 0,
      pointer.direction === 'next' ? 0 : width
    );
    const progress = clamp(Math.abs(offset) / width, 0, 1);
    pointer.lastX = event.clientX;
    pointer.lastTime = event.timeStamp;
    event.preventDefault();
    atualizarTurn({
      phase: 'dragging',
      direction: pointer.direction,
      progress,
      offset,
      targetPage: pointer.direction === 'next' ? currentPage + 1 : currentPage - 1,
      pointerRatioY: ratioY
    });
  }, [atualizarTurn, canTurn, currentPage, pageCount, viewportWidth]);

  const onPointerUp = useCallback((event) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    pointerRef.current = null;
    if (!pointer.started) return;

    const dx = event.clientX - pointer.startX;
    const dt = Math.max(16, event.timeStamp - pointer.lastTime);
    const velocity = (event.clientX - pointer.lastX) / dt;
    const direction = pointer.direction;
    const targetPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    const width = Math.max(1, viewportWidth);
    const progress = clamp(Math.abs(dx) / width, 0, 1);
    const committed = progress >= 0.26 || Math.abs(velocity) > 0.55;

    if (reducedMotion || mode === 'none') {
      setTurn({ phase: 'idle', direction: null, progress: 0, offset: 0, targetPage: null, pointerRatioY: 0.78 });
      if (committed) onCommit(targetPage, direction);
      return;
    }

    setTurn({
      phase: 'settling',
      direction,
      progress: committed ? 1 : 0,
      offset: committed ? (direction === 'next' ? -width : width) : 0,
      targetPage,
      pointerRatioY: clamp((event.clientY - pointer.bounds.top) / Math.max(1, pointer.bounds.height), 0.04, 0.96)
    });
    finalizar(committed, direction, targetPage);
  }, [currentPage, finalizar, mode, onCommit, reducedMotion, viewportWidth]);

  const onPointerCancel = useCallback(() => {
    pointerRef.current = null;
    setTurn({ phase: 'idle', direction: null, progress: 0, offset: 0, targetPage: null, pointerRatioY: 0.78 });
  }, []);

  return {
    turn,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    turnPage: iniciarPorBotao
  };
}

function getReaderLayout(baseViewport, viewport, zoom, zoomMode = 'fit-width') {
  const desktop = (viewport.width || 0) >= 640;
  const larguraDisponivel = Math.max(280, (viewport.width || 900) - (desktop ? 48 : 8));
  const alturaDisponivel = Math.max(240, (viewport.height || 700) - (desktop ? 40 : 8));
  const scale = calculatePdfScale({ baseWidth: baseViewport.width, baseHeight: baseViewport.height, viewportWidth: larguraDisponivel, viewportHeight: alturaDisponivel, mode: zoomMode, zoom });
  const cssViewport = {
    width: baseViewport.width * scale,
    height: baseViewport.height * scale
  };
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  return {
    scale,
    ratio,
    width: cssViewport.width,
    height: cssViewport.height,
    pixelWidth: Math.floor(cssViewport.width * ratio),
    pixelHeight: Math.floor(cssViewport.height * ratio)
  };
}

function PageCurlEffect({ visible, direction, progress, pointerRatioY, width, height, currentSrc, target, targetClassName = '', currentStatic, currentStaticClassName = '', currentStaticStyle = {}, settling = false }) {
  if (!visible || !currentSrc || !width || !height || !direction) {
    return (
      <>
        {target}
        {currentStatic}
      </>
    );
  }

  const eased = easeOutCubic(progress);
  // A maior parte da folha fica plana enquanto o usuário arrasta. Só no
  // fechamento a página seguinte é revelada por completo.
  const finishProgress = clamp((progress - 0.78) / 0.22, 0, 1);
  const revealProgress = finishProgress + ((1 - finishProgress) * progress * 0.1);
  const revealWidth = width * revealProgress;
  // A dobra nunca ocupa a página inteira: é uma faixa de 14% a 24%.
  // No último frame ela encolhe e entrega toda a superfície à próxima página.
  const naturalFoldWidth = width * (0.14 + (0.1 * Math.sin(Math.PI * progress)));
  const foldWidth = Math.max(0, Math.min(naturalFoldWidth, width - revealWidth + 1));
  const foldStart = direction === 'next'
    ? Math.max(0, width - revealWidth - foldWidth)
    : Math.min(width, revealWidth + foldWidth);
  const anchorY = clamp(height * pointerRatioY, height * 0.08, height * 0.94);
  const shadowPeak = Math.sin(Math.min(progress, 1) * Math.PI);
  const foldShadowOpacity = clamp(0.14 + (shadowPeak * 0.34), 0.14, 0.48);
  const revealShadowOpacity = clamp(0.08 + (shadowPeak * 0.34), 0.08, 0.42);
  const movingShadowOpacity = clamp(0.16 + (shadowPeak * 0.46), 0.16, 0.62);
  const clipPath = buildStaticPageClip(direction, foldStart, width, height, anchorY);
  const curlRotation = (direction === 'next' ? -1 : 1) * (8 + (eased * 34));
  const curlOffset = (direction === 'next' ? -1 : 1) * (4 + (eased * 12));
  const curlLeft = direction === 'next' ? foldStart : foldStart - foldWidth;
  const shadowOffset = (direction === 'next' ? -1 : 1) * (10 + (eased * 12));
  const curlLift = (pointerRatioY - 0.5) * 15;
  const transition = settling ? 'clip-path 220ms ease-out, transform 220ms ease-out, opacity 180ms ease-out' : 'none';
  const curlClipPath = direction === 'next'
    ? `polygon(0px 0px, 100% ${Math.max(8, pointerRatioY * 100)}%, 0px 100%)`
    : `polygon(100% 0px, 0px ${Math.max(8, pointerRatioY * 100)}%, 100% 100%)`;

  return (
    <>
      <div className={`absolute inset-0 flex items-center justify-center overflow-hidden ${targetClassName}`} style={{ transition }}>
        {target}
        <div
          className="pointer-events-none absolute inset-y-0 w-[18%]"
          style={{
            opacity: revealShadowOpacity,
            [direction === 'next' ? 'right' : 'left']: 0,
            background: direction === 'next'
              ? 'linear-gradient(90deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.08) 26%, rgba(15,23,42,0.22) 100%)'
              : 'linear-gradient(270deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.08) 26%, rgba(15,23,42,0.22) 100%)'
          }}
        />
      </div>

      <div className={`absolute inset-0 flex items-center justify-center overflow-hidden ${currentStaticClassName}`} style={{ ...currentStaticStyle, clipPath, transition }}>
        {currentStatic}
      </div>

      {foldWidth > 1 && <div
        className="pointer-events-none absolute inset-y-0 z-10"
        style={{
          left: `${curlLeft}px`,
          width: `${foldWidth + 2}px`,
          clipPath: curlClipPath,
          transform: `translate3d(${curlOffset + shadowOffset}px, ${curlLift + 5}px, 0)`,
          transition,
          opacity: movingShadowOpacity,
          filter: 'blur(7px)',
          background: direction === 'next'
            ? 'linear-gradient(90deg, rgba(2,6,23,0.62), rgba(2,6,23,0.18) 58%, transparent)'
            : 'linear-gradient(270deg, rgba(2,6,23,0.62), rgba(2,6,23,0.18) 58%, transparent)'
        }}
      />}

      {foldWidth > 1 && <div
        className="pointer-events-none absolute inset-y-0 z-20 overflow-hidden"
        style={{
          left: `${curlLeft}px`,
          width: `${foldWidth + 1}px`,
          clipPath: curlClipPath,
          transformOrigin: direction === 'next' ? `left ${anchorY}px` : `right ${anchorY}px`,
          transform: `translate3d(${curlOffset}px, ${curlLift}px, 0) rotateY(${curlRotation}deg)`,
          transition,
          backfaceVisibility: 'hidden',
          backgroundImage: `linear-gradient(${direction === 'next' ? 90 : 270}deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 42%, rgba(15,23,42,0.26)), url(${currentSrc})`,
          backgroundBlendMode: 'screen, normal',
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${width}px ${height}px`,
          backgroundPosition: `-${curlLeft}px 0px`,
          boxShadow: direction === 'next'
            ? 'inset 2px 0 0 rgba(255,255,255,0.30), 10px 3px 22px rgba(15,23,42,0.34)'
            : 'inset -2px 0 0 rgba(255,255,255,0.30), -10px 3px 22px rgba(15,23,42,0.34)'
        }}
      >
        <div
          className="absolute inset-y-0 z-30"
          style={{
            [direction === 'next' ? 'left' : 'right']: 0,
            width: '14px',
            background: direction === 'next'
              ? 'linear-gradient(90deg, rgba(15,23,42,0.34), rgba(15,23,42,0.06), transparent)'
              : 'linear-gradient(270deg, rgba(15,23,42,0.34), rgba(15,23,42,0.06), transparent)',
            opacity: foldShadowOpacity
          }}
        />
      </div>}
    </>
  );
}

function PdfReader({ livro, url, onError, telaCheia, onToggleTelaCheia, onExit }) {
  const { t } = useLocale();
  const canvasRef = useRef(null);
  const shellRef = useRef(null);
  const loadingTaskRef = useRef(null);
  const pdfDocumentRef = useRef(null);
  const renderTaskRef = useRef(null);
  const renderLockRef = useRef(Promise.resolve());
  const requestControllerRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const cacheRef = useRef(new Map());
  const cacheTasksRef = useRef(new Map());
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [loadingPage, setLoadingPage] = useState(true);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [pageLayout, setPageLayout] = useState({ width: 0, height: 0 });
  const [targetLayout, setTargetLayout] = useState({ width: 0, height: 0 });
  const [seletorPaginaAberto, setSeletorPaginaAberto] = useState(false);
  const [paginaDestino, setPaginaDestino] = useState('1');
  const [menuAberto, setMenuAberto] = useState(false);
  const pinchRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const savedVisual = getReadingProgress(livro.id);
  const zoomController = useReaderZoom({ format: 'pdf', defaultZoom: Number(savedVisual?.zoom || 1), defaultMode: savedVisual?.zoom && Number(savedVisual.zoom) !== 1 ? 'custom' : 'fit-width', min: 0.75, max: 4 });
  const readerCapabilities = capabilitiesFor('pdf');
  const { zoom, mode: zoomMode, interactionProps: zoomInteractionProps } = zoomController;
  const { controlsVisible: controlesVisiveis, showControls: mostrarControles, toggleControls } = useReaderControls();

  const limparPdf = useCallback(() => {
    const renderTask = renderTaskRef.current;
    renderTaskRef.current = null;
    descartarRecurso(renderTask, 'cancel', 'cancelando renderização do PDF');

    const controller = requestControllerRef.current;
    requestControllerRef.current = null;
    controller?.abort();

    const documento = pdfDocumentRef.current;
    pdfDocumentRef.current = null;
    descartarRecurso(documento, 'cleanup', 'liberando páginas do PDF');
    descartarRecurso(documento, 'destroy', 'destruindo documento PDF');

    const loadingTask = loadingTaskRef.current;
    loadingTaskRef.current = null;
    descartarRecurso(loadingTask, 'destroy', 'destruindo carregamento do PDF');

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
    for (const tarefa of cacheTasksRef.current.values()) descartarRecurso(tarefa, 'cancel', 'cancelando cache PDF');
    cacheTasksRef.current.clear();
    cacheRef.current.clear();
  }, []);

  const renderizarPaginaNoCanvas = useCallback(async (pdf, pageNumber, targetCanvas) => {
    const pdfPage = await pdf.getPage(pageNumber);
    const baseViewport = pdfPage.getViewport({ scale: 1 });
    const layout = getReaderLayout(baseViewport, viewport, zoom, zoomMode);
    const pageViewport = pdfPage.getViewport({ scale: layout.scale });
    targetCanvas.width = layout.pixelWidth;
    targetCanvas.height = layout.pixelHeight;
    targetCanvas.style.width = `${layout.width}px`;
    targetCanvas.style.height = `${layout.height}px`;
    const context = targetCanvas.getContext('2d');
    context.setTransform(layout.ratio, 0, 0, layout.ratio, 0, 0);
    const renderTask = pdfPage.render({ canvasContext: context, viewport: pageViewport });
    await renderTask.promise;
    descartarRecurso(pdfPage, 'cleanup', 'liberando página do PDF em cache');
    return { layout, canvas: targetCanvas };
  }, [viewport, zoom, zoomMode]);

  const clonarCanvas = useCallback((sourceCanvas, layout) => {
    const clone = document.createElement('canvas');
    clone.width = sourceCanvas.width;
    clone.height = sourceCanvas.height;
    clone.style.width = `${layout.width}px`;
    clone.style.height = `${layout.height}px`;
    const cloneContext = clone.getContext('2d');
    cloneContext.drawImage(sourceCanvas, 0, 0);
    return { canvas: clone, layout, snapshotUrl: clone.toDataURL('image/jpeg', 0.88) };
  }, []);

  const prepararPagina = useCallback(async (pageNumber) => {
    const pdf = pdfDocumentRef.current;
    if (!pdf || pageNumber < 1 || pageNumber > pageCount) return null;
    const existente = cacheRef.current.get(pageNumber);
    if (existente) return existente;
    const emAndamento = cacheTasksRef.current.get(pageNumber);
    if (emAndamento) return emAndamento;

    const scratchCanvas = document.createElement('canvas');
    const tarefa = renderizarPaginaNoCanvas(pdf, pageNumber, scratchCanvas)
      .then((resultado) => {
        const entrada = { canvas: resultado.canvas, layout: resultado.layout };
        cacheRef.current.set(pageNumber, entrada);
        cacheTasksRef.current.delete(pageNumber);
        return entrada;
      })
      .catch((erro) => {
        cacheTasksRef.current.delete(pageNumber);
        if (!erroCancelamento(erro) && import.meta.env.DEV) console.warn('[reader] falha no cache do PDF', erro);
        return null;
      });
    cacheTasksRef.current.set(pageNumber, tarefa);
    return tarefa;
  }, [pageCount, renderizarPaginaNoCanvas]);

  const pageTurn = usePageTurn({
    enabled: (zoomMode !== 'custom' || zoom <= 1.02) && !loadingPage && pageCount > 0 && viewport.width > 0,
    currentPage: page,
    pageCount,
    viewportWidth: pageLayout.width || viewport.width || 1,
    mode: 'none',
    reducedMotion,
    canTurn: (direction, targetPage) => {
      if (targetPage < 1 || targetPage > pageCount) return false;
      return true;
    },
    onCommit: (targetPage) => {
      setPage(targetPage);
    }
  });

  useEffect(() => {
    let cancelled = false;
    limparPdf();
    const saved = getReadingProgress(livro.id);
    setPage(Math.max(1, Number(saved?.page || 1)));
    setPageCount(0);
    const controller = new AbortController();
    requestControllerRef.current = controller;
    import('../readers/pdfEngine.js').then(({ openPdf }) => {
      if (cancelled || controller.signal.aborted) return null;
      const loadingTask = openPdf({ url, withCredentials: true, disableAutoFetch: true, disableStream: false, disableRange: false });
      loadingTaskRef.current = loadingTask;
      return loadingTask.promise;
    }).then((pdfDocument) => {
      if (!pdfDocument) return;
      if (cancelled || controller.signal.aborted) {
        descartarRecurso(pdfDocument, 'destroy', 'descartando PDF carregado após saída');
        return;
      }
      pdfDocumentRef.current = pdfDocument;
      setPageCount(pdfDocument.numPages);
    }).catch((erro) => {
      if (!cancelled && !controller.signal.aborted && !erroCancelamento(erro)) onError('Não foi possível abrir este PDF.');
    });

    return () => {
      cancelled = true;
      limparPdf();
    };
  }, [limparPdf, livro.id, onError, url]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return undefined;
    const atualizarViewport = () => setViewport({ width: shell.clientWidth, height: shell.clientHeight });
    atualizarViewport();
    const observer = new ResizeObserver(atualizarViewport);
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const pdf = pdfDocumentRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas || !pageCount) return undefined;
    let cancelled = false;
    setLoadingPage(true);
    pdf.getPage(Math.min(page, pageCount)).then(async (pdfPage) => {
      if (cancelled) return;
      // O PDF.js não permite duas renderizações usando o mesmo canvas. Aguarda
      // o término do cancelamento anterior antes de iniciar a próxima.
      await renderLockRef.current;
      if (cancelled) {
        descartarRecurso(pdfPage, 'cleanup', 'liberando página PDF cancelada');
        return;
      }
      const layout = getReaderLayout(pdfPage.getViewport({ scale: 1 }), viewport, zoom, zoomMode);
      const pageViewport = pdfPage.getViewport({ scale: layout.scale });
      canvas.width = layout.pixelWidth;
      canvas.height = layout.pixelHeight;
      canvas.style.width = `${layout.width}px`;
      canvas.style.height = `${layout.height}px`;
      setPageLayout(layout);
      setTargetLayout(layout);
      const context = canvas.getContext('2d');
      context.setTransform(layout.ratio, 0, 0, layout.ratio, 0, 0);
      const previousRender = renderTaskRef.current;
      renderTaskRef.current = null;
      descartarRecurso(previousRender, 'cancel', 'cancelando página anterior');
      const renderTask = pdfPage.render({ canvasContext: context, viewport: pageViewport });
      renderTaskRef.current = renderTask;
      const renderPromise = renderTask.promise.finally(() => {
        if (renderTaskRef.current === renderTask) renderTaskRef.current = null;
        const cacheEntry = clonarCanvas(canvas, layout);
        cacheRef.current.set(page, cacheEntry);
        descartarRecurso(pdfPage, 'cleanup', 'liberando página PDF');
      });
      renderLockRef.current = renderPromise.catch(() => {});
      return renderPromise;
    }).then(() => !cancelled && setLoadingPage(false)).catch((error) => {
      if (!erroCancelamento(error) && !cancelled) {
        if (import.meta.env.DEV) console.warn('[reader] falha ao renderizar PDF', error);
        onError('Não foi possível renderizar esta página.');
      }
    });
    return () => {
      cancelled = true;
      const renderTask = renderTaskRef.current;
      renderTaskRef.current = null;
      descartarRecurso(renderTask, 'cancel', 'cancelando renderização ativa');
    };
  }, [onError, page, pageCount, viewport.height, viewport.width, zoom, zoomMode]);

  useEffect(() => {
    if (!pageCount || !pdfDocumentRef.current || !pageLayout.width) return undefined;
    let cancelled = false;
    const vizinhas = [page - 1, page + 1].filter((item) => item >= 1 && item <= pageCount);
    Promise.all(vizinhas.map((item) => prepararPagina(item))).then(() => {
      if (cancelled) return;
      for (const chave of [...cacheRef.current.keys()]) {
        if (![page - 1, page, page + 1].includes(chave)) cacheRef.current.delete(chave);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [page, pageCount, pageLayout.width, prepararPagina]);

  useEffect(() => { if (pageCount) saveReadingProgress(livro.id, { format: 'pdf', page, pageCount, zoom, progress: page / pageCount, fileFingerprint: livro.fileFingerprint || '' }); }, [livro, page, pageCount, zoom]);

  useEffect(() => {
    setPaginaDestino(String(page));
  }, [page]);

  const aoScroll = () => {
    const atual = shellRef.current?.scrollTop || 0;
    if (atual < lastScrollTopRef.current - 12) mostrarControles();
    lastScrollTopRef.current = atual;
  };

  const moverToque = (event) => {
    if (event.touches.length !== 2 || !pinchRef.current) return;
    const [a, b] = event.touches;
    const distancia = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const proximoZoom = pinchRef.current.zoom * (distancia / pinchRef.current.distance);
    zoomController.setZoom(proximoZoom);
  };

  const aoToqueNaPagina = (event) => {
    if (pageTurn.turn.phase !== 'idle' || event.target !== canvasRef.current) return;
    const largura = event.target.clientWidth;
    const x = event.nativeEvent.offsetX;
    if (x < largura * .24 && page > 1) { mostrarControles(); pageTurn.turnPage('previous'); }
    else if (x > largura * .76 && page < pageCount) { mostrarControles(); pageTurn.turnPage('next'); }
    else toggleControls();
  };

  const navegarPagina = (direction) => {
    mostrarControles();
    pageTurn.turnPage(direction);
  };

  const irParaPagina = (event) => {
    event.preventDefault();
    const destino = Number(paginaDestino);
    if (Number.isInteger(destino) && destino >= 1 && destino <= pageCount) {
      setPage(destino);
      setSeletorPaginaAberto(false);
      mostrarControles();
    }
  };

  return (
    <div
      ref={shellRef}
      onScroll={aoScroll}
      onClick={aoToqueNaPagina}
      onTouchStart={(event) => {
        if (event.touches.length === 2) {
          const [a, b] = event.touches;
          pinchRef.current = { distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom };
        }
      }}
      onTouchMove={moverToque}
      onTouchEnd={(event) => {
        if (event.touches.length < 2) pinchRef.current = null;
      }}
      onPointerDown={pageTurn.onPointerDown}
      onPointerMove={pageTurn.onPointerMove}
      onPointerUp={pageTurn.onPointerUp}
      onPointerCancel={pageTurn.onPointerCancel}
      className="reader-viewport flex h-full flex-col items-center overflow-auto bg-white p-0 sm:bg-slate-900 sm:p-4"
      {...zoomInteractionProps}
      style={{ touchAction: zoom > 1 ? 'pan-x pan-y pinch-zoom' : 'pan-y pinch-zoom' }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          width: `${Math.max(pageLayout.width, targetLayout.width || 0)}px`,
          minHeight: `${Math.max(pageLayout.height, targetLayout.height || 0)}px`,
          perspective: 'none'
        }}
      >
        <canvas ref={canvasRef} className="relative bg-white sm:shadow-xl" />
      </div>

      {loadingPage && <p className="pointer-events-none fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950/70 px-3 py-2 text-xs text-white/80">{t('reader.rendering')}</p>}
      {controlesVisiveis && <ReaderDock>
        {seletorPaginaAberto ? <form onSubmit={irParaPagina} className="flex items-center gap-2"><input autoFocus value={paginaDestino} onChange={(event) => setPaginaDestino(event.target.value)} inputMode="numeric" aria-label="Número da página" className="h-11 w-16 rounded-[1rem] bg-white/10 px-2 text-center outline-none" /><span className="whitespace-nowrap text-sm text-white/60">de {pageCount}</span><button className="h-11 rounded-[1rem] bg-white px-4 text-sm font-semibold text-slate-950">Ir</button><button type="button" onClick={() => { setSeletorPaginaAberto(false); mostrarControles(); }} className="grid h-11 w-11 rounded-[1rem] place-items-center hover:bg-white/12" aria-label="Cancelar"><X className="h-4 w-4" /></button></form> : <div className="flex items-center gap-1"><button type="button" disabled={page <= 1 || pageTurn.turn.phase !== 'idle'} onClick={() => navegarPagina('previous')} className="grid h-11 w-11 place-items-center rounded-[1rem] transition hover:bg-white/12 disabled:opacity-35" aria-label="Página anterior"><ChevronLeft /></button><button type="button" onClick={() => { mostrarControles(); setSeletorPaginaAberto(true); }} className="min-w-[88px] whitespace-nowrap px-2 text-sm font-medium tabular-nums" aria-label="Ir para página">{page} / {pageCount || '…'}</button><button type="button" disabled={!pageCount || page >= pageCount || pageTurn.turn.phase !== 'idle'} onClick={() => navegarPagina('next')} className="grid h-11 w-11 place-items-center rounded-[1rem] transition hover:bg-white/12 disabled:opacity-35" aria-label="Próxima página"><ChevronRight /></button><span className="mx-0.5 h-6 w-px bg-white/15" /><button type="button" onClick={onExit} className="grid h-11 w-11 place-items-center rounded-[1rem] transition hover:bg-white/12" aria-label="Fechar livro" title="Fechar livro"><X className="h-4 w-4" /></button></div>}
        <ReaderZoomControls capabilities={readerCapabilities} zoom={zoom} mode={zoomMode} onZoomIn={zoomController.zoomIn} onZoomOut={zoomController.zoomOut} onReset={zoomController.resetZoom} onFitWidth={() => zoomController.setFitMode('fit-width')} onFitPage={() => zoomController.setFitMode('fit-page')} className="w-full border-t border-white/10 pt-1 sm:w-auto sm:border-l sm:border-t-0 sm:pl-1 sm:pt-0" />
      </ReaderDock>}
      {menuAberto && <div className="fixed inset-0 z-40 flex items-end bg-black/35 p-3" onClick={() => setMenuAberto(false)}><div className="w-full rounded-2xl bg-slate-950 p-4 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}><p className="mb-3 text-sm font-semibold">Leitura</p><ReaderZoomControls capabilities={readerCapabilities} zoom={zoom} mode={zoomMode} onZoomIn={zoomController.zoomIn} onZoomOut={zoomController.zoomOut} onReset={zoomController.resetZoom} onFitWidth={() => zoomController.setFitMode('fit-width')} onFitPage={() => zoomController.setFitMode('fit-page')} className="w-full justify-center" /><button type="button" onClick={onToggleTelaCheia} className="mt-2 flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm hover:bg-white/10"><span>Tela cheia</span>{telaCheia ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}</button></div></div>}
    </div>
  );
}

function EpubReader({ livro, html, telaCheia, onToggleTelaCheia, onExit }) {
  const { t } = useLocale();
  const shellRef = useRef(null);
  const restoredRef = useRef('');
  const zoomController = useReaderZoom({ format: 'epub', defaultZoom: Number(getReadingProgress(livro.id)?.zoom || 1), min: 0.8, max: 2 });
  const { zoom, interactionProps: zoomInteractionProps } = zoomController;
  const [progress, setProgress] = useState(() => Number(getReadingProgress(livro.id)?.progress || 0));
  const [menuAberto, setMenuAberto] = useState(false);
  const [lineHeight, setLineHeight] = useState(() => Number(getReadingProgress(livro.id)?.lineHeight || 1.8));
  const [theme, setTheme] = useState(() => getReadingProgress(livro.id)?.theme || 'claro');
  const { controlsVisible, showControls, toggleControls } = useReaderControls();
  const textTheme = TEXT_THEMES[theme] || TEXT_THEMES.claro;
  const safeHtml = useMemo(() => sanitizeReaderHtml(html || '<p>Carregando EPUB...</p>'), [html]);

  const salvarPosicao = useCallback((element) => {
    const maxScroll = Math.max(0, element.scrollHeight - element.clientHeight);
    const nextProgress = maxScroll ? clamp(element.scrollTop / maxScroll, 0, 1) : 0;
    setProgress(nextProgress);
    saveReadingProgress(livro.id, {
      format: 'epub', progress: nextProgress, scrollTop: element.scrollTop,
      zoom, lineHeight, theme, fileFingerprint: livro.fileFingerprint || ''
    });
  }, [livro, zoom, lineHeight, theme]);

  useEffect(() => {
    if (!html || !shellRef.current || restoredRef.current === `${livro.id}:${html.length}`) return undefined;
    const shell = shellRef.current;
    const saved = getReadingProgress(livro.id);
    const frame = requestAnimationFrame(() => {
      const maxScroll = Math.max(0, shell.scrollHeight - shell.clientHeight);
      const savedProgress = Number(saved?.progress || 0);
      shell.scrollTop = Number.isFinite(saved?.scrollTop) ? Math.min(saved.scrollTop, maxScroll) : maxScroll * savedProgress;
      restoredRef.current = `${livro.id}:${html.length}`;
      salvarPosicao(shell);
    });
    return () => cancelAnimationFrame(frame);
  }, [html, livro.id, salvarPosicao]);

  useEffect(() => {
    if (shellRef.current) salvarPosicao(shellRef.current);
  }, [salvarPosicao, zoom, lineHeight, theme]);

  const navegar = useCallback((direcao) => {
    const shell = shellRef.current;
    if (!shell) return;
    shell.scrollBy({ top: direcao * Math.max(240, shell.clientHeight * 0.82), behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); navegar(-1); }
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') { event.preventDefault(); navegar(1); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navegar]);

  return (
    <div ref={shellRef} onScroll={(event) => salvarPosicao(event.currentTarget)} {...zoomInteractionProps} className="reader-viewport h-full overflow-auto sm:p-4" style={{ backgroundColor: textTheme.background }}>
      <article onClick={(event) => { if (!event.target.closest('a, button, input, select')) toggleControls(); }} className="mx-auto min-h-full w-full max-w-5xl px-4 py-4 sm:rounded-xl sm:p-10 sm:shadow-xl [&_.epub-secao]:mb-8 [&_img]:h-auto" style={{ fontSize: `${1.05 * zoom}rem`, lineHeight, backgroundColor: textTheme.background, color: textTheme.color, '--reader-media-width': `${100 * zoom}%` }} dangerouslySetInnerHTML={{ __html: safeHtml }} />
      {controlsVisible && <ReaderDock>
        <div className="flex items-center gap-1"><button type="button" onClick={() => navegar(-1)} className="grid h-11 w-11 place-items-center rounded-[1rem] transition hover:bg-white/12" aria-label="Trecho anterior"><ChevronLeft /></button>
        <span className="min-w-[88px] px-2 text-center text-sm font-medium tabular-nums">{Math.round(progress * 100)}%</span>
        <button type="button" onClick={() => navegar(1)} className="grid h-11 w-11 place-items-center rounded-[1rem] transition hover:bg-white/12" aria-label="Próximo trecho"><ChevronRight /></button><button type="button" onClick={onExit} className="grid h-11 w-11 place-items-center rounded-[1rem] transition hover:bg-white/12" aria-label="Fechar livro"><X className="h-4 w-4" /></button></div>
        <ReaderZoomControls capabilities={capabilitiesFor('epub')} zoom={zoom} onZoomIn={zoomController.zoomIn} onZoomOut={zoomController.zoomOut} onReset={zoomController.resetZoom} className="w-full border-t border-white/10 pt-1 sm:w-auto sm:border-l sm:border-t-0 sm:pl-1 sm:pt-0" />
      </ReaderDock>}
      <ReaderOptions open={menuAberto} onClose={() => { setMenuAberto(false); showControls(); }}>
        <p className="mb-3 text-sm font-semibold">Leitura</p>
        <ReaderZoomControls capabilities={capabilitiesFor('epub')} zoom={zoom} onZoomIn={zoomController.zoomIn} onZoomOut={zoomController.zoomOut} onReset={zoomController.resetZoom} className="w-full justify-center" />
        <label className="mt-2 flex items-center justify-between gap-3 text-sm text-white/70"><span>Espaçamento</span><select value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} className="h-10 rounded-xl bg-white/10 px-3 text-white outline-none"><option value="1.5" className="text-slate-900">Compacto</option><option value="1.8" className="text-slate-900">Normal</option><option value="2.1" className="text-slate-900">Confortável</option></select></label>
        <label className="mt-3 flex items-center justify-between gap-3 text-sm text-white/70"><span>Tema</span><select value={theme} onChange={(event) => setTheme(event.target.value)} className="h-10 rounded-xl bg-white/10 px-3 text-white outline-none"><option value="claro" className="text-slate-900">Claro</option><option value="sepia" className="text-slate-900">Sépia</option><option value="escuro" className="text-slate-900">Escuro</option></select></label>
        <button type="button" onClick={onToggleTelaCheia} className="mt-2 flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm hover:bg-white/10"><span>Tela cheia</span>{telaCheia ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}</button>
      </ReaderOptions>
    </div>
  );
}

function MobiReader({ livro, html, status = 'idle', error = '', onRetry, telaCheia, onToggleTelaCheia, onExit }) {
  const { t } = useLocale();
  const shellRef = useRef(null);
  const restoredRef = useRef('');
  const [menuAberto, setMenuAberto] = useState(false);
  const [progress, setProgress] = useState(() => Number(getReadingProgress(livro.id)?.progress || 0));
  const zoomController = useReaderZoom({ format: 'mobi', defaultZoom: Number(getReadingProgress(livro.id)?.zoom || 1), min: 0.8, max: 2 });
  const { zoom, interactionProps: zoomInteractionProps } = zoomController;
  const [lineHeight, setLineHeight] = useState(() => Number(getReadingProgress(livro.id)?.lineHeight || 1.8));
  const [theme, setTheme] = useState(() => getReadingProgress(livro.id)?.theme || 'claro');
  const { controlsVisible, showControls, toggleControls } = useReaderControls();
  const textTheme = TEXT_THEMES[theme] || TEXT_THEMES.claro;
  const safeHtml = useMemo(() => sanitizeReaderHtml(html || `<p>${t('reader.mobiLoading')}</p>`), [html, t]);

  const salvarPosicao = useCallback((element) => {
    const maxScroll = Math.max(0, element.scrollHeight - element.clientHeight);
    const nextProgress = maxScroll ? clamp(element.scrollTop / maxScroll, 0, 1) : 0;
    setProgress(nextProgress);
    saveReadingProgress(livro.id, { format: 'mobi', progress: nextProgress, scrollTop: element.scrollTop, zoom, lineHeight, theme, fileFingerprint: livro.fileFingerprint || '' });
  }, [livro, zoom, lineHeight, theme]);

  useEffect(() => {
    if (!html || !shellRef.current || restoredRef.current === `${livro.id}:${html.length}`) return undefined;
    const shell = shellRef.current;
    const saved = getReadingProgress(livro.id);
    const frame = requestAnimationFrame(() => {
      const maxScroll = Math.max(0, shell.scrollHeight - shell.clientHeight);
      shell.scrollTop = Number.isFinite(saved?.scrollTop) ? Math.min(saved.scrollTop, maxScroll) : maxScroll * Number(saved?.progress || 0);
      restoredRef.current = `${livro.id}:${html.length}`;
      salvarPosicao(shell);
    });
    return () => cancelAnimationFrame(frame);
  }, [html, livro.id, salvarPosicao]);

  useEffect(() => {
    if (shellRef.current) salvarPosicao(shellRef.current);
  }, [salvarPosicao, zoom, lineHeight, theme]);

  const navegar = useCallback((direcao) => {
    const shell = shellRef.current;
    if (!shell) return;
    shell.scrollBy({ top: direcao * Math.max(240, shell.clientHeight * 0.82), behavior: 'smooth' });
  }, []);

  return (
    <div ref={shellRef} onScroll={(event) => salvarPosicao(event.currentTarget)} {...zoomInteractionProps} className="reader-viewport h-full overflow-auto sm:p-4" style={{ backgroundColor: textTheme.background }}>
      {status === 'error' ? <section role="alert" className="grid min-h-full place-items-center p-6 text-center text-white"><div><p className="font-semibold">{t('reader.mobiFailed')}</p><p className="mt-2 max-w-md text-sm text-white/65">{error || t('reader.mobiEmpty')}</p><button type="button" onClick={onRetry} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-slate-950">{t('common.retry')}</button><button type="button" onClick={onExit} className="ml-2 min-h-11 rounded-full border border-white/20 px-4 text-sm">{t('common.back')}</button></div></section> : <article onClick={(event) => { if (!event.target.closest('a, button, input, select')) toggleControls(); }} className="mobi-conteudo mx-auto min-h-full w-full max-w-5xl px-4 py-4 sm:rounded-xl sm:p-10 sm:shadow-xl" style={{ fontSize: `${1.05 * zoom}rem`, lineHeight, backgroundColor: textTheme.background, color: textTheme.color, '--reader-media-width': `${100 * zoom}%` }} dangerouslySetInnerHTML={{ __html: safeHtml }} />}
      {controlsVisible && <ReaderDock>
        <div className="flex items-center gap-1"><button type="button" onClick={() => navegar(-1)} className="grid h-11 w-11 place-items-center rounded-[1rem] transition hover:bg-white/12" aria-label="Trecho anterior"><ChevronLeft /></button>
        <span className="min-w-[88px] px-2 text-center text-sm font-medium tabular-nums">{Math.round(progress * 100)}%</span>
        <button type="button" onClick={() => navegar(1)} className="grid h-11 w-11 place-items-center rounded-[1rem] transition hover:bg-white/12" aria-label="Próximo trecho"><ChevronRight /></button><button type="button" onClick={onExit} className="grid h-11 w-11 place-items-center rounded-[1rem] transition hover:bg-white/12" aria-label="Fechar livro"><X className="h-4 w-4" /></button></div>
        <ReaderZoomControls capabilities={capabilitiesFor('mobi')} zoom={zoom} onZoomIn={zoomController.zoomIn} onZoomOut={zoomController.zoomOut} onReset={zoomController.resetZoom} className="w-full border-t border-white/10 pt-1 sm:w-auto sm:border-l sm:border-t-0 sm:pl-1 sm:pt-0" />
      </ReaderDock>}
      <ReaderOptions open={menuAberto} onClose={() => { setMenuAberto(false); showControls(); }}><p className="mb-3 text-sm font-semibold">Leitura</p><ReaderZoomControls capabilities={capabilitiesFor('mobi')} zoom={zoom} onZoomIn={zoomController.zoomIn} onZoomOut={zoomController.zoomOut} onReset={zoomController.resetZoom} className="w-full justify-center" /><label className="mt-2 flex items-center justify-between gap-3 text-sm text-white/70"><span>Espaçamento</span><select value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} className="h-10 rounded-xl bg-white/10 px-3 text-white outline-none"><option value="1.5" className="text-slate-900">Compacto</option><option value="1.8" className="text-slate-900">Normal</option><option value="2.1" className="text-slate-900">Confortável</option></select></label><label className="mt-3 flex items-center justify-between gap-3 text-sm text-white/70"><span>Tema</span><select value={theme} onChange={(event) => setTheme(event.target.value)} className="h-10 rounded-xl bg-white/10 px-3 text-white outline-none"><option value="claro" className="text-slate-900">Claro</option><option value="sepia" className="text-slate-900">Sépia</option><option value="escuro" className="text-slate-900">Escuro</option></select></label><button type="button" onClick={onToggleTelaCheia} className="mt-2 flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm hover:bg-white/10"><span>Tela cheia</span>{telaCheia ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}</button></ReaderOptions>
    </div>
  );
}

export default function Leitura() {
  const { t } = useLocale();
  const { id, workId } = useParams();
  const effectiveWorkId = id || workId;
  const navigate = useNavigate();
  const location = useLocation();
  const { livros, loading } = useLivros();
  const { enabled: featureEnabled } = useFeatureFlags();
  const adaptivePrefetchEnabled = featureEnabled('adaptivePrefetch', true);
  const [epubHtml, setEpubHtml] = useState('');
  const [mobiHtml, setMobiHtml] = useState('');
  const [mobiStatus, setMobiStatus] = useState('idle');
  const [mobiError, setMobiError] = useState('');
  const [mobiAttempt, setMobiAttempt] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [comicImagem, setComicImagem] = useState('');
  const [comicTotal, setComicTotal] = useState(0);
  const [comicMode, setComicMode] = useState('page');
  const [comicModeManual, setComicModeManual] = useState(false);
  const [paginaDestino, setPaginaDestino] = useState('1');
  const [paginaCarregando, setPaginaCarregando] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [retomadaPendente, setRetomadaPendente] = useState(null);
  const [erroLeitor, setErroLeitor] = useState('');
  const [controlesComicVisiveis, setControlesComicVisiveis] = useState(true);
  const [seletorPaginaComicAberto, setSeletorPaginaComicAberto] = useState(false);
  const [menuComicAberto, setMenuComicAberto] = useState(false);
  const comicAbortRef = useRef(null);
  const comicRequestRef = useRef(0);
  const comicUrlRef = useRef('');
  const comicCacheRef = useRef(new Map());
  const comicInflightRef = useRef(new Map());
  const comicTotalRef = useRef(0);
  const comicToolbarTimerRef = useRef(null);
  const comicScrollTopRef = useRef(0);
  const comicPointersRef = useRef(new Map());
  const comicPinchRef = useRef(null);
  const livroState = location.state?.livro || null;
  const reducedMotion = useReducedMotion();
  const openedAtRef = useRef(performance.now());
  const firstPageMetricRef = useRef(false);

  const voltarParaBiblioteca = useCallback(() => {
    const origem = location.state?.from;
    if (origem?.pathname && origem.pathname !== location.pathname) {
      navigate({ pathname: origem.pathname, search: origem.search || '', hash: origem.hash || '' }, { replace: true, state: origem.state });
      return;
    }
    navigate('/', { replace: true });
  }, [location.pathname, location.state?.from, navigate]);

  const livro = useMemo(() => {
    const livroDaBiblioteca = livros.find((item) => item.id === effectiveWorkId);
    if (livroDaBiblioteca && livroState) {
      return {
        ...livroState,
        ...livroDaBiblioteca
      };
    }
    return livroDaBiblioteca || livroState;
  }, [effectiveWorkId, livroState, livros]);

  useEffect(() => {
    if (livro) {
      adicionarUltimoLido(livro);
    }
  }, [livro]);

  const formato = detectarFormato(livro);
  const readerEngine = engineNameFor(formato);
  const readerCapabilities = capabilitiesFor(formato);
  const url = bookContentUrl(livro);
  const paginasUrl = bookPagesUrl(livro);
  const comicZoomController = useReaderZoom({ format: 'comic', defaultMode: 'fit-page', min: 0.75, max: 4, enabled: ['cbz', 'cbr'].includes(formato) });
  const { zoom: comicZoom, mode: comicZoomMode, interactionProps: comicZoomInteractionProps } = comicZoomController;

  useEffect(()=>{if(!livro||firstPageMetricRef.current)return;const ready=formato==='pdf'||Boolean(epubHtml||mobiHtml||comicImagem);if(ready){firstPageMetricRef.current=true;recordReaderMetric({workId:livro.workId,fileId:livro.id,engine:readerEngine,event:'time-to-first-page',durationMs:performance.now()-openedAtRef.current});}},[comicImagem,epubHtml,formato,livro,mobiHtml,readerEngine]);
  useEffect(()=>{if(erroLeitor&&livro)recordReaderMetric({workId:livro.workId,fileId:livro.id,engine:readerEngine,event:'open-failure',detail:{message:erroLeitor}});},[erroLeitor,livro,readerEngine]);

  useEffect(() => {
    const atualizarTelaCheia = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', atualizarTelaCheia);
    return () => document.removeEventListener('fullscreenchange', atualizarTelaCheia);
  }, []);

  const alternarTelaCheia = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen?.();
    }
  }, []);

  useEffect(() => {
    if (!livro || !['cbz', 'cbr'].includes(formato)) return;
    const saved = window.localStorage.getItem(`biblioteca:reader-mode:${livro.id}`);
    if (saved === 'page' || saved === 'webtoon') { setComicMode(saved); setComicModeManual(true); } else { setComicMode('page'); setComicModeManual(false); }
  }, [formato, livro]);

  useEffect(() => {
    if (livro && !url) {
      setErroLeitor('Não foi possível localizar o arquivo deste livro.');
    }
  }, [livro, url]);

  useEffect(() => {
    if (!livro || !url || formato !== 'epub') return undefined;

    let cancelado = false;
    const controller = new AbortController();
    setErroLeitor('');
    setEpubHtml('');

    async function abrirEpub() {
      const response = await fetch(url, { signal: controller.signal, credentials: 'include' });
      if (!response.ok) throw new Error('download');

      const arquivo = await response.arrayBuffer();
      const { parseEpub } = await import('../readers/epubParser.js');
      const html = await parseEpub(arquivo);
      if (!cancelado) setEpubHtml(html);
    }

    abrirEpub().catch((error) => {
      if (error.name !== 'AbortError' && !cancelado) {
        setErroLeitor('Não foi possível abrir este EPUB.');
      }
    });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [livro, formato, url]);

  useEffect(() => {
    if (!livro || !url || formato !== 'mobi') return undefined;

    let cancelado = false;
    const controller = new AbortController();
    setErroLeitor('');
    setMobiHtml('');
    setMobiError('');
    setMobiStatus('loading');

    fetch(url, { signal: controller.signal, credentials: 'include' })
      .then((response) => {
        if (response.ok) return response.text();
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      })
      .then(async (html) => {
        const { parseMobiHtml } = await import('../readers/mobiParser.js');
        if (!cancelado) {
          setMobiHtml(parseMobiHtml(html, backendUrl));
          setMobiStatus('ready');
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && !cancelado) {
          setMobiError(error.status ? `O servidor respondeu HTTP ${error.status}.` : 'O arquivo não retornou conteúdo legível.');
          setMobiStatus('error');
          setErroLeitor('Não foi possível renderizar este MOBI.');
        }
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [livro, formato, url, mobiAttempt]);

  const limparCacheComic = useCallback(() => {
    for (const urlCache of comicCacheRef.current.values()) URL.revokeObjectURL(urlCache);
    comicCacheRef.current.clear();
    comicInflightRef.current.clear();
    if (comicUrlRef.current) {
      URL.revokeObjectURL(comicUrlRef.current);
      comicUrlRef.current = '';
    }
  }, []);

  const obterPaginaComic = useCallback(async (numeroPagina) => {
    if (numeroPagina < 0 || numeroPagina >= comicTotalRef.current) return null;
    const emCache = comicCacheRef.current.get(numeroPagina);
    if (emCache) return emCache;
    const emAndamento = comicInflightRef.current.get(numeroPagina);
    if (emAndamento) return emAndamento;
    const promise = import('../readers/comicClient.js')
      .then(({ fetchComicPage }) => fetchComicPage(`${paginasUrl}/${numeroPagina}`))
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        comicCacheRef.current.set(numeroPagina, objectUrl);
        comicInflightRef.current.delete(numeroPagina);
        return objectUrl;
      })
      .catch((erro) => {
        comicInflightRef.current.delete(numeroPagina);
        if (!erroCancelamento(erro) && import.meta.env.DEV) console.warn('[reader] falha ao preparar página da HQ', erro);
        return null;
      });
    comicInflightRef.current.set(numeroPagina, promise);
    return promise;
  }, [paginasUrl]);

  const carregarPaginaComic = useCallback(async (novaPagina) => {
    comicAbortRef.current?.abort();
    const controller = new AbortController();
    comicAbortRef.current = controller;
    const requestId = comicRequestRef.current + 1;
    comicRequestRef.current = requestId;
    setPaginaCarregando(true);
    try {
      const objectUrl = await obterPaginaComic(novaPagina);
      if (!objectUrl || controller.signal.aborted || comicRequestRef.current !== requestId) return;
      comicUrlRef.current = objectUrl;
      setComicImagem(objectUrl);
      setPagina(novaPagina);
      setPaginaDestino(String(novaPagina + 1));
      const prefetchDistance = adaptivePrefetchEnabled ? adaptivePrefetchWindow({ viewportWidth: window.innerWidth, deviceMemory: navigator.deviceMemory, estimatedItemBytes: 8 * 1024 * 1024 }) : 0;
      const vizinhas = Array.from({ length: prefetchDistance }, (_, index) => index + 1).flatMap((distance) => [novaPagina - distance, novaPagina + distance]).filter((item) => item >= 0 && item < comicTotalRef.current);
      void Promise.all(vizinhas.map((item) => obterPaginaComic(item)));
      for (const chave of [...comicCacheRef.current.keys()]) {
        if (![novaPagina, ...vizinhas].includes(chave)) {
          URL.revokeObjectURL(comicCacheRef.current.get(chave));
          comicCacheRef.current.delete(chave);
        }
      }
    } finally {
      if (comicRequestRef.current === requestId) setPaginaCarregando(false);
    }
  }, [adaptivePrefetchEnabled, obterPaginaComic]);

  const alterarModoComic = useCallback((mode) => {
    setComicMode(mode); setComicModeManual(true);
    if (livro) window.localStorage.setItem(`biblioteca:reader-mode:${livro.id}`, mode);
  }, [livro]);

  const irParaPagina = useCallback(() => {
    const destino = Number(paginaDestino) - 1;
    if (Number.isInteger(destino) && destino >= 0 && destino < comicTotal) {
      carregarPaginaComic(destino).catch(() => setErroLeitor('Não foi possível carregar esta página.'));
      setSeletorPaginaComicAberto(false);
    }
  }, [carregarPaginaComic, comicTotal, paginaDestino]);

  const mostrarControlesComic = useCallback(() => {
    setControlesComicVisiveis(true);
    clearTimeout(comicToolbarTimerRef.current);
  }, []);

  useEffect(() => {
    mostrarControlesComic();
    setSeletorPaginaComicAberto(false);
    setMenuComicAberto(false);
    return () => clearTimeout(comicToolbarTimerRef.current);
  }, [formato, livro?.id, mostrarControlesComic]);

  const aoScrollComic = useCallback((event) => {
    const atual = event.currentTarget.scrollTop;
    if (atual < comicScrollTopRef.current - 12) mostrarControlesComic();
    comicScrollTopRef.current = atual;
  }, [mostrarControlesComic]);

  useEffect(() => {
    if (!['cbz', 'cbr'].includes(formato) || comicMode !== 'page') return undefined;
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement) return;
      if ((event.key === 'ArrowLeft' || event.key === 'PageUp') && pagina > 0) carregarPaginaComic(pagina - 1).catch(() => {});
      if ((event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') && pagina < comicTotal - 1) { event.preventDefault(); carregarPaginaComic(pagina + 1).catch(() => {}); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [carregarPaginaComic, comicMode, comicTotal, formato, pagina]);

  useEffect(() => {
    if (!livro || !paginasUrl || !['cbz', 'cbr'].includes(formato)) return undefined;
    let cancelado = false;
    const controller = new AbortController();
    setErroLeitor(''); setComicImagem(''); setComicTotal(0); comicTotalRef.current = 0; setPagina(0);
    import('../readers/comicClient.js')
      .then(({ fetchComicIndex }) => fetchComicIndex(paginasUrl, controller.signal))
      .then((indice) => {
        if (cancelado) return null;
        comicTotalRef.current = indice.total;
        setComicTotal(indice.total);
        const saved = getReadingProgress(livro.id);
        const initialPage = saved?.page > 0 ? Math.min(saved.page, indice.total - 1) : 0;
        return carregarPaginaComic(initialPage);
      })
      .catch((error) => { if (!cancelado && !erroCancelamento(error)) setErroLeitor(`Não foi possível abrir este ${formato.toUpperCase()}.`); });
    return () => {
      cancelado = true;
      controller.abort();
      comicAbortRef.current?.abort();
      limparCacheComic();
    };
  }, [carregarPaginaComic, formato, livro, limparCacheComic, paginasUrl]);

  useEffect(() => {
    if (!livro || !comicImagem || !comicTotal || !['cbz', 'cbr'].includes(formato)) return;
    saveReadingProgress(livro.id, { format: formato, page: pagina, pageCount: comicTotal, readingMode: comicMode, progress: (pagina + 1) / comicTotal, fileFingerprint: livro.fileFingerprint || '' });
  }, [comicImagem, comicMode, comicTotal, formato, livro, pagina]);

  const comicPageTurn = usePageTurn({
    enabled: ['cbz', 'cbr'].includes(formato) && comicMode === 'page' && !paginaCarregando,
    currentPage: pagina + 1,
    pageCount: comicTotal,
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 390,
    mode: 'none',
    reducedMotion,
    canTurn: (direction, targetPage) => {
      return targetPage >= 1 && targetPage <= comicTotal;
    },
    onCommit: (targetPage) => {
      carregarPaginaComic(targetPage - 1).catch(() => setErroLeitor('Não foi possível carregar esta página.'));
    }
  });

  const distanciaPointers = useCallback(() => {
    const points = [...comicPointersRef.current.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].clientX - points[1].clientX, points[0].clientY - points[1].clientY);
  }, []);
  const onComicPointerDown = useCallback((event) => {
    mostrarControlesComic();
    if (event.pointerType === 'touch') {
      comicPointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
      if (comicPointersRef.current.size >= 2) {
        comicPinchRef.current = { distance: distanciaPointers(), zoom: comicZoom };
        return;
      }
    }
    comicPageTurn.onPointerDown(event);
  }, [comicPageTurn, comicZoom, distanciaPointers, mostrarControlesComic]);
  const onComicPointerMove = useCallback((event) => {
    if (event.pointerType === 'touch' && comicPointersRef.current.has(event.pointerId)) {
      comicPointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
      if (comicPinchRef.current) {
        event.preventDefault();
        comicZoomController.setZoom(comicPinchRef.current.zoom * (distanciaPointers() / Math.max(1, comicPinchRef.current.distance)));
        return;
      }
    }
    comicPageTurn.onPointerMove(event);
  }, [comicPageTurn, comicZoomController, distanciaPointers]);
  const onComicPointerUp = useCallback((event) => {
    if (event.pointerType === 'touch') {
      comicPointersRef.current.delete(event.pointerId);
      if (comicPinchRef.current) {
        if (comicPointersRef.current.size < 2) comicPinchRef.current = null;
        return;
      }
    }
    comicPageTurn.onPointerUp(event);
  }, [comicPageTurn]);
  const onComicPointerCancel = useCallback((event) => {
    comicPointersRef.current.delete(event.pointerId);
    comicPinchRef.current = null;
    comicPageTurn.onPointerCancel(event);
  }, [comicPageTurn]);

  return (
    <ReaderShell engine={readerEngine} capabilities={readerCapabilities}>
      {loading && !livro ? (
        <div className="grid h-full w-full place-items-center text-sm text-white/70">{t('common.loading')}</div>
      ) : livro ? (
        <>
          <ReaderErrorBoundary readerKey={`${id}:${url}`} onExit={voltarParaBiblioteca}>
          {formato === 'pdf' && <PdfReader livro={livro} url={url} onError={setErroLeitor} telaCheia={telaCheia} onToggleTelaCheia={alternarTelaCheia} onExit={voltarParaBiblioteca} />}
          {formato === 'epub' && <EpubReader livro={livro} html={epubHtml} telaCheia={telaCheia} onToggleTelaCheia={alternarTelaCheia} onExit={voltarParaBiblioteca} />}
          {['cbz', 'cbr'].includes(formato) && <div onScroll={aoScrollComic} {...comicZoomInteractionProps} onPointerDown={onComicPointerDown} onPointerMove={onComicPointerMove} onPointerUp={onComicPointerUp} onPointerCancel={onComicPointerCancel} className={`h-full ${comicMode === 'webtoon' ? 'overflow-y-auto bg-white' : 'touch-pan-y overflow-auto bg-white sm:grid sm:place-items-center sm:bg-slate-900 sm:p-6'}`} style={{ touchAction: comicZoom > 1 ? 'pan-x pan-y' : 'pan-y pinch-zoom' }}>
            {comicImagem ? (comicMode === 'webtoon' ? <img
              src={comicImagem}
              alt={`Página ${pagina + 1}`}
              onLoad={(event) => {
                const aspect = event.currentTarget.naturalHeight / event.currentTarget.naturalWidth;
                if (!comicModeManual && aspect >= 2.5) setComicMode('webtoon');
              }}
              onClick={mostrarControlesComic}
              style={{ width: comicZoomMode === 'custom' ? `${Math.max(1, comicZoom) * 100}%` : '100%', maxWidth: comicZoomMode === 'custom' ? 'none' : '900px' }}
              className="mx-auto block h-auto object-contain"
            /> : <div className="relative mx-auto" style={{ width: comicZoomMode === 'custom' ? `${Math.max(1, comicZoom) * 100}%` : '100%', maxWidth: comicZoomMode === 'custom' ? 'none' : '1100px' }}>
              <img
                src={comicImagem}
                alt={`Página ${pagina + 1}`}
                onLoad={(event) => {
                  const aspect = event.currentTarget.naturalHeight / event.currentTarget.naturalWidth;
                  if (!comicModeManual && aspect >= 2.5) setComicMode('webtoon');
                }}
                className="relative block h-auto w-full object-contain sm:rounded-xl sm:shadow-2xl"
                onClick={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const x = event.clientX - bounds.left;
                  if (x < bounds.width * 0.24 && pagina > 0) comicPageTurn.turnPage('previous');
                  else if (x > bounds.width * 0.76 && pagina < comicTotal - 1) comicPageTurn.turnPage('next');
                  else mostrarControlesComic();
                }}
              />
            </div>) : <p className="grid h-full place-items-center text-sm text-white/70">{t('reader.preparing')}</p>}
            <div className={controlesComicVisiveis ? 'contents' : 'hidden sm:contents'}>
            <ReaderDock>
              {seletorPaginaComicAberto ? <form onSubmit={(event) => { event.preventDefault(); irParaPagina(); }} className="flex items-center gap-2"><input autoFocus value={paginaDestino} onChange={(event) => setPaginaDestino(event.target.value)} inputMode="numeric" aria-label="Número da página" className="h-11 w-16 rounded-[1rem] bg-white/10 px-2 text-center outline-none" /><span className="whitespace-nowrap text-sm text-white/60">de {comicTotal}</span><button className="h-11 rounded-[1rem] bg-white px-4 text-sm font-semibold text-slate-950">Ir</button><button type="button" onClick={() => { setSeletorPaginaComicAberto(false); mostrarControlesComic(); }} className="grid h-11 w-11 place-items-center rounded-[1rem] hover:bg-white/12" aria-label="Cancelar"><X className="h-4 w-4" /></button></form> : <div className="flex items-center gap-1"><button type="button" disabled={pagina === 0 || paginaCarregando || comicPageTurn.turn.phase !== 'idle'} onClick={() => { mostrarControlesComic(); comicPageTurn.turnPage('previous'); }} className="grid h-11 w-11 place-items-center rounded-[1rem] transition hover:bg-white/12 disabled:opacity-35" aria-label="Página anterior"><ChevronLeft /></button><button type="button" onClick={() => { mostrarControlesComic(); setSeletorPaginaComicAberto(true); }} className="min-w-[88px] whitespace-nowrap px-2 text-sm font-medium tabular-nums" aria-label="Ir para página">{pagina + 1} / {comicTotal || '…'}</button><button type="button" disabled={pagina >= comicTotal - 1 || paginaCarregando || comicPageTurn.turn.phase !== 'idle'} onClick={() => { mostrarControlesComic(); comicPageTurn.turnPage('next'); }} className="grid h-11 w-11 place-items-center rounded-[1rem] transition hover:bg-white/12 disabled:opacity-35" aria-label="Próxima página"><ChevronRight /></button><span className="mx-0.5 h-6 w-px bg-white/15" /><button type="button" onClick={voltarParaBiblioteca} className="grid h-11 w-11 place-items-center rounded-[1rem] transition hover:bg-white/12" aria-label="Fechar livro"><X className="h-4 w-4" /></button></div>}
              <ReaderZoomControls capabilities={readerCapabilities} zoom={comicZoom} mode={comicZoomMode} onZoomIn={comicZoomController.zoomIn} onZoomOut={comicZoomController.zoomOut} onReset={comicZoomController.resetZoom} onFitWidth={() => comicZoomController.setFitMode('fit-width')} onFitPage={() => comicZoomController.setFitMode('fit-page')} className="w-full border-t border-white/10 pt-1 sm:w-auto sm:border-l sm:border-t-0 sm:pl-1 sm:pt-0" />
            </ReaderDock>
            </div>
            <ReaderOptions open={menuComicAberto} onClose={() => { setMenuComicAberto(false); mostrarControlesComic(); }}><p className="mb-3 text-sm font-semibold">Leitura</p><ReaderZoomControls capabilities={readerCapabilities} zoom={comicZoom} mode={comicZoomMode} onZoomIn={comicZoomController.zoomIn} onZoomOut={comicZoomController.zoomOut} onReset={comicZoomController.resetZoom} onFitWidth={() => comicZoomController.setFitMode('fit-width')} onFitPage={() => comicZoomController.setFitMode('fit-page')} className="w-full justify-center" /><label className="mt-3 flex items-center justify-between gap-3 text-sm text-white/70"><span>Modo</span><select value={comicMode} onChange={(event) => alterarModoComic(event.target.value)} aria-label="Modo de leitura" className="h-10 rounded-xl bg-white/10 px-3 text-sm text-white outline-none"><option value="page" className="text-slate-900">Página</option><option value="webtoon" className="text-slate-900">Webtoon</option></select></label><button type="button" onClick={alternarTelaCheia} className="mt-3 flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm hover:bg-white/10"><span>Tela cheia</span>{telaCheia ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}</button></ReaderOptions>
          </div>}
          {formato === 'mobi' && <MobiReader livro={livro} html={mobiHtml} status={mobiStatus} error={mobiError} onRetry={() => setMobiAttempt((value) => value + 1)} telaCheia={telaCheia} onToggleTelaCheia={alternarTelaCheia} onExit={voltarParaBiblioteca} />}
          {!['pdf', 'epub', 'cbz', 'mobi', 'cbr'].includes(formato) && <div className="grid h-full w-full place-items-center p-8 text-center text-white"><div><p>{t('reader.unsupported',{format:livro.formato || livro.extension || 'unknown'})}</p>{url && <a href={url} download={livro.originalFilename || livro.nome} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-950">Baixar arquivo original</a>}</div></div>}
          </ReaderErrorBoundary>
          {erroLeitor && <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded bg-rose-900 px-4 py-2 text-sm text-white">{erroLeitor}</div>}
        </>
      ) : (
        <div className="grid h-full w-full place-items-center text-sm text-white/70">
          Livro nao encontrado.
        </div>
      )}
    </ReaderShell>
  );
}
