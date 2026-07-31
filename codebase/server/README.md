# Backend — VLearn AI Tutor (FastAPI)

Backend nhỏ, chỉ chạy **local trên máy trình bày lúc demo** (không deploy lên đâu cả).
Backend này làm 3 việc:

1. **Giấu API key** — mọi lời gọi Gemini/OpenRouter đi qua backend, key chỉ nằm
   trong file `.env` ở gốc repo. Người test không cần tự dán key vào trình duyệt.
2. **Vector DB dùng chung** — tính & lưu vector (Gemini `gemini-embedding-001`)
   vào SQLite (`codebase/server/vlearn.db`), thay vì mỗi trình duyệt tự tính lại
   (localStorage) như bản trước.
3. **Ghi log quiz/chat** — lưu tương tác thật vào SQLite, xuất ra qua
   `GET /api/logs/export` để dùng cho `eval/` và `validation/`.

Chi tiết kiến trúc/quyết định thiết kế: xem `codebase/src/AGENT_ARCHITECTURE.md`
(mục 1, 2b, 4).

## Cài đặt (chỉ cần làm 1 lần)

Chạy các lệnh dưới đây **từ gốc repo** (không phải từ trong `codebase/`).

**1. Tạo virtual environment (venv) và kích hoạt:**

```powershell
# Windows PowerShell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

Sau khi kích hoạt, prompt sẽ có tiền tố `(.venv)` — nghĩa là đang dùng đúng
Python cô lập của dự án, không lẫn với Python hệ thống.

**2. Cài thư viện:**

```bash
pip install -r codebase/requirements.txt
```

**3. Tạo file cấu hình `.env`:**

```bash
# copy từ mẫu có sẵn rồi điền GEMINI_API_KEY thật vào
cp .env.example .env
```

Mở `.env` vừa tạo, dán key Gemini vào dòng `GEMINI_API_KEY=`. File `.env` đã
nằm trong `.gitignore` nên sẽ không bị commit lên git.

## Chạy backend

Mỗi lần chạy, nhớ kích hoạt venv trước (bước 1 ở trên) rồi:

```bash
uvicorn codebase.server.main:app --reload --port 8787
```

Mở `http://localhost:8787/index.html` — FastAPI tự phục vụ luôn `codebase/src/`
làm static site (cùng origin với API, không cần cấu hình CORS, không cần chạy
thêm `python -m http.server`).

> Thiếu `GEMINI_API_KEY` trong `.env` thì server vẫn khởi động bình thường,
> nhưng các endpoint `/api/llm/*` và `/api/embed/*` sẽ trả lỗi 401 kèm thông
> báo rõ ràng — không âm thầm giả vờ thành công.

## Endpoint

| Method | Path | Việc |
|---|---|---|
| GET | `/api/health` | Kiểm tra backend sống + đã cấu hình key nào |
| POST | `/api/llm/generate` | Proxy 1-lượt gọi model (thay `buildProviderRequest` cũ) |
| POST | `/api/llm/agent-turn` | Proxy Gemini function-calling (thay `buildGeminiAgentRequest`) |
| POST | `/api/embed/search` | Vector search có cache SQLite (Gemini embedding) |
| POST | `/api/logs/interaction` | Ghi 1 lượt chat/hỏi đáp |
| POST | `/api/logs/quiz-result` | Ghi 1 câu trả lời quiz |
| GET | `/api/logs/export?type=interaction\|quiz` | Xuất log JSON |

Backend gọi provider **đúng 1 lần** (không tự retry) — phần retry/backoff
(`API_RETRY_DELAYS_MS`) vẫn nằm ở client (`codebase/src/app.js`) như cũ, backend
chỉ đổi URL đích và bỏ header API key đi.
