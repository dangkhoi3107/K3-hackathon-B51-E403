# AI SPEC — VLearn Grounding Tutor & End-of-Session Quiz Agent · Nhóm G17 · Zone E403

Hướng: [x] A — VLearn  [ ] B — Trợ lý Học viên  [ ] C — Làn mở  
Loại: [x] Tính năng AI mới  [x] Tối ưu tính năng có sẵn

---

## §1. User & Job
- **Job executor + workflow:** Học viên khóa học AI Thực Chiến vừa kết thúc buổi học (hoặc vừa đọc xong 1 slide bài giảng) trên nền tảng VLearn.
- **Core JTBD:** Tự kiểm tra và đánh giá mức độ hiểu 80% kiến thức cốt lõi của buổi học trong 3 phút mà không bị ngợp bởi slide/video dài.
- **Problem statement:** Học viên rời buổi học không có công cụ tự kiểm tra nhanh mức độ tiếp thu, dẫn đến việc hổng kiến thức chỉ được phát hiện muộn khi làm bài tập/quiz nộp điểm, tốn 1-2 giờ tìm lại bài và dễ nản lòng.
- **Evidence:**
  - **Mining Data (Đường B):** Quét 1,261 turn chatlog VLearn (`data/vlearn-pack/chatlog/`): **46.2%** (582 turn) AI Tutor không có trích dẫn (`citations: []`); **85.2%** (1,074 turn) AI chỉ xả bức tường chữ lý thuyết suông; **99.8%** (1,258 turn) AI không bao giờ đặt câu hỏi kiểm tra lại mức độ hiểu của học viên.
  - **Khảo sát (Đường A):** Khảo sát 20 học viên trong lớp với log phản hồi nguyên văn ghi nhận nhu cầu có bộ Quiz tự luyện 3 phút cuối buổi.

---

## §2. Impact & Quyết Định Chọn
- **Bảng impact 3 ứng viên:**

| Ứng viên (Giải pháp) | Bao nhiêu người gặp | Tần suất | Tốn gì mỗi lần | Khả thi build |
|---|---|---|---|---|
| **1. VLearn Grounding Tutor & End-of-Session Quiz Agent** | **~1.000 học viên** | 1 lần / buổi học (5 buổi/tuần) | Tốn 60-90 phút mò lại slide/video khi hổng kiến thức | Rất cao |
| **2. AI Tutor Socratic Chat** | ~300 học viên chat | Hàng ngày | Tốn 5-10 phút đọc bức tường chữ | Cao |
| **3. Instructor Misconception Dashboard** | ~5 Giảng viên & TA | 1 lần / sau buổi | Tốn 1-2h đọc chatlog | Trung bình |

- **Ứng viên ĐÃ LOẠI + vì sao:** Loại 2 và 3 vì số lượng người thụ hưởng nhỏ hơn nhiều so với 1.000 học viên, đồng thời thiếu tính chủ động đánh giá kiến thức cuối buổi.
- **Ứng viên CHỌN + vì sao:** chọn **Ứng viên 1** vì tác động trực tiếp lên 1.000 học viên, bằng chứng dữ liệu rõ ràng (46.2% turn lỗi grounding, 85.2% turn xả chữ thụ động), build prototype 5h hoàn toàn khả thi.

---

## §3. Giải Pháp Tương Tự Đã Nghiên Cứu
- **Khanmigo (Khan Academy):** 
  - *Flow:* Đặt câu hỏi tương tác gợi ý từng bước (Socratic mode).
  - *Đáng học:* Không cho đáp án trực tiếp ngay mà bắt học viên suy nghĩ.
  - *Đáng né:* Dễ bị lan man dài dòng khi học viên cần câu trả lời nhanh.
  - *Mình khác gì:* Tập trung vào bài kiểm tra 3 phút cuối buổi (End-of-Session Quiz) kèm trích dẫn verified `[trang N]` chính xác từ slide của khóa học.
- **NotebookLM (Google):**
  - *Flow:* Tóm tắt và trích dẫn trực tiếp từng câu trả lời theo tài liệu nạp vào.
  - *Đáng học:* Luôn hiển thị nguồn trích dẫn đính kèm cạnh câu trả lời để người dùng tự đối chiếu.
  - *Đáng né:* Không có tính năng tự động tạo Quiz kiểm tra đánh giá mức độ hiểu của người dùng.
  - *Mình khác gì:* Kết hợp trích dẫn grounded kiểu NotebookLM với bộ Quiz 8-10 câu (7-8 trắc nghiệm + 1-2 tự luận chấm bằng Weighted Rubric).

---

