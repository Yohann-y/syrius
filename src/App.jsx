import { useState, useEffect } from 'react'
import './App.css'
import scenarios from './scenarios.json'

function App() {
  const [currentScreen, setCurrentScreen] = useState('menu')
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [gameState, setGameState] = useState('playing')
  const [loupeActive, setLoupeActive] = useState(false)
  const [codeSecret, setCodeSecret] = useState('')
  const [messages, setMessages] = useState([])
  const [showChoices, setShowChoices] = useState(true)
  const [timeLeft, setTimeLeft] = useState(30)
  const [relanceSent, setRelanceSent] = useState(false)
  const [phoneModel, setPhoneModel] = useState('iphone')
  const [lastChoice, setLastChoice] = useState('')
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- LOGIQUE DU TIMER ---
  useEffect(() => {
    if (currentScreen !== 'game' || gameState !== 'playing' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        if (prev === 11 && !relanceSent) {
          setRelanceSent(true);
          setMessages(prevMsgs => [...prevMsgs, { ...selectedScenario.relanceMsg, id: Date.now() }]);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentScreen, gameState, timeLeft, relanceSent, selectedScenario]);

  const startScenario = (scenario) => {
    setSelectedScenario(scenario);
    setMessages([scenario.initialMsg]);
    setCurrentScreen('game');
    setGameState('playing');
    setShowChoices(true);
    setTimeLeft(30);
    setRelanceSent(false);
    setLoupeActive(false);
    setLastChoice('');
  };

  const handleChoice = (choiceText) => {
    setLastChoice(choiceText);
    setMessages([...messages, { id: Date.now(), type: 'sent', content: choiceText, time: '11:43' }]);
    setShowChoices(false);
    
    if (choiceText.includes('paie') || choiceText.includes('envoie')) {
      setTimeout(() => setGameState('momo'), 800);
    } else {
      setTimeout(() => setGameState('ended'), 1000);
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    setGameState('ended');
  };

  const handleReplay = () => {
    setCurrentScreen('menu');
    setCodeSecret('');
  };

  const renderStatusBar = () => (
    <div className="status-bar">
      <span className="status-time">{currentTime}</span>
      <div className="status-icons">
        <span className="status-signal">●●●●</span>
        <span className="status-wifi">📶</span>
        <span className="status-battery">🔋</span>
      </div>
    </div>
  );

  const renderNotchOrIsland = () => (
    <>
      {phoneModel === 'iphone' && <div className="dynamic-island"></div>}
      {phoneModel === 'samsung' && <div className="hole-punch"></div>}
      {phoneModel === 'pixel' && <div className="pixel-pill"></div>}
    </>
  );

  const renderHomeIndicator = () => (
    <div className="home-indicator"></div>
  );

  // --- RENDU : MENU PRINCIPAL ---
  if (currentScreen === 'menu') {
    return (
      <div className="app-container">
        <div className="skin-selector">
          <button className={phoneModel === 'iphone' ? 'active' : ''} onClick={() => setPhoneModel('iphone')}>iPhone</button>
          <button className={phoneModel === 'samsung' ? 'active' : ''} onClick={() => setPhoneModel('samsung')}>Samsung</button>
          <button className={phoneModel === 'pixel' ? 'active' : ''} onClick={() => setPhoneModel('pixel')}>Pixel</button>
        </div>
        <div className="phone-wrapper tilt-effect">
          <div className={`phone-frame menu-frame skin-${phoneModel}`}>
            {renderStatusBar()}
            {renderNotchOrIsland()}
            <div className="menu-header">
              <div className="shield-icon">🛡️</div>
              <h1>SYRIUS</h1>
              <p className="tagline">Apprends à déjouer les arnaques</p>
            </div>
            <div className="menu-list">
              {scenarios.map(scen => (
                <button key={scen.id} className="scenario-btn" onClick={() => startScenario(scen)}>
                  <div className="scen-info">
                    <span className="scen-cat">{scen.categorie}</span>
                    <span className="scen-title">{scen.titre}</span>
                  </div>
                  <span className="scen-arrow">→</span>
                </button>
              ))}
            </div>
            {renderHomeIndicator()}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDU : JEU EN COURS ---
  return (
    <div className="app-container">
      <div className="skin-selector">
        <button className={phoneModel === 'iphone' ? 'active' : ''} onClick={() => setPhoneModel('iphone')}>iPhone</button>
        <button className={phoneModel === 'samsung' ? 'active' : ''} onClick={() => setPhoneModel('samsung')}>Samsung</button>
        <button className={phoneModel === 'pixel' ? 'active' : ''} onClick={() => setPhoneModel('pixel')}>Pixel</button>
      </div>

      <div className="phone-wrapper tilt-effect">
        <div className={`phone-frame skin-${phoneModel}`}>
          {renderStatusBar()}
          {renderNotchOrIsland()}
          
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
                  <label className="momo-label">Code secret à 4 chiffres :</label>
                  <input type="password" maxLength="4" className="momo-input" value={codeSecret} onChange={(e) => setCodeSecret(e.target.value)} placeholder="****" autoFocus />
                  <button type="submit" className="momo-btn">Valider</button>
                </form>
                <p className="momo-warning">⚠️ Ne donnez jamais votre code secret !</p>
              </div>
            </div>
          )}

          {/* ÉCRAN DE CHAT & FIN */}
          {gameState !== 'momo' && (
            <>
              {gameState !== 'ended' && (
                <div className="app-header whatsapp-header">
                  <div className="header-top">
                    <button className="back-btn" onClick={handleReplay}>←</button>
                    <div className="profile-circle">
                      <span className="profile-initial">I</span>
                    </div>
                    <div className="contact-info">
                      <span className="contact-name">Inconnu</span>
                      <span className="contact-number">+229 01 97 XX XX XX</span>
                    </div>
                    <span className={`timer-pill ${timeLeft <= 10 ? 'timer-danger' : ''}`}>{timeLeft}s</span>
                  </div>
                </div>
              )}

              <div className="chat-area">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.type}`}>
                    <div className={`message-bubble ${msg.type}`}>
                      {msg.type === 'received' && (
                        <div className="msg-tools">
                          <button className="loupe-btn" onClick={() => setLoupeActive(!loupeActive)}>🔍</button>
                          {msg.isVocal && <div className="vocal-badge">🎙️ 0:12 - Lire le texte</div>}
                        </div>
                      )}
                      <p>
                        {msg.parts && msg.parts.map((part, index) => (
                          <span key={index} className={part.suspect && loupeActive ? 'highlight' : ''}>{part.text}</span>
                        ))}
                        {!msg.parts && msg.content}
                      </p>
                      <span className="time">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {showChoices && gameState === 'playing' && (
                <div className="choices-area">
                  <button className="choice-btn" onClick={() => handleChoice(selectedScenario.id === 1 ? 'Je paie les 5000F' : "J'envoie l'argent vite")}>
                    {selectedScenario.id === 1 ? 'Je paie les 5000F' : "J'envoie l'argent vite"}
                  </button>
                  <button className="choice-btn" onClick={() => handleChoice('Je demande des détails')}>Je demande des détails</button>
                  <button className="choice-btn" onClick={() => handleChoice("J'appelle mon fils / la police")}>J'appelle pour vérifier</button>
                </div>
              )}

              {gameState === 'ended' && (
                <div className="end-screen">
                  <div className="score-summary">
                    <h2>Fin de la simulation</h2>
                    <p className="summary-text">Bilan de l'interaction</p>
                  </div>
                  
                  <div className="path-tree">
                    <div className="path-step">💬 Message reçu</div>
                    <div className="path-line"></div>
                    <div className="path-step highlight-choice">👉 {lastChoice || 'Aucun choix'}</div>
                    <div className="path-line"></div>
                    <div className={`path-step ${lastChoice?.includes('paie') || lastChoice?.includes('envoie') ? 'highlight-choice' : ''}`}>
                      {lastChoice?.includes('paie') || lastChoice?.includes('envoie') ? '📱 Écran Moov Money' : '🛑 Arrêt de la conversation'}
                    </div>
                    <div className="path-line"></div>
                    <div className="path-step lost">❌ PERDU (Arnaque subie)</div>
                  </div>

                  <div className="signals-section">
                    <h3>🔍 Signaux repérés</h3>
                    <ul className="signals-list found"><li>✅ Numéro inconnu</li></ul>
                    <h3>⚠️ Signaux manqués</h3>
                    <ul className="signals-list missed"><li>❌ Urgence artificielle</li><li>❌ Demande d'argent via Mobile Money</li></ul>
                  </div>

                  <div className="prevention-blocks">
                    <div className="prevention-card cnin">
                      <h4>🛡️ Victime ?</h4>
                      <p>Signalez l'arnaque au <strong>CNIN</strong></p>
                    </div>
                    <div className="prevention-card enfance">
                      <h4>👶 Un mineur ?</h4>
                      <p>Appelez <strong>Allô Enfance au 138</strong></p>
                    </div>
                  </div>

                  <div className="end-buttons">
                    <button className="choice-btn replay-btn" onClick={handleReplay}>Retour au menu</button>
                  </div>
                </div>
              )}
            </>
          )}
          {renderHomeIndicator()}
        </div>
      </div>
    </div>
  )
}

export default App
