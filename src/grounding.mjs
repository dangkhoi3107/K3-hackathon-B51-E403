const STOP_WORDS = new Set([
  'ai', 'anh', 'ban', 'bai', 'biet', 'cai', 'can', 'cho', 'co', 'cua', 'da',
  'day', 'de', 'den', 'duoc', 'gi', 'giai', 'giup', 'hay', 'hoi', 'khong',
  'khi', 'la', 'lam', 'mot', 'nao', 'nay', 'nhung', 'noi', 'o', 'tai',
  'the', 'thi', 'trang', 'trong', 'tu', 'va', 've', 'vi', 'voi',
  'what', 'when', 'where', 'which', 'who', 'why', 'how', 'the', 'a', 'an',
  'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are'
]);

const OUT_OF_SCOPE_PATTERNS = [
  /\b(giai|lam)\s+ho\b/,
  /\bdap\s+an\b.*\b(lab|quiz|bai\s*tap|bai\s*kiem\s*tra)\b.*\b(nop|cham\s*diem)\b/,
  /\b(ignore|bo\s+qua)\b.*\b(previous|truoc|chi\s*thi|huong\s*dan)\b/,
  /\b(system\s*prompt|developer\s*message|jailbreak|prompt\s*injection)\b/,
  /\b(reveal|hien|doc|xuat)\b.*\b(prompt|chi\s*thi\s*an|api\s*key)\b/
];

