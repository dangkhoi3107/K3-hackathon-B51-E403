# Vòng validation với người dùng thật (CP5, trước dry run)

Phụ trách: **Đăng Đức**. Mục tiêu: chứng minh có người ngoài nhóm thật sự dùng
thử prototype, không phải cả nhóm tự khen nhau. Chấm theo `04-rubric.md` §R6
(8 điểm) — điều kiện chính xác:

- **4đ:** Feedback log **≥5 mẩu** từ **≥5 người ngoài nhóm** (trong đó **≥2 người
  phải là willing user đã khai từ CP1** — xem `spec.md` §8), mỗi mẩu có **quote
  nguyên văn** + **tên/vai** người thử.
- **4đ:** **≥1 thay đổi** thực hiện từ feedback được ghi vào `spec.md` §9
  Changelog, **hoặc** giữ nguyên nhưng có lý do căn cứ rõ ràng.

## Cách chạy 1 phiên (10 phút/người)

1. **Giao task thật:** "Hãy dùng cái này để [job thật]" — ví dụ: "Bạn vừa học
   xong Day 1, hãy dùng công cụ này để tự kiểm tra xem mình đã hiểu bài chưa."
2. **Im lặng quan sát** — không thuyết minh, không gợi ý, không sửa giúp. Ghi
   lại họ bấm gì, kẹt ở đâu, mất bao lâu để làm được việc đầu tiên.
3. **Hỏi đúng 3 câu sau khi họ dùng xong** (không thêm câu khác, không đổi ý câu):
   1. *"Điều gì khó hiểu hoặc khó chịu nhất?"*
   2. *"Kết quả này bạn có tin không — vì sao?"*
   3. *"Bạn có dùng thật không — vì sao / vì sao chưa?"*
4. **Log nguyên văn ngay lúc đó** vào `feedback_log.md` — không diễn giải lại
   ý người thử theo lời mình, chép đúng câu họ nói.

Nếu mọi phản hồi đều chỉ toàn lời khen chung chung → phiên test **chưa đạt**,
cần giao task khó hơn hoặc đổi người thử (tester đang nể nang, không phải sản
phẩm đã hoàn hảo).

## Ai nên thử

≥5 người ngoài nhóm — ưu tiên **3 willing users đã khai ở CP1** + thành viên
nhóm khác trong zone (đổi chéo giữa các nhóm nhanh nhất — ai cũng là học viên
thật của khoá nên vẫn tính là user thật).

## Sau khi log đủ ≥5 mẩu

Điền tiếp 4 dòng tổng hợp ở cuối `feedback_log.md`:
- Chủ đề lặp lại nhiều nhất trong feedback
- 1-2 thay đổi đã làm trước demo → **nhớ thêm dòng tương ứng vào `spec.md` §9 Changelog**, trỏ rõ về feedback nào
- Điều gì giữ nguyên dù có feedback trái chiều, kèm lý do
- Điều gì đưa vào backlog (nêu ở slide 6 "Nếu có thêm 1 tuần" trong demo)

## CP5 cần show được (theo `02-guide.md` §4.3)

- Feedback log ≥5 mẩu có tên người thử
- Changelog có thay đổi trỏ về đúng feedback (hoặc lý do giữ nguyên)
- Mọi thành viên sẵn sàng bị hỏi ngẫu nhiên "phần này hoạt động thế nào?"
