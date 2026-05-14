import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function SkillMatch() {
  return (
    <AiToolPage
      title="Skill-Need Matching"
      intro="Match a member's skills to nearby members' needs."
      endpoint="skill-match"
      fields={[
        { name: 'memberSkills', label: 'Skills offered', type: 'textarea' },
        { name: 'memberNeeds', label: 'Needs requested', type: 'textarea' },
        { name: 'neighborhood', label: 'Neighborhood', type: 'text' },
        { name: 'availability', label: 'Availability', type: 'text', placeholder: 'e.g. weekday evenings' },
      ]}
    />
  );
}
