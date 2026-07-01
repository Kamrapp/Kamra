import { createHash } from "node:crypto";

import type { ParsedShopProductIdentifier, ParsedShopProductRow } from "../../v1/contracts.js";

export const pennyHuOffersSourceName = "penny_hu_offers";
export const pennyHuOffersWorkflowName = "penny-hu-offers";
export const pennyHuOffersParserName = "PennyHuOffersParser";
export const pennyHuOffersParserVersion = "0.1.0";
export const pennyHuOffersUrl = "https://www.penny.hu/ajanlatok";

type NuxtValue = null | boolean | number | string | NuxtValue[] | { [key: string]: NuxtValue };

interface PennyProduct {
  category?: string;
  name?: string;
  packageLabel?: string;
  price?: {
    baseUnitShort?: string;
    regular?: {
      perStandardizedQuantity?: number;
      value?: number;
    };
    validityEnd?: string;
    validityStart?: string;
  };
  productId?: string;
  sku?: string;
  slug?: string;
}

export function hashPennyContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function parsePennyHuOffers(html: string, observedAt: string): ParsedShopProductRow[] {
  const nuxtData = extractNuxtData(html);
  const productGroup = findProductGroup(nuxtData);
  const products = Array.isArray(productGroup["products"])
    ? productGroup["products"] as PennyProduct[]
    : [];

  return products
    .map((product) => toParsedRow(product, observedAt))
    .filter((row): row is ParsedShopProductRow => row !== null);
}

function extractNuxtData(html: string): NuxtValue[] {
  const match = html.match(/<script[^>]+id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

  if (!match?.[1]) {
    throw new Error("PENNY offers page did not include __NUXT_DATA__.");
  }

  const raw = JSON.parse(match[1]) as NuxtValue[];
  const resolving = new Set<number>();
  const cache = new Map<number, NuxtValue>();

  function resolve(value: NuxtValue): NuxtValue {
    if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value < raw.length) {
      if (cache.has(value)) {
        return cache.get(value) ?? null;
      }
      if (resolving.has(value)) {
        return raw[value] ?? null;
      }

      resolving.add(value);
      const resolved = resolve(raw[value] ?? null);
      resolving.delete(value);
      cache.set(value, resolved);

      return resolved;
    }

    if (Array.isArray(value)) {
      return value.map((entry) => resolve(entry));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, resolve(entry)])
      );
    }

    return value;
  }

  return raw.map((entry) => resolve(entry));
}

function findProductGroup(nuxtData: NuxtValue[]): Record<string, NuxtValue> {
  for (const entry of nuxtData) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }

    for (const [key, value] of Object.entries(entry)) {
      if (key.startsWith("product-group-ajanlatok-") && value && typeof value === "object" && !Array.isArray(value)) {
        return value;
      }
    }
  }

  throw new Error("PENNY offers page did not include an ajanlatok product group.");
}

function toParsedRow(product: PennyProduct, observedAt: string): ParsedShopProductRow | null {
  const sourceProductKey = product.sku ?? product.productId;
  const displayName = product.name;
  const price = product.price?.regular?.value;

  if (!sourceProductKey || !displayName || typeof price !== "number") {
    return null;
  }

  return {
    categoryLabel: product.category ?? null,
    countryCode: "HU",
    displayName,
    packageLabel: product.packageLabel ?? "darab",
    priceObservations: [
      {
        currencyCode: "HUF",
        observedAt,
        price: price / 100,
        priceKind: "offer",
        unitPriceLabel: formatUnitPrice(product.price),
        validFrom: product.price?.validityStart ?? null,
        validTo: product.price?.validityEnd ?? null
      }
    ],
    productIdentifiers: createPennyProductIdentifiers(product),
    sourceProductKey,
    stock: {
      availability: "infinite",
      countryCode: "HU"
    },
    storeBrandKey: "penny-hu"
  };
}

function createPennyProductIdentifiers(product: PennyProduct): ParsedShopProductIdentifier[] {
  const identifiers: Array<ParsedShopProductIdentifier | null> = [
    product.sku
      ? {
          issuer: "penny.hu",
          kind: "retailer_item_number",
          value: product.sku
        }
      : null,
    product.productId
      ? {
          issuer: "penny.hu",
          kind: "retailer_product_id",
          value: product.productId
      }
      : null
  ];

  return identifiers.filter((identifier): identifier is ParsedShopProductIdentifier => identifier !== null);
}

function formatUnitPrice(price: PennyProduct["price"]): string | null {
  const unitPrice = price?.regular?.perStandardizedQuantity;
  const unit = price?.baseUnitShort;

  if (typeof unitPrice !== "number" || !unit) {
    return null;
  }

  return `${unitPrice / 100} Ft/${unit.toLowerCase()}`;
}
