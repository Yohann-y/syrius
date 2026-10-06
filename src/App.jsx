import { useState, useEffect } from 'react'
import './App.css'
import scenarios from './scenarios.json'

function App() {
  const [currentScreen, setCurrentScreen] = useState('menu')
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [gameState, setGameState] = useState('playing') // 'playing' | 'momo' | 'ended'
  const [loupeActive, setLoupeActive] = useState(false)
  const [codeSecret, setCodeSecret] = useState('')
  const [messages, setMessages] = useState([])
  const [timeLeft, setTimeLeft] = useState(30)
  const [relanceSent, setRelanceSent] = useState(false)
  const [phoneModel, setPhoneModel] = useState('iphone')
  const [lastChoice, setLastChoice] = useState(null)
  const [currentTime, setCurrentTime] = useState('')
  const [resultOutcome, setResultOutcome] = useState('lose') // 'win' | 'lose'
  const [winReason, setWinReason] = useState('')

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
        if (prev === 11 && !relanceSent && selectedScenario?.relanceMsg) {
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
    setTimeLeft(30);
    setRelanceSent(false);
    setLoupeActive(false);
    setLastChoice(null);
    setResultOutcome('lose');
    setWinReason('');
  };

  const handleChoice = (choice) => {
    setLastChoice(choice);
    
    // Message envoyé par le joueur
    const userMsg = {
      id: Date.now(),
      type: 'sent',
      content: choice.text,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);

    if (choice.target === 'momo') {
      setTimeout(() => {
        setGameState('momo');
      }, 700);
    } else if (choice.target === 'win') {
      setResultOutcome('win');
      setWinReason(choice.winReason || 'Vous avez correctement identifié l’arnaque.');
      setTimeout(() => {
        setGameState('ended');
      }, 1000);
    } else if (choice.target === 'details') {
      // Réponse de l'escroc demandant à nouveau l'argent
      setTimeout(() => {
        const replyMsg = {
          id: Date.now() + 1,
          type: 'received',
          content: choice.reply || "Ne perdez pas de temps, l'offre expire bientôt !",
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, replyMsg]);
      }, 800);
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    setResultOutcome('lose');
    setGameState('ended');
  };

  const handleReplay = () => {
    setCurrentScreen('menu');
    setCodeSecret('');
    setSelectedScenario(null);
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
                <p className="momo-amount">Montant : <strong>{lastChoice?.amount || '5 000 FCFA'}</strong></p>
                <p className="momo-recipient">Bénéficiaire : {selectedScenario?.initialMsg?.senderNumber || '+229 01 97 XX XX'}</p>
                <form onSubmit={handleCodeSubmit}>
                  <label className="momo-label">Code secret à 4 chiffres :</label>
                  <input type="password" maxLength="4" className="momo-input" value={codeSecret} onChange={(e) => setCodeSecret(e.target.value)} placeholder="****" autoFocus />
                  <button type="submit" className="momo-btn">Valider le paiement</button>
                </form>
                <p className="momo-warning">⚠️ Ne donnez jamais votre code secret à un tiers !</p>
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
                      <span className="profile-initial">{selectedScenario?.initialMsg?.senderName?.[0] || 'I'}</span>
                    </div>
                    <div className="contact-info">
                      <span className="contact-name">{selectedScenario?.initialMsg?.senderName || 'Inconnu'}</span>
                      <span className="contact-number">{selectedScenario?.initialMsg?.senderNumber || '+229 01 XX XX XX'}</span>
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
                          <button className="loupe-btn" onClick={() => setLoupeActive(!loupeActive)} title="Inspecter les signaux suspects">🔍</button>
                          {msg.isVocal && <div className="vocal-badge">🎙️ Message vocal</div>}
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

              {gameState === 'playing' && selectedScenario?.choices && (
                <div className="choices-area">
                  {selectedScenario.choices.map((choice) => (
                    <button key={choice.id} className="choice-btn" onClick={() => handleChoice(choice)}>
                      {choice.text}
                    </button>
                  ))}
                </div>
              )}

              {gameState === 'ended' && (
                <div className="end-screen">
                  <div className="score-summary">
                    <h2>{resultOutcome === 'win' ? '🎉 Victoire !' : '❌ Piégé !'}</h2>
                    <p className="summary-text">
                      {resultOutcome === 'win' 
                        ? (winReason || "Vous avez réussi à déjouer l'arnaque !") 
                        : "Vous êtes tombé dans le piège de cette escroquerie."}
                    </p>
                  </div>
                  
                  <div className="path-tree">
                    <div className="path-step">💬 Scenario : {selectedScenario?.titre}</div>
                    <div className="path-line"></div>
                    <div className="path-step highlight-choice">👉 Choix : {lastChoice?.text || 'Temps écoulé'}</div>
                    <div className="path-line"></div>
                    <div className={`path-step ${resultOutcome === 'win' ? 'win' : 'lost'}`}>
                      {resultOutcome === 'win' ? '✅ VICTOIRE (Arnaque déjouée)' : '❌ PERDU (Argent versé / Piège)'}
                    </div>
                  </div>

                  {selectedScenario?.signals && (
                    <div className="signals-section">
                      <h3>🔍 Signaux suspects du scénario</h3>
                      <ul className="signals-list found">
                        {selectedScenario.signals.map(s => (
                          <li key={s.id}>⚠️ {s.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}

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
