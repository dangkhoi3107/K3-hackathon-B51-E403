import { readFile } from 'node:fs/promises';
import { VLEARN_LESSONS } from '../codebase/src/data.js';
import {
  createHybridOfflineAnswer,
  createOfflineAnswer,
  createOfflineExplanation,
  createOfflineQuiz,
  createOfflineSummary,
  detectGuardrailViolation,
  evaluateEssayLocally,
  normalizeText,
  validateGroundedResponse,
  validateQuizData
} from '../codebase/src/grounding.mjs';

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

function containsAll(text, keywords = []) {
  const normalized = normalizeText(text);
  return keywords.every(keyword => normalized.includes(normalizeText(keyword)));
}

function evaluateCase(testCase) {
  const lesson = lessons.get(testCase.lesson_id);

  if (testCase.category === 'standard_grounded_qa') {
    const answer = createOfflineAnswer(lesson, testCase.input_query);
    const passed =
      answer.found &&
      answer.content.includes(`[${testCase.expected_page_citation}]`) &&
      containsAll(answer.content, testCase.expected_keywords);
    return { passed, observed: answer.content };
  }

  if (testCase.category === 'standard_summary') {
    const summary = createOfflineSummary(lesson);
    const citationCount = testCase.expected_citations_subset.filter(citation =>
      summary.content.includes(`[${citation}]`)
    ).length;
    const forbiddenFound = (testCase.forbidden_keywords ?? []).some(keyword =>
      normalizeText(summary.content).includes(normalizeText(keyword))
    );
    return {
      passed:
        summary.hasContent &&
        citationCount >= testCase.minimum_valid_citations &&
        !forbiddenFound,
      observed: `${citationCount} trích dẫn hợp lệ; forbidden=${forbiddenFound}`
    };
  }

  if (testCase.category === 'standard_explain_region') {
    const slide = lesson.slides.find(item => item.page === testCase.page);
    const explanation = createOfflineExplanation(slide, testCase.selected_text);
    return {
      passed:
        explanation.includes(`[${testCase.expected_page_citation}]`) &&
        containsAll(explanation, testCase.expected_keywords),
      observed: explanation
    };
  }

  if (testCase.category.startsWith('essay_calibration_')) {
    const evaluation = evaluateEssayLocally(essayRubric, testCase.student_answer);
    return {
      passed: evaluation.status === testCase.expected_status,
      observed: evaluation.status
    };
  }

  if (testCase.category === 'adversarial_sparse_slide') {
    const sparseLesson = {
      title: 'Sparse slide',
      slides: [{
        page: 33,
        title: 'Benchmark',
        content: 'Bảng điểm benchmark ban đầu ghi nhận mức 33%.'
      }],
      transcript: ''
    };
    const quiz = validateQuizData(createOfflineQuiz(sparseLesson), sparseLesson);
    return {
      passed: quiz.mcq_questions.length === 1,
      observed: `${quiz.mcq_questions.length} MCQ`
    };
  }

  if (testCase.category === 'adversarial_scan_only_pdf') {
    const scanLesson = {
      title: 'Scan PDF',
      slides: [{ page: 1, title: 'Trang 1', content: '' }],
      transcript: ''
    };
    const quiz = createOfflineQuiz(scanLesson);
    const summary = createOfflineSummary(scanLesson);
    return {
      passed: quiz.mcq_questions.length === 0 && !summary.hasContent,
      observed: `${quiz.mcq_questions.length} MCQ; summary=${summary.hasContent}`
    };
  }

  if (testCase.category === 'external_knowledge_definition') {
    const answer = createHybridOfflineAnswer(lesson, testCase.input_query);
    return {
      passed:
        answer.found &&
        answer.content.includes(`**${testCase.required_label}**`) &&
        containsAll(answer.content, testCase.expected_keywords) &&
        !/\[Trang \d+\]/.test(answer.content),
      observed: answer.content
    };
  }

  if (testCase.category === 'invalid_citation') {
    const validation = validateGroundedResponse(testCase.candidate_response, lesson);
    return { passed: !validation.isValid, observed: validation.reason };
  }

  if (
    testCase.category === 'out_of_scope_assessment' ||
    testCase.category === 'prompt_injection'
  ) {
    const guardrail = detectGuardrailViolation(testCase.input_query);
    return { passed: guardrail.blocked, observed: guardrail.reason };
  }

  return { passed: false, observed: 'Chưa có evaluator cho category này.' };
}

const results = goldenSet.map(testCase => {
  const evaluation = evaluateCase(testCase);
  return {
    id: testCase.id,
    category: testCase.category,
    passed: evaluation.passed,
    observed: evaluation.observed
  };
});
const passed = results.filter(result => result.passed).length;
const report = {
  evaluator: 'deterministic-offline-grounding-v1',
  scope: 'Provider adapter, retrieval, citation cleanup/downgrade, offline fallback, quiz grounding, rubric và guardrail; không đại diện cho chất lượng model live.',
  total: results.length,
  passed,
  failed: results.length - passed,
  pass_rate: Number(((passed / results.length) * 100).toFixed(1)),
  results
};

console.log(JSON.stringify(report, null, 2));
export default report;
