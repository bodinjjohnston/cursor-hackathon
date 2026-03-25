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
        model: 'llama3-70b-8192',
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a startup analyst. Always respond with valid JSON only. No markdown. No extra text.'
          },
          {
            role: 'user',
            content: `Analyze this startup idea: "${idea}"

Respond with exactly this JSON structure, filling in real values:
{
  "demand_signals": ["real finding 1", "real finding 2", "real finding 3"],
  "competition": ["real competitor 1", "real competitor 2"],
  "red_flags": ["real risk 1", "real risk 2"],
  "market_gaps": ["real opportunity 1", "real opportunity 2"],
  "verdict": "One clear sentence about whether to pursue this idea.",
  "verdict_label": "GO"
}

verdict_label must be GO, CAUTION, or STOP.`
          }
        ]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    const raw = data.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}
