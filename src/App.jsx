import { useState } from 'react';
import { useRef, useEffect } from 'react';

import './App.css';

import { scrapeWikipedia } from './utils/scraper';
import { getEmbeddingsFromChunks } from './utils/embedding';
import { getEmbedding } from './utils/embedding';
import { splitTextIntoChunks } from './utils/langChainSplitter';
import { askLLM } from './utils/askLLM';
import { initCollection, saveEmbeddings, searchSimilarChunks } from './utils/Qdrant';

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
  const [articleEmbeddings, setArticleEmbeddings] = useState([]);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  const [isLoadingQuery, setIsLoadingQuery] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUrlSubmit = async (e) => {
    if (e.key === 'Enter') {
      if (isValidWikipediaUrl(urlInput)) {
        setIsUrlAccepted(true);
        setShowWarning(false);
        setIsLoadingArticle(true); 

        try {
          const scrapedText = await scrapeWikipedia(urlInput);
          console.log("Texto scrapeado: ", scrapedText)
          
          const chunks = await splitTextIntoChunks(scrapedText);
          console.log("Chunks a aplicar embedding: ", chunks)

          const articleEmbeddings = await getEmbeddingsFromChunks(chunks);
          console.log("Embeddings del artículo: ", articleEmbeddings)
          setArticleEmbeddings(articleEmbeddings);

          await initCollection();
          await saveEmbeddings(articleEmbeddings);

        } catch (error) {
          console.error("Error generando embeddings:", error);
        } finally {
          setIsLoadingArticle(false); 
        }

      } else {
        setShowWarning(true);
      }
    }
  };

  const handleQuerySubmit = async (e) => {
    if (e.key === 'Enter' && queryInput.trim() !== '') {
      const userMessage = { role: 'user', text: queryInput };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoadingQuery(true);

      const queryEmbedding = await getEmbedding(queryInput);

      if (!queryEmbedding) {
        const errorMsg = { role: 'ai', text: 'Error generando el embedding de la consulta.' };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      console.log("queryEmbedding ", queryEmbedding)
      console.log("queryEmbedding[0] ", queryEmbedding[0])

      const topChunks = await searchSimilarChunks(queryEmbedding[0], 5);
      console.log("topChunks: ",topChunks)
      
      const context = topChunks.map(c => c.text).join('\n\n');

      const aiResponse = await askLLM(context, queryInput);
      console.log("AI Response:", aiResponse)
      
      setIsLoadingQuery(false);

      const aiMessage = { role: 'ai', text: aiResponse };
      setMessages((prev) => [...prev, aiMessage]);
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
              {isLoadingArticle ? (
                <div className="loading-spinner">
                  <div className="dot-flashing"></div>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Escribe tu consulta y presiona Enter"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={handleQuerySubmit}
                    className="input"
                    disabled={isLoadingQuery}
                    style={{ opacity: isLoadingQuery ? 0.5 : 1 }}
                  />
                  {isLoadingQuery && (
                    <div className="loading-spinner">
                      <div className="dot-flashing"></div>
                    </div>
                  )}
                  <div className="messages">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}
                      >
                        <strong>{msg.role === 'user' ? 'Tú' : 'IA'}:</strong> {msg.text}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="footer-warning">
        Warning: Dependiendo del largo del artículo y de la pregunta, la IA puede demorar en responder. Paciencia.
        Puedes ver el estado de tu consulta en la consola.
      </footer>
    </div>
  );
}

export default App;
