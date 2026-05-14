import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function ImpactReport() {
  return (
    <AiToolPage
      title="Community Impact Report"
      intro="Draft a quarterly impact report for funders and members."
      endpoint="impact-report"
      fields={[
        { name: 'period', label: 'Period', type: 'text', placeholder: 'e.g. Q1 2026' },
        { name: 'totalHours', label: 'Total hours exchanged', type: 'number' },
        { name: 'exchangeCount', label: 'Exchange count', type: 'number' },
        { name: 'demographics', label: 'Member demographics', type: 'textarea' },
      ]}
    />
  );
}
