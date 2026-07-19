import type { AppRoute } from "../../app-route-context.js";
import { autoLoginRoute } from "../auto-login-route.js";
import {
  createAlphaUserRoute,
  currentUserRoute,
  loginRoute,
  registerInvitedUserRoute,
  logoutRoute,
  userPreferencesRoute
} from "../auth-routes.js";

export const accessRoutes: AppRoute[] = [
  autoLoginRoute,
  loginRoute,
  createAlphaUserRoute,
  registerInvitedUserRoute,
  logoutRoute,
  currentUserRoute,
  userPreferencesRoute
];
