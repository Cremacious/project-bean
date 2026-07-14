// packages/core/src/notifications.test.ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_REMINDER_SETTINGS,
  DEFAULT_REMINDER_TIME,
  clampReminderTime,
  formatReminderTime,
  reminderNotificationContent,
  stepReminderTime,
} from "./notifications";

// Any dash used as punctuation is banned in user-facing copy (docs/WORKFLOW.md
// rule 1): hyphen-minus, non-breaking hyphen, figure dash, en/em/horizontal bar.
const DASHES = /[-‐‑‒–—―]/;

describe("reminder defaults", () => {
  it("starts OFF (COPPA: default off until the parent opts in)", () => {
    expect(DEFAULT_REMINDER_SETTINGS.enabled).toBe(false);
    expect(DEFAULT_REMINDER_SETTINGS.time).toEqual(DEFAULT_REMINDER_TIME);
  });

  it("defaults to a gentle evening wind-down time", () => {
    expect(DEFAULT_REMINDER_TIME).toEqual({ hour: 19, minute: 30 });
  });
});

describe("clampReminderTime", () => {
  it("passes a valid time through unchanged", () => {
    expect(clampReminderTime({ hour: 8, minute: 5 })).toEqual({ hour: 8, minute: 5 });
  });

  it("wraps minutes into the next hour", () => {
    expect(clampReminderTime({ hour: 8, minute: 75 })).toEqual({ hour: 9, minute: 15 });
  });

  it("wraps past midnight", () => {
    expect(clampReminderTime({ hour: 23, minute: 70 })).toEqual({ hour: 0, minute: 10 });
  });

  it("wraps a negative time back into the previous day", () => {
    expect(clampReminderTime({ hour: 0, minute: -10 })).toEqual({ hour: 23, minute: 50 });
  });

  it("rounds fractional inputs to whole minutes", () => {
    expect(clampReminderTime({ hour: 7, minute: 29.6 })).toEqual({ hour: 7, minute: 30 });
  });
});

describe("stepReminderTime", () => {
  it("steps forward within the hour", () => {
    expect(stepReminderTime({ hour: 19, minute: 30 }, 15)).toEqual({ hour: 19, minute: 45 });
  });

  it("steps backward across the hour boundary", () => {
    expect(stepReminderTime({ hour: 20, minute: 0 }, -15)).toEqual({ hour: 19, minute: 45 });
  });

  it("wraps forward around midnight", () => {
    expect(stepReminderTime({ hour: 23, minute: 50 }, 15)).toEqual({ hour: 0, minute: 5 });
  });
});

describe("formatReminderTime", () => {
  it("formats an evening time in 12-hour form", () => {
    expect(formatReminderTime({ hour: 19, minute: 30 })).toBe("7:30 PM");
  });

  it("formats a morning time", () => {
    expect(formatReminderTime({ hour: 9, minute: 0 })).toBe("9:00 AM");
  });

  it("shows midnight as 12:00 AM and noon as 12:00 PM", () => {
    expect(formatReminderTime({ hour: 0, minute: 0 })).toBe("12:00 AM");
    expect(formatReminderTime({ hour: 12, minute: 0 })).toBe("12:00 PM");
  });

  it("zero-pads the minute", () => {
    expect(formatReminderTime({ hour: 20, minute: 5 })).toBe("8:05 PM");
  });

  it("never contains a dash", () => {
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 5, 15, 30, 45, 59]) {
        expect(formatReminderTime({ hour: h, minute: m })).not.toMatch(DASHES);
      }
    }
  });
});

describe("reminderNotificationContent", () => {
  it("is warm, parent-facing copy with a title and body", () => {
    const { title, body } = reminderNotificationContent();
    expect(title.length).toBeGreaterThan(0);
    expect(body.length).toBeGreaterThan(0);
  });

  it("contains no dashes (app-wide copy rule)", () => {
    const { title, body } = reminderNotificationContent();
    expect(title).not.toMatch(DASHES);
    expect(body).not.toMatch(DASHES);
  });

  it("carries no child name or profile token in the payload", () => {
    const { title, body } = reminderNotificationContent();
    // No personalization token leaks into a local notification payload.
    expect(`${title} ${body}`).not.toContain("{{");
  });
});
