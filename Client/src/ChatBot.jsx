import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown'; 
import './Chat.css';
import mammoth from 'mammoth';
import { FaMoon, FaSun, FaPaperclip } from 'react-icons/fa';
import pdfToText from 'react-pdftotext';
import client from './sanity';

const Chatbot = () => {
  const [userInput, setUserInput] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('Llama-3.1-8b-instant');
  const [messages, setMessages] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const [isLoading_2, setIsLoading_2] = useState(false); 
  const [fileContent, setFileContent] = useState('');
  const [history, setHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem('chatHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  });
  
  const models = [
    'Llama-3.3-70b-versatile',
    'Llama-3.1-8b-instant',
    'Mixtral-8x7b-32768',
    'Llama3-70b-8192',
    'Llama3-8b-8192',
    'Qwen2.5-Coder-32B-Instruct',
    'gpt-4o-mini',
    'gpt-4o',
    'gemma2-9b-it',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
  ];

  const HistoryRemover = () => {
    localStorage.removeItem('chatHistory');
    setHistory([]);
    setMessages([]);
  }
  // OLD VERSION 
  // const handleFileUpload = async (event) => {
  //   const file = event.target.files[0];
  //   if (!file) return;

  //   if (file.type === 'application/pdf') {
  //     // PDF Parsing using react-pdftotext
  //     try {
  //       const text = await pdfToText(file);
  //       setFileContent(text); // Set the extracted text to state
  //       alert("File loaded successfully!")
  //     } catch (error) {
  //       console.error("Failed to extract text from PDF", error);
  //       setFileContent('');
  //       alert('Error extracting text from PDF.');
  //     }
  //   } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
  //     // DOCX Parsing using mammoth
  //     const arrayBuffer = await file.arrayBuffer();
  //     mammoth.extractRawText({ arrayBuffer })
  //       .then((result) => {
  //         setFileContent(result.value);
  //         alert("File loaded successfully!")
  //       })
  //       .catch((error) => {
  //         alert('Error parsing DOCX file');
  //         setFileContent('');
  //       });
  //   } else {
  //     alert('Unsupported file format. Only PDF and DOCX are supported.');
  //     setFileContent('');
  //   }
  // };
  // Hi there below is the NEW HANDLER THAT USES SANITY for image understanding purposes 
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsLoading_2(true);

    if (file.type === 'application/pdf') {
    
      try {
        const text = await pdfToText(file);
        setFileContent(text); 
        alert("File loaded successfully!")
      } catch (error) {
        console.error("Failed to extract text from PDF", error);
        setFileContent('');
        alert('Error extracting text from PDF.');
      }finally {
        setIsLoading_2(false);
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      
      const arrayBuffer = await file.arrayBuffer();
      mammoth.extractRawText({ arrayBuffer })
        .then((result) => {
          setFileContent(result.value);
          alert("File loaded successfully!")
        })
        .catch((error) => {
          alert('Error parsing DOCX file');
          setFileContent('');
        })
        .finally(() => {
          setIsLoading_2(false);
        });
    } else if (
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      file.type === 'image/png'
    ) {
      
      try {
        const uploadResult = await client.assets.upload('image', file, {
          filename: file.name,
        });
  
    
        const imageUrl = uploadResult.url;
        alert('Image Decrypting Started please wait!');
        let msg = "";
        try{
          msg = await axios.post('https://groqify-server.vercel.app/api/chat/v3', {
            messages: "if you find any texts then tell what's written or if it's something else then describe the image accordingly",
            image_url: imageUrl,
          });
    
          const text = msg.data.response;
          setFileContent(text);
        } catch(error){
          console.error("error decrypting image_url", error);
          setFileContent('');
        }
      } catch (error) {
        console.error('Error uploading image to Sanity', error);
        alert('Error uploading image.');
        setFileContent('');
      } finally {
        setIsLoading_2(false);
        alert("Attachment Uploaded Successfully");
      }
    } else {
      alert('Unsupported file format. Only PDF and DOCX and image formats (JPG, JPEG, PNG) are supported.');
      setFileContent('');
      setIsLoading_2(false);
    }
  };
  
    //New modified function avoiding duplications
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
  
    const newMessages = [...messages, { type: 'user', text: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);
    const combined = userInput + '\n' + (fileContent ? "This is the content of the attached file; help the user with their query regarding it.\n" + fileContent : '');

    const recentHistory = history.slice(-1).flatMap((entry) => [
      { role: 'user', content: entry.query },
      { role: 'assistant', content: entry.response },
    ]);
  
    const createRequestMessages = () => [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: combined },
    ];
  
    const updateHistory = (userInput, botResponse) => {
      setHistory((prevHistory) => {
        const updatedHistory = [...prevHistory, { query: userInput, response: botResponse }];
        const trimmedHistory = updatedHistory.length > 10 ? updatedHistory.slice(1) : updatedHistory;
  
        try {
          localStorage.setItem('chatHistory', JSON.stringify(trimmedHistory));
        } catch (error) {
          console.error('Failed to save history to localStorage:', error);
        }
  
        return trimmedHistory;
      });
    };
  
    const fetchResponse = async (url) => {
      const requestMessages = createRequestMessages();
      const res = await axios.post(url, {
        messages: requestMessages,
        model: selectedModel,
      });
      return res.data.response;
    };
    
    try {
      const botResponse = await fetchResponse('https://groqify-server.vercel.app/api/chat');
      setMessages([...newMessages, { type: 'bot', text: botResponse }]);
      updateHistory(userInput, botResponse);
    } catch (error) {
      console.log("Error fetching Primary Model, trying Backup Route");
      try {
        const botResponse = await fetchResponse('https://groqify-server.vercel.app/api/chat/v2');
        setMessages([...newMessages, { type: 'bot', text: botResponse }]);
        updateHistory(userInput, botResponse);
      } catch (error) {
        console.error('Error fetching response:', error);
        setMessages([
          ...newMessages,
          { type: 'bot', text: 'An error occurred, Both Primary & Backup Models failed, Please try again later...' },
        ]);
      }
    } finally {
      setIsLoading(false);
      setFileContent('');
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

  const handleCopyCode = async (text) => {
    try {
      const codeMatches = text.match(/```([\s\S]*?)```/g);
      if (codeMatches) {
        const allCodes = codeMatches
          .map(codeBlock => codeBlock.replace(/```/g, ''))
          .join('\n\n');
        await navigator.clipboard.writeText(allCodes);
        alert('Code copied to clipboard!');
      } else {
        await navigator.clipboard.writeText(text);
        alert('Text copied to clipboard!');
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
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
            onChange={(e) => {
              const model = e.target.value;
              setSelectedModel(model);
              if (model === 'gemini-1.5-pro') {
                alert("This model is rate limited and can be used only for light tasks.");
              }
            }}>
            {models.map((model, index) => (
              <option key={index} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <div className="section">
          <div className='history'>
            <h3>History:</h3>
            {history.length > 0 ? (<button onClick={() => HistoryRemover()}>X</button>) : null}
          </div>
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
        <footer className="chat-footer">
            <p style={{ textAlign: 'center'}}>
              <a href="https://github.com/TheCurryGuy" target="_blank" className='foot-link'>
                Made by TheCurryGuy
              </a>
            </p>
        </footer>
      </div>

      <div className="chat-main">
        <div className="header">
          <h1 className="groqify-header"><a href="https://groqify.vercel.app" className='head-link'>Groqify🐣</a></h1>
        </div>
        <h1 className='heading'>💬 An LLM Chat Hub</h1>

        <div className="chat-box">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`message ${message.type === 'user' ? 'user' : 'bot'}`}>
              <div className="message-text">
                {message.type === 'bot' ? (
                  <div>
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                    <button className = "copy-btn" onClick={() => handleCopyCode(message.text)}>Copy Response</button>
                  </div>
                ) : (
                  <p>{message.text}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && <p className="loader">Generating Content ...</p>}
        </div>

        <div className="input-container">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message here..."
            className="chat-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <div className='input-btnt'>
            <label className="file-upload-icon">
            <FaPaperclip />
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            </label>
            
            <button disabled={isLoading_2} className="send-button" onClick={handleSendMessage}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
