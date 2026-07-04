import { describe, expect, it } from "vitest";

import {
  ingestionV1CollectionNames,
  productReviewCandidateMatchConfidences,
  productReviewDecisionReasons
} from "./contracts.js";

describe("Ingestion v1 contracts", () => {
  it("includes the product review collection", () => {
    expect(ingestionV1CollectionNames).toContain("ingestion_product_review_items");
  });

  it("keeps review match confidence and decline reasons explicit", () => {
    expect(productReviewCandidateMatchConfidences).toEqual([
      "name_only",
      "none",
      "source_scoped_name",
      "strong_identifier",
      "strong_source_key"
    ]);

    expect(productReviewDecisionReasons).toEqual([
      "bad_name",
      "bad_price",
      "duplicate",
      "non_product",
      "online_only",
      "unsupported_layout",
      "other"
    ]);
  });
});
