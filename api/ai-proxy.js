export default async function handler(req, res) {
    // Configuração de CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { provider, model, prompt } = req.body || {};

    if (!prompt) {
        return res.status(400).json({ error: 'O campo prompt é obrigatório' });
    }

    try {
        let aiResponse = '';

        if (provider === 'openai') {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error('OPENAI_API_KEY não configurada no ambiente');

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: model || 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            aiResponse = data.choices?.[0]?.message?.content?.trim();

        } else if (provider === 'grok') {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error('XAI_API_KEY não configurada no ambiente');

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'grok-3',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    if (data.error) {
      const errMsg = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
      throw new Error(`Erro da xAI: ${errMsg}`);
    }
    aiResponse = data.choices?.[0]?.message?.content?.trim();

        } else if (provider === 'claude') {
            const apiKey = process.env.CLAUDE_API_KEY;
            if (!apiKey) throw new Error('CLAUDE_API_KEY não configurada no ambiente');

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: model || 'claude-3-5-sonnet-20241022',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
            aiResponse = data.content?.[0]?.text?.trim();

        } else if (provider === 'gemini') {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error('GEMINI_API_KEY não configurada no ambiente');

            const selectedModel = model || 'gemini-3.8-flash';
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }]
                    })
                }
            );
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        } else {
            return res.status(400).json({ error: 'Provedor de IA inválido' });
        }

        return res.status(200).json({ result: aiResponse });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
