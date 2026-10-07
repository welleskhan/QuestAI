export default async function handler(req, res) {
    // Permite CORS para o seu frontend
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { provider, model, prompt } = req.body;

    try {
        let aiResponse = '';

        if (provider === 'openai') {
            const apiKey = process.env.OPENAI_API_KEY;
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
            aiResponse = data.choices[0].message.content.trim();

        } else if (provider === 'grok') {
            const apiKey = process.env.XAI_API_KEY;
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: model || 'grok-2-latest',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            aiResponse = data.choices[0].message.content.trim();

        } else if (provider === 'claude') {
            const apiKey = process.env.CLAUDE_API_KEY;
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
            if (data.error) throw new Error(data.error.message);
            aiResponse = data.content[0].text.trim();

        } else if (provider === 'gemini') {
            const apiKey = process.env.GEMINI_API_KEY;
            const selectedModel = model || 'gemini-2.5-flash';
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
            aiResponse = data.candidates[0].content.parts[0].text.trim();

        } else {
            return res.status(400).json({ error: 'Provedor de IA inválido' });
        }

        return res.status(200).json({ result: aiResponse });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
