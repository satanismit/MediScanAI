import React from 'react';

const Home = () => {
  return (
    <div className="chat-container" style={{ marginTop: '1rem' }}>
      <h2 style={{ marginTop: 0, color: '#0097a7' }}>Understand Your Medical Reports Instantly</h2>
      <p>
        Upload a photo of your lab report and ask questions in plain language. Our AI extracts the text using OCR,
        retrieves the most relevant parts, and explains findings in simple terms.
      </p>
      <ul>
        <li>AI-powered explanations grounded in your report</li>
        <li>Fast OCR text extraction</li>
        <li>Clean, professional interface</li>
      </ul>
      <p>Get started by heading to the Analyze page.</p>
    </div>
  );
};

export default Home;
