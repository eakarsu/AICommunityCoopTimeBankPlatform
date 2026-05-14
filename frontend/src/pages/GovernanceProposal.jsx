import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function GovernanceProposal() {
  return (
    <AiToolPage
      title="Governance Proposal"
      intro="Draft a coop governance proposal with sociocratic patterns."
      endpoint="governance-proposal"
      fields={[
        { name: 'issue', label: 'Issue', type: 'textarea' },
        { name: 'options', label: 'Options under consideration', type: 'textarea' },
        { name: 'stakeholders', label: 'Stakeholders', type: 'text', default: 'All members' },
      ]}
    />
  );
}
