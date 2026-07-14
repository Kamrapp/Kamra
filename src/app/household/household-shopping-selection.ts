export type HouseholdShoppingSelectionScale =
  "business_as_usual" | "keep_it_chill" | "start_fresh" | "stock_em_up";

interface SelectionAggregate {
  nextExpiryOn: string | null;
  state:
    "below_minimum" | "at_target" | "above_target" | "between_minimum_and_target" | "not_tracked";
}

interface SelectionPolicy {
  expiryWarningDays: number;
}

export function isHouseholdShoppingSelectionEligible(
  aggregate: SelectionAggregate,
  policy: SelectionPolicy | null,
  scale: HouseholdShoppingSelectionScale,
  today = new Date().toISOString().slice(0, 10)
): boolean {
  if (!policy || aggregate.state === "not_tracked") return false;
  if (scale === "start_fresh") return false;
  if (scale === "stock_em_up") return true;
  if (aggregate.state === "below_minimum") return true;
  if (scale === "business_as_usual") return false;
  if (aggregate.state === "between_minimum_and_target") return true;

  return isExpiryWithinWarningWindow(aggregate.nextExpiryOn, policy.expiryWarningDays, today);
}

function isExpiryWithinWarningWindow(
  expiryOn: string | null,
  warningDays: number,
  today: string
): boolean {
  if (!expiryOn || warningDays <= 0 || expiryOn < today) return false;
  const warningEnd = new Date(`${today}T00:00:00.000Z`);
  warningEnd.setUTCDate(warningEnd.getUTCDate() + warningDays);
  return expiryOn <= warningEnd.toISOString().slice(0, 10);
}
