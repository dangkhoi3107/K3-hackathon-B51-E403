import { VLEARN_LESSONS } from './data.js';
import {
  buildExplainRegionPrompt,
  buildSummarizeDeckPrompt,
  buildQAGroundedPrompt,
  buildQuizGeneratorPrompt,
  buildAdaptiveQuestionPrompt,
  buildMisconceptionHintPrompt,
  buildVisionRegionPrompt,
  buildEssayEvaluatorPrompt
} from './prompts.js';
import {
  buildRelevantContext,
  createOfflineExplanation,
  createHybridOfflineAnswer,
  createOfflineQuiz,
  createOfflineSummary,
  detectGuardrailViolation,
  evaluateEssayLocally,
  normalizeLiveEvaluation,
  validateGroundedResponse,
  validateHybridResponse,
  validateQuizData,
  validateSingleQuestion
} from './grounding.mjs';
import {
  AI_PROVIDERS,
  buildProviderRequest,
  getProviderConfig,
  isRetryableProviderStatus,
  parseProviderResponse
} from './providers.mjs';

const MAX_PDF_PAGES = 50;
const API_TIMEOUT_MS = 20_000;
const API_RETRY_DELAYS_MS = [0, 450, 1_100];
const MAX_ADAPTIVE_QUESTIONS_PER_SESSION = 6;
const MAX_ATTEMPTS_PER_SLIDE = 2;

let currentLessonIndex = 0;
let currentSlideIndex = 0;
let currentSelectedText = '';
let currentQuizData = null;
let adaptiveSession = null;
let interactionLog = [];
let regionDrawActive = false;
let regionDragOrigin = null;
let pdfRenderTask = null;
let pdfRenderSequence = 0;
let resizeTimer = null;
const providerCredentials = {
  openrouter: '',
  gemini: ''
};
const providerModels = {
  openrouter: AI_PROVIDERS.openrouter.defaultModel,
  gemini: AI_PROVIDERS.gemini.defaultModel
};

const lessonSelect = document.getElementById('lessonSelect');
const providerSelect = document.getElementById('providerSelect');
const modelInput = document.getElementById('modelInput');
const apiKeyInput = document.getElementById('apiKeyInput');
const agentModeBadge = document.getElementById('agentModeBadge');
const agentModeText = document.getElementById('agentModeText');
const slideCanvas = document.getElementById('slideCanvas');
const mockSlideView = document.getElementById('mockSlideView');
const pdfSlideView = document.getElementById('pdfSlideView');
const pdfStage = document.getElementById('pdfStage');
const pdfCanvas = document.getElementById('pdfCanvas');
const pdfRenderStatus = document.getElementById('pdfRenderStatus');
const pdfTextContent = document.getElementById('pdfTextContent');
const textLayerStatus = document.getElementById('textLayerStatus');
const slideTitle = document.getElementById('slideTitle');
const slideContent = document.getElementById('slideContentText');
const pageBadge = document.getElementById('pageBadge');
const prevSlideBtn = document.getElementById('prevSlideBtn');
const nextSlideBtn = document.getElementById('nextSlideBtn');
const highlightTooltip = document.getElementById('highlightTooltip');
const toggleRegionDrawBtn = document.getElementById('toggleRegionDrawBtn');
const pdfCanvasWrap = document.getElementById('pdfCanvasWrap');
const regionSelectBox = document.getElementById('regionSelectBox');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const pillSummarize = document.getElementById('pillSummarize');
const pillQA = document.getElementById('pillQA');
const tabChatBtn = document.getElementById('tabChatBtn');
const tabQuizBtn = document.getElementById('tabQuizBtn');
const tabChat = document.getElementById('tabChat');
const tabQuiz = document.getElementById('tabQuiz');
const quizContainer = document.getElementById('quizContainer');
const quizScopeText = document.getElementById('quizScopeText');
const btnGenerateQuiz = document.getElementById('btnGenerateQuiz');
const btnStartAdaptive = document.getElementById('btnStartAdaptive');
const uploadZone = document.getElementById('uploadZone');
const uploadZoneInner = uploadZone.querySelector('.upload-zone-inner');
const pdfFileInput = document.getElementById('pdfFileInput');
const uploadProgress = document.getElementById('uploadProgress');
const uploadProgressBar = document.getElementById('uploadProgressBar');

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function initApp() {
  populateLessonSelector();
  setupEventListeners();
  setupUploadHandlers();
  syncProviderControls();
  renderCurrentSlide();
}

function populateLessonSelector() {
  lessonSelect.replaceChildren(
    ...VLEARN_LESSONS.map((lesson, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = lesson.title;
      return option;
    })
  );
  lessonSelect.value = String(currentLessonIndex);
}

function currentLesson() {
  return VLEARN_LESSONS[currentLessonIndex];
}

function currentSlide() {
  return currentLesson()?.slides?.[currentSlideIndex];
}

async function renderCurrentSlide() {
  const lesson = currentLesson();
  const slide = currentSlide();
  if (!lesson || !slide) return;

  const sequence = ++pdfRenderSequence;
  hideHighlightTooltip();
  pageBadge.textContent = `Trang ${slide.page} / ${lesson.slidesCount}`;
  prevSlideBtn.disabled = currentSlideIndex === 0;
  nextSlideBtn.disabled = currentSlideIndex >= lesson.slides.length - 1;
  updateQuickQuestion(lesson);

  if (lesson._isUploaded && lesson._pdfDocument) {
    mockSlideView.hidden = true;
    pdfSlideView.hidden = false;
    pdfTextContent.textContent = slide.content ||
      'Trang này không có text layer. Hình ảnh vẫn hiển thị ở phía trên, nhưng AI sẽ không suy đoán nội dung từ ảnh.';
    textLayerStatus.textContent = slide.hasText ? '• đã có text' : '• không có text layer';
    textLayerStatus.style.color = slide.hasText ? '#6ee7b7' : '#fbbf24';
    await renderPDFPage(lesson._pdfDocument, slide.page, sequence);
    return;
  }

  cancelPDFRender();
  pdfSlideView.hidden = true;
  mockSlideView.hidden = false;
  slideTitle.textContent = `[Slide ${slide.page}] ${slide.title}`;
  slideContent.textContent = slide.content;
}

function cancelPDFRender() {
  if (pdfRenderTask) {
    try {
      pdfRenderTask.cancel();
    } catch {
      // Render may already be complete.
    }
    pdfRenderTask = null;
  }
}

