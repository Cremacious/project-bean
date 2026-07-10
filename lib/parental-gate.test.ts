import { describe, it, expect } from "vitest";
import {
  generateGateChallenge,
  checkGateAnswer,
  gatePassKey,
  GATE_DIGIT_COUNT,
  NUMBER_WORDS,
} from "./parental-gate";

/**
 * A deterministic stand in for Math.random that yields each value in `values`
 * in turn (looping if needed). Lets us pin exactly which digits a challenge
 * gets so its words and answer are predictable.
 */
function seededRandom(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("generateGateChallenge", () => {
  it("produces the configured number of digits, each between 1 and 9", () => {
    // Sweep a spread of random outputs so every branch of the 1..9 mapping runs.
    for (const r of [0, 0.1, 0.5, 0.9, 0.999]) {
      const challenge = generateGateChallenge(() => r);
      expect(challenge.digits).toHaveLength(GATE_DIGIT_COUNT);
      for (const d of challenge.digits) {
        expect(d).toBeGreaterThanOrEqual(1);
        expect(d).toBeLessThanOrEqual(9);
      }
    }
  });

  it("never includes zero, so the spoken list has no leading zero ambiguity", () => {
    // random() at its floor (0) must map to 1, not 0.
    const challenge = generateGateChallenge(() => 0);
    expect(challenge.digits).toEqual([1, 1, 1]);
    expect(challenge.words).toEqual(["one", "one", "one"]);
    expect(challenge.answer).toBe("111");
  });

  it("spells each digit correctly and joins the answer in order", () => {
    // 0 -> 1 ("one"), ~0.667 -> 7 ("seven"), ~0.222 -> 3 ("three")
    const challenge = generateGateChallenge(seededRandom([0, 6 / 9, 2 / 9]));
    expect(challenge.digits).toEqual([1, 7, 3]);
    expect(challenge.words).toEqual(["one", "seven", "three"]);
    expect(challenge.answer).toBe("173");
    // Words always match the digits via the shared NUMBER_WORDS table.
    expect(challenge.words).toEqual(challenge.digits.map((d) => NUMBER_WORDS[d]));
  });

  it("does not use a fixed answer: varied randomness yields varied challenges", () => {
    const answers = new Set<string>();
    // 30 pulls across the [0,1) range should not all collapse to one answer.
    for (let n = 0; n < 30; n++) {
      answers.add(generateGateChallenge(seededRandom([n / 30, (n * 7) % 30 / 30, (n * 3) % 30 / 30])).answer);
    }
    expect(answers.size).toBeGreaterThan(1);
  });
});

describe("checkGateAnswer", () => {
  const challenge = generateGateChallenge(seededRandom([3 / 9, 6 / 9, 1 / 9]));
  // digits: [4, 7, 2] -> answer "472"

  it("accepts the exact digits", () => {
    expect(challenge.answer).toBe("472");
    expect(checkGateAnswer(challenge, "472")).toBe(true);
  });

  it("ignores spaces, commas, and other separators between the digits", () => {
    expect(checkGateAnswer(challenge, "4 7 2")).toBe(true);
    expect(checkGateAnswer(challenge, "4, 7, 2")).toBe(true);
    expect(checkGateAnswer(challenge, "  472  ")).toBe(true);
  });

  it("rejects a wrong answer", () => {
    expect(checkGateAnswer(challenge, "473")).toBe(false);
    expect(checkGateAnswer(challenge, "274")).toBe(false); // right digits, wrong order
    expect(checkGateAnswer(challenge, "47")).toBe(false); // too few
    expect(checkGateAnswer(challenge, "4722")).toBe(false); // too many
  });

  it("rejects empty or digit free input", () => {
    expect(checkGateAnswer(challenge, "")).toBe(false);
    expect(checkGateAnswer(challenge, "   ")).toBe(false);
    expect(checkGateAnswer(challenge, "four seven two")).toBe(false);
  });
});

describe("gatePassKey", () => {
  it("namespaces the key by purpose", () => {
    expect(gatePassKey("signup")).toBe("bq:parental-gate:signup");
    expect(gatePassKey("purchase")).toBe("bq:parental-gate:purchase");
  });
});
