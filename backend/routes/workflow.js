'use strict';
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { normalizeHours, scoreMatch, requireRole } = require('../domain/timebankPolicy');

async function membership(client, communityId, userId) {
  const result = await client.query('SELECT role, verification_status FROM tb_memberships WHERE community_id=$1 AND user_id=$2', [communityId, userId]);
  if (!result.rows.length) throw Object.assign(new Error('Community membership is required'), { statusCode: 403 });
  if (result.rows[0].verification_status !== 'verified') throw Object.assign(new Error('Verified membership is required'), { statusCode: 403 });
  return result.rows[0];
}
function fail(res, error) { res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Workflow failed' }); }

router.post('/communities/:communityId/listings', auth, async (req, res) => {
  try {
    const communityId = Number(req.params.communityId);
    await membership(pool, communityId, req.user.id);
    const { kind, title, skills = [] } = req.body;
    if (!['offer', 'request'].includes(kind) || !String(title || '').trim() || !Array.isArray(skills)) return res.status(400).json({ error: 'kind, title and skills are required' });
    const result = await pool.query('INSERT INTO tb_listings(community_id,member_id,kind,title,skills) VALUES($1,$2,$3,$4,$5) RETURNING *', [communityId, req.user.id, kind, title.trim(), skills.map(String)]);
    await pool.query("INSERT INTO tb_audit_events(community_id,actor_id,action,entity_type,entity_id,after_state,request_id) VALUES($1,$2,'listing.created','listing',$3,$4,$5)", [communityId, req.user.id, result.rows[0].id, result.rows[0], req.get('x-request-id') || null]);
    res.status(201).json(result.rows[0]);
  } catch (error) { fail(res, error); }
});

router.get('/communities/:communityId/matches', auth, async (req, res) => {
  try {
    const communityId = Number(req.params.communityId);
    await membership(pool, communityId, req.user.id);
    const result = await pool.query("SELECT id,community_id AS \"communityId\",member_id AS \"memberId\",kind,skills FROM tb_listings WHERE community_id=$1 AND status='open'", [communityId]);
    const offers = result.rows.filter((row) => row.kind === 'offer');
    const requests = result.rows.filter((row) => row.kind === 'request');
    const matches = offers.flatMap((offer) => requests.map((request) => scoreMatch(offer, request)).filter(Boolean)).sort((a, b) => b.score - a.score);
    res.json({ matches });
  } catch (error) { fail(res, error); }
});

router.post('/communities/:communityId/exchanges', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const communityId = Number(req.params.communityId);
    await membership(client, communityId, req.user.id);
    const key = req.get('idempotency-key');
    if (!key || key.length > 128) return res.status(400).json({ error: 'A bounded Idempotency-Key is required' });
    const hours = normalizeHours(req.body.agreedHours);
    await client.query('BEGIN');
    const result = await client.query(`INSERT INTO tb_exchanges(community_id,offer_id,request_id,provider_id,receiver_id,agreed_hours,idempotency_key)
      VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(community_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`,
      [communityId, req.body.offerId, req.body.requestId, req.body.providerId, req.body.receiverId, hours, key]);
    await client.query("INSERT INTO tb_audit_events(community_id,actor_id,action,entity_type,entity_id,after_state,request_id) VALUES($1,$2,'exchange.proposed','exchange',$3,$4,$5)", [communityId, req.user.id, result.rows[0].id, result.rows[0], req.get('x-request-id') || null]);
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); fail(res, error); } finally { client.release(); }
});

router.post('/exchanges/:id/settle', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM tb_exchanges WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!found.rows.length) throw Object.assign(new Error('Exchange not found'), { statusCode: 404 });
    const exchange = found.rows[0];
    const member = await membership(client, exchange.community_id, req.user.id);
    if (![Number(exchange.provider_id), Number(exchange.receiver_id)].includes(Number(req.user.id))) requireRole(member.role, ['steward', 'admin']);
    if (!['accepted', 'completed'].includes(exchange.status)) throw Object.assign(new Error('Only accepted or completed exchanges may settle'), { statusCode: 409 });
    await client.query(`INSERT INTO tb_ledger_entries(community_id,exchange_id,account_user_id,counterparty_user_id,amount,entry_type,posted_by)
      VALUES($1,$2,$3,$4,$5,'earn',$6),($1,$2,$4,$3,$7,'spend',$6) ON CONFLICT DO NOTHING`, [exchange.community_id, exchange.id, exchange.provider_id, exchange.receiver_id, exchange.agreed_hours, req.user.id, -exchange.agreed_hours]);
    await client.query("UPDATE tb_exchanges SET status='settled',version=version+1 WHERE id=$1", [exchange.id]);
    await client.query("INSERT INTO tb_outbox(community_id,event_type,payload) VALUES($1,'exchange.settled',$2)", [exchange.community_id, { exchangeId: exchange.id }]);
    await client.query("INSERT INTO tb_audit_events(community_id,actor_id,action,entity_type,entity_id,before_state,after_state) VALUES($1,$2,'exchange.settled','exchange',$3,$4,$5)", [exchange.community_id, req.user.id, exchange.id, exchange, { ...exchange, status: 'settled' }]);
    await client.query('COMMIT');
    res.json({ id: exchange.id, status: 'settled' });
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); fail(res, error); } finally { client.release(); }
});

module.exports = router;
