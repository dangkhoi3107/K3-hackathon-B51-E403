# Kiến trúc Agent — VLearn Practice Coach (`codebase/src/`)

Tài liệu này liệt kê toàn bộ function trong `codebase/src/` và đánh dấu cái nào là
**quyết định AI thật** (agent) so với **if-else/rule-based**, kèm workflow.

## Chú thích ký hiệu

| Ký hiệu | Ý nghĩa |
|---|---|
| 🤖 | Gọi AI thật (`callLLMAPI` → Gemini/OpenRouter) — kết quả không đoán trước được |
| ⚙️ | Rule-based / tất định — if-else, so khớp, đếm, regex, không có AI |
| 🖼️ | UI/DOM — render, wiring sự kiện, không phải một "quyết định" |
| 🔌 | Transport — xây/parse HTTP request, không tự quyết định nội dung |

---

## 1. `app.js` — bộ điều phối chính (agent controller)

| Function | Dòng | Loại | Ghi chú |
|---|---|---|---|
| `initApp` | 107 | 🖼️ | Khởi tạo app |
| `populateLessonSelector` | 115 | 🖼️ | Render dropdown bài học |
| `currentLesson` / `currentSlide` | 127/131 | ⚙️ | Getter state |
| `renderCurrentSlide` | 135 | 🖼️ | Render slide hiện tại |
| `cancelPDFRender` / `renderPDFPage` | 165/176 | 🖼️ | Vẽ trang PDF qua pdf.js |
| `updateQuickQuestion` | 228 | ⚙️ | Regex tìm từ "augment" để gợi ý câu hỏi nhanh |
| `setupEventListeners` | 238 | 🖼️ | Gắn toàn bộ event listener |
| `handleTextSelection` / `hideHighlightTooltip` | 377/405 | 🖼️ | Hiện/ẩn tooltip khi bôi đen |
| `navigateToPage` | 409 | 🖼️ | Nhảy tới trang khi bấm citation/"Xem lại Trang" |
| `setupUploadHandlers` / `isPDFFile` | 416/449 | 🖼️/⚙️ | Xử lý upload PDF |
| `extractPageText` | 453 | ⚙️ | Trích text-layer có sẵn trong PDF (**không phải OCR ảnh thật**) |
| `handlePDFUpload` | 471 | 🖼️ | Đọc toàn bộ PDF qua pdf.js |
| `renderUploadSuccess` / `renderDefaultUploadZone` / `removeUploadedLessons` / `removeUploadedLesson` / `showUploadError` | 563–621 | 🖼️ | UI khung upload |
| `switchTab` | 630 | 🖼️ | Chuyển tab Chat/Quiz |
| `escapeHTML` / `renderSafeMarkdown` | 638/647 | ⚙️ | Escape HTML + markdown-lite bằng regex |
| `appendMessage` | 658 | 🖼️ | Thêm bong bóng chat |
| `setAgentMode` | 682 | 🖼️ | Badge "Gemini live / offline / lỗi" |
| `activeProviderId` / `activeProvider` / `updateProviderReadiness` / `syncProviderControls` | 687–704 | ⚙️/🖼️ | Quản lý provider đang chọn |
| `delay` | 713 | ⚙️ | Chờ giữa các lần retry |
| **`callLLMAPI`** | 717 | 🔌 | **Cổng duy nhất gọi AI thật** — gọi `/api/llm/generate` trên backend cục bộ (mục 5), không còn gọi thẳng Gemini/OpenRouter từ trình duyệt |
| `callGeminiAgentTurn` | — | 🔌 | Gọi `/api/llm/agent-turn` trên backend — 1 vòng của agent function-calling |
| `checkBackendHealth` / `updateProviderReadiness` / `syncProviderControls` | — | 🖼️ | Badge trạng thái dựa trên backend có sống hay không (`/api/health`), không còn dựa trên "có apiKey hay chưa" |
| `searchSlidesViaBackend` | — | 🔌 | Gọi `/api/embed/search` trên backend — nhận lại top-k trang đã xếp hạng theo vector, không tự tính vector trong trình duyệt nữa |
| `logInteraction` / `logQuizResult` / `getSessionId` | — | 🔌 | Fire-and-forget ghi log lên `/api/logs/*` (backend), phục vụ `eval/`/`validation/` — không phải quyết định AI |
| `parseJSONObject` | 779 | ⚙️ | Parse JSON từ text AI trả về |
| `formatLessonContext` | 794 | ⚙️ | Ghép context gửi AI (không phải quyết định) |
| **`handleExplainRegion`** | 807 | 🤖 | Giải thích đoạn bôi đen |
| `handleRegionSelected` | 837 | ⚙️ | Cắt vùng ảnh đã khoanh thành canvas (toán học, không phải quyết định) |
| **`handleVisionRegionQuestion`** | 867 | 🤖 | Gửi ảnh cho Gemini Vision đọc hiểu |
| **`handleSummarizeDeck`** | 896 | 🤖 | Tóm tắt slide |
| **`handleUserChat`** | 920 | 🤖 | Hỏi đáp tự do (có guardrail + retrieval rule-based bên trong, xem bên dưới) |
| **`handleGenerateQuiz`** | 965 | 🤖 | Sinh quiz batch 8–10 câu |
| `renderQuizUI` | 1007 | 🖼️ | Render danh sách câu hỏi batch |
| `handleMCQAnswer` | 1087 | ⚙️ | Chấm trắc nghiệm batch (so chuỗi) |
| **`handleEvaluateEssay`** | 1119 | 🤖 | Chấm tự luận theo rubric trọng số |
| `renderEssayEvaluation` / `resetQuizView` | 1148/1160 | 🖼️ | UI |
| `eligibleAdaptiveSlides` | 1175 | ⚙️ | Lọc slide đủ text để hỏi |
| `sortSlidesByInterest` | 1180 | ⚙️ | **Đếm + sắp xếp** chủ đề theo lịch sử đã hỏi — rule-based |
| `buildInterestNote` | 1192 | ⚙️ | Format lại lịch sử hỏi thành text đưa vào prompt |
| `startAdaptiveSession` / `askNextAdaptiveQuestion` | 1199/1226 | ⚙️ | Điều phối vòng lặp (đếm câu, kiểm tra trần) |
| **`generateAdaptiveQuestion`** | 1258 | 🤖 | **Quyết định AI trung tâm**: sinh 1 câu + tự gắn nhãn near/far |
| `nextOfflineAdaptiveQuestion` | 1275 | ⚙️ | Câu hỏi dự phòng khi offline (rule-based, không adaptive thật) |
| `renderAdaptiveQuestion` | 1288 | 🖼️ | Render câu hỏi |
| `handleAdaptiveAnswer` | 1334 | ⚙️ | Chấm đúng/sai + tra tier + chọn nhánh tiếp theo — **toàn bộ if-else** |
| **`showMisconceptionHint`** | 1384 | 🤖 | Chẩn đoán ngộ nhận + gợi ý bám đúng lỗi sai |
| `showAdaptiveContinueActions` / `advanceAdaptiveSlide` / `finishAdaptiveSession` | 1410–1452 | 🖼️/⚙️ | UI + chuyển trạng thái phiên |