export function normalizeText(value) {
  return String(value ?? '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(value) {
  return normalizeText(value)
    .split(' ')
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

function uniqueTokens(value) {
  return [...new Set(tokenize(value))];
}

function tokenCoverage(needle, haystack) {
  const needleTokens = uniqueTokens(needle);
  if (!needleTokens.length) return 0;
  const haystackTokens = new Set(tokenize(haystack));
  const matched = needleTokens.filter(token => haystackTokens.has(token)).length;
  return matched / needleTokens.length;
}

function extractRequestedPage(query) {
  const match = normalizeText(query).match(/\b(?:trang|slide)\s*(\d{1,3})\b/);
  return match ? Number(match[1]) : null;
}

function scoreText(query, title, content) {
  const queryTokens = uniqueTokens(query);
  if (!queryTokens.length) return 0;

  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(title);
  const normalizedContent = normalizeText(content);
  const titleTokens = new Set(tokenize(title));
  const contentTokens = new Set(tokenize(content));

  let weightedMatches = 0;
  for (const token of queryTokens) {
    if (titleTokens.has(token)) weightedMatches += 2;
    else if (contentTokens.has(token)) weightedMatches += 1;
  }

  const maximum = queryTokens.length * 2;
  let score = maximum ? weightedMatches / maximum : 0;
  if (normalizedQuery.length >= 5 && normalizedContent.includes(normalizedQuery)) score += 0.65;
  if (normalizedQuery.length >= 5 && normalizedTitle.includes(normalizedQuery)) score += 0.8;
  return score;
}

export function retrieveRelevantSlides(lesson, query, options = {}) {
  const { limit = 3, minScore = 0.2 } = options;
  const requestedPage = extractRequestedPage(query);
  const ranked = (lesson?.slides ?? [])
    .map(slide => {
      const pageBoost = requestedPage === Number(slide.page) ? 2 : 0;
      const score = pageBoost + scoreText(query, slide.title, slide.content);
      return { slide, score };
    })
    .filter(item => item.score >= minScore)
    .sort((a, b) => b.score - a.score || a.slide.page - b.slide.page);

  return ranked.slice(0, limit);
}

export function retrieveRelevantTranscript(lesson, query, options = {}) {
  const { limit = 2, minScore = 0.2 } = options;
  return String(lesson?.transcript ?? '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const idMatch = line.match(/\[(T\d{2}-\d{3})\]/i);
      return {
        id: idMatch ? idMatch[1].toUpperCase() : null,
        text: line.replace(/^\[[^\]]+\]\s*/, ''),
        score: scoreText(query, '', line)
      };
    })
    .filter(item => item.id && item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildRelevantContext(lesson, query, options = {}) {
  const slideMatches = retrieveRelevantSlides(lesson, query, options);
  const transcriptMatches = retrieveRelevantTranscript(lesson, query, options);
  const contextParts = [
    ...slideMatches.map(({ slide }) =>
      `[Trang ${slide.page}]\nTiêu đề: ${slide.title}\nNội dung: ${slide.content}`
    ),
    ...transcriptMatches.map(item => `[${item.id}] ${item.text}`)
  ];

  return {
    text: contextParts.join('\n\n'),
    slideMatches,
    transcriptMatches,
    allowedPages: slideMatches.map(item => Number(item.slide.page)),
    allowedTranscriptIds: transcriptMatches.map(item => item.id)
  };
}

export function detectGuardrailViolation(query) {
  const normalized = normalizeText(query);
  const matched = OUT_OF_SCOPE_PATTERNS.some(pattern => pattern.test(normalized));
  return {
    blocked: matched,
    reason: matched
      ? 'Yêu cầu có dấu hiệu vượt phạm vi tự học hoặc cố thay đổi chỉ dẫn hệ thống.'
      : ''
  };
}

function transcriptSourceById(lesson, id) {
  const pattern = new RegExp(`\\[${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\s*([^\\n\\r]+)`, 'i');
  const match = String(lesson?.transcript ?? '').match(pattern);
  return match ? match[1] : '';
}

export function extractCitations(responseText) {
  const pages = [];
  const transcriptIds = [];
  const text = String(responseText ?? '');

  for (const match of text.matchAll(/\[\s*(?:trang|slide)\s+(\d{1,3})\s*\]/gi)) {
    pages.push(Number(match[1]));
  }
  for (const match of text.matchAll(/\[\s*(T\d{2}-\d{3})\s*\]/gi)) {
    transcriptIds.push(match[1].toUpperCase());
  }

  return {
    pages: [...new Set(pages)],
    transcriptIds: [...new Set(transcriptIds)]
  };
}

export function validateGroundedResponse(responseText, lesson, constraints = {}) {
  const text = String(responseText ?? '').trim();
  if (!text) return { isValid: false, reason: 'Phản hồi rỗng' };

  const citations = extractCitations(text);
  if (!citations.pages.length && !citations.transcriptIds.length) {
    return { isValid: false, reason: 'Thiếu trích dẫn nguồn' };
  }

  const existingPages = new Set((lesson?.slides ?? []).map(slide => Number(slide.page)));
  if (citations.pages.some(page => !existingPages.has(page))) {
    return { isValid: false, reason: 'Trích dẫn trang không tồn tại' };
  }

  const allowedPages = new Set((constraints.allowedPages ?? []).map(Number));
  if (allowedPages.size && citations.pages.some(page => !allowedPages.has(page))) {
    return { isValid: false, reason: 'Trích dẫn không thuộc ngữ cảnh đã truy xuất' };
  }

  const transcript = String(lesson?.transcript ?? '');
  if (citations.transcriptIds.some(id => !transcript.includes(`[${id}]`))) {
    return { isValid: false, reason: 'Mã transcript không tồn tại' };
  }

  const allowedTranscriptIds = new Set(
    (constraints.allowedTranscriptIds ?? []).map(id => String(id).toUpperCase())
  );
  if (
    allowedTranscriptIds.size &&
    citations.transcriptIds.some(id => !allowedTranscriptIds.has(id))
  ) {
    return { isValid: false, reason: 'Trích dẫn transcript không thuộc ngữ cảnh đã truy xuất' };
  }

  const citedSources = [
    ...citations.pages.map(page => {
      const slide = lesson.slides.find(item => Number(item.page) === page);
      return `${slide?.title ?? ''} ${slide?.content ?? ''}`;
    }),
    ...citations.transcriptIds.map(id => transcriptSourceById(lesson, id))
  ].join(' ');

  const responseWithoutCitations = text
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\b(trang|slide)\s+\d+\b/gi, ' ');
  const overlap = tokenCoverage(responseWithoutCitations, citedSources);
  if (uniqueTokens(responseWithoutCitations).length >= 5 && overlap < 0.15) {
    return { isValid: false, reason: 'Nội dung phản hồi không khớp đủ với nguồn trích dẫn' };
  }

  return { isValid: true, citations, overlap };
}

export function verifyCitationAndSnippet(lesson, citationPage, sourceSnippet = '') {
  const slide = (lesson?.slides ?? []).find(item => Number(item.page) === Number(citationPage));
  if (!slide) return { isValid: false, reason: 'Trang không tồn tại', score: 0 };

  const snippet = String(sourceSnippet ?? '').trim();
  if (!snippet) return { isValid: false, reason: 'Thiếu source_snippet', score: 0 };

  const normalizedSnippet = normalizeText(snippet);
  const normalizedSlide = normalizeText(`${slide.title} ${slide.content}`);
  if (normalizedSnippet.length >= 12 && normalizedSlide.includes(normalizedSnippet)) {
    return { isValid: true, score: 1 };
  }

  const score = tokenCoverage(snippet, `${slide.title} ${slide.content}`);
  return score >= 0.6
    ? { isValid: true, score }
    : { isValid: false, reason: 'source_snippet không khớp nội dung trang', score };
}

function splitSentences(content) {
  return String(content ?? '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length >= 12);
}

export function extractBestSentence(content, query = '') {
  const sentences = splitSentences(content);
  if (!sentences.length) return String(content ?? '').trim();
  if (!query) return sentences[0];

  return sentences
    .map(sentence => ({ sentence, score: scoreText(query, '', sentence) }))
    .sort((a, b) => b.score - a.score)[0].sentence;
}

function extractBestPassage(content, query) {
  const sentences = splitSentences(content);
  if (sentences.length <= 1) return sentences[0] ?? String(content ?? '').trim();

  const candidates = sentences.map((sentence, index) => {
    const nextSentence = sentences[index + 1];
    return nextSentence ? `${sentence} ${nextSentence}` : sentence;
  });
  return candidates
    .map(passage => ({ passage, score: scoreText(query, '', passage) }))
    .sort((a, b) => b.score - a.score)[0].passage;
}

function shorten(value, maxLength = 220) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trim()}…`;
}

export function createOfflineAnswer(lesson, query) {
  const context = buildRelevantContext(lesson, query);
  const bestSlide = context.slideMatches[0]?.slide;
  if (bestSlide) {
    const sentence = extractBestPassage(bestSlide.content, query);
    return {
      found: true,
      content: `Theo nội dung bài giảng, ${sentence} [Trang ${bestSlide.page}]`,
      citation: `Trang ${bestSlide.page}`,
      context
    };
  }

  const bestTranscript = context.transcriptMatches[0];
  if (bestTranscript) {
    return {
      found: true,
      content: `Theo transcript bài giảng, ${bestTranscript.text} [${bestTranscript.id}]`,
      citation: bestTranscript.id,
      context
    };
  }

  return {
    found: false,
    content: 'Chưa tìm thấy nội dung đủ liên quan trong slide hoặc transcript của bài đang mở. Bạn hãy nêu rõ thuật ngữ hoặc số trang cần hỏi; mình sẽ không đoán ngoài tài liệu.',
    citation: null,
    context
  };
}

export function createOfflineExplanation(slide, selectedText) {
  const selected = String(selectedText ?? '').trim();
  const source = String(slide?.content ?? '').trim();
  if (!source || !selected) {
    return 'Trang này không có đủ văn bản để giải thích có căn cứ. Nếu đây là slide ảnh, hãy dùng bản PDF có text layer hoặc bổ sung transcript.';
  }

  const sentence = extractBestSentence(source, selected);
  return [
    `Đoạn bạn chọn nói về: “${shorten(selected, 180)}”.`,
    `Ngữ cảnh trực tiếp trên slide: ${shorten(sentence, 260)}.`,
    `Mình chỉ diễn giải từ nội dung đang hiển thị, không bổ sung kiến thức ngoài tài liệu. [Trang ${slide.page}]`
  ].join('\n');
}

export function createOfflineSummary(lesson) {
  const informativeSlides = (lesson?.slides ?? []).filter(slide => tokenize(slide.content).length >= 3);
  if (!informativeSlides.length) {
    return {
      hasContent: false,
      content: 'PDF đã hiển thị được, nhưng không có text layer đủ dùng để tóm tắt có căn cứ. Hãy dùng PDF có thể chọn chữ hoặc bổ sung transcript.'
    };
  }

  const objectives = informativeSlides.slice(0, 3).map(
    (slide, index) => `${index + 1}. Nắm ý chính: ${slide.title} [Trang ${slide.page}]`
  );
  const takeaways = informativeSlides.slice(0, 5).map(
    slide => `- ${shorten(extractBestSentence(slide.content), 200)} [Trang ${slide.page}]`
  );
  const map = informativeSlides.slice(0, 6).map(
    slide => `- Trang ${slide.page}: ${slide.title}`
  );

  return {
    hasContent: true,
    content: [
      '**3 mục tiêu ôn tập**',
      ...objectives,
      '',
      '**Các ý chính có căn cứ**',
      ...takeaways,
      '',
      '**Bản đồ slide**',
      ...map
    ].join('\n')
  };
}

function deterministicOptions(correctText, distractorTexts, rotation) {
  const fallbackDistractors = [
    'Tài liệu không đưa ra nhận định này ở trang được hỏi.',
    'Nội dung này thuộc một chủ đề khác và không mô tả khái niệm trên.',
    'Trang được hỏi không cung cấp dữ liệu để kết luận như vậy.'
  ];
  const uniqueDistractors = [...new Set(
    distractorTexts
      .map(text => shorten(text, 180))
      .filter(text => text && text !== correctText)
  )];
  while (uniqueDistractors.length < 3) {
    uniqueDistractors.push(fallbackDistractors[uniqueDistractors.length]);
  }

  const values = uniqueDistractors.slice(0, 3);
  const correctIndex = rotation % 4;
  values.splice(correctIndex, 0, shorten(correctText, 180));
  const keys = ['A', 'B', 'C', 'D'];
  return {
    options: Object.fromEntries(keys.map((key, index) => [key, values[index]])),
    correctOption: keys[correctIndex]
  };
}

function buildRubricPoints(slide) {
  const sentences = splitSentences(slide.content).slice(0, 2);
  if (!sentences.length) return [];
  if (sentences.length === 1) {
    return [{
      point_id: 'P1',
      description: shorten(sentences[0], 260),
      weight: 1,
      is_core: true
    }];
  }
  return [
    {
      point_id: 'P1',
      description: shorten(sentences[0], 260),
      weight: 0.6,
      is_core: true
    },
    {
      point_id: 'P2',
      description: shorten(sentences[1], 260),
      weight: 0.4,
      is_core: false
    }
  ];
}

export function createOfflineQuiz(lesson) {
  const informativeSlides = (lesson?.slides ?? []).filter(slide => tokenize(slide.content).length >= 5);
  const selectedSlides = informativeSlides.slice(0, 7);
  const sourceSentences = selectedSlides.map(slide => extractBestSentence(slide.content));

  const mcqQuestions = selectedSlides.map((slide, index) => {
    const sourceSnippet = sourceSentences[index];
    const distractors = sourceSentences.filter((_, sourceIndex) => sourceIndex !== index);
    const optionSet = deterministicOptions(sourceSnippet, distractors, index);
    return {
      id: index + 1,
      source_snippet: sourceSnippet,
      question: `Theo bài giảng, nhận định nào mô tả đúng “${slide.title}”?`,
      options: optionSet.options,
      correct_option: optionSet.correctOption,
      explanation: `Đáp án được trích trực tiếp từ nội dung của Trang ${slide.page}.`,
      citation: `Trang ${slide.page}`
    };
  });

  const essaySource = selectedSlides[0];
  const rubricPoints = essaySource ? buildRubricPoints(essaySource) : [];
  const essayQuestions = essaySource && rubricPoints.length
    ? [{
        id: mcqQuestions.length + 1,
        source_snippet: rubricPoints.map(point => point.description).join(' '),
        question: `Hãy diễn giải ý chính của “${essaySource.title}” bằng lời của bạn.`,
        rubric_points: rubricPoints,
        citation: `Trang ${essaySource.page}`
      }]
    : [];

  return {
    lesson_title: lesson?.title ?? 'Bài học',
    mcq_questions: mcqQuestions,
    essay_questions: essayQuestions,
    is_fallback: true,
    warning: selectedSlides.length < 7
      ? `Tài liệu chỉ có ${selectedSlides.length} trang đủ text; hệ thống tạo ít câu hơn để tránh bịa nội dung.`
      : ''
  };
}

function citationPage(citation) {
  const match = String(citation ?? '').match(/(\d{1,3})/);
  return match ? Number(match[1]) : null;
}

function normalizeQuestion(rawQuestion, lesson, type) {
  if (!rawQuestion || typeof rawQuestion !== 'object') return null;
  const page = citationPage(rawQuestion.citation);
  const verification = verifyCitationAndSnippet(lesson, page, rawQuestion.source_snippet);
  if (!verification.isValid) return null;

  if (type === 'mcq') {
    const options = rawQuestion.options;
    const correctOption = String(rawQuestion.correct_option ?? '').toUpperCase();
    if (
      !rawQuestion.question ||
      !options ||
      !['A', 'B', 'C', 'D'].every(key => typeof options[key] === 'string' && options[key].trim()) ||
      !['A', 'B', 'C', 'D'].includes(correctOption)
    ) {
      return null;
    }
    return {
      id: rawQuestion.id,
      source_snippet: String(rawQuestion.source_snippet),
      question: String(rawQuestion.question),
      options: Object.fromEntries(['A', 'B', 'C', 'D'].map(key => [key, String(options[key])])),
      correct_option: correctOption,
      explanation: String(rawQuestion.explanation ?? 'Đáp án được đối chiếu với đoạn nguồn.'),
      citation: `Trang ${page}`
    };
  }

  const rubricPoints = Array.isArray(rawQuestion.rubric_points)
    ? rawQuestion.rubric_points
        .filter(point => point && point.point_id && point.description && Number(point.weight) > 0)
        .map(point => ({
          point_id: String(point.point_id),
          description: String(point.description),
          weight: Number(point.weight),
          is_core: Boolean(point.is_core)
        }))
    : [];
  if (!rawQuestion.question || !rubricPoints.length) return null;
  const totalWeight = rubricPoints.reduce((sum, point) => sum + point.weight, 0);
  const normalizedRubric = rubricPoints.map(point => ({
    ...point,
    weight: point.weight / totalWeight
  }));
  return {
    id: rawQuestion.id,
    source_snippet: String(rawQuestion.source_snippet),
    question: String(rawQuestion.question),
    rubric_points: normalizedRubric,
    citation: `Trang ${page}`
  };
}

export function validateQuizData(rawQuiz, lesson) {
  if (!rawQuiz || typeof rawQuiz !== 'object') {
    return { lesson_title: lesson?.title ?? 'Bài học', mcq_questions: [], essay_questions: [] };
  }

  const mcqQuestions = (Array.isArray(rawQuiz.mcq_questions) ? rawQuiz.mcq_questions : [])
    .map(question => normalizeQuestion(question, lesson, 'mcq'))
    .filter(Boolean)
    .slice(0, 8);
  const essayQuestions = (Array.isArray(rawQuiz.essay_questions) ? rawQuiz.essay_questions : [])
    .map(question => normalizeQuestion(question, lesson, 'essay'))
    .filter(Boolean)
    .slice(0, 2);

  const usedIds = new Set();
  const assignId = (question, fallbackId) => {
    let id = Number(question.id);
    if (!Number.isInteger(id) || usedIds.has(id)) id = fallbackId;
    while (usedIds.has(id)) id += 1;
    usedIds.add(id);
    return { ...question, id };
  };

  const normalizedMcq = mcqQuestions.map((question, index) => assignId(question, index + 1));
  const normalizedEssay = essayQuestions.map(
    (question, index) => assignId(question, normalizedMcq.length + index + 1)
  );

  return {
    lesson_title: lesson?.title ?? String(rawQuiz.lesson_title ?? 'Bài học'),
    mcq_questions: normalizedMcq,
    essay_questions: normalizedEssay
  };
}

export function evaluateEssayLocally(essayQuestion, studentAnswer) {
  const answer = String(studentAnswer ?? '').trim();
  const rubricPoints = Array.isArray(essayQuestion?.rubric_points)
    ? essayQuestion.rubric_points
    : [];
  const matchedPoints = rubricPoints.filter(point => {
    const pointTokens = uniqueTokens(point.description);
    const coverage = tokenCoverage(point.description, answer);
    const answerTokens = new Set(tokenize(answer));
    const distinctiveMatches = pointTokens.filter(token => answerTokens.has(token)).length;
    return coverage >= 0.28 && distinctiveMatches >= Math.min(2, pointTokens.length);
  });
  const matchedIds = new Set(matchedPoints.map(point => point.point_id));
  const missingPoints = rubricPoints.filter(point => !matchedIds.has(point.point_id));
  const weightedScore = matchedPoints.reduce((sum, point) => sum + Number(point.weight || 0), 0);
  const missingCore = missingPoints.some(point => point.is_core);
  const status = missingCore
    ? 'FAILED'
    : weightedScore >= 0.8
      ? 'PASSED'
      : weightedScore >= 0.4
        ? 'PASSED_WITH_FEEDBACK'
        : 'FAILED';

  const matchedLabel = matchedPoints.length
    ? `Đã nêu được ${matchedPoints.map(point => point.point_id).join(', ')}.`
    : 'Chưa khớp ý nào trong rubric.';
  const missingLabel = missingPoints.length
    ? `Còn thiếu ${missingPoints.map(point => `${point.point_id}: ${shorten(point.description, 120)}`).join('; ')}.`
    : 'Đã đủ các ý trong rubric.';

  return {
    status,
    weighted_score: Number(weightedScore.toFixed(2)),
    total_possible_score: 1,
    matched_point_ids: [...matchedIds],
    missing_point_ids: missingPoints.map(point => point.point_id),
    feedback_comment: `${matchedLabel} ${missingLabel}`,
    citation: essayQuestion?.citation ?? ''
  };
}

export function normalizeLiveEvaluation(rawEvaluation, essayQuestion) {
  if (!rawEvaluation || typeof rawEvaluation !== 'object') return null;
  const validIds = new Set((essayQuestion?.rubric_points ?? []).map(point => point.point_id));
  const matchedIds = Array.isArray(rawEvaluation.matched_point_ids)
    ? rawEvaluation.matched_point_ids.map(String).filter(id => validIds.has(id))
    : [];
  const matchedSet = new Set(matchedIds);
  const rubricPoints = essayQuestion?.rubric_points ?? [];
  const weightedScore = rubricPoints
    .filter(point => matchedSet.has(point.point_id))
    .reduce((sum, point) => sum + Number(point.weight || 0), 0);
  const missingPoints = rubricPoints.filter(point => !matchedSet.has(point.point_id));
  const missingCore = missingPoints.some(point => point.is_core);
  const status = missingCore
    ? 'FAILED'
    : weightedScore >= 0.8
      ? 'PASSED'
      : weightedScore >= 0.4
        ? 'PASSED_WITH_FEEDBACK'
        : 'FAILED';

  return {
    status,
    weighted_score: Number(weightedScore.toFixed(2)),
    total_possible_score: 1,
    matched_point_ids: matchedIds,
    missing_point_ids: missingPoints.map(point => point.point_id),
    feedback_comment: String(rawEvaluation.feedback_comment ?? '').trim() ||
      'Kết quả đã được tính lại từ các ý rubric khớp với câu trả lời.',
    citation: essayQuestion?.citation ?? ''
  };
}
