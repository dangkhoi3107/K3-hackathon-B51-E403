# Implementation Plan — Kiến Trúc & Kế Hoạch AI Agent VLearn (Grounding Tutor & End-of-Session Quiz Agent)

> **Hướng chọn:** Hướng A — VLearn (Tính năng AI mới & Tối ưu AI Tutor)  
> **Dự án:** Khoá học AI Thực Chiến  
> **Lát cắt:** Một học viên mở bài giảng trên VLearn $\rightarrow$ chọn giải thích khoanh vùng / tóm tắt slide / hỏi đáp hoặc bấm nút "Kiểm tra hiểu thật (Quiz 8-10 câu)" $\rightarrow$ AI Agent điều hướng xử lý chính xác và trả về kết quả kèm trích dẫn `[trang N]` + chấm tự luận tức thì $\rightarrow$ học viên nhận diện lỗ hổng kiến thức trong 5 phút.

---

## §1. Kiến Trúc Chi Tiết Hệ Thống (Detailed System Architecture)

### 1. Sơ đồ luồng hoạt động (Data & Agent Flow Architecture)

```
[ Học Viên (VLearn UI) ]
       │
       ├── (1) Bôi đen / Chọn đoạn Slide  ───► [ Security & Intent Router Agent ]
       ├── (2) Yêu cầu Tóm tắt Slide       ───┤ (Guardrail Filter Prompt Injection)
       ├── (3) Hỏi đáp thắc mắc (Q&A)       ───┤        │
       └── (4) Bấm "Kiểm tra hiểu thật"    ───┘        ▼
                                           ┌──────────────────────────────────────────────┐
                                           │               VLEARN AGENT CORE              │
                                           └──────────────────────┬───────────────────────┘
                                                                  │
                 ┌──────────────────────┬─────────────────────────┼────────────────────────┐
                 ▼                      ▼                         ▼                        ▼
     ┌──────────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌──────────────────────────┐
     │ Explain Region Tool  │ │ Summarize Deck    │ │ Grounded Q&A      │ │ Quiz Generator Agent     │
     │ (Giải thích đoạn)    │ │ (Tóm tắt slide)   │ │ (Hỏi đáp grounding│ │ (Extract-then-Generate)  │
     └──────────┬───────────┘ └─────────┬─────────┘ └─────────┬─────────┘ └────────────┬─────────────┘
                │                       │                         │                        │
                └───────────────────────┴────────────┬────────────┴────────────────────────┘
                                                     ▼
                                        ┌──────────────────────────┐
                                        │ Context Assembler        │
                                        │ - Lookup by page_num     │
                                        │ - Load 1M Context Window │
                                        └────────────┬─────────────┘
                                                     ▼
                                        ┌──────────────────────────┐
                                        │ Provider Adapter         │
                                        │ OpenRouter / Gemini      │
                                        └────────────┬─────────────┘
                                                     ▼
                                        ┌──────────────────────────┐
                                        │ (a) Structured Output &  │
                                        │     Citation Parser      │
                                        └────────────┬─────────────┘
                                                     ▼
                                        ┌──────────────────────────┐
                                        │ (b) Source Snippet &     │
                                        │     Citation Verifier    │
                                        │     (Fuzzy Content Match)│
                                        └────────────┬─────────────┘
                                                     │
                                      (Passed / Fallback Notification)
                                                     ▼
                                        [ Render Phản Hồi VLearn ]
```

---

### 2. Các thành phần chính của Kiến trúc (Core Components)

1. **VLearn Web UI (Client Layer)**:
   - **Slide Viewer Component**: Hiển thị slide PDF, hỗ trợ học viên bôi đen văn bản hoặc chọn vùng khoanh vùng (`page_num`, `selected_text`).
   - **Interactive Chat & Tutor Bar**: Cửa sổ chat AI đồng hành hỗ trợ giải thích, tóm tắt và đặt câu hỏi.
   - **End-of-Session Quiz Modal**: Giao diện thực thi bộ Quiz 8-10 câu cuối buổi (7-8 câu trắc nghiệm MCQ + 1-2 câu tự luận).

