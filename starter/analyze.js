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
            content: 'You are a startup market analyst. When asked to analyze an idea, provide specific real insights based on your knowledge. Never use placeholder text like s1, s2, c1. Always write actual findings. Use simple words with no apostrophes or special characters.'
          },
          {
            role: 'user',
            content: `Analyze this startup idea: ${idea}

Write specific real insights about this exact idea. Return this JSON with actual content:
{
  "demand_signals": ["specific real signal about this idea", "another real signal", "third real signal"],
  "competition": ["name a real competitor", "name another real competitor"],
  "red_flags": ["specific real risk for this idea", "another real risk"],
  "market_gaps": ["specific real opportunity", "another real opportunity"],
  "verdict": "Specific sentence about whether this idea is worth pursuing and why.",
  "verdict_label": "GO"
}

verdict_label must be GO, CAUTION, or STOP based on your analysis.`
          }
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