async function renderPDFPage(pdfDocument, pageNumber, sequence) {
  cancelPDFRender();
  pdfRenderStatus.hidden = false;
  pdfRenderStatus.textContent = 'Đang dựng trang PDF…';

  try {
    await new Promise(resolve => requestAnimationFrame(resolve));
    const page = await pdfDocument.getPage(pageNumber);
    if (sequence !== pdfRenderSequence) return;

    const baseViewport = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(pdfStage.clientWidth - 24, 240);
    const availableHeight = Math.max(pdfStage.clientHeight - 24, 180);
    const fitScale = Math.min(
      availableWidth / baseViewport.width,
      availableHeight / baseViewport.height
    );
    const displayScale = Math.max(0.35, Math.min(fitScale, 2));
    const viewport = page.getViewport({ scale: displayScale });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    pdfCanvas.width = Math.floor(viewport.width * pixelRatio);
    pdfCanvas.height = Math.floor(viewport.height * pixelRatio);
    pdfCanvas.style.width = `${Math.floor(viewport.width)}px`;
    pdfCanvas.style.height = `${Math.floor(viewport.height)}px`;
    pdfCanvas.setAttribute('aria-label', `Trang ${pageNumber} của file PDF đã tải lên`);

    const canvasContext = pdfCanvas.getContext('2d', { alpha: false });
    const transform = pixelRatio === 1
      ? null
      : [pixelRatio, 0, 0, pixelRatio, 0, 0];

    pdfRenderTask = page.render({
      canvasContext,
      viewport,
      transform,
      background: '#ffffff'
    });
    await pdfRenderTask.promise;
    if (sequence === pdfRenderSequence) pdfRenderStatus.hidden = true;
  } catch (error) {
    if (error?.name === 'RenderingCancelledException') return;
    console.error('PDF render error:', error);
    if (sequence === pdfRenderSequence) {
      pdfRenderStatus.hidden = false;
      pdfRenderStatus.textContent = 'Không dựng được trang PDF này. Hãy thử chuyển trang rồi quay lại.';
    }
  } finally {
    pdfRenderTask = null;
  }
}

function updateQuickQuestion(lesson) {
  const firstSlide = lesson.slides.find(slide => slide.content?.trim()) ?? lesson.slides[0];
  const hasAugment = lesson.slides.some(slide => /augment/i.test(`${slide.title} ${slide.content}`));
  const query = hasAugment
    ? 'Khi nào chọn Augment thay vì Automate?'
    : `Nội dung chính của “${firstSlide?.title ?? 'bài học này'}” là gì?`;
  pillQA.dataset.query = query;
  pillQA.textContent = `❓ ${query}`;
}

function setupEventListeners() {
  lessonSelect.addEventListener('change', event => {
    currentLessonIndex = Number(event.target.value);
    currentSlideIndex = 0;
    currentQuizData = null;
    interactionLog = [];
    resetQuizView();
    renderCurrentSlide();
  });

  prevSlideBtn.addEventListener('click', () => {
    if (currentSlideIndex <= 0) return;
    currentSlideIndex -= 1;
    renderCurrentSlide();
  });

  nextSlideBtn.addEventListener('click', () => {
    if (currentSlideIndex >= currentLesson().slides.length - 1) return;
    currentSlideIndex += 1;
    renderCurrentSlide();
  });

  slideCanvas.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('mousedown', event => {
    if (event.target !== highlightTooltip && !highlightTooltip.contains(event.target)) {
      hideHighlightTooltip();
    }
  });

  highlightTooltip.addEventListener('click', () => {
    hideHighlightTooltip();
    switchTab('chat');
    handleExplainRegion(currentSelectedText);
  });

  toggleRegionDrawBtn.addEventListener('click', () => {
    const lesson = currentLesson();
    if (!lesson?._isUploaded) {
      switchTab('chat');
      appendMessage(
        'bot',
        '✏️ **Vẽ khung để hỏi** chỉ khả dụng khi bạn tải lên PDF thật (khung "Upload Slide PDF" bên dưới) — bài mẫu dựng sẵn không có ảnh gốc để khoanh vùng.'
      );
      return;
    }
    regionDrawActive = !regionDrawActive;
    toggleRegionDrawBtn.classList.toggle('active', regionDrawActive);
    pdfCanvasWrap.classList.toggle('region-draw-active', regionDrawActive);
    if (!regionDrawActive) regionSelectBox.hidden = true;
  });

  pdfCanvasWrap.addEventListener('mousedown', event => {
    if (!regionDrawActive) return;
    const wrapRect = pdfCanvasWrap.getBoundingClientRect();
    regionDragOrigin = {
      x: Math.min(Math.max(event.clientX - wrapRect.left, 0), wrapRect.width),
      y: Math.min(Math.max(event.clientY - wrapRect.top, 0), wrapRect.height)
    };
    regionSelectBox.hidden = false;
    regionSelectBox.style.left = `${regionDragOrigin.x}px`;
    regionSelectBox.style.top = `${regionDragOrigin.y}px`;
    regionSelectBox.style.width = '0px';
    regionSelectBox.style.height = '0px';
    event.preventDefault();
  });

  window.addEventListener('mousemove', event => {
    if (!regionDragOrigin) return;
    const wrapRect = pdfCanvasWrap.getBoundingClientRect();
    const currentX = Math.min(Math.max(event.clientX - wrapRect.left, 0), wrapRect.width);
    const currentY = Math.min(Math.max(event.clientY - wrapRect.top, 0), wrapRect.height);
    const left = Math.min(currentX, regionDragOrigin.x);
    const top = Math.min(currentY, regionDragOrigin.y);
    regionSelectBox.style.left = `${left}px`;
    regionSelectBox.style.top = `${top}px`;
    regionSelectBox.style.width = `${Math.abs(currentX - regionDragOrigin.x)}px`;
    regionSelectBox.style.height = `${Math.abs(currentY - regionDragOrigin.y)}px`;
  });

  window.addEventListener('mouseup', () => {
    if (!regionDragOrigin) return;
    const box = {
      left: parseFloat(regionSelectBox.style.left) || 0,
      top: parseFloat(regionSelectBox.style.top) || 0,
      width: parseFloat(regionSelectBox.style.width) || 0,
      height: parseFloat(regionSelectBox.style.height) || 0
    };
    regionDragOrigin = null;
    regionDrawActive = false;
    toggleRegionDrawBtn.classList.remove('active');
    pdfCanvasWrap.classList.remove('region-draw-active');

    if (box.width < 12 || box.height < 12) {
      regionSelectBox.hidden = true;
      return;
    }
    handleRegionSelected(box);
  });

  tabChatBtn.addEventListener('click', () => switchTab('chat'));
  tabQuizBtn.addEventListener('click', () => switchTab('quiz'));
  sendChatBtn.addEventListener('click', handleUserChat);
  chatInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing) handleUserChat();
  });

  pillSummarize.addEventListener('click', handleSummarizeDeck);
  pillQA.addEventListener('click', () => {
    chatInput.value = pillQA.dataset.query;
    handleUserChat();
  });
  btnGenerateQuiz.addEventListener('click', handleGenerateQuiz);
  btnStartAdaptive.addEventListener('click', startAdaptiveSession);

  providerSelect.addEventListener('change', syncProviderControls);
  modelInput.addEventListener('input', () => {
    providerModels[activeProviderId()] =
      modelInput.value.trim() || activeProvider().defaultModel;
    updateProviderReadiness();
  });
  apiKeyInput.addEventListener('input', () => {
    providerCredentials[activeProviderId()] = apiKeyInput.value.trim();
    updateProviderReadiness();
  });

  document.addEventListener('click', event => {
    const citation = event.target.closest('[data-citation-page]');
    if (!citation) return;
    navigateToPage(Number(citation.dataset.citationPage));
  });

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (currentLesson()?._isUploaded) renderCurrentSlide();
    }, 180);
  });
}