2. **Security & Intent Router Agent (Security Guardrail Layer)**:
   - Nhận yêu cầu từ người dùng, quét kiểm tra an toàn (chống Prompt Injection, Jailbreak).
   - Tự động phân loại intent:
     - `EXPLAIN_REGION`: Học viên khoanh vùng / bôi đen tài liệu.
     - `SUMMARIZE_DECK`: Yêu cầu tóm tắt toàn bộ bài giảng.
     - `ASK_QUESTION`: Hỏi đáp kiến thức tổng quát.
     - `GENERATE_QUIZ`: Yêu cầu kiểm tra hiểu thật cuối buổi.
     - `EVALUATE_ESSAY`: Nhận câu trả lời tự luận của học viên để chấm điểm.

3. **Bộ Tool Chuyên Hóa & Tầng Resilience (Specialized Agent Tools & Resilience Layer)**:
   - **Tool 1: `explain_region_tool`**: Nhận `selected_text` + `page_num` $\rightarrow$ truy vấn ngữ cảnh trang $\rightarrow$ giải thích cô đọng 2-3 câu kèm trích dẫn `[trang N]`.
   - **Tool 2: `summarize_deck_tool`**: Đọc toàn bộ nội dung slide/transcript $\rightarrow$ trích xuất 5 Key Takeaways + Bản đồ khái niệm cốt lõi (Concept Map) + Trích dẫn trang quan trọng.
   - **Tool 3: `qa_grounded_tool` (Broad Hybrid Knowledge Mode)**: Dùng `transcript/` và `slides/` làm điểm xuất phát nhưng cho phép model giải thích rộng bằng kiến thức nền, so sánh, ứng dụng và ví dụ. Citation hợp lệ được giữ; citation sai bị gỡ và nội dung được tự phân loại thành **“Kiến thức nền ngoài slide”** thay vì loại toàn bộ phản hồi. **Tầng Guardrail An Toàn:** Input Guard vẫn chặn yêu cầu làm hộ bài nộp, prompt injection và hành vi nguy hiểm.
   - **Tool 4: `quiz_generator_tool` (Quy trình 2 bước Chống Bịa Kiến Thức - Extract-then-Generate)**:
     - **Bước 1 — Extract (Trích xuất trước):** Model chỉ được phép trích xuất nguyên văn (hoặc gần nguyên văn) các đoạn/khái niệm/công thức/số liệu CÓ THẬT từ slide+transcript của `day_code` đó, kèm `page_num` nguồn — KHÔNG được diễn giải hay tổng hợp ở bước này.
     - **Bước 2 — Generate (Sinh câu hỏi từ trích xuất):** Model chỉ dùng các đoạn đã trích xuất ở Bước 1 làm nguyên liệu để soạn câu hỏi, đáp án, giải thích. Mọi câu hỏi PHẢI map ngược được về đúng 1 đoạn `source_snippet` trích xuất cụ thể — nếu không map được về đoạn nào, loại câu hỏi đó khỏi bộ quiz thay vì giữ lại.
     - **Tầng Resilience (Xử lý sự cố API):** Adapter hỗ trợ OpenRouter/Gemini, retry tự động 2 lần với timeout/429/5xx; lỗi key/quyền 4xx dừng ngay. Nếu vẫn thất bại, hệ thống tự động fallback về tập Quiz rút gọn.
   - **Tool 5: `quiz_evaluator_tool`**: Đánh giá câu trả lời tự luận của học viên dựa trên Rubric có phân bổ trọng số (weighted rubric) $\rightarrow$ chấm điểm (PASSED / PASSED_WITH_FEEDBACK / FAILED) + chỉ rõ ý còn thiếu kèm `[trang N]` trong slide.

