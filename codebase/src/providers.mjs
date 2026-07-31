export const AI_PROVIDERS = Object.freeze({
  openrouter: Object.freeze({
    id: 'openrouter',
    label: 'OpenRouter',
    defaultModel: 'openrouter/free'
  }),
  gemini: Object.freeze({
    id: 'gemini',
    label: 'Gemini',
    defaultModel: 'gemini-3.1-flash-lite'
  })
});

export function getProviderConfig(providerId) {
  return AI_PROVIDERS[providerId] ?? AI_PROVIDERS.openrouter;
}

// Build request tới BACKEND cục bộ (server/), không còn gọi thẳng Gemini/OpenRouter
// từ trình duyệt — key không còn nằm ở client. Server nhận providerId/model rồi tự
// gắn key của nó (đọc từ .env), gọi provider thật đúng 1 lần và trả nguyên payload
// gốc về, nên parseProviderResponse ở dưới không cần đổi gì.
export function buildProviderRequest({
  providerId,
  model,
  promptText,
  json = false,
  temperature,
  imageBase64 = '',
  imageMimeType = 'image/png',
  images = []
}) {
  const provider = getProviderConfig(providerId);
  return {
    url: '/api/llm/generate',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: provider.id,
        model: String(model ?? '').trim() || provider.defaultModel,
        promptText: String(promptText ?? ''),
        json,
        temperature,
        imageBase64,
        imageMimeType,
        images
      })
    }
  };
}

// Agent thật (function calling) — chỉ Gemini hỗ trợ trong bản này. Khác với
// buildProviderRequest (luôn 1 prompt -> 1 câu trả lời), hàm này cho phép model
// TỰ QUYẾT ĐỊNH gọi tool nào trong danh sách, nhiều vòng, trước khi trả lời -
// code chỉ thực thi tool model chọn, không quyết định thay model. Cũng đi qua
// backend cục bộ, không còn cần apiKey ở client.
export function buildGeminiAgentRequest({ model, systemInstruction, contents, tools, temperature }) {
  return {
    url: '/api/llm/agent-turn',
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: String(model ?? '').trim() || AI_PROVIDERS.gemini.defaultModel,
        systemInstruction: systemInstruction || null,
        contents,
        tools: tools?.length ? tools : null,
        temperature
      })
    }
  };
}

// Trả về { type: 'functionCall', name, args } nếu model chọn gọi tool,
// hoặc { type: 'text', text } nếu model đã quyết định trả lời luôn.
export function parseGeminiAgentResponse(payload) {
  const modelContent = payload?.candidates?.[0]?.content;
  const parts = modelContent?.parts ?? [];
  const functionCallPart = parts.find(part => part?.functionCall);
  if (functionCallPart) {
    return {
      type: 'functionCall',
      name: functionCallPart.functionCall.name,
      args: functionCallPart.functionCall.args ?? {},
      modelTurn: modelContent
    };
  }
  return {
    type: 'text',
    text: parts.map(part => part?.text ?? '').join('').trim(),
    modelTurn: modelContent
  };
}

export function parseProviderResponse(providerId, payload) {
  const provider = getProviderConfig(providerId);
  if (provider.id === 'gemini') {
    return String(
      payload?.candidates?.[0]?.content?.parts
        ?.map(part => part?.text ?? '')
        .join('') ?? ''
    ).trim();
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map(part => typeof part === 'string' ? part : part?.text ?? '')
      .join('')
      .trim();
  }
  return '';
}

export function isRetryableProviderStatus(status) {
  const code = Number(status);
  return code === 408 || code === 429 || code >= 500;
}
