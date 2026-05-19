import React from 'react';
import HoursExchangeNetwork from '../components/HoursExchangeNetwork.jsx';
import MemberActivityHeatmap from '../components/MemberActivityHeatmap.jsx';
import TimeBankStatementPDF from '../components/TimeBankStatementPDF.jsx';
import BarterRulesEditor from '../components/BarterRulesEditor.jsx';

export default function CustomViewsPage() {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px' }}>TimeBank Views</h2>
        <div className="muted">
          Custom community-coop time-bank views: hours-exchange graph, activity heatmap,
          statement PDF, and barter/exchange rules.
        </div>
      </div>

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 6 }}>Visualizations</h3>
        <HoursExchangeNetwork />
        <MemberActivityHeatmap />
      </section>

      <section>
        <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 6 }}>Documents & Rules</h3>
        <TimeBankStatementPDF />
        <BarterRulesEditor />
      </section>
    </div>
  );
}
