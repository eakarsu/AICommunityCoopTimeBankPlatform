const express = require('express');
const fetch = require('node-fetch');
const auth = require('../middleware/auth');
const pool = require('../db');
const router = express.Router();

const SERVICE_TITLE = 'AI Community Coop Time Bank Platform';

async function callOpenRouter(prompt, systemPrompt, model) {
  const chosenModel = model || process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': SERVICE_TITLE,
    },
    body: JSON.stringify({
      model: chosenModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 3000,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'OpenRouter API error');
  return {
    content: data.choices[0].message.content,
    model: chosenModel,
    tokens: data.usage?.total_tokens || null,
  };
}

async function persistResult(userId, endpoint, params, result) {
  try {
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, request_params, result_text, model_used, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, endpoint, JSON.stringify(params), result.content, result.model, result.tokens]
    );
  } catch (err) {
    console.error('Failed to persist AI result:', err.message);
  }
}

async function ensureAiTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      endpoint VARCHAR(100) NOT NULL,
      request_params JSONB,
      result_text TEXT NOT NULL,
      model_used VARCHAR(100),
      tokens_used INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
ensureAiTables().catch(console.error);

router.get('/history', auth, async (req, res) => {
  try {
    const { endpoint, limit = 20, offset = 0 } = req.query;
    let query = `SELECT id, endpoint, request_params, result_text, model_used, tokens_used, created_at
                 FROM ai_results WHERE user_id = $1`;
    const params = [req.user.id];
    if (endpoint) { params.push(endpoint); query += ` AND endpoint = $${params.length}`; }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    res.json({ results: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 1. Skill-need matching: match a member's skill offering to nearby member needs
router.post('/skill-match', auth, async (req, res) => {
  try {
    const { memberSkills, memberNeeds, neighborhood, availability } = req.body;
    const prompt = `Match this time-bank member to community exchange opportunities:
SKILLS OFFERED: ${memberSkills || 'Unspecified'}
NEEDS REQUESTED: ${memberNeeds || 'Unspecified'}
NEIGHBORHOOD: ${neighborhood || 'Unspecified'}
AVAILABILITY: ${availability || 'Unspecified'}

Recommend top 5 reciprocal matches, explain why each is mutually beneficial, and estimate hours per exchange.`;
    const systemPrompt = `You are a time-bank coordinator who maximizes reciprocal community value. Prioritize matches where both members give and receive.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'skill-match', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Time-credit value advisor
router.post('/credit-valuation', auth, async (req, res) => {
  try {
    const { taskDescription, durationHours, complexity, riskLevel } = req.body;
    const prompt = `Recommend a fair time-credit value for this exchange:
TASK: ${taskDescription || 'Unspecified'}
DURATION: ${durationHours || 'Unknown'} hours
COMPLEXITY: ${complexity || 'Standard'}
RISK / LIABILITY: ${riskLevel || 'Low'}

Note: a core principle of time-banking is that all hours are equally valued. Recommend a credit value and explain whether modifiers (complexity, risk, materials cost) should be tracked separately. Suggest dispute-resolution language.`;
    const systemPrompt = `You are a time-bank governance advisor. Respect time-banking's egalitarian principle (1 hour = 1 credit) while flagging cases that need separate compensation streams.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'credit-valuation', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Member onboarding interview
router.post('/onboarding-interview', auth, async (req, res) => {
  try {
    const { memberName, background, goals, language } = req.body;
    const prompt = `Conduct a structured time-bank onboarding interview for a new member:
NAME: ${memberName || 'New member'}
BACKGROUND: ${background || 'Unspecified'}
GOALS FOR JOINING: ${goals || 'Unspecified'}
PREFERRED LANGUAGE: ${language || 'English'}

Generate: a 12-question warm interview script, expected skills inventory questions, and a starter list of suggested first exchanges this member could perform or request in week 1.`;
    const systemPrompt = `You are a community-organizer. Be warm and culturally sensitive. Keep questions concrete and non-intrusive.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'onboarding-interview', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Exchange dispute mediator
router.post('/dispute-mediation', auth, async (req, res) => {
  try {
    const { partyAStatement, partyBStatement, exchangeContext, creditsAtStake } = req.body;
    const prompt = `Mediate this time-bank exchange dispute:
PARTY A: ${partyAStatement || 'Not provided'}
PARTY B: ${partyBStatement || 'Not provided'}
CONTEXT: ${exchangeContext || 'Not provided'}
CREDITS AT STAKE: ${creditsAtStake || 'Unknown'}

Output: neutral summary of facts, identify the disagreement type (quality / time / scope), three resolution options ranked by fairness, and a script the steward can use to facilitate a member-led conversation.`;
    const systemPrompt = `You are a restorative-justice mediator. Be neutral. Avoid blame language. Always preserve the relationship between members where possible.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'dispute-mediation', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Reputation analysis
router.post('/reputation-analysis', auth, async (req, res) => {
  try {
    const { memberId, exchangeHistory, peerFeedback } = req.body;
    const prompt = `Analyze a time-bank member's reputation signals:
MEMBER ID: ${memberId || 'Unspecified'}
EXCHANGE HISTORY: ${exchangeHistory || 'Not provided'}
PEER FEEDBACK: ${peerFeedback || 'Not provided'}

Provide: a 0-100 reliability score, top 3 strengths, top 2 growth areas, and any concerning patterns (cancellations, complaints, scope creep).`;
    const systemPrompt = `You are a community-trust analyst. Use evidence from history; never speculate. Always frame growth areas constructively.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'reputation-analysis', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Demand forecast
router.post('/demand-forecast', auth, async (req, res) => {
  try {
    const { neighborhood, season, recentTrends } = req.body;
    const prompt = `Forecast time-bank exchange demand for the next 90 days:
NEIGHBORHOOD: ${neighborhood || 'General'}
SEASON: ${season || 'Unspecified'}
RECENT TRENDS: ${recentTrends || 'None provided'}

Output: top 10 services likely to be requested, top 10 skills likely to be in short supply, recommended recruiting targets (skill type), and 3 events the coop should organize to balance supply.`;
    const systemPrompt = `You are a community operations analyst. Be specific to season and neighborhood demographics. Recommend supply-side recruitment to fix imbalances.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'demand-forecast', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. Governance proposal helper
router.post('/governance-proposal', auth, async (req, res) => {
  try {
    const { issue, options, stakeholders } = req.body;
    const prompt = `Draft a coop governance proposal:
ISSUE: ${issue || 'Unspecified'}
OPTIONS UNDER CONSIDERATION: ${options || 'Unspecified'}
STAKEHOLDERS: ${stakeholders || 'All members'}

Produce: a one-page proposal with background, decision, alternatives considered, expected impact, dissent risks, voting mechanism recommendation (consensus / majority / sociocracy), and a 2-week deliberation timeline.`;
    const systemPrompt = `You are a cooperative governance facilitator. Use sociocratic and consent-based decision-making patterns. Always include dissent considerations.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'governance-proposal', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 8. Skill gap analysis
router.post('/skill-gap', auth, async (req, res) => {
  try {
    const { currentSkills, communityNeeds, recruitmentBudget } = req.body;
    const prompt = `Analyze the coop's skill gap:
CURRENT MEMBER SKILLS: ${currentSkills || 'Unspecified'}
COMMUNITY NEEDS BACKLOG: ${communityNeeds || 'Unspecified'}
RECRUITMENT BUDGET: ${recruitmentBudget || 'Volunteer-only'}

Output: ranked list of missing skills, recruitment channels for each (which local orgs / schools to partner with), low-effort training paths existing members could pursue, and a 60-day skill-fill plan.`;
    const systemPrompt = `You are a community workforce planner. Prioritize closing gaps via internal training before external recruitment.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'skill-gap', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 9. Multi-modal listing description (text from voice/photo)
router.post('/listing-from-description', auth, async (req, res) => {
  try {
    const { rawDescription, language, accessibility } = req.body;
    const prompt = `Convert this informal description into a clean time-bank listing:
RAW DESCRIPTION: ${rawDescription || 'Not provided'}
LANGUAGE: ${language || 'English'}
ACCESSIBILITY NOTES: ${accessibility || 'None'}

Produce: title, 80-word description, skills required, time estimate, location requirements, accessibility tags, and 5 search keywords.`;
    const systemPrompt = `You are a community-listing editor. Use plain language. Be inclusive and avoid jargon. Make accessibility info explicit.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'listing-from-description', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 10. Community impact report
router.post('/impact-report', auth, async (req, res) => {
  try {
    const { period, totalHours, exchangeCount, demographics } = req.body;
    const prompt = `Draft a community impact report for our time-bank coop:
PERIOD: ${period || 'Quarter'}
TOTAL HOURS EXCHANGED: ${totalHours || 0}
EXCHANGE COUNT: ${exchangeCount || 0}
MEMBER DEMOGRAPHICS: ${demographics || 'Unspecified'}

Produce: executive summary, 5 KPIs with interpretation, story-style highlights of 3 exchanges (anonymized), funder-friendly outcomes section, and 3 recommendations for next quarter.`;
    const systemPrompt = `You are a nonprofit impact reporter. Use plain language for funders. Quantify wherever possible. Tell stories with permission.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    await persistResult(req.user.id, 'impact-report', req.body, result);
    res.json({ result: result.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
