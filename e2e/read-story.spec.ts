// Journey: read a free story from the start to an ending, making choices, and
// confirm the child's name is personalized and the ending screen shows.
import { test, expect } from "@playwright/test";
import { STORAGE_STATE, FREE_STORY, SHARED_CHILD_NAME } from "./constants";

// Reuse the signed-in parent + active child from auth.setup.ts.
test.use({ storageState: STORAGE_STATE });

test("read a story to a good ending, personalized by the child's name", async ({ page }) => {
  await page.goto(`/story/${FREE_STORY.slug}`);

  // The reader opened on this story.
  await expect(page.getByRole("heading", { name: FREE_STORY.title })).toBeVisible();

  // The first page is personalized: the child's name, not a raw {{name}} token.
  await expect(page.getByText(`${SHARED_CHILD_NAME} climbed aboard Pip`)).toBeVisible();
  await expect(page.getByText("{{name}}")).toHaveCount(0);

  // Choice 1: sail toward the moon -> the next page names the child too.
  await page.getByRole("button", { name: /Sail out toward the big moon/ }).click();
  await expect(page.getByText(`${SHARED_CHILD_NAME} spotted two friendly lights`)).toBeVisible();

  // Choice 2: row up to the moon -> a good ending.
  await page.getByRole("button", { name: /Row up to the smiling moon/ }).click();

  // The ending screen shows, with its label and a celebratory headline.
  await expect(page.getByText("The End")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Moon's Lullaby" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /You found a good ending/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Read again" })).toBeVisible();
});
