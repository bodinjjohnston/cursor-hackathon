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
        model: 'mixtral-8x7b-32768',
        max_tokens: 1500,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a startup market analyst. Always respond with valid JSON only. No markdown. No explanation. Just JSON.'
          },
          {
            role: 'user',
            content: `Analyze this startup idea: "${idea}"

Respond with this exact JSON structure:
{
  "demand_signals": ["signal 1", "signal 2", "signal 3"],
  "competition": ["competitor 1", "competitor 2"],
  "red_flags": ["risk 1", "risk 2"],
  "market_gaps": ["gap 1", "gap 2"],
  "verdict": "One sentence verdict on whether to pursue this.",
  "verdict_label": "GO",
  "roadmap": [
    {
      "step": 1,
      "phase": "Legal",
      "title": "Register your business",
      "description": "Set up legal entity and get required licenses.",
      "priority": "immediate",
      "sources": [{"name": "IRS Business Registration", "url": "https://www.irs.gov/businesses"}],
      "contacts": [{"name": "SCORE Mentors", "url": "https://www.score.org", "reason": "Free startup advice"}]
    },
    {
      "step": 2,
      "phase": "Research",
      "title": "Validate with real users",
      "description": "Talk to 10 potential customers before building.",
      "priority": "immediate",
      "sources": [{"name": "Y Combinator How to Start", "url": "https://www.ycombinator.com/library/6g-how-to-talk-to-users"}],
      "contacts": [{"name": "LinkedIn", "url": "https://www.linkedin.com", "reason": "Find target customers"}]
    },
    {
      "step": 3,
      "phase": "Build",
      "title": "Build MVP",
      "description": "Build minimum viable product in 4 weeks.",
      "priority": "short-term",
      "sources": [{"name": "Lovable.dev", "url": "https://lovable.dev"}],
      "contacts": [{"name": "Indie Hackers", "url": "https://www.indiehackers.com", "reason": "Find technical co-founder"}]
    },
    {
      "step": 4,
      "phase": "Launch",
      "title": "Launch publicly",
      "description": "Post on Product Hunt and relevant communities.",
      "priority": "short-term",
      "sources": [{"name": "Product Hunt", "url": "https://www.producthunt.com"}],
      "contacts": [{"name": "Product Hunt", "url": "https://www.producthunt.com/posts/new", "reason": "Submit your launch"}]
    },
    {
      "step": 5,
      "phase": "Grow",
      "title": "Get first paying customers",
      "description": "Convert free users to paid within 30 days.",
      "priority": "long-term",
      "sources": [{"name": "Stripe Atlas", "url": "https://stripe.com/atlas"}],
      "contacts": [{"name": "AngelList", "url": "https://www.angellist.com", "reason": "Find early investors"}]
    }
  ]
}

Replace all values with real analysis of the idea. verdict_label must be GO, CAUTION, or STOP.`
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