function handleTextSelection() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const text = selection.toString().trim();
  const anchorElement = selection.anchorNode?.nodeType === Node.TEXT_NODE
    ? selection.anchorNode.parentElement
    : selection.anchorNode;
  const selectableArea = anchorElement?.closest?.('#slideContentText, #pdfTextContent');

  if (!selectableArea || text.length < 4) {
    hideHighlightTooltip();
    return;
  }

  currentSelectedText = text;
  const selectionRect = selection.getRangeAt(0).getBoundingClientRect();
  const canvasRect = slideCanvas.getBoundingClientRect();
  const tooltipWidth = 230;
  const left = Math.min(
    Math.max(selectionRect.left - canvasRect.left, 12),
    Math.max(slideCanvas.clientWidth - tooltipWidth - 12, 12)
  );
  const top = Math.max(selectionRect.top - canvasRect.top, 48);
  highlightTooltip.style.left = `${left}px`;
  highlightTooltip.style.top = `${top}px`;
  highlightTooltip.style.display = 'block';
}

function hideHighlightTooltip() {
  highlightTooltip.style.display = 'none';
}

function navigateToPage(pageNumber) {
  const slideIndex = currentLesson().slides.findIndex(slide => Number(slide.page) === pageNumber);
  if (slideIndex < 0) return;
  currentSlideIndex = slideIndex;
  renderCurrentSlide();
}

function setupUploadHandlers() {
  uploadZone.addEventListener('click', event => {
    if (event.target.closest('.btn-remove-upload')) return;
    pdfFileInput.click();
  });

  pdfFileInput.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (file) handlePDFUpload(file);
  });

  uploadZone.addEventListener('dragover', event => {
    event.preventDefault();
    uploadZone.classList.add('drag-over');
  });
  uploadZone.addEventListener('dragleave', event => {
    event.preventDefault();
    uploadZone.classList.remove('drag-over');
  });
  uploadZone.addEventListener('drop', event => {
    event.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = event.dataTransfer.files?.[0];
    if (file && isPDFFile(file)) handlePDFUpload(file);
    else showUploadError('Chỉ hỗ trợ file PDF. Vui lòng chọn file .pdf.');
  });
  uploadZone.addEventListener('click', event => {
    if (!event.target.closest('.btn-remove-upload')) return;
    event.stopPropagation();
    removeUploadedLesson();
  });
}

function isPDFFile(file) {
  return file?.type === 'application/pdf' || /\.pdf$/i.test(file?.name ?? '');
}

