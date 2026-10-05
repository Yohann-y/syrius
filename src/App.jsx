import { useState } from 'react'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('playing') // 'playing', 'momo', 'ended'
  const [loupeActive, setLoupeActive] = useState(false)
  const [codeSecret, setCodeSecret] = useState('')
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'received',
      parts: [
        { text: "Félicitations Mme Awa ! Vous êtes présélectionné au ", suspect: false },
        { text: "Concours des Douanes 2026", suspect: true },
        { text: ". Frais de dossier de ", suspect: false },
        { text: "5000F", suspect: true },
        { text: " à payer via Moov Money pour recevoir vos 500 000F. Répondez ", suspect: false },
        { text: "VITE", suspect: true }
      ],
      time: '11:42'
    }
  ])
  
  const [showChoices, setShowChoices] = useState(true)

  const handleChoice = (choiceText) => {
    const playerMessage = {
      id: messages.length + 1,
      type: 'sent',
      content: choiceText,
      time: '11:43'
    }
    setMessages([...messages, playerMessage])
    setShowChoices(false)
    
    // Si le joueur choisit de payer, on affiche l'écran Mobile Money
    if (choiceText.includes('paie')) {
      setTimeout(() => {
        setGameState('momo')
      }, 800)
    } else {
      // Sinon, on va direct à la fin (pour l'instant)
      setTimeout(() => {
        setGameState('ended')
      }, 1000)
    }
  }

  const handleCodeSubmit = (e) => {
    e.preventDefault()
    // Peu importe le code, c'est une arnaque, il perd
    setGameState('ended')
  }

  const handleReplay = () => {
    setGameState('playing')
    setMessages([messages[0]])
    setShowChoices(true)
    setLoupeActive(false)
    setCodeSecret('')
  }

  return (
    <div className="app-container">
      <div className="phone-frame">
        <div className="notch"></div>
        
        {/* ÉCRAN MOBILE MONEY */}
        {gameState === 'momo' && (
          <div className="momo-screen">
            <div className="momo-header">
              <span className="momo-logo">Moov Money</span>
              <button className="momo-close" onClick={handleReplay}>✕</button>
            </div>
            <div className="momo-body">
              <p className="momo-amount">Montant : <strong>5 000 FCFA</strong></p>
              <p className="momo-recipient">Bénéficiaire : +229 01 97 XX XX XX</p>
              
              <form onSubmit={handleCodeSubmit}>
                <label className="momo-label">Entrez votre code secret à 4 chiffres :</label>
                <input 
                  type="password" 
                  maxLength="4"
                  className="momo-input"
                  value={codeSecret}
                  onChange={(e) => setCodeSecret(e.target.value)}
                  placeholder="****"
                  autoFocus
                />
                <button type="submit" className="momo-btn">Valider</button>
              </form>
              <p className="momo-warning">⚠️ Ne donnez jamais votre code secret à un inconnu !</p>
            </div>
          </div>
        )}

        {/* ÉCRAN DE CHAT NORMAL */}
        {gameState !== 'momo' && (
          <>
            <div className="app-header">
              <span className="app-name">WhatsApp</span>
              <span className="contact-name">+229 01 97 XX XX XX</span>
            </div>

            <div className="chat-area">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.type}`}>
                  {msg.type === 'received' && (
                    <button 
                      className="loupe-btn" 
                      onClick={() => setLoupeActive(!loupeActive)}
                    >
                      🔍
                    </button>
                  )}
                  <p>
                    {msg.parts && msg.parts.map((part, index) => (
                      <span key={index} className={part.suspect && loupeActive ? 'highlight' : ''}>
                        {part.text}
                      </span>
                    ))}
                    {!msg.parts && msg.content}
                  </p>
                  <span className="time">{msg.time}</span>
                </div>
              ))}
            </div>

            {showChoices && gameState === 'playing' && (
              <div className="choices-area">
                <button className="choice-btn" onClick={() => handleChoice('Je paie les 5000F')}>Je paie les 5000F</button>
                <button className="choice-btn" onClick={() => handleChoice('Je demande des détails')}>Je demande des détails</button>
                <button className="choice-btn" onClick={() => handleChoice("J'appelle mon fils")}>J'appelle mon fils</button>
              </div>
            )}

            {gameState === 'ended' && (
              <div className="end-screen">
                <h2>Fin de la simulation</h2>
                <div className="result-box">
                  <p>Vous avez envoyé 5000F. L'escroc vous bloque.</p>
                </div>
                <div className="signals-section">
                  <h3> Signaux repérés</h3>
                  <ul className="signals-list found">
                    <li>✅ Numéro inconnu</li>
                    <li>✅ Urgence artificielle ("VITE")</li>
                  </ul>
                  <h3>⚠️ Signaux manqués</h3>
                  <ul className="signals-list missed">
                    <li>❌ Faute de grammaire</li>
                    <li>❌ Demande d'argent via Mobile Money</li>
                  </ul>
                </div>
                <div className="end-buttons">
                  <button className="choice-btn replay-btn" onClick={handleReplay}>Rejouer</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
