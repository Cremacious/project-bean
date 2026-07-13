// lib/parental-gate.ts
// Logic for the parental gate (issue #32): a light "is a grown up here" check
// shown before account sign up and before any purchase or subscription. It is a
// friction gate for young children, NOT identity verification and NOT verifiable
// parental consent (see docs/COMPLIANCE-COPPA.md section 4; both are needed).
//
// The challenge asks the adult to read three numbers spelled out as words
// ("four, seven, two") and type the digits (472). A pre reading child cannot do
// this; an adult does it in a second. The words are ordinary text, so a screen
// reader announces them naturally and the answer goes in a normal number field.
// There is no fixed answer: a fresh set of digits is generated every time.

/** Digits spelled out. Index matches the digit, so NUMBER_WORDS[4] === "four". */
export const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
] as const;

/** How many numbers the adult must read and enter. */
export const GATE_DIGIT_COUNT = 3;

export type GateChallenge = {
  /** The digits to enter, in order, e.g. [4, 7, 2]. */
  digits: number[];
  /** Those digits spelled out, e.g. ["four", "seven", "two"]. */
  words: string[];
  /** The expected answer as typed, e.g. "472". */
  answer: string;
};

/**
 * Build a fresh challenge. `random` is injectable so tests are deterministic; it
 * defaults to Math.random and must return a float in the range [0, 1).
 *
 * Digits are drawn from 1 to 9 (never 0), which keeps the spoken list free of
 * "zero" and avoids any leading zero ambiguity when the answer is compared as a
 * string.
 */
export function generateGateChallenge(
  random: () => number = Math.random,
): GateChallenge {
  const digits: number[] = [];
  for (let i = 0; i < GATE_DIGIT_COUNT; i++) {
    digits.push(1 + Math.floor(random() * 9)); // 1..9 inclusive
  }
  return {
    digits,
    words: digits.map((d) => NUMBER_WORDS[d]),
    answer: digits.join(""),
  };
}

/**
 * True when `input` matches the challenge. We keep only the digits the person
 * typed, so "472", "4 7 2", and "4, 7, 2" all pass. An empty or non matching
 * answer is false.
 */
export function checkGateAnswer(challenge: GateChallenge, input: string): boolean {
  const entered = input.replace(/\D+/g, "");
  return entered.length > 0 && entered === challenge.answer;
}

/**
 * Session storage key used to remember that the gate was passed for a given
 * purpose within the current flow (for example "signup" or "purchase"), so the
 * grown up is not challenged again and again inside the same action.
 */
export function gatePassKey(purpose: string): string {
  return `bq:parental-gate:${purpose}`;
}