4. **Context Assembler Layer (Thay thế RAG cho bài toán 1 buổi học)**:
   - Vì phạm vi dữ liệu hiện tại là 1 buổi học (vài chục trang slide + transcript), không dùng embedding vector DB rườm rà.
   - **Cơ chế nạp ngữ cảnh:** 
     - Với `explain_region_tool`: Truy vấn lọc trực tiếp theo `page_num` (Structured Lookup).
     - Với `summarize_deck_tool`, `qa_grounded_tool`, `quiz_generator_tool`: Load văn bản Slide + Transcript sạch của `day_code` vào context của model đang chọn qua Provider Adapter.
   - *Lưu ý nâng cấp:* Nếu sản phẩm mở rộng scale lên toàn bộ khóa học nhiều buổi học (Multi-session Catalog), mô-đun Vector Search / Embedding Database sẽ được cắm vào tầng này mà không làm thay đổi luồng xử lý của các Tool bên trên.

5. **Tầng Kiểm Tra Trích Dẫn & Source Snippet Validation 2 Bước (Verification Guard)**:
   - **Bước (a) Structured Output & Citation Parser**: Trích xuất format `[trang N]`, `source_snippet` nguyên văn và định dạng JSON đáp án.
   - **Bước (b) Source Snippet & Citation Verifier (Automated Matcher)**: Hệ thống chạy thuật toán so khớp chuỗi (Fuzzy Match / String Similarity threshold 0.6) giữa đoạn `source_snippet` khai báo và nội dung văn bản thực tế của tài liệu gốc theo `page_num`.
   - **Hành vi Validation & Fallback:** Nếu `source_snippet` hoặc trang `N` không tìm thấy (hoặc match score < 0.6) trong tài liệu gốc $\rightarrow$ Hệ thống tự động loại bỏ câu hỏi bịa đó khỏi bộ quiz và log lại để review, KHÔNG hiển thị câu hỏi chưa được xác thực cho học viên.

---

## §2. Chi Tiết Các Tính Năng Demo Cốt Lõi (Demo Core Features)

### 📌 Tính năng 1: Giải thích Slide được Khoanh vùng / Bôi đen
* **Mục tiêu:** Giúp học viên hiểu ngay một đoạn thuật ngữ/công thức/sơ đồ khó mà không cần đọc lại cả slide.
* **Input:** `page_num`, `selected_text` (đoạn bôi đen).
* **Output:** Giải thích ngắn gọn (tối đa 3 gạch đầu dòng) + Trích dẫn trang slide `[trang N]` (Đã qua Citation Verifier).

### 📌 Tính năng 2: Tóm tắt Nội dung Toàn bộ Slide
* **Mục tiêu:** Giúp học viên xem lại bài nhanh trước khi làm bài tập hoặc ôn tập cuối khóa.
* **Input:** `day_code` (ví dụ: Day 2 - Xác định bài toán AI).
* **Output:** 3 Mục tiêu bài học cốt lõi + 5 Key Takeaways + Bản đồ trang slide quan trọng.

### 📌 Tính năng 3: Hỏi đáp Trả lời Thắc mắc (Grounded Q&A Tutor + Guardrail)
* **Mục tiêu:** Giải đáp câu hỏi từ bài giảng có trích dẫn, đồng thời cung cấp kiến thức nền cần thiết để hiểu thuật ngữ slide chưa định nghĩa; hai lớp thông tin phải được phân tách rõ và chống prompt injection.
* **Input:** Câu hỏi tự do của học viên.
* **Output:** Câu trả lời tự nhiên 2-5 đoạn, ưu tiên giải thích bằng lời của model và ví dụ cụ thể. Khi có nội dung từ bài giảng, citation verified được giữ; phần mở rộng được UI tự gắn nhãn và không mang citation trang. Nếu vượt thẩm quyền hoặc đòi giải hộ bài lab nộp điểm $\rightarrow$ Guardrail chặn lại.

