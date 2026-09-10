# Users, roles and sign-up

The plan for four org roles scaling to custom roles, and for a rebuilt sign-up
flow. Reviewed against `apps/server` as it stands.

Written 2026-09-09 against `refactor/shared-packages-and-signup`.

**The short version:** the proposed flow works, but it merges three concerns into
one `GET` and makes the shape of a new account a side effect of which app the
browser was on. Those two choices produce most of the defects in §5 rather than
being incidental to them. Sign-up is being rebuilt rather than patched, on a data
model that separates the person from their memberships.

## 1. Decisions taken

| Question | Decision |
| -------- | -------- |
| Data model | **Split `User` into `Identity` + `Membership`** now, accepting the migration |
| Role for someone who signs up and creates an org | **Admin only.** It already carries every permission, so nothing is blocked |
| Email verification before creating an org | **Not required for now** |
| OTP verification | **Out of scope.** The `otp` module stays parked (see §7.8) |
| Roles | **No `Role` collection for now.** A member stores a static `permission` (`admin` / `teacher` / `assistant` / `student`) and the permission set comes from `DEFAULT_PERMISSIONS[permission]` |
| Per-member and per-org permission overrides | **Removed.** `removedPermissions` is gone from both schemas |
| Who derives permissions | **The client**, from the same shared map the server uses. Nothing derived is sent over the wire |

The role decision supersedes the multi-role planning that used to sit here.
`Membership` carries one `permission` value, not a `roles` array: with no Role
documents there is nothing to hold several of. Custom roles are deferred, and
§6.2 and §6.3 below are resolved by the deletion rather than by any fix.

## 2. The reframe

The proposal's steps b–g do three different jobs in one call:

1. **authenticate** — whose token is this;
2. **provision** — create an account that does not exist yet;
3. **bootstrap** — return everything the app needs to render.

Merging them is why registration ended up inside an auth guard, why a `GET`
performs a multi-collection write, and why a placeholder request context is
needed at all. Separating them removes all three problems at once.

The second issue is that the plan derives the *shape* of a new account — which
org, which role — from which app the browser happened to be on, silently. That is
the direct cause of §5.2. In the rebuilt flow the app identifies itself
explicitly, and the server fails closed when it does not.

## 3. The data model

### 3.1 Identity and Membership

Today `User` is one row per `(uid, org)` and carries the profile — `name`,
`firstName`, `lastName`, `gender`, `dob`, `avatar`, `timezone`, `standards`,
`designation`, `pinCode`, `address`. Three consequences, all bad:

- a teacher in three orgs has **three copies of their profile**, and
  `updateProfile` writes to exactly one, so they drift;
- **`uid` cannot be made unique**, so no index can make provisioning
  idempotent — which is precisely why concurrent first calls create duplicate
  orgs (§5.5);
- "the same person is a student in org A and a teacher in org B" — an explicit
  requirement — has no clean representation.

The split:

```
Identity                          the person; exactly one row per human
  _id
  uid          UNIQUE             Firebase uid, the authentication key
  email        UNIQUE             see §5.7 for why this needs a Firebase setting too
  name, firstName, lastName
  avatar, gender, dob, timezone
  designation, pinCode, address
  lastActive

Membership                        what that person is, in one org
  _id
  identity  -> Identity
  org       -> Org
  permission                      admin | teacher | assistant | student
  accountType                     SELF | INVITED
  invitedBy -> Identity
  invite    -> Invite
  isInactive
  standards[]                     a learner's standards are per-org, not per-person

  UNIQUE (identity, org)
```

What this buys, in order of importance:

1. **Provisioning becomes idempotent by construction.** A unique `uid` means a
   concurrent second attempt collides on the index; the loser catches the
   duplicate-key error and re-reads. No lock, no claim document.
2. **The profile is edited once** and every org sees the same person.
3. **Multi-org is expressed directly** rather than by convention.
4. `permission` is a plain enum on the row, so authorization needs no join at all.

`standards` moves to `Membership` deliberately: what a learner studies is a fact
about their enrolment in one org, not about the person.

### 3.2 What the migration involves

No migration tool exists in this repo, so this is a script plus a deploy.

1. For each distinct `uid`, insert one `Identity`. Where a `uid` has several
   `User` rows the profiles may disagree — take the most recently `updatedAt` row
   as canonical and log the discarded values rather than merging silently.
2. For each existing `User` row, insert one `Membership` carrying `org`,
   `permission`, `accountType`, `invitedBy`, `invite`, `isInactive` and
   `standards`.
3. Rewrite the reads. `UserService` has around fifteen methods and nearly all of
   them touch the `User` collection, plus `AuthGuard`, which resolves the caller
   on every request.
