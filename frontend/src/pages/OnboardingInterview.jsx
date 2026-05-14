import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function OnboardingInterview() {
  return (
    <AiToolPage
      title="Onboarding Interview"
      intro="Generate a structured, warm interview for a new member."
      endpoint="onboarding-interview"
      fields={[
        { name: 'memberName', label: 'Member name', type: 'text' },
        { name: 'background', label: 'Background', type: 'textarea' },
        { name: 'goals', label: 'Goals for joining', type: 'textarea' },
        { name: 'language', label: 'Preferred language', type: 'text', default: 'English' },
      ]}
    />
  );
}
