import type { AppRoute } from "../../app-route-context.js";
import {
  acceptProductReviewItemRoute,
  declineProductReviewItemRoute,
  ingestionSnapshotsRoute,
  prepareProductReviewItemsRoute,
  previewProductReviewItemAcceptanceRoute,
  processIngestionSnapshotRoute,
  productReviewItemRoute,
  productReviewItemsRoute
} from "../ingestion-routes.js";

export const ingestionRoutes: AppRoute[] = [
  ingestionSnapshotsRoute,
  processIngestionSnapshotRoute,
  prepareProductReviewItemsRoute,
  previewProductReviewItemAcceptanceRoute,
  productReviewItemsRoute,
  productReviewItemRoute,
  acceptProductReviewItemRoute,
  declineProductReviewItemRoute
];
