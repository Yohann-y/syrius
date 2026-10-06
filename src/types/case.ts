// src/types/case.ts

/** Category of the case */
export type CaseCategory = "argent" | "emploi" | "logement" | "urgence" | "image";

/** Metadata about a case */
export interface CaseMetadata {
  id: string;
  title: string;
  category: CaseCategory;
  scamType: string;
  playedCharacter: string;
  estimatedDurationMinutes: number;
}

/** Message content can be text or voice */
export interface TextContent {
  type: "text";
  text: string;
}

export interface VoiceContent {
  type: "voice";
  voiceUrl?: string;
  transcription: string;
}

export type MessageContent = TextContent | VoiceContent;

/** Hidden signal */
export interface HiddenSignal {
  id: string;
  explanation: string;
}

/** Player choice effect */
export interface ChoiceEffects {
  detectedSignals?: string[];
  moneyLost?: number;
  pressureIncrease?: number;
}

/** Player choice */
export interface CaseChoice {
  id: string;
  label: string;
  /** Next target: message ID or ending ID */
  nextId: string;
  effects?: ChoiceEffects;
}

/** Message node in a scenario */
export interface CaseMessage {
  id: string;
  sender: string;
  content: MessageContent;
  /** Delay in seconds after previous message for auto-advancing (0 for immediate) */
  delaySeconds?: number;
  hiddenSignals?: HiddenSignal[];
  /** Message ID to auto-advance to (if no choices offered) */
  nextMessageId?: string;
  /** Choices offered at this message node */
  choices?: CaseChoice[];
  /** Ending ID triggered directly after this message if no choices */
  endingId?: string;
}

/** Ending */
export type EndingType = "réussie" | "perdue" | "partielle";

export interface CaseEnding {
  id: string;
  type: EndingType;
  summaryMessage: string;
}

/** Full case definition */
export interface Case {
  metadata: CaseMetadata;
  initialMessageId: string;
  messages: CaseMessage[];
  endings: CaseEnding[];
}