4. `BaseSchema.createdBy` and `updatedBy` reference `'User'`. They should point at
   `Identity` — an audit trail wants the person, not one of their memberships.
   Same for `Invite.invitedBy`.
5. Drop `User` only after the apps ship, so a rollback stays possible.

**The client contract changes shape**, which is the part that reaches furthest.
`InitialDataDto` is `{ users, orgs }` today, where `users` is the caller's own row
in every org. It becomes `{ identity, memberships, orgs }`. That lands in
`packages/shared`, then in all three apps' user stores, and
`IUser = UserDto & {...}` stops being the right client type for "me".

## 4. The rebuilt sign-up flow

### 4.1 Three states, not two

The proposal's step (d) checks *present or absent*. There is a third state, and it
is the multi-org case the plan itself calls for:

| State | Example | What happens |
| ----- | ------- | ------------ |
| No identity | a genuinely new person | create the `Identity`, then provision for this app |
| Identity **and** a membership usable by this app | a returning teacher | return it; land in the app |
| Identity but **no** membership usable here | a student who signed up on learning now opens teaching | **offer to create an org** — not an error, not a fresh sign-up |

Without the third state that user hits a dead end, or silently lands in an org
where they are a student. "Usable by this app" must be decided **by permission,
not by role name** — same reason as §6.2.

### 4.2 Endpoints

Replacing `GET user/initial-login-data` doing all of it:

- **`POST auth/session`** — idempotent. Ensures the `Identity` exists, updates
  `lastActive`, returns `{ identity, memberships, orgs }`. Called after *every*
  sign-in, not only after sign-up, so the two share one path — the consistency the
  proposal's Case 1 was reaching for, without a fabricated context. `POST` because
  it may write; safe to retry because of the unique `uid`.
- **`POST orgs`** — create an organization, with its name and type. Needed for
  state 3 above and for "a teacher creates a second org". **No endpoint does this
  today**; `org/update` is the only route on `OrgController`.
- **`POST invites/:token/accept`** — join an org, resolved **by token** (§4.4).

The app identifies itself as an explicit, validated parameter. A request that does
not say which app it is, is refused (§5.1).

### 4.3 What `auth/session` does

```
POST auth/session   { app: 'teach' | 'learn' | 'support' }

  identity    = upsert Identity by uid            (idempotent; unique index)
  memberships = find Membership by identity
  usable      = memberships whose roles grant a permission this app needs

  -> { identity, memberships, orgs, usable }
```

It does **not** create an org. Org creation is a separate, explicit call, so:

- a learner no longer gets a personal org and four role documents they never asked
  for (§6.1);
- provisioning stops depending on which app was guessed from a URL;
- the "create your organization" screen can collect a real name and type instead
  of the server inventing one from the email local-part.

### 4.4 The four journeys

**A. Teacher signs up on teaching, no invite.**
Firebase account → `POST auth/session` creates the `Identity` and returns zero
usable memberships → the app shows "name your organization" → `POST orgs` creates
the `Org`, seeds the four default roles, and creates the `Membership` with
`roles: [Admin]` → land in the app.

**B. Someone signs up from an invite link.**
The invite token is in the URL. `GET invite/lookup/:inviteId` is already
`@Public()`, so the org name can be shown *before* sign-up. Firebase account →
`POST auth/session` → `POST invites/:token/accept` creates the `Membership` with
the invited role. **No org is created.**

**C. Returning user, one usable membership.** `POST auth/session` → land in it.

**D. Returning user, several usable memberships.** `POST auth/session` → org
picker, or the last-used org if it is still usable. Today the client takes
`loggedInUsers[0]` (§6.5).

Journey B is the fix for §5.6: resolving the invite **by token** rather than by
"any pending invite matching this email" means the user knows which org they are
joining, and the invited-versus-self branch becomes explicit rather than a silent
lookup.

### 4.5 Demo data is not in the critical path

"Add some demo data" must not block the response. Blocking the first paint on a
batch of inserts makes sign-up feel slow, and a half-finished seed leaves a broken
account with no way to retry. Either seed after responding, or make it lazy — an
empty state with a "load sample content" button, which is better product anyway.
Nothing seeds anything today, so this is new work either way.

### 4.6 Case 1, re-answered

The proposal asks whether the request context should be filled with placeholder
values so registration and normal operation share one flow. Under §4.2 the answer
changes: **do not fake a user context.** Provisioning is not a tenant operation
and should not borrow tenant machinery.

