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
        content: "Số lượng token mà mô hình phải đọc (input) và sinh ra (output) đóng vai trò như một núm vặn điều khiển cả hiệu năng và chi phí. Càng nhiều token, độ trễ latency càng cao."
      },
      {
        page: 8,
        title: "Rủi ro trả lời sai Deadline",
        content: "Trợ lý trả lời câu hỏi logistics (deadline, link, nộp bài)... trả lời sai deadline gây hậu quả trực tiếp cho học viên (nộp trễ bài, bị trừ điểm học tập, mất niềm tin)."
      },
      {
        page: 14,
        title: "Kỹ thuật Few-shot Prompting",
        content: "Input: Great product, fast delivery! Output: Positive. Input: Terrible quality, waste of money Output: Negative. Prompt minh họa kỹ thuật Few-shot Prompting cung cấp ví dụ mẫu để LLM hiểu định dạng mong muốn."
      },
      {
        page: 15,
        title: "Anthropic Agent Patterns: Mức Automation",
        content: "Augment: AI gợi ý, người quyết định. Sai thì đắt (kiến thức sai đến học viên, điểm số). Phù hợp khi sai sót đắt. Conditional: AI tự làm case chắc, chuyển người case mơ hồ. Automate: AI tự làm hoàn toàn khi sai thì rẻ."
      },
      {
        page: 27,
        title: "Cost of Error & Lựa chọn Automation",
        content: "Sai thì ai chịu gì, sửa đắt hay rẻ. Khi chi phí sửa lỗi cao, bắt buộc chọn Augment để con người kiểm duyệt trước khi phát hành."
      },
      {
        page: 33,
        title: "Tối ưu prompt & Đánh giá AI (Evals)",
        content: "Đánh giá chất lượng mô hình AI không dựa trên cảm tính mà bằng bộ test case kiểm thử (Golden Set). Mức điểm 33% thường xuất hiện trong các bài benchmark ban đầu."
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
        content: "Tool (công cụ) đề cập đến các hàm hoặc API bên ngoài mà mô hình ngôn ngữ (LLM) có thể yêu cầu ứng dụng thực thi để mở rộng khả năng từ đọc tài liệu, tra DB đến gọi API."
      },
      {
        page: 12,
        title: "Mô hình ReAct (Reasoning and Acting)",
        content: "ReAct cho phép Agent suy luận (Thought), chọn hành động (Action) và quan sát kết quả (Observation) theo chu kỳ lặp để giải quyết bài toán phức tạp."
      },
      {
        page: 15,
        title: "Routing & Orchestrator Patterns",
        content: "Routing: Chọn path/specialist phù hợp. Orchestrator-Worker: Phân chia công việc cho nhiều worker nhỏ rồi tổng hợp lại. Bắt đầu từ cấu trúc đơn giản nhất."
      }
    ],
    transcript: `
    [T03-015] ReAct giúp AI không chỉ phán đoán một lần mà có thể suy luận vòng lặp Thought-Action-Observation.
    [T03-060] Đừng vội vã chọn Agent quá phức tạp nếu một Routing đơn giản đã giải quyết được bài toán.
    `
  }
];
