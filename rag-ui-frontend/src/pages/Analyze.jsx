import React, { useState } from 'react';
import SplineHero from '../components/SplineHero.jsx';
import { API_BASE } from '../config.js';

const Analyze = () => {
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: 'Hi! Upload a medical report image to get started.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [reportUploaded, setReportUploaded] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrLoading(true);
    setError(null);
    setExtractedText('');
    setReportUploaded(false);
    setShowExtractedText(false);
    
    // Add a message about the new upload without clearing previous chat history
    setMessages(prevMessages => [
      ...prevMessages,
      { sender: 'assistant', text: '📤 Processing new medical report...' }
    ]);
    
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/upload_report`, {
        method: 'POST',
        body: formData
      });

      let data;
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        try {
          data = contentType.includes('application/json') ? await res.json() : { error: await res.text() };
        } catch (parseErr) {
          data = { error: `HTTP ${res.status} ${res.statusText}` };
        }
        console.error('OCR upload failed:', res.status, data);
        setError(data.error || `Upload failed with status ${res.status}`);
        setMessages(prevMessages => [
          ...prevMessages,
          { sender: 'assistant', text: '❌ OCR failed: ' + (data.error || `status ${res.status}`) }
        ]);
      } else {
        data = contentType.includes('application/json') ? await res.json() : { text: await res.text() };
        if (data.error) {
          setError(data.error);
          setMessages(prevMessages => [
            ...prevMessages,
            { sender: 'assistant', text: '❌ OCR failed: ' + data.error }
          ]);
        } else {
          setExtractedText(data.text || '');
          setReportUploaded(true);
          setShowExtractedText(true);
          setMessages(prevMessages => [
            ...prevMessages,
            { sender: 'assistant', text: '✅ Report uploaded and text extracted successfully! You can now ask questions about the report.' }
          ]);
        }
      }
    } catch (err) {
      console.error('Network error during OCR upload:', err);
      setError(err.message);
      setMessages(prevMessages => [
        ...prevMessages,
        { sender: 'assistant', text: '❌ Network error during OCR processing.' }
      ]);
    }
    setOcrLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !extractedText) return;
    
    // Add user message
    setMessages((msgs) => [...msgs, { sender: 'user', text: input }]);
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input, context: extractedText })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setMessages((msgs) => [...msgs, { sender: 'assistant', text: 'Sorry, there was an error: ' + data.error }]);
      } else {
        setMessages((msgs) => [...msgs, { sender: 'assistant', text: data.answer }]);
      }
    } catch (err) {
      setError(err.message);
      setMessages((msgs) => [...msgs, { sender: 'assistant', text: 'Sorry, there was a network error.' }]);
    }
    setInput('');
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading && reportUploaded) {
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      { sender: 'assistant', text: 'Hi! Upload a medical report image to get started.' }
    ]);
    setInput('');
    setError(null);
  };

  const formatExtractedText = (text) => {
    if (!text) return '';
    
    // Split into lines and format
    const lines = text.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => {
      // Check if line looks like a header (all caps, contains numbers, etc.)
      const isHeader = /^[A-Z\s\d\-:]+$/.test(line.trim()) && line.trim().length > 3;
      const isSubHeader = /^[A-Z][a-z]+:/.test(line.trim());
      
      if (isHeader) {
        return <div key={index} className="text-header">{line.trim()}</div>;
      } else if (isSubHeader) {
        return <div key={index} className="text-subheader">{line.trim()}</div>;
      } else {
        return <div key={index} className="text-line">{line.trim()}</div>;
      }
    });
  };

  return (
    <div className="layout" style={{ marginTop: '1rem' }}>
      <div className="left-pane">
        <SplineHero sceneUrl="https://prod.spline.design/JzvvtcwDUdK3HLin/scene.splinecode" />
      </div>
      <div className="right-pane">
        <div className="header-bar">
          <span style={{ fontSize: '2.2rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{verticalAlign:'middle'}} xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#1e40af"/>
              <path d="M12 7v10M7 12h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          <h1>MedAssist Analysis</h1>
          <p>Upload your medical report and get AI-powered insights</p>
        </div>
        
        <div className="chat-container">
          {/* Upload Section */}
          <div className="upload-section">
            <div className="upload-header">
              <h3>📄 Upload Medical Report</h3>
              <p>Upload an image of your medical report to extract text and start asking questions</p>
            </div>
            <div className="upload-row">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                disabled={ocrLoading || loading}
                className="file-input"
              />
              {ocrLoading && (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <span>Extracting text...</span>
                </div>
              )}
            </div>
          </div>

          {/* Extracted Text Section */}
          {extractedText && (
            <div className="extracted-text-section">
              <div className="extracted-text-header">
                <h3>📋 Extracted Text</h3>
                <button 
                  className="toggle-text-btn"
                  onClick={() => setShowExtractedText(!showExtractedText)}
                >
                  {showExtractedText ? 'Hide Text' : 'Show Text'}
                </button>
              </div>
              {showExtractedText && (
                <div className="extracted-text-content">
                  <div className="extracted-text">
                    {formatExtractedText(extractedText)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Section */}
          <div className="chat-section">
            <div className="chat-header">
              <div className="chat-header-content">
                <h3>💬 Ask Questions</h3>
                <p>{reportUploaded ? 'Ask any question about your medical report' : 'Upload a report first to start asking questions'}</p>
              </div>
              <div className="chat-header-buttons">
                {messages.length > 1 && (
                  <button 
                    className="clear-chat-btn"
                    onClick={clearChat}
                    title="Clear chat history"
                  >
                    🗑️ Clear Chat
                  </button>
                )}
              </div>
            </div>
            
            <div className="chat-messages">
              {messages && messages.length > 0 ? (
                messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.sender}`}>
                    <div className="message-header">
                      <span className="message-sender">{msg.sender === 'user' ? 'You' : 'MedAssist'}</span>
                      <span className="message-time">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="message-content">{msg.text}</div>
                  </div>
                ))
              ) : (
                <div className="no-messages">
                  <p>No messages yet. Start by uploading a report!</p>
                </div>
              )}
              {loading && (
                <div className="message assistant">
                  <div className="message-header">
                    <span className="message-sender">MedAssist</span>
                    <span className="message-time">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-row">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={reportUploaded ? "Ask about your medical report..." : "Upload a report first..."}
                disabled={loading || !reportUploaded}
                className="chat-input"
              />
              <button 
                onClick={handleSend} 
                disabled={loading || !input.trim() || !reportUploaded} 
                className="send-btn"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analyze;