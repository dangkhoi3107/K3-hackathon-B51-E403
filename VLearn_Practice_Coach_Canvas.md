# CP1 — CANVAS 7 DÒNG

## 1. Chiến tuyến

**VLearn AI Tutor — tính năng mới: VLearn Practice Coach**

---

## 2. Ai đang làm việc này?

**Học viên vừa đọc xong một trang hoặc một cụm slide nhỏ trong buổi học và muốn kiểm tra mình đã thực sự hiểu nội dung hay chưa.**

---

## 3. Họ vướng gì?

**Sau khi đọc slide hoặc nhận lời giải thích từ Tutor, học viên chưa có cách kiểm tra ngay mình đã hiểu đúng, hiểu một phần hay đang hiểu sai. Lỗ hổng kiến thức thường chỉ được phát hiện khi làm quiz hoặc lab sau đó, khiến học viên phải quay lại học, mất mạch, tốn thêm thời gian và có nguy cơ mất điểm.**

---

## 4. Bằng chứng ban đầu

- **9/1.261 lượt hội thoại** với VLearn Tutor, đến từ **7/369 học viên**, từng chủ động yêu cầu Tutor tạo quiz dù tính năng này chưa tồn tại.
- Ví dụ hội thoại `T0849`:

  > “TẠO QUIZ ĐỂ TÔI HIỂU RÕ VÀ ÔN LẠI TOÀN BỘ SLIDE NÀY”

- Tutor hiện tại gần như không chủ động kiểm tra mức độ hiểu của học viên:  
  **`asked_check_question = True` chỉ xuất hiện trong 3/1.261 lượt hội thoại.**

> Các số liệu trên cho thấy đã có nhu cầu tự kiểm tra và khoảng trống trong trải nghiệm hiện tại. Hậu quả về thời gian, mất mạch học và làm sai quiz/lab sẽ được xác nhận thêm bằng khảo sát người dùng.

---

## 5. Lát cắt MỘT CÂU

**Khi học viên đọc xong một trang hoặc cụm slide nhỏ và bấm “Tự kiểm tra”, AI Tutor xác định kiến thức trọng tâm, đặt từng câu hỏi có căn cứ và dựa trên mỗi câu trả lời để lựa chọn hỏi tiếp, đưa gợi ý, giải thích, điều chỉnh độ khó, yêu cầu xem lại đúng slide hoặc kết thúc, giúp học viên phát hiện và sửa phần hiểu sai trước khi tiếp tục học.**

### Flow lõi

```text
Đọc nội dung slide
→ xác định kiến thức trọng tâm
→ tạo và kiểm chứng một câu hỏi
→ nhận câu trả lời của học viên
→ xác định học viên hiểu đúng, hiểu một phần hay đang hiểu sai
→ chọn hành động hỗ trợ tiếp theo
→ tiếp tục hoặc kết thúc
```

---

## 6. AI tự làm đến đâu?

**AI tự điều phối phiên tự kiểm tra: xác định kiến thức trọng tâm, tạo câu hỏi, kiểm tra câu hỏi có căn cứ, đánh giá câu trả lời và lựa chọn hành động hỗ trợ tiếp theo.**

Các hành động AI có thể chọn:

- Hỏi câu tiếp theo.
- Hỏi câu dễ hơn hoặc khó hơn.
- Đưa gợi ý.
- Cho ví dụ.
- Giải thích phần hiểu sai.
- Yêu cầu xem lại slide cụ thể.
- Kết thúc và tổng hợp kết quả.

Các giới hạn được kiểm soát bằng rule:

- Tối đa 5 câu hỏi trong một phiên.
- Mỗi điểm hiểu sai được hỗ trợ tối đa 2 lần.
- Không sử dụng kết quả làm điểm chính thức.
- Không tạo câu hỏi khi tài liệu không đủ căn cứ.
- Mọi câu hỏi, đáp án và giải thích phải truy xuất được về slide nguồn.

**Mức automation: Conditional/Augment.**

**Lý do:** Nếu AI tạo câu hỏi, đáp án hoặc đánh giá sai, học viên có thể củng cố kiến thức sai ngay trong lúc đang tin tưởng hệ thống. Vì vậy AI chỉ tự thực hiện khi có đủ căn cứ; trường hợp không chắc phải từ chối, làm rõ hoặc yêu cầu học viên xem lại tài liệu.

---

## 7. Người thử và phân công

### Người đồng ý thử prototype

- Nguyễn Văn A — học viên K3
- Trần Thị B — học viên K3
- Lê Văn C — học viên K4

> Thay các tên trên bằng người thử thật trước khi nộp.

### Phân công nhóm

> Cột "Đã làm" đối chiếu trực tiếp với `git log --stat` — không phải tự nhận.
> Chỉ 2 người có commit tính đến 30/07: Vi Minh Hiển và Khôi.

| Thành viên | Vai trò | Đã làm (theo git log) | Việc tiếp theo | Artifact phụ trách |
|---|---|---|---|---|
| **Phạm Nguyễn Đăng Khôi (Leader)** | Điều phối + Quiz-Agent & Vision Q&A | Viết Quiz/self-check agent Python (`codebase/quiz-agent/`), mở rộng Q&A vùng ảnh (vision region) trong `app.js`/`grounding.mjs`, viết Canvas CP1 | Điều phối tiến độ, review chéo trước mỗi mốc, giữ quiz-agent + vision Q&A ổn định | `codebase/quiz-agent/`, `VLearn_Practice_Coach_Canvas.md` |
| **Vi Minh Hiển** | UI & API (đi tiếp) | Viết `spec.md`, engine gốc (`grounding.mjs`, `app.js`, `data.js`, `prompts.js`), khung `eval/`, UI (`index.html`, `styles.css`), wiring API (`providers.mjs`) | Tiếp tục phụ trách UI polish + đảm bảo lời gọi API/model live chạy ổn định (key, đổi provider, lỗi 4xx/5xx) | `src/index.html`, `src/styles.css`, `src/providers.mjs` |
| **Đăng Đức** | Evidence & Validation | Chưa có commit | Khảo sát ≥20 người ngoài nhóm + thu feedback log ≥5 người sau khi prototype chạy được | `validation/` (chưa tồn tại — cần tạo) |
| **Đỗ Tuấn Sơn** | Kiểm thử — Golden Set thật + lượt live | Chưa có commit | Bổ sung case thật từ chatlog vào golden set, chạy lượt live qua Gemini, ghi bảng kết quả đối chiếu quality bar | `eval/golden_set.json`, `eval/eval_results.json` |
| **Trung** | Demo & Dry-run | Chưa có commit | Soạn `demo-slides.pdf` (6 trang theo `02-guide.md` §5.1), dry run trước CP5, chuẩn bị case lỗi live cho Q&A | `demo-slides.pdf`, checklist dry-run |

### Phối hợp

- Khôi và Đăng Đức xác nhận pain point bằng evidence thật (khảo sát + mining).
- Sơn đối chiếu golden set với engine của Hiển; báo lỗi ngược cho Hiển nếu citation/grounding sai.
- Trung phối hợp với Khôi (quiz-agent) và Hiển (Q&A) để chọn case lỗi live cho demo.
- Mỗi thành viên phải giải thích được phần có tên mình (kiểm tra tại CP5) và trình bày ít nhất một phần trong demo.
