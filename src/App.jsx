import { useState } from 'react';
import './App.css';

const isValidWikipediaUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('wikipedia.org');
  } catch {
    return false;
  }
};

function App() {
  const [urlInput, setUrlInput] = useState('');
  const [isUrlAccepted, setIsUrlAccepted] = useState(false);
  const [queryInput, setQueryInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [showWarning, setShowWarning] = useState(false);

  const handleUrlSubmit = (e) => {
    if (e.key === 'Enter') {
      if (isValidWikipediaUrl(urlInput)) {
        setIsUrlAccepted(true);
        setShowWarning(false);
      } else {
        setShowWarning(true);
      }
    }
  };

  const handleQuerySubmit = (e) => {
    if (e.key === 'Enter' && queryInput.trim() !== '') {
      const userMessage = { role: 'user', text: queryInput };
      const aiMessage = { role: 'ai', text: 'Simulación de mensaje de IA' };
      setMessages([...messages, userMessage, aiMessage]);
      setQueryInput('');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">WikiChat AI</h1>
        <p className="subtitle">Haz preguntas basadas en artículos de Wikipedia</p>
      </header>

      <main className="chat-container">
        <div className={`fade-section ${isUrlAccepted ? 'fade-out' : 'fade-in'}`}>
          {!isUrlAccepted && (
            <>
              <input
                type="text"
                placeholder="Ingresa un enlace de Wikipedia y presiona Enter"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={handleUrlSubmit}
                className="input"
              />
              {showWarning && (
                <div className="warning">Por favor ingresa un enlace válido de Wikipedia.</div>
              )}
            </>
          )}
        </div>

        <div className={`fade-section ${isUrlAccepted ? 'fade-in' : 'fade-out'}`}>
          {isUrlAccepted && (
            <div className="query-section">
              <input
                type="text"
                placeholder="Escribe tu consulta y presiona Enter"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={handleQuerySubmit}
                className="input"
              />
              <div className="messages">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}
                  >
                    <strong>{msg.role === 'user' ? 'Tú' : 'IA'}:</strong> {msg.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
