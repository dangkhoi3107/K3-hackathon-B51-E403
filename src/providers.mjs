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
    defaultModel: 'gemini-2.5-flash',
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
  origin = ''
}) {
  const provider = getProviderConfig(providerId);
  const selectedModel = String(model ?? '').trim() || provider.defaultModel;
  const prompt = String(promptText ?? '');
  const selectedTemperature = Number.isFinite(Number(temperature))
    ? Math.min(1, Math.max(0, Number(temperature)))
    : json ? 0.1 : 0.2;

  if (provider.id === 'gemini') {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
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
