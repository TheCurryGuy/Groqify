import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown'; 
import './Chat.css';
import { FaMoon, FaSun } from 'react-icons/fa';

const Chatbot = () => {
  const [history, setHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('Llama3-8b-8192');
  const [messages, setMessages] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isDarkMode, setIsDarkMode] = useState(false); // Track the theme mode

  const models = [
    'Llama3-8b-8192',
    'Llama3-70b-8192',
    'Mixtral-8x7b-32768',
    'gemma2-9b-it',
  ];

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessages = [...messages, { type: 'user', text: userInput }];
    setMessages(newMessages);
    setUserInput('');

    try {
      const res = await axios.post('http://localhost:5000/api/chat', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput },
        ],
        model: selectedModel,
      });

      const botResponse = res.data.response;
      setMessages([...newMessages, { type: 'bot', text: botResponse }]);

      setHistory((prevHistory) => [
        ...prevHistory,
        { query: userInput, response: botResponse },
      ]);
    } catch (error) {
      console.error('Error fetching response:', error);
      setMessages([
        ...newMessages,
        { type: 'bot', text: 'An error occurred. Please try again.' },
      ]);
    }
  };

  const handleHistoryClick = (entry) => {
    setMessages([
      { type: 'user', text: entry.query },
      { type: 'bot', text: entry.response },
    ]);
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCopyCode = (text) => {
    const codeMatches = text.match(/```([\s\S]*?)```/g); 
    if (codeMatches) {
      const allCodes = codeMatches.map(codeBlock => codeBlock.replace(/```/g, '')).join('\n\n');
      navigator.clipboard.writeText(allCodes).then(() => {
        alert('Code copied to clipboard!');
      }).catch((err) => {
        console.error('Failed to copy code: ', err);
      });
    } else {
      alert('No code found to copy!');
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);

    // Dynamically toggle the CSS variables based on the mode
    const root = document.documentElement;
    if (!isDarkMode) {
      root.style.setProperty('--bg-color-light', '#2b2b2b');
      root.style.setProperty('--bg-color-light-alt', '#333333');
      root.style.setProperty('--bg-color-darker', '#444444');
      root.style.setProperty('--bg-color-medium', '#555555');
      root.style.setProperty('--bg-color-dark', '#1f1f1f');
      root.style.setProperty('--text-color-dark', '#e1e1e1');
      root.style.setProperty('--button-bg-color', '#6a8b84');
      root.style.setProperty('--button-bg-hover', '#5a7c73');
      root.style.setProperty('--button-toggle', '#5e7367');
      root.style.setProperty('--button-toggle-hover', '#4d6257');
    } else {
      root.style.setProperty('--bg-color-light', '#e1f4f4');
      root.style.setProperty('--bg-color-light-alt', '#EAF4F4');
      root.style.setProperty('--bg-color-darker', '#CCE3DE');
      root.style.setProperty('--bg-color-medium', '#b3cbbe');
      root.style.setProperty('--bg-color-dark', '#2d2d2d');
      root.style.setProperty('--text-color-dark', '#333');
      root.style.setProperty('--button-bg-color', '#7dc8a0');
      root.style.setProperty('--button-bg-hover', '#67b089');
      root.style.setProperty('--button-toggle', '#6B9080');
      root.style.setProperty('--button-toggle-hover', '#4f514f');
    }
  };

  return (
    <div className="chat-container">
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button
          className="sidebar-toggle-btn"
          onClick={handleSidebarToggle}
          aria-label="Toggle Sidebar">
          ☰
        </button>
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>

        <h2>Personalization</h2>
        <div className="section">
          <h3>System Prompt:</h3>
          <textarea
            rows="4"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter system-level instructions here...">
          </textarea>
        </div>

        <div className="section">
          <h3>Choose a Model:</h3>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}>
            {models.map((model, index) => (
              <option key={index} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <div className="section">
          <h3>History:</h3>
          {history.length > 0 ? (
            history.map((entry, idx) => (
              <button
                key={idx}
                onClick={() => handleHistoryClick(entry)}
                className="history-button">
                Query {idx + 1}: {entry.query}
              </button>
            ))
          ) : (
            <p>No Previous queries</p>
          )}
        </div>
      </div>

      <div className="chat-main">
        <h1>💬 An LLM Chat Hub</h1>

        <div className="chat-box">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`message ${message.type === 'user' ? 'user' : 'bot'}`}>
              <div className="message-text">
                {message.type === 'bot' ? (
                  <div>
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                    <button onClick={() => handleCopyCode(message.text)}>Copy Code</button>
                  </div>
                ) : (
                  <p>{message.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="input-container">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter your query..."
          />
          <button onClick={handleSendMessage} disabled={!userInput.trim()}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
