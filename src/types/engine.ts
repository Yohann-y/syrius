// src/types/engine.ts

import { CaseMessage, CaseChoice } from "./case";

/**
 * State exposed by the game engine to the UI.
 */
export interface EngineState {
  /** Messages currently displayed to the player */
  displayedMessages: CaseMessage[];
  /** Choices available for the player */
  availableChoices: CaseChoice[];
  /** Current pressure level */
  pressure: number;
  /** Total money lost by the player */
  moneyLost: number;
}

/**
 * Events that the UI can send to the engine.
 * Discriminated union based on the `type` field.
 */
export type EngineEvent =
  | { type: "choose"; choiceLabel: string }
  | { type: "inspectMessage"; messageId: string }
  | { type: "tick"; deltaSeconds: number };
