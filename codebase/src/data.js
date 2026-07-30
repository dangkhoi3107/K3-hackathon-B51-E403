// Data pack mockup — soạn lại từ transcript thật trong data/vlearn-pack/transcript/
// (transcript-04-clean.md và transcript-01-clean.md), không dùng slide bên ngoài.
export const VLEARN_LESSONS = [
  {
    id: "day1-foundation",
    title: "Day 1 — Foundation: Lịch Sử AI, Deep Learning Và Kiến Trúc Transformer",
    slidesCount: 38,
    slides: [
      {
        page: 5,
        title: "Bức Tranh AI, Machine Learning, Deep Learning, Generative AI",
        content: "AI là vòng ngoài cùng — hệ thống có trí thông minh mô phỏng con người. Bên trong là Machine Learning: máy học từ dữ liệu thay vì con người viết luật if-else. Sâu hơn nữa là Deep Learning: mạng neuron nhiều tầng tự học đặc trưng từ dữ liệu. Trong cùng là Generative AI — công nghệ tạo sinh đứng sau các chatbot như ChatGPT, Claude.",
        teachingNote: "Bốn vòng tròn lồng nhau, đi từ ngoài vào trong theo đúng thứ tự công nghệ đã phát triển: AI ra đời trước, hỏi 'có mô phỏng được trí thông minh không'; ML trả lời bằng cách cho máy học từ dữ liệu; Deep Learning là một cách học cụ thể (mạng neuron nhiều tầng); Generative AI là ứng dụng mới nhất bên trong Deep Learning.",
        example: "ChatGPT vừa là AI (rộng nhất), vừa là ứng dụng Machine Learning, vừa dùng kiến trúc Deep Learning, và cụ thể là một hệ Generative AI — 4 vòng tròn đều đúng cùng lúc, chỉ khác mức độ cụ thể."
      },
      {
        page: 11,
        title: "Hai Mùa Đông Của AI",
        content: "Symbolic AI (dạy máy bằng luật do chuyên gia viết tay) chạm trần vì bùng nổ tổ hợp — 10 bước quyết định nhị phân đã ra 2^10 khả năng, không ai liệt kê hết luật của thế giới thực. Expert System (thu hẹp phạm vi, train cho một chuyên môn hẹp) cũng chạm trần sau đó vì tri thức luôn phải nhập bằng tay và phải cập nhật liên tục khi bối cảnh đổi.",
        teachingNote: "Cả hai mùa đông đều có chung một nguyên nhân gốc: cách tiếp cận dựa vào con người liệt kê luật, dù ở quy mô rộng (symbolic AI) hay quy mô hẹp (expert system), đều không theo kịp độ phức tạp và thay đổi của thế giới thực.",
        example: "Một hệ chuyên gia có 1.000 luật nối tiếp nhau theo kiểu 'nếu A thì B' — chỉ cần 1 biến số mới xuất hiện, luật đầu chuỗi đổi, toàn bộ chuỗi phía sau phải viết lại từ đầu."
      },
      {
        page: 17,
        title: "Bước Ngoặt 2012: ImageNet Và AlexNet",
        content: "Deep learning có kiến trúc từ 2006 nhưng phải đợi đến 2012 mới có thành tựu đầu tiên, nhờ hội tụ đủ 3 yếu tố: kiến trúc mạng neuron phù hợp, bộ dữ liệu ImageNet (khởi nguồn từ việc Fei-Fei Li tự tay dán nhãn hàng loạt ảnh), và phần cứng GPU đủ mạnh. Một đội thắng cuộc thi nhận diện ảnh với khoảng cách rất lớn so với đội thứ hai, tạo cú hích khiến cả ngành quay lại tin vào deep learning.",
        teachingNote: "Ý tưởng đúng (mạng neuron nhiều tầng) đã có từ 2006 nhưng vẫn cần đợi đủ dữ liệu chất lượng cao (ImageNet) và đủ phần cứng (GPU) mới chứng minh được hiệu quả thực tế — minh hoạ rằng một kiến trúc tốt không đủ nếu thiếu dữ liệu và hạ tầng.",
        example: "Trước ImageNet, muốn nhận diện ảnh xe hơi bạn phải tự mô tả bằng tay đặc trưng của xe (mấy bánh, hình dáng); sau ImageNet + deep learning, chỉ cần đưa đủ ảnh đã gán nhãn, mô hình tự học đặc trưng."
      },
      {
        page: 22,
        title: "AlphaGo Và Nước Đi Số 37",
        content: "AlphaGo học từ 150.000 ván cờ vây của chuyên gia để có trực giác ban đầu, sau đó tự chơi với chính nó hàng triệu lần. Ở ván đấu với Lee Sedol, AlphaGo đi nước số 37 — một nước chưa từng tồn tại trong lịch sử cờ vây, khiến kỳ thủ số một thế giới phải rời bàn cờ 15 phút vì không hiểu nổi, nhưng cuối cùng AlphaGo thắng.",
        teachingNote: "Điểm mấu chốt không phải AlphaGo giỏi hơn con người ở việc đã biết, mà là qua self-play (tự chơi với chính mình) nó khám phá ra chiến thuật hoàn toàn mới mà không người chơi nào từng nghĩ tới — khác về bản chất so với việc chỉ học lại kinh nghiệm sẵn có.",
        example: "Nếu AlphaGo chỉ học từ 150.000 ván cờ chuyên gia mà dừng lại, nó có thể chơi giỏi nhưng khó vượt trình độ con người; chính hàng triệu ván tự chơi mới giúp nó tìm ra nước đi ngoài tưởng tượng của con người."
      },
      {
        page: 28,
        title: "Attention Is All You Need — Vì Sao Transformer Thay RNN",
        content: "Mô hình cũ (RNN) đọc và xử lý từng chữ một theo thứ tự, nên hay 'quên' phần đầu khi câu quá dài — ví dụ Google Dịch đời cũ dịch kiểu từng chữ (word-by-word) nên sai ngữ pháp. Transformer (bài báo 'Attention Is All You Need', Google, 2017) đọc cả cụm câu cùng lúc và tự xác định từ nào liên quan tới từ nào — đó là ý nghĩa của 'attention'.",
        teachingNote: "Cơ chế attention giải quyết đúng điểm yếu của RNN: thay vì xử lý tuần tự và dễ quên ngữ cảnh xa, attention cho phép mô hình nhìn toàn bộ câu cùng lúc và tự cân nhắc mức độ quan trọng giữa các từ, bất kể khoảng cách giữa chúng.",
        example: "Trong câu dài, RNN có thể quên chủ ngữ ở đầu câu khi xử lý tới cuối câu; Transformer vẫn giữ được liên kết giữa chủ ngữ và động từ dù chúng cách nhau rất xa, vì nó nhìn cả câu cùng lúc thay vì đọc tuần tự."
      },
      {
        page: 33,
        title: "Cuộc Đua Sau ChatGPT",
        content: "ChatGPT ra đời cuối 2022 khiến cả ngành chuyển hướng nghiên cứu theo cùng một hướng. Google từng lập team làm Bard trong 100 ngày nhưng thất bại, sau đó tái sinh thành Gemini. Một số mô hình Trung Quốc dùng chiến lược 'chưng cất' — học lại từ đầu ra của các mô hình lớn đã có sẵn thay vì tự xây nền tảng từ đầu.",
        teachingNote: "Bài học ứng dụng cho học viên: Việt Nam khó cạnh tranh ở việc tự train mô hình nền tảng từ đầu (cần vốn, dữ liệu, hạ tầng khổng lồ), nhưng có lợi thế ở việc ứng dụng LLM có sẵn vào đúng bài toán và dữ liệu đặc thù của mình.",
        example: "Thay vì cố xây một LLM riêng cạnh tranh với GPT/Claude, một nhóm nhỏ nên tập trung dùng LLM có sẵn để giải đúng bài toán có dữ liệu đặc thù mà các mô hình lớn chưa tối ưu riêng cho nó."
      }
    ],
    quizSeeds: [
      {
        id: 1,
        source_snippet: "AI là vòng ngoài cùng — hệ thống có trí thông minh mô phỏng con người.",
        question: "Một sản phẩm dùng ChatGPT được mô tả là 'ứng dụng AI'. Theo mô hình 4 vòng tròn lồng nhau trong bài, mô tả nào đúng nhất về vị trí của nó?",
        options: {
          A: "Nó vừa là AI, vừa là Machine Learning, vừa là Deep Learning, vừa là Generative AI — vì các vòng lồng nhau, cụ thể hơn về phía trong.",
          B: "Nó chỉ là AI, không thuộc Machine Learning vì không tự huấn luyện lại mô hình.",
          C: "Nó là Machine Learning nhưng không phải AI, vì AI là khái niệm cũ đã bị thay thế.",
          D: "Nó là Deep Learning nhưng không liên quan gì tới Generative AI."
        },
        correct_option: "A",
        explanation: "4 khái niệm là các vòng tròn lồng nhau theo bài giảng — cụ thể hơn nằm trong khái quát hơn, nên một hệ generative AI đúng nghĩa vẫn là AI, là ML, là Deep Learning.",
        citation: "Trang 5"
      },
      {
        id: 2,
        source_snippet: "Expert System (thu hẹp phạm vi, train cho một chuyên môn hẹp) cũng chạm trần sau đó vì tri thức luôn phải nhập bằng tay và phải cập nhật liên tục khi bối cảnh đổi.",
        question: "Một đội xây hệ thống bằng cách thuê chuyên gia viết 1.000 luật nối tiếp nhau. Vài tháng sau, một biến số mới xuất hiện khiến luật đầu chuỗi phải đổi. Hậu quả nào đúng với giới hạn được nêu trong bài?",
        options: {
          A: "Không ảnh hưởng gì vì luật phía sau độc lập hoàn toàn với luật phía trước.",
          B: "Chỉ cần thêm 1 luật mới vào cuối danh sách là đủ, không cần sửa gì khác.",
          C: "Hệ thống tự động học lại từ dữ liệu mới mà không cần con người can thiệp.",
          D: "Toàn bộ chuỗi luật phía sau phải rà soát và sửa lại, vì các luật ràng buộc lẫn nhau theo kiểu tuyến tính."
        },
        correct_option: "D",
        explanation: "Bài giảng chỉ rõ: hệ dựa trên luật do con người viết tay có nhược điểm là khi bối cảnh đổi, phải quay lại sửa toàn bộ chuỗi luật đã xây, tạo thành nợ kỹ thuật lớn.",
        citation: "Trang 11"
      },
      {
        id: 3,
        source_snippet: "Deep learning có kiến trúc từ 2006 nhưng phải đợi đến 2012 mới có thành tựu đầu tiên, nhờ hội tụ đủ 3 yếu tố: kiến trúc mạng neuron phù hợp, bộ dữ liệu ImageNet (khởi nguồn từ việc Fei-Fei Li tự tay dán nhãn hàng loạt ảnh), và phần cứng GPU đủ mạnh.",
        question: "Deep learning đã có kiến trúc từ 2006 nhưng phải đợi tới 2012 mới tạo được cú hích lớn. Theo bài giảng, đâu là tổ hợp điều kiện đúng khiến cú hích đó xảy ra?",
        options: {
          A: "Chỉ cần đủ nhà nghiên cứu tin tưởng vào deep learning là đủ, không cần yếu tố kỹ thuật khác.",
          B: "Kiến trúc mạng phù hợp, dữ liệu gán nhãn quy mô lớn (ImageNet), và phần cứng GPU đủ mạnh cùng hội tụ.",
          C: "Chỉ cần phần cứng GPU mạnh hơn là đủ, kiến trúc mạng không quan trọng.",
          D: "Chỉ cần có nhiều nhà đầu tư rót vốn, không liên quan tới dữ liệu hay phần cứng."
        },
        correct_option: "B",
        explanation: "Bài giảng nêu rõ 3 yếu tố phải hội tụ cùng lúc: kiến trúc, dữ liệu (ImageNet) và phần cứng (GPU) — thiếu một trong ba thì mô hình thời đó cũng không thành công.",
        citation: "Trang 17"
      },
      {
        id: 4,
        source_snippet: "AlphaGo học từ 150.000 ván cờ vây của chuyên gia để có trực giác ban đầu, sau đó tự chơi với chính nó hàng triệu lần.",
        question: "AlphaGo học 150.000 ván cờ chuyên gia rồi tự chơi với chính nó hàng triệu lần trước khi đấu với Lee Sedol. Vì sao bước tự chơi hàng triệu lần lại quan trọng theo bài giảng?",
        options: {
          A: "Vì nó giúp AlphaGo ghi nhớ chính xác hơn 150.000 ván cờ đã học ban đầu.",
          B: "Vì luật thi đấu cờ vây yêu cầu AI phải tự chơi đủ số ván quy định trước khi được thi đấu chính thức.",
          C: "Vì nó giúp AlphaGo tự khám phá ra chiến thuật mới chưa từng tồn tại trong kinh nghiệm con người, như nước đi số 37.",
          D: "Vì tự chơi với chính mình giúp giảm thời gian huấn luyện xuống còn vài phút."
        },
        correct_option: "C",
        explanation: "Giá trị cốt lõi của self-play theo bài giảng là khả năng khám phá chiến thuật hoàn toàn mới, minh chứng bằng nước đi số 37 chưa từng có trong lịch sử cờ vây.",
        citation: "Trang 22"
      },
      {
        id: 5,
        source_snippet: "Transformer (bài báo 'Attention Is All You Need', Google, 2017) đọc cả cụm câu cùng lúc và tự xác định từ nào liên quan tới từ nào — đó là ý nghĩa của 'attention'.",
        question: "Google Dịch đời cũ dùng RNN, dịch theo kiểu word-by-word nên hay sai ngữ pháp với câu dài. Theo bài giảng, cơ chế attention trong Transformer giải quyết đúng điểm yếu nào?",
        options: {
          A: "Attention giúp mô hình xử lý nhanh hơn về mặt tốc độ tính toán, không liên quan tới ngữ nghĩa.",
          B: "Attention thay thế hoàn toàn nhu cầu về dữ liệu huấn luyện của mô hình dịch máy.",
          C: "Attention giúp mô hình nhìn toàn bộ câu cùng lúc và xác định mối liên hệ giữa các từ, kể cả khi chúng ở cách xa nhau.",
          D: "Attention chỉ hoạt động với câu ngắn dưới 5 từ, không xử lý được câu dài."
        },
        correct_option: "C",
        explanation: "Bài giảng mô tả attention là cơ chế đọc cả cụm từ, nhận diện từ nào liên quan tới từ nào trong toàn câu — khắc phục đúng lỗi 'quên ngữ cảnh xa' của RNN đọc tuần tự.",
        citation: "Trang 28"
      },
      {
        id: 6,
        source_snippet: "Một số mô hình Trung Quốc dùng chiến lược 'chưng cất' — học lại từ đầu ra của các mô hình lớn đã có sẵn thay vì tự xây nền tảng từ đầu.",
        question: "Sau khi ChatGPT ra đời, một số mô hình Trung Quốc dùng chiến lược 'chưng cất' để bắt kịp. Theo bài giảng, chiến lược này nghĩa là gì?",
        options: {
          A: "Học lại quy luật suy luận từ đầu ra của các mô hình lớn đã có sẵn, thay vì tự xây nền tảng từ đầu.",
          B: "Chỉ tăng số lượng GPU sử dụng để huấn luyện nhanh hơn các đối thủ.",
          C: "Tự thu thập dữ liệu gốc và huấn luyện mô hình hoàn toàn mới từ đầu, không dựa vào mô hình nào khác.",
          D: "Ngừng phát triển mô hình riêng và chỉ sử dụng lại nguyên bản mô hình của đối thủ."
        },
        correct_option: "A",
        explanation: "Bài giảng mô tả 'chưng cất' là học từ dữ liệu/đầu ra của mô hình lớn đã có để khái quát hoá thành quy luật, giúp đi đường tắt thay vì tự xây nền tảng từ số 0.",
        citation: "Trang 33"
      }
    ],
    transcript: `
    [T04-030] Ý tưởng khiến máy móc học được từ dữ liệu là tái tạo mạng neuron thần kinh giống con người — nền tảng của deep learning, ra đời năm 2006.
    [T04-038] Bài báo "Attention Is All You Need" xuất bản năm 2017 bởi team Google là khởi điểm của kiến trúc transformer đứng sau ChatGPT.
    [T04-035] AlphaGo học 150.000 ván cờ chuyên gia trước, sau đó tự chơi với chính mình hàng triệu lần để tự khám phá chiến thuật mới.
    [T04-029] Symbolic AI dạy máy bằng luật do chuyên gia viết tay chạm trần vì bùng nổ tổ hợp — không ai liệt kê hết luật của thế giới thực.
    `
  },
  {
    id: "day2-problem-framing",
    title: "Day 2 — Xác Định Bài Toán Kinh Doanh Cho AI (Problem Framing)",
    slidesCount: 24,
    slides: [
      {
        page: 4,
        title: "Kỹ Thuật Five Whys — Đào Sâu Vấn Đề Thật",
        content: "Khi nhận một đề bài mơ hồ như 'xây AI chatbot support', đừng nhận diện ngay là đúng vấn đề. Hỏi 'why' liên tiếp (Five Whys) để đào tới gốc — ví dụ hỏi ra thì lý do thực sự đằng sau yêu cầu 'chatbot support' có thể là 'đội sale đang quá tải', và giải pháp đúng có thể không phải là xây chatbot.",
        teachingNote: "Bài học nhấn mạnh: đề bài ban đầu thường chỉ là bề mặt (symptom), không phải vấn đề gốc (root cause). Five Whys là công cụ đơn giản để liên tục hỏi lại cho tới khi chạm được nguyên nhân thật, tránh xây nhầm giải pháp cho một vấn đề không tồn tại.",
        example: "Sếp yêu cầu 'xây chatbot cho khách hàng' → hỏi why → hoá ra vì sale quá tải trả lời câu hỏi lặp lại → giải pháp đúng có thể là tự động hoá 1 bước nhỏ trong quy trình sale, không cần xây hẳn 1 chatbot lớn."
      },
      {
        page: 12,
        title: "Mô Hình Double Diamond Và Câu Hỏi Do The Wrong Thing Right",
        content: "Double Diamond gồm 2 giai đoạn, mỗi giai đoạn có 2 bước mở rộng rồi hội tụ: viên kim cương thứ nhất giúp tìm ĐÚNG vấn đề (problem discovery), viên thứ hai giúp tìm ĐÚNG giải pháp (solution discovery). Bài giảng đặt câu hỏi: 'do the right thing wrong' (làm đúng việc nhưng làm sai) và 'do the wrong thing right' (làm sai việc nhưng làm rất tốt) — cái nào nguy hiểm hơn?",
        teachingNote: "Câu trả lời trong bài: 'do the wrong thing right' nguy hiểm hơn — vì nếu xác định đúng vấn đề (right thing) mà thực thi chưa hoàn hảo, vẫn còn cơ hội sửa và đi đúng hướng; nhưng nếu vấn đề đã sai từ đầu, càng làm tốt/làm nhiều càng lãng phí nguồn lực mà không giải quyết được gì.",
        example: "Một team làm rất xuất sắc một chatbot hỗ trợ khách hàng (làm tốt), nhưng vấn đề thật sự lại là quy trình nội bộ chậm chứ không phải thiếu chatbot (chọn sai vấn đề) — công sức làm tốt đó gần như vô nghĩa."
      },
      {
        page: 19,
        title: "Dogfooding — Tự Dùng Sản Phẩm Của Chính Mình",
        content: "Dogfooding là chiến lược xây sản phẩm mà chính người xây cũng là người dùng đầu tiên và dùng hàng ngày. Jira ra đời từ việc đội ngũ tự dùng nó để quản lý chính quá trình xây Jira; Slack ban đầu chỉ là công cụ chat nội bộ của một đội; Anthropic dùng Claude Code để build chính Claude Code.",
        teachingNote: "Lợi ích cốt lõi của dogfooding: người xây sản phẩm cảm nhận trực tiếp nỗi đau (pain point) của chính sản phẩm mình làm ra, nên có động lực sửa lỗi ngay lập tức và tối ưu liên tục mà không cần chờ phản hồi từ người dùng bên ngoài.",
        example: "Một người tự build công cụ ôn tập cho chính mình, dùng mỗi ngày để học — khi công cụ có lỗi làm mất dữ liệu ôn tập thật của chính họ, họ có động lực sửa ngay lập tức, mạnh hơn nhiều so với việc chỉ nghe báo cáo lỗi từ người khác."
      }
    ],
    quizSeeds: [
      {
        id: 1,
        source_snippet: "Hỏi 'why' liên tiếp (Five Whys) để đào tới gốc — ví dụ hỏi ra thì lý do thực sự đằng sau yêu cầu 'chatbot support' có thể là 'đội sale đang quá tải'",
        question: "Một sếp yêu cầu 'xây AI chatbot support cho khách hàng'. Theo kỹ thuật Five Whys trong bài, bước đầu tiên nên làm là gì?",
        options: {
          A: "Bắt tay xây chatbot ngay vì sếp đã yêu cầu rõ ràng, không cần hỏi lại.",
          B: "Từ chối yêu cầu vì đề bài quá mơ hồ, không thể thực hiện được.",
          C: "Liên tục hỏi 'vì sao' để tìm ra vấn đề gốc thực sự đứng sau yêu cầu bề mặt, trước khi chọn giải pháp.",
          D: "Giao lại cho một AI khác tự quyết định giải pháp phù hợp nhất."
        },
        correct_option: "C",
        explanation: "Bài giảng nhấn mạnh: đề bài ban đầu thường chỉ là triệu chứng bề mặt; Five Whys giúp đào tới nguyên nhân thật trước khi quyết định giải pháp.",
        citation: "Trang 4"
      },
      {
        id: 2,
        source_snippet: "Double Diamond gồm 2 giai đoạn, mỗi giai đoạn có 2 bước mở rộng rồi hội tụ: viên kim cương thứ nhất giúp tìm ĐÚNG vấn đề (problem discovery), viên thứ hai giúp tìm ĐÚNG giải pháp (solution discovery).",
        question: "Theo bài giảng, giữa 'do the right thing wrong' và 'do the wrong thing right', vế nào được đánh giá là nguy hiểm hơn, và vì sao?",
        options: {
          A: "'Do the right thing wrong' nguy hiểm hơn, vì thực thi sai luôn không thể sửa được.",
          B: "Cả hai nguy hiểm như nhau, vì kết quả cuối cùng đều là sản phẩm chưa hoàn thiện.",
          C: "Không vế nào nguy hiểm, vì Double Diamond đảm bảo luôn tìm ra giải pháp đúng.",
          D: "'Do the wrong thing right' nguy hiểm hơn, vì chọn sai vấn đề ngay từ đầu khiến mọi nỗ lực thực thi tốt sau đó đều lãng phí."
        },
        correct_option: "D",
        explanation: "Bài giảng lý giải: nếu vấn đề đúng nhưng thực thi chưa hoàn hảo, vẫn còn cơ hội sửa và đi đúng hướng; còn nếu vấn đề đã sai, càng làm tốt càng lãng phí nguồn lực.",
        citation: "Trang 12"
      },
      {
        id: 3,
        source_snippet: "Dogfooding là chiến lược xây sản phẩm mà chính người xây cũng là người dùng đầu tiên và dùng hàng ngày.",
        question: "Theo bài giảng, vì sao chiến lược dogfooding (tự dùng sản phẩm của chính mình) giúp cải thiện sản phẩm nhanh hơn?",
        options: {
          A: "Vì dogfooding giúp giảm chi phí hạ tầng máy chủ khi vận hành sản phẩm.",
          B: "Vì người xây sản phẩm trực tiếp cảm nhận được nỗi đau khi dùng sản phẩm của chính mình, nên có động lực sửa lỗi ngay lập tức.",
          C: "Vì dogfooding là yêu cầu bắt buộc theo quy định của các nhà đầu tư.",
          D: "Vì dogfooding thay thế hoàn toàn nhu cầu khảo sát người dùng thật bên ngoài."
        },
        correct_option: "B",
        explanation: "Bài giảng nêu ví dụ Jira, Slack, Claude Code: chính đội ngũ dùng sản phẩm hàng ngày nên cảm nhận trực tiếp pain point và tối ưu liên tục mà không cần chờ phản hồi từ bên ngoài.",
        citation: "Trang 19"
      }
    ],
    transcript: `
    [T01-030] Khi nhận một đề bài mơ hồ như "xây AI chatbot support", việc của chúng ta là xác định mục tiêu, pain point thực sự phía sau — có một framework phổ biến là Five Whys, hỏi why đến năm lần để đào sâu.
    [T01-049] Double Diamond có hai giai đoạn: problem discovery giúp tìm ra đúng vấn đề, solution discovery giúp tìm ra đúng giải pháp cho vấn đề đó.
    [T01-042] Dogfooding là cách xây sản phẩm mà bạn là user và bạn dùng chính sản phẩm của mình — Jira, Slack, Claude Code đều bắt đầu như vậy.
    `
  }
];
