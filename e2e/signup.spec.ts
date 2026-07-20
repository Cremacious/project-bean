// Journey: a new parent signs up (no parental gate on sign-up), then adds their
// first child, picks them on the "Who stars tonight" screen, and lands in the
// library personalized by name.
import { test, expect } from "@playwright/test";
import { SHARED_CHILD_NAME } from "./constants";
import {
  submitSignUpForm,
  addFirstChild,
  pickChild,
  uniqueEmail,
} from "./helpers";

const PASSWORD = "bedtime-e2e-pass-123";

test.describe("sign up", () => {
  test("a parent signs up, adds a child, and reaches the library", async ({ page }) => {
    await submitSignUpForm(page, {
      name: "New Parent",
      email: uniqueEmail("e2e-signup"),
      password: PASSWORD,
    });

    // Submitting the form creates the account -> onboarding for the first reader.
    await addFirstChild(page, SHARED_CHILD_NAME);

    // Pick the child on the picker, then the library greets them by name.
    await pickChild(page, SHARED_CHILD_NAME);
    await expect(
      page.getByRole("heading", { name: new RegExp(`What shall we read.*${SHARED_CHILD_NAME}`) }),
    ).toBeVisible();
  });
});
