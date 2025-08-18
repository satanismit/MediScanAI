import React from 'react';
import SplineHero from '../components/SplineHero.jsx';

const AboutContact = () => {
  return (
    <div className="layout" style={{ marginTop: '1rem' }}>
      <div className="right-pane">
        <div className="chat-container">
          <h2 style={{ marginTop: 0, color: '#0097a7' }}>About & Contact</h2>
          <p>
            MedAssist RAG is a demo application that uses OCR + Retrieval-Augmented Generation to help users understand medical reports.
          </p>
          <h3 style={{ color: '#0097a7' }}>Contact</h3>
          <p>Email: contact@example.com</p>
          <p>GitHub: github.com/your-handle</p>
        </div>
      </div>
      <div className="right-pane-fixed">
        <div className="pane-sticky">
          <div className="spline-hero" style={{ height: '100%' }}>
            <SplineHero sceneUrl="https://prod.spline.design/84KywMy1Wy0fuVbq/scene.splinecode" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutContact;
