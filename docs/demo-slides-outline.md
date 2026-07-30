# Khung nội dung demo-slides.pdf (6 trang, theo `02-guide.md` §5.1)

> **Đây là bản nháp nội dung (markdown), KHÔNG PHẢI file nộp.** Trung cần
> chuyển nội dung này thành 1 file trình chiếu thật (Google Slides / PowerPoint
> / Canva...), rồi **xuất ra PDF đặt tên đúng `demo-slides.pdf` ở gốc repo**.
> Số liệu đánh dấu **[CẦN ĐIỀN]** là chỗ cần dữ liệu thật chưa có sẵn (chủ yếu
> phụ thuộc `validation/feedback_log.md` — xem `validation/README.md` để biết
> ai đang phụ trách phần đó) hoặc cần quyết định lúc dry-run (chọn case demo cụ
> thể). Mọi số liệu khác lấy nguyên từ `spec.md` đã chốt — không tự đổi.

---

## Trang 1 — User & Job *(45 giây)*

- **Job executor:** Học viên khoá "AI Thực Chiến" vừa kết thúc buổi học (hoặc
  vừa đọc xong 1 slide bài giảng) trên nền tảng VLearn.
- **Core JTBD (1 câu, không nhắc tên sản phẩm/AI):** Tự kiểm tra và xác nhận
  mức độ hiểu 80% kiến thức cốt lõi của buổi học trong 3 phút, mà không bị
  ngợp bởi slide/video dài.
- **Con số pain (mining chatlog thật, `data/vlearn-pack/chatlog/`, n = 1.261 turn):**
  - **46,2%** (582 turn) AI Tutor trả lời không có trích dẫn.
  - **85,2%** (1.074 turn) AI chỉ xả "bức tường chữ" lý thuyết suông.
  - **99,8%** (1.258 turn) AI không bao giờ chủ động hỏi lại để kiểm tra mức
    độ hiểu của học viên.
- **Khảo sát (Đường A):** 20 học viên trong lớp — ghi nhận nhu cầu có bộ Quiz
  tự luyện 3 phút cuối buổi.

*Tránh: trình bày persona chung chung — bám đúng con số trên, không thêm mô tả nhân vật hư cấu.*

---

## Trang 2 — Vì sao chọn tính năng này *(45 giây)*

| Ứng viên | Bao nhiêu người | Tần suất | Tốn gì mỗi lần | Khả thi |
|---|---|---|---|---|
| **1. VLearn Grounding Tutor & End-of-Session Quiz Agent (ĐÃ CHỌN)** | ~1.000 học viên | 1 lần/buổi (5 buổi/tuần) | 60-90 phút mò lại slide/video khi hổng kiến thức | Rất cao |
| 2. AI Tutor Socratic Chat | ~300 học viên chat | Hàng ngày | 5-10 phút đọc bức tường chữ | Cao |
| 3. Instructor Misconception Dashboard | ~5 giảng viên & TA | 1 lần/sau buổi | 1-2h đọc chatlog | Trung bình |

- **Loại ứng viên 2 & 3 — 1 dòng lý do:** số người thụ hưởng nhỏ hơn nhiều so
  với 1.000 học viên, và thiếu tính chủ động đánh giá kiến thức ngay cuối buổi.
- **Chọn ứng viên 1 — bằng số:** tác động trực tiếp 1.000 học viên, bằng chứng
  rõ (46,2% turn lỗi grounding), build prototype trong thời gian hackathon khả thi.

---

## Trang 3 — Giải pháp & demo live *(2 phút)*

- **Lát cắt MỘT CÂU:** Một học viên mở bài giảng trên VLearn → chọn giải thích
  bôi đen / tóm tắt slide / hỏi đáp (kể cả gửi ảnh) hoặc nhấn "Kiểm tra hiểu
  thật" → AI Agent tự chọn công cụ phù hợp và trả lời kèm trích dẫn verified
  `[Trang N]` + chấm tự luận tức thì → học viên nhận diện đúng lỗ hổng kiến
  thức trong 5 phút.
- **Automation — cost-of-error (1 dòng):** Augment/Conditional, không Automate
  toàn phần — vì nếu AI tạo quiz/chấm sai, học viên sẽ tự học sai kiến thức
  ngay lúc họ đang tin tưởng nhất → chọn cách luôn kèm trích dẫn để học viên tự
  kiểm chứng thay vì AI toàn quyền quyết định.