The reason the placeholder is needed today is real — `BaseSchema` declares `org`
and `createdBy` as `required` and `immutable`, and the two global Mongoose plugins
stamp every insert from the ambient context, so the inserts cannot happen without
one. But the fix is a *typed provisioning context* whose ids are explicit and
whose `role` is `undefined`, not a `RegisterUserDto` cast into the shape of a
`UserDto` with `role: ''`. That empty string is why
`RequestContextService.getRole()` throws during registration
(`new Types.ObjectId('')`), and why `getRoleSafe()` had to exist.

## 5. Defects in the current implementation

Some of these dissolve when §4 lands. Others are independent of sign-up and need
fixing regardless — those are marked **stands**.

### 5.1 The subdomain gate is dead, and 69 routes are refused — **stands**

`getSubdomainFromUrl` (`apps/server/src/utils/util.ts:21`) extracts
`learn` | `teach` | `support` from the request *path*; its docblock gives
`/user/teach/profile` as the example. Nothing produces such a path: every client
service writes a bare resource path, `NEXT_PUBLIC_BASE_URL` carries no path
segment in any app, and `main.ts` calls no `setGlobalPrefix`.

So the subdomain is always `undefined`, and `AccessGuard` refuses every route
declaring one:

```ts
// apps/server/src/guards/access.guard.ts:37-42
const allowed = this.getMetadata<Subdomain[]>(context, SUBDOMAINS_KEY);
if (allowed?.length) {
  const subdomain = this.requestContextService.getSubdomain();
  if (!subdomain || !allowed.includes(subdomain)) {
    throw new ForbiddenException('This endpoint is not available for this app.');
  }
}
```

**69 `@Subdomains(...)` declarations** are affected, including `user/all`,
`user/update`, `user/revoke`, `user/update-role`, `org/update` and every write in
the invite module. All of them 403 today.

**Fix:** send the app as a request header next to `organization`, which is how the
client already passes per-request context, and read it in the auth guard alongside
`timezone`. This is the same value `auth/session` takes as `app`.

### 5.2 Every self sign-up is granted full admin — dissolved, but keep it closed

```ts
// apps/server/src/modules/user/user.service.ts:111
const ownerRole = subdomain === Subdomain.LEARN ? DefaultRole.STUDENT : DefaultRole.SUPER_ADMIN;
```

With `subdomain` permanently `undefined` this always takes the `SUPER_ADMIN`
branch, so a learner signing up on the learning app receives `ALL_PERMISSIONS` in
their own org.

§4.3 removes the ternary entirely — `auth/session` creates no org, and `POST orgs`
grants Admin only to someone who explicitly asked to create one. The rule worth
carrying forward is that a **missing or unrecognised app is refused**, never
defaulted to the most privileged branch.

### 5.3 Revoked users keep full access — **stands**

`revokeAccess` sets `isInactive: true` (`user.service.ts:250`) and `restoreAccess`
clears it. **Nothing reads the field** — across `apps` and `packages` it appears
only in the schema, the DTO, those two writes, and a sort key in `getOrgStaff`.
`AuthGuard.validateAndGetUser` loads the user and never checks it, so a revoked
member keeps their token and every permission their role grants.

Under §3.1 the flag lives on `Membership`, and resolving the caller must reject an
inactive one the same way it rejects a missing one.

### 5.4 `removedPermissions` was a dead field on two schemas — resolved by deletion

It was declared on `User` and `Org` and read nowhere, so it looked like a working
per-member and per-org override while granting the role's full set regardless.

Briefly implemented, then removed outright per §1: overrides are not part of the
simple flow. Both fields are gone from the schemas, from `UserDto`, and from the
request context. If they come back, they must be enforced from the start.

### 5.5 Registration is not idempotent, and is not atomic — dissolved

`getRegisterPayload` mints a fresh `_id` and a fresh `org` on every call:

```ts
// apps/server/src/utils/util.ts:10
export const getRegisterPayload = (firebaseUser: FirebaseUserDto): RegisterUserDto => {
  return { ...firebaseUser, _id: getObjectId(), org: getObjectId() };
};
```

Two concurrent first requests — a React double-mount, or `initial-login-data`
racing another call — both miss the lookup and both register: two users, two orgs,
eight roles for one Firebase account. The unique `{ uid, org }` index cannot catch
it, because each attempt invents a different `org`.

There is no transaction either. A failure at the user insert leaves an orphan org
and four orphan roles with no owner.

§3.1's unique `uid` fixes the idempotency by construction. `POST orgs` should still
wrap its org-plus-roles-plus-membership writes in a Mongoose session.

### 5.6 A pending invite silently overrides self sign-up — dissolved

