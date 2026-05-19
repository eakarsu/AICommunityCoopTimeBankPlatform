import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function DemandForecast() {
  return (
    <AiToolPage
      title="Demand Forecast"
      intro="Forecast time-bank exchange demand for the next 90 days."
      endpoint="demand-forecast"
      fields={[
        { name: 'neighborhood', label: 'Neighborhood', type: 'text' },
        { name: 'season', label: 'Season', type: 'text' },
        { name: 'recentTrends', label: 'Recent trends', type: 'textarea' },
      ]}
    />
  );
}
