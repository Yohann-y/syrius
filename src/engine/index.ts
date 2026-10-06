// src/engine/index.ts

import { Case } from "../types/case";
import { GameState, GameEvent } from "../types/engine";

export class InvalidCaseError extends Error {
  constructor(message: string) {
    super(`Invalid Case: ${message}`);
    this.name = "InvalidCaseError";
  }
}

/**
 * Validates a case definition structure.
 * Throws InvalidCaseError if the case is malformed.
 */
export function validateCase(caseData: Case): void {
  if (!caseData) {
    throw new InvalidCaseError("Case data is missing or null");
  }

  if (!caseData.metadata || !caseData.metadata.id || !caseData.metadata.title) {
    throw new InvalidCaseError("Case metadata is missing required fields (id, title)");
  }

  if (!Array.isArray(caseData.messages) || caseData.messages.length === 0) {
    throw new InvalidCaseError("Case must contain at least one message");
  }

  if (!Array.isArray(caseData.endings) || caseData.endings.length === 0) {
    throw new InvalidCaseError("Case must contain at least one ending");
  }

  if (!caseData.initialMessageId) {
    throw new InvalidCaseError("Case missing initialMessageId");
  }

  const messageMap = new Map(caseData.messages.map((m) => [m.id, m]));
  const endingMap = new Map(caseData.endings.map((e) => [e.id, e]));

  if (!messageMap.has(caseData.initialMessageId)) {
    throw new InvalidCaseError(`Initial message ID '${caseData.initialMessageId}' not found in messages`);
  }

  // Validate node links and choices
  for (const msg of caseData.messages) {
    if (msg.choices && msg.choices.length > 0) {
      for (const choice of msg.choices) {
        if (!choice.id || !choice.label || !choice.nextId) {
          throw new InvalidCaseError(`Message '${msg.id}' has a choice missing id, label, or nextId`);
        }
        if (!messageMap.has(choice.nextId) && !endingMap.has(choice.nextId)) {
          throw new InvalidCaseError(
            `Choice '${choice.id}' in message '${msg.id}' targets non-existent node '${choice.nextId}'`
          );
        }
      }
    } else {
      // Auto-advance or direct ending
      if (msg.nextMessageId && !messageMap.has(msg.nextMessageId)) {
        throw new InvalidCaseError(
          `Message '${msg.id}' specifies non-existent nextMessageId '${msg.nextMessageId}'`
        );
      }
      if (msg.endingId && !endingMap.has(msg.endingId)) {
        throw new InvalidCaseError(
          `Message '${msg.id}' specifies non-existent endingId '${msg.endingId}'`
        );
      }
    }
  }
}

/**
 * Initializes a new game state from a case definition.
 */
export function createGame(caseData: Case): GameState {
  validateCase(caseData);

  const initialMsg = caseData.messages.find((m) => m.id === caseData.initialMessageId)!;
  const endingMap = new Map(caseData.endings.map((e) => [e.id, e]));
  const isEnding = endingMap.has(initialMsg.id);

  if (isEnding) {
    const ending = endingMap.get(initialMsg.id)!;
    return {
      caseData,
      currentNodeId: ending.id,
      history: [ending.id],
      displayedMessages: [],
      availableChoices: [],
      pressure: 0,
      moneyLost: 0,
      inspectedSignals: [],
      status: "ended",
      currentEnding: ending,
    };
  }

  return {
    caseData,
    currentNodeId: initialMsg.id,
    history: [initialMsg.id],
    displayedMessages: [initialMsg],
    availableChoices: initialMsg.choices || [],
    pressure: 0,
    moneyLost: 0,
    inspectedSignals: [],
    status: "playing",
  };
}

/**
 * Pure state machine transition function.
 * Returns a new updated GameState based on the input state and event.
 */
export function dispatch(state: GameState, event: GameEvent): GameState {
  if (state.status === "ended") {
    return state;
  }

  const { caseData } = state;
  const messageMap = new Map(caseData.messages.map((m) => [m.id, m]));
  const endingMap = new Map(caseData.endings.map((e) => [e.id, e]));

  switch (event.type) {
    case "CHOOSE": {
      const currentMsg = messageMap.get(state.currentNodeId);
      if (!currentMsg || !currentMsg.choices) {
        return state;
      }

      const choice = currentMsg.choices.find((c) => c.id === event.choiceId);
      if (!choice) {
        // Invalid choice
        return state;
      }

      const nextId = choice.nextId;
      const pressureDelta = choice.effects?.pressureIncrease || 0;
      const moneyDelta = choice.effects?.moneyLost || 0;
      const newSignals = choice.effects?.detectedSignals || [];

      const updatedPressure = Math.max(0, state.pressure + pressureDelta);
      const updatedMoneyLost = state.moneyLost + moneyDelta;
      const updatedSignals = Array.from(new Set([...state.inspectedSignals, ...newSignals]));
      const newHistory = [...state.history, nextId];

      if (endingMap.has(nextId)) {
        const ending = endingMap.get(nextId)!;
        return {
          ...state,
          currentNodeId: nextId,
          history: newHistory,
          availableChoices: [],
          pressure: updatedPressure,
          moneyLost: updatedMoneyLost,
          inspectedSignals: updatedSignals,
          status: "ended",
          currentEnding: ending,
        };
      }

      const nextMsg = messageMap.get(nextId);
      if (!nextMsg) {
        return state;
      }

      return {
        ...state,
        currentNodeId: nextId,
        history: newHistory,
        displayedMessages: [...state.displayedMessages, nextMsg],
        availableChoices: nextMsg.choices || [],
        pressure: updatedPressure,
        moneyLost: updatedMoneyLost,
        inspectedSignals: updatedSignals,
      };
    }

    case "INSPECT_MESSAGE": {
      const msg = messageMap.get(event.messageId);
      if (!msg || !msg.hiddenSignals) {
        return state;
      }
      const signalIds = msg.hiddenSignals.map((s) => s.id);
      const updatedSignals = Array.from(new Set([...state.inspectedSignals, ...signalIds]));
      return {
        ...state,
        inspectedSignals: updatedSignals,
      };
    }

    case "ADVANCE": {
      const currentMsg = messageMap.get(state.currentNodeId);
      if (!currentMsg || (currentMsg.choices && currentMsg.choices.length > 0)) {
        return state;
      }

      if (currentMsg.endingId && endingMap.has(currentMsg.endingId)) {
        const ending = endingMap.get(currentMsg.endingId)!;
        return {
          ...state,
          currentNodeId: ending.id,
          history: [...state.history, ending.id],
          availableChoices: [],
          status: "ended",
          currentEnding: ending,
        };
      }

      if (currentMsg.nextMessageId && messageMap.has(currentMsg.nextMessageId)) {
        const nextMsg = messageMap.get(currentMsg.nextMessageId)!;
        return {
          ...state,
          currentNodeId: nextMsg.id,
          history: [...state.history, nextMsg.id],
          displayedMessages: [...state.displayedMessages, nextMsg],
          availableChoices: nextMsg.choices || [],
        };
      }

      return state;
    }

    default:
      return state;
  }
}
