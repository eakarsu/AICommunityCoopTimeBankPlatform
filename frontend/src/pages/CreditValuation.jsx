import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function CreditValuation() {
  return (
    <AiToolPage
      title="Time-Credit Valuation"
      intro="Recommend a fair time-credit value for an exchange."
      endpoint="credit-valuation"
      fields={[
        { name: 'taskDescription', label: 'Task description', type: 'textarea' },
        { name: 'durationHours', label: 'Duration (hours)', type: 'number' },
        { name: 'complexity', label: 'Complexity', type: 'text', placeholder: 'standard / specialized' },
        { name: 'riskLevel', label: 'Risk / liability', type: 'text' },
      ]}
    />
  );
}
