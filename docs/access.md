# Controlled Alpha Access

## Stage 7 Posture

Kamra has no public registration flow. During the MVP, an existing admin can explicitly create a user through the developer-admin surface when controlled alpha access is enabled.

Alpha users:

- use the existing email/password login
- are marked explicitly with `alphaAccess` metadata in the `users` document
- receive role `user`
- receive one new empty household with an owner membership
- do not receive demo household data

The initial password is entered manually by the admin. It is salted and stored as a `scrypt` hash. The raw password is never returned in the API response, audit metadata, or server log.

Existing users are not retroactively marked as alpha users. In particular, the bootstrap admin and demo users `usera` and `userb` remain outside the alpha gate.

## Feature Flag

The database-backed `allowControlledAlphaAccess` feature flag controls both sides of the flow:

- when disabled, admins cannot create new alpha users
- when disabled, users marked with `alphaAccess` cannot log in
- when disabled, the bootstrap admin and demo users continue to use the normal login path
- the default is disabled until an admin enables it

The existing admin feature-flag route exposes and updates this flag:

- `GET /api/admin/dashboard/feature-flags`
- `PATCH /api/admin/dashboard/feature-flags`

The creation route is admin-only:

- `POST /api/admin/alpha-users`

The request requires an email and a password with at least eight characters. The response contains the created user identity and empty household summary, but no credential material.

## Data Preservation

The alpha marker and audit metadata are optional fields on existing user documents. Existing users, households, memberships, catalog records, and feature-flag records are preserved. The feature-flag collection accepts the new key without rewriting existing records.

The alpha creation operation adds records to the existing `users`, `households`, and `household_memberships` collections. It does not reseed or alter the demo household.

## Manual Verification

1. Sign in as the existing admin.
2. Open `/dev-admin`.
3. Enable controlled alpha access in the feature flags panel and save it.
4. Enter a new email and initial password, then create the alpha user.
5. Confirm the response names one empty household and never displays the password.
6. Sign in as the new user and confirm the household list contains only the new empty household.
7. Disable controlled alpha access.
8. Confirm the alpha user can no longer sign in, while the admin and demo identities remain usable.

Public registration, invitation email, expiry, cleanup jobs, and household invitations remain deferred.
