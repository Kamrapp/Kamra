import { createHash } from "node:crypto";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import type { ParsedShopProductRow } from "../../v1/contracts.js";

export const simplePdfShopSourceName = "simple_pdf_shop";
export const simplePdfShopWorkflowName = "synthetic-pdf-shop";
export const simplePdfShopParserName = "SimplePdfShopParser";
export const simplePdfShopParserVersion = "1.0.0";

interface SimplePdfShopFixtureRow {
  categoryLabel: string;
  displayName: string;
  packageLabel: string;
  price: number;
  sourceProductKey: string;
  unitPriceLabel: string;
  validFrom: string;
  validTo: string;
}

const pdfMetadataDate = new Date("2026-06-23T00:00:00.000Z");
const simplePdfShopColumns = [
  "sourceProductKey",
  "displayName",
  "packageLabel",
  "categoryLabel",
  "priceHuf",
  "unitPriceLabel",
  "validFrom",
  "validTo"
] as const;

export const simplePdfShopFixtureRows: readonly SimplePdfShopFixtureRow[] = [
  {
    categoryLabel: "tejtermek",
    displayName: "Kamra tej 1,5%",
    packageLabel: "1 l",
    price: 329,
    sourceProductKey: "SPS-MILK-15",
    unitPriceLabel: "329 Ft/l",
    validFrom: "2026-06-23",
    validTo: "2026-06-29"
  },
  {
    categoryLabel: "pekaru",
    displayName: "Felbarna kenyer",
    packageLabel: "500 g",
    price: 449,
    sourceProductKey: "SPS-BREAD-WHEAT",
    unitPriceLabel: "898 Ft/kg",
    validFrom: "2026-06-23",
    validTo: "2026-06-29"
  },
  {
    categoryLabel: "alap elelmiszer",
    displayName: "Tojas M meret",
    packageLabel: "10 db",
    price: 899,
    sourceProductKey: "SPS-EGG-M",
    unitPriceLabel: "89,90 Ft/db",
    validFrom: "2026-06-23",
    validTo: "2026-06-29"
  }
];

export async function generateSimplePdfShopFixturePdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("SimplePdfShop weekly prices");
  pdf.setAuthor("Kamra synthetic ingestion");
  pdf.setSubject("Synthetic PDF source fixture");
  pdf.setCreator("Kamra SimplePdfShop generator");
  pdf.setProducer("pdf-lib");
  pdf.setCreationDate(pdfMetadataDate);
  pdf.setModificationDate(pdfMetadataDate);

  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 792;

  page.drawText("SimplePdfShop weekly prices", {
    color: rgb(0.08, 0.08, 0.08),
    font: boldFont,
    size: 16,
    x: 48,
    y
  });
  y -= 30;

  for (const line of serializeSimplePdfShopFixtureRows()) {
    page.drawText(line, {
      color: rgb(0, 0, 0),
      font,
      size: 8,
      x: 48,
      y
    });
    y -= 18;
  }

  return pdf.save({ useObjectStreams: false });
}

export function hashPdfContent(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function parseSimplePdfShop(
  pdfBytes: Uint8Array,
  observedAt: string
): Promise<ParsedShopProductRow[]> {
  const lines = await extractPdfTextLines(pdfBytes);
  const headerIndex = lines.findIndex(
    (line) => line === formatSimplePdfShopLine([...simplePdfShopColumns])
  );

  if (headerIndex < 0) {
    throw new Error("SimplePdfShop PDF is missing the expected column header.");
  }

  const productLines = lines.slice(headerIndex + 1).filter((line) => line.startsWith("SPS-"));

  if (productLines.length === 0) {
    throw new Error("SimplePdfShop PDF did not contain product rows.");
  }

  return productLines.map((line) => parseSimplePdfShopProductLine(line, observedAt));
}

export async function extractPdfTextLines(pdfBytes: Uint8Array): Promise<string[]> {
  const loadingTask = getDocument({
    data: new Uint8Array(pdfBytes),
    useSystemFonts: true
  });
  const document = await loadingTask.promise;
  const lines: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();

      for (const item of textContent.items) {
        if ("str" in item && typeof item.str === "string") {
          const line = item.str.replace(/\s+/g, " ").trim();

          if (line.length > 0) {
            lines.push(line);
          }
        }
      }
    }
  } finally {
    await loadingTask.destroy();
  }

  return lines;
}

function parseSimplePdfShopProductLine(line: string, observedAt: string): ParsedShopProductRow {
  const cells = line.split("|").map((cell) => cell.trim());

  if (cells.length !== simplePdfShopColumns.length) {
    throw new Error(
      `SimplePdfShop row expected ${simplePdfShopColumns.length} cells but found ${cells.length}.`
    );
  }

  const [
    sourceProductKey,
    displayName,
    packageLabel,
    categoryLabel,
    priceText,
    unitPriceLabel,
    validFrom,
    validTo
  ] = cells;
  const price = Number.parseInt(priceText ?? "", 10);

  if (!sourceProductKey || !displayName || !Number.isFinite(price)) {
    throw new Error("SimplePdfShop row is missing a required product key, name, or price.");
  }

  return {
    categoryLabel,
    countryCode: "HU",
    crawlContext: line,
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
    storeBrandKey: "simple-pdf-shop"
  };
}

function serializeSimplePdfShopFixtureRows(): string[] {
  return [
    formatSimplePdfShopLine([...simplePdfShopColumns]),
    ...simplePdfShopFixtureRows.map((row) =>
      formatSimplePdfShopLine([
        row.sourceProductKey,
        row.displayName,
        row.packageLabel,
        row.categoryLabel,
        String(row.price),
        row.unitPriceLabel,
        row.validFrom,
        row.validTo
      ])
    )
  ];
}

function formatSimplePdfShopLine(cells: readonly string[]): string {
  return cells.join(" | ");
}
