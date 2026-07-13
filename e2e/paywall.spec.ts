// Journey: a free-tier parent tries to open a premium story and hits the paywall
// (#34) instead of the reader. The gate is decided on the server, so the story text
// is never rendered.
import { test, expect } from "@playwright/test";
import { STORAGE_STATE, PREMIUM_STORY } from "./constants";

// The shared parent has no subscription, so they are on the free tier.
test.use({ storageState: STORAGE_STATE });

test("a free-tier parent hits the paywall on a premium story", async ({ page }) => {
  await page.goto(`/story/${PREMIUM_STORY.slug}`);

  // The paywall, not the reader.
  await expect(page.getByRole("heading", { name: /Unlock the whole library/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Start your free trial/i })).toBeVisible();

  // The reader's controls are absent: the premium story was never loaded.
  await expect(page.getByRole("button", { name: /Reading settings/i })).toHaveCount(0);
});
