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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrLoading(true);
    setError(null);
    setExtractedText('');
    setReportUploaded(false);
    setMessages([
      { sender: 'assistant', text: 'Extracting text from the uploaded report...' }
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
        setMessages([{ sender: 'assistant', text: 'Sorry, OCR failed: ' + (data.error || `status ${res.status}`) }]);
      } else {
        data = contentType.includes('application/json') ? await res.json() : { text: await res.text() };
        if (data.error) {
          setError(data.error);
          setMessages([{ sender: 'assistant', text: 'Sorry, OCR failed: ' + data.error }]);
        } else {
          setExtractedText(data.text || '');
          setReportUploaded(true);
          setMessages([
            { sender: 'assistant', text: 'Report uploaded and text extracted! You can now ask questions about the report.' }
          ]);
        }
      }
    } catch (err) {
      console.error('Network error during OCR upload:', err);
      setError(err.message);
      setMessages([{ sender: 'assistant', text: 'Sorry, there was a network error during OCR.' }]);
    }
    setOcrLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !extractedText) return;
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

  return (
    <div className="layout" style={{ marginTop: '1rem' }}>
      <div className="left-pane">
        <SplineHero sceneUrl="https://prod.spline.design/JzvvtcwDUdK3HLin/scene.splinecode" />
      </div>
      <div className="right-pane">
        <div className="header-bar">
          <span style={{ fontSize: '2.2rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{verticalAlign:'middle'}} xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#00bcd4"/>
              <path d="M12 7v10M7 12h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          <h1>MedAssist RAG</h1>
          <p>Your AI-powered medical report assistant</p>
        </div>
        <div className="chat-container">
          <div className="upload-row">
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={ocrLoading || loading} />
            {ocrLoading && <span className="loading">Extracting text...</span>}
          </div>
          {extractedText && (
            <div className="extracted-text">
              <b>Extracted Text:</b>
              <pre>{extractedText}</pre>
            </div>
          )}
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender}`}>
                <b>{msg.sender === 'user' ? 'You' : 'Assistant'}:</b> {msg.text}
              </div>
            ))}
            {loading && <div className="message assistant">Assistant is typing...</div>}
          </div>
          <div className="chat-input-row">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={reportUploaded ? "Type your question..." : "Upload a report first..."}
              disabled={loading || !reportUploaded}
              className="chat-input"
            />
            <button onClick={handleSend} disabled={loading || !input.trim() || !reportUploaded} className="send-btn">
              Send
            </button>
          </div>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default Analyze;
