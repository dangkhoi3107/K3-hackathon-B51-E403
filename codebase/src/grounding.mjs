const STOP_WORDS = new Set([
  'ai', 'anh', 'ban', 'bai', 'biet', 'cai', 'can', 'cho', 'co', 'cua', 'da',
  'day', 'de', 'den', 'duoc', 'gi', 'giai', 'giup', 'hay', 'hoi', 'khong',
  'khi', 'la', 'lam', 'mot', 'nao', 'nay', 'nhung', 'noi', 'o', 'tai',
  'the', 'thi', 'trang', 'trong', 'tu', 'va', 've', 'vi', 'voi',
  'what', 'when', 'where', 'which', 'who', 'why', 'how', 'the', 'a', 'an',
  'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are'
]);

const OUT_OF_SCOPE_PATTERNS = [
  /\b(giai|lam|viet)\s+(ho|giup)\b/,
  /\bdap\s+an\b.*\b(lab|quiz|bai\s*tap|bai\s*kiem\s*tra)\b.*\b(nop|cham\s*diem)\b/,
  /\b(ignore|bo\s+qua)\b.*\b(previous|truoc|chi\s*thi|huong\s*dan)\b/,
  /\b(system\s*prompt|developer\s*message|jailbreak|prompt\s*injection)\b/,
  /\b(reveal|hien|doc|xuat)\b.*\b(prompt|chi\s*thi\s*an|api\s*key)\b/
];