## 2. `grounding.mjs` — lớp an toàn/rule-based (0% AI)

Toàn bộ **~40 function** trong file này đều là ⚙️ rule-based — không có dòng nào gọi
`callLLMAPI`. Vai trò: retrieval từ-khoá (`retrieveRelevantSlides`, `buildRelevantContext`,
`formatRetrievedContext`, `scoreText`, `tokenize`...), verify câu trả lời AI có căn cứ hay không
(`validateGroundedResponse`, `validateHybridResponse`, `verifyCitationAndSnippet`,
`validateSingleQuestion`, `validateQuizData`), guardrail
(`detectGuardrailViolation` — regex, không phải AI router), và fallback khi
offline/AI trả lời không đạt (`createOfflineAnswer`, `createOfflineExplanation`,
`createOfflineSummary`, `createOfflineQuiz`, `evaluateEssayLocally`).

`formatRetrievedContext` được tách riêng khỏi `buildRelevantContext` để cả retrieval
từ-khoá (trong file này) lẫn kết quả vector search trả về từ backend (mục 5) đều
dùng chung đúng 1 cách format context, không chép lại logic.

**Lịch sử:** bản trước có `src/vectorstore.mjs` (kho vector tính trong trình duyệt,
cache bằng `localStorage`). File đó đã bị xoá — toàn bộ logic vector (tính embedding,
cache, xếp hạng cosine similarity) chuyển hẳn sang backend (`server/vectorstore.py`,
xem mục 5) khi team quyết định thêm BE thật. `app.js` giờ chỉ gọi 1 API
(`searchSlidesViaBackend`, mục 1) và nhận lại top-k trang đã xếp hạng sẵn.