### 📌 Tính năng 4 (TÍNH NĂNG MỚI NÒNG CỐT): Kiểm Tra Hiểu Thật Cuối Buổi (End-of-Session Quiz Agent)
* **Mục tiêu:** Đánh giá chính xác mức độ nắm bài của học viên ngay khi vừa học xong dựa trên nguyên tắc **Extract-then-Generate**.
* **Cấu trúc bộ Quiz tĩnh (8–10 câu)**:
  1. **7–8 Câu Trắc Nghiệm 4 Đáp Án (MCQ A/B/C/D)**:
     - 4 câu kiểm tra Nhận biết / Thông hiểu khái niệm.
     - 3–4 câu tình huống thực tế (Vận dụng).
     - Mỗi câu đều có đáp án đúng, giải thích nguyên nhân, trích dẫn verified `[trang N]` và đoạn `source_snippet` gốc.
  2. **1–2 Câu Hỏi Tự Luận Viết Đáp Án (Short Essay Question)**:
     - Ví dụ: *"Giả sử bạn cần xây dựng trợ lý tra cứu deadline khóa học, bạn sẽ chọn mức Automation nào (Augment, Conditional, hay Automate) và vì sao?"*
     - **AI Evaluator Agent** dựa trên Weighted Rubric phân tích câu trả lời $\rightarrow$ Chấm điểm (PASSED / PASSED_WITH_FEEDBACK / FAILED) + Nêu rõ ý đúng, ý cốt lõi còn thiếu và gợi ý slide cần đọc lại `[trang N]`.

---

## §3. Đánh Giá 5 Tiêu Chí Nghiệm Thu (Rubric Alignment)

### 1. Pain cụ thể (Ai — làm gì — vướng đâu — hậu quả)
* **Ai:** Học viên vừa học xong 1 buổi học trên VLearn.
* **Đang làm gì:** Muốn biết mình đã nắm chắc bài chưa và cần công cụ giải đáp thắc mắc tức thì.
* **Vướng đâu:** Học viên không có cách nào tự đánh giá mức độ hiểu thật; AI tutor cũ xả bức tường chữ thụ động và hay báo "không tìm thấy trang".
* **Hậu quả:** Ảo tưởng đã hiểu bài, khi làm bài lab/quiz nộp điểm thì bị stuck, mất nhiều thời gian tìm lại kiến thức hoặc bị điểm kém.

### 2. Bằng chứng (Evidence Standard)
* **Mining Data (Đường B):** **46.2%** (582/1,261 turn) AI Tutor thiếu trích dẫn (`citations: []`); **85.2%** (1,074 turn) AI chỉ xả lý thuyết suông; **99.8%** AI không bao giờ đặt câu hỏi kiểm tra học viên.
* **Khảo sát (Đường A):** Kế hoạch khảo sát $\ge 20$ học viên về nhu cầu có bộ Quiz tự luyện 3-5 phút cuối buổi để kiểm tra lỗ hổng kiến thức.

### 3. Problem Statement & Bảng Impact
* **Problem Statement:** Học viên kết thúc buổi học không có công cụ tương tác tức thì để giải thích bối cảnh, tóm tắt và kiểm tra hiểu thật, dẫn đến việc hổng kiến thức chỉ phát hiện khi làm bài nộp.
* **Bảng Impact:**

| Ứng viên (Bài toán) | Bao nhiêu người gặp | Tần suất | Tốn gì mỗi lần | Quyết định |
|---|---|---|---|---|
| **1. VLearn AI Agent Multi-Feature & End-of-Session Quiz Agent** | **~1.000 học viên** | 1 lần / buổi học | 60-90 phút mò lại bài khi hổng kiến thức | **CHỌN** (Giải quyết trọn vẹn trải nghiệm học & đánh giá) |
| **2. AI Tutor chỉ trả lời chat đơn thuần** | ~300 học viên hỏi chat | Hàng ngày | 5-10 phút đọc bức tường chữ | **LOẠI** (Thiếu tính chủ động đánh giá) |
| **3. TA Discord Assistant** | ~200 học viên hỏi Discord | Thỉnh thoảng | 15-30 phút chờ TA trả lời | **LOẠI** (Nằm ở Hướng B) |

