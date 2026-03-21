interface StreamOptions {
    provider: 'google' | 'openai' | 'anthropic';
    model: string;
    apiKey: string;
    messages: Array<{ role: string; content: string }>;
    onToken: (token: string) => void;
}

export async function streamAIResponse(options: StreamOptions): Promise<void> {
    const { provider, model, apiKey, messages, onToken } = options;

    switch (provider) {
        case 'google':
            return streamGemini(model, apiKey, messages, onToken);
        case 'openai':
            return streamOpenAI(model, apiKey, messages, onToken);
        case 'anthropic':
            return streamAnthropic(model, apiKey, messages, onToken);
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}

async function streamGemini(
    model: string,
    apiKey: string,
    messages: Array<{ role: string; content: string }>,
    onToken: (token: string) => void
): Promise<void> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr || jsonStr === '[DONE]') continue;
                try {
                    const data = JSON.parse(jsonStr);
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) onToken(text);
                } catch {
                    // skip malformed JSON
                }
            }
        }
    }
}

async function streamOpenAI(
    model: string,
    apiKey: string,
    messages: Array<{ role: string; content: string }>,
    onToken: (token: string) => void
): Promise<void> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === '[DONE]') return;
                try {
                    const data = JSON.parse(jsonStr);
                    const text = data.choices?.[0]?.delta?.content;
                    if (text) onToken(text);
                } catch {
                    // skip
                }
            }
        }
    }
}

async function streamAnthropic(
    model: string,
    apiKey: string,
    messages: Array<{ role: string; content: string }>,
    onToken: (token: string) => void
): Promise<void> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            max_tokens: 4096,
            messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === '[DONE]') return;
                try {
                    const data = JSON.parse(jsonStr);
                    if (data.type === 'content_block_delta' && data.delta?.text) {
                        onToken(data.delta.text);
                    }
                } catch {
                    // skip
                }
            }
        }
    }
}
