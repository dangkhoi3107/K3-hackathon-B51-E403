# Backend — VLearn AI Tutor (FastAPI)

Backend nhỏ chạy **local trên máy trình bày lúc demo** (không deploy). Nhiệm vụ:

1. **Giấu API key** — proxy mọi lời gọi Gemini/OpenRouter, key chỉ nằm trong `.env`
   ở gốc repo, học viên/người test không cần tự dán key vào trình duyệt nữa.
2. **Vector DB thật dùng chung** — tính & cache vector (Gemini `gemini-embedding-001`)
   trong SQLite (`codebase/server/vlearn.db`), thay cho localStorage-mỗi-trình-duyệt
   của bản trước đó.
3. **Log quiz/chat** — ghi lại tương tác thật vào SQLite, xuất qua
   `GET /api/logs/export` phục vụ `eval/` và `validation/`.

Chi tiết kiến trúc/quyết định: xem `codebase/src/AGENT_ARCHITECTURE.md` (mục 1, 2b, 4).

## Chạy

```bash
# Từ gốc repo (không phải từ trong codebase/), dùng conda env "env1"
# (đã cài fastapi/uvicorn/httpx/python-dotenv)
conda run -n env1 uvicorn codebase.server.main:app --reload --port 8787
```

Mở `http://localhost:8787/index.html` — FastAPI tự serve luôn `codebase/src/` làm
static site (cùng origin với API, không cần cấu hình CORS, không cần chạy thêm
`python -m http.server`).

Cần `.env` ở gốc repo (copy từ `.env.example`) với ít nhất `GEMINI_API_KEY` —
thiếu key thì các endpoint `/api/llm/*`, `/api/embed/*` vẫn chạy nhưng trả lỗi rõ
ràng (401 kèm message), không giả vờ thành công.

## Endpoint

| Method | Path | Việc |
|---|---|---|
| GET | `/api/health` | Kiểm tra backend sống + đã cấu hình key nào |
| POST | `/api/llm/generate` | Proxy 1-lượt (thay `buildProviderRequest` cũ) |
| POST | `/api/llm/agent-turn` | Proxy Gemini function-calling (thay `buildGeminiAgentRequest`) |
| POST | `/api/embed/search` | Vector search có cache SQLite (Gemini embedding) |
| POST | `/api/logs/interaction` | Ghi 1 lượt chat/hỏi đáp |
| POST | `/api/logs/quiz-result` | Ghi 1 câu trả lời quiz |
| GET | `/api/logs/export?type=interaction\|quiz` | Xuất log JSON |

Backend gọi provider **đúng 1 lần** (không tự retry) — client (`codebase/src/app.js`)
giữ nguyên vòng lặp retry/backoff đã có sẵn (`API_RETRY_DELAYS_MS`), chỉ đổi URL đích
và bỏ header API key.
