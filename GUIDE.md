# 📘 VLearn AI Agent — Hướng Dẫn Vận Hành Prototype

---

## 1. Tổng Quan

VLearn AI Agent là prototype trợ giảng AI thông minh cho nền tảng VLearn. Hệ thống hỗ trợ học viên sau mỗi buổi học thông qua 4 tính năng cốt lõi:

| # | Tính năng | Mô tả |
|---|-----------|-------|
| 1 | **Giải thích vùng bôi đen** | Bôi đen text trên slide → AI giải thích kèm trích dẫn trang |
| 2 | **Tóm tắt bài giảng** | Tổng hợp mục tiêu, key takeaways, bản đồ slide |
| 3 | **Hỏi đáp kiến thức (Hybrid Q&A)** | Chat tự do, tách nguồn slide/transcript và kiến thức nền ngoài slide |
| 4 | **Quiz kiểm tra hiểu thật** | 7-8 MCQ + 1-2 tự luận, chấm bằng Weighted Rubric |

Prototype chạy **hoàn toàn trên trình duyệt** (client-side), không cần backend server.

---

## 2. Cấu Trúc Dự Án

```
DAY05_G17_E403/
├── src/
│   ├── index.html      ← Giao diện chính (HTML)
│   ├── styles.css       ← Dark glassmorphism theme
│   ├── app.js           ← Logic điều khiển: routing, LLM call, quiz, upload PDF
│   ├── prompts.js       ← Prompt templates cho từng tính năng
│   └── data.js          ← Dữ liệu slide mẫu (mock lessons)
├── eval/
│   └── golden_set.json  ← Test case cho calibration
├── .env                 ← API Key & config
├── .env.example         ← Template .env mẫu
├── spec.md              ← Đặc tả kỹ thuật 8 phần
└── implementation_plan.md ← Kiến trúc & kế hoạch triển khai
```

---

## 3. Cài Đặt & Khởi Chạy

### Bước 1 — Cấu hình API Key (tùy chọn)

Prototype tĩnh không tự đọc `.env` trong trình duyệt để tránh vô tình công khai key.
Sau khi mở web, chọn nhà cung cấp ở góc phải header, nhập model và API Key tương ứng:

```env
OPENROUTER_API_KEY=<your-openrouter-api-key>
OPENROUTER_MODEL=openrouter/free

GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-2.5-flash
VLEARN_ENV=development
```

OpenRouter là lựa chọn mặc định với model `openrouter/free`; có thể nhập model slug khác. Khi đổi provider, key và model của mỗi bên được giữ riêng trong bộ nhớ phiên. Không có API Key hoặc API lỗi thì prototype dùng **fallback offline lai**.

### Bước 2 — Khởi động server

Mở terminal tại thư mục gốc dự án, chạy:

```bash
python -m http.server 3000 --directory src
```

### Bước 3 — Mở trình duyệt

Truy cập: **http://localhost:3000**

---

## 4. Hướng Dẫn Sử Dụng Từng Tính Năng

### 4.1 — Upload Slide PDF Riêng

1. Tại panel bên trái, cuộn xuống vùng **"Upload Slide PDF để test"**
2. **Kéo thả** file PDF vào zone, hoặc **click** để mở hộp thoại chọn file
3. Hệ thống tự động:
   - Render hình ảnh từng trang PDF bằng PDF.js
   - Trích xuất text theo từng trang làm căn cứ cho AI và vùng bôi đen
   - Tạo lesson mới từ nội dung PDF
   - Chuyển sang slide đầu tiên của file vừa upload
4. Thông báo xác nhận hiện trong khung chat bên phải
5. Bấm **✕ Xóa** trên upload zone để quay về dữ liệu mẫu

> **Giới hạn:** Hiển thị tối đa 50 trang. PDF dạng ảnh scan vẫn xem được, nhưng AI không thể khẳng định nội dung của trang nếu thiếu text layer. Chatbot vẫn có thể giải thích kiến thức nền chung khi người dùng nêu rõ thuật ngữ.

### 4.2 — Giải Thích Đoạn Bôi Đen (Explain Region)

1. Trên khung slide bên trái, **bôi đen** (select) đoạn text muốn hỏi
2. Tooltip **"✨ AI Giải thích đoạn bôi đen"** hiện lên
3. Click vào tooltip → AI trả lời kèm trích dẫn `[Trang N]` trong khung chat

### 4.3 — Tóm Tắt Bài Giảng (Summarize Deck)

1. Bấm pill **"📋 Tóm tắt slide bài giảng"** ở dưới khung chat
2. AI trả về: 3 mục tiêu cốt lõi + 5 key takeaways + bản đồ slide quan trọng

