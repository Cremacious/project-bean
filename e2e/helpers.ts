// Reusable steps for the E2E journeys (issue #41). Selectors prefer roles and
// accessible names over brittle text; where copy is asserted it stays dash-free,
// matching the app-wide UI rules.
import { expect, type APIRequestContext, type Page } from "@playwright/test";
// Reuse the real word/digit mapping so the gate solver never drifts from the app.
import { NUMBER_WORDS } from "@bedtime-quests/core/parental-gate";

const DIGIT_WORDS: string[] = [...NUMBER_WORDS];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A fresh, collision-proof email for a one-off test account. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

/**
 * Solve and pass the parental gate dialog. The challenge is random, so we read the
 * spelled-out numbers straight from the dialog, convert them back to digits with
 * the app's own NUMBER_WORDS table, and submit.
 */
export async function passParentalGate(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: /Grown ups only/i });
  await expect(dialog).toBeVisible();

  const labelText = (await dialog.locator("label").first().innerText()).toLowerCase();
  const words = labelText.match(/\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/g) ?? [];
  const digits = words.map((w) => DIGIT_WORDS.indexOf(w)).join("");
  expect(digits.length).toBeGreaterThan(0);

  await dialog.getByRole("textbox").fill(digits);
  await dialog.getByRole("button", { name: "Continue" }).click();
  await expect(dialog).toBeHidden();
}

/** Fill and submit the sign-up form. Sign-up is not parental-gated. */
export async function submitSignUpForm(
  page: Page,
  { name, email, password }: { name: string; email: string; password: string },
): Promise<void> {
  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
}

/** Fill and submit the sign-in form. */
export async function signInViaUi(
  page: Page,
  { email, password }: { email: string; password: string },
): Promise<void> {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/**
 * Create a parent through BetterAuth's HTTP API, or sign in if the account already
 * exists. Used to build fixtures fast without repeating the UI sign-up each time;
 * cookies land in the request context (shared with the page) so the browser is
 * signed in afterwards.
 */
export async function registerOrSignInViaApi(
  request: APIRequestContext,
  { name, email, password }: { name: string; email: string; password: string },
): Promise<void> {
  const signUp = await request.post("/api/auth/sign-up/email", {
    data: { name, email, password },
  });
  if (signUp.ok()) return;

  const signIn = await request.post("/api/auth/sign-in/email", {
    data: { email, password },
  });
  if (!signIn.ok()) {
    throw new Error(
      `Could not authenticate ${email}: sign-up ${signUp.status()}, sign-in ${signIn.status()}`,
    );
  }
}

/** Add the first child on the onboarding screen. */
export async function addFirstChild(page: Page, name: string): Promise<void> {
  await expect(page.getByRole("heading", { name: /add your first reader/i })).toBeVisible();
  await page.getByLabel(/your child.s name/i).fill(name);
  await page.getByRole("button", { name: "Add reader" }).click();
}

/** Pick a child on the "Who stars in tonight's story?" picker. */
export async function pickChild(page: Page, name: string): Promise<void> {
  await expect(page.getByRole("heading", { name: /Who stars in tonight/i })).toBeVisible();
  await page
    .getByRole("button", { name: new RegExp(`${escapeRegExp(name)}[\\s\\S]*Star in the story`) })
    .click();
}

/**
 * Ensure the browser lands on the library with a chosen child, whatever screen it
 * starts on: onboarding (no child yet), the picker (child exists, none active), or
 * already the library.
 */
export async function ensureAuthedWithChild(page: Page, name: string): Promise<void> {
  await page.goto("/");
  const onboarding = page.getByRole("heading", { name: /add your first reader/i });
  const picker = page.getByRole("heading", { name: /Who stars in tonight/i });
  const library = page.getByRole("heading", { name: /What shall we read/i });

  await expect(onboarding.or(picker).or(library)).toBeVisible();

  if (await library.isVisible()) return;
  if (await onboarding.isVisible()) {
    await addFirstChild(page, name);
  }
  await pickChild(page, name);
  await expect(library).toBeVisible();
}