const GENERAL_KNOWLEDGE_GLOSSARY = [
  {
    aliases: ['vlm', 'vision language model', 'vision-language model'],
    term: 'VLM (Vision-Language Model)',
    definition: 'VLM là mô hình AI kết hợp khả năng xử lý thị giác và ngôn ngữ để liên hệ nội dung hình ảnh với văn bản.',
    capabilities: 'VLM có thể được dùng cho mô tả ảnh, hỏi đáp về hình ảnh, tìm kiếm ảnh–văn bản và các bài toán suy luận đa phương thức.',
    distinction: 'Khác với LLM thuần văn bản, VLM nhận thêm tín hiệu thị giác; kiến trúc cụ thể có thể kết hợp bộ mã hóa ảnh, mô hình ngôn ngữ và một thành phần nối hai không gian biểu diễn.'
  },
  {
    aliases: ['llm', 'large language model'],
    term: 'LLM (Large Language Model)',
    definition: 'LLM là mô hình ngôn ngữ quy mô lớn được huấn luyện trên lượng văn bản lớn để dự đoán và sinh chuỗi ngôn ngữ.',
    capabilities: 'LLM thường được dùng để trả lời câu hỏi, tóm tắt, viết nội dung, trích xuất thông tin và hỗ trợ lập trình.',
    distinction: 'LLM nền tảng chủ yếu thao tác trên ngôn ngữ; khả năng xử lý ảnh, âm thanh hoặc video cần thêm thành phần đa phương thức.'
  },
  {
    aliases: ['rag', 'retrieval augmented generation', 'retrieval-augmented generation'],
    term: 'RAG (Retrieval-Augmented Generation)',
    definition: 'RAG là cách kết hợp bước truy xuất tài liệu liên quan với bước sinh câu trả lời của mô hình.',
    capabilities: 'Hệ thống tìm các đoạn nguồn phù hợp, đưa chúng vào context rồi yêu cầu model trả lời dựa trên nguồn đó.',
    distinction: 'RAG không tự bảo đảm câu trả lời đúng; chất lượng còn phụ thuộc truy xuất, cách ghép context, prompt và bước kiểm tra output.'
  },
  {
    aliases: ['embedding', 'embeddings', 'vector embedding'],
    term: 'Embedding',
    definition: 'Embedding là biểu diễn dữ liệu như văn bản hoặc hình ảnh thành vector số để các nội dung gần nghĩa có thể nằm gần nhau trong không gian biểu diễn.',
    capabilities: 'Embedding thường được dùng cho tìm kiếm ngữ nghĩa, gom cụm, gợi ý và truy xuất tài liệu cho RAG.',
    distinction: 'Embedding không phải là câu trả lời cuối; nó là biểu diễn trung gian phục vụ so sánh và truy xuất.'
  },
  {
    aliases: ['fine tuning', 'fine-tuning', 'finetuning'],
    term: 'Fine-tuning',
    definition: 'Fine-tuning là tiếp tục huấn luyện một mô hình đã có trên dữ liệu hoặc mục tiêu hẹp hơn để điều chỉnh hành vi cho tác vụ cụ thể.',
    capabilities: 'Nó có thể giúp model học phong cách, định dạng hoặc mẫu tác vụ ổn định hơn khi prompt đơn thuần chưa đủ.',
    distinction: 'Fine-tuning khác RAG: fine-tuning thay đổi tham số hoặc adapter của model, còn RAG đưa nguồn được truy xuất vào context lúc chạy.'
  }
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

function queryContainsAlias(query, alias) {
  const normalizedQuery = ` ${normalizeText(query)} `;
  const normalizedAlias = normalizeText(alias);
  return normalizedAlias && normalizedQuery.includes(` ${normalizedAlias} `);
}

export function requiresCurrentInformation(query) {
  const normalized = normalizeText(query);
  return [
    /\b(hom nay|bay gio|hien tai|moi nhat|vua xay ra)\b/,
    /\b(thoi tiet|gia co phieu|ty gia|lich thi dau|tin tuc)\b/,
    /\b(today|now|current|latest|weather|stock price|exchange rate)\b/
  ].some(pattern => pattern.test(normalized));
}

export function createGeneralKnowledgeAnswer(query) {
  if (requiresCurrentInformation(query)) {
    return {
      found: false,
      requiresCurrentInformation: true,
      content: 'Câu hỏi này cần dữ liệu cập nhật theo thời gian thực. Chatbot hiện không có công cụ tra cứu trực tiếp nên mình không nên đoán.'
    };
  }

  const entry = GENERAL_KNOWLEDGE_GLOSSARY.find(item =>
    item.aliases.some(alias => queryContainsAlias(query, alias))
  );
  if (!entry) {
    return {
      found: false,
      requiresCurrentInformation: false,
      content: ''
    };
  }

  return {
    found: true,
    topic: entry.term,
    requiresCurrentInformation: false,
    content: [
      '**Kiến thức nền ngoài slide**',
      `${entry.definition}`,
      '',
      `**${entry.term} có thể làm gì?**`,
      entry.capabilities,
      '',
      '**Điểm cần phân biệt**',
      entry.distinction,
      '',
      'ℹ️ Phần trên là kiến thức nền bổ sung, không phải trích dẫn từ slide đang mở.'
    ].join('\n')
  };
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
  let distinctiveMatches = 0;
  for (const token of queryTokens) {
    if (titleTokens.has(token)) {
      weightedMatches += 2;
      if (token.length >= 5) distinctiveMatches += 1;
    } else if (contentTokens.has(token)) {
      weightedMatches += 1;
      if (token.length >= 5) distinctiveMatches += 1;
    }
  }

  const maximum = queryTokens.length * 2;
  let score = maximum ? weightedMatches / maximum : 0;
  score += distinctiveMatches * 0.12;
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

// Tách riêng phần format khỏi phần tìm kiếm để chỗ khác (vd retrieval theo vector
// embedding trong app.js) có thể tái dùng đúng định dạng context này thay vì chép lại.
export function formatRetrievedContext(slideMatches, transcriptMatches) {
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

export function buildRelevantContext(lesson, query, options = {}) {
  const slideMatches = retrieveRelevantSlides(lesson, query, options);
  const transcriptMatches = retrieveRelevantTranscript(lesson, query, options);
  return formatRetrievedContext(slideMatches, transcriptMatches);
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

function stripLessonCitations(responseText) {
  return String(responseText ?? '')
    .replace(/\[\s*(?:trang|slide)\s+\d{1,3}\s*\]/gi, '')
    .replace(/\[\s*T\d{2}-\d{3}\s*\]/gi, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

export function validateHybridResponse(responseText, lesson, constraints = {}) {
  const text = String(responseText ?? '').trim();
  if (!text) return { isValid: false, reason: 'Phản hồi rỗng' };

  const generalLabel =
    'kiến thức nền ngoài slide|kiến thức bổ sung ngoài slide|kiến thức nền bổ sung|kiến thức bổ sung|thông tin bổ sung|giải thích mở rộng';
  const generalHeadingPattern = new RegExp(
    `^[ \\t]*(?:#{1,6}[ \\t]+)?(?:\\*\\*)?[ \\t]*(?:${generalLabel})[ \\t]*(?::|—|-)?[ \\t]*(?:\\*\\*)?[ \\t]*$`,
    'im'
  );
  const generalInlinePattern = new RegExp(
    `^[ \\t]*(?:\\*\\*)?[ \\t]*(?:${generalLabel})[ \\t]*(?::|—|-)[ \\t]*(?:\\*\\*)?[ \\t]*`,
    'i'
  );
  const generalLabelMatch =
    text.match(generalHeadingPattern) ?? text.match(generalInlinePattern);
  const limitHeadingPattern =
    /^[ \t]*(?:#{1,6}[ \t]+)?(?:\*\*)?[ \t]*(?:giới hạn|lưu ý về giới hạn)[ \t]*(?::|—|-)?[ \t]*(?:\*\*)?[ \t]*$/im;
  const limitLabelMatch = text.match(limitHeadingPattern);
  const citations = extractCitations(text);
  const courseHeadingPattern =
    /^[ \t]*(?:#{1,6}[ \t]+)?(?:\*\*)?[ \t]*(?:trong bài giảng|theo bài giảng|theo slide)[ \t]*(?::|—|-)?[ \t]*(?:\*\*)?[ \t]*$/gim;

  const downgradeToGeneralKnowledge = reason => {
    const cleanedText = stripLessonCitations(text)
      .replace(generalHeadingPattern, '')
      .replace(generalInlinePattern, '')
      .replace(courseHeadingPattern, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (tokenize(cleanedText).length < 3) {
      return { isValid: false, reason };
    }
    return {
      isValid: true,
      citations: { pages: [], transcriptIds: [] },
      hasGeneralKnowledge: true,
      isLimited: false,
      wasAutoLabeled: true,
      reclassifiedAsGeneralKnowledge: true,
      reclassifiedReason: reason,
      normalizedText: `**Kiến thức nền ngoài slide**\n${cleanedText}`
    };
  };

  if (citations.pages.length || citations.transcriptIds.length) {
    const groundedSegment = generalLabelMatch
      ? text.slice(0, generalLabelMatch.index).trim()
      : text;
    const groundedValidation = validateGroundedResponse(
      groundedSegment,
      lesson,
      constraints
    );
    if (!groundedValidation.isValid) {
      if (constraints.allowCitationDowngrade) {
        return downgradeToGeneralKnowledge(groundedValidation.reason);
      }
      return groundedValidation;
    }
  }

  if (
    !citations.pages.length &&
    !citations.transcriptIds.length &&
    !generalLabelMatch &&
    !limitLabelMatch
  ) {
    if (
      constraints.allowUnlabeledGeneralKnowledge &&
      tokenize(text).length >= 3
    ) {
      return {
        isValid: true,
        citations,
        hasGeneralKnowledge: true,
        isLimited: false,
        wasAutoLabeled: true,
        normalizedText: `**Kiến thức nền ngoài slide**\n${text}`
      };
    }
    return {
      isValid: false,
      reason: 'Kiến thức ngoài slide chưa được gắn nhãn rõ'
    };
  }

  let normalizedText = text;
  if (generalLabelMatch) {
    const generalSection = text.slice(
      generalLabelMatch.index + generalLabelMatch[0].length
    ).trim();
    const generalCitations = extractCitations(generalSection);
    if (
      generalCitations.pages.length ||
      generalCitations.transcriptIds.length
    ) {
      if (!constraints.allowCitationDowngrade) {
        return {
          isValid: false,
          reason: 'Phần kiến thức nền ngoài slide không được gắn citation bài giảng'
        };
      }
    }
    const cleanedGeneralSection = stripLessonCitations(generalSection);
    if (tokenize(cleanedGeneralSection).length < 3) {
      return {
        isValid: false,
        reason: 'Phần kiến thức nền ngoài slide quá ngắn hoặc không có nội dung'
      };
    }
    normalizedText = [
      text.slice(0, generalLabelMatch.index),
      '**Kiến thức nền ngoài slide**\n',
      cleanedGeneralSection
    ].join('').trim();
  }

  if (limitLabelMatch) {
    const limitSection = text.slice(
      limitLabelMatch.index + limitLabelMatch[0].length
    ).trim();
    if (tokenize(limitSection).length < 4) {
      return {
        isValid: false,
        reason: 'Phần giới hạn quá ngắn hoặc không giải thích được lý do'
      };
    }
  }

  if (limitLabelMatch) {
    normalizedText = normalizedText
      .replace(limitHeadingPattern, '**Giới hạn**')
      .trim();
  }

  return {
    isValid: true,
    citations: extractCitations(normalizedText),
    hasGeneralKnowledge: Boolean(generalLabelMatch),
    isLimited: Boolean(limitLabelMatch),
    wasAutoLabeled: false,
    reclassifiedAsGeneralKnowledge: false,
    normalizedText
  };
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

function teachingExpansion(slide) {
  const title = String(slide?.title ?? 'nội dung này').trim();
  return {
    note: slide?.teachingNote ||
      `Nói cách khác, “${title}” cần được hiểu cùng điều kiện và hệ quả được nêu trong nguồn; không nên biến một nhận định có bối cảnh thành quy tắc đúng cho mọi trường hợp.`,
    example: slide?.example ||
      `Hãy thử áp dụng “${title}” vào một tình huống gần với bài của bạn: xác định đầu vào, quyết định cần đưa ra và hậu quả nếu hiểu sai, rồi đối chiếu lại với trang nguồn.`
  };
}

export function createOfflineAnswer(lesson, query) {
  const context = buildRelevantContext(lesson, query);
  const bestSlide = context.slideMatches[0]?.slide;
  if (bestSlide) {
    const passage = extractBestPassage(bestSlide.content, query);
    const expansion = teachingExpansion(bestSlide);
    return {
      found: true,
      content: [
        '**Trả lời ngắn**',
        `${passage} [Trang ${bestSlide.page}]`,
        '',
        '**Giải thích thêm**',
        `${expansion.note} [Trang ${bestSlide.page}]`,
        '',
        '**Ví dụ minh họa (do hệ thống tạo)**',
        expansion.example
      ].join('\n'),
      citation: `Trang ${bestSlide.page}`,
      context
    };
  }

  const bestTranscript = context.transcriptMatches[0];
  if (bestTranscript) {
    return {
      found: true,
      content: [
        '**Trả lời ngắn**',
        `${bestTranscript.text} [${bestTranscript.id}]`,
        '',
        '**Giải thích thêm**',
        'Đoạn transcript trên là căn cứ trực tiếp. Khi áp dụng, hãy giữ nguyên điều kiện và kết luận của người giảng thay vì suy rộng thành một quy tắc tuyệt đối.'
      ].join('\n'),
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

export function createHybridOfflineAnswer(lesson, query) {
  const generalAnswer = createGeneralKnowledgeAnswer(query);
  const context = buildRelevantContext(lesson, query);
  const bestSlide = context.slideMatches[0]?.slide;
  const bestTranscript = context.transcriptMatches[0];

  if (generalAnswer.found) {
    const courseSection = bestSlide
      ? [
          '**Trong bài giảng**',
          `${extractBestPassage(bestSlide.content, query)} [Trang ${bestSlide.page}]`,
          '',
          'Slide đang dùng thuật ngữ này nhưng phần định nghĩa dưới đây là kiến thức nền bổ sung.'
        ].join('\n')
      : bestTranscript
        ? [
            '**Trong bài giảng**',
            `${bestTranscript.text} [${bestTranscript.id}]`,
            '',
            'Transcript có nhắc tới thuật ngữ; phần định nghĩa dưới đây là kiến thức nền bổ sung.'
          ].join('\n')
        : '';

    return {
      found: true,
      sourceType: courseSection ? 'hybrid' : 'general_knowledge',
      content: [courseSection, generalAnswer.content].filter(Boolean).join('\n\n'),
      citation: bestSlide
        ? `Trang ${bestSlide.page}`
        : bestTranscript?.id ?? null,
      context
    };
  }

  const groundedAnswer = createOfflineAnswer(lesson, query);
  if (groundedAnswer.found) return groundedAnswer;

  return {
    found: false,
    sourceType: generalAnswer.requiresCurrentInformation
      ? 'requires_current_information'
      : 'unknown',
    content: generalAnswer.requiresCurrentInformation
      ? generalAnswer.content
      : 'Nội dung này không có trong slide và fallback offline chưa có kiến thức nền tương ứng. Hãy kiểm tra backend đang chạy và đã chọn provider Gemini ở góc trên; hệ thống sẽ gắn nhãn rõ và không tạo citation giả khi trả lời được.',
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
  const expansion = teachingExpansion(slide);
  return [
    '**Đoạn đang nói gì?**',
    `“${shorten(selected, 180)}” nằm trong ngữ cảnh: ${shorten(sentence, 260)}. [Trang ${slide.page}]`,
    '',
    '**Giải thích thêm**',
    `${expansion.note} [Trang ${slide.page}]`,
    '',
    '**Ví dụ minh họa (do hệ thống tạo)**',
    expansion.example
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

function mutateRelationship(text) {
  const replacements = [
    [/\bcao\b/i, 'thấp'],
    [/\bthấp\b/i, 'cao'],
    [/\btăng\b/i, 'giảm'],
    [/\bgiảm\b/i, 'tăng'],
    [/\bnhiều\b/i, 'ít'],
    [/\bít\b/i, 'nhiều'],
    [/\bđắt\b/i, 'rẻ'],
    [/\brẻ\b/i, 'đắt'],
    [/\btrước\b/i, 'sau'],
    [/\bđúng\b/i, 'sai']
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(text)) return text.replace(pattern, replacement);
  }
  return `Có thể đảo ngược quan hệ điều kiện–hệ quả của nhận định “${shorten(text, 120)}” mà kết luận vẫn giữ nguyên.`;
}

function conceptualOptions(slide, correctText, rotation) {
  const title = shorten(slide.title || `Trang ${slide.page}`, 80);
  const correct = shorten(correctText, 180);
  const distractors = [
    shorten(mutateRelationship(correct), 180),
    shorten(`“${title}” chỉ là quy tắc về cách trình bày; bối cảnh và hậu quả không ảnh hưởng tới kết luận.`, 180),
    shorten(`Có thể áp dụng “${title}” như một quy tắc tuyệt đối mà không cần kiểm tra điều kiện ở Trang ${slide.page}.`, 180)
  ];
  const values = distractors;
  const correctIndex = rotation % 4;
  values.splice(correctIndex, 0, correct);
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
  const seededQuestions = Array.isArray(lesson?.quizSeeds) ? lesson.quizSeeds : [];
  const mcqQuestions = seededQuestions.length
    ? seededQuestions.map(question => ({
        ...question,
        options: { ...question.options }
      }))
    : selectedSlides.map((slide, index) => {
        const sourceSnippet = extractBestSentence(slide.content);
        const optionSet = conceptualOptions(slide, sourceSnippet, index);
        return {
          id: index + 1,
          source_snippet: sourceSnippet,
          question: `Tình huống nào áp dụng đúng ý chính của “${slide.title}”?`,
          options: optionSet.options,
          correct_option: optionSet.correctOption,
          explanation: `Đáp án giữ đúng quan hệ điều kiện–kết quả được nêu ở Trang ${slide.page}; các lựa chọn còn lại đảo quan hệ, thu hẹp sai phạm vi hoặc tuyệt đối hóa kết luận.`,
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
    warning: !seededQuestions.length && selectedSlides.length < 7
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
    const optionValues = options
      ? ['A', 'B', 'C', 'D'].map(key => String(options[key] ?? '').trim())
      : [];
    const uniqueOptionValues = new Set(optionValues.map(normalizeText));
    if (
      !rawQuestion.question ||
      !options ||
      !['A', 'B', 'C', 'D'].every(key => typeof options[key] === 'string' && options[key].trim()) ||
      uniqueOptionValues.size !== 4 ||
      !['A', 'B', 'C', 'D'].includes(correctOption)
    ) {
      return null;
    }
    const rawTiers = rawQuestion.distractor_tiers && typeof rawQuestion.distractor_tiers === 'object'
      ? rawQuestion.distractor_tiers
      : {};
    const distractorTiers = Object.fromEntries(
      ['A', 'B', 'C', 'D']
        .filter(key => key !== correctOption)
        .map(key => [key, rawTiers[key] === 'near' ? 'near' : 'far'])
    );
    return {
      id: rawQuestion.id,
      source_snippet: String(rawQuestion.source_snippet),
      question: String(rawQuestion.question),
      options: Object.fromEntries(['A', 'B', 'C', 'D'].map(key => [key, String(options[key])])),
      correct_option: correctOption,
      distractor_tiers: distractorTiers,
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

export function validateSingleQuestion(rawQuestion, lesson) {
  return normalizeQuestion(rawQuestion, lesson, 'mcq');
}

function optionSimilarity(first, second) {
  const firstTokens = new Set(tokenize(first));
  const secondTokens = new Set(tokenize(second));
  if (!firstTokens.size || !secondTokens.size) return 0;
  const intersection = [...firstTokens].filter(token => secondTokens.has(token)).length;
  const union = new Set([...firstTokens, ...secondTokens]).size;
  return intersection / union;
}

function hasCrossQuestionOptionLeak(question, seenOptions) {
  return Object.values(question.options).some(option => {
    const normalized = normalizeText(option);
    return seenOptions.some(seen => {
      if (normalized === seen.normalized) return true;
      const minimumTokens = Math.min(tokenize(option).length, seen.tokens);
      return minimumTokens >= 6 && optionSimilarity(option, seen.text) >= 0.88;
    });
  });
}

export function validateQuizData(rawQuiz, lesson) {
  if (!rawQuiz || typeof rawQuiz !== 'object') {
    return { lesson_title: lesson?.title ?? 'Bài học', mcq_questions: [], essay_questions: [] };
  }

  const normalizedCandidates = (Array.isArray(rawQuiz.mcq_questions) ? rawQuiz.mcq_questions : [])
    .map(question => normalizeQuestion(question, lesson, 'mcq'))
    .filter(Boolean)
    .slice(0, 8);
  const seenOptions = [];
  const mcqQuestions = normalizedCandidates.filter(question => {
    if (hasCrossQuestionOptionLeak(question, seenOptions)) return false;
    for (const option of Object.values(question.options)) {
      seenOptions.push({
        text: option,
        normalized: normalizeText(option),
        tokens: tokenize(option).length
      });
    }
    return true;
  });
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
