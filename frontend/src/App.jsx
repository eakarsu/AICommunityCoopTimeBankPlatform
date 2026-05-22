import React from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { TOOLS } from './tools.js';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import SkillMatch from './pages/SkillMatch.jsx';
import CreditValuation from './pages/CreditValuation.jsx';
import OnboardingInterview from './pages/OnboardingInterview.jsx';
import DisputeMediation from './pages/DisputeMediation.jsx';
import ReputationAnalysis from './pages/ReputationAnalysis.jsx';
import DemandForecast from './pages/DemandForecast.jsx';
import GovernanceProposal from './pages/GovernanceProposal.jsx';
import SkillGap from './pages/SkillGap.jsx';
import ListingFromDescription from './pages/ListingFromDescription.jsx';
import ImpactReport from './pages/ImpactReport.jsx';
import ReciprocityBalance from './pages/ReciprocityBalance.jsx';
import CustomViewsPage from './pages/CustomViewsPage.jsx';

// // === Batch 02 Gaps & Frontend Mounts ===
import CfAiPoweredTimeMatchingEngine from './pages/CfAiPoweredTimeMatchingEngine.jsx';
import CfReputationTrustworthinessScoring from './pages/CfReputationTrustworthinessScoring.jsx';
import CfPredictiveDemandForecasting from './pages/CfPredictiveDemandForecasting.jsx';
import CfMultiModalIntakeVoicePhoto from './pages/CfMultiModalIntakeVoicePhoto.jsx';
import CfBlockchainBackedLedger from './pages/CfBlockchainBackedLedger.jsx';
import CfPeerReviewCertification from './pages/CfPeerReviewCertification.jsx';
import GapNoMemberMatchingNoSkillNeedsNlpAnalysisNoReputation from './pages/GapNoMemberMatchingNoSkillNeedsNlpAnalysisNoReputation.jsx';
import GapNoMemberDirectoryOrProfileManagement from './pages/GapNoMemberDirectoryOrProfileManagement.jsx';
import GapNoTimeCreditLedgerOrTransactionHistory from './pages/GapNoTimeCreditLedgerOrTransactionHistory.jsx';
import GapNoMatchingDiscoveryInterface from './pages/GapNoMatchingDiscoveryInterface.jsx';
import GapNoGovernanceVotingModule from './pages/GapNoGovernanceVotingModule.jsx';
import GapNoAnalyticsOrReporting from './pages/GapNoAnalyticsOrReporting.jsx';
import GapNoNotificationsWebhooksOrThirdPartyIntegrations from './pages/GapNoNotificationsWebhooksOrThirdPartyIntegrations.jsx';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

function Sidebar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  function onLogout() { logout(); nav('/'); }
  return (
    <nav className="sidebar">
      <h1>Time Bank AI</h1>
      <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
      <div style={{ marginTop: 12, fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af' }}>AI Tools</div>
      {TOOLS.map((t) => (
        <NavLink key={t.path} to={t.path} className={({ isActive }) => isActive ? 'active' : ''}>
          {t.title}
        </NavLink>
      ))}
      <div style={{ marginTop: 12, fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af' }}>Custom Views</div>
      <NavLink to="/custom-views" className={({ isActive }) => isActive ? 'active' : ''}>
        TimeBank Views
      </NavLink>
      <NavLink to="/tools/reciprocity-balance" className={({ isActive }) => isActive ? 'active' : ''}>
        Reciprocity Balance
      </NavLink>
      <div className="user-box">
        <div>Signed in as</div>
        <div><strong>{user?.name || user?.email}</strong></div>
        <button onClick={onLogout}>Sign out</button>
      </div>
    </nav>
  );
}

function ProtectedShell({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  return (
    <div className="app">
      <Sidebar />
      <div className="main">{children}</div>
    </div>
  );
}

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) {
    return (
      <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      
        {/* // === Batch 02 Gaps & Frontend Mounts === */}
        <Route path="/cf/ai-powered-time-matching-engine" element={<CfAiPoweredTimeMatchingEngine />} />
        <Route path="/cf/reputation-trustworthiness-scoring" element={<CfReputationTrustworthinessScoring />} />
        <Route path="/cf/predictive-demand-forecasting" element={<CfPredictiveDemandForecasting />} />
        <Route path="/cf/multi-modal-intake-voice-photo" element={<CfMultiModalIntakeVoicePhoto />} />
        <Route path="/cf/blockchain-backed-ledger" element={<CfBlockchainBackedLedger />} />
        <Route path="/cf/peer-review-certification" element={<CfPeerReviewCertification />} />
        <Route path="/gap/no-member-matching-no-skill-needs-nlp-analysis-no-reputation" element={<GapNoMemberMatchingNoSkillNeedsNlpAnalysisNoReputation />} />
        <Route path="/gap/no-member-directory-or-profile-management" element={<GapNoMemberDirectoryOrProfileManagement />} />
        <Route path="/gap/no-time-credit-ledger-or-transaction-history" element={<GapNoTimeCreditLedgerOrTransactionHistory />} />
        <Route path="/gap/no-matching-discovery-interface" element={<GapNoMatchingDiscoveryInterface />} />
        <Route path="/gap/no-governance-voting-module" element={<GapNoGovernanceVotingModule />} />
        <Route path="/gap/no-analytics-or-reporting" element={<GapNoAnalyticsOrReporting />} />
        <Route path="/gap/no-notifications-webhooks-or-third-party-integrations" element={<GapNoNotificationsWebhooksOrThirdPartyIntegrations />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/" element={<ProtectedShell><Home /></ProtectedShell>} />
      <Route path="/tools/skill-match" element={<ProtectedShell><SkillMatch /></ProtectedShell>} />
      <Route path="/tools/credit-valuation" element={<ProtectedShell><CreditValuation /></ProtectedShell>} />
      <Route path="/tools/onboarding-interview" element={<ProtectedShell><OnboardingInterview /></ProtectedShell>} />
      <Route path="/tools/dispute-mediation" element={<ProtectedShell><DisputeMediation /></ProtectedShell>} />
      <Route path="/tools/reputation-analysis" element={<ProtectedShell><ReputationAnalysis /></ProtectedShell>} />
      <Route path="/tools/demand-forecast" element={<ProtectedShell><DemandForecast /></ProtectedShell>} />
      <Route path="/tools/governance-proposal" element={<ProtectedShell><GovernanceProposal /></ProtectedShell>} />
      <Route path="/tools/skill-gap" element={<ProtectedShell><SkillGap /></ProtectedShell>} />
      <Route path="/tools/listing-from-description" element={<ProtectedShell><ListingFromDescription /></ProtectedShell>} />
      <Route path="/tools/impact-report" element={<ProtectedShell><ImpactReport /></ProtectedShell>} />
      <Route path="/tools/reciprocity-balance" element={<ProtectedShell><ReciprocityBalance /></ProtectedShell>} />
      <Route path="/custom-views" element={<ProtectedShell><CustomViewsPage /></ProtectedShell>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
