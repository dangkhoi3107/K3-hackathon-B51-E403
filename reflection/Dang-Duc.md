# Reflection cá nhân — Nguyễn Đăng Đức

## 1. Vai trò của em trong nhóm

Trong mini hackathon này, em là **Nguyễn Đăng Đức**, mã học viên **2A202601787**, thuộc **Nhóm B51 — Zone 6** (Dự án: **VLearn Grounding Tutor & End-of-Session Quiz Agent**). 

Theo phân công công việc trong `README.md` và [`spec.md` §8](../spec.md#§8-phân-công--kế-hoạch), vai trò của em là **Evidence & Validation**, phụ trách chính các artifact thuộc thư mục [`validation/`](../validation/) bao gồm `feedback-log.md` và `changelog.md`, đồng thời đóng góp trực tiếp phần bằng chứng nỗi đau (Evidence & Mining Data) tại [§1 & §2 trong `spec.md`](../spec.md#§1-user--job).

Trong một dự án AI theo định hướng **SPEC → Prototype → Demo**, vai trò Evidence & Validation đòi hỏi em phải bảo vệ nguyên tắc "nói có sách, mách có chứng". Em có nhiệm vụ đảm bảo nhóm không tự nghĩ ra pain point giả định, mà mọi quyết định thiết kế sản phẩm đều xuất phát từ số liệu khảo sát thực tế và phản hồi từ người dùng thật.

---

## 2. Phần em đã làm

Chi tiết các phần việc em đã hoàn thành trong đợt hackathon:

1. **Khảo sát & Thu thập Evidence ban đầu (Phục vụ Rubric R1 & Spec §1-§2):**
   - Đã thực hiện khảo sát trực tiếp **$\ge$ 20 người ngoài nhóm** (học viên lớp AI Thực Chiến K3/K4) để xác minh vấn đề: học viên rời buổi học không có công cụ tự kiểm tra kiến thức nhanh, dẫn đến hổng kiến thức và tốn 1-2h mò lại slide/video.
   - Tham gia quét và phân tích **1.261 turn chatlog VLearn** (`data/vlearn-pack/chatlog/`): Tìm ra con số bằng chứng giật mình khi **46.2%** (582 turn) AI không có trích dẫn nguồn (`citations: []`), **85.2%** (1.074 turn) AI xả bức tường chữ thụ động và **99.8%** AI không đặt câu hỏi kiểm tra lại người học.

2. **Tổ chức User Testing & Xây dựng Feedback Log (Phục vụ Rubric R6 & `validation/`):**
   - Xây dựng kịch bản user test và mời **5 người dùng ngoài nhóm** (gồm 2 willing users Nguyễn Văn An, Đào Trung Hiếu từ mốc CP1 và 3 học viên K4: Bùi Đức Hiếu, Nguyễn Trọng Đức, Phạm Thái Sơn) dùng thử trực tiếp prototype `src/index.html`.
   - Ghi nhận nguyên văn (quote) phản hồi thực tế của từng người tại [`validation/feedback-log.md`](../validation/feedback-log.md), đánh giá từng khía cạnh: tính tiện lợi của tab *"🎯 Kiểm Tra Hiểu Thật (Quiz)"*, nút bấm *"⚡ Hoặc: bộ quiz đầy đủ 8-10 câu"*, độ chính xác trích dẫn `[Trang N]`, nút *"✨ AI Giải thích đoạn bôi đen"*, và giao diện chấm câu hỏi tự luận bằng Weighted Rubric (TC11-TC14).

3. **Chuyển đổi Feedback thành Changelog cải tiến sản phẩm:**
   - Đóng góp vào [`validation/changelog.md`](../validation/changelog.md) và [§9 trong `spec.md`](../spec.md#§9-changelog): Tổng hợp 3 cải tiến sản phẩm trực tiếp từ feedback của user (tách nhãn/màu sắc cho "Kiến thức nền ngoài slide", điều chỉnh logic verifier khi phát hiện citation sai, tối ưu khoảng cách đáp án Quiz và thêm bộ đếm 3 phút).
   - Bảo vệ giữ nguyên thiết kế cốt lõi (Quiz 8-10 câu / 3 phút) dựa trên căn cứ JTBD ban đầu khi user đề xuất tăng số lượng câu hỏi.

---

## 3. AI đã hỗ trợ em như thế nào

AI đóng vai trò như một người trợ lý phân tích dữ liệu hiệu quả cho em trong suốt quá trình làm việc:

- **Thiết kế câu hỏi khảo sát:** Em dùng AI để gợi ý các mẫu câu hỏi khảo sát trung tính (neutral questions), tránh việc đặt câu hỏi dẫn dắt (leading questions) làm sai lệch kết quả thực tế của người dùng.
- **Phân loại & Xử lý Text:** AI giúp em viết regex và script ngắn để phân loại nhanh 1.261 dòng chatlog, đếm chính xác tỷ lệ các câu trả lời thiếu trích dẫn hoặc bị lỗi xả chữ.
- **Tổng hợp Feedback:** AI hỗ trợ cấu trúc lại các mẩu phản hồi thô từ người dùng thử thành dạng feedback log chuyên nghiệp, gắn thẻ theo các chủ đề (UI/UX, Accuracy, Feature Request).

**Tuy nhiên, bài học quan trọng của em là:** Em tuyệt đối không dùng AI để sinh số liệu khảo sát hoặc feedback giả. Mọi con số khảo sát 20 người và 5 mẩu feedback log đều phải trích dẫn từ trải nghiệm và trích dẫn nguyên văn của người dùng thật. Số liệu bị chỉnh sửa hay làm giả sẽ làm mất giá trị kiểm chứng của toàn bộ dự án.

---

## 4. Bài học từ một case fail của nhóm

Case fail mà em rút ra được bài học sâu sắc nhất là tình huống **TC18** và phản hồi từ user test **Log #1 (Nguyễn Văn An) & Log #5 (Phạm Thái Sơn)**:

Khi model tạo ra câu trả lời chứa thông tin nền có ích nhưng lại gắn nhãn citation sai `[Trang 99]` (không tồn tại trong slide). Ở lượt test đầu tiên, bộ Verifier của nhóm hoạt động quá cứng nhắc: phát hiện citation sai là loại bỏ sạch toàn bộ câu trả lời. Khi đem bản này đi user test, người dùng phản hồi rằng họ cảm thấy hệ thống bị lỗi hoặc vô ích vì câu hỏi đúng nhưng không nhận được câu trả lời.

**Bài học em rút ra:** 
Trong quản trị chất lượng sản phẩm AI, "Validation" không phải là trò chơi nhị phân (Đúng/Sai hoặc Giữ/Xoá sạch). Dữ liệu bằng chứng phải được phân lớp rõ ràng:
- Giữa **nội dung kiến thức đúng** và **bằng chứng trích dẫn (citation)** là hai khái niệm độc lập.
- Việc kiểm soát ảo giác (hallucination) cần một đường đi mềm dẻo (graceful degradation): Khi citation sai, hệ thống cần gỡ trích dẫn sai đó ra, giữ lại kiến thức bổ ích và dán nhãn minh bạch: **"Kiến thức nền ngoài slide"**. Bài học này giúp nhóm cải tiến bộ verifier và làm sản phẩm trở nên thân thiện, đáng tin cậy hơn hẳn trong mắt người dùng.

---

## 5. Nếu có thêm thời gian

Nếu có thêm thời gian phát triển dự án, em muốn thực hiện 3 việc:

1. **Mở rộng quy mô khảo sát & User Testing:** Nâng số lượng người test từ 5 lên 20-30 học viên thực tế ở nhiều khóa học khác nhau (Python, Data, Product) để thu thập bộ feedback đa dạng hơn.
2. **Triển khai A/B Testing trực tiếp trên UI:** Mở rộng kiểm thử 2 phiên bản giao diện hiển thị nguồn (Phiên bản A: Trích dẫn dạng tooltip modal vs Phiên bản B: Trích dẫn ghim cố định bên lề slide) để đo lường tỷ lệ người học click vào kiểm tra nguồn.
3. **Tự động hóa Feedback Loop:** Xây dựng nút "Phản hồi trích dẫn sai / Quiz không sát" ngay cuối mỗi bài Quiz để thu thập dữ liệu hổng kiến thức tự động trôi về dashboard cho TA và Giảng viên.

---

**Tổng kết:** Qua mini hackathon, em nhận ra rằng một sản phẩm AI hay không nằm ở chỗ chém gió tính năng hoành tráng, mà nằm ở **bằng chứng nỗi đau thực tế** và **vòng lặp kiểm chứng (validation loop)** liên tục với người dùng.
