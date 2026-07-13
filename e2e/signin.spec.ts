// Journey: an existing parent signs in and lands in the app. The shared parent
// (created in auth.setup.ts) already has a child but no active selection in this
// fresh browser, so sign-in lands on the picker; choosing the child reaches the
// library. This exercises both sign-in and the "Who stars tonight" picker.
import { test, expect } from "@playwright/test";
import { SHARED_PARENT, SHARED_CHILD_NAME } from "./constants";
import { signInViaUi, pickChild } from "./helpers";

// A logged-out browser: do not load the shared signed-in storage state here.
test.use({ storageState: { cookies: [], origins: [] } });

test("an existing parent signs in and reaches the library", async ({ page }) => {
  await signInViaUi(page, {
    email: SHARED_PARENT.email,
    password: SHARED_PARENT.password,
  });

  // Landed inside the app (not bounced back to sign-in).
  await pickChild(page, SHARED_CHILD_NAME);
  await expect(
    page.getByRole("heading", { name: new RegExp(`What shall we read.*${SHARED_CHILD_NAME}`) }),
  ).toBeVisible();
});
