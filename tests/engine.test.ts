// tests/engine.test.ts
import { describe, it, expect } from "vitest";
import { createGame, dispatch, InvalidCaseError } from "../src/engine";
import { Case } from "../src/types/case";

// Sample valid test case with branching & multiple endings
const testCase: Case = {
  metadata: {
    id: "test_case_01",
    title: "Test Scam Case",
    category: "argent",
    scamType: "Phishing",
    playedCharacter: "Victim",
    estimatedDurationMinutes: 5,
  },
  initialMessageId: "msg_1",
  messages: [
    {
      id: "msg_1",
      sender: "Scammer",
      content: { type: "text", text: "Urgent: Send money now!" },
      hiddenSignals: [{ id: "sig_1", explanation: "Urgent tone" }],
      choices: [
        {
          id: "choice_refuse",
          label: "Refuse and report",
          nextId: "end_win",
          effects: { detectedSignals: ["sig_1"], moneyLost: 0, pressureIncrease: 0 },
        },
        {
          id: "choice_pay",
          label: "Pay money",
          nextId: "msg_2",
          effects: { moneyLost: 500, pressureIncrease: 3 },
        },
        {
          id: "choice_invalid_target",
          label: "Go to non-existent node",
          nextId: "non_existent_node",
        },
      ],
    },
    {
      id: "msg_2",
      sender: "Scammer",
      content: { type: "text", text: "Send more!" },
      endingId: "end_lose",
    },
  ],
  endings: [
    {
      id: "end_win",
      type: "réussie",
      summaryMessage: "You successfully avoided the scam!",
    },
    {
      id: "end_lose",
      type: "perdue",
      summaryMessage: "You lost money and got scammed.",
    },
  ],
};

describe("Scenario Engine Pure State Machine", () => {
  it("should complete a winning path successfully", () => {
    let state = createGame(testCase);
    expect(state.status).toBe("playing");
    expect(state.currentNodeId).toBe("msg_1");
    expect(state.history).toEqual(["msg_1"]);
    expect(state.displayedMessages).toHaveLength(1);
    expect(state.availableChoices).toHaveLength(3);

    // Make winning choice
    state = dispatch(state, { type: "CHOOSE", choiceId: "choice_refuse" });

    expect(state.status).toBe("ended");
    expect(state.currentNodeId).toBe("end_win");
    expect(state.history).toEqual(["msg_1", "end_win"]);
    expect(state.currentEnding?.type).toBe("réussie");
    expect(state.moneyLost).toBe(0);
    expect(state.inspectedSignals).toContain("sig_1");
  });

  it("should complete a losing path through multiple nodes and choices", () => {
    let state = createGame(testCase);

    // Make bad choice leading to msg_2
    state = dispatch(state, { type: "CHOOSE", choiceId: "choice_pay" });

    expect(state.status).toBe("playing");
    expect(state.currentNodeId).toBe("msg_2");
    expect(state.history).toEqual(["msg_1", "msg_2"]);
    expect(state.moneyLost).toBe(500);
    expect(state.pressure).toBe(3);
    expect(state.displayedMessages).toHaveLength(2);

    // Auto-advance msg_2 to ending
    state = dispatch(state, { type: "ADVANCE" });

    expect(state.status).toBe("ended");
    expect(state.currentNodeId).toBe("end_lose");
    expect(state.history).toEqual(["msg_1", "msg_2", "end_lose"]);
    expect(state.currentEnding?.type).toBe("perdue");
  });

  it("should handle invalid choice gracefully without mutating state", () => {
    const initialState = createGame(testCase);
    const newState = dispatch(initialState, { type: "CHOOSE", choiceId: "non_existent_choice_id" });

    expect(newState).toBe(initialState);
    expect(newState.currentNodeId).toBe("msg_1");
    expect(newState.history).toEqual(["msg_1"]);
  });

  it("should validate and reject a malformed case", () => {
    const malformedCase = {
      ...testCase,
      initialMessageId: "missing_start",
    };

    expect(() => createGame(malformedCase as any)).toThrow(InvalidCaseError);
  });
});
