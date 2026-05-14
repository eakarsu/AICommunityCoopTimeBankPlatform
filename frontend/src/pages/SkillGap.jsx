import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function SkillGap() {
  return (
    <AiToolPage
      title="Skill Gap Analysis"
      intro="Identify missing skills and recruitment paths to fill them."
      endpoint="skill-gap"
      fields={[
        { name: 'currentSkills', label: 'Current member skills', type: 'textarea' },
        { name: 'communityNeeds', label: 'Community needs backlog', type: 'textarea' },
        { name: 'recruitmentBudget', label: 'Recruitment budget', type: 'text', default: 'Volunteer-only' },
      ]}
    />
  );
}
