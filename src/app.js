import { VLEARN_LESSONS } from './data.js';
import {
  buildExplainRegionPrompt,
  buildSummarizeDeckPrompt,
  buildQAGroundedPrompt,
  buildQuizGeneratorPrompt,
  buildEssayEvaluatorPrompt
} from './prompts.js';
import {
  buildRelevantContext,
  createOfflineAnswer,
  createOfflineExplanation,
  createOfflineQuiz,
  createOfflineSummary,
  detectGuardrailViolation,
  evaluateEssayLocally,
  normalizeLiveEvaluation,
  validateGroundedResponse,
  validateQuizData
} from './grounding.mjs';

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_PDF_PAGES = 50;
const API_TIMEOUT_MS = 20_000;
const API_RETRY_DELAYS_MS = [0, 450, 1_100];

let currentLessonIndex = 0;
let currentSlideIndex = 0;
let currentSelectedText = '';
let currentQuizData = null;
let pdfRenderTask = null;
let pdfRenderSequence = 0;
let resizeTimer = null;

const lessonSelect = document.getElementById('lessonSelect');
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
  setAgentMode('offline', 'Demo có căn cứ');
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

  apiKeyInput.addEventListener('input', () => {
    setAgentMode(
      apiKeyInput.value.trim() ? 'ready' : 'offline',
      apiKeyInput.value.trim() ? 'Gemini sẵn sàng' : 'Demo có căn cứ'
    );
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

function delay(milliseconds) {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

async function callLLMAPI(promptText, { json = false } = {}) {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    setAgentMode('offline', 'Demo có căn cứ');
    return null;
  }

  for (let attempt = 0; attempt < API_RETRY_DELAYS_MS.length; attempt += 1) {
    if (API_RETRY_DELAYS_MS[attempt]) await delay(API_RETRY_DELAYS_MS[attempt]);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: json ? 0.1 : 0.2,
              ...(json ? { responseMimeType: 'application/json' } : {})
            }
          })
        }
      );
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const message = errorPayload?.error?.message || `HTTP ${response.status}`;
        throw new Error(message);
      }
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text ?? '')
        .join('')
        .trim();
      if (!text) throw new Error('Gemini không trả về nội dung');
      setAgentMode('live', 'Gemini live');
      return text;
    } catch (error) {
      console.warn(`Gemini attempt ${attempt + 1} failed:`, error);
      if (attempt === API_RETRY_DELAYS_MS.length - 1) {
        setAgentMode('error', 'Dự phòng có căn cứ');
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
  const offlineAnswer = createOfflineAnswer(lesson, query);
  if (!offlineAnswer.found) {
    appendMessage('bot', offlineAnswer.content);
    return;
  }

  const prompt = buildQAGroundedPrompt(relevantContext.text, query);
  const llmResponse = await callLLMAPI(prompt);
  if (llmResponse) {
    const verification = validateGroundedResponse(llmResponse, lesson, {
      allowedPages: relevantContext.allowedPages,
      allowedTranscriptIds: relevantContext.allowedTranscriptIds
    });
    if (verification.isValid) {
      appendMessage('bot', llmResponse);
      return;
    }
    console.warn('Rejected ungrounded Q&A response:', verification.reason);
  }

  appendMessage('bot', offlineAnswer.content);
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
      if (verifiedQuiz.mcq_questions.length || verifiedQuiz.essay_questions.length) {
        selectedQuiz = verifiedQuiz;
      } else {
        rejectionWarning =
          'Các câu AI sinh không khớp source_snippet/trang nguồn nên đã bị loại; đang dùng bộ câu hỏi trích xuất cục bộ.';
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
    ? `${verifiedQuiz.mcq_questions.length} trắc nghiệm + ${verifiedQuiz.essay_questions.length} tự luận · đã kiểm tra nguồn`
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
        ${citationButtonHTML(question.citation)}
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
        ${citationButtonHTML(question.citation)}
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

function citationButtonHTML(citation) {
  const page = String(citation).match(/(\d{1,3})/)?.[1];
  return page
    ? `<button type="button" class="citation-tag" data-citation-page="${page}">📌 ${escapeHTML(citation)}</button>`
    : `<span class="citation-tag">📌 ${escapeHTML(citation)}</span>`;
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
  quizScopeText.textContent = 'Câu hỏi chỉ được giữ lại khi khớp nguồn trên slide';
  quizContainer.innerHTML = `
    <div style="text-align:center; padding:40px; color:#94a3b8; font-size:13px;">
      Bấm <b>“⚡ Khởi tạo Quiz”</b> để bắt đầu bài kiểm tra có đối chiếu nguồn cho bài học này.
    </div>
  `;
}

window.addEventListener('DOMContentLoaded', initApp);
