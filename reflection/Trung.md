# Reflection - Trung

## 1. Vai trò của em trong nhóm

Trong hackathon này, em thuộc nhóm B51 - Zone 6, tham gia dự án **VLearn Grounding Tutor & End-of-Session Quiz Agent**. Theo phân công trong README, vai trò chính của em là **Demo & Dry-run**, phụ trách phần chuẩn bị và luyện tập demo cho sản phẩm, với artifact liên quan là `demo-slides.pdf`.

Dự án của nhóm không chỉ là một bài code, mà là một bài tư duy sản phẩm AI theo hướng **SPEC -> Prototype -> Demo**. Vì vậy, phần việc của em tập trung vào việc giúp nhóm kể được câu chuyện sản phẩm rõ ràng: vấn đề của học viên là gì, vì sao giải pháp này đáng làm, prototype chứng minh được điều gì, và khi demo thì cần show đúng phần quan trọng nhất.

## 2. Phần em đã làm

Em tham gia đọc README, spec và rubric để nắm yêu cầu nộp bài, đặc biệt là các mốc checkpoint, cấu trúc repo, tiêu chí chấm điểm và yêu cầu mỗi thành viên phải có reflection riêng. Từ đó, em hiểu rằng demo không chỉ cần "chạy được", mà còn phải chứng minh được chuỗi quyết định của nhóm bằng evidence, quality bar, eval và validation.

Trong phần Demo & Dry-run, em tập trung vào các việc sau:

- Chuẩn bị mạch trình bày cho demo: bắt đầu từ pain point của học viên VLearn, sau đó dẫn sang giải pháp Grounding Tutor và End-of-Session Quiz Agent.
- Rà lại các artifact chính trong repo như `spec.md`, `eval/`, `codebase/`, `validation/` và `demo-slides.pdf` để phần demo bám đúng những gì nhóm đã nộp.
- Hỗ trợ nhóm luyện dry-run trước CP5/CP6, kiểm tra xem luồng trình bày có rõ trong 5 phút không và có đủ phần case lỗi, kết quả đo, quality bar không.
- Góp ý để phần demo không bị biến thành giới thiệu tính năng chung chung, mà phải nhấn vào điểm khác biệt: AI trả lời và sinh quiz có trích dẫn nguồn, có guardrail, có fallback khi thiếu căn cứ.
- Chuẩn bị tinh thần cho phần Q&A, đặc biệt là vibe-coding rule: phần nào có tên mình thì phải giải thích được vai trò, artifact và lý do nhóm chọn cách làm đó.

Qua phần việc này, em hiểu rõ hơn rằng demo là lúc nhóm phải biến toàn bộ spec, prototype và kết quả kiểm thử thành một câu chuyện ngắn nhưng thuyết phục. Nếu demo không rõ, người xem sẽ khó thấy được vì sao sản phẩm đáng tin, dù phía sau nhóm đã làm nhiều.

## 3. AI đã hỗ trợ em như thế nào

AI hỗ trợ em trong việc tóm tắt và hệ thống lại tài liệu của nhóm. Vì README, rubric và spec có nhiều yêu cầu, em dùng AI để xác định nhanh các ý quan trọng cần xuất hiện trong demo: pain point, impact, prototype level, golden set, quality bar, validation và reflection cá nhân.

AI cũng giúp em luyện cách diễn đạt phần trình bày sao cho ngắn gọn hơn. Thay vì nói lan man về nhiều tính năng, em học cách gom demo quanh một lát cắt chính: học viên vừa học xong, muốn tự kiểm tra hiểu bài, bấm tạo quiz, nhận câu hỏi và phản hồi có nguồn kiểm chứng.

Tuy nhiên, em cũng nhận ra AI chỉ nên hỗ trợ sắp xếp và gợi ý, không thể thay mình hiểu sản phẩm. Nếu chỉ đọc script do AI viết mà không hiểu `spec.md`, `eval/` hoặc lý do cần citation verifier, khi bị hỏi ở CP5/CP6 em sẽ không giải thích được. Vì vậy, em phải tự đọc lại các phần quan trọng để nắm bản chất trước khi demo.

## 4. Một case fail của nhóm và bài học rút ra

Một case fail quan trọng của nhóm là AI có thể tạo câu trả lời hoặc quiz nghe hợp lý nhưng citation chưa chắc đúng với nội dung thật trong slide. Với sản phẩm giáo dục, lỗi này nguy hiểm hơn một câu trả lời sai thông thường, vì học viên có thể tin rằng kiến thức đó nằm trong bài giảng và học sai theo.

Từ case này, nhóm rút ra rằng sản phẩm AI cho học tập phải có cơ chế kiểm chứng nguồn, không chỉ dựa vào việc model trả lời mượt. Vì vậy, nhóm chọn hướng **Extract-then-Generate**: trích xuất thông tin thật từ slide/transcript trước, rồi mới sinh câu hỏi, đáp án hoặc giải thích. Ngoài ra, hệ thống cần kiểm tra `source_snippet` và citation trước khi hiển thị; nếu không đủ căn cứ thì fallback hoặc giảm số lượng câu hỏi thay vì cố bịa cho đủ.

Bài học của em là khi demo sản phẩm AI, không nên chỉ show happy path. Cần show cả case lỗi hoặc tình huống thiếu chắc chắn để chứng minh nhóm hiểu rủi ro và có thiết kế xử lý. Điều này làm sản phẩm đáng tin hơn nhiều so với một demo chỉ toàn kết quả đẹp.

## 5. Nếu có thêm thời gian

Nếu có thêm thời gian, em muốn cải thiện phần demo và dry-run ở ba điểm:

- Làm `demo-slides.pdf` cô đọng hơn nữa, mỗi slide chỉ giữ một thông điệp chính để trình bày trong 5 phút không bị quá tải.
- Chuẩn bị thêm một kịch bản demo lỗi thật rõ, ví dụ citation sai hoặc slide thiếu chữ, để cho thấy hệ thống biết fallback thay vì bịa.
- Luyện Q&A nhiều hơn với các câu hỏi khó về quality bar, golden set, validation và lý do chọn mức automation Augment/Conditional.

Sau hackathon, em thấy rõ hơn rằng một sản phẩm AI tốt không chỉ cần prototype chạy được, mà còn cần demo được lý do sản phẩm đáng tin. Với vai trò Demo & Dry-run, em học được cách nối giữa phần kỹ thuật, phần sản phẩm và phần trình bày để người nghe hiểu nhóm đã ra quyết định dựa trên bằng chứng chứ không chỉ làm theo cảm tính.
