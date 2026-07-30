// Data pack mockup loaded from data/vlearn-pack/
export const VLEARN_LESSONS = [
  {
    id: "day02-c301",
    title: "Day 2 — Xác định bài toán AI (AI Problem Framing & Taxonomy)",
    slidesCount: 46,
    slides: [
      {
        page: 4,
        title: "Khái niệm Token & Latency Cost",
        content: "Số lượng token mà mô hình phải đọc (input) và sinh ra (output) đóng vai trò như một núm vặn điều khiển cả hiệu năng và chi phí. Càng nhiều token, độ trễ latency càng cao.",
        teachingNote: "Token không chỉ là giới hạn kỹ thuật; nó là một biến vận hành. Khi tăng context hoặc yêu cầu output dài hơn, nhóm nên đánh đổi có chủ đích giữa độ đầy đủ, thời gian phản hồi và chi phí.",
        example: "Ví dụ, một trợ lý luôn nhét toàn bộ tài liệu vào mọi câu hỏi có thể trả lời đủ ngữ cảnh hơn, nhưng người học phải chờ lâu hơn dù câu hỏi thực tế chỉ liên quan một trang."
      },
      {
        page: 8,
        title: "Rủi ro trả lời sai Deadline",
        content: "Trợ lý trả lời câu hỏi logistics (deadline, link, nộp bài)... trả lời sai deadline gây hậu quả trực tiếp cho học viên (nộp trễ bài, bị trừ điểm học tập, mất niềm tin).",
        teachingNote: "Điểm quan trọng không phải chỉ là câu trả lời đúng hay sai, mà là hậu quả của sai sót. Với deadline, một câu trả lời nghe rất tự tin nhưng không có nguồn có thể tạo thiệt hại thật cho học viên.",
        example: "Nếu bot đoán hạn nộp là thứ Sáu trong khi nguồn chính thức ghi thứ Năm, học viên có thể mất điểm dù trải nghiệm chat ban đầu có vẻ trôi chảy."
      },
      {
        page: 14,
        title: "Kỹ thuật Few-shot Prompting",
        content: "Input: Great product, fast delivery! Output: Positive. Input: Terrible quality, waste of money Output: Negative. Prompt minh họa kỹ thuật Few-shot Prompting cung cấp ví dụ mẫu để LLM hiểu định dạng mong muốn.",
        teachingNote: "Few-shot hữu ích khi yêu cầu bằng lời vẫn còn nhiều cách hiểu. Các cặp input-output cho mô hình thấy cả cách phân loại lẫn hình thức câu trả lời cần tuân theo.",
        example: "Muốn model chỉ trả POSITIVE hoặc NEGATIVE, hai ví dụ đúng định dạng thường rõ hơn một đoạn mô tả dài nhưng không có mẫu output."
      },
      {
        page: 15,
        title: "Anthropic Agent Patterns: Mức Automation",
        content: "Augment: AI gợi ý, người quyết định. Sai thì đắt (kiến thức sai đến học viên, điểm số). Phù hợp khi sai sót đắt. Conditional: AI tự làm case chắc, chuyển người case mơ hồ. Automate: AI tự làm hoàn toàn khi sai thì rẻ.",
        teachingNote: "Ba mức khác nhau chủ yếu ở quyền quyết định cuối và đường lui khi không chắc. Không nên chọn Automate chỉ vì model có vẻ thông minh; phải bắt đầu từ cost of error.",
        example: "AI có thể gợi ý nhận xét cho bài tự luận, nhưng giảng viên duyệt trước khi công bố điểm — đó là Augment vì quyết định cuối vẫn thuộc con người."
      },
      {
        page: 27,
        title: "Cost of Error & Lựa chọn Automation",
        content: "Sai thì ai chịu gì, sửa đắt hay rẻ. Khi chi phí sửa lỗi cao, bắt buộc chọn Augment để con người kiểm duyệt trước khi phát hành.",
        teachingNote: "Cost of Error biến một lựa chọn kỹ thuật thành quyết định sản phẩm: cùng một độ chính xác, hai tác vụ có hậu quả sai khác nhau sẽ cần mức tự động hóa khác nhau.",
        example: "Gợi ý tiêu đề video sai có thể sửa nhanh, còn chấm sai điểm học viên cần kiểm duyệt trước khi phát hành."
      },
      {
        page: 33,
        title: "Tối ưu prompt & Đánh giá AI (Evals)",
        content: "Đánh giá chất lượng mô hình AI không dựa trên cảm tính mà bằng bộ test case kiểm thử (Golden Set). Mức điểm 33% thường xuất hiện trong các bài benchmark ban đầu.",
        teachingNote: "Một con số benchmark thấp là điểm bắt đầu để phân loại lỗi, không phải lý do tự động kết luận model vô dụng. Golden Set giúp nhóm biết sửa prompt hay logic nào và đo lại trên cùng chuẩn.",
        example: "Thay vì chọn vài câu trả lời đẹp để demo, nhóm chạy lại toàn bộ case sau mỗi lần sửa để phát hiện regression."
      }
    ],
    quizSeeds: [
      {
        id: 1,
        source_snippet: "Số lượng token mà mô hình phải đọc (input) và sinh ra (output) đóng vai trò như một núm vặn điều khiển cả hiệu năng và chi phí. Càng nhiều token, độ trễ latency càng cao.",
        question: "Một nhóm tăng mạnh cả độ dài prompt lẫn output nhưng giữ nguyên model và hạ tầng. Theo bài giảng, hệ quả vận hành nào hợp lý nhất?",
        options: {
          A: "Độ trễ giảm vì output dài giúp mô hình duy trì mạch suy luận ổn định hơn.",
          B: "Chi phí giữ nguyên vì token chỉ ảnh hưởng chất lượng nội dung, không ảnh hưởng vận hành.",
          C: "Chi phí và độ trễ có xu hướng tăng vì mô hình phải xử lý nhiều token hơn.",
          D: "Chỉ input token ảnh hưởng; số token được sinh ra không làm thay đổi thời gian phản hồi."
        },
        correct_option: "C",
        explanation: "Slide coi số token là núm điều khiển cả hiệu năng, chi phí và latency.",
        citation: "Trang 4"
      },
      {
        id: 2,
        source_snippet: "Trợ lý trả lời câu hỏi logistics (deadline, link, nộp bài)... trả lời sai deadline gây hậu quả trực tiếp cho học viên (nộp trễ bài, bị trừ điểm học tập, mất niềm tin).",
        question: "Vì sao một bot đoán sai deadline không thể được xem là lỗi “rẻ”, dù câu trả lời chỉ dài một dòng?",
        options: {
          A: "Vì sai sót có thể khiến học viên nộp trễ, mất điểm và giảm niềm tin vào hệ thống.",
          B: "Vì mọi câu hỏi logistics đều cần nhiều GPU hơn câu hỏi kiến thức.",
          C: "Vì câu trả lời ngắn luôn khó kiểm chứng hơn câu trả lời dài.",
          D: "Vì bot bắt buộc phải dùng Few-shot Prompting cho mọi thông tin lịch học."
        },
        correct_option: "A",
        explanation: "Mức rủi ro được quyết định bởi hậu quả trực tiếp lên việc nộp bài, điểm số và niềm tin.",
        citation: "Trang 8"
      },
      {
        id: 3,
        source_snippet: "Prompt minh họa kỹ thuật Few-shot Prompting cung cấp ví dụ mẫu để LLM hiểu định dạng mong muốn.",
        question: "Model phân loại đúng ý nghĩa nhưng liên tục trả sai nhãn và sai cấu trúc output. Can thiệp nào bám sát kỹ thuật ở slide nhất?",
        options: {
          A: "Tăng temperature để model có thêm nhiều cách diễn đạt nhãn.",
          B: "Bỏ toàn bộ ví dụ để prompt ngắn hơn và model tự suy ra format.",
          C: "Chỉ mô tả lại yêu cầu bằng một đoạn dài hơn nhưng không đưa output mẫu.",
          D: "Cung cấp vài cặp input-output đúng định dạng để model bắt chước cấu trúc cần trả."
        },
        correct_option: "D",
        explanation: "Few-shot dùng ví dụ mẫu để định hình output format, đúng với lỗi được mô tả trong tình huống.",
        citation: "Trang 14"
      },
      {
        id: 4,
        source_snippet: "Augment: AI gợi ý, người quyết định. Sai thì đắt (kiến thức sai đến học viên, điểm số). Phù hợp khi sai sót đắt.",
        question: "AI đề xuất điểm tự luận, nhưng chấm sai sẽ ảnh hưởng trực tiếp tới học viên. Thiết kế nào phù hợp nhất?",
        options: {
          A: "Automate: công bố điểm ngay khi model trả kết quả để giảm thời gian chờ.",
          B: "Augment: AI gợi ý điểm và lý do, giảng viên quyết định trước khi công bố.",
          C: "Conditional: mọi bài có câu trả lời dài đều tự động chuyển thẳng cho model khác.",
          D: "Không dùng AI ở bất kỳ bước nào, kể cả gợi ý tiêu chí cần kiểm tra."
        },
        correct_option: "B",
        explanation: "Khi sai sót đắt, AI nên hỗ trợ còn quyền quyết định cuối thuộc con người.",
        citation: "Trang 15"
      },
      {
        id: 5,
        source_snippet: "Sai thì ai chịu gì, sửa đắt hay rẻ. Khi chi phí sửa lỗi cao, bắt buộc chọn Augment để con người kiểm duyệt trước khi phát hành.",
        question: "Hai tính năng có cùng độ chính xác 90%, nhưng một tính năng sai chỉ làm tiêu đề kém hấp dẫn còn tính năng kia có thể làm học viên mất điểm. Yếu tố nào phải làm thay đổi mức automation?",
        options: {
          A: "Số lượng màu sắc và thành phần hiển thị trong giao diện.",
          B: "Độ dài trung bình của system prompt ở hai tính năng.",
          C: "Cost of Error và người phải chịu hậu quả khi hệ thống sai.",
          D: "Số lượng thành viên tham gia viết code cho prototype."
        },
        correct_option: "C",
        explanation: "Cùng độ chính xác không đồng nghĩa cùng mức tự động hóa; hậu quả sai mới quyết định nhu cầu kiểm duyệt.",
        citation: "Trang 27"
      },
      {
        id: 6,
        source_snippet: "Đánh giá chất lượng mô hình AI không dựa trên cảm tính mà bằng bộ test case kiểm thử (Golden Set). Mức điểm 33% thường xuất hiện trong các bài benchmark ban đầu.",
        question: "Lượt benchmark đầu chỉ đạt 33%. Phản ứng nào phù hợp nhất với cách đánh giá trong bài?",
        options: {
          A: "Phân tích lỗi trên Golden Set, sửa một nguyên nhân rồi chạy lại toàn bộ bộ test.",
          B: "Kết luận ngay model không dùng được dựa trên một vài output đầu tiên.",
          C: "Chỉ giữ các case đã đạt để tỷ lệ demo phản ánh phần tốt nhất của hệ thống.",
          D: "Tăng độ dài mọi câu trả lời vì output dài thường làm điểm benchmark cao hơn."
        },
        correct_option: "A",
        explanation: "Evals yêu cầu đo trên bộ case cố định và lặp lại sau thay đổi, thay vì đánh giá bằng cảm tính.",
        citation: "Trang 33"
      }
    ],
    transcript: `
    [T02-010] Chào các bạn, hôm nay chúng ta học về Xác định bài toán AI và Phân loại mức độ Automation.
    [T02-045] Ở trang 15, Anthropic đưa ra lời khuyên rất quan trọng: Hãy chọn pattern phù hợp với Cost of Error. Nếu sai sót quá đắt gây mất điểm cho học viên, hãy dùng Augment.
    [T02-088] Đối với Few-shot prompting ở trang 14, việc cung cấp 2-3 ví dụ rõ ràng giúp mô hình định hình chuẩn output format.
    [T02-120] Đối với các trợ lý hỏi đáp deadline (trang 8), nếu bot trả lời sai lỡ hạn nộp bài của học viên thì hậu quả là trực tiếp và đắt giá.
    `
  },
  {
    id: "day03-agentic",
    title: "Day 3 — Từ Chatbot đến Agentic AI (ReAct Pattern & Routing)",
    slidesCount: 34,
    slides: [
      {
        page: 3,
        title: "Khái niệm Tool trong LLM",
        content: "Tool (công cụ) đề cập đến các hàm hoặc API bên ngoài mà mô hình ngôn ngữ (LLM) có thể yêu cầu ứng dụng thực thi để mở rộng khả năng từ đọc tài liệu, tra DB đến gọi API.",
        teachingNote: "LLM không tự thực thi tool; nó yêu cầu ứng dụng gọi một hàm/API rồi nhận kết quả trở lại. Phân biệt này giúp thiết kế quyền hạn, kiểm tra input và xử lý lỗi.",
        example: "Khi cần tra deadline, model có thể yêu cầu gọi hàm đọc lịch chính thức; ứng dụng mới là thành phần thực sự truy vấn dữ liệu."
      },
      {
        page: 12,
        title: "Mô hình ReAct (Reasoning and Acting)",
        content: "ReAct cho phép Agent suy luận (Thought), chọn hành động (Action) và quan sát kết quả (Observation) theo chu kỳ lặp để giải quyết bài toán phức tạp.",
        teachingNote: "Giá trị của ReAct nằm ở vòng phản hồi: Observation có thể làm agent đổi kế hoạch ở bước tiếp theo thay vì bám cứng vào suy đoán ban đầu.",
        example: "Nếu tool trả lỗi “không tìm thấy bản ghi”, agent quan sát lỗi đó rồi chọn truy vấn khác, thay vì tiếp tục trả lời như thể đã có dữ liệu."
      },
      {
        page: 15,
        title: "Routing & Orchestrator Patterns",
        content: "Routing: Chọn path/specialist phù hợp. Orchestrator-Worker: Phân chia công việc cho nhiều worker nhỏ rồi tổng hợp lại. Bắt đầu từ cấu trúc đơn giản nhất.",
        teachingNote: "Routing thường chọn một đường xử lý phù hợp, còn Orchestrator-Worker chủ động tách một nhiệm vụ thành nhiều phần rồi tổng hợp. Nếu chỉ cần chọn đúng specialist thì chưa cần orchestration phức tạp.",
        example: "Phân loại câu hỏi sang bot logistics hoặc bot kiến thức là Routing; chia một báo cáo thành nghiên cứu, phân tích và biên tập song song là Orchestrator-Worker."
      }
    ],
    quizSeeds: [
      {
        id: 1,
        source_snippet: "Tool (công cụ) đề cập đến các hàm hoặc API bên ngoài mà mô hình ngôn ngữ (LLM) có thể yêu cầu ứng dụng thực thi để mở rộng khả năng từ đọc tài liệu, tra DB đến gọi API.",
        question: "Trong một trợ lý tra cứu, model chọn hành động `lookup_record`, sau đó ứng dụng gọi cơ sở dữ liệu. Thành phần nào khiến hành động này được xem là Tool use?",
        options: {
          A: "Model viết một đoạn reasoning dài hơn trước khi trả lời.",
          B: "Ứng dụng thực thi một hàm/API bên ngoài theo yêu cầu của model.",
          C: "Prompt chứa thêm ví dụ về cách diễn đạt câu trả lời.",
          D: "Lịch sử chat được giữ lại trong context window của model."
        },
        correct_option: "B",
        explanation: "Tool là hàm hoặc API bên ngoài được ứng dụng thực thi, không chỉ là nội dung suy luận trong model.",
        citation: "Trang 3"
      },
      {
        id: 2,
        source_snippet: "ReAct cho phép Agent suy luận (Thought), chọn hành động (Action) và quan sát kết quả (Observation) theo chu kỳ lặp để giải quyết bài toán phức tạp.",
        question: "Agent vừa gọi tool và nhận Observation rằng dữ liệu không tồn tại. Hành vi nào đúng tinh thần ReAct nhất?",
        options: {
          A: "Bỏ qua Observation và giữ nguyên câu trả lời đã dự đoán trước khi gọi tool.",
          B: "Dừng toàn bộ luồng vì ReAct chỉ cho phép đúng một lần gọi hành động.",
          C: "Chuyển Observation trực tiếp thành đáp án cuối mà không suy luận lại.",
          D: "Dùng Observation để cập nhật Thought, rồi chọn Action tiếp theo phù hợp."
        },
        correct_option: "D",
        explanation: "ReAct là chu kỳ Thought-Action-Observation, nên quan sát mới phải ảnh hưởng bước suy luận và hành động kế tiếp.",
        citation: "Trang 12"
      },
      {
        id: 3,
        source_snippet: "Routing: Chọn path/specialist phù hợp. Orchestrator-Worker: Phân chia công việc cho nhiều worker nhỏ rồi tổng hợp lại.",
        question: "Tình huống nào mô tả đúng khác biệt giữa Routing và Orchestrator-Worker?",
        options: {
          A: "Routing chọn một specialist; Orchestrator-Worker chia việc cho nhiều worker rồi tổng hợp.",
          B: "Routing luôn gọi mọi specialist; Orchestrator-Worker chỉ chọn đúng một path.",
          C: "Hai pattern giống nhau hoàn toàn, chỉ khác tên gọi trong từng framework.",
          D: "Routing dùng cho tác vụ phức tạp nhiều bước, còn Orchestrator chỉ dùng để phân loại intent."
        },
        correct_option: "A",
        explanation: "Routing chọn đường xử lý, còn Orchestrator-Worker phân rã và tổng hợp nhiều phần việc.",
        citation: "Trang 15"
      }
    ],
    transcript: `
    [T03-015] ReAct giúp AI không chỉ phán đoán một lần mà có thể suy luận vòng lặp Thought-Action-Observation.
    [T03-060] Đừng vội vã chọn Agent quá phức tạp nếu một Routing đơn giản đã giải quyết được bài toán.
    `
  }
];
