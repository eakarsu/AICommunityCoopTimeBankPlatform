import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function ReputationAnalysis() {
  return (
    <AiToolPage
      title="Reputation Analysis"
      intro="Analyze a member's reliability score from history and feedback."
      endpoint="reputation-analysis"
      fields={[
        { name: 'memberId', label: 'Member ID', type: 'text' },
        { name: 'exchangeHistory', label: 'Exchange history', type: 'textarea' },
        { name: 'peerFeedback', label: 'Peer feedback', type: 'textarea' },
      ]}
    />
  );
}
