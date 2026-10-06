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

export interface CaseMessage {
  id: string;
  sender: string;
  content: MessageContent;
  /** Delay in seconds after previous message */
  delaySeconds: number;
  hiddenSignals?: HiddenSignal[];
}

/** Player choice */
export interface CaseChoice {
  label: string;
  /** next message id */
  nextMessageId: string;
  effects: {
    detectedSignals?: string[];
    moneyLost?: number;
    pressureIncrease?: number;
  };
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
  messages: CaseMessage[];
  choices: CaseChoice[];
  endings: CaseEnding[];
}
