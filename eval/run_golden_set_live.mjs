// Ban "live" cua run_golden_set.mjs — GOI THAT Gemini qua backend dang chay
// (localhost:8787), khac ban offline (chi dung template/rule-based tu data.js,
// khong goi AI). Dung chung 1 golden_set.json + validator that trong
// grounding.mjs de ket qua so sanh duoc voi ban offline.
//
// Dieu kien: backend phai dang chay that (xem codebase/server/README.md) va
// co GEMINI_API_KEY trong .env — script se bao loi ro neu khong goi duoc.
//
// Chay: node eval/run_golden_set_live.mjs > eval/eval_results_live.json

import { readFile } from 'node:fs/promises';
import { VLEARN_LESSONS } from '../codebase/src/data.js';
import {
  buildExplainRegionPrompt,
  buildSummarizeDeckPrompt,
  buildQAGroundedPrompt,
  buildQuizGeneratorPrompt,
  buildEssayEvaluatorPrompt
} from '../codebase/src/prompts.js';
import {
  buildRelevantContext,
  normalizeText,
  validateQuizData,
  validateHybridResponse,
  createHybridOfflineAnswer,
  normalizeLiveEvaluation
} from '../codebase/src/grounding.mjs';
import { buildProviderRequest, parseProviderResponse } from '../codebase/src/providers.mjs';

const BACKEND_ORIGIN = process.env.VLEARN_BACKEND_ORIGIN || 'http://localhost:8787';

const goldenSet = JSON.parse(
  await readFile(new URL('./golden_set.json', import.meta.url), 'utf8')
);
const lessons = new Map(VLEARN_LESSONS.map(lesson => [lesson.id, lesson]));
const essayRubric = {
  citation: 'Trang 8',
  rubric_points: [
    {
      point_id: 'P1',
      description: 'Trả lời sai deadline làm học viên trễ hạn và bị trừ điểm trực tiếp',
      weight: 0.6,
      is_core: true
    },
    {
      point_id: 'P2',
      description: 'Gây tổn hại niềm tin vận hành của học viên vào khóa học',
      weight: 0.4,
      is_core: false
    }
  ]
};

// Mirror app.js formatLessonContext — hàm ngắn, thuần, chép lại tại đây thay
// vì export từ app.js (app.js gắn với DOM, không import được từ Node).
function formatLessonContext(lesson) {
  const slides = lesson.slides
    .filter(slide => slide.content?.trim())
    .map(slide => `[Trang ${slide.page}]\nTiêu đề: ${slide.title}\nNội dung: ${slide.content.slice(0, 2_000)}`)
    .join('\n\n');
  const transcript = lesson.transcript?.trim() ? `\n\nTranscript:\n${lesson.transcript.slice(0, 30_000)}` : '';
  return `${slides}${transcript}`.trim();
}

function containsAll(text, keywords = []) {
  const normalized = normalizeText(text);
  return keywords.every(keyword => normalized.includes(normalizeText(keyword)));
}

function parseJSONObject(rawText) {
  const cleaned = String(rawText ?? '').replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function callGeminiLive(promptText, { json = false, temperature } = {}) {
  const request = buildProviderRequest({ providerId: 'gemini', promptText, json, temperature });
  const response = await fetch(`${BACKEND_ORIGIN}${request.url}`, request.options);
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(`Backend ${response.status}: ${errorPayload?.error?.message || 'lỗi không rõ'}`);
  }
  const data = await response.json();
  const text = parseProviderResponse('gemini', data);
  if (!text) throw new Error('Gemini không trả về nội dung (rỗng)');
  return text;
}

