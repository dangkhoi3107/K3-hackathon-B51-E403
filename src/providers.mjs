export const AI_PROVIDERS = Object.freeze({
  openrouter: Object.freeze({
    id: 'openrouter',
    label: 'OpenRouter',
    defaultModel: 'openrouter/free',
    keyPlaceholder: 'OpenRouter API Key'
  }),
  gemini: Object.freeze({
    id: 'gemini',
    label: 'Gemini',
    defaultModel: 'gemini-3.1-flash-lite',
    keyPlaceholder: 'Gemini API Key'
  })
});

export function getProviderConfig(providerId) {
  return AI_PROVIDERS[providerId] ?? AI_PROVIDERS.openrouter;
}

export function buildProviderRequest({
  providerId,
  apiKey,
  model,
  promptText,
  json = false,
  temperature,
  origin = '',
  imageBase64 = '',
  imageMimeType = 'image/png'
}) {
  const provider = getProviderConfig(providerId);
  const selectedModel = String(model ?? '').trim() || provider.defaultModel;
  const prompt = String(promptText ?? '');
  const selectedTemperature = Number.isFinite(Number(temperature))
    ? Math.min(1, Math.max(0, Number(temperature)))
    : json ? 0.1 : 0.2;

  if (provider.id === 'gemini') {
    const parts = [{ text: prompt }];
    if (imageBase64) {
      parts.push({ inline_data: { mime_type: imageMimeType, data: imageBase64 } });
    }
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: selectedTemperature,
            ...(json ? { responseMimeType: 'application/json' } : {})
          }
        })
      }
    };
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'X-OpenRouter-Title': 'VLearn AI'
  };
  if (/^https?:\/\//i.test(origin)) headers['HTTP-Referer'] = origin;

  return {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    options: {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: selectedTemperature
      })
    }
  };
}

// Agent thật (function calling) — chỉ Gemini hỗ trợ trong bản này. Khác với
// buildProviderRequest (luôn 1 prompt -> 1 câu trả lời), hàm này cho phép model
// TỰ QUYẾT ĐỊNH gọi tool nào trong danh sách, nhiều vòng, trước khi trả lời -
// code chỉ thực thi tool model chọn, không quyết định thay model.
export function buildGeminiAgentRequest({ apiKey, model, systemInstruction, contents, tools, temperature }) {
  const selectedModel = String(model ?? '').trim() || AI_PROVIDERS.gemini.defaultModel;
  const selectedTemperature = Number.isFinite(Number(temperature))
    ? Math.min(1, Math.max(0, Number(temperature)))
    : 0.3;
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent`,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        contents,
        ...(tools?.length ? { tools: [{ functionDeclarations: tools }] } : {}),
        generationConfig: { temperature: selectedTemperature }
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
