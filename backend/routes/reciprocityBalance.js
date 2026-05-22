const router = require('express').Router();

router.post('/score', (req, res) => {
  const { hoursGiven = 0, hoursReceived = 0, inactiveDays = 0, openRequests = 0 } = req.body || {};
  const imbalance = Math.abs(Number(hoursGiven) - Number(hoursReceived));
  const score = Math.min(100, Math.round(imbalance * 4 + Number(inactiveDays) * 0.8 + Number(openRequests) * 6));
  res.json({
    feature: 'reciprocity_balance',
    score,
    level: score >= 70 ? 'intervene' : score >= 35 ? 'nudge' : 'balanced',
    actions: [
      imbalance > 8 && 'Suggest reciprocal matches to rebalance member exchange.',
      Number(inactiveDays) > 30 && 'Send reactivation prompt with low-friction service offers.',
      Number(openRequests) > 3 && 'Route open requests to nearby members with matching skills.',
    ].filter(Boolean),
  });
});

module.exports = router;
