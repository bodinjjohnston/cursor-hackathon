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
        max_tokens: 1200,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `You are a startup analyst. Analyze this idea: "${idea}"

Return ONLY this JSON with no other text:
{
  "demand_signals": ["finding 1", "finding 2", "finding 3"],
  "competition": ["competitor 1", "competitor 2"],
  "red_flags": ["risk 1", "risk 2"],
  "market_gaps": ["opportunity 1", "opportunity 2"],
  "verdict": "One clear sentence on whether to pursue this.",
  "verdict_label": "GO",
  "roadmap": [
    {"step": 1, "phase": "Legal", "title": "Register Business", "description": "Set up legal entity and licenses.", "priority": "immediate", "sources": [{"name": "IRS.gov", "url": "https://www.irs.gov/businesses"}], "contacts": [{"name": "SCORE", "url": "https://www.score.org", "reason": "Free mentoring"}]},
    {"step": 2, "phase": "Research", "title": "Validate with Users", "description": "Interview 10 target customers.", "priority": "immediate", "sources": [{"name": "YC User Research", "url": "https://www.ycombinator.com/library/6g-how-to-talk-to-users"}], "contacts": [{"name": "LinkedIn", "url": "https://www.linkedin.com", "reason": "Find customers"}]},
    {"step": 3, "phase": "Build", "title": "Build MVP", "description": "Launch basic version in 4 weeks.", "priority": "short-term", "sources": [{"name": "Lovable", "url": "https://lovable.dev"}], "contacts": [{"name": "Indie Hackers", "url": "https://www.indiehackers.com", "reason": "Find co-founder"}]},
    {"step": 4, "phase": "Launch", "title": "Go Public", "description": "Launch on Product Hunt and Reddit.", "priority": "short-term", "sources": [{"name": "Product Hunt", "url": "https://www.producthunt.com"}], "contacts": [{"name": "Product Hunt", "url": "https://www.producthunt.com/posts/new", "reason": "Submit launch"}]},
    {"step": 5, "phase": "Grow", "title": "Get Paying Users", "description": "Convert free users to paid.", "priority": "long-term", "sources": [{"name": "Stripe", "url": "https://stripe.com"}], "contacts": [{"name": "AngelList", "url": "https://www.angellist.com", "reason": "Find investors"}]}
  ]
}

Replace demand_signals, competition, red_flags, market_gaps, verdict, and verdict_label with real analysis. Keep the roadmap structure but customize titles and descriptions. verdict_label must be GO, CAUTION, or STOP.`
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
