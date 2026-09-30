# One account, a profile per app

A person signs in to the teaching app and the learning app with the same Firebase account. Each
app should put them in a profile (a user row, and the org it belongs to) that fits that app. The
profile dropdown in each app lists all of their profiles. Choosing one that belongs to the other
app opens that app.

Status (2026-10-01): built, and checked end to end on dev (learning first, then teaching, then
switching both ways from the menu). Not yet run: teaching first, and an invited student. This works on the current `User` model (one row per
`{uid, org}`). It is not the Identity + Membership rebuild in `USER_ROLES_AND_SIGNUP.md`, which is
not built either.

## What happens today

Checked in the code on 2026-10-01.

- `GET user/initial-login-data` is sent with no `organization` header. `AuthGuard` then takes the
  **first** user row for the Firebase uid, from any app (`apps/server/src/guards/auth.guard.ts:209-214`),
  and registers a new account only when the uid has no rows at all. The app never plays a part.
- Both apps select `localStorage.organization`, falling back to the first row
  (`apps/*/src/stores/user.store.ts`, `loadLoggedInUsers`).
- The result:
  - **A student who signs in to teaching** lands in their student org as `student`. They can read
    that org's courses and every write returns 403.
  - **A teacher who signs in to learning** lands in their teaching org as `admin`. Their
    enrollments and progress are written into that org.
- The dropdown (`apps/{teaching,learning}/src/components/app/sidebars/components/menus/ProfileDropdown.tsx`)
  lists every row for the uid. Choosing a row calls `selectUserAndOrg` and reloads the page,
  whatever the row's role is.

## Which profile fits which app

```ts
// packages/shared/src/utils: one rule, used by the server and both apps
const fitsApp = (app: Subdomain, permission: DefaultRole) =>
  app === Subdomain.LEARN ? permission === DefaultRole.STUDENT
  : app === Subdomain.TEACH ? permission !== DefaultRole.STUDENT
  : true; // support
```

An invited student in a teacher's org is a `student` row, so it fits learning. That case keeps
working.

**A person can belong to any number of orgs, with the same permission or different ones.** One
person might be admin in A, teacher in B and a student in C and D. Every row that fits the current
app switches in place, and the rest open the other app. An org is created only when **no** row fits
the app, so it happens once per app at most.

## Changes

### 1. Sign-in picks, or creates, a profile for the app (server)

- In `AuthGuard.validateAndGetUser`, when `initial-login-data` arrives without an org, pick the
  first row that fits the app. If none fits, register a new one through the existing
  `registerUser(getRegisterPayload(app, …))`. That gives a new org, and a new user row with the
  same uid, as `admin` on teaching or `student` on learning. The unique `{uid, org}` index allows
  it, because the org is new.
- `getInitialLoginData` keeps returning **every** row and org, because the dropdown needs them
  all.
- With an `organization` header, a row that does not fit the app is refused with **403, not
  401**. The apps treat a 401 as an expired session and sign the user out. This stops a teaching
  session from acting as a student row, and a learning session from acting as an admin row.

### 2. Each app selects only a fitting profile (both apps)

`loadLoggedInUsers` chooses from the rows that fit the app: the one matching `?org=` (step 3),
then `localStorage.organization`, then the first fitting row. The server always creates a fitting
row, so there is always at least one.

### 3. The dropdown opens the other app (both apps)

- Rows that fit the current app switch in place, as today.
- A row that doesn't fit carries an "Opens in Learning" or "Opens in Teaching" hint and an
  arrow-out icon. Choosing it goes to `<other app URL>/?org=<org id>`.
- The target app reads `?org=` once, at startup. If the signed-in user has a fitting row in that
  org, it writes the org to `localStorage.organization` and removes the parameter from the URL.
- URLs: `NEXT_PUBLIC_LEARN_URL` already exists in teaching. Add `NEXT_PUBLIC_TEACH_URL` to
  learning, and point the hardcoded `COMPANY.teachUrl` at it.

**Session across the two apps.** The apps are on different origins, and Firebase keeps its
session per origin (IndexedDB), so:

- if the user has signed in to the other app before, they arrive signed in;
- if not, they see its sign-in page once, and `?org=` still applies after they sign in.

Removing that one extra sign-in needs a handoff:

- a `POST auth/handoff` route that calls the existing, so far unused,
  `FirebaseService.createCustomToken`;
- a `/handoff#token=…` page that calls the existing, so far unused, `signInWithToken`.

The handoff is **deferred**. A custom token in a URL is a bearer credential for an hour, and the
plain redirect covers the common case. Build it only if the extra sign-in turns out to be a
problem.

## Known gaps, unchanged by this work

- **Two concurrent first calls** can still create two orgs, because registration is not
  idempotent (`USER_ROLES_AND_SIGNUP.md` §5.5). Step 1 adds a second place where registration
  happens: the first sign-in to the *other* app.
- **Teachers previewing as learners:** a teacher who wants to see their own course as a learner
  now does so from their new student profile, not as admin of the teaching org.

## Verification

- Server: typecheck, lint, build.
- On dev, with two test accounts, check each of these through Playwright:
  - learning-first then teaching;
  - teaching-first then learning;
  - an invited student;
  - switching from the dropdown in both directions.
