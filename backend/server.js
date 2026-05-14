const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));


app.use('/api/ai', require('./routes/timeMatching'));

app.use('/api/ai', require('./routes/reputationScore'));

app.use('/api/ai', require('./routes/demandForecast'));

app.use('/api/ai', require('./routes/multimodalIntake'));

app.use('/api/ai', require('./routes/peerReview'));
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AICommunityCoopTimeBankPlatform', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.statusCode || 500).json({ error: err.message || 'Something went wrong' });
});

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-member-matching-no-skill-needs-nlp-analysis-no-reputation', require('./routes/gap_no_member_matching_no_skill_needs_nlp_analysis_no_reputation'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-member-directory-or-profile-management', require('./routes/gap_no_member_directory_or_profile_management'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-time-credit-ledger-or-transaction-history', require('./routes/gap_no_time_credit_ledger_or_transaction_history'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-matching-discovery-interface', require('./routes/gap_no_matching_discovery_interface'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-governance-voting-module', require('./routes/gap_no_governance_voting_module'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-analytics-or-reporting', require('./routes/gap_no_analytics_or_reporting'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-notifications-webhooks-or-third-party-integrations', require('./routes/gap_no_notifications_webhooks_or_third_party_integrations'));

app.listen(PORT, () => {
  console.log(`AICommunityCoopTimeBankPlatform backend running on port ${PORT}`);
});
