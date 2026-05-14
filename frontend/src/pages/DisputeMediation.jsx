import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function DisputeMediation() {
  return (
    <AiToolPage
      title="Dispute Mediation"
      intro="Mediate a time-bank exchange dispute restoratively."
      endpoint="dispute-mediation"
      fields={[
        { name: 'partyAStatement', label: "Party A's statement", type: 'textarea' },
        { name: 'partyBStatement', label: "Party B's statement", type: 'textarea' },
        { name: 'exchangeContext', label: 'Exchange context', type: 'textarea' },
        { name: 'creditsAtStake', label: 'Credits at stake', type: 'text' },
      ]}
    />
  );
}
