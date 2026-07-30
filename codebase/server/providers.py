"""Python port cua src/providers.mjs - build & goi THAT request toi Gemini/OpenRouter.
Day la noi DUY NHAT giu API key that (doc tu .env server-side) - khac ban truoc
o cho client tu nhet key vao request tu trinh duyet. Goi 1 lan, khong tu retry -
client (src/app.js: callLLMAPI/callGeminiAgentTurn) giu nguyen vong lap retry da co."""

from urllib.parse import quote

import httpx

from .config import (
    GEMINI_API_KEY,
    GEMINI_EMBEDDING_MODEL,
    GEMINI_MODEL,
    OPENROUTER_API_KEY,
    OPENROUTER_MODEL,
)

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
TIMEOUT_SECONDS = 20.0


class ProviderError(Exception):
    def __init__(self, status_code, message):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def _clamp_temperature(value, default):
    if not isinstance(value, (int, float)):
        value = default
    return min(1, max(0, value))


def _safe_json(response):
    try:
        return response.json()
    except ValueError:
        return {}


async def call_generate(
    provider_id,
    model,
    prompt_text,
    json_mode=False,
    temperature=None,
    image_base64=None,
    image_mime_type="image/png",
    images=None,
):
    """Mirror buildProviderRequest (src/providers.mjs). Tra ve (status_code, payload_json).

    `images` (list[{"data", "mime_type"}], tuy chon) cho phep dinh kem NHIEU anh trong 1 lan
    goi (vd: chat gui nhieu anh de Gemini so sanh) - doc lap voi `image_base64` don le da co
    (van dung cho luong vision-region cu, khong doi)."""
    provider_id = provider_id if provider_id in ("gemini", "openrouter") else "openrouter"
    default_model = GEMINI_MODEL if provider_id == "gemini" else OPENROUTER_MODEL
    selected_model = (model or "").strip() or default_model
    selected_temperature = _clamp_temperature(temperature, 0.1 if json_mode else 0.2)

    if provider_id == "gemini":
        if not GEMINI_API_KEY:
            raise ProviderError(401, "Server thieu GEMINI_API_KEY trong .env")
        parts = [{"text": prompt_text}]
        if image_base64:
            parts.append({"inline_data": {"mime_type": image_mime_type, "data": image_base64}})
        for image in images or []:
            data = (image or {}).get("data")
            if not data:
                continue
            mime_type = (image or {}).get("mime_type") or "image/png"
            parts.append({"inline_data": {"mime_type": mime_type, "data": data}})
        body = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": selected_temperature,
                **({"responseMimeType": "application/json"} if json_mode else {}),
            },
        }
        url = f"{GEMINI_BASE}/{quote(selected_model, safe='')}:generateContent"
        headers = {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}
    else:
        if not OPENROUTER_API_KEY:
            raise ProviderError(401, "Server thieu OPENROUTER_API_KEY trong .env")
        body = {
            "model": selected_model,
            "messages": [{"role": "user", "content": prompt_text}],
            "temperature": selected_temperature,
        }
        url = OPENROUTER_URL
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "X-OpenRouter-Title": "VLearn AI",
        }

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        response = await client.post(url, headers=headers, json=body)
    return response.status_code, _safe_json(response)


async def call_agent_turn(model, system_instruction, contents, tools, temperature=0.3):
    """Mirror buildGeminiAgentRequest - chi Gemini ho tro function-calling trong ban nay."""
    if not GEMINI_API_KEY:
        raise ProviderError(401, "Server thieu GEMINI_API_KEY trong .env")
    selected_model = (model or "").strip() or GEMINI_MODEL
    selected_temperature = _clamp_temperature(temperature, 0.3)

    body = {
        **({"systemInstruction": {"parts": [{"text": system_instruction}]}} if system_instruction else {}),
        "contents": contents,
        **({"tools": [{"functionDeclarations": tools}]} if tools else {}),
        "generationConfig": {"temperature": selected_temperature},
    }
    url = f"{GEMINI_BASE}/{quote(selected_model, safe='')}:generateContent"
    headers = {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        response = await client.post(url, headers=headers, json=body)
    return response.status_code, _safe_json(response)


async def call_embed(texts, task_type="RETRIEVAL_DOCUMENT", model=None):
    """Mirror buildGeminiEmbedRequest (batchEmbedContents). Tra ve
    (status_code, vectors|None) - vectors la list[list[float]] dung thu tu voi texts."""
    if not GEMINI_API_KEY:
        raise ProviderError(401, "Server thieu GEMINI_API_KEY trong .env")
    selected_model = model or GEMINI_EMBEDDING_MODEL
    qualified_model = f"models/{selected_model}"
    body = {
        "requests": [
            {
                "model": qualified_model,
                "content": {"parts": [{"text": str(text)[:8_000]}]},
                "taskType": task_type,
            }
            for text in texts
        ]
    }
    url = f"{GEMINI_BASE}/{quote(selected_model, safe='')}:batchEmbedContents"
    headers = {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        response = await client.post(url, headers=headers, json=body)
    payload = _safe_json(response)
    if response.status_code != 200:
        return response.status_code, None

    embeddings = (payload or {}).get("embeddings")
    if not isinstance(embeddings, list) or not embeddings:
        return response.status_code, None
    vectors = [item.get("values") for item in embeddings]
    if any(not isinstance(vector, list) for vector in vectors):
        return response.status_code, None
    return response.status_code, vectors
