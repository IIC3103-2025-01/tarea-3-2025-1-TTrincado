import { useState } from 'react';

import './App.css';

import { scrapeWikipedia } from './utils/scraper';
import { getEmbeddingsFromChunks } from './utils/embedding';
import { getEmbedding } from './utils/embedding';
import { splitTextIntoChunks } from './utils/langChainSplitter';
import { askLLM } from './utils/askLLM';

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

function getTopKChunks(embeddings, queryEmbedding, k = 3, threshold = 0.2) {
  const scoredChunks = embeddings
    .map(({ text, embedding }) => ({
      text,
      score: cosineSimilarity(embedding, queryEmbedding),
    }));

  console.log("Similitudes:", scoredChunks);

  return scoredChunks
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

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

  const handleUrlSubmit = async (e) => {
    if (e.key === 'Enter') {
      if (isValidWikipediaUrl("https://en.wikipedia.org/wiki/Biard_(surname)")) { //urlInput
        setIsUrlAccepted(true);
        setShowWarning(false);

        const scrapedText = await scrapeWikipedia("https://en.wikipedia.org/wiki/Biard_(surname)");
        const chunks = await splitTextIntoChunks(scrapedText)
        const embeddings = await getEmbeddingsFromChunks(chunks)
        
        setArticleEmbeddings(embeddings);
        console.log("Embeddings de articulo listos:", embeddings);

      } else {
        setShowWarning(true);
      }
    }
  };

  const handleQuerySubmit = async (e) => {
    if (e.key === 'Enter' && queryInput.trim() !== '') {
      const userMessage = { role: 'user', text: queryInput };
      setMessages((prev) => [...prev, userMessage]);

      const queryEmbedding = await getEmbedding(queryInput);
      if (!queryEmbedding) {
        const errorMsg = { role: 'ai', text: 'Error generando el embedding de la consulta.' };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      const topChunks = getTopKChunks(articleEmbeddings, queryEmbedding[0], 3);
      console.log("topChunks: ",topChunks)
      
      const context = topChunks.map(c => c.text).join('\n\n');

      const aiResponse = await askLLM("Biard es un apellido. Algunas personas notables tienen ese apellido. No se refiere a una comida, objeto o concepto abstracto, sino a un nombre de familia.", "Que es biard? Es un apellido o una comida?");
      console.log("AI Response:", aiResponse)

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
