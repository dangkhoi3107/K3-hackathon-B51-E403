# Quiz / self-check agent — VLearn

Prototype (Sketch tier) cho lát cắt: *khi học viên đọc xong một trang slide và bấm
"tự kiểm tra", AI sinh 3 câu hỏi trắc nghiệm bám đúng nội dung trang đó kèm trích
dẫn, chấm ngay và giải thích — hoặc từ chối nếu trang không đủ nội dung để ra câu
hỏi (không bịa).*

## Chạy thử

```bash
export GEMINI_API_KEY=...   # đã có sẵn trong môi trường máy này
cd codebase/quiz-agent
python run_demo.py          # nhập tay đáp án A/B/C/D
python run_demo.py --auto   # tự chọn A cho cả bộ — xem nhanh 2 nhánh hành vi
```

Mỗi lần chạy ghi log thô (input, output đầy đủ từ Gemini, latency) vào
`eval/run_log.jsonl` ở gốc repo — dùng để đối chiếu khi build golden set sau này.

## Quyết định AI trung tâm (§4 spec)

- **Automation: Conditional.** AI tự sinh quiz + tự chấm khi đoạn tài liệu có đủ
  căn cứ; khi không đủ → từ chối rõ ràng, không đoán/không bịa.
- **Cost-of-error:** câu hỏi/đáp án sai sẽ khiến học viên tự học sai kiến thức
  ngay lúc họ đang tin tưởng nhất (đang tự kiểm tra) → sai thì đắt → chọn Conditional
  thay vì Automate.
- **Chấm điểm tất định, không gọi AI lần 2** để tránh AI "phân xử" chủ quan hai lần
  cho cùng một câu hỏi nó vừa tự đặt ra — giải thích đã sinh sẵn ở bước 1.

## Nguyên tắc HAX/PAIR đã áp (cần ≥4 trong spec đầy đủ — đây là điểm khởi đầu)

| Nguyên tắc | Áp cụ thể vào đâu |
|---|---|
| G10 — Thu hẹp phạm vi khi nghi ngờ | `status="insufficient_content"` khi đoạn tài liệu quá mỏng, thay vì cố ra câu hỏi |
| G11 — Giải thích vì sao | Mỗi câu hỏi có `quote` (trích nguyên văn) + `explanation` bám đúng câu chữ đó, không diễn giải xa nguồn |

## Việc còn thiếu để lên spec.md đầy đủ

- ②③④ trong 4 lớp chỗ khó chưa có kịch bản (mới có ①); cần thêm case: học viên
  bôi đen đoạn mơ hồ (②), học viên đòi AI cho đáp án trước khi tự trả lời (③),
  câu hỏi đúng ngữ pháp nhưng sai trọng tâm kiến thức khiến học sai (④).
- Golden set ≥20 case (chưa làm) — nên lấy ≥10 case từ chính các cụm "nhiều học
  viên hỏi trùng 1 trang" đã mining được từ chatlog (xem hội thoại trước).
- Hiện dùng text dán tay làm "trang slide" — bản Mock cần nối với nội dung tài
  liệu thật (`data/vlearn-pack/`) theo `day_code`/số trang.