### 4. Lát cắt MỘT CÂU
> **Một học viên mở bài giảng trên VLearn** $\cdot$ **chọn giải thích bôi đen / tóm tắt slide / hỏi đáp hoặc nhấn "Kiểm tra hiểu thật (Quiz 8-10 câu)"** $\cdot$ **AI Agent điều hướng xử lý chính xác và trả về kết quả kèm trích dẫn verified `[trang N]` + chấm tự luận tức thì** $\cdot$ **học viên nhận diện chính xác lỗ hổng kiến thức trong 5 phút.**

### 5. User sẵn sàng thử
Thử nghiệm prototype trực tiếp với $\ge 3$ học viên thật trong lớp trước buổi demo.

---

## §4. Phân Tích 4 Lớp Chỗ Khó (Taxonomy Risk Scenarios)

| # | Lớp chỗ khó | Rủi ro cụ thể | Hành vi AI mong muốn & Cơ chế Bảo vệ Hệ thống |
|---|---|---|---|
| 1 | **① Nguồn sự thật** | AI tự bịa câu hỏi/giải thích hoặc trích dẫn nhầm số trang (Citation & Concept Hallucination). | 100% câu hỏi PHẢI được sinh từ một đoạn `source_snippet` trích xuất thật từ tài liệu (**Extract-then-Generate**), được validate tự động với văn bản gốc trước khi hiển thị — không chỉ gắn citation sau khi sinh. |
| 2 | **② Mơ hồ / Thiếu thông tin** | Slide ít chữ (chỉ có sơ đồ) làm AI không đủ dữ liệu tạo Quiz/Giải thích. | Context Assembler tự động load bổ sung thông tin từ `transcript/` bài giảng nói vào Context Window. Nếu vẫn thiếu dữ liệu, AI trả về số lượng câu hỏi ít hơn (vd: 6 câu) thay vì ép đủ 10 câu bằng cách bịa. |
| 3 | **③ Ngoài phạm vi** | Học viên cố tình gõ Prompt Injection / đòi AI giải hộ bài Quiz/Lab nộp điểm. | Tầng **Security Guardrail Layer** chặn ngay lập tức ở input/output: *"Mình chỉ hỗ trợ kiểm tra kiến thức tự luyện. Bạn hãy tự làm bài quiz nộp điểm nhé!"* |
| 4 | **④ Đặc thù Domain** | AI dùng sai hoặc nhầm lẫn thuật ngữ chuyên ngành AI trong khóa học. | Khống chế bằng System Prompt & Domain Guardrails định nghĩa sẵn các khái niệm cốt lõi. |

---

## §5. Thiết Kế Mức Automation & HAX/PAIR

* **Mức Automation:** **Augment / Conditional**
  * *Lý do (Cost-of-Error):* Nếu AI chấm tự luận sai hoặc tạo đáp án trắc nghiệm sai, học viên hiểu sai kiến thức $\rightarrow$ đắt. AI tạo Quiz và chấm điểm nhưng LUÔN dẫn nguồn verified `[trang N]` để học viên tự đối chiếu (Augment).
* **Nguyên tắc HAX/PAIR:**
  * **G2 (Làm rõ nó làm tốt đến đâu):** Hiển thị rõ phạm vi câu hỏi được tạo từ Slide & Transcript buổi học.
  * **G9 (Sửa dễ dàng):** Cho phép học viên bấm *"Xem lại trang trích dẫn"* hoặc *"Thử lại câu tự luận"*.
  * **G10 (Thu hẹp phạm vi khi nghi ngờ):** Khi không chắc chắn bối cảnh, AI đưa ra gợi ý ngắn thay vì chấm đoán.
  * **G11 (Giải thích vì sao):** Kết quả MCQ và câu hỏi tự luận đều có lời giải thích nguyên nhân ngắn gọn.

