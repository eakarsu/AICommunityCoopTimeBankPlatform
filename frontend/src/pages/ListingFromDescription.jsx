import React from 'react';
import AiToolPage from '../AiToolPage.jsx';

export default function ListingFromDescription() {
  return (
    <AiToolPage
      title="Listing From Description"
      intro="Convert an informal description into a clean time-bank listing."
      endpoint="listing-from-description"
      fields={[
        { name: 'rawDescription', label: 'Raw description', type: 'textarea', rows: 6 },
        { name: 'language', label: 'Language', type: 'text', default: 'English' },
        { name: 'accessibility', label: 'Accessibility notes', type: 'text' },
      ]}
    />
  );
}
