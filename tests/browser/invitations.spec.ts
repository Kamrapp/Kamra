import { expect, test } from "playwright/test";

import { createBrowserApiState, installBrowserApiFixture } from "./fixtures";

test("pending invitations use compact accept and reject actions in both surfaces", async ({
  page
}) => {
  const state = createBrowserApiState();
  state.pendingInvitations = [
    {
      createdAt: "2026-07-14T08:00:00.000Z",
      email: "invitee@example.test",
      householdId: "shared-household",
      householdName: "Shared Household",
      id: "invitation-shared-household",
      status: "pending",
      updatedAt: "2026-07-14T08:00:00.000Z"
    }
  ];
  await installBrowserApiFixture(page, state);
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Accept" })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Decline" })).toHaveCount(2);
  await expect(page.locator(".invitation-action-button")).toHaveCount(4);
  await expect(page.locator(".invitation-action-button").filter({ hasText: "✓" })).toHaveCount(2);
  await expect(page.locator(".invitation-action-button").filter({ hasText: "×" })).toHaveCount(2);

  for (const row of await page.locator(".pending-invitation, .household-invitation-row").all()) {
    const dimensions = await row.evaluate((element) => ({
      height: Math.round(element.getBoundingClientRect().height),
      childHeights: Array.from(element.children).map((child) =>
        Math.round(child.getBoundingClientRect().height)
      )
    }));
    expect(dimensions.height).toBeLessThanOrEqual(Math.max(...dimensions.childHeights) + 1);
  }
});
