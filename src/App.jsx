import { useState, useEffect, useRef } from 'react'
import './App.css'
import scenarios from './scenarios.json'

// SVG Icon components
const ShieldIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const voiceWaveform = [4, 8, 13, 9, 17, 11, 6, 15, 20, 12, 7, 16, 10, 19, 13, 5, 11, 18, 8, 14, 20, 9, 15, 6, 12, 17, 10, 5, 14, 8, 18, 11, 6, 15];

const getVoiceDuration = (text) => {
  const seconds = Math.max(1, Math.round(text.trim().split(/\s+/).length / 2.5));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

const getBestFrenchVoice = (voices) => voices
  .filter((voice) => voice.lang.toLowerCase().startsWith('fr'))
  .sort((a, b) => {
    const getQualityScore = (voice) => {
      const name = voice.name.toLowerCase();
      return (/\b(natural|neural|premium|enhanced|wavenet|studio|online|hd)\b/.test(name) ? 10 : 0)
        + (voice.lang.toLowerCase() === 'fr-fr' ? 3 : 0)
        + (voice.localService ? 0 : 2);
    };
    return getQualityScore(b) - getQualityScore(a);
  })[0];

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const XCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const LightbulbIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffcc00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.9 14" />
  </svg>
);

function App() {
  const [currentScreen, setCurrentScreen] = useState('menu')
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [currentMsg, setCurrentMsg] = useState(null)
  const [gameState, setGameState] = useState('playing') // 'playing' | 'momo' | 'ended'
  const [loupeActive, setLoupeActive] = useState(false)
  const [codeSecret, setCodeSecret] = useState('')
  const [messages, setMessages] = useState([])
  const [historyNodes, setHistoryNodes] = useState([])
  const [currentTime, setCurrentTime] = useState('')
  const [momoDetails, setMomoDetails] = useState({ amount: '5 000 FCFA', recipient: '+229 01 XX XX XX' })
  const [currentEnding, setCurrentEnding] = useState(null)
  const [playingAudioId, setPlayingAudioId] = useState(null)
  const [voiceError, setVoiceError] = useState(null)
  const [availableVoices, setAvailableVoices] = useState([])

  const chatEndRef = useRef(null);
  const frenchVoiceAvailable = availableVoices.some((voice) => voice.lang.toLowerCase().startsWith('fr'));

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      return undefined;
    }

    const updateVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
  }, []);

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
    setVoiceError(null);

    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setVoiceError({
        msgId,
        message: 'La lecture vocale n’est pas prise en charge par ce navigateur.'
      });
      return;
    }

    if (playingAudioId === msgId) {
      window.speechSynthesis.cancel();
      setPlayingAudioId(null);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      setVoiceError({
        msgId,
        message: 'Aucune voix n’est disponible. Sur Samsung, ouvrez Paramètres > Gestion globale > Synthèse vocale et installez une voix française de qualité élevée.'
      });
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    const frenchVoice = getBestFrenchVoice(voices);
    if (!frenchVoice) {
      setVoiceError({
        msgId,
        message: 'Aucune voix française n’est installée. Dans les paramètres de synthèse vocale Samsung, téléchargez les données vocales françaises de qualité élevée.'
      });
      return;
    }
    utterance.voice = frenchVoice;

    utterance.onstart = () => setPlayingAudioId(msgId);
    utterance.onend = () => setPlayingAudioId(null);
    utterance.onerror = (event) => {
      setPlayingAudioId(null);
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setVoiceError({
          msgId,
          message: 'La lecture vocale a échoué. Vérifiez le moteur de synthèse vocale dans les paramètres de l’appareil.'
        });
      }
    };

    window.speechSynthesis.speak(utterance);
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
    setVoiceError(null);
  };

  const handleChoiceSelect = (choice) => {
    const playerMsg = {
      id: `user_${Date.now()}`,
      type: 'sent',
      content: choice.text,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, playerMsg]);
    setHistoryNodes(prev => [...prev, `Choix : ${choice.text}`]);

    const nextId = choice.nextMsgId;

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

      setTimeout(() => {
        setCurrentMsg(node);
        setMessages(prev => [...prev, node]);
        setHistoryNodes(prev => [...prev, node.parts ? node.parts.map(p => p.text).join('') : 'Message reçu']);
      }, 700);

    } else if (selectedScenario.endings && selectedScenario.endings[nextId]) {
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
      setCurrentEnding({
        type: 'lose',
        title: 'Transactions effectuée - Argent Perdu !',
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
    setVoiceError(null);
  };

const WifiIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13a10 10 0 0 1 14 0" />
    <path d="M8.5 16.5a5 5 0 0 1 7 0" />
    <path d="M12 20h.01" />
  </svg>
);

const BatteryIcon = () => (
  <svg width="20" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="1" width="18" height="10" rx="3" />
    <rect x="3" y="3" width="11" height="6" rx="1.5" fill="currentColor" />
    <path d="M21 4v4" strokeWidth="2" />
  </svg>
);

const CellularSignalIcon = () => (
  <svg width="14" height="12" viewBox="0 0 18 12" fill="currentColor">
    <rect x="0" y="8" width="3" height="4" rx="0.5" />
    <rect x="5" y="5" width="3" height="7" rx="0.5" />
    <rect x="10" y="2" width="3" height="10" rx="0.5" />
    <rect x="15" y="0" width="3" height="12" rx="0.5" />
  </svg>
);

  const renderStatusBar = () => (
    <div className="status-bar status-bar-light">
      <span className="status-time">{currentTime}</span>
      <div className="status-icons">
        <span className="status-signal"><CellularSignalIcon /></span>
        <span className="status-wifi"><WifiIcon /></span>
        <span className="status-battery"><BatteryIcon /></span>
      </div>
    </div>
  );

  const renderHomeIndicator = () => (
    <div className="home-indicator"></div>
  );

  // --- RENDU : MENU PRINCIPAL ---
  if (currentScreen === 'menu') {
    return (
      <div className="app-container">
        <div className="phone-wrapper">
          <div className="phone-frame menu-frame skin-samsung">
            {renderStatusBar()}
            <div className="hole-punch" aria-hidden="true"></div>
            <div className="menu-header">
              <div className="shield-icon">
                <ShieldIcon />
              </div>
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
                  <span className="scen-arrow"><ArrowRightIcon /></span>
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
      <div className="phone-wrapper">
        <div className="phone-frame skin-samsung">
          {renderStatusBar()}
          <div className="hole-punch" aria-hidden="true"></div>
          
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
                <p className="momo-warning">Ne communiquez jamais votre code secret par téléphone ou message !</p>
              </div>
            </div>
          )}

          {/* ÉCRAN DE CHAT & FIN */}
          {gameState !== 'momo' && (
            <>
              {gameState !== 'ended' && (
                <div className="app-header whatsapp-header">
                  <div className="header-top">
                    <button className="back-btn" onClick={handleReplay}><BackIcon /></button>
                    <div className="profile-circle">
                      <span className="profile-initial">{currentMsg?.senderName?.[0] || 'I'}</span>
                    </div>
                    <div className="contact-info">
                      <span className="contact-name">{currentMsg?.senderName || selectedScenario?.initialMsg?.senderName}</span>
                      <span className="contact-number">{currentMsg?.senderNumber || selectedScenario?.initialMsg?.senderNumber}</span>
                    </div>
                    <button className="loupe-btn" onClick={() => setLoupeActive(!loupeActive)} title="Activer la loupe de détection">
                      <SearchIcon />
                    </button>
                  </div>
                </div>
              )}

              <div className="chat-area">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.type} ${msg.isVocal ? 'vocal-message' : ''}`}>
                    <div className={`message-bubble ${msg.type} ${msg.isVocal ? 'vocal-bubble' : ''}`}>
                      {msg.type === 'received' && msg.isVocal ? (
                        <div className="vocal-player">
                          <button
                            className={`vocal-play-btn ${playingAudioId === msg.id ? 'playing' : ''}`}
                            onClick={() => handlePlayVoice(msg.id, msg.audioText || (msg.parts ? msg.parts.map(p => p.text).join('') : msg.content))}
                            aria-label={playingAudioId === msg.id ? 'Mettre en pause le message vocal' : 'Lire le message vocal'}
                            aria-pressed={playingAudioId === msg.id}
                          >
                            {playingAudioId === msg.id ? <PauseIcon /> : <PlayIcon />}
                          </button>
                          <div className="vocal-track">
                            <div className="vocal-waveform" aria-hidden="true">
                              {voiceWaveform.map((height, index) => (
                                <span key={index} style={{ height: `${height}px` }} />
                              ))}
                            </div>
                            <span className="vocal-duration">{getVoiceDuration(msg.audioText || msg.content || '')}</span>
                          </div>
                          {availableVoices.length > 0 && !frenchVoiceAvailable && (
                            <p className="vocal-error" role="note">
                              Installez une voix française de qualité élevée dans les paramètres de synthèse vocale Samsung.
                            </p>
                          )}
                          {voiceError?.msgId === msg.id && (
                            <p className="vocal-error" role="status">{voiceError.message}</p>
                          )}
                        </div>
                      ) : (
                        <p>
                          {msg.parts && msg.parts.map((part, index) => (
                            <span key={index} className={part.suspect && loupeActive ? 'highlight' : ''}>{part.text}</span>
                          ))}
                          {!msg.parts && msg.content}
                        </p>
                      )}
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
                    <div className="ending-icon">
                      {currentEnding.type === 'win' && <CheckCircleIcon />}
                      {currentEnding.type === 'partial' && <AlertTriangleIcon />}
                      {currentEnding.type === 'lose' && <XCircleIcon />}
                    </div>
                    <h2>{currentEnding.title}</h2>
                    <p className="summary-text">{currentEnding.summary}</p>
                  </div>
                  
                  <div className="path-tree">
                    <h4>Parcours de votre simulation :</h4>
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
                      <h3>Leçons & Signaux Clés :</h3>
                      <ul className="signals-list found">
                        {currentEnding.signalsLearned.map((signal, i) => (
                          <li key={i}>
                            <LightbulbIcon />
                            <span>{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="prevention-blocks">
                    <div className="prevention-card cnin">
                      <h4>Victime d'escroquerie ?</h4>
                      <p>Signalez au <strong>CNIN</strong> (Centre National de Traitement des Incidents)</p>
                    </div>
                    <div className="prevention-card enfance">
                      <h4>Assistance Mineurs ?</h4>
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
