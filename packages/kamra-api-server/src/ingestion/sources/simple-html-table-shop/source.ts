import { createHash } from "node:crypto";

import type { ParsedShopProductRow } from "../../v1/contracts.js";

export const simpleHtmlTableShopSourceName = "simple_html_table_shop";
export const simpleHtmlTableShopWorkflowName = "synthetic-html-table-shop";
export const simpleHtmlTableShopParserName = "SimpleHtmlTableShopParser";
export const simpleHtmlTableShopParserVersion = "1.1.0";

export const simpleHtmlTableShopFixture = `<!doctype html>
<html lang="hu">
  <head>
    <meta charset="utf-8">
    <title>SimpleHtmlTableShop heti arak</title>
  </head>
  <body>
    <main>
      <h1>SimpleHtmlTableShop orszagos arlista</h1>
      <table id="simple-html-table-shop-products">
        <thead>
          <tr>
            <th>Termekkulcs</th>
            <th>Termeknev</th>
            <th>Kiszereles</th>
            <th>Kategoria</th>
            <th>Ar HUF</th>
            <th>Egysegar</th>
            <th>Ervenyes ettol</th>
            <th>Ervenyes eddig</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>SHTS-MILK-15</td>
            <td>Kamra tej 1,5%</td>
            <td>1 l</td>
            <td>tejtermek</td>
            <td>329</td>
            <td>329 Ft/l</td>
            <td>2026-06-23</td>
            <td>2026-06-29</td>
          </tr>
          <tr>
            <td>SHTS-BREAD-WHEAT</td>
            <td>Felbarna kenyer</td>
            <td>500 g</td>
            <td>pekaru</td>
            <td>449</td>
            <td>898 Ft/kg</td>
            <td>2026-06-23</td>
            <td>2026-06-29</td>
          </tr>
          <tr>
            <td>SHTS-EGG-M</td>
            <td>Tojas M meret</td>
            <td>10 db</td>
            <td>alap elelmiszer</td>
            <td>899</td>
            <td>89,90 Ft/db</td>
            <td>2026-06-23</td>
            <td>2026-06-29</td>
          </tr>
        </tbody>
      </table>
    </main>
  </body>
</html>`;

export function hashSourceContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function parseSimpleHtmlTableShop(html: string, observedAt: string): ParsedShopProductRow[] {
  const rows = [...html.matchAll(/<tr>\s*([\s\S]*?)\s*<\/tr>/g)].slice(1);

  return rows.map((rowMatch) => {
    const crawlContext = rowMatch[0]?.trim() ?? null;
    const rowHtml = requireRegexCapture(rowMatch, 1, "table row");
    const cells = [...rowHtml.matchAll(/<td>\s*([\s\S]*?)\s*<\/td>/g)]
      .map((cellMatch) => decodeHtmlText(requireRegexCapture(cellMatch, 1, "table cell")));

    if (cells.length !== 8) {
      throw new Error(`Expected 8 product table cells but found ${cells.length}.`);
    }

    const sourceProductKey = requireCell(cells, 0);
    const displayName = requireCell(cells, 1);
    const packageLabel = requireCell(cells, 2);
    const categoryLabel = requireCell(cells, 3);
    const priceText = requireCell(cells, 4);
    const unitPriceLabel = requireCell(cells, 5);
    const validFrom = requireCell(cells, 6);
    const validTo = requireCell(cells, 7);
    const price = Number.parseInt(priceText, 10);

    if (!sourceProductKey || !displayName || !Number.isFinite(price)) {
      throw new Error("SimpleHtmlTableShop row is missing a required product key, name, or price.");
    }

    return {
      categoryLabel,
      countryCode: "HU",
      crawlContext,
      displayName,
      packageLabel,
      priceObservations: [
        {
          currencyCode: "HUF",
          observedAt,
          price,
          unitPriceLabel,
          validFrom,
          validTo
        }
      ],
      sourceProductKey,
      stock: {
        availability: "infinite",
        countryCode: "HU"
      },
      storeBrandKey: "simple-html-table-shop"
    };
  });
}

function requireRegexCapture(match: RegExpMatchArray, index: number, label: string): string {
  const value = match[index];

  if (value === undefined) {
    throw new Error(`SimpleHtmlTableShop parser could not read ${label}.`);
  }

  return value;
}

function requireCell(cells: string[], index: number): string {
  const value = cells[index];

  if (!value) {
    throw new Error(`SimpleHtmlTableShop row is missing required cell ${index}.`);
  }

  return value;
}

function decodeHtmlText(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
