import { describe, expect, it } from "vitest";

import { isHouseholdShoppingSelectionEligible } from "./household-shopping-selection";

const policy = { expiryWarningDays: 3 };
const today = "2026-07-13";

describe("household shopping selection eligibility", () => {
  it("keeps untracked rows and rows without a target manual-only", () => {
    expect(
      isHouseholdShoppingSelectionEligible(
        { nextExpiryOn: null, state: "below_minimum" },
        null,
        "stock_em_up",
        today
      )
    ).toBe(false);
    expect(
      isHouseholdShoppingSelectionEligible(
        { nextExpiryOn: null, state: "not_tracked" },
        policy,
        "stock_em_up",
        today
      )
    ).toBe(false);
  });

  it("maps the four shopping scales to their shortage behavior", () => {
    const belowMinimum = { nextExpiryOn: null, state: "below_minimum" as const };
    const betweenTarget = { nextExpiryOn: null, state: "between_minimum_and_target" as const };
    const atTarget = { nextExpiryOn: null, state: "at_target" as const };
    const aboveTarget = { nextExpiryOn: null, state: "above_target" as const };

    expect(isHouseholdShoppingSelectionEligible(belowMinimum, policy, "start_fresh", today)).toBe(
      false
    );
    expect(
      isHouseholdShoppingSelectionEligible(belowMinimum, policy, "business_as_usual", today)
    ).toBe(true);
    expect(
      isHouseholdShoppingSelectionEligible(betweenTarget, policy, "business_as_usual", today)
    ).toBe(false);
    expect(
      isHouseholdShoppingSelectionEligible(betweenTarget, policy, "keep_it_chill", today)
    ).toBe(true);
    expect(isHouseholdShoppingSelectionEligible(atTarget, policy, "stock_em_up", today)).toBe(true);
    expect(isHouseholdShoppingSelectionEligible(aboveTarget, policy, "keep_it_chill", today)).toBe(
      false
    );
  });

  it("selects an at-target row only when its expiry is inside the chill warning window", () => {
    expect(
      isHouseholdShoppingSelectionEligible(
        { nextExpiryOn: "2026-07-16", state: "at_target" },
        policy,
        "keep_it_chill",
        today
      )
    ).toBe(true);
    expect(
      isHouseholdShoppingSelectionEligible(
        { nextExpiryOn: "2026-07-17", state: "at_target" },
        policy,
        "keep_it_chill",
        today
      )
    ).toBe(false);
    expect(
      isHouseholdShoppingSelectionEligible(
        { nextExpiryOn: "2026-07-12", state: "at_target" },
        policy,
        "keep_it_chill",
        today
      )
    ).toBe(false);
  });
});
