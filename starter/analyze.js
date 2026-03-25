export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const idea = req.body.idea;
    const systemPrompt = `You are a startup advisor. Return ONLY valid JSON with no markdown or backticks.
The JSON must have these exact keys:
demand_signals: array of 3 strings
competition: array of 2 strings  
red_flags: array of 2 strings
market_gaps: array of 2 strings
verdict: one sentence string
verdict_label: exactly GO or CAUTION or STOP
roadmap: array of exactly 5 objects each with: step number, phase string, title string, description string under 15 words, priority string of immediate or short-term or long-term, sources array with one object having name and url, contacts array with one object having name url and reason`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 1500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Validate this startup idea and create a launch roadmap: ' + idea }
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
