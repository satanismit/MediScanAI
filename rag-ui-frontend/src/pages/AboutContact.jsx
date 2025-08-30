import React, { useState } from 'react';
import SplineHero from '../components/SplineHero.jsx';

const AboutContact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitStatus('success');
      setIsSubmitting(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset status after 3 seconds
      setTimeout(() => setSubmitStatus(null), 3000);
    }, 1500);
  };

  return (
    <div className="layout" style={{ marginTop: '1rem' }}>
      <div className="left-pane">
        <SplineHero sceneUrl="https://prod.spline.design/84KywMy1Wy0fuVbq/scene.splinecode" />
      </div>
      <div className="right-pane">
        <div className="header-bar">
          <span style={{ fontSize: '2.2rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{verticalAlign:'middle'}} xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#1e40af"/>
              <path d="M12 7v10M7 12h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          <h1>About & Contact</h1>
          <p>Get in touch with our team</p>
        </div>
        
        <div className="about-contact-container">
          {/* About Section */}
      
          {/* Contact Section */}
          <div className="contact-section">
            <div className="contact-header">
              <h2>📧 Get In Touch</h2>
              <p>Have questions? We'd love to hear from you.</p>
            </div>
            
            <div className="contact-form-container">
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your full name"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your email address"
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    placeholder="What is this about?"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows="6"
                    placeholder="Tell us more about your inquiry..."
                    className="form-textarea"
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      Sending Message...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
              
              {submitStatus === 'success' && (
                <div className="success-message">
                  <div className="success-icon">✅</div>
                  <div className="success-content">
                    <h4>Message Sent Successfully!</h4>
                    <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="contact-info">
              <div className="contact-info-card">
                <div className="contact-info-icon">📧</div>
                <h4>Email</h4>
                <p>contact@medassist.com</p>
                <p>support@medassist.com</p>
              </div>
              
              <div className="contact-info-card">
                <div className="contact-info-icon">🌐</div>
                <h4>Website</h4>
                <p>www.medassist.com</p>
                <p>Documentation & API</p>
              </div>
              
              <div className="contact-info-card">
                <div className="contact-info-icon">⏰</div>
                <h4>Response Time</h4>
                <p>Within 24 hours</p>
                <p>Business days only</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutContact;