`registerUser` looks up *any* pending invite for the email and joins that org
instead of creating one. A teacher once invited as a `STUDENT` elsewhere, who later
signs up on teaching to create their own org, becomes a student of that other org
with no org of their own — and no path back, since `org/update` needs `EDIT_ORG`,
which `STUDENT` lacks, and nothing exposes org creation.

Journey B in §4.4 replaces this with token-resolved invites.

### 5.7 One person, two Firebase identities — **stands, and matters more**

Users are keyed by `uid`, and email/password and Google produce **different UIDs
for the same email** unless Firebase's one-account-per-email setting is on or the
providers are linked.

Under §3.1 this gets worse, not better: two UIDs become two `Identity` rows, which
is two different people as far as the system is concerned. The unique `email` index
in §3.1 is the safety net — the second sign-up fails loudly instead of quietly
forking the account — but the real fix is the Firebase console setting, and it
should be turned on **before** the migration runs, so the data being migrated is
not already forked.

## 6. Smaller points

- **6.1 Learner sign-up creates an org and four role documents.** Five throwaway
  documents and a spurious org-switcher entry for someone who only joins a
  teacher's org. §4.3 fixes this by not creating an org during `auth/session`. Note
  `BaseSchema.org` is `required`, so any org-owned document belonging to a learner
  with no org needs thought — `Bookmark`, `Reaction` and `Follower` are
  caller-scoped and will hit this first.
- **6.2 The lossy role-to-`DefaultRole` collapse is gone.** `getPermissionForRole`
  mapped any role onto one of four enum values, so a custom role called "Head of
  Physics" reached the client as `assistant`. Deleted along with the `Role`
  collection: `permission` *is* one of those four values now, stored on the user,
  so there is nothing to collapse. The apps read it directly and derive
  permissions from `DEFAULT_PERMISSIONS`. When custom roles return, this is the
  decision to revisit first — send the permission list, not a role name.
- **6.3 Seeded roles no longer exist.** There is no `Role` document to rename or
  delete, so the missing `isSystem` flag is moot until custom roles return.
- **6.4 `SUPER_ADMIN` is misnamed.** The role is org-scoped; "super admin" reads as
  platform-level, and your own list calls it Admin. It is a stored string in
  `Role.role`, so renaming it is a data migration — worth folding into §3.2 rather
  than doing separately.
- **6.5 The client picks an org arbitrarily.** `loadLoggedInUsers` takes
  `loggedInUsers[0]` when no org is in `localStorage` (`user.store.ts:214`), and
  filters by nothing, so a teacher can land in an org where they are a student.
  Journey D replaces this.
- **6.6 The `permission` header is ignored by the server.** The auth guard reads
  `Authorization`, `organization`, `timezone`, `timezone-offset` and `api-key`,
  never `permission`. That is correct — a client-declared role would be
  escalation — but `http.service.ts:26` sets it from `localStorage` and CLAUDE.md
  documents it as meaningful. Drop it.
- **6.7 Org switching is validated.** Recorded as a non-issue: an `organization`
  header naming someone else's org fails, because the lookup requires a membership
  row in it. Keep that property when it becomes a `Membership` lookup.

## 7. Client-side work

- **7.1 `fetchSignInMethodsForEmail` gates both sign-up and sign-in**
  (`firebase-auth.ts:178`, used by `SignUp.tsx` and `auth.hooks.ts`). Firebase has
  deprecated it, and it returns `[]` when Email Enumeration Protection is
  enabled — the default for new projects. Then sign-in tells valid users **"User
  not found!"** and sign-up proceeds into `auth/email-already-in-use`. It is also
  an enumeration oracle. Remove the pre-check and branch on the error codes.
- **7.2 Sign-up is not tied to provisioning.** `SignUp.tsx` creates the Firebase
  user and calls `router.push`. Provisioning happens later, implicitly, whenever
  some page calls `loadLoggedInUsers`. If it fails, the user is signed in with no
  account and no error at the point of sign-up. `POST auth/session` must be part of
  the sign-up submit, with visible loading and failure states, and retried rather
  than swallowed.
- **7.3 Provider linking is unhandled** — see §5.7.
- **7.4 Email verification is unused.** `sendEmailVerification` is commented out in
  all three apps and `isEmailVerified` is never called. Per §1 this stays as is;
  recorded so the gap is a decision rather than an oversight.
- **7.5 `SignIn.tsx` / `SignUp.tsx` are the dead ones**, not the `2` variants. The
  auth barrel exports only `./SignIn2` and `./SignUp2`, and those files declare
  `export const SignIn` / `export const SignUp`, so `pages/sign-in.tsx` renders the
  `2` files while the unsuffixed ones are unreachable. They still hold a duplicate
  copy of the sign-in logic, including the pre-check removed in §7.1, so they are
  worth deleting before anyone edits the wrong file.
