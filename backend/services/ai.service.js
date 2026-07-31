function resolveProvider() {
  const p = (process.env.AI_PROVIDER || '').toLowerCase().trim();
  if (p === 'groq' || p === 'ollama') return p;
  if (process.env.GROQ_API_KEY) return 'groq';
  return 'ollama';
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callGroq(messages) {
  const res = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.4,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    },
    30000
  );
  if (!res.ok) throw new Error('Groq HTTP ' + res.status);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callOllama(messages) {
  const base = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/+$/, '');
  const res = await fetchWithTimeout(
    base + '/api/chat',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.2',
        messages,
        stream: false,
        format: 'json',
        options: { temperature: 0.4 },
      }),
    },
    90000
  );
  if (!res.ok) throw new Error('Ollama HTTP ' + res.status);
  const data = await res.json();
  return data.message?.content || '';
}

function extractJSON(text) {
  const t = String(text || '').trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) return t.slice(start, end + 1);
  return t;
}

async function chatJSON(system, user) {
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
  const provider = resolveProvider();
  try {
    let content;
    if (provider === 'groq') {
      if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
      content = await callGroq(messages);
    } else {
      content = await callOllama(messages);
    }
    const parsed = JSON.parse(extractJSON(content));
    if (parsed && typeof parsed === 'object') {
      return { source: 'ai', provider, data: parsed };
    }
    throw new Error('AI returned invalid JSON');
  } catch (err) {
    console.warn(`[ai] ${provider} failed (${err.message}) — using smart fallback`);
    return { source: 'fallback', provider, data: null };
  }
}

module.exports = { chatJSON, resolveProvider };