## §4. Thiết Kế
- **Lát cắt MỘT CÂU:** *Một học viên mở bài giảng trên VLearn $\cdot$ chọn giải thích bôi đen / tóm tắt slide / hỏi đáp hoặc nhấn "Kiểm tra hiểu thật (Quiz 8-10 câu)" $\cdot$ AI Agent điều hướng xử lý chính xác và trả về kết quả kèm trích dẫn verified `[trang N]` + chấm tự luận tức thì $\cdot$ học viên nhận diện chính xác lỗ hổng kiến thức trong 5 phút.*
- **Non-goals (3 thứ KHÔNG build):**
  1. Không tạo bài quiz tính điểm chính thức cho môn học.
  2. Không làm hệ thống điểm danh tự động.
  3. Không thay thế kênh hỗ trợ TA trên Discord.
- **Mức prototype nhắm tới:** [x] Working (Web App độc lập `src/index.html` + `src/app.js` + adapter gọi OpenRouter/Gemini thật).
- **Automation:** [x] Augment / Conditional. *Lý do (Cost-of-Error):* Nếu AI tạo Quiz hoặc chấm tự luận sai, học viên hiểu sai kiến thức $\rightarrow$ đắt. Do đó AI tạo và chấm nhưng LUÔN dẫn nguồn `[trang N]` và `source_snippet` để học viên kiểm chứng.
- **§4b. Nguyên tắc đã áp dụng (HAX/PAIR):**
  | Nguyên tắc | Áp cụ thể vào đâu trong prototype |
  |---|---|
  | **HAX G2 (Hiệu năng hệ thống)** | Hiển thị thông báo phạm vi dữ liệu: *"Quiz được tự động sinh từ Slide & Transcript Buổi X"*. |
  | **HAX G9 (Sửa dễ dàng)** | Nút *"Xem lại trang trích dẫn"* và *"Thử lại câu tự luận"* trực tiếp dưới phản hồi. |
  | **HAX G10 (Thu hẹp khi nghi ngờ)** | Khi slide ít chữ, AI chủ động thông báo: *"Chuyển sang dùng transcript bài nói để bổ sung bối cảnh"*. |
  | **HAX G11 (Giải thích vì sao)** | Phản hồi trắc nghiệm và tự luận luôn đi kèm giải thích lý do đúng/sai và trích dẫn verified. |

---

## §5. Kiểu Lỗi — 4 Lớp Chỗ Khó & Kịch Bản Rủi Ro

| STT | Tình huống cụ thể | Lớp chỗ khó | Hành vi mong muốn | Nguyên tắc áp |
|---|---|---|---|---|
| 1 | AI bịa câu hỏi/giải thích hoặc trình bày kiến thức nền như thể nằm trong tài liệu. | ① Nguồn sự thật | Quiz vẫn áp dụng **Extract-then-Generate**. Q&A được phép trả lời rộng; UI tự gắn nhãn kiến thức ngoài slide và gỡ citation đặt sai vùng thay vì loại toàn bộ phản hồi hữu ích. | HAX G2, PAIR Trust |
| 2 | AI trích dẫn nhầm trang slide không tồn tại. | ① Nguồn sự thật | Quiz/summary vẫn kiểm tra nghiêm. Với Q&A, citation sai bị gỡ và phản hồi được phân loại lại thành **Kiến thức nền ngoài slide**, không còn hiển thị như nguồn bài giảng. | HAX G10, PAIR Error |
| 3 | Slide bài giảng chỉ có hình ảnh/sơ đồ, ít chữ. | ② Thiếu thông tin | Context Assembler tự động load `transcript/` bài nói bổ sung bối cảnh. | HAX G10 |
| 4 | Dữ liệu slide quá ít không đủ sinh 10 câu quiz. | ② Thiếu thông tin | Trả về số câu hỏi ít hơn (vd: 6 câu) thay vì bịa cho đủ 10 câu. | HAX G2, G10 |
| 5 | User nhập prompt đòi AI giải hộ bài lab/quiz nộp điểm. | ③ Ngoài phạm vi | Security Guardrail từ chối: *"Mình chỉ hỗ trợ kiểm tra tự luyện. Bạn hãy tự làm bài lab nộp nhé!"* | HAX G10, PAIR Boundary |
| 6 | User gõ Prompt Injection cố tình phá System Prompt. | ③ Ngoài phạm vi | Intent Router chặn ngay từ lớp Input Guardrail. | PAIR Security |
| 7 | AI dùng sai thuật ngữ chuyên ngành (nhầm ReAct và Routing). | ④ Đặc thù domain | Khống chế bằng Domain Guardrails định nghĩa chuẩn trong System Prompt. | HAX G2 |
| 8 | Provider AI bị timeout, hết quota hoặc key không hợp lệ khi đang sinh Quiz. | Lỗi hệ thống | Chỉ retry timeout/429/5xx; lỗi 4xx dừng ngay và chuyển fallback có căn cứ, đồng thời hiển thị provider/status trên badge. | PAIR Graceful Failure |

---

