export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const idea = req.body.idea;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1500,
        messages: [
          { role: 'system', content: 'You are a startup advisor. Return ONLY valid JSON no markdown: {"demand_signals":["s1","s2","s3"],"competition":["c1","c2"],"red_flags":["r1","r2"],"market_gaps":["g1","g2"],"verdict":"One sentence.","verdict_label":"GO","roadmap":[{"step":1,"phase":"Legal","title":"Title","description":"Description.","priority":"immediate","sources":[{"name":"Name","url":"https://example.com"}],"contacts":[{"name":"Name","url":"https://example.com","reason":"Why"}]},{"step":2,"phase":"Research","title":"Title","description":"Description.","priority":"immediate","sources":[{"name":"Name","url":"https://example.com"}],"contacts":[{"name":"Name","url":"https://example.com","reason":"Why"}]},{"step":3,"phase":"Build","title":"Title","description":"Description.","priority":"short-term","sources":[{"name":"Name","url":"https://example.com"}],"contacts":[{"name":"Name","url":"https://example.com","reason":"Why"}]},{"step":4,"phase":"Launch","title":"Title","description":"Description.","priority":"short-term","sources":[{"name":"Name","url":"https://example.com"}],"contacts":[{"name":"Name","url":"https://example.com","reason":"Why"}]},{"step":5,"phase":"Grow","title":"Title","description":"Description.","priority":"long-term","sources":[{"name":"Name","url":"https://example.com"}],"contacts":[{"name":"Name","url":"https://example.com","reason":"Why"}]}]} verdict_label must be GO CAUTION or STOP.' },
          { role: 'user', content: 'Validate: "' + idea + '"' }
        ]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    const clean = data.choices[0].message.content.replace(/```json|```/g, '').trim();
    res.status(200).json(JSON.parse(clean));
  } catch (err) {
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}
