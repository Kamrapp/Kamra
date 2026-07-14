import { Component } from "@angular/core";

import { HouseholdV2WorkspaceComponent } from "./household-v2-workspace.component";
import type { HouseholdV2Workspace } from "./household-v2.service";

@Component({
  selector: "app-household-preview-workspace",
  standalone: true,
  imports: [HouseholdV2WorkspaceComponent],
  template: `
    <section class="preview-shell" aria-labelledby="preview-home-title">
      <div class="preview-intro">
        <p class="ui-kicker">Kamra preview</p>
        <h1 class="ui-page-title" id="preview-home-title">A calmer pantry overview</h1>
        <p class="ui-copy-muted">
          Explore the same Product Group, Product, and Stock Batch workspace used after signing in.
          This preview uses sample data; its controls are intentionally inactive.
        </p>
      </div>

      <app-household-v2-workspace [preview]="true" [previewWorkspace]="previewWorkspace" />
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
      }

      .preview-shell {
        display: grid;
        gap: var(--space-5);
        min-height: 100%;
      }

      .preview-intro {
        background: var(--surface-panel-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-panel);
        display: grid;
        gap: var(--space-2);
        padding: clamp(1rem, 2vw, 1.5rem);
      }

      .preview-intro > * {
        margin: 0;
      }

      .preview-intro .ui-page-title {
        font-size: clamp(1.5rem, 3vw, 2.2rem);
      }
    `
  ]
})
export class HouseholdPreviewWorkspaceComponent {
  readonly previewWorkspace: HouseholdV2Workspace = {
    allowExpiredItems: true,
    defaultCalculatedMaxLimitMultiplier: 2,
    groupTargetShoppingDistributionMode: "split_evenly",
    groupTargetShoppingMode: "add_products_and_group_item",
    productGroups: [
      this.group("preview-milk", "Milk", "l", { minimumQuantity: 2, desiredQuantity: 4 }, [
        this.product("preview-pilos", "Pilos 1.5% milk", "l", 1.5, [
          this.batch("preview-pilos-batch", "Pilos 1.5% milk", 1.5, "2026-07-12", "2026-07-19")
        ]),
        this.product("preview-mizo", "Mizo lactose-free milk", "l", 1, [
          this.batch("preview-mizo-batch", "Mizo lactose-free milk", 1, "2026-07-10", null)
        ])
      ]),
      this.group("preview-bread", "Bread", "kg", { minimumQuantity: 1, desiredQuantity: 2 }, [
        this.product("preview-white-bread", "White bread", "kg", 0.5, []),
        this.product("preview-rye-bread", "Rye bread", "kg", 0.75, [])
      ]),
      this.group("preview-vegetables", "Vegetables", "kg", null, [
        this.product("preview-tomato", "Tomatoes", "kg", 1.2, []),
        this.product("preview-cucumber", "Cucumber", "kg", 0.8, [])
      ])
    ],
    unassignedBatches: [],
    unassignedProducts: [
      this.productRow(this.product("preview-dish-sponges", "Dish sponges", "count", 3, []))
    ],
    useAbbreviatedUiLabels: false
  };

  private group(
    id: string,
    displayName: string,
    trackingUnit: string,
    target: { minimumQuantity: number; desiredQuantity: number } | null,
    products: ReturnType<HouseholdPreviewWorkspaceComponent["product"]>[]
  ): HouseholdV2Workspace["productGroups"][number] {
    const productRows = products.map((product) => {
      product.productGroupId = id;
      return this.productRow(product);
    });
    return {
      aggregate: this.aggregate(
        productRows.reduce((sum, row) => sum + row.aggregate.availableQuantity, 0),
        productRows.reduce((sum, row) => sum + row.aggregate.batchCount, 0),
        trackingUnit,
        target
      ),
      childGroups: [],
      group: {
        displayName,
        groupTargetShoppingDistributionModeOverride: "default",
        groupTargetShoppingModeOverride: "default",
        id,
        parentProductGroupId: null,
        revision: 1,
        targetPolicy: target
          ? {
              consumptionPolicy: "earliest_expiry_first",
              desiredQuantity: target.desiredQuantity,
              expiryWarningDays: 7,
              minimumQuantity: target.minimumQuantity,
              trackingUnit
            }
          : null,
        trackingUnit
      },
      products: productRows
    };
  }

  private product(
    id: string,
    displayName: string,
    unit: string,
    current: number,
    batches: HouseholdV2Workspace["unassignedBatches"]
  ): HouseholdV2Workspace["unassignedProducts"][number]["product"] & {
    previewCurrent: number;
    previewBatches: HouseholdV2Workspace["unassignedBatches"];
  } {
    return {
      catalogProductId: null,
      defaultTrackingUnit: unit,
      directConcepts: [],
      displayName,
      id,
      identityKind: "manual",
      identitySnapshot: { source: "preview" },
      note: null,
      productGroupId: null,
      revision: 1,
      targetPolicy: null,
      previewCurrent: current,
      previewBatches: batches
    };
  }

  private productRow(
    product: ReturnType<HouseholdPreviewWorkspaceComponent["product"]>
  ): HouseholdV2Workspace["unassignedProducts"][number] {
    return {
      aggregate: this.aggregate(
        product.previewCurrent,
        product.previewBatches.length,
        product.defaultTrackingUnit ?? "count",
        null
      ),
      batches: product.previewBatches,
      product
    };
  }

  private batch(
    id: string,
    displayName: string,
    quantity: number,
    acquiredOn: string,
    expiryOn: string | null
  ): HouseholdV2Workspace["unassignedBatches"][number] {
    return {
      acquiredOn,
      acquisitionSnapshot: { displayName, sourceName: "Preview market" },
      expiryOn,
      householdProductId: null,
      id,
      remainingQuantity: quantity,
      revision: 1,
      unit: "l"
    };
  }

  private aggregate(
    availableQuantity: number,
    batchCount: number,
    trackingUnit: string,
    target: { minimumQuantity: number; desiredQuantity: number } | null
  ): HouseholdV2Workspace["unassignedProducts"][number]["aggregate"] {
    const state = !target
      ? "not_tracked"
      : availableQuantity < target.minimumQuantity
        ? "below_minimum"
        : availableQuantity > target.desiredQuantity
          ? "above_target"
          : availableQuantity === target.desiredQuantity
            ? "at_target"
            : "between_minimum_and_target";
    return {
      availableQuantity,
      batchCount,
      nextExpiryOn: null,
      state,
      trackingUnit
    };
  }
}
