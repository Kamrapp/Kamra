import type { AppRoute } from "../../app-route-context.js";
import {
  createAlphaUserRoute,
  currentUserRoute,
  loginRoute,
  logoutRoute,
  userPreferencesRoute
} from "../auth-routes.js";

export const accessRoutes: AppRoute[] = [
  loginRoute,
  createAlphaUserRoute,
  logoutRoute,
  currentUserRoute,
  userPreferencesRoute
];