## §6. Bốn Đường Đi Của Trải Nghiệm
- **Happy path:** Học viên xem Slide Buổi 2 $\rightarrow$ Bấm "Kiểm tra hiểu thật" $\rightarrow$ Làm 7 MCQ + 1 Short Essay $\rightarrow$ Nhận kết quả chấm điểm + trích dẫn `[trang N]` chính xác trong 3 phút.
- **Low-confidence (②):** Slide ít chữ $\rightarrow$ AI hiển thị thông báo kết hợp transcript bài nói để sinh Quiz.
- **Failure / Không căn cứ (①):** Citation bị sai $\rightarrow$ Verifier phát hiện $\rightarrow$ tự động xóa trích dẫn sai và hiển thị *"Không tìm thấy trích dẫn phù hợp"*.
- **Correction (User sửa):** Học viên làm sai câu tự luận $\rightarrow$ đọc phản hồi gợi ý $\rightarrow$ bấm nút "Thử lại câu tự luận" để viết lại đáp án.
- **Ngoài phạm vi (③):** Học viên hỏi đáp án bài lab $\rightarrow$ Security Guardrail từ chối khéo.
- **Đặc thù domain (④):** Thuật ngữ luôn được kiểm chứng với từ điển khóa học.

---

## §7. Kiểm Thử
- **Chiều chất lượng:**
  1. *Độ chính xác trích dẫn:* 100% câu hỏi & giải thích có trích dẫn verified `[trang N]` đúng với tài liệu gốc.
  2. *Phân tách nguồn:* 0% kiến thức nền ngoài Slide/Transcript bị trình bày như nội dung của bài giảng; 100% phần mở rộng được gắn nhãn và không có citation trang giả.
  3. *An toàn thẩm quyền:* 100% yêu cầu giải hộ bài lab nộp điểm bị từ chối.
- **Golden set (20 case trong `eval/golden_set.json`):**
  - 10 case bài học thường (Day 1, Day 2).
  - 5 case "câu tự luận gần đúng nhưng thiếu ý cốt lõi" (Calibrate Weighted Rubric).
  - 5 case "adversarial" (Slide ít chữ/nhiều hình) kiểm tra tính an toàn không bịa câu hỏi.
- **Quality bar (Chốt từ 23:59):** *"Đạt khi $\ge 85\%$ case qua bộ kiểm thử Golden Set và 100% trích dẫn verified chính xác."*
- **Kết quả lượt deterministic offline (30/07/2026):** **20/20 case đạt (100%)** với retrieval, citation guard, fallback, quiz grounding, weighted rubric và input guardrail; chi tiết ở `eval/eval_results.json`. Kết quả này **không thay thế** lượt đánh giá model live qua OpenRouter/Gemini.

---

## §8. Phân Công & Kế Hoạch
- **Phân công:**
  - Thành viên 1: Evidence & Spec (`spec.md`, `validation/survey_log.csv`).
  - Thành viên 2: System Prompts & Golden Set (`src/prompts.js`, `eval/golden_set.json`).
  - Thành viên 3: Web Prototype & Logic Code (`src/index.html`, `src/styles.css`, `src/app.js`).
  - Thành viên 4: Validation & Slide Demo (`demo-slides.pdf`, `validation/user_feedback.md`).
- **Willing users ($\ge 3$ người):** Học viên lớp AI Thực Chiến đồng ý thử nghiệm trực tiếp trước demo.

---

## §9. Changelog
| Thời điểm | Đổi gì | Vì sao |
|---|---|---|
| 30/07/2026 11:30 | Thêm luồng Extract-then-Generate & Source Snippet Verifier | Chống bịa kiến thức tuyệt đối khi tạo Quiz |
| 30/07/2026 11:34 | Chuyển sang chiến lược Standalone Web App Prototype | Khắc phục rào cản không can thiệp backend VLearn thật |
| 30/07/2026 12:22 | Render trực tiếp trang PDF; thay fallback hard-code bằng retrieval theo lesson; siết citation/source verifier và rubric core | Khắc phục lỗi upload chỉ hiện text và agent trả lời sai/nhảy mặc định sang Trang 15; đối chiếu `eval/eval_results.json` |
| 30/07/2026 13:31 | Đổi MCQ sang câu tình huống với distractor theo ngộ nhận, cấm option lặp/lộ đáp án chéo; tách chatbot thành nguồn–diễn giải–ví dụ | Phản hồi demo cho thấy quiz có thể loại trừ đáp án từ câu trước và chatbot chép nguồn quá cứng; thêm 22 regression checks |
| 30/07/2026 13:45 | Chuyển Q&A sang chế độ hybrid: cho phép giải thích kiến thức nền ngoài slide với nhãn riêng, không citation giả; thêm glossary VLM/LLM/RAG/embedding/fine-tuning | Slide có thể dùng thuật ngữ như VLM mà không định nghĩa; học viên vẫn cần câu trả lời nền để hiểu nội dung |
| 30/07/2026 15:10 | Nới Q&A thành broad hybrid: prompt ưu tiên diễn giải/so sánh/ví dụ; citation sai được gỡ và phản hồi được hạ xuống kiến thức ngoài slide thay vì loại | Tránh chatbot trả lời cứng nhắc hoặc rơi về fallback khi model có nội dung hữu ích nhưng không tuân đúng khuôn citation |
