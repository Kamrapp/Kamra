import type { AppRoute } from "../../app-route-context.js";
import {
  createAlphaUserRoute,
  currentUserRoute,
  loginRoute,
  registerInvitedUserRoute,
  logoutRoute,
  userPreferencesRoute
} from "../auth-routes.js";

export const accessRoutes: AppRoute[] = [
  loginRoute,
  createAlphaUserRoute,
  registerInvitedUserRoute,
  logoutRoute,
  currentUserRoute,
  userPreferencesRoute
];
