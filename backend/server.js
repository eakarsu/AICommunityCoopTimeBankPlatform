const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });
require('./config/runtime').validateRuntime();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/timebank', require('./routes/workflow'));
app.use('/api/ai', require('./routes/ai'));


app.use('/api/ai', require('./routes/timeMatching'));

app.use('/api/ai', require('./routes/reputationScore'));

app.use('/api/ai', require('./routes/demandForecast'));

app.use('/api/ai', require('./routes/multimodalIntake'));

app.use('/api/ai', require('./routes/peerReview'));
app.use('/api/reciprocity-balance', require('./routes/reciprocityBalance'));
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AICommunityCoopTimeBankPlatform', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.statusCode || 500).json({ error: err.message || 'Something went wrong' });
});

// === Custom Views (mounted BEFORE 404) ===
app.use('/api/custom-views', require('./routes/customViews'));

app.listen(PORT, () => {
  console.log(`AICommunityCoopTimeBankPlatform backend running on port ${PORT}`);
});
