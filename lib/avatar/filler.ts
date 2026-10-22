// Filler speech: a short line spoken the instant a tool call starts, so a tool
// round sounds like a consultant checking rather than dead air. Client-side,
// no model call, zero added latency.

const LINES: Record<string, string[]> = {
  search_projects: ["Thank you, that's helpful. Let me see what fits.", "Give me a second, I'll pull up the options.", "Lovely, let me find the best matches for you."],
  list_units: ["Checking what's still available there.", "Let me look at the unit map.", "Good question, let me check the units."],
  find_adjacent_units: ["Let me find units that sit together.", "Checking which units are side by side.", "Nice idea, let me see what sits together."],
  compare_units: ["Let me put those two side by side.", "One moment, comparing them properly.", "Good thinking, let me compare them for you."],
  get_knowledge: ["Let me get you the exact position on that.", "One moment, I'll check that for you.", "Good one to ask, let me confirm the details."],
  calculate_payment: ["Working that out now.", "Let me run those numbers.", "Sure, let me work that out for you."],
  create_booking: ["Wonderful, let me hold that for you.", "Great choice, I'll reserve that unit now.", "Let me hold that for you."],
};

// Spoken when the model hasn't started answering a customer's message yet.
const ACKS = ["Sure.", "Of course.", "Mm-hmm, one moment.", "Right, let me think about that."];
let ackTurn = -1;

/** Next rotating acknowledgement for a slow reply start. */
export function ackLine(): string {
  ackTurn = (ackTurn + 1) % ACKS.length;
  return ACKS[ackTurn];
}

const turns: Record<string, number> = {};

/** Next rotating line for a tool, or null for tools that don't need one (show). */
export function fillerFor(tool: string): string | null {
  const lines = LINES[tool];
  if (!lines) return null;
  const i = (turns[tool] = (turns[tool] ?? -1) + 1);
  return lines[i % lines.length];
}
