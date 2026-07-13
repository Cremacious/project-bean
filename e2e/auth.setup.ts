// Runs first (the "setup" project) and produces the signed-in browser state that
// the authenticated journeys (read a story, paywall) reuse. Keeping this in one
// place means those specs never repeat sign-in and stay well under the auth rate
// limits.
import { test as setup } from "@playwright/test";
import { SHARED_PARENT, SHARED_CHILD_NAME, STORAGE_STATE } from "./constants";
import { registerOrSignInViaApi, ensureAuthedWithChild } from "./helpers";

setup("create shared parent, pick child, save signed-in state", async ({ page }) => {
  await registerOrSignInViaApi(page.request, SHARED_PARENT);
  await ensureAuthedWithChild(page, SHARED_CHILD_NAME);
  await page.context().storageState({ path: STORAGE_STATE });
});