---

## §6. Cấu Trúc Dữ Liệu JSON Schema Cho Quiz & Evaluation (Đã Siết Trọng Số Rubric & Source Snippet)

### 1. JSON Schema sinh bộ Quiz 8-10 câu (`quiz_generator_tool` output với Extract-then-Generate)

```json
{
  "lesson_title": "Day 2 - Xác định bài toán AI",
  "mcq_questions": [
    {
      "id": 1,
      "source_snippet": "Augment: AI gợi ý, người quyết định. Sai thì đắt (kiến thức sai đến học viên, điểm số). Phù hợp khi sai sót đắt.",
      "question": "Khi nào nên chọn mức Automation là Augment thay vì Automate hoàn toàn?",
      "options": {
        "A": "Khi chi phí sửa lỗi (Cost of Error) thấp",
        "B": "Khi chi phí sửa lỗi rất cao và cần con người duyệt cuối cùng",
        "C": "Khi hệ thống không có GPU",
        "D": "Khi bài toán chỉ có 1 bước đơn giản"
      },
      "correct_option": "B",
      "explanation": "Augment phù hợp khi sai sót đắt, AI gợi ý và con người đưa ra quyết định cuối.",
      "citation": "Trang 15"
    }
  ],
  "essay_questions": [
    {
      "id": 8,
      "source_snippet": "Trợ lý trả lời câu hỏi logistics (deadline, link, nộp bài)... trả lời sai deadline gây hậu quả trực tiếp cho học viên.",
      "question": "Phân tích vì sao bài toán Trợ lý Học viên Discord trả lời sai deadline lại gây hậu quả nghiêm trọng?",
      "rubric_points": [
        {
          "point_id": "P1",
          "description": "Trả lời sai làm học viên nộp trễ và bị trừ điểm học tập trực tiếp",
          "weight": 0.5,
          "is_core": true
        },
        {
          "point_id": "P2",
          "description": "Gây mất niềm tin nghiêm trọng của học viên vào hệ thống vận hành khóa học",
          "weight": 0.3,
          "is_core": true
        },
        {
          "point_id": "P3",
          "description": "Dẫn đến việc nảy sinh câu hỏi khiếu nại lặp đi lặp lại kênh TA",
          "weight": 0.2,
          "is_core": false
        }
      ],
      "citation": "Trang 8"
    }
  ]
}
```

### 2. JSON Schema chấm câu tự luận (`quiz_evaluator_tool` output với Weighted Score)

```json
{
  "question_id": 8,
  "student_answer": "Vì học viên sẽ bị nộp muộn và bị trừ điểm bài tập.",
  "evaluation": {
    "status": "PASSED_WITH_FEEDBACK",
    "weighted_score": 0.5,
    "total_possible_score": 1.0,
    "matched_point_ids": ["P1"],
    "missing_point_ids": ["P2", "P3"],
    "feedback_comment": "Bạn đã nắm đúng ý cốt lõi P1 (trễ hạn và trừ điểm). Tuy nhiên, bạn thiếu ý cốt lõi P2 về ảnh hưởng niềm tin vận hành (nêu ở trang 8).",
    "citation": "Trang 8"
  }
}
```

---

## §7. Kế Hoạch Prototype & Phân Công

