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
          { role: 'system', content: 'You are a startup analyst. Respond with valid JSON only. Use simple ASCII characters only in your response. No apostrophes in values - use plain words instead.' },
          { role: 'user', content: 'Analyze this startup idea in JSON: ' + idea.replace(/['"]/g, '') + '. Return: {"demand_signals":["s1","s2","s3"],"competition":["c1","c2"],"red_flags":["r1","r2"],"market_gaps":["g1","g2"],"verdict":"one sentence","verdict_label":"GO or CAUTION or STOP"}' }
        ]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    const raw = data.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, '').replace(/[\u2018\u2019\u201c\u201d]/g, '"').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}