- **7.6 The support app sent the private API key from the browser.** Its
  interceptor fetched a Firebase token, checked it was non-empty, then sent
  `api-key: process.env.NEXT_PUBLIC_PRIVATE_API_KEY` instead of an `Authorization`
  header. `NEXT_PUBLIC_` means that machine-to-machine credential was inlined into
  a public JS bundle. No route carries `@Private()` today, so nothing was reachable
  with it yet — but the hole would have opened silently the first time one was
  added. Fixed to send the bearer token; **the key still needs rotating**, since it
  has been shipped in built bundles.
- **7.7 The support app has no session at all.** It never calls
  `initial-login-data`, and nothing in it writes `StorageKey.ORGANIZATION`, so it
  has no way to learn which org it is acting for. Every org-scoped route will
  therefore still refuse it with "Organization is required!" until §4.2 gives it
  `auth/session` and an org picker. Sending the right credential was necessary but
  is not sufficient.
- **7.8 The `otp` module is dead.** Registered in `app.module` with a schema and
  three CRUD methods, no controller and no consumer. OTP is out of scope per §1, so
  it stays parked — but it should not be mistaken for working infrastructure by
  whoever builds sign-up.

## 8. Order of work

**Phase 0 — stop the bleeding.** Independent of the rebuild, all small. **Done
except where noted.**

1. ~~Send the app as a header and fail closed on a missing one (§5.1).~~ Done: an
   `app` header, validated against `Subdomain`, required on authenticated routes
   and optional on public and private ones. `getSubdomainFromUrl` is deleted. All
   three clients send it.
2. ~~Reject inactive members when resolving the caller (§5.3).~~ Done in the auth
   guard, alongside the existing missing-user rejection.
3. ~~Decide `removedPermissions` (§5.4).~~ Implemented first, then **deleted**
   outright when the role concept went (§1). `getEffectivePermissions()` is now a
   lookup in `DEFAULT_PERMISSIONS[permission]` with no database read at all.
4. **Still to do: turn on Firebase one-account-per-email (§5.7)** — a console
   setting, and it must happen **before** the Phase 1 migration.
5. ~~Drop the `permission` header (§6.6) and remove the
   `fetchSignInMethodsForEmail` pre-check (§7.1).~~ Done. `StorageKey.PERMISSION`
   is gone with its last reader, and `getFirebaseErrorMessage` now maps
   `auth/invalid-credential` (plus rate-limit and network codes), which is what the
   pre-check was standing in for.
6. **Still to do: rotate the private API key** exposed by §7.6.

### 8.1 Migrations this branch requires before it can deploy

None of these can be done from the code, and each breaks existing data if
skipped. `User.permission` and `Invite.permission` are **required**, so rows
without them fail validation on their next write.

1. **`users.role` → `users.permission`.** Derive from the `roles` document the id
   points at: `isAdmin` → `admin`, else the role's own name when it is one of
   `teacher` / `student` / `assistant`, else a deliberate fallback. **Choose that
   fallback consciously** — anyone on a custom role lands on it, so `student` is
   the safe direction and `admin` the dangerous one. Unset `role` and
   `removedPermissions` in the same pass.
2. **`invites.role` → `invites.permission`**, by the same mapping.
3. **`orgs.orgType`**: `'organization'` was removed from `OrgType`, so any row
   still holding it now fails the schema's enum validation. Map it to one of
   `company` / `institute` / `school` / `ngo` / `government` / `startup`.
4. **Firebase one-account-per-email** (§5.7) — before anything else, so nothing
   being migrated is already forked across two uids.

The `roles` collection is dead weight afterwards. Leave it until the migration is
confirmed, then drop it.

**Phase 1 — the data model.** `Identity` and `Membership`, the migration script,
the rewritten reads, the `SUPER_ADMIN` → `ADMIN` rename folded in, and the changed
`InitialDataDto` through `packages/shared` into the three stores (§3.1, §3.2,
§6.4).

**Phase 2 — the flow.** `POST auth/session`, `POST orgs`,
`POST invites/:token/accept`, the three states, the four journeys, and the client
screens that go with them (§4). Retire `registerUser` and the write inside the auth
guard.

**Phase 3 — polish.** Demo data as a lazy empty state (§4.5), the org picker
(§6.5), `isSystem` on seeded roles (§6.3).

**Later — custom roles.** Effective permissions to the client and stop branching on
`DefaultRole` (§6.2), then multi-role and the management UI. Deferred by §1, and
`roles[]` already exists by then.