## 3. `prompts.js` — nội dung giao cho AI (không tự gọi AI)

| Function | Dùng cho quyết định |
|---|---|
| `buildExplainRegionPrompt` | `handleExplainRegion` |
| `buildSummarizeDeckPrompt` | `handleSummarizeDeck` |
| `buildQAGroundedPrompt` | `handleUserChat` |
| `buildQuizGeneratorPrompt` | `handleGenerateQuiz` (batch) |
| `buildAdaptiveQuestionPrompt` | `generateAdaptiveQuestion` (có yêu cầu gắn `distractor_tiers`) |
| `buildMisconceptionHintPrompt` | `showMisconceptionHint` |
| `buildVisionRegionPrompt` | `handleVisionRegionQuestion` |
| `buildEssayEvaluatorPrompt` | `handleEvaluateEssay` |
| `buildReActAgentSystemPrompt` / `REACT_AGENT_TOOLS` | `runReActChat` — system instruction + khai báo 6 tool cho agent function-calling (chỉ Gemini) |
| `SYSTEM_ROUTER_PROMPT` | ⚠️ **Không được dùng ở đâu cả** — dead code, xem ghi chú cuối file |

### 6 tool hiện có của agent (`REACT_AGENT_TOOLS`)

| Tool | Executor trong `app.js` | Việc |
|---|---|---|
| `search_lesson_content` | `executeSearchLessonContent` | Tìm đoạn liên quan theo từ khoá — vector search thật (mục 5), rơi về từ khoá nếu lỗi |
| `get_page_content` | `executeGetPageContent` | Lấy nguyên nội dung 1 trang theo số, để đọc trong chat |
| `summarize_lesson` | `executeSummarizeLesson` | Tóm tắt cả bài |
| `start_adaptive_quiz` | `executeStartAdaptiveQuiz` | Hành động: chuyển tab Quiz + bắt đầu phiên tự kiểm tra thích ứng (hỏi từng câu) |
| `generate_quiz_batch` | `executeGenerateQuizBatch` | Hành động: chuyển tab Quiz + tạo ngay bộ quiz đầy đủ 8-10 câu (khác `start_adaptive_quiz` ở chỗ ra cả bộ cùng lúc, không hỏi tuần tự) |
| `navigate_to_page` | `executeNavigateToPage` | Hành động: đổi màn hình slide đang hiển thị sang đúng 1 trang — khác `get_page_content` (chỉ trả nội dung để đọc, không đổi màn hình) |

## 4. `providers.mjs` — transport phía client (không phải quyết định, không còn giữ key)

`getProviderConfig`, `buildProviderRequest`, `buildGeminiAgentRequest`,
`parseProviderResponse`, `parseGeminiAgentResponse`, `isRetryableProviderStatus`.

