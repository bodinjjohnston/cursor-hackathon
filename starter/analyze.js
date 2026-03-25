export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const idea = req.body.idea;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: `You are a startup advisor. Return ONLY valid JSON no markdown:
{"demand_signals":["s1","s2","s3"],"competition":["c1","c2"],"red_flags":["r1","r2"],"market_gaps":["g1","g2"],"verdict":"One sentence.","verdict_label":"GO","roadmap":[{"step":1,"phase":"P","title":"T","description":"D.","priority":"immediate","sources":[{"name":"N","url":"https://example.com"}],"contacts":[{"name":"N","url":"https://example.com","reason":"R"}]},{"step":2,"phase":"P","title":"T","description":"D.","priority":"immediate","sources":[{"name":"N","url":"https://example.com"}],"contacts":[{"name":"N","url":"https://example.com","reason":"R"}]},{"step":3,"phase":"P","title":"T","description":"D.","priority":"short-term","sources":[{"name":"N","url":"https://example.com"}],"contacts":[{"name":"N","url":"https://example.com","reason":"R"}]},{"step":4,"phase":"P","title":"T","description":"D.","priority":"short-term","sources":[{"name":"N","url":"https://example.com"}],"contacts":[{"name":"N","url":"https://example.com","reason":"R"}]},{"step":5,"phase":"P","title":"T","description":"D.","priority":"long-term","sources":[{"name":"N","url":"https://example.com"}],"contacts":[{"name":"N","url":"https://example.com","reason":"R"}]}]}
Fill in real values. verdict_label = GO CAUTION or STOP. If licenses needed step 1 = Legal. All text under 12 words. Use real known URLs.`,
        messages: [{ role: 'user', content: 'Validate: "' + idea + '"' }]
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
