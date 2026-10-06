// src/types/engine.ts

import { CaseMessage, CaseChoice, CaseEnding } from "./case";

/**
 * State of the scenario engine (pure state machine).
 */
export interface GameState {
  /** The case currently being played */
  caseData: import("./case").Case;
  /** Current active node ID (message ID or ending ID) */
  currentNodeId: string;
  /** Ordered list of node IDs visited during the play-through */
  history: string[];
  /** Messages displayed to the player in order */
  displayedMessages: CaseMessage[];
  /** Currently available choices for the player (empty if ended or auto-advancing) */
  availableChoices: CaseChoice[];
  /** Current pressure level */
  pressure: number;
  /** Total money lost by the player */
  moneyLost: number;
  /** Signals detected/inspected by the player */
  inspectedSignals: string[];
  /** Final status of the game: "playing" | "ended" */
  status: "playing" | "ended";
  /** Current active ending if game has ended */
  currentEnding?: CaseEnding;
}

/**
 * Events sent to the scenario engine.
 */
export type GameEvent =
  | { type: "CHOOSE"; choiceId: string }
  | { type: "INSPECT_MESSAGE"; messageId: string }
  | { type: "ADVANCE" };
