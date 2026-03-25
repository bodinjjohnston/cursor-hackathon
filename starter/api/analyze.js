export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { idea } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `You are a brutally honest market validation analyst. Search the real web for evidence. Return ONLY valid JSON with no markdown, no backticks, no extra text: {"demand_signals":["signal 1","signal 2","signal 3"],"competition":["insight 1","insight 2"],"red_flags":["flag 1","flag 2"],"market_gaps":["gap 1","gap 2"],"verdict":"2-3 sentence verdict with specific evidence.","verdict_label":"GO"}. verdict_label must be exactly GO, CAUTION, or STOP.`,
        messages: [{ role: 'user', content: `Validate this app idea: "${idea}"` }]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    const textBlock = data.content.find(b => b.type === 'text');
    if (!textBlock) return res.status(500).json({ error: 'No response' });
    const clean = textBlock.text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}