**Đổi so với bản trước:** `buildProviderRequest`/`buildGeminiAgentRequest` không còn
build URL gọi thẳng Gemini/OpenRouter kèm `apiKey` — giờ build request tới backend
cục bộ (`/api/llm/generate`, `/api/llm/agent-turn`, xem mục 5). Backend trả nguyên
payload gốc của provider nên `parseProviderResponse`/`parseGeminiAgentResponse` ở
client không cần đổi gì. `buildGeminiEmbedRequest`/`parseGeminiEmbedResponse` (bản
trước) đã bị xoá khỏi client — embedding giờ hoàn toàn phía backend.

## 5. `codebase/server/` — backend Python (FastAPI), giữ API key + vector DB + log

⚙️/🔌 — không có quyết định AI mới ở đây; đây là nơi **giấu key** và **transport**
thay cho việc trước đây chạy thẳng trong trình duyệt. Chạy local lúc demo
(`codebase/server/README.md`), phục vụ `codebase/src/` làm static site tại `/`.

| File | Vai trò |
|---|---|
| `config.py` | Đọc `.env` gốc repo (`GEMINI_API_KEY`, `OPENROUTER_API_KEY`...) |
| `db.py` | SQLite: bảng `slide_vectors` (cache vector dùng chung), `interaction_log`, `quiz_results` |
| `providers.py` | 🔌 Port của `providers.mjs` phía server — build & **gọi thật** Gemini/OpenRouter (key chỉ ở đây), 1 lần/lượt, không tự retry (client giữ vòng lặp retry) |
| `vectorstore.py` | ⚙️ Port của `vectorstore.mjs` cũ — `cosine_similarity`, `rank_slides_by_vector`, `fingerprint_slides` (cache key theo nội dung slide) |
| `routers/llm.py` | `/api/llm/generate`, `/api/llm/agent-turn` — proxy 1-lượt và agent function-calling |
| `routers/embed.py` | `/api/embed/search` — cache-or-embed rồi rank; luôn trả 200, `used_vector=false` khi lỗi để client tự rơi về từ-khoá |
| `routers/logs.py` | `/api/logs/interaction`, `/api/logs/quiz-result`, `/api/logs/export` — phục vụ `eval/`/`validation/` |
| `main.py` | Mount router + serve `codebase/src/` static, `/api/health` |

---

## Workflow tổng quan

```mermaid
flowchart TD
    subgraph Entry["Hành động của học viên"]
        H[Bôi đen text]
        D[Vẽ khung ảnh]
        S[Bấm Tóm tắt]
        C[Gửi câu hỏi Chat]
        B[Khởi tạo Quiz 8-10 câu]
        A[Bắt đầu Tự kiểm tra]
        E[Gửi câu tự luận]
    end

    H --> ExplainH["🤖 handleExplainRegion"]
    D --> RegionH["⚙️ handleRegionSelected (crop)"] --> VisionH["🤖 handleVisionRegionQuestion"]
    S --> SumH["🤖 handleSummarizeDeck"]
    C --> Guard{"⚙️ detectGuardrailViolation"}
    Guard -->|chặn| Refuse["⚙️ Từ chối, không gọi AI"]
    Guard -->|qua| Retrieve["⚙️ buildRelevantContext (retrieval)"] --> ChatH["🤖 handleUserChat"]
    B --> BatchH["🤖 handleGenerateQuiz"]
    A --> AdaptiveLoop["🤖⚙️ vòng lặp Adaptive (xem sơ đồ 2)"]
    E --> EssayH["🤖 handleEvaluateEssay"]

    ExplainH & SumH & ChatH & BatchH & VisionH & EssayH --> LLM["callLLMAPI 🔌"]
    LLM --> Providers["providers.mjs 🔌 → /api/llm/*"]
    Providers --> Backend["server/ 🔌 giữ key, gọi thật Gemini / OpenRouter"]
    Backend --> Valid{"⚙️ grounding.mjs: có căn cứ + đúng schema?"}
    Valid -->|đạt| ShowAI["Hiển thị câu trả lời AI"]
    Valid -->|không đạt / lỗi / offline| Fallback["⚙️ createOffline* (rule-based)"]
```

