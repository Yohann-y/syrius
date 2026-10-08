import { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Speech from 'expo-speech'
import scenarios from '../src/scenarios.json'

const colors = {
  background: '#f3f6f5',
  surface: '#ffffff',
  primary: '#087e75',
  primaryDark: '#075e58',
  text: '#1b2928',
  muted: '#687876',
  border: '#dce5e3',
  green: '#16825d',
  red: '#ba1a1a',
}

const getMessageText = (message) =>
  message.parts?.map((part) => part.text).join('') || message.content || ''

const getCurrentTime = () =>
  new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

function Button({ children, onPress, secondary = false, disabled = false, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
        style,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>
        {children}
      </Text>
    </Pressable>
  )
}

export default function App() {
  const [screen, setScreen] = useState('intro')
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [currentMessage, setCurrentMessage] = useState(null)
  const [messages, setMessages] = useState([])
  const [history, setHistory] = useState([])
  const [ending, setEnding] = useState(null)
  const [momoDetails, setMomoDetails] = useState(null)
  const [secretCode, setSecretCode] = useState('')
  const [loupeActive, setLoupeActive] = useState(false)
  const [playingAudioId, setPlayingAudioId] = useState(null)
  const [voiceError, setVoiceError] = useState(null)

  useEffect(() => () => {
    Speech.stop()
  }, [])

  const startScenario = (scenario) => {
    setSelectedScenario(scenario)
    setCurrentMessage(scenario.initialMsg)
    setMessages([scenario.initialMsg])
    setHistory([getMessageText(scenario.initialMsg) || 'Début'])
    setEnding(null)
    setMomoDetails(null)
    setSecretCode('')
    setLoupeActive(false)
    setVoiceError(null)
    setPlayingAudioId(null)
    setScreen('game')
  }

  const handleChoiceSelect = (choice) => {
    const nextId = choice.nextMsgId
    const nextNode = selectedScenario.storyNodes?.[nextId]
    const nextEnding = selectedScenario.endings?.[nextId]

    setMessages((previous) => [
      ...previous,
      {
        id: `user_${Date.now()}`,
        type: 'sent',
        content: choice.text,
        time: getCurrentTime(),
      },
    ])
    setHistory((previous) => [...previous, `Choix : ${choice.text}`])
    setVoiceError(null)
    setPlayingAudioId(null)
    Speech.stop()

    if (nextNode?.type === 'momo') {
      setMomoDetails(nextNode)
      setSecretCode('')
      setScreen('momo')
      return
    }

    if (nextNode) {
      setCurrentMessage(nextNode)
      setMessages((previous) => [...previous, nextNode])
      setHistory((previous) => [...previous, getMessageText(nextNode) || 'Message reçu'])
      return
    }

    if (nextEnding) {
      setEnding(nextEnding)
      setHistory((previous) => [...previous, nextEnding.title])
      setScreen('results')
    }
  }

  const handleMomoSubmit = () => {
    if (!/^\d{4}$/.test(secretCode)) return

    const nextEnding = selectedScenario.endings?.[momoDetails.nextMsgId] || {
      type: 'lose',
      title: 'Transaction effectuée - argent perdu !',
      summary:
        "Vous avez validé le transfert Moov/MTN. L'escroc a récupéré les fonds immédiatement.",
      signalsLearned: [
        "Ne validez jamais de transfert d'argent sans vérification indépendante",
      ],
    }
    setEnding(nextEnding)
    setHistory((previous) => [...previous, nextEnding.title])
    setSecretCode('')
    setScreen('results')
  }

  const replay = () => {
    Speech.stop()
    setSelectedScenario(null)
    setCurrentMessage(null)
    setMessages([])
    setHistory([])
    setEnding(null)
    setMomoDetails(null)
    setSecretCode('')
    setVoiceError(null)
    setPlayingAudioId(null)
    setScreen('menu')
  }

  const handlePlayVoice = (messageId, text) => {
    setVoiceError(null)
    if (playingAudioId === messageId) {
      Speech.stop()
      setPlayingAudioId(null)
      return
    }

    Speech.stop()
    setPlayingAudioId(messageId)
    try {
      Speech.speak(text, {
        language: 'fr-FR',
        rate: 0.9,
        onDone: () => setPlayingAudioId(null),
        onStopped: () => setPlayingAudioId(null),
        onError: () => {
          setPlayingAudioId(null)
          setVoiceError('La lecture vocale a échoué. Vérifiez la synthèse vocale dans les paramètres de l’appareil.')
        },
      })
    } catch (error) {
      setPlayingAudioId(null)
      setVoiceError(
        error instanceof Error
          ? `Impossible de lancer la lecture vocale : ${error.message}`
          : 'Impossible de lancer la lecture vocale.',
      )
    }
  }

  const renderMessageContent = (message) => {
    if (message.parts?.length) {
      return message.parts.map((part, index) => (
        <Text
          key={`${message.id}_${index}`}
          style={part.suspect && loupeActive ? styles.suspectText : undefined}
        >
          {part.text}
        </Text>
      ))
    }
    return message.content || ''
  }

  if (screen === 'intro') {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.page}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.hero}>
          <View style={styles.logoMark}>
            <Text style={styles.logoShield}>✓</Text>
          </View>
          <Text style={styles.brand}>SYRIUS</Text>
          <Text style={styles.kicker}>APPRENDRE À SE PROTÉGER</Text>
          <Text style={styles.heroTitle}>
            Reconnaître une arnaque avant d’en être victime
          </Text>
          <Text style={styles.bodyText}>
            Entraînez-vous à repérer les signes d’une arnaque dans des situations réalistes.
          </Text>
          <Text style={styles.availability}>
            {scenarios.length} simulations pour apprendre à votre rythme
          </Text>
        </View>
        <View style={styles.bottomAction}>
          <Button onPress={() => setScreen('menu')}>Commencer</Button>
          <Text style={styles.caption}>Aucune expérience nécessaire</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (screen === 'menu') {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.page}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ScrollView contentContainerStyle={styles.menuContent}>
          <View style={styles.menuHeading}>
            <View style={styles.logoMarkSmall}>
              <Text style={styles.logoShieldSmall}>✓</Text>
            </View>
            <Text style={styles.brand}>SYRIUS</Text>
            <Text style={styles.bodyText}>Moteur de simulation et prévention des arnaques</Text>
          </View>
          <Text style={styles.sectionTitle}>Choisissez une simulation</Text>
          <Text style={styles.sectionDescription}>
            Quelle situation souhaitez-vous apprendre à reconnaître ?
          </Text>
          <View style={styles.scenarioList}>
            {scenarios.map((scenario) => (
              <Pressable
                accessibilityRole="button"
                key={scenario.id}
                onPress={() => startScenario(scenario)}
                style={({ pressed }) => [styles.scenarioCard, pressed && styles.pressedButton]}
              >
                <View style={styles.scenarioIcon}>
                  <Text style={styles.scenarioIconText}>
                    {scenario.categorie === 'Urgence'
                      ? '!'
                      : scenario.categorie === 'Appel'
                        ? '☎'
                        : scenario.categorie === 'Livraison'
                          ? '▣'
                          : '€'}
                  </Text>
                </View>
                <View style={styles.scenarioInfo}>
                  <Text style={styles.scenarioCategory}>{scenario.categorie}</Text>
                  <Text style={styles.scenarioTitle}>{scenario.titre}</Text>
                  <Text style={styles.scenarioDescription}>{scenario.description}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.menuFooter}>
            Prenez le temps de vérifier. Ne cédez jamais à la pression.
          </Text>
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (screen === 'momo') {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.page}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}
        >
          <View style={styles.momoHeader}>
            <Text style={styles.momoBrand}>Moov / MTN Money</Text>
            <Pressable accessibilityRole="button" onPress={replay}>
              <Text style={styles.closeButton}>Fermer</Text>
            </Pressable>
          </View>
          <View style={styles.momoContent}>
            <Text style={styles.momoTitle}>Confirmer le transfert</Text>
            <Text style={styles.momoAmount}>Montant : {momoDetails?.amount || '5 000 FCFA'}</Text>
            <Text style={styles.bodyText}>
              Bénéficiaire : {momoDetails?.recipient || '+229 01 XX XX XX'}
            </Text>
            <Text style={styles.fieldLabel}>Entrez votre code secret à 4 chiffres</Text>
            <TextInput
              accessibilityLabel="Code secret à quatre chiffres"
              autoComplete="off"
              keyboardType="number-pad"
              maxLength={4}
              onChangeText={(value) => setSecretCode(value.replace(/\D/g, ''))}
              secureTextEntry
              style={styles.secretInput}
              value={secretCode}
            />
            <Button
              disabled={secretCode.length !== 4}
              onPress={handleMomoSubmit}
              style={styles.fullWidthButton}
            >
              Confirmer le transfert
            </Button>
            <Text style={styles.warning}>
              Ne communiquez jamais votre code secret par téléphone ou message !
            </Text>
            <Button onPress={replay} secondary style={styles.fullWidthButton}>
              Quitter la simulation
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  if (screen === 'results' && ending) {
    const endingColor = ending.type === 'win'
      ? colors.green
      : ending.type === 'partial'
        ? '#a65b00'
        : colors.red

    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.page}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <Text style={styles.brand}>SYRIUS</Text>
          <Text style={styles.resultsLabel}>Bilan de la simulation</Text>
          <View style={[styles.endingMark, { borderColor: endingColor }]}>
            <Text style={[styles.endingMarkText, { color: endingColor }]}>
              {ending.type === 'win' ? '✓' : ending.type === 'partial' ? '!' : '×'}
            </Text>
          </View>
          <Text style={styles.endingTitle}>{ending.title}</Text>
          <Text style={styles.endingSummary}>{ending.summary}</Text>
          {history.length > 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.resultSectionTitle}>Parcours de votre simulation</Text>
              {history.map((item, index) => (
                <View key={`${index}_${item}`} style={styles.historyItem}>
                  <View style={styles.historyDot} />
                  <Text style={styles.historyText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
          {ending.signalsLearned?.length > 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.resultSectionTitle}>Leçons et signaux clés</Text>
              {ending.signalsLearned.map((signal) => (
                <Text key={signal} style={styles.signalText}>•  {signal}</Text>
              ))}
            </View>
          )}
          <View style={styles.preventionCard}>
            <Text style={styles.preventionTitle}>Victime d’escroquerie ?</Text>
            <Text style={styles.bodyText}>
              Signalez au CNIN (Centre National de Traitement des Incidents).
            </Text>
          </View>
          <View style={styles.preventionCard}>
            <Text style={styles.preventionTitle}>Besoin d’assistance pour un mineur ?</Text>
            <Text style={styles.bodyText}>Appelez le numéro gratuit Allô Enfance 138.</Text>
          </View>
          <Button onPress={replay} style={styles.fullWidthButton}>
            Recommencer un scénario
          </Button>
        </ScrollView>
      </SafeAreaView>
    )
  }

  const isCall = currentMessage?.isCall

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.gamePage}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={styles.chatHeader}>
        <Pressable accessibilityRole="button" onPress={replay} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <View style={styles.chatContact}>
          <Text style={styles.chatContactName}>
            {currentMessage?.senderName || selectedScenario?.initialMsg?.senderName || 'Simulation'}
          </Text>
          <Text style={styles.chatContactNumber}>
            {currentMessage?.senderNumber || selectedScenario?.initialMsg?.senderNumber || 'Scénario simulé'}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={loupeActive ? 'Désactiver la loupe' : 'Activer la loupe'}
          accessibilityRole="button"
          onPress={() => setLoupeActive((active) => !active)}
          style={[styles.loupeButton, loupeActive && styles.loupeButtonActive]}
        >
          <Text style={styles.loupeButtonText}>Loupe</Text>
        </Pressable>
      </View>

      {isCall && (
        <View style={styles.callBanner}>
          <Text style={styles.callBannerTitle}>Appel simulé</Text>
          <Text style={styles.callBannerText}>
            Écoutez le message avant de choisir votre réaction.
          </Text>
          <Button
            onPress={() => handlePlayVoice(currentMessage.id, currentMessage.audioText || '')}
            secondary
            style={styles.audioButton}
          >
            {playingAudioId === currentMessage.id ? 'Arrêter l’appel' : 'Écouter l’appel'}
          </Button>
          {voiceError && <Text style={styles.voiceError}>{voiceError}</Text>}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.chatMessages}>
        <Text style={styles.chatDate}>Aujourd’hui</Text>
        {messages.map((message) => {
          const isSent = message.type === 'sent'
          const vocalText = message.audioText || getMessageText(message)
          return (
            <View
              key={message.id}
              style={[styles.messageRow, isSent && styles.sentMessageRow]}
            >
              <View style={[styles.messageBubble, isSent && styles.sentMessageBubble]}>
                {message.isVocal && !isSent ? (
                  <View>
                    <Button
                      onPress={() => handlePlayVoice(message.id, vocalText)}
                      secondary
                      style={styles.audioButton}
                    >
                      {playingAudioId === message.id ? 'Arrêter le vocal' : 'Écouter le vocal'}
                    </Button>
                    <Text style={styles.vocalTranscript}>{getMessageText(message)}</Text>
                    {voiceError && playingAudioId === null && (
                      <Text style={styles.voiceError}>{voiceError}</Text>
                    )}
                  </View>
                ) : (
                  <Text style={[styles.messageText, isSent && styles.sentMessageText]}>
                    {renderMessageContent(message)}
                  </Text>
                )}
                <Text style={[styles.messageTime, isSent && styles.sentMessageTime]}>
                  {message.time || '12:00'}
                </Text>
              </View>
            </View>
          )
        })}
      </ScrollView>

      {currentMessage?.choices?.length > 0 && (
        <View style={styles.choices}>
          <Text style={styles.choicesHeading}>
            {isCall ? 'Que faites-vous ?' : 'Choisissez votre réponse'}
          </Text>
          {currentMessage.choices.map((choice) => (
            <Button
              key={choice.id}
              onPress={() => handleChoiceSelect(choice)}
              secondary
              style={styles.choiceButton}
            >
              {choice.text}
            </Button>
          ))}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 76,
    justifyContent: 'center',
    marginBottom: 18,
    width: 76,
  },
  logoShield: { color: colors.surface, fontSize: 40, fontWeight: '700' },
  brand: { color: colors.primaryDark, fontSize: 18, fontWeight: '800', letterSpacing: 3 },
  kicker: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 38,
    textAlign: 'center',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 31,
    fontWeight: '800',
    lineHeight: 39,
    marginTop: 16,
    textAlign: 'center',
  },
  bodyText: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 10 },
  availability: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
  },
  bottomAction: { paddingBottom: 20 },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: { color: colors.surface, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  secondaryButtonText: { color: colors.text },
  disabledButton: { opacity: 0.45 },
  pressedButton: { opacity: 0.75 },
  caption: { color: colors.muted, fontSize: 12, marginTop: 12, textAlign: 'center' },
  menuContent: { paddingBottom: 30 },
  menuHeading: { alignItems: 'center', paddingVertical: 22 },
  logoMarkSmall: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    marginBottom: 12,
    width: 56,
  },
  logoShieldSmall: { color: colors.surface, fontSize: 30, fontWeight: '700' },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 12 },
  sectionDescription: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 6 },
  scenarioList: { gap: 12, marginTop: 20 },
  scenarioCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  scenarioIcon: {
    alignItems: 'center',
    backgroundColor: '#e1f2ef',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  scenarioIconText: { color: colors.primaryDark, fontSize: 21, fontWeight: '800' },
  scenarioInfo: { flex: 1 },
  scenarioCategory: { color: colors.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  scenarioTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 3 },
  scenarioDescription: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  arrow: { color: colors.primary, fontSize: 26, fontWeight: '500' },
  menuFooter: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 22, textAlign: 'center' },
  momoHeader: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  momoBrand: { color: colors.primaryDark, fontSize: 16, fontWeight: '800' },
  closeButton: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  momoContent: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 40 },
  momoTitle: { color: colors.text, fontSize: 23, fontWeight: '800' },
  momoAmount: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 28 },
  fieldLabel: { alignSelf: 'flex-start', color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 32 },
  secretInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 22,
    height: 56,
    letterSpacing: 12,
    marginTop: 10,
    textAlign: 'center',
    width: '100%',
  },
  fullWidthButton: { alignSelf: 'stretch', marginTop: 16 },
  warning: { color: colors.red, fontSize: 13, lineHeight: 20, marginTop: 20, textAlign: 'center' },
  resultsContent: { alignItems: 'center', paddingBottom: 34 },
  resultsLabel: { color: colors.muted, fontSize: 13, marginTop: 6 },
  endingMark: {
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 2,
    height: 64,
    justifyContent: 'center',
    marginTop: 24,
    width: 64,
  },
  endingMarkText: { fontSize: 34, fontWeight: '700' },
  endingTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  endingSummary: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10, textAlign: 'center' },
  resultSection: { alignSelf: 'stretch', marginTop: 24 },
  resultSectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  historyItem: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, marginBottom: 10 },
  historyDot: { backgroundColor: colors.primary, borderRadius: 4, height: 8, marginTop: 6, width: 8 },
  historyText: { color: colors.muted, flex: 1, fontSize: 13, lineHeight: 19 },
  signalText: { color: colors.text, fontSize: 13, lineHeight: 20, marginBottom: 8 },
  preventionCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  preventionTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  keyboardAvoiding: { flex: 1 },
  gamePage: { backgroundColor: '#edf2f0', flex: 1 },
  chatHeader: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 66,
    paddingHorizontal: 14,
  },
  backButton: { paddingHorizontal: 8, paddingVertical: 4 },
  backButtonText: { color: colors.primary, fontSize: 34, lineHeight: 38 },
  chatContact: { flex: 1, marginLeft: 8 },
  chatContactName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  chatContactNumber: { color: colors.muted, fontSize: 11, marginTop: 3 },
  loupeButton: { borderColor: colors.border, borderRadius: 10, borderWidth: 1, padding: 8 },
  loupeButtonActive: { backgroundColor: '#fff2c2', borderColor: '#e0b326' },
  loupeButtonText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  callBanner: { alignItems: 'center', backgroundColor: '#e1f2ef', padding: 16 },
  callBannerTitle: { color: colors.primaryDark, fontSize: 17, fontWeight: '800' },
  callBannerText: { color: colors.muted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  audioButton: { alignSelf: 'flex-start', marginTop: 8, minHeight: 42 },
  chatMessages: { gap: 10, padding: 14, paddingBottom: 20 },
  chatDate: { color: colors.muted, fontSize: 11, marginBottom: 6, textAlign: 'center' },
  messageRow: { alignItems: 'flex-start', flexDirection: 'row' },
  sentMessageRow: { justifyContent: 'flex-end' },
  messageBubble: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    maxWidth: '88%',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  sentMessageBubble: { backgroundColor: '#d9f1e7' },
  messageText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  sentMessageText: { color: colors.text },
  suspectText: { backgroundColor: '#ffe49a', color: '#553900', fontWeight: '800' },
  messageTime: { color: colors.muted, fontSize: 10, marginTop: 6, textAlign: 'right' },
  sentMessageTime: { color: '#4f756a' },
  vocalTranscript: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  voiceError: { color: colors.red, fontSize: 12, lineHeight: 18, marginTop: 8 },
  choices: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, gap: 8, padding: 14 },
  choicesHeading: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  choiceButton: { alignSelf: 'stretch', minHeight: 46 },
})
