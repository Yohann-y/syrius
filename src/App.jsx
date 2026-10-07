import { useState, useEffect, useRef } from 'react'
import './App.css'
import scenarios from './scenarios.json'

function App() {
  const [currentScreen, setCurrentScreen] = useState('menu')
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [currentMsg, setCurrentMsg] = useState(null)
  const [gameState, setGameState] = useState('playing') // 'playing' | 'momo' | 'ended'
  const [loupeActive, setLoupeActive] = useState(false)
  const [codeSecret, setCodeSecret] = useState('')
  const [messages, setMessages] = useState([])
  const [historyNodes, setHistoryNodes] = useState([])
  const [phoneModel, setPhoneModel] = useState('iphone')
  const [currentTime, setCurrentTime] = useState('')
  const [momoDetails, setMomoDetails] = useState({ amount: '5 000 FCFA', recipient: '+229 01 XX XX XX' })
  const [currentEnding, setCurrentEnding] = useState(null)
  const [playingAudioId, setPlayingAudioId] = useState(null)

  const chatEndRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, gameState]);

  // Audio Speech Synthesis for Real Voice Notes
  const handlePlayVoice = (msgId, text) => {
    if ('speechSynthesis' in window) {
      if (playingAudioId === msgId) {
        window.speechSynthesis.cancel();
        setPlayingAudioId(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);

      setPlayingAudioId(msgId);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("La synthèse vocale n'est pas supportée par ce navigateur.");
    }
  };

  const startScenario = (scenario) => {
    setSelectedScenario(scenario);
    setCurrentMsg(scenario.initialMsg);
    setMessages([scenario.initialMsg]);
    setHistoryNodes([scenario.initialMsg.parts ? scenario.initialMsg.parts.map(p => p.text).join('') : 'Début']);
    setCurrentScreen('game');
    setGameState('playing');
    setLoupeActive(false);
    setCurrentEnding(null);
    setPlayingAudioId(null);

    // Auto speak initial voice message if present
    if (scenario.initialMsg.isVocal && scenario.initialMsg.audioText) {
      setTimeout(() => {
        handlePlayVoice(scenario.initialMsg.id, scenario.initialMsg.audioText);
      }, 500);
    }
  };

  const handleChoiceSelect = (choice) => {
    // 1. Append player choice message
    const playerMsg = {
      id: `user_${Date.now()}`,
      type: 'sent',
      content: choice.text,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, playerMsg]);
    setHistoryNodes(prev => [...prev, `Choix : ${choice.text}`]);

    const nextId = choice.nextMsgId;

    // Check if nextId is a storyNode
    if (selectedScenario.storyNodes && selectedScenario.storyNodes[nextId]) {
      const node = selectedScenario.storyNodes[nextId];

      if (node.type === 'momo') {
        setMomoDetails({
          amount: node.amount || '5 000 FCFA',
          recipient: node.recipient || '+229 01 XX XX XX',
          nextMsgId: node.nextMsgId
        });
        setTimeout(() => setGameState('momo'), 800);
        return;
      }

      // Add received message after short typing delay
      setTimeout(() => {
        setCurrentMsg(node);
        setMessages(prev => [...prev, node]);
        setHistoryNodes(prev => [...prev, node.parts ? node.parts.map(p => p.text).join('') : 'Message reçu']);

        if (node.isVocal && node.audioText) {
          handlePlayVoice(node.id, node.audioText);
        }
      }, 700);

    } else if (selectedScenario.endings && selectedScenario.endings[nextId]) {
      // It's a direct ending
      const ending = selectedScenario.endings[nextId];
      setTimeout(() => {
        setCurrentEnding(ending);
        setGameState('ended');
      }, 900);
    }
  };

  const handleMomoSubmit = (e) => {
    e.preventDefault();
    if (momoDetails.nextMsgId && selectedScenario.endings[momoDetails.nextMsgId]) {
      const ending = selectedScenario.endings[momoDetails.nextMsgId];
      setCurrentEnding(ending);
    } else {
      // Default lose ending if not specified
      setCurrentEnding({
        type: 'lose',
        title: '❌ Transactions effectuée - Argent Perdu !',
        summary: "Vous avez validé le transfert Moov/MTN. L'escroc a récupéré les fonds immédiatement.",
        signalsLearned: ["Ne validez jamais de transfert d'argent sans vérification indépendante"]
      });
    }
    setGameState('ended');
  };

  const handleReplay = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentScreen('menu');
    setCodeSecret('');
    setSelectedScenario(null);
    setPlayingAudioId(null);
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
              <p className="tagline">Moteur de Simulation & Prévention des Arnaques</p>
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
                <span className="momo-logo">Moov / MTN Money</span>
                <button className="momo-close" onClick={handleReplay}>✕</button>
              </div>
              <div className="momo-body">
                <p className="momo-amount">Montant : <strong>{momoDetails.amount}</strong></p>
                <p className="momo-recipient">Bénéficiaire : {momoDetails.recipient}</p>
                <form onSubmit={handleMomoSubmit}>
                  <label className="momo-label">Entrez votre code secret à 4 chiffres :</label>
                  <input type="password" maxLength="4" className="momo-input" value={codeSecret} onChange={(e) => setCodeSecret(e.target.value)} placeholder="****" autoFocus required />
                  <button type="submit" className="momo-btn">Confirmer le Transfert</button>
                </form>
                <p className="momo-warning">⚠️ Ne communiquez jamais votre code secret par téléphone ou message !</p>
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
                      <span className="profile-initial">{currentMsg?.senderName?.[0] || 'I'}</span>
                    </div>
                    <div className="contact-info">
                      <span className="contact-name">{currentMsg?.senderName || selectedScenario?.initialMsg?.senderName}</span>
                      <span className="contact-number">{currentMsg?.senderNumber || selectedScenario?.initialMsg?.senderNumber}</span>
                    </div>
                    <button className="loupe-btn" onClick={() => setLoupeActive(!loupeActive)} title="Activer la loupe de détection">🔍</button>
                  </div>
                </div>
              )}

              <div className="chat-area">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.type}`}>
                    <div className={`message-bubble ${msg.type}`}>
                      {msg.type === 'received' && msg.isVocal && (
                        <div className="vocal-player">
                          <button 
                            className={`vocal-play-btn ${playingAudioId === msg.id ? 'playing' : ''}`}
                            onClick={() => handlePlayVoice(msg.id, msg.audioText || (msg.parts ? msg.parts.map(p => p.text).join('') : msg.content))}
                          >
                            {playingAudioId === msg.id ? '⏸️ Suspendre' : '▶️ Écouter le message vocal'}
                          </button>
                        </div>
                      )}
                      <p>
                        {msg.parts && msg.parts.map((part, index) => (
                          <span key={index} className={part.suspect && loupeActive ? 'highlight' : ''}>{part.text}</span>
                        ))}
                        {!msg.parts && msg.content}
                      </p>
                      <span className="time">{msg.time || '12:00'}</span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {gameState === 'playing' && currentMsg?.choices && (
                <div className="choices-area">
                  {currentMsg.choices.map((choice) => (
                    <button key={choice.id} className="choice-btn" onClick={() => handleChoiceSelect(choice)}>
                      {choice.text}
                    </button>
                  ))}
                </div>
              )}

              {gameState === 'ended' && currentEnding && (
                <div className="end-screen">
                  <div className="score-summary">
                    <h2>{currentEnding.type === 'win' ? '🎉' : currentEnding.type === 'partial' ? '⚠️' : '❌'} {currentEnding.title}</h2>
                    <p className="summary-text">{currentEnding.summary}</p>
                  </div>
                  
                  <div className="path-tree">
                    <h4>📜 Parcours de votre simulation :</h4>
                    {historyNodes.map((nodeText, idx) => (
                      <div key={idx} className="path-node-wrapper">
                        <div className={`path-step ${nodeText.startsWith('Choix :') ? 'highlight-choice' : ''}`}>
                          {nodeText}
                        </div>
                        {idx < historyNodes.length - 1 && <div className="path-line"></div>}
                      </div>
                    ))}
                  </div>

                  {currentEnding.signalsLearned && (
                    <div className="signals-section">
                      <h3>🔍 Leçons & Signaux Clés :</h3>
                      <ul className="signals-list found">
                        {currentEnding.signalsLearned.map((signal, i) => (
                          <li key={i}>💡 {signal}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="prevention-blocks">
                    <div className="prevention-card cnin">
                      <h4>🛡️ Victime d'escroquerie ?</h4>
                      <p>Signalez au <strong>CNIN</strong> (Centre National de Traitement des Incidents)</p>
                    </div>
                    <div className="prevention-card enfance">
                      <h4>👶 Assistance Mineurs ?</h4>
                      <p>Appelez le numéro gratuit <strong>Allô Enfance 138</strong></p>
                    </div>
                  </div>

                  <div className="end-buttons">
                    <button className="choice-btn replay-btn" onClick={handleReplay}>Recommencer un scénario</button>
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
