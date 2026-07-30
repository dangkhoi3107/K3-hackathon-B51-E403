# Reflection cá nhân — Vi Minh Hiển

## 1. Vai trò của em trong nhóm

Trong hackathon này, em là **Vi Minh Hiển**, mã học viên **2A202601743**. Theo phân công trong `README.md`, vai trò của em là
**UI & API**. Em phụ trách các thành phần giao diện tại `src/index.html`,
`src/styles.css`, lớp kết nối model tại `src/providers.mjs`, đồng thời đã tham
gia xây dựng `spec.md` và engine ban đầu trong `src/app.js`,
`src/grounding.mjs`, `src/data.js` và `src/prompts.js`.

Mục tiêu của em không chỉ là làm giao diện có thể bấm được. Phần UI và API phải
giúp người học hiểu AI đang dùng nguồn nào, khi nào câu trả lời đến từ slide,
khi nào là kiến thức nền bên ngoài và khi nào hệ thống không đủ căn cứ để trả
lời.

## 2. Phần em đã làm

Em xây dựng luồng web chính để học viên có thể xem slide, tải PDF, đặt câu hỏi,
yêu cầu tóm tắt và làm bài tự kiểm tra. Trong quá trình phát triển, em tham gia
xử lý lỗi PDF tải lên nhưng chỉ hiển thị văn bản mô tả bằng cách render trực
tiếp trang PDF trên giao diện, đồng thời vẫn trích xuất text để phục vụ retrieval
và sinh quiz.

Ở phần API, em xây dựng adapter để giao diện có thể chuyển giữa Gemini,
OpenRouter và Agent Core mà không phải viết lại toàn bộ logic gọi model. API key
không còn gắn cứng vào một provider duy nhất; giao diện có trạng thái rõ hơn khi
provider thiếu key, hết quota hoặc backend chưa chạy. Em cũng tham gia tách
prompt, dữ liệu bài học và logic kiểm chứng thành các module riêng để việc sửa
provider không làm ảnh hưởng toàn bộ ứng dụng.

Một phần quan trọng khác là engine grounding. Ban đầu chatbot trả lời khá cứng,
gần như chép lại slide. Sau phản hồi của nhóm, em điều chỉnh luồng Q&A theo
hướng hybrid: nội dung có trong bài giảng phải có citation hợp lệ; kiến thức nền
ngoài slide vẫn được phép giải thích nhưng phải gắn nhãn rõ và không được tạo
citation giả. Nhờ đó, câu như “VLM là gì?” vẫn có thể được trả lời dù slide chỉ
nói về cải tiến VLM mà không định nghĩa thuật ngữ.

## 3. AI đã hỗ trợ em như thế nào

AI hỗ trợ em trong việc tạo bản nháp giao diện, phân tách module, rà soát format
request/response của Gemini và OpenRouter, cũng như gợi ý các test case cho
retrieval, citation và guardrail. AI đặc biệt hữu ích khi cần so sánh nhanh hai
provider có cấu trúc API khác nhau hoặc khi cần tìm nguyên nhân một phản hồi bị
verifier loại.

Tuy nhiên, em không thể dùng kết quả AI sinh ra rồi xem như mặc định đúng. Có
những đoạn code chạy được nhưng hành vi sản phẩm lại không phù hợp, ví dụ
verifier quá chặt làm mất câu trả lời hữu ích, hoặc prompt quá cứng khiến
chatbot chỉ lặp lại slide. Vì vậy, em phải đọc output thật, đối chiếu với
`golden_set.json`, chạy regression test và tự giải thích được vì sao mỗi nhánh
fallback tồn tại.

## 4. Bài học từ một case fail của nhóm

Case em học được nhiều nhất là **TC18**. Model trả lời một ý có thể hữu ích nhưng
gắn citation `[Trang 99]` không tồn tại. Ở lượt chạy đầu, verifier phát hiện
citation sai nhưng loại luôn cả câu trả lời, trong khi hành vi mong muốn là gỡ
citation sai, giữ phần kiến thức có ích và hạ nó xuống nhãn
**“Kiến thức nền ngoài slide”**. Đây là một trong tám case fail khiến kết quả
lượt đầu của nhóm là **13/21**, thấp hơn quality bar 85%.

Từ case này, em nhận ra kiểm duyệt AI không nên chỉ có hai trạng thái “giữ toàn
bộ” hoặc “loại toàn bộ”. Hệ thống cần tách hai câu hỏi: nội dung có hữu ích
không, và bằng chứng có đủ mạnh không. Citation sai phải làm giảm mức độ tin cậy
của nguồn, nhưng không nhất thiết khiến mọi nội dung trong câu trả lời trở nên
vô giá trị. Với UI, việc phân biệt này cũng phải được hiển thị rõ để người học
không hiểu kiến thức ngoài slide là nội dung chính thức của bài giảng.

## 5. Nếu có thêm thời gian

Nếu có thêm thời gian, em muốn hoàn thiện ba việc. Thứ nhất, em sẽ thống nhất
contract giữa frontend và Agent Core để mọi chức năng như chat, tóm tắt và sinh
quiz đều đi qua cùng một lớp API. Thứ hai, em sẽ bổ sung kiểm thử live cho cả
Gemini và OpenRouter, bao gồm timeout, hết quota, key sai và response không đúng
schema. Thứ ba, em sẽ cải thiện UI trạng thái nguồn để người học nhìn thấy rõ
đâu là trích dẫn bài giảng, đâu là kiến thức nền và đâu là phần hệ thống chưa
đủ chắc chắn.

Qua hackathon, bài học lớn nhất của em là UI của sản phẩm AI không chỉ có nhiệm
vụ hiển thị câu trả lời. UI và lớp API phải cùng nhau truyền đạt mức độ chắc
chắn, nguồn gốc và đường lui khi AI sai. Một sản phẩm trả lời tự nhiên nhưng
không cho người dùng biết căn cứ vẫn chưa phải là một sản phẩm học tập đáng tin.
