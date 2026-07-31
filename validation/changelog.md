# Validation Changelog — Nhóm G17

Dựa trên **5 feedback log** thu thập từ vòng user test ngoài nhóm (Nguyễn Văn An, Đào Trung Hiếu, Bùi Đức Hiếu, Nguyễn Trọng Đức, Phạm Thái Sơn), nhóm G17 đã họp và thực hiện các điều chỉnh trực tiếp vào sản phẩm như sau:

---

## 1. Các Thay Đổi Đã Thực Hiện (Actionable Changes)

### Change #1: Tách biệt nhãn và màu sắc cho "Kiến thức nền ngoài slide" (Từ feedback #1 của Văn An & #3 của Đức Hiếu)
- **Vấn đề từ Feedback:** Người dùng phản hồi khó phân biệt câu trả lời trích dẫn từ Slide `[Trang N]` và kiến thức AI bổ sung bên ngoài.
- **Thay đổi trên Prototype:** 
  - Bổ sung nhãn badge rõ ràng: **"Trích dẫn bài giảng [Trang N]"** (Màu xanh lá/Xanh dương) vs **"Kiến thức nền ngoài slide"** (Màu cam/Vàng).
  - Loại bỏ hoàn toàn các citation giả trỏ tới trang không tồn tại (như Trang 99).

### Change #2: Cải tiến logic Verifier khi phát hiện Citation sai (Từ feedback #5 của Thái Sơn & TC18)
- **Vấn đề từ Feedback:** Khi citation bị sai, verifier ban đầu loại bỏ toàn bộ câu trả lời, khiến người dùng mất thông tin hữu ích.
- **Thay đổi trên Engine:** 
  - Điều chỉnh verifier: Gỡ bỏ citation sai, giữ lại nội dung giải thích chính xác và hạ cấp câu trả lời xuống nhãn **"Kiến thức nền ngoài slide"**.

### Change #3: Tối ưu UI làm bài Quiz & Thêm bộ đếm thời gian 3 phút (Từ feedback #2 của Trung Hiếu & #4 của Trọng Đức)
- **Vấn đề từ Feedback:** Giao diện Quiz làm bài trong tab **"🎯 Kiểm Tra Hiểu Thật (Quiz)"** chưa dãn khoảng cách dòng tốt và thiếu cảm giác đếm ngược 3 phút cho bài kiểm tra cuối buổi.
- **Thay đổi trên Frontend:** 
  - Tăng line-height và padding giữa các lựa chọn trắc nghiệm.
  - Bổ sung thanh đếm thời gian (Countdown timer 3:00) ở góc trên bài Quiz.

---

## 2. Quyết Định Giữ Nguyên Có Căn Cứ (Justified Retentions)

- **Đề xuất của User:** Tăng số lượng câu hỏi Quiz lên 15-20 câu.
- **Quyết định:** **Giữ nguyên 8-10 câu (3 phút)**.
- **Lý do căn cứ:** JTBD cốt lõi của sản phẩm (§1 trong `spec.md`) là giúp học viên tự kiểm tra nhanh trong 3 phút cuối buổi mà không bị quá tải. Việc tăng lên 20 câu sẽ làm mất tính gọn nhẹ và vi phạm mục tiêu 3 phút.