## Workflow chi tiết — Adaptive Quiz (lát cắt chính, đang được chấm)

```mermaid
flowchart TD
    Start(["Bấm Bắt đầu tự kiểm tra"]) --> Sort["⚙️ sortSlidesByInterest\n(ưu tiên trang đã hỏi trong Chat/bôi đen/khoanh vùng)"]
    Sort --> Gen["🤖 generateAdaptiveQuestion\nsinh 1 câu + tự gắn near/far cho 3 đáp án nhiễu"]
    Gen --> Show["Hiển thị câu hỏi"]
    Show --> Ans["Học viên chọn đáp án"]
    Ans --> Check{"⚙️ so khớp correct_option"}
    Check -->|đúng| Pass["⚙️ Hiểu đúng"]
    Check -->|sai| Tier{"⚙️ tra distractor_tiers"}
    Tier -->|near| Partial["⚙️ Hiểu một phần"]
    Tier -->|far| Wrong["⚙️ Chưa đúng"]
    Partial --> Hint["🤖 showMisconceptionHint\nchẩn đoán lỗi + gợi ý, không lộ đáp án"]
    Wrong --> Hint
    Hint --> Cap{"⚙️ còn lượt? (tối đa 2/chủ đề)"}
    Cap -->|còn, near| RetrySame["⚙️ hỏi lại — cùng mức độ"]
    Cap -->|còn, far| RetryEasy["⚙️ hỏi lại — dễ hơn"]
    Cap -->|hết| Advance
    Pass --> Advance["⚙️ advanceAdaptiveSlide"]
    RetrySame --> Gen
    RetryEasy --> Gen
    Advance --> More{"⚙️ còn chủ đề? < 6 câu/phiên?"}
    More -->|còn| Gen
    More -->|hết| Finish(["finishAdaptiveSession — tổng kết"])
```

## Workflow chi tiết — Vẽ khung hỏi ảnh (Vision)

```mermaid
flowchart TD
    Draw["Vẽ khung trên PDF"] --> CheckPDF{"⚙️ Có phải PDF upload thật?"}
    CheckPDF -->|không| Warn1["⚙️ Cảnh báo: cần PDF thật"]
    CheckPDF -->|có| Crop["⚙️ Cắt canvas thành ảnh (toán học tọa độ)"]
    Crop --> CheckProvider{"⚙️ Provider = Gemini?"}
    CheckProvider -->|không| Warn2["⚙️ Yêu cầu đổi sang Gemini"]
    CheckProvider -->|có| Vision["🤖 Gemini Vision đọc trực tiếp nội dung ảnh"]
    Vision --> ShowV["Hiển thị mô tả + trích dẫn [Trang N]"]
    ShowV --> Log["⚙️ Ghi vào interactionLog\n(dùng để ưu tiên chủ đề Adaptive sau này)"]
```

---

## Ghi chú: `SYSTEM_ROUTER_PROMPT` là dead code

`implementation_plan.md` mô tả một "Security & Intent Router Agent" dùng AI để
phân loại ý định (EXPLAIN_REGION/SUMMARIZE_DECK/ASK_QUESTION/GENERATE_QUIZ/
OUT_OF_SCOPE). Prompt cho việc này (`SYSTEM_ROUTER_PROMPT`) đã được viết trong
`prompts.js` nhưng **không được import hay gọi ở bất kỳ đâu trong `app.js`**.
Trên thực tế, việc "route" hoàn toàn do người dùng bấm đúng nút/tab (rule-based),
và chặn câu ngoài phạm vi chỉ dựa vào regex (`detectGuardrailViolation`) — không
có AI nào phân loại intent. Cần sửa `implementation_plan.md`/`spec.md` cho khớp
thực tế, hoặc nối `SYSTEM_ROUTER_PROMPT` vào code nếu muốn giữ đúng lời khai.
