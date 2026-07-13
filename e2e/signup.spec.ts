// Journey: a new parent signs up. The parental gate (#32) must be passed before the
// account is created; then the parent adds their first child, picks them on the
// "Who stars tonight" screen, and lands in the library personalized by name.
import { test, expect } from "@playwright/test";
import { SHARED_CHILD_NAME } from "./constants";
import {
  submitSignUpForm,
  passParentalGate,
  addFirstChild,
  pickChild,
  uniqueEmail,
} from "./helpers";

const PASSWORD = "bedtime-e2e-pass-123";

test.describe("sign up", () => {
  test("the parental gate blocks account creation until it is passed", async ({ page }) => {
    await submitSignUpForm(page, {
      name: "Gate Backout",
      email: uniqueEmail("e2e-gate"),
      password: PASSWORD,
    });

    // The gate appears in front of sign-up; backing out must NOT create an account.
    const dialog = page.getByRole("dialog", { name: /Grown ups only/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Go back" }).click();
    await expect(dialog).toBeHidden();

    // Still on the sign-up page, not signed in.
    await expect(page).toHaveURL(/\/sign-up/);
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("a parent passes the gate, adds a child, and reaches the library", async ({ page }) => {
    await submitSignUpForm(page, {
      name: "New Parent",
      email: uniqueEmail("e2e-signup"),
      password: PASSWORD,
    });

    // Pass the gate -> account is created -> onboarding for the first reader.
    await passParentalGate(page);
    await addFirstChild(page, SHARED_CHILD_NAME);

    // Pick the child on the picker, then the library greets them by name.
    await pickChild(page, SHARED_CHILD_NAME);
    await expect(
      page.getByRole("heading", { name: new RegExp(`What shall we read.*${SHARED_CHILD_NAME}`) }),
    ).toBeVisible();
  });
});