### 4.4 — Hỏi Đáp Kiến Thức (Grounded Q&A)

1. Gõ câu hỏi vào ô chat → bấm **Gửi** hoặc nhấn **Enter**
2. AI trả lời tự nhiên theo câu hỏi, có thể bổ sung định nghĩa, nguyên lý, so sánh, ứng dụng, hạn chế và ví dụ thay vì chỉ chép lại slide
3. Nếu slide chỉ nhắc thuật ngữ mà không định nghĩa, AI vẫn trả lời bằng kiến thức nền. Hệ thống tự chuẩn hóa nhãn **“Kiến thức nền ngoài slide”** nếu model quên ghi nhãn
4. Nếu model tạo citation sai nhưng phần giải thích vẫn hữu ích, hệ thống gỡ citation và chuyển nội dung sang kiến thức ngoài slide thay vì loại toàn bộ câu trả lời
5. Nội dung cần dữ liệu thời gian thực hoặc không đủ chắc chắn vẫn bị từ chối thay vì đoán

**Guardrail tích hợp:**
- Yêu cầu "giải hộ bài lab" hoặc "đáp án quiz nộp điểm" → bị chặn tự động

### 4.5 — Quiz Kiểm Tra Hiểu Thật

1. Chuyển sang tab **"🎯 Kiểm Tra Hiểu Thật (Quiz)"**
2. Bấm **"⚡ Khởi tạo Quiz"** → hệ thống sinh tối đa 8-10 câu; tài liệu ít nguồn độc lập thì trả ít hơn để tránh lặp hoặc bịa
3. **Câu trắc nghiệm (MCQ):** Click đáp án A/B/C/D
   - Các option không được tái sử dụng giữa các câu; distractor ưu tiên ngộ nhận gần đúng và câu tình huống
   - Trích dẫn được khóa trước khi trả lời và chỉ mở sau khi chọn đáp án
   - ✅ Xanh = đúng (kèm giải thích + trích dẫn)
   - ❌ Đỏ = sai (hiện đáp án đúng + giải thích)
4. **Câu tự luận:** Viết trả lời → bấm **"Chấm điểm"**
   - AI chấm theo Weighted Rubric: PASSED / PASSED_WITH_FEEDBACK / FAILED
   - Feedback chi tiết chỉ rõ ý đúng, ý thiếu

---

## 5. Chế Độ Hoạt Động

| Chế độ | Điều kiện | Hành vi |
|--------|-----------|---------|
| **Live (OpenRouter/Gemini)** | Chọn provider, model và nhập API Key trên header | Gọi provider đang chọn, sau đó dùng chung verifier trích dẫn/source snippet trước khi hiển thị |
| **Offline (Fallback)** | Không có API Key, API lỗi hoặc output không qua verifier | Truy xuất đúng bài và dùng glossary cục bộ cho một số thuật ngữ AI; phần ngoài slide luôn có nhãn |

API Key của từng provider chỉ nằm trong bộ nhớ phiên trình duyệt hiện tại, không được ghi vào source hoặc local storage.

---

## 6. Chuyển Đổi Bài Học

- Dropdown **lesson selector** trên header cho phép chuyển giữa các bài học
- Dữ liệu mẫu gồm 2 lessons: Day 2 (AI Problem Framing) & Day 3 (Agentic AI)
- Slide upload từ PDF sẽ xuất hiện ở đầu danh sách

---

## 7. Lưu Ý Kỹ Thuật

- **Browser yêu cầu:** Chrome/Edge/Firefox hiện đại (hỗ trợ ES Modules)
- **Không cần cài đặt npm/node** — chỉ cần Python cho HTTP server
- **PDF.js** được tải từ CDN (cần internet lần đầu load trang)
- File `.env` **không** được commit lên Git (đã có trong `.gitignore`); bản web tĩnh không tự đọc file này
- Toàn bộ logic chạy client-side; prompt chỉ được gửi đến provider đang chọn (OpenRouter hoặc Gemini) khi có key

### Kiểm tra logic grounding (tùy chọn)

Nếu máy có Node.js, chạy:

```bash
node --experimental-default-type=module eval/run_unit_tests.mjs
node --experimental-default-type=module eval/run_golden_set.mjs
```



Hiện tại thì tổng quan đã ổn nhưng vẫn còn một số vấn đề sau:
Các câu trắc nghiệm có đáp án tương tự nhau, không có tính thử thách vì khi trả lời được câu trên thì có thể loại trừ đáp án đó ra khi trả lời câu dưới, thứ 2 là chatbot trả lời cứng nhắc quá, chỉ lấy trích dẫn hoàn toàn từ slide mà không có khả năng trả lời mở rộng
