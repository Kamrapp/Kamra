import type { AppRoute } from "../../app-route-context.js";
import { healthzRoute } from "../health-route.js";
import { logRoute } from "../log-route.js";

export const observabilityRoutes: AppRoute[] = [healthzRoute, logRoute];