- **Demo trực tiếp — 2 case (không giấu case lỗi):**
  1. **Case chuẩn [CẦN ĐIỀN — chọn lúc dry-run]:** ví dụ hỏi 1 câu bám đúng
     slide → trả lời có trích dẫn `[Trang N]` chính xác → bấm "Quiz trang này"
     → trả lời đúng.
  2. **Case chỗ khó [CẦN ĐIỀN — chọn lúc dry-run]:** gợi ý dùng 1 trong các
     case guardrail/low-confidence đã có sẵn trong `spec.md` §5-§6, ví dụ: hỏi
     đáp án bài lab (guardrail từ chối khéo) hoặc trang chỉ có hình ảnh/ít chữ
     (AI tự chuyển sang dùng transcript bổ sung bối cảnh thay vì bịa).

---

## Trang 4 — Kết quả đo *(45 giây)*

- **Quality bar đã chốt (từ `spec.md` §7, 23:59 N1):** "Đạt khi ≥85% case qua
  Golden Set và 100% trích dẫn verified chính xác."
- **Kết quả lượt deterministic offline:** 20/20 case (100%) — retrieval,
  citation guard, fallback, quiz grounding, weighted rubric, input guardrail;
  không gọi AI thật (`eval/eval_results.json`).
- **Kết quả lượt live qua Gemini thật:** **15/17 case đạt (88,2%)** — gọi thật
  Gemini qua backend đang chạy (`eval/run_golden_set_live.mjs` →
  `eval/eval_results_live.json`); đạt quality bar ≥85%. *(Sơn nên chạy lại
  script này 1-2 lần trước CP6 để lấy số ổn định nhất — LLM không tất định nên
  % có thể dao động nhẹ giữa các lượt — và cập nhật số ở đây nếu đổi.)*
- **1 failure đáng kể nhất:** TC05 (câu hỏi về kỹ thuật Five Whys) — model trả
  lời đúng nội dung, đúng trích dẫn `[Trang 4]`, nhưng diễn giải nguyên nhân
  gốc bằng cụm "nguyên nhân gốc rễ" thay vì đúng cụm từ khoá golden set yêu
  cầu ("nguyên nhân thật") — lỗi ở cách chấm khớp cụm từ quá cứng nhắc trước
  văn phong tự nhiên của model thật, **không phải** model bịa nội dung hay
  trích dẫn sai. Chi tiết: `spec.md` §7.

---

## Trang 5 — User thật nói gì *(45 giây)*

- **[CẦN ĐIỀN — phụ thuộc `validation/feedback_log.md`]** ≥2 quote nguyên văn
  từ vòng validation (kèm tên/vai người thử) — copy trực tiếp từ cột "Quote
  nguyên văn" trong `validation/feedback_log.md` sau khi Đăng Đức log đủ ≥5 mẩu.
- **[CẦN ĐIỀN]** 1 thay đổi cụ thể đã làm từ feedback đó — lấy từ dòng tương
  ứng đã thêm vào `spec.md` §9 Changelog.

*Tránh: chỉ trích lời khen chung chung ("dễ dùng", "ổn") — ưu tiên quote có chỗ
cụ thể (khó chịu ở đâu, tin hay không tin kết quả, có dùng thật không).*

---

## Trang 6 — Nếu có thêm 1 tuần *(30 giây)*

- **[CẦN ĐIỀN — nên trỏ về feedback/failure chưa xử lý]** gợi ý 2-3 việc dựa
  trên các phần đã biết còn thiếu, ví dụ (chọn/thay theo tình hình thật lúc đó):
  1. Bôi đen chọn chữ trực tiếp trên ảnh slide (cần text-layer pdf.js) — đã
     xác định rõ nhưng cố tình hoãn để ưu tiên tính năng agent trước.
  2. Mục "backlog" từ dòng tổng hợp cuối `validation/feedback_log.md`.
  3. 1 mục lấy từ case fail thật ở Trang 4 (nếu có).
- **1 dòng bài học lớn nhất [CẦN ĐIỀN]:** đúc kết từ chính quá trình build —
  ví dụ hướng về nguyên tắc "không có bằng chứng thì không có slide/quiz" đã
  xuyên suốt cả prototype.

---

## Ghi chú cho Trung khi chuyển sang slide thật

- Giữ đúng thời lượng ghi trong ngoặc () ở mỗi trang — tổng 5 phút trình bày.
- Case demo Trang 3 nên **thật sự bấm trên app đang chạy** (`localhost:8787`),
  không dùng screenshot/video trừ khi live hỏng — theo đúng luật §5.1.
- Mỗi thành viên phải nói được ≥1 phần trong demo round — phân công ai nói
  trang nào nên chốt trước dry-run.