function extractPageText(textContent) {
  const lines = [];
  let currentLine = '';
  for (const item of textContent.items ?? []) {
    const text = String(item.str ?? '').trim();
    if (text) currentLine += `${currentLine ? ' ' : ''}${text}`;
    if (item.hasEOL && currentLine.trim()) {
      lines.push(currentLine.trim());
      currentLine = '';
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return {
    lines,
    text: lines.join('\n').trim()
  };
}

async function handlePDFUpload(file) {
  if (!isPDFFile(file)) {
    showUploadError('Chỉ hỗ trợ file PDF. Vui lòng chọn file .pdf.');
    return;
  }
  if (!window.pdfjsLib) {
    showUploadError('Bộ đọc PDF chưa tải xong. Vui lòng kiểm tra mạng và thử lại.');
    return;
  }

  uploadZone.setAttribute('aria-busy', 'true');
  uploadProgress.classList.add('active');
  uploadProgressBar.style.width = '10%';
  let pdfDocument = null;

  try {
    const arrayBuffer = await file.arrayBuffer();
    uploadProgressBar.style.width = '22%';
    pdfDocument = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = Math.min(pdfDocument.numPages, MAX_PDF_PAGES);
    const slides = [];
    let textPages = 0;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const extracted = extractPageText(textContent);
      const hasText = extracted.text.length > 10;
      if (hasText) textPages += 1;
      const title = extracted.lines.find(line => line.length >= 3)?.slice(0, 100) ||
        `Trang ${pageNumber}`;

      slides.push({
        page: pageNumber,
        title,
        content: extracted.text,
        hasText
      });

      const progress = 22 + Math.round((pageNumber / totalPages) * 73);
      uploadProgressBar.style.width = `${progress}%`;
    }

    removeUploadedLessons({ notify: false });
    const displayName = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
    VLEARN_LESSONS.unshift({
      id: `uploaded-${Date.now()}`,
      title: `📄 ${displayName || 'PDF đã tải lên'}`,
      slidesCount: totalPages,
      slides,
      transcript: '',
      _isUploaded: true,
      _pdfDocument: pdfDocument,
      _fileName: file.name,
      _textPages: textPages
    });
    pdfDocument = null;

    currentLessonIndex = 0;
    currentSlideIndex = 0;
    currentQuizData = null;
    interactionLog = [];
    populateLessonSelector();
    resetQuizView();
    await renderCurrentSlide();

    uploadProgressBar.style.width = '100%';
    renderUploadSuccess(file, totalPages, textPages);
    switchTab('chat');
    const textNotice = textPages
      ? `Trích xuất được text ở **${textPages}/${totalPages} trang** để làm căn cứ cho AI.`
      : 'PDF không có text layer; hệ thống vẫn hiển thị hình ảnh nhưng sẽ không đoán nội dung cho AI.';
    appendMessage(
      'bot',
      `✅ Đã tải **${file.name}** và hiển thị trang PDF thật.\n${textNotice}\nBạn có thể chuyển trang, mở phần văn bản trích xuất để bôi đen, hoặc hỏi theo nội dung có nguồn.`
    );
  } catch (error) {
    console.error('PDF parse error:', error);
    if (pdfDocument) {
      try {
        await pdfDocument.destroy();
      } catch {
        // Ignore cleanup errors.
      }
    }
    showUploadError(`Không đọc được file PDF: ${error.message || 'lỗi không xác định'}`);
  } finally {
    uploadZone.removeAttribute('aria-busy');
    pdfFileInput.value = '';
  }
}

function renderUploadSuccess(file, totalPages, textPages) {
  uploadZone.classList.add('uploaded');
  uploadZoneInner.innerHTML = `
    <div class="upload-file-info">
      <div class="file-icon" aria-hidden="true">📑</div>
      <div class="file-details">
        <div class="file-name">${escapeHTML(file.name)}</div>
        <div class="file-meta">${totalPages} trang hiển thị · ${textPages} trang có text · ${(file.size / 1024).toFixed(0)} KB</div>
      </div>
      <span class="file-status">✓ Đã nạp</span>
      <button type="button" class="btn-remove-upload">✕ Xóa</button>
    </div>
  `;
  window.setTimeout(() => {
    uploadProgress.classList.remove('active');
    uploadProgressBar.style.width = '0%';
  }, 450);
}

function renderDefaultUploadZone() {
  uploadZone.classList.remove('uploaded');
  uploadZoneInner.innerHTML = `
    <div class="upload-icon" aria-hidden="true">📂</div>
    <p class="upload-title">Upload Slide PDF để test</p>
    <p class="upload-subtitle">Kéo thả file PDF vào đây hoặc bấm để chọn file</p>
    <div class="upload-formats">Hỗ trợ: .pdf — Hiển thị tối đa 50 trang</div>
  `;
  uploadProgress.classList.remove('active');
  uploadProgressBar.style.width = '0%';
}

function removeUploadedLessons({ notify = true } = {}) {
  const uploadedLessons = VLEARN_LESSONS.filter(lesson => lesson._isUploaded);
  for (const lesson of uploadedLessons) {
    try {
      lesson._pdfDocument?.destroy();
    } catch {
      // Ignore cleanup errors.
    }
  }
  for (let index = VLEARN_LESSONS.length - 1; index >= 0; index -= 1) {
    if (VLEARN_LESSONS[index]._isUploaded) VLEARN_LESSONS.splice(index, 1);
  }
  if (notify) appendMessage('bot', '🗑️ Đã xóa PDF tải lên và quay về bài học mẫu.');
}

function removeUploadedLesson() {
  removeUploadedLessons();
  currentLessonIndex = 0;
  currentSlideIndex = 0;
  currentQuizData = null;
  interactionLog = [];
  populateLessonSelector();
  renderDefaultUploadZone();
  resetQuizView();
  renderCurrentSlide();
}

function showUploadError(message) {
  uploadZone.removeAttribute('aria-busy');
  uploadProgress.classList.remove('active');
  uploadProgressBar.style.width = '0%';
  pdfFileInput.value = '';
  switchTab('chat');
  appendMessage('bot', `❌ ${message}`);
}

function switchTab(tab) {
  const isChat = tab === 'chat';
  tabChatBtn.classList.toggle('active', isChat);
  tabQuizBtn.classList.toggle('active', !isChat);
  tabChat.classList.toggle('active', isChat);
  tabQuiz.classList.toggle('active', !isChat);
}

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderSafeMarkdown(value) {
  return escapeHTML(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(
      /\[\s*(?:Trang|Slide)\s+(\d{1,3})\s*\]/gi,
      '<button type="button" class="inline-citation" data-citation-page="$1">[Trang $1]</button>'
    )
    .replace(/\[\s*(T\d{2}-\d{3})\s*\]/gi, '<span class="inline-citation">[$1]</span>')
    .replace(/\n/g, '<br>');
}

function appendMessage(role, content, citation = null) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${role}`;
  const body = document.createElement('div');
  body.innerHTML = renderSafeMarkdown(content);
  msgDiv.appendChild(body);

  if (citation) {
    const pageMatch = String(citation).match(/(\d{1,3})/);
    const citationElement = document.createElement(pageMatch ? 'button' : 'span');
    citationElement.className = 'citation-tag';
    citationElement.textContent = `📌 ${citation}`;
    if (pageMatch) {
      citationElement.type = 'button';
      citationElement.dataset.citationPage = pageMatch[1];
    }
    msgDiv.appendChild(citationElement);
  }

  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msgDiv;
}

function setAgentMode(mode, text) {
  agentModeBadge.dataset.mode = mode;
  agentModeText.textContent = text;
}

function activeProviderId() {
  return providerSelect.value === 'gemini' ? 'gemini' : 'openrouter';
}

function activeProvider() {
  return getProviderConfig(activeProviderId());
}

function updateProviderReadiness() {
  const provider = activeProvider();
  const hasKey = Boolean(providerCredentials[provider.id]);
  setAgentMode(
    hasKey ? 'ready' : 'offline',
    hasKey ? `${provider.label} sẵn sàng` : `${provider.label} · offline`
  );
}

function syncProviderControls() {
  const provider = activeProvider();
  modelInput.value = providerModels[provider.id] || provider.defaultModel;
  modelInput.placeholder = provider.defaultModel;
  apiKeyInput.value = providerCredentials[provider.id] || '';
  apiKeyInput.placeholder = provider.keyPlaceholder;
  updateProviderReadiness();
}

function delay(milliseconds) {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

async function callLLMAPI(promptText, { json = false, temperature, imageBase64, imageMimeType } = {}) {
  const provider = activeProvider();
  const apiKey = providerCredentials[provider.id];
  if (!apiKey) {
    setAgentMode('offline', `${provider.label} · offline`);
    return null;
  }

  const model = modelInput.value.trim() || provider.defaultModel;
  providerModels[provider.id] = model;
  const request = buildProviderRequest({
    providerId: provider.id,
    apiKey,
    model,
    promptText,
    json,
    temperature,
    origin: window.location.origin,
    imageBase64,
    imageMimeType
  });

  for (let attempt = 0; attempt < API_RETRY_DELAYS_MS.length; attempt += 1) {
    if (API_RETRY_DELAYS_MS[attempt]) await delay(API_RETRY_DELAYS_MS[attempt]);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(request.url, {
        ...request.options,
        signal: controller.signal
      });
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const message = errorPayload?.error?.message || `HTTP ${response.status}`;
        const providerError = new Error(message);
        providerError.status = response.status;
        throw providerError;
      }
      const data = await response.json();
      const text = parseProviderResponse(provider.id, data);
      if (!text) throw new Error(`${provider.label} không trả về nội dung`);
      setAgentMode('live', `${provider.label} live · ${model}`);
      return text;
    } catch (error) {
      console.warn(`${provider.label} attempt ${attempt + 1} failed:`, error);
      const retryable =
        error?.name === 'AbortError' ||
        isRetryableProviderStatus(error?.status);
      const isLastAttempt = attempt === API_RETRY_DELAYS_MS.length - 1;
      if (!retryable || isLastAttempt) {
        const status = error?.status ? ` ${error.status}` : '';
        setAgentMode('error', `${provider.label} lỗi${status} · fallback`);
        break;
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
  return null;
}

function parseJSONObject(rawText) {
  const text = String(rawText ?? '').trim();
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function formatLessonContext(lesson) {
  const slides = lesson.slides
    .filter(slide => slide.content?.trim())
    .map(slide =>
      `[Trang ${slide.page}]\nTiêu đề: ${slide.title}\nNội dung: ${slide.content.slice(0, 2_000)}`
    )
    .join('\n\n');
  const transcript = lesson.transcript?.trim()
    ? `\n\nTranscript:\n${lesson.transcript.slice(0, 30_000)}`
    : '';
  return `${slides}${transcript}`.trim();
}

async function handleExplainRegion(text) {
  const lesson = currentLesson();
  const slide = currentSlide();
  appendMessage('user', `Giải thích đoạn bôi đen ở Trang ${slide.page}: “${text}”`);
  interactionLog.push({ page: slide.page, type: 'highlight', text: text.slice(0, 160) });

  if (!slide.content?.trim()) {
    appendMessage('bot', createOfflineExplanation(slide, text));
    return;
  }

  const prompt = buildExplainRegionPrompt(slide.page, text, slide.content);
  const llmResponse = await callLLMAPI(prompt);
  if (llmResponse) {
    const verification = validateGroundedResponse(llmResponse, lesson, {
      allowedPages: [slide.page]
    });
    if (verification.isValid) {
      appendMessage('bot', llmResponse);
      return;
    }
    console.warn('Rejected ungrounded explain response:', verification.reason);
  }

  appendMessage('bot', createOfflineExplanation(slide, text));
}

// Khoanh vùng ảnh (rectangle) trên PDF thật rồi hỏi AI — khác hẳn bôi đen text: đây là
// vùng ẢNH (có thể là sơ đồ/biểu đồ/hình vẽ không có text layer), nên phải gửi ảnh cho
// Gemini Vision đọc hiểu trực tiếp; rule-based/OCR-chữ-thuần không làm được việc này.
async function handleRegionSelected(box) {
  const slide = currentSlide();
  const canvasRect = pdfCanvas.getBoundingClientRect();
  const scaleX = pdfCanvas.width / canvasRect.width;
  const scaleY = pdfCanvas.height / canvasRect.height;
  const sx = Math.round(box.left * scaleX);
  const sy = Math.round(box.top * scaleY);
  const sw = Math.round(box.width * scaleX);
  const sh = Math.round(box.height * scaleY);

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = Math.max(sw, 1);
  cropCanvas.height = Math.max(sh, 1);
  cropCanvas.getContext('2d').drawImage(pdfCanvas, sx, sy, sw, sh, 0, 0, cropCanvas.width, cropCanvas.height);
  const dataUrl = cropCanvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1] ?? '';

  regionSelectBox.hidden = true;
  switchTab('chat');

  const msgDiv = appendMessage('user', `🖍️ Đã khoanh vùng trên Trang ${slide.page} để hỏi AI:`);
  const preview = document.createElement('img');
  preview.src = dataUrl;
  preview.alt = `Vùng đã khoanh trên Trang ${slide.page}`;
  preview.style.cssText = 'max-width:220px; border-radius:8px; margin-top:6px; display:block; border:1px solid var(--panel-border, #334155);';
  msgDiv.appendChild(preview);

  await handleVisionRegionQuestion(base64, slide.page);
}

async function handleVisionRegionQuestion(imageBase64, pageNum) {
  if (activeProviderId() !== 'gemini') {
    appendMessage(
      'bot',
      '🖼️ Đọc vùng ảnh (vision) hiện chỉ hỗ trợ qua provider **Gemini**. Hãy chọn Gemini + nhập API key ở góc trên rồi vẽ khung lại.'
    );
    return;
  }
  if (!providerCredentials.gemini) {
    appendMessage(
      'bot',
      '🖼️ Cần nhập **Gemini API Key** ở góc trên để đọc vùng ảnh đã khoanh — tính năng này không có chế độ offline (ảnh cần model có khả năng thị giác).'
    );
    return;
  }

  const thinkingMsg = appendMessage('bot', '👀 Đang đọc vùng ảnh bạn vừa khoanh…');
  const prompt = buildVisionRegionPrompt(pageNum);
  const llmResponse = await callLLMAPI(prompt, { imageBase64 });
  thinkingMsg.remove();

  if (!llmResponse) {
    appendMessage('bot', '❌ Không đọc được vùng ảnh này (lỗi mạng hoặc API). Hãy thử vẽ lại khung hoặc kiểm tra API key.');
    return;
  }
  appendMessage('bot', llmResponse, `Trang ${pageNum}`);
  interactionLog.push({ page: pageNum, type: 'region', text: llmResponse.slice(0, 160) });
}

async function handleSummarizeDeck() {
  const lesson = currentLesson();
  switchTab('chat');
  appendMessage('user', `Tóm tắt nội dung slide bài giảng ${lesson.title}`);

  const offlineSummary = createOfflineSummary(lesson);
  if (!offlineSummary.hasContent) {
    appendMessage('bot', offlineSummary.content);
    return;
  }

  const prompt = buildSummarizeDeckPrompt(lesson.title, formatLessonContext(lesson));
  const llmResponse = await callLLMAPI(prompt);
  if (llmResponse) {
    const verification = validateGroundedResponse(llmResponse, lesson);
    if (verification.isValid) {
      appendMessage('bot', llmResponse);
      return;
    }
    console.warn('Rejected ungrounded summary response:', verification.reason);
  }
  appendMessage('bot', offlineSummary.content);
}

async function handleUserChat() {
  const query = chatInput.value.trim();
  if (!query) return;
  chatInput.value = '';
  appendMessage('user', query);

  const guardrail = detectGuardrailViolation(query);
  if (guardrail.blocked) {
    appendMessage(
      'bot',
      '🛡️ **Ngoài phạm vi tự học:** Mình không cung cấp đáp án để nộp điểm hoặc làm theo chỉ dẫn cố thay đổi hệ thống. Bạn có thể gửi phần bạn đã làm; mình sẽ giải thích khái niệm liên quan từ slide.'
    );
    return;
  }

  const lesson = currentLesson();
  const relevantContext = buildRelevantContext(lesson, query);
  interactionLog.push({ page: relevantContext.allowedPages[0] ?? null, type: 'chat', text: query.slice(0, 160) });
  const fallbackAnswer = createHybridOfflineAnswer(lesson, query);
  const hasLessonContext =
    relevantContext.allowedPages.length > 0 ||
    relevantContext.allowedTranscriptIds.length > 0;
  const prompt = buildQAGroundedPrompt(
    relevantContext.text,
    query,
    hasLessonContext
  );
  const llmResponse = await callLLMAPI(prompt, { temperature: 0.55 });
  if (llmResponse) {
    const verification = validateHybridResponse(llmResponse, lesson, {
      allowedPages: relevantContext.allowedPages,
      allowedTranscriptIds: relevantContext.allowedTranscriptIds,
      allowUnlabeledGeneralKnowledge: true,
      allowCitationDowngrade: true
    });
    if (verification.isValid) {
      appendMessage('bot', verification.normalizedText ?? llmResponse);
      return;
    }
    console.warn('Rejected ungrounded Q&A response:', verification.reason);
  }

  appendMessage('bot', fallbackAnswer.content);
}

async function handleGenerateQuiz() {
  const lesson = currentLesson();
  btnGenerateQuiz.disabled = true;
  quizContainer.innerHTML = `
    <div style="text-align:center; padding:40px;">
      <div class="spinner"></div>
      <p style="margin-top:12px; font-size:13px; color:#94a3b8;">Đang trích nguồn và kiểm tra từng câu hỏi…</p>
    </div>
  `;

  try {
    const offlineQuiz = createOfflineQuiz(lesson);
    if (!offlineQuiz.mcq_questions.length && !offlineQuiz.essay_questions.length) {
      currentQuizData = offlineQuiz;
      renderQuizUI(offlineQuiz);
      return;
    }

    let selectedQuiz = offlineQuiz;
    let rejectionWarning = '';
    const prompt = buildQuizGeneratorPrompt(lesson.title, formatLessonContext(lesson));
    const llmResponse = await callLLMAPI(prompt, { json: true });
    if (llmResponse) {
      const rawQuiz = parseJSONObject(llmResponse);
      const verifiedQuiz = validateQuizData(rawQuiz, lesson);
      const minimumUsefulMCQ = Math.min(3, offlineQuiz.mcq_questions.length);
      if (verifiedQuiz.mcq_questions.length >= minimumUsefulMCQ) {
        selectedQuiz = verifiedQuiz;
      } else {
        rejectionWarning =
          'Bộ câu AI sinh có quá ít câu đạt chuẩn nguồn/độ đa dạng sau khi loại option trùng; đang dùng bộ câu hỏi đã kiểm chứng cục bộ.';
      }
    }

    if (rejectionWarning) selectedQuiz.warning = rejectionWarning;
    currentQuizData = selectedQuiz;
    renderQuizUI(selectedQuiz);
  } finally {
    btnGenerateQuiz.disabled = false;
  }
}

function renderQuizUI(quizObject) {
  const lesson = currentLesson();
  const verifiedQuiz = validateQuizData(quizObject, lesson);
  verifiedQuiz.warning = quizObject.warning || '';
  currentQuizData = verifiedQuiz;
  quizContainer.replaceChildren();

  const questionCount =
    verifiedQuiz.mcq_questions.length + verifiedQuiz.essay_questions.length;
  quizScopeText.textContent = questionCount
    ? `${verifiedQuiz.mcq_questions.length} trắc nghiệm + ${verifiedQuiz.essay_questions.length} tự luận · option không lặp · nguồn mở sau khi trả lời`
    : 'Không có đủ text để tạo câu hỏi có căn cứ';

  if (verifiedQuiz.warning) {
    const notice = document.createElement('div');
    notice.className = 'scope-notice';
    notice.textContent = verifiedQuiz.warning;
    quizContainer.appendChild(notice);
  }

  if (!questionCount) {
    const empty = document.createElement('div');
    empty.className = 'scope-notice';
    empty.textContent =
      'PDF vẫn xem được, nhưng chưa có nội dung text đủ để tạo quiz mà không bịa. Hãy dùng PDF có text layer hoặc bổ sung transcript.';
    quizContainer.appendChild(empty);
    return;
  }

  verifiedQuiz.mcq_questions.forEach((question, index) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="quiz-card-header">
        <span class="quiz-type-tag">Câu ${index + 1} — Trắc nghiệm</span>
        <span class="quiz-source-locked">🔒 Nguồn mở sau khi trả lời</span>
      </div>
      <div class="quiz-question-text">${escapeHTML(question.question)}</div>
      <div class="mcq-options">
        ${Object.entries(question.options).map(([optionKey, optionValue]) =>
          `<button type="button" class="opt-btn" data-qid="${question.id}" data-opt="${optionKey}">${optionKey}. ${escapeHTML(optionValue)}</button>`
        ).join('')}
      </div>
      <div class="eval-feedback-box" id="feedback-q${question.id}" hidden></div>
    `;
    quizContainer.appendChild(card);
  });

  quizContainer.querySelectorAll('.opt-btn').forEach(button => {
    button.addEventListener('click', () => handleMCQAnswer(button, verifiedQuiz));
  });

  verifiedQuiz.essay_questions.forEach(question => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="quiz-card-header">
        <span class="quiz-type-tag" style="background:rgba(6,182,212,0.2); color:#22d3ee;">Câu tự luận</span>
        <span class="quiz-source-locked">🔒 Nguồn mở sau khi chấm</span>
      </div>
      <div class="quiz-question-text">${escapeHTML(question.question)}</div>
      <div class="essay-input-area">
        <label class="sr-only" for="essayAns-${question.id}">Câu trả lời tự luận</label>
        <textarea id="essayAns-${question.id}" placeholder="Nhập câu trả lời ngắn của bạn tại đây..."></textarea>
        <button type="button" class="btn-submit-essay" id="btnSubmitEssay-${question.id}">Gửi AI chấm điểm</button>
      </div>
      <div class="eval-feedback-box" id="essayFeedback-${question.id}" hidden></div>
    `;
    quizContainer.appendChild(card);
    document.getElementById(`btnSubmitEssay-${question.id}`).addEventListener('click', () => {
      const answer = document.getElementById(`essayAns-${question.id}`).value.trim();
      if (!answer) {
        window.alert('Vui lòng gõ câu trả lời của bạn.');
        return;
      }
      handleEvaluateEssay(question, answer);
    });
  });
}

function handleMCQAnswer(button, quizObject) {
  const questionId = Number(button.dataset.qid);
  const chosenOption = button.dataset.opt;
  const question = quizObject.mcq_questions.find(item => item.id === questionId);
  if (!question) return;

  const optionContainer = button.closest('.mcq-options');
  optionContainer.querySelectorAll('.opt-btn').forEach(option => {
    option.disabled = true;
  });
  const feedbackBox = document.getElementById(`feedback-q${questionId}`);
  feedbackBox.hidden = false;

  if (chosenOption === question.correct_option) {
    button.classList.add('correct');
    feedbackBox.className = 'eval-feedback-box PASSED';
    feedbackBox.innerHTML = renderSafeMarkdown(
      `✅ **Chính xác.** ${question.explanation} [${question.citation}]`
    );
    return;
  }

  button.classList.add('wrong');
  optionContainer
    .querySelector(`[data-opt="${question.correct_option}"]`)
    ?.classList.add('correct');
  feedbackBox.className = 'eval-feedback-box FAILED';
  feedbackBox.innerHTML = renderSafeMarkdown(
    `❌ **Chưa đúng.** Đáp án đúng là **${question.correct_option}**. ${question.explanation} [${question.citation}]`
  );
}

async function handleEvaluateEssay(essayQuestion, studentAnswer) {
  const feedbackBox = document.getElementById(`essayFeedback-${essayQuestion.id}`);
  const submitButton = document.getElementById(`btnSubmitEssay-${essayQuestion.id}`);
  submitButton.disabled = true;
  feedbackBox.hidden = false;
  feedbackBox.className = 'eval-feedback-box';
  feedbackBox.innerHTML = '<div class="spinner"></div> Đang đối chiếu từng ý trong rubric…';

  try {
    const prompt = buildEssayEvaluatorPrompt(
      essayQuestion.question,
      JSON.stringify(essayQuestion.rubric_points),
      essayQuestion.citation,
      studentAnswer,
      essayQuestion.id
    );
    const llmResponse = await callLLMAPI(prompt, { json: true });
    let evaluation = null;
    if (llmResponse) {
      const raw = parseJSONObject(llmResponse);
      evaluation = normalizeLiveEvaluation(raw?.evaluation, essayQuestion);
    }
    if (!evaluation) evaluation = evaluateEssayLocally(essayQuestion, studentAnswer);
    renderEssayEvaluation(feedbackBox, evaluation);
  } finally {
    submitButton.disabled = false;
  }
}

function renderEssayEvaluation(feedbackBox, evaluation) {
  const statusLabels = {
    PASSED: '✅ **ĐẠT**',
    PASSED_WITH_FEEDBACK: '⚠️ **ĐẠT CÓ NHẬN XÉT**',
    FAILED: '❌ **CHƯA ĐẠT**'
  };
  feedbackBox.className = `eval-feedback-box ${evaluation.status}`;
  feedbackBox.innerHTML = renderSafeMarkdown(
    `${statusLabels[evaluation.status] || evaluation.status} · Điểm rubric: ${Math.round(evaluation.weighted_score * 100)}%\n${evaluation.feedback_comment} [${evaluation.citation}]`
  );
}

function resetQuizView() {
  adaptiveSession = null;
  quizScopeText.textContent = 'Mỗi lượt 1 câu · sai thì hỏi lại câu dễ hơn cùng chủ đề · đúng thì sang chủ đề khó hơn';
  quizContainer.innerHTML = `
    <div style="text-align:center; padding:40px; color:#94a3b8; font-size:13px;">
      Bấm <b>“🎯 Bắt đầu tự kiểm tra”</b> để bắt đầu — AI hỏi từng câu, sai thì hỏi lại câu dễ hơn, đúng thì sang chủ đề khó hơn.
    </div>
  `;
}

// --- Adaptive mastery quiz: sinh TỪNG CÂU MỘT, đánh giá, rồi chọn câu kế tiếp ---
// (lát cắt MỘT CÂU của spec: 1 học viên · tự kiểm tra sau khi đọc slide · 1 quyết định AI
//  lặp lại "đánh giá câu trả lời -> chọn câu hỏi kế tiếp" · 1 kết quả: lỗ hổng kiến thức được
//  chỉ ra kèm trích dẫn slide.)

function eligibleAdaptiveSlides(lesson) {
  return (lesson?.slides ?? []).filter(slide => (slide.content ?? '').trim().length > 20);
}

// Rule-based: không cần AI để đếm/ưu tiên trang học viên đã tự hỏi/khoanh vùng nhiều nhất.
function sortSlidesByInterest(slides) {
  const interestCount = new Map();
  for (const entry of interactionLog) {
    if (entry.page == null) continue;
    interestCount.set(entry.page, (interestCount.get(entry.page) ?? 0) + 1);
  }
  if (!interestCount.size) return slides;
  return [...slides].sort(
    (a, b) => (interestCount.get(b.page) ?? 0) - (interestCount.get(a.page) ?? 0)
  );
}

function buildInterestNote(slide) {
  const labelByType = { chat: 'đã chủ động hỏi', highlight: 'đã bôi đen hỏi', region: 'đã khoanh vùng ảnh hỏi' };
  const related = interactionLog.filter(entry => entry.page === slide.page).slice(-3);
  if (!related.length) return '';
  return related.map(entry => `- (${labelByType[entry.type] ?? 'đã hỏi'}): "${entry.text}"`).join('\n');
}

function startAdaptiveSession() {
  const lesson = currentLesson();
  const slides = sortSlidesByInterest(eligibleAdaptiveSlides(lesson));
  quizContainer.innerHTML = '';

  if (!slides.length) {
    const notice = document.createElement('div');
    notice.className = 'scope-notice';
    notice.textContent = 'Bài học này chưa có đủ text để tự kiểm tra thích ứng (PDF ảnh không có text layer?).';
    quizContainer.appendChild(notice);
    return;
  }

  adaptiveSession = {
    slideQueue: slides,
    slideIndex: 0,
    attempt: 0,
    difficulty: 'CHUẨN (kiểm tra hiểu khái niệm cốt lõi)',
    askedTexts: [],
    totalAsked: 0,
    results: [],
    offlinePool: null,
    offlinePoolUsedPages: new Set()
  };
  askNextAdaptiveQuestion();
}

async function askNextAdaptiveQuestion() {
  const session = adaptiveSession;
  if (!session) return;
  const lesson = currentLesson();

  if (
    session.slideIndex >= session.slideQueue.length ||
    session.totalAsked >= MAX_ADAPTIVE_QUESTIONS_PER_SESSION
  ) {
    finishAdaptiveSession(session);
    return;
  }

  const slide = session.slideQueue[session.slideIndex];
  quizScopeText.textContent =
    `Chủ đề ${session.slideIndex + 1}/${session.slideQueue.length} · Trang ${slide.page} · ` +
    `lượt ${session.attempt + 1}/${MAX_ATTEMPTS_PER_SLIDE} · đã hỏi ${session.totalAsked}/${MAX_ADAPTIVE_QUESTIONS_PER_SESSION} câu`;
  quizContainer.innerHTML = `
    <div style="text-align:center; padding:40px;">
      <div class="spinner"></div>
      <p style="margin-top:12px; font-size:13px; color:#94a3b8;">Đang trích nguồn Trang ${slide.page} và soạn câu hỏi…</p>
    </div>
  `;

  const question = await generateAdaptiveQuestion(lesson, slide, session);
  if (question) {
    session.totalAsked += 1;
    session.askedTexts.push(question.question);
  }
  renderAdaptiveQuestion(question, slide, session);
}

async function generateAdaptiveQuestion(lesson, slide, session) {
  const slideContext = `[Trang ${slide.page}]\nTiêu đề: ${slide.title}\nNội dung: ${slide.content}`;
  const interestNote = buildInterestNote(slide);
  const prompt = buildAdaptiveQuestionPrompt(slideContext, session.difficulty, session.askedTexts, interestNote);
  const llmResponse = await callLLMAPI(prompt, { json: true, temperature: 0.5 });

  if (llmResponse) {
    const raw = parseJSONObject(llmResponse);
    const verified = validateSingleQuestion(raw, lesson);
    const citedPage = Number(String(verified?.citation ?? '').match(/\d+/)?.[0]);
    if (verified && citedPage === Number(slide.page)) return verified;
    console.warn('Rejected adaptive question (grounding failed hoặc trích dẫn sai trang), dùng bản offline.');
  }

  return nextOfflineAdaptiveQuestion(lesson, slide, session);
}

function nextOfflineAdaptiveQuestion(lesson, slide, session) {
  if (!session.offlinePool) {
    session.offlinePool = createOfflineQuiz(lesson).mcq_questions;
  }
  if (session.offlinePoolUsedPages.has(slide.page)) return null;
  const match = session.offlinePool.find(
    question => Number(String(question.citation).match(/\d+/)?.[0]) === Number(slide.page)
  );
  if (!match) return null;
  session.offlinePoolUsedPages.add(slide.page);
  return match;
}

function renderAdaptiveQuestion(question, slide, session) {
  quizContainer.innerHTML = '';

  if (!question) {
    session.results.push({
      page: slide.page,
      title: slide.title,
      passed: false,
      attempts: session.attempt + 1,
      note: 'Không tạo thêm được câu hỏi có căn cứ cho chủ đề này (chế độ offline hết nguồn).'
    });
    advanceAdaptiveSlide(session);
    return;
  }

  const progress = document.createElement('div');
  progress.className = 'scope-notice';
  progress.textContent =
    `Chủ đề ${session.slideIndex + 1}/${session.slideQueue.length} · Trang ${slide.page} · ` +
    `lượt ${session.attempt + 1}/${MAX_ATTEMPTS_PER_SLIDE} · ${session.difficulty}`;
  quizContainer.appendChild(progress);

  const card = document.createElement('div');
  card.className = 'quiz-card';
  card.innerHTML = `
    <div class="quiz-card-header">
      <span class="quiz-type-tag">${escapeHTML(slide.title)}</span>
      <span class="quiz-source-locked">🔒 Nguồn mở sau khi trả lời</span>
    </div>
    <div class="quiz-question-text">${escapeHTML(question.question)}</div>
    <div class="mcq-options">
      ${Object.entries(question.options).map(([optionKey, optionValue]) =>
        `<button type="button" class="opt-btn" data-opt="${optionKey}">${optionKey}. ${escapeHTML(optionValue)}</button>`
      ).join('')}
    </div>
    <div class="eval-feedback-box" id="adaptiveFeedback" hidden></div>
    <div class="scope-notice" id="adaptiveHint" hidden></div>
    <div id="adaptiveActions" style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;"></div>
  `;
  quizContainer.appendChild(card);

  card.querySelectorAll('.opt-btn').forEach(button => {
    button.addEventListener('click', () => handleAdaptiveAnswer(button, question, slide, session));
  });
}

async function handleAdaptiveAnswer(button, question, slide, session) {
  const optionContainer = button.closest('.mcq-options');
  optionContainer.querySelectorAll('.opt-btn').forEach(option => {
    option.disabled = true;
  });
  const chosenOption = button.dataset.opt;
  const isCorrect = chosenOption === question.correct_option;
  // 'near' = ngộ nhận gần đúng (hiểu một phần) · 'far' = sai hẳn — do AI gắn nhãn lúc sinh câu hỏi (distractor_tiers).
  const tier = isCorrect ? 'correct' : (question.distractor_tiers?.[chosenOption] === 'near' ? 'near' : 'far');
  const feedbackBox = document.getElementById('adaptiveFeedback');
  feedbackBox.hidden = false;

  if (tier === 'correct') {
    button.classList.add('correct');
    feedbackBox.className = 'eval-feedback-box PASSED';
    feedbackBox.innerHTML = renderSafeMarkdown(
      `✅ **Hiểu đúng.** ${question.explanation} [${question.citation}]`
    );
    session.results.push({ page: slide.page, title: slide.title, passed: true, tier, attempts: session.attempt + 1 });
    showAdaptiveContinueActions('advance', slide, session);
    return;
  }

  button.classList.add('wrong');
  optionContainer.querySelector(`[data-opt="${question.correct_option}"]`)?.classList.add('correct');
  feedbackBox.className = tier === 'near' ? 'eval-feedback-box PASSED_WITH_FEEDBACK' : 'eval-feedback-box FAILED';
  const tierLine = tier === 'near' ? '⚠️ **Hiểu một phần.**' : '❌ **Chưa đúng.**';
  const canRetry = session.attempt + 1 < MAX_ATTEMPTS_PER_SLIDE;
  const retryKind = tier === 'near' ? 'retry-same' : 'retry-easier';
  const retryLine = tier === 'near'
    ? 'Bạn sẽ được hỏi lại 1 câu KHÁC cùng mức độ, để chắc chắn nắm đúng điểm vừa nhầm.'
    : 'Bạn sẽ được hỏi lại 1 câu DỄ HƠN, cùng chủ đề này.';

  feedbackBox.innerHTML = renderSafeMarkdown(
    `${tierLine} Đáp án đúng là **${question.correct_option}**. ${question.explanation} [${question.citation}]\n\n` +
    (canRetry
      ? retryLine
      : `Đã hết lượt hỗ trợ cho chủ đề này (tối đa ${MAX_ATTEMPTS_PER_SLIDE} lượt) — không hỏi thêm để tránh bịa câu hỏi, chuyển sang chủ đề tiếp theo.`)
  );

  if (!canRetry) {
    session.results.push({ page: slide.page, title: slide.title, passed: false, tier, attempts: session.attempt + 1 });
  }
  showAdaptiveContinueActions(canRetry ? retryKind : 'advance', slide, session);

  await showMisconceptionHint(question, chosenOption, tier, slide);
}

// Quyết định AI thứ hai trong flow: chẩn đoán ngộ nhận cụ thể + gợi ý bám đúng lựa chọn sai
// (không phải rule-based — nội dung gợi ý phải diễn giải ngữ nghĩa của lựa chọn học viên vừa chọn).
async function showMisconceptionHint(question, chosenOption, tier, slide) {
  const hintBox = document.getElementById('adaptiveHint');
  if (!hintBox) return;
  hintBox.hidden = false;
  hintBox.textContent = 'Đang phân tích chỗ nhầm để đưa gợi ý…';

  const slideContext = `[Trang ${slide.page}]\nTiêu đề: ${slide.title}\nNội dung: ${slide.content}`;
  const prompt = buildMisconceptionHintPrompt(
    slideContext,
    question.question,
    question.options[chosenOption],
    question.options[question.correct_option],
    tier
  );
  const llmResponse = await callLLMAPI(prompt, { json: true, temperature: 0.4 });
  const raw = llmResponse ? parseJSONObject(llmResponse) : null;
  if (!raw?.hint) {
    hintBox.hidden = true;
    return;
  }
  hintBox.innerHTML = renderSafeMarkdown(
    `**🔎 Có thể bạn đang nhầm:** ${raw.misconception || '—'}\n**💡 Gợi ý:** ${raw.hint}` +
    (raw.example ? `\n**Ví dụ:** ${raw.example}` : '')
  );
}

function showAdaptiveContinueActions(kind, slide, session) {
  const actions = document.getElementById('adaptiveActions');
  if (!actions) return;
  actions.innerHTML = '';

  const reviewButton = document.createElement('button');
  reviewButton.type = 'button';
  reviewButton.className = 'action-pill';
  reviewButton.textContent = `📖 Xem lại Trang ${slide.page}`;
  reviewButton.addEventListener('click', () => navigateToPage(slide.page));
  actions.appendChild(reviewButton);

  const atCap = session.totalAsked >= MAX_ADAPTIVE_QUESTIONS_PER_SESSION;
  const isRetry = (kind === 'retry-easier' || kind === 'retry-same') && !atCap;
  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'btn-submit-essay';
  nextButton.textContent = !isRetry
    ? 'Chủ đề tiếp theo →'
    : (kind === 'retry-same' ? 'Câu khác, cùng mức độ →' : 'Câu dễ hơn tiếp theo →');
  nextButton.addEventListener('click', () => {
    if (isRetry) {
      session.attempt += 1;
      session.difficulty = kind === 'retry-same'
        ? 'TƯƠNG ĐƯƠNG (hỏi lại đúng điểm vừa hiểu một phần, không hạ độ khó)'
        : 'DỄ HƠN (chỉ hỏi 1 ý đơn giản nhất, bám sát 1 câu chữ)';
      askNextAdaptiveQuestion();
    } else {
      advanceAdaptiveSlide(session);
    }
  });
  actions.appendChild(nextButton);
}

function advanceAdaptiveSlide(session) {
  session.slideIndex += 1;
  session.attempt = 0;
  session.difficulty = 'CHUẨN (kiểm tra hiểu khái niệm cốt lõi; chủ đề mới, khó hơn chủ đề trước)';
  session.askedTexts = [];
  askNextAdaptiveQuestion();
}

function finishAdaptiveSession(session) {
  quizContainer.innerHTML = '';
  const passedCount = session.results.filter(row => row.passed).length;

  const summary = document.createElement('div');
  summary.className = 'quiz-card';
  const rows = session.results.map(row => {
    const label = row.passed ? '✅ Đạt' : (row.tier === 'near' ? '⚠️ Hiểu một phần' : '❌ Chưa đạt');
    const color = row.passed ? '#6ee7b7' : (row.tier === 'near' ? '#fbbf24' : '#f87171');
    return `
    <div style="display:flex; justify-content:space-between; gap:12px; padding:6px 0; border-bottom:1px solid var(--panel-border, #1e293b); font-size:13px;">
      <span>${escapeHTML(row.title)} (Trang ${row.page})</span>
      <span style="color:${color}; white-space:nowrap;">${label}</span>
    </div>
  `;
  }).join('');

  summary.innerHTML = `
    <div class="quiz-card-header"><span class="quiz-type-tag">Tổng kết phiên tự kiểm tra</span></div>
    <div style="font-size:13px; color:#e2e8f0; margin:10px 0;">Đạt ${passedCount}/${session.results.length} chủ đề · ${session.totalAsked} câu đã hỏi trong phiên này</div>
    ${rows}
    <div style="margin-top:12px; font-size:12px; color:#94a3b8;">Kết quả này giúp bạn tự nhận diện lỗ hổng kiến thức, không dùng làm điểm chính thức.</div>
  `;
  quizContainer.appendChild(summary);
  quizScopeText.textContent = 'Phiên tự kiểm tra đã kết thúc — bấm "🎯 Bắt đầu tự kiểm tra" để làm lại.';
}

window.addEventListener('DOMContentLoaded', initApp);
