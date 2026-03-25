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
        system: `You are a brutally honest market validation analyst for startup ideas.
You must search the real web for evidence (including primary sources) before answering.

Return ONLY valid JSON (no markdown, no backticks, no extra text) with this exact structure:
{
  "demand_signals": ["signal 1","signal 2","signal 3"],
  "competition": ["insight 1","insight 2","insight 3"],
  "red_flags": ["flag 1","flag 2","flag 3"],
  "market_gaps": ["gap 1","gap 2","gap 3"],
  "verdict": "2-3 sentence brutally honest verdict with specific evidence and citations (URLs) embedded in the text.",
  "verdict_label": "GO",
  "roadmap": [
    {
      "step_number": 1,
      "phase_name": "Phase name",
      "title": "Short step title",
      "description": "Actionable description of what to do and why. If licenses/permits/compliance are needed, put that work first (step_number = 1).",
      "priority": "immediate",
      "sources": [
        { "name": "Source name", "url": "https://example.com" }
      ],
      "contacts": [
        { "name": "Contact/Org name", "url": "https://example.com", "reason": "Why this contact matters for this step." }
      ]
    }
  ]
}

Rules:
- verdict_label must be exactly "GO", "CAUTION", or "STOP".
- roadmap must have exactly 5 to 7 items.
- roadmap must be tailored specifically to the provided idea.
- If any licenses, permits, standards, or compliance requirements are likely relevant to the idea, include a licensing/compliance step as step_number = 1.
- Each roadmap step MUST include:
  - step_number (integer),
  - phase_name (string),
  - title (string),
  - description (string),
  - priority ("immediate", "short-term", or "long-term"),
  - sources (array of 1-3 items; each item has name + REAL url),
  - contacts (array of 1-3 items; each item has name + REAL url + reason).
- You must search the web for real URLs for sources and contacts. Do not invent URLs or placeholder domains.
- Keep the JSON parseable (double quotes, no trailing commas, no markdown).
`,
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
