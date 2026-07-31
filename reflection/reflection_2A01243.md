# Reflection — Phạm Nguyễn Đăng Khôi (2A202601243)

Nhóm B51 · Zone 6 · VLearn Practice Coach

---

## 1. Vai trò

Leader của nhóm, đồng thời trực tiếp build hai phần kỹ thuật:

- **Quiz/Self-check Agent** (`codebase/quiz-agent/`) — agent Python gọi Gemini để
  sinh 3 câu hỏi trắc nghiệm tự kiểm tra bám đúng một trang tài liệu, từ chối
  nếu nội dung không đủ căn cứ thay vì bịa câu hỏi.
- **Q&A vùng ảnh (vision region)** — mở rộng `src/app.js` và `src/grounding.mjs`
  để học viên bôi đen một vùng ảnh trên slide và được AI giải thích có căn cứ.

Ngoài ra tôi phụ trách điều phối: chốt Canvas CP1, rà lại phân công ở CP3 (đối
chiếu với `git log` để bảng phân công phản ánh đúng ai đã làm gì, tránh tình
trạng ghi tên người này vào việc người khác làm).

---

## 2. Phần mình đã làm

- Viết `quiz_agent.py`: schema JSON bắt buộc (`status`, `questions`, mỗi câu
  phải có `quote` trích nguyên văn + `explanation` bám câu chữ), system prompt
  cấm suy diễn ngoài đoạn tài liệu được cấp, và cố tình **không fallback bằng
  câu hỏi bịa** khi Gemini lỗi — vì cost-of-error ở đây là học sai kiến thức
  ngay lúc học viên đang tin tưởng nhất.
- Viết `adaptive_demo.py` / `run_demo.py` để chạy thử agent độc lập, log lại
  input/output/latency thật vào `eval/run_log.jsonl` — dùng transcript thật
  trong `data/vlearn-pack/transcript/` (bài "Double Diamond") làm đầu vào,
  không phải dữ liệu tự bịa.
- Viết Canvas 7 dòng cho CP1 (`VLearn_Practice_Coach_Canvas.md`).
- Ở CP3: cùng rà lại `eval/golden_set.json` và `eval/eval_results.json`, phát
  hiện ra khoảng trống thật (xem mục 4) và cập nhật lại `spec.md` §8 +
  `README.md` cho khớp với ai thực sự đã commit phần nào.

---

## 3. AI hỗ trợ thế nào

Tôi dùng Claude Code trong suốt phần build và chuẩn bị checkpoint, cụ thể:

- **Đọc code thay vì đoán trước khi trả lời.** Khi cần điền form CP3, thay vì
  để AI tự bịa số liệu, tôi yêu cầu nó đọc trực tiếp `golden_set.json`,
  `eval_results.json`, `grounding.mjs`, `providers.mjs` để lấy số case, tên
  model (`gemini-3.1-flash-lite`), và caveat thật (kết quả 20/20 là offline,
  chưa phải lượt live) — tránh báo cáo sai lên form.


- **Lọc dữ liệu thật** từ `data/vlearn-pack/chatlog/*.csv` (1.261 turn) để tìm
  câu hỏi học viên thật (không dấu, cụt, mơ hồ) — bổ sung vào golden set thay
  vì tự nghĩ câu hỏi "sạch" không phản ánh người dùng thật.

Giới hạn: AI không tự quyết định các lựa chọn sản phẩm (automation level,
non-goals, quality bar) — những cái đó tôi và nhóm chốt, AI chỉ giúp tra cứu,
đối chiếu số liệu và soạn thảo nhanh hơn.

---

## 4. Một bài học từ case fail của chính nhóm

**Case fail:** ở vòng test đầu, agent tóm tắt/hỏi-đáp có lúc trích dẫn nhảy mặc
định sang Trang 15 dù học viên đang hỏi về nội dung khác, và phần fallback khi
không có API key từng bị hard-code sẵn câu trả lời thay vì thật sự truy xuất
theo bài học đang mở (xem changelog `spec.md` §9, mốc 12:22 ngày 30/07).

**Bài học:** "trông có vẻ chạy được" không giống "chạy đúng vì đúng lý do" — số
liệu 20/20 (100%) đầu tiên trong `eval/eval_results.json` chỉ là vòng kiểm tra
logic offline (retrieval + verifier), **chưa test được** lúc model live thật sự
tự do sinh câu trả lời. Nếu chỉ nhìn con số 100% mà không đọc kỹ `scope` ghi
trong chính file kết quả, nhóm sẽ báo cáo sai mức độ tin cậy của sản phẩm lên
CP3. Bài học rút ra: **luôn hỏi "số này đo cái gì, không đo cái gì"** trước khi
đưa vào slide demo, thay vì lấy con số đẹp nhất có sẵn.

---
