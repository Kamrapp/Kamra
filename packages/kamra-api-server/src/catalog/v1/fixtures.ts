import type { CatalogV1SeedDataset } from "./contracts.js";

const catalogV1SeedCapturedAt = "2026-06-23T12:00:00.000Z";

export function createCatalogV1SeedDataset(): CatalogV1SeedDataset {
  return {
    migrationLedger: [
      {
        appliedAt: catalogV1SeedCapturedAt,
        description: "Create Stage 3 model-foundation collections, validators, and starter indexes.",
        id: "migration_catalog_v1_foundation_001",
        migrationId: "catalog_v1_foundation_001",
        runnerName: "CatalogV1ModelSetup",
        runnerVersion: "1.0.0",
        status: "applied"
      }
    ],
    priceObservations: [
      {
        createdAt: catalogV1SeedCapturedAt,
        id: "price_observation_lidl_hu_uht_milk_2_8_1l_base_seed",
        location: {
          countryCode: "HU",
          kind: "global_shop_availability",
          label: "Lidl Hungary",
          locationKey: "availability:lidl-hu",
          storeBrandKey: "lidl"
        },
        observedAt: catalogV1SeedCapturedAt,
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog",
          sourceRecordId: "seed-lidl-milk-price-1",
          sourceUrl: "https://example.invalid/lidl/pilos-uht-tej-28-1l"
        },
        price: {
          amount: 469,
          currencyCode: "HUF"
        },
        priceKind: "base",
        productId: "product_uht_milk_2_8_1l",
        productSourceId: "product_source_lidl_hu_pilos_uht_28_1l",
        programName: null,
        sourceName: "lidl-hu",
        sourceProductKey: "lidl-pilos-uht-tej-28-1l",
        unitPriceLabel: "469 Ft/l",
        updatedAt: catalogV1SeedCapturedAt,
        validFrom: null,
        validTo: null
      },
      {
        createdAt: catalogV1SeedCapturedAt,
        id: "price_observation_penny_hu_spaghetti_500g_offer_seed",
        location: {
          countryCode: "HU",
          kind: "global_shop_availability",
          label: "PENNY Hungary",
          locationKey: "availability:penny-hu",
          storeBrandKey: "penny"
        },
        observedAt: catalogV1SeedCapturedAt,
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog",
          sourceRecordId: "seed-penny-pasta-price-1",
          sourceUrl: "https://example.invalid/penny/spaghetti-500g"
        },
        price: {
          amount: 449,
          currencyCode: "HUF"
        },
        priceKind: "offer",
        productId: "product_spaghetti_500g",
        productSourceId: "product_source_penny_hu_spaghetti_500g",
        programName: null,
        sourceName: "penny-hu",
        sourceProductKey: "penny-spaghetti-500g",
        unitPriceLabel: "898 Ft/kg",
        updatedAt: catalogV1SeedCapturedAt,
        validFrom: "2026-06-23",
        validTo: "2026-06-29"
      }
    ],
    productSourceIdentifiers: [
      {
        createdAt: catalogV1SeedCapturedAt,
        id: "product_source_identifier_lidl_hu_pilos_uht_28_1l_seed",
        kind: "retailer_product_id",
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog",
          sourceRecordId: "seed-lidl-milk-1",
          sourceUrl: "https://example.invalid/lidl/pilos-uht-tej-28-1l"
        },
        productSourceId: "product_source_lidl_hu_pilos_uht_28_1l",
        sourceName: "lidl-hu",
        updatedAt: catalogV1SeedCapturedAt,
        value: "lidl-pilos-uht-tej-28-1l"
      },
      {
        createdAt: catalogV1SeedCapturedAt,
        id: "product_source_identifier_spar_hu_jasmin_rizs_1kg_seed",
        kind: "retailer_product_id",
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog",
          sourceRecordId: "seed-spar-rice-1",
          sourceUrl: "https://example.invalid/spar/jazmin-rizs-1kg"
        },
        productSourceId: "product_source_spar_hu_jasmin_rizs_1kg",
        sourceName: "spar-hu",
        updatedAt: catalogV1SeedCapturedAt,
        value: "spar-jazmin-rizs-1kg"
      },
      {
        createdAt: catalogV1SeedCapturedAt,
        id: "product_source_identifier_penny_hu_spaghetti_500g_seed",
        kind: "retailer_product_id",
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog",
          sourceRecordId: "seed-penny-pasta-1",
          sourceUrl: "https://example.invalid/penny/spaghetti-500g"
        },
        productSourceId: "product_source_penny_hu_spaghetti_500g",
        sourceName: "penny-hu",
        updatedAt: catalogV1SeedCapturedAt,
        value: "penny-spaghetti-500g"
      }
    ],
    productSources: [
      {
        countryCode: "HU",
        createdAt: catalogV1SeedCapturedAt,
        currentCategoryLabel: "tejtermek",
        id: "product_source_lidl_hu_pilos_uht_28_1l",
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog",
          sourceRecordId: "seed-lidl-milk-1",
          sourceUrl: "https://example.invalid/lidl/pilos-uht-tej-28-1l"
        },
        priceLastCheckedAt: catalogV1SeedCapturedAt,
        productId: "product_uht_milk_2_8_1l",
        productPageUrl: "https://example.invalid/lidl/pilos-uht-tej-28-1l",
        sourceName: "lidl-hu",
        sourceProductKey: "lidl-pilos-uht-tej-28-1l",
        sourceProductName: "Pilos UHT tej 2,8% 1 l",
        storeBrandKey: "lidl",
        updatedAt: catalogV1SeedCapturedAt
      },
      {
        countryCode: "HU",
        createdAt: catalogV1SeedCapturedAt,
        currentCategoryLabel: "szarazaru",
        id: "product_source_spar_hu_jasmin_rizs_1kg",
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog",
          sourceRecordId: "seed-spar-rice-1",
          sourceUrl: "https://example.invalid/spar/jazmin-rizs-1kg"
        },
        priceLastCheckedAt: catalogV1SeedCapturedAt,
        productId: "product_jasmine_rice_1kg",
        productPageUrl: "https://example.invalid/spar/jazmin-rizs-1kg",
        sourceName: "spar-hu",
        sourceProductKey: "spar-jazmin-rizs-1kg",
        sourceProductName: "Jazmin rizs 1 kg",
        storeBrandKey: "spar",
        updatedAt: catalogV1SeedCapturedAt
      },
      {
        countryCode: "HU",
        createdAt: catalogV1SeedCapturedAt,
        currentCategoryLabel: "teszta",
        id: "product_source_penny_hu_spaghetti_500g",
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog",
          sourceRecordId: "seed-penny-pasta-1",
          sourceUrl: "https://example.invalid/penny/spaghetti-500g"
        },
        priceLastCheckedAt: catalogV1SeedCapturedAt,
        productId: "product_spaghetti_500g",
        productPageUrl: "https://example.invalid/penny/spaghetti-500g",
        sourceName: "penny-hu",
        sourceProductKey: "penny-spaghetti-500g",
        sourceProductName: "Durum spaghetti 500 g",
        storeBrandKey: "penny",
        updatedAt: catalogV1SeedCapturedAt
      }
    ],
    productTagAssignments: [
      {
        assignedAt: catalogV1SeedCapturedAt,
        assignmentKind: "seed",
        id: "tag_assignment_product_uht_milk_2_8_1l_kitchen",
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog"
        },
        productId: "product_uht_milk_2_8_1l",
        score: 1,
        tagKey: "category.kitchen"
      },
      {
        assignedAt: catalogV1SeedCapturedAt,
        assignmentKind: "seed",
        id: "tag_assignment_product_uht_milk_2_8_1l_dairy",
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog"
        },
        productId: "product_uht_milk_2_8_1l",
        score: 1,
        tagKey: "category.kitchen.dairy"
      },
      {
        assignedAt: catalogV1SeedCapturedAt,
        assignmentKind: "derived_keyword",
        id: "tag_assignment_product_uht_milk_2_8_1l_keyword_tej",
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "processor",
          producer: "KeywordTagger",
          sourceName: "catalog-v1-seed-processor"
        },
        productId: "product_uht_milk_2_8_1l",
        score: 0.92,
        tagKey: "keyword.tej"
      },
      {
        assignedAt: catalogV1SeedCapturedAt,
        assignmentKind: "seed",
        id: "tag_assignment_product_jasmine_rice_1kg_kitchen",
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog"
        },
        productId: "product_jasmine_rice_1kg",
        score: 1,
        tagKey: "category.kitchen"
      },
      {
        assignedAt: catalogV1SeedCapturedAt,
        assignmentKind: "seed",
        id: "tag_assignment_product_jasmine_rice_1kg_pantry",
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog"
        },
        productId: "product_jasmine_rice_1kg",
        score: 1,
        tagKey: "category.kitchen.pantry"
      },
      {
        assignedAt: catalogV1SeedCapturedAt,
        assignmentKind: "seed",
        id: "tag_assignment_product_spaghetti_500g_kitchen",
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog"
        },
        productId: "product_spaghetti_500g",
        score: 1,
        tagKey: "category.kitchen"
      },
      {
        assignedAt: catalogV1SeedCapturedAt,
        assignmentKind: "seed",
        id: "tag_assignment_product_spaghetti_500g_pantry",
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog"
        },
        productId: "product_spaghetti_500g",
        score: 1,
        tagKey: "category.kitchen.pantry"
      }
    ],
    productTags: [
      {
        createdAt: catalogV1SeedCapturedAt,
        id: "tag_category_kitchen",
        key: "category.kitchen",
        kind: "category",
        label: "Kitchen",
        matcherTerms: ["konyha", "elelmiszer"],
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog"
        },
        parentKey: null,
        status: "active",
        updatedAt: catalogV1SeedCapturedAt
      },
      {
        createdAt: catalogV1SeedCapturedAt,
        id: "tag_category_kitchen_dairy",
        key: "category.kitchen.dairy",
        kind: "category",
        label: "Dairy",
        matcherTerms: ["tej", "tejtermek"],
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog"
        },
        parentKey: "category.kitchen",
        status: "active",
        updatedAt: catalogV1SeedCapturedAt
      },
      {
        createdAt: catalogV1SeedCapturedAt,
        id: "tag_category_kitchen_pantry",
        key: "category.kitchen.pantry",
        kind: "category",
        label: "Pantry",
        matcherTerms: ["rizs", "teszta", "spaghetti"],
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog"
        },
        parentKey: "category.kitchen",
        status: "active",
        updatedAt: catalogV1SeedCapturedAt
      },
      {
        createdAt: catalogV1SeedCapturedAt,
        id: "tag_keyword_tej",
        key: "keyword.tej",
        kind: "keyword",
        label: "tej",
        matcherTerms: ["tej"],
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog"
        },
        parentKey: "category.kitchen.dairy",
        status: "active",
        updatedAt: catalogV1SeedCapturedAt
      }
    ],
    products: [
      {
        brandName: "Pilos",
        createdAt: catalogV1SeedCapturedAt,
        id: "product_uht_milk_2_8_1l",
        kind: "grocery",
        measurements: [
          {
            normalizedUnit: "ml",
            normalizedValue: 1000,
            unit: "l",
            value: 1
          }
        ],
        name: "UHT tej 2,8%",
        normalizedName: "uht tej 2,8%",
        origin: [
          {
            capturedAt: catalogV1SeedCapturedAt,
            kind: "seed",
            producer: "CatalogV1Seed",
            sourceName: "seed_catalog"
          }
        ],
        primaryCategoryKey: "category.kitchen.dairy",
        validationStatus: "unvalidated",
        validatedAt: null,
        validatedBy: null,
        invalidatedAt: null,
        invalidatedBy: null,
        validationNote: null,
        status: "active",
        updatedAt: catalogV1SeedCapturedAt
      },
      {
        brandName: null,
        createdAt: catalogV1SeedCapturedAt,
        id: "product_jasmine_rice_1kg",
        kind: "grocery",
        measurements: [
          {
            normalizedUnit: "g",
            normalizedValue: 1000,
            unit: "kg",
            value: 1
          }
        ],
        name: "Jazmin rizs",
        normalizedName: "jazmin rizs",
        origin: [
          {
            capturedAt: catalogV1SeedCapturedAt,
            kind: "seed",
            producer: "CatalogV1Seed",
            sourceName: "seed_catalog"
          }
        ],
        primaryCategoryKey: "category.kitchen.pantry",
        validationStatus: "unvalidated",
        validatedAt: null,
        validatedBy: null,
        invalidatedAt: null,
        invalidatedBy: null,
        validationNote: null,
        status: "active",
        updatedAt: catalogV1SeedCapturedAt
      },
      {
        brandName: null,
        createdAt: catalogV1SeedCapturedAt,
        id: "product_spaghetti_500g",
        kind: "grocery",
        measurements: [
          {
            normalizedUnit: "g",
            normalizedValue: 500,
            unit: "g",
            value: 500
          }
        ],
        name: "Durum spaghetti",
        normalizedName: "durum spaghetti",
        origin: [
          {
            capturedAt: catalogV1SeedCapturedAt,
            kind: "seed",
            producer: "CatalogV1Seed",
            sourceName: "seed_catalog"
          }
        ],
        primaryCategoryKey: "category.kitchen.pantry",
        validationStatus: "unvalidated",
        validatedAt: null,
        validatedBy: null,
        invalidatedAt: null,
        invalidatedBy: null,
        validationNote: null,
        status: "active",
        updatedAt: catalogV1SeedCapturedAt
      }
    ],
    sourceRecordProcessingStates: [
      {
        attemptCount: 1,
        createdAt: catalogV1SeedCapturedAt,
        id: "processing_state_seed_catalog_keyword_tagger_v1",
        lastErrorCode: null,
        lastErrorMessage: null,
        lastProcessedAt: catalogV1SeedCapturedAt,
        processorName: "KeywordTagger",
        processorVersion: "1.0.0",
        recordFingerprint: "seed-catalog-v1",
        sourceName: "seed_catalog",
        state: "processed",
        updatedAt: catalogV1SeedCapturedAt
      }
    ],
    stocks: [
      {
        createdAt: catalogV1SeedCapturedAt,
        id: "stock_lidl_hu_uht_milk_2_8_1l",
        location: {
          countryCode: "HU",
          kind: "global_shop_availability",
          label: "Lidl Hungary",
          locationKey: "availability:lidl-hu",
          storeBrandKey: "lidl"
        },
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog"
        },
        price: {
          observedAt: catalogV1SeedCapturedAt,
          price: {
            amount: 469,
            currencyCode: "HUF"
          },
          unitPrice: {
            normalizedUnit: "ml",
            normalizedValue: 1000,
            unit: "l",
            value: 1
          }
        },
        productId: "product_uht_milk_2_8_1l",
        quantity: {
          amount: 1,
          packageCount: 1,
          unit: "item"
        },
        status: "active",
        updatedAt: catalogV1SeedCapturedAt
      },
      {
        createdAt: catalogV1SeedCapturedAt,
        expiryDate: "2026-06-28T00:00:00.000Z",
        id: "stock_household_seed_uht_milk",
        location: {
          countryCode: "HU",
          kind: "household",
          label: "Seed Household",
          locationKey: "household:seed-main"
        },
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog"
        },
        price: null,
        productId: "product_uht_milk_2_8_1l",
        quantity: {
          amount: 0.5,
          packageCount: 1,
          unit: "l"
        },
        status: "active",
        updatedAt: catalogV1SeedCapturedAt
      },
      {
        createdAt: catalogV1SeedCapturedAt,
        id: "stock_household_seed_rice",
        location: {
          countryCode: "HU",
          kind: "household",
          label: "Seed Household",
          locationKey: "household:seed-main"
        },
        origin: {
          capturedAt: catalogV1SeedCapturedAt,
          kind: "seed",
          producer: "CatalogV1Seed",
          sourceName: "seed_catalog"
        },
        price: null,
        productId: "product_jasmine_rice_1kg",
        quantity: {
          amount: 0.2,
          packageCount: 1,
          unit: "kg"
        },
        status: "active",
        updatedAt: catalogV1SeedCapturedAt
      }
    ]
  };
}

