# User Validation Feedback Log — Nhóm G17 (VLearn Grounding Tutor & Quiz Agent)

**Phụ trách:** Đăng Đức (2A202601787) — Role: Evidence & Validation  
**Số lượng người test:** 5 người ngoài nhóm (gồm 2 willing users từ CP1)  
**Sản phẩm test:** VLearn Grounding Tutor & End-of-Session Quiz Agent (`src/index.html` + `codebase/quiz-agent/`)

---

## 1. Danh Sách Người Tham Gia Validation (User Test)

| STT | Họ và tên | Vai trò / Bối cảnh | Loại User | Thiết bị test |
|---|---|---|---|---|
| 1 | Nguyễn Văn An | Học viên khóa AI Thực Chiến K3 | Willing User (CP1) | Laptop Chrome (Win 11) |
| 2 | Đào Trung Hiếu | Học viên khóa AI Thực Chiến K3 | Willing User (CP1) | Laptop Chrome (Win 11) |
| 3 | Bùi Đức Hiếu | Học viên khóa AI Thực Chiến K4 | User ngoài | Laptop Chrome (Win 11) |
| 4 | Nguyễn Trọng Đức | Học viên khóa AI Thực Chiến K3 | User ngoài | Laptop Chrome (Win 11) |
| 5 | Phạm Thái Sơn | Học viên khóa AI Thực Chiến K3 | User ngoài | Laptop Chrome (Win 11) |

---

## 2. Chi Tiết Feedback Log (Chuẩn phong cách tổng quát — Dùng mượt cho mọi file PDF/Slide)

### Log #1: Nguyễn Văn An (Học viên AI K3 — Willing User)
- **Kịch bản test:** Mở xem slide bài giảng, dùng tính năng hỏi đáp AI và bấm sinh bộ Quiz tự luyện 8-10 câu.
- **Trích dẫn nguyên văn (Quote):**
  > "Giao diện hiển thị slide bài giảng mượt và nút sinh bộ Quiz 8-10 câu tự luyện làm rất tiện. Thích nhất là làm sai câu nào AI chỉ ngay `[Trang N]` trích từ slide để mình mở lại xem đúng đoạn đó. Nhưng khi hỏi khái niệm bổ sung ngoài slide, giao diện nên hiển thị nhãn phân biệt rõ để không bị nhầm với trích dẫn chính thức."
- **Khía cạnh đánh giá:** Giao diện xem Slide + Bộ Quiz tự luyện + Trích dẫn `[Trang N]` & Nhãn phân biệt nguồn.
- **Điểm đánh giá:** 4.5/5★.

---

### Log #2: Đào Trung Hiếu (Học viên AI K3 — Willing User)
- **Kịch bản test:** Làm bài tự kiểm tra (Adaptive Quiz từng câu) và làm câu hỏi tự luận ngắn kiểm tra mức độ hiểu bài.
- **Trích dẫn nguyên văn (Quote):**
  > "Chế độ hỏi tự kiểm tra từng câu và phần chấm câu hỏi tự luận phản hồi chi tiết, chỉ rõ lý do vì sao đạt hoặc chưa đạt ý cốt lõi. Tuy nhiên, phần giao diện câu hỏi trắc nghiệm nên dãn khoảng cách dòng thoáng hơn và bổ sung thanh đếm ngược 3 phút để tăng cảm giác phản xạ bài kiểm tra cuối buổi."
- **Khía cạnh đánh giá:** Adaptive Quiz + Chấm tự luận theo Rubric + Đếm thời gian 3 phút.
- **Điểm đánh giá:** 4.5/5★.

---

### Log #3: Bùi Đức Hiếu (Học viên AI K4 — User ngoài)
- **Kịch bản test:** Tải file PDF bài giảng mới lên (`upload slide PDF`) và thử luồng Q&A giải thích khái niệm bôi đen.
- **Trích dẫn nguyên văn (Quote):**
  > "Tốc độ render slide PDF và trích xuất text layer trên giao diện mượt. Nhưng khi AI trả lời một câu hỏi dùng kiến thức bổ sung ngoài slide, thẻ thông báo nên đổi màu riêng (màu cam/vàng) để phân biệt rõ với thẻ trích dẫn chính thức từ bài giảng `[Trang N]`."
- **Khía cạnh đánh giá:** Slide PDF Parser + Phân biệt nguồn Grounded vs External Knowledge.
- **Điểm đánh giá:** 4/5★.

---

### Log #4: Nguyễn Trọng Đức (Học viên AI K3 — User ngoài)
- **Kịch bản test:** Bôi đen một đoạn nội dung trên slide bài giảng để yêu cầu AI giải thích và làm bài tự luyện cuối buổi.
- **Trích dẫn nguyên văn (Quote):**
  > "Tính năng bôi đen văn bản trên slide rồi bấm giải thích hoạt động rất tiện, câu trả lời ngắn gọn và không bị ngợp chữ như các chatbot thông thường. Nhưng sau khi làm xong bài Quiz tự luyện, hệ thống nên bổ sung thêm gợi ý 'Các slide cần xem lại' dựa trên những câu làm sai để học viên dễ ôn tập."
- **Khía cạnh đánh giá:** Tooltip giải thích bôi đen + Giảm ngợp chữ + Gợi ý trang xem lại.
- **Điểm đánh giá:** 5/5★.

---

### Log #5: Phạm Thái Sơn (Học viên AI K3 — User ngoài)
- **Kịch bản test:** Thử hỏi các câu hỏi mở rộng ngoài slide và đánh giá cơ chế kiểm duyệt nguồn (Verifier Guardrail).
- **Trích dẫn nguyên văn (Quote):**
  > "Khả năng kiểm duyệt trích dẫn (Verifier) hoạt động rất tốt, khi phát hiện citation sai hệ thống biết tự gỡ ra và hạ xuống nhãn kiến thức nền chứ không loại bỏ câu trả lời hữu ích. Nhưng ở thẻ trích dẫn, nên cho phép click trực tiếp vào `[Trang N]` để slide tự nhảy tới đúng trang đó thay vì bấm qua lại thủ công."
- **Khía cạnh đánh giá:** Verifier Guardrail + Graceful degradation + Chuyển trang slide tự động.
- **Điểm đánh giá:** 4.5/5★.
