import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/analyze');
  };

  const handleLearnMore = () => {
    navigate('/about');
  };

  return (
    <div className="homepage-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="gradient-text">MedAssist</span>
              <br />
              <span className="hero-subtitle">Your AI-Powered Medical Report Assistant</span>
            </h1>
            <p className="hero-description">
              Transform complex medical reports into clear, understandable insights using cutting-edge AI technology. 
              Upload your lab reports, ask questions in plain language, and get instant medical explanations.
            </p>
            <div className="hero-buttons">
              <button className="cta-button primary" onClick={handleGetStarted}>Get Started</button>
              <button className="cta-button secondary" onClick={handleLearnMore}>Learn More</button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="medical-icon-container">
              <div className="medical-icon">🏥</div>
              <div className="ai-brain">🧠</div>
              <div className="scan-effect"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose MedAssist?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Smart OCR Technology</h3>
            <p>Advanced text extraction from medical report images with high accuracy</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Analysis</h3>
            <p>Powered by Google Gemini AI for intelligent medical insights and explanations</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Natural Language Queries</h3>
            <p>Ask questions in plain English and get clear, medical-grade answers</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Results</h3>
            <p>Get comprehensive analysis and explanations in seconds, not hours</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Upload Your Report</h3>
              <p>Simply upload a photo or scan of your medical report (blood tests, lab results, etc.)</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>AI Text Extraction</h3>
              <p>Our advanced OCR technology extracts all text from your medical documents</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Ask Questions</h3>
              <p>Ask any question about your report in natural language</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Get Clear Answers</h3>
              <p>Receive comprehensive, easy-to-understand explanations powered by AI</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases-section">
        <h2 className="section-title">Perfect For</h2>
        <div className="use-cases-grid">
          <div className="use-case-card">
            <div className="use-case-icon">🩸</div>
            <h3>Blood Test Reports</h3>
            <p>Understand CBC, lipid profiles, liver function tests, and more</p>
          </div>
          <div className="use-case-card">
            <div className="use-case-icon">💊</div>
            <h3>Lab Results</h3>
            <p>Get insights on urine tests, culture reports, and pathology findings</p>
          </div>
          <div className="use-case-card">
            <div className="use-case-icon">📊</div>
            <h3>Medical Imaging Reports</h3>
            <p>Understand X-ray, MRI, CT scan, and ultrasound reports</p>
          </div>
          <div className="use-case-card">
            <div className="use-case-icon">📋</div>
            <h3>Health Checkup Reports</h3>
            <p>Comprehensive analysis of annual health checkup results</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-content">
          <div className="benefits-text">
            <h2>Empower Your Health Journey</h2>
            <ul className="benefits-list">
              <li>✅ <strong>Save Time:</strong> No more waiting for doctor appointments for simple clarifications</li>
              <li>✅ <strong>Better Understanding:</strong> Complex medical terms explained in simple language</li>
              <li>✅ <strong>24/7 Availability:</strong> Get answers anytime, anywhere</li>
              <li>✅ <strong>Privacy First:</strong> Your medical data stays secure and private</li>
              <li>✅ <strong>Professional Grade:</strong> Built with medical AI models for accurate insights</li>
            </ul>
          </div>
          <div className="benefits-visual">
            <div className="security-badge">
              <div className="lock-icon">🔒</div>
              <span>HIPAA Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Understand Your Medical Reports?</h2>
          <p>Join thousands of users who are already making informed health decisions with MedAssist</p>
          <button className="cta-button primary large" onClick={handleGetStarted}>Start Analyzing Now</button>
        </div>
      </section>
    </div>
  );
};

export default Home;