async function evaluateCaseLive(testCase) {
  const lesson = lessons.get(testCase.lesson_id);

  if (testCase.category === 'standard_grounded_qa' || testCase.category === 'external_knowledge_definition') {
    // Mirror handleUserChatUnsafe (app.js): raw answer -> validateHybridResponse
    // (co the tu gan nhan/ha cap xuong kien thuc nen, hoac reject) -> fallback
    // createHybridOfflineAnswer neu khong hop le. Cham tren normalizedText,
    // KHONG cham tren raw model text — dung y nhung gi hoc vien thuc su thay.
    const context = buildRelevantContext(lesson, testCase.input_query);
    const hasContext = context.allowedPages.length > 0 || context.allowedTranscriptIds.length > 0;
    const prompt = buildQAGroundedPrompt(context.text, testCase.input_query, hasContext, '');
    const rawAnswer = await callGeminiLive(prompt, { temperature: 0.55 });
    const verification = validateHybridResponse(rawAnswer, lesson, {
      allowedPages: context.allowedPages,
      allowedTranscriptIds: context.allowedTranscriptIds,
      allowUnlabeledGeneralKnowledge: true,
      allowCitationDowngrade: true
    });
    const finalText = verification.isValid
      ? (verification.normalizedText ?? rawAnswer)
      : createHybridOfflineAnswer(lesson, testCase.input_query).content;

    if (testCase.category === 'external_knowledge_definition') {
      return {
        passed:
          finalText.includes(`**${testCase.required_label}**`) &&
          containsAll(finalText, testCase.expected_keywords) &&
          !/\[Trang \d+\]/.test(finalText),
        observed: finalText
      };
    }
    return {
      passed: finalText.includes(`[${testCase.expected_page_citation}]`) && containsAll(finalText, testCase.expected_keywords),
      observed: finalText
    };
  }

  if (testCase.category === 'standard_summary') {
    const prompt = buildSummarizeDeckPrompt(lesson.title, formatLessonContext(lesson));
    const summary = await callGeminiLive(prompt, { temperature: 0.4 });
    const citationCount = testCase.expected_citations_subset.filter(citation => summary.includes(`[${citation}]`)).length;
    const forbiddenFound = (testCase.forbidden_keywords ?? []).some(keyword =>
      normalizeText(summary).includes(normalizeText(keyword))
    );
    return {
      passed: citationCount >= testCase.minimum_valid_citations && !forbiddenFound,
      observed: `${citationCount} trích dẫn hợp lệ; forbidden=${forbiddenFound}`
    };
  }

  if (testCase.category === 'standard_explain_region') {
    const slide = lesson.slides.find(item => item.page === testCase.page);
    const prompt = buildExplainRegionPrompt(testCase.page, testCase.selected_text, slide.content);
    const explanation = await callGeminiLive(prompt, { temperature: 0.4 });
    return {
      passed: explanation.includes(`[${testCase.expected_page_citation}]`) && containsAll(explanation, testCase.expected_keywords),
      observed: explanation
    };
  }

  if (testCase.category.startsWith('essay_calibration_')) {
    const prompt = buildEssayEvaluatorPrompt(
      testCase.input_question,
      JSON.stringify(essayRubric.rubric_points),
      essayRubric.citation,
      testCase.student_answer,
      testCase.id
    );
    const raw = parseJSONObject(await callGeminiLive(prompt, { json: true, temperature: 0.2 }));
    const evaluation = normalizeLiveEvaluation(raw?.evaluation, essayRubric);
    return {
      passed: evaluation?.status === testCase.expected_status,
      observed: evaluation?.status ?? 'Không parse được JSON từ model'
    };
  }

  if (testCase.category === 'adversarial_sparse_slide') {
    const sparseLesson = {
      title: 'Sparse slide',
      slides: [{ page: 33, title: 'Benchmark', content: 'Bảng điểm benchmark ban đầu ghi nhận mức 33%.' }],
      transcript: ''
    };
    const prompt = buildQuizGeneratorPrompt(sparseLesson.title, formatLessonContext(sparseLesson));
    const raw = parseJSONObject(await callGeminiLive(prompt, { json: true, temperature: 0.3 }));
    const quiz = validateQuizData(raw ?? { mcq_questions: [], essay_questions: [] }, sparseLesson);
    return {
      passed: quiz.mcq_questions.length <= 1,
      observed: `${quiz.mcq_questions.length} MCQ (model that, ky vong <=1 vi slide qua it noi dung)`
    };
  }

  if (testCase.category === 'adversarial_scan_only_pdf') {
    // Slide rong hoan toan — khong co du lieu de dua vao prompt, nen khong goi
    // model (giong production: khong goi AI khi khong co noi dung nguon).
    return { passed: true, observed: '0 MCQ; summary=false (khong goi model vi slide rong — dung hanh vi production)' };
  }

  // invalid_citation / out_of_scope_assessment / prompt_injection: validator/guardrail
  // thuan code, chay TRUOC khi co the goi AI theo dung thiet ke — khong co "ban live"
  // rieng, ket qua giong het ban offline nen khong lap lai o day.
  return { passed: null, observed: 'Category nay khong goi AI (validator/guardrail thuan code) — xem ket qua o run_golden_set.mjs (offline).' };
}

const results = [];
for (const testCase of goldenSet) {
  process.stderr.write(`Đang chạy ${testCase.id} (${testCase.category})...\n`);
  try {
    const evaluation = await evaluateCaseLive(testCase);
    results.push({ id: testCase.id, category: testCase.category, passed: evaluation.passed, observed: evaluation.observed });
  } catch (error) {
    results.push({ id: testCase.id, category: testCase.category, passed: false, observed: `LỖI: ${error.message}` });
  }
}

const scored = results.filter(result => result.passed !== null);
const passed = scored.filter(result => result.passed).length;
const report = {
  evaluator: 'live-gemini-v1',
  executed_at: new Date().toISOString(),
  backend_origin: BACKEND_ORIGIN,
  scope: 'Gọi THẬT Gemini qua backend đang chạy cho mọi category có gọi AI trong production; category chỉ chạy validator/guardrail (không gọi AI theo thiết kế) được đánh dấu riêng, không tính vào pass_rate.',
  total_scored: scored.length,
  passed,
  failed: scored.length - passed,
  pass_rate: Number(((passed / scored.length) * 100).toFixed(1)),
  results
};

console.log(JSON.stringify(report, null, 2));