### 0. Chiến Lược Triển Khai Prototype (Decoupled Prototype Strategy)
> **Bối cảnh thực tế:** Nhóm không có quyền can thiệp vào codebase production backend của VLearn. Theo đề bài [01-de-bai.md](file:///d:/AI_in_action/DAY05_G17_E403/01-de-bai.md#L30), nhóm chỉ cần build **Prototype (Sketch / Mock / Working)** độc lập có $\ge 1$ lời gọi AI chạy thật.

**Giải pháp khắc phục:**
1. **Dựng Web Prototype Độc Lập (Standalone App - Khuyên dùng):**
   - Xây dựng một giao diện Web HTML/JS (`src/index.html` + `src/app.js`) mô phỏng 100% màn hình học tập của VLearn.
   - Nhóm tự tích hợp Agent Core Controller & Prompt Router (`src/prompts.js`) qua `src/providers.mjs`, hỗ trợ API Key **OpenRouter hoặc Gemini** và model do người dùng chọn.
   - Sử dụng bộ dữ liệu slide PDF & transcript sạch trong `data/vlearn-pack/` làm tài liệu bối cảnh.
2. **Tùy chọn nâng cao (Chrome Extension Injection - Nếu kịp):**
   - Viết một Chrome Extension nhỏ inject nút *"Kiểm tra hiểu thật"* trực tiếp vào trang VLearn thật, khi bấm sẽ mở Widget Sidebar kết nối tới API Agent riêng của nhóm.

### 1. UI Prototype Layout (`src/index.html`)
- **Cột Trái (60%)**: Slide Viewer PDF (Cho phép bôi đen đoạn văn bản / Chọn trang).
- **Cột Phải (40%)**: 
  - Tab 1: **AI Tutor Chat** (Giải thích khoanh vùng / Hỏi đáp / Tóm tắt slide).
  - Tab 2: **Kiểm Tra Hiểu Thật (End-of-Session Quiz View)** (Hiển thị 7-8 câu MCQ + 1-2 câu Tự luận có ô gõ text & nút "Chấm điểm AI").

### 2. Phân công công việc

| Thành viên | Phối hợp | Nhiệm vụ chính | Deliverables |
|---|---|---|---|
| **Thành viên 1** | Spec & Evidence | Viết file `spec.md` + Thực hiện khảo sát 20 học viên | `spec.md`, `validation/survey_log.csv` |
| **Thành viên 2** | System Prompt & System Architecture | Thiết kế Prompt Router, Extract-then-Generate Quiz Prompt & Evaluator Prompt; **Xây dựng `eval/golden_set.json` (bắt buộc chứa 3-5 test case "câu trả lời gần đúng nhưng thiếu ý cốt lõi" để calibrate tự luận + bắt buộc chứa ít nhất 5 test case "adversarial" với slide ít chữ/nhiều sơ đồ để kiểm tra model có tự bịa câu hỏi hay an toàn trả về ít câu hỏi hơn)** | `src/prompts.js`, `eval/golden_set.json` |
| **Thành viên 3** | Frontend & Resilience API | Dựng UI VLearn Agent + Tích hợp Source Snippet Matcher & Citation Verifier (Fuzzy Match) & Layer Retry/Fallback API | `src/index.html`, `src/app.js` |
| **Thành viên 4** | Validation & Slide Demo | Thử nghiệm 3 willing users + Soạn Slide 6 trang | `demo-slides.pdf`, `validation/user_feedback.md` |

---

## §8. File Structure Chuẩn Trong Repository

```
DAY05_G17_E403/
├── 01-de-bai.md
├── 02-guide.md
├── 03-template-ai-spec.md
├── 04-rubric.md
├── implementation_plan.md      <-- Kế hoạch kiến trúc chống bịa kiến thức (Extract-then-Generate)
├── spec.md                     <-- Spec chính thức chốt trước 23:59
├── eval/
│   ├── golden_set.json         <-- 20 Test Cases (gồm 3-5 cases calibrate tự luận + 5 cases adversarial)
│   └── eval_results.json
├── src/
│   ├── index.html              <-- Giao diện VLearn Agent & End-of-Session Quiz View
│   ├── styles.css              <-- CSS giao diện hiện đại
│   ├── prompts.js              <-- System Prompts cho Router, Extract-then-Generate Quiz & Weighted Evaluator
│   └── app.js                 <-- Logic xử lý Agent, Source Snippet Verifier & Resilience API
├── validation/
│   └── user_feedback.md        <-- Phản hồi thử nghiệm từ 3+ học viên
└── demo-slides.pdf             <-- Slide nộp CP6
```
