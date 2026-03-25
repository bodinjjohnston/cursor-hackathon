export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const idea = req.body.idea;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: 'gemma2-9b-it',
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `Analyze this startup idea: "${idea}"

Return ONLY this JSON:
{
  "demand_signals": ["finding 1", "finding 2", "finding 3"],
  "competition": ["competitor 1", "competitor 2"],
  "red_flags": ["risk 1", "risk 2"],
  "market_gaps": ["opportunity 1", "opportunity 2"],
  "verdict": "One sentence verdict.",
  "verdict_label": "GO"
}

Replace all values with real analysis. verdict_label must be GO, CAUTION, or STOP. Return only JSON.`
          }
        ]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    const clean = data.choices[0].message.content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}
