# Users, roles and sign-up

A review of the proposed user flow (four org roles, scaling to custom roles, and
first-call registration) against what `apps/server` already implements.

Written 2026-09-09 against `refactor/shared-packages-and-signup` at `a1ef225`.

**The short version:** the proposed design is already built, including the dummy
request context used during registration. What needs work is not the design but
five live defects — two of which are security holes — and one client-side
assumption that blocks custom roles from ever being visible in the UI.

## 1. What already exists

| Proposed | Where it lives today |
| -------- | -------------------- |
| Four role types | `DefaultRole` in `packages/shared/src/enums/role.enum.ts` — `SUPER_ADMIN`, `TEACHER`, `STUDENT`, `ASSISTANT` |
| Default permissions per role | `DEFAULT_PERMISSIONS` in `packages/shared/src/utils/constants.ts:33`, over ~30 `PermissionItem` values |
| Scalable to custom roles | `Role` is an org-scoped collection with a `permissions[]` array, plus a CRUD module in `apps/server/src/modules/role` |
| First API call returns initial data | `GET user/initial-login-data` — `UserController.getInitialLoginData` |
| That call registers on first use | `apps/server/src/guards/auth.guard.ts:114-117` |
| Dummy context, then register | `setRequestContext(getRegisterPayload(...))` at `auth.guard.ts:116` |
| One uid across many orgs | `UserSchema.index({ uid: 1, org: 1 }, { unique: true })` — one user row per membership |
| Response carries all users and orgs | `UserService.getInitialLoginData` |
| Invited vs. self sign-up | `AccountType.SELF` / `INVITED`, plus the whole `invite` module |

### The dummy-context question, answered

The proposal asks whether an absent user means an empty context, and whether
filling it with placeholder values before registering gives one consistent flow.
That is exactly what the guard does today, and it is load-bearing rather than
cosmetic: `BaseSchema` declares both `org` and `createdBy` as
`required: true, immutable: true`, and the two global Mongoose plugins stamp
every insert from the context. Without a populated context, the `Org`, `Role`
and `User` inserts that registration performs cannot be written at all.

One caveat on that path: `getRegisterPayload` has no role to offer, so
`setRequestContext` writes `role: ''`. `RequestContextService.getRole()` calls
`new Types.ObjectId('')`, which throws. Anything reached during registration
must therefore use `getRoleSafe()`.

**Conclusion: keep this flow. It does not need redesigning.**

## 2. Defects to fix first

### 2.1 The subdomain gate is dead, and 69 routes are refused

`getSubdomainFromUrl` (`apps/server/src/utils/util.ts:21`) extracts
`learn` | `teach` | `support` from the request *path* — its own docblock gives
`/user/teach/profile` as the example. Nothing on the client produces such a path:

- every client service writes a bare resource path (`'user/all'`,
  `'course/upsert'`, `'user/initial-login-data'`);
- `NEXT_PUBLIC_BASE_URL` is `http://localhost:9000` in all three apps, and the
  commented production values (`https://test.parthhub.com`, `https://ac.parthhub.com`)
  carry no path either;
- `main.ts` calls no `setGlobalPrefix`.

So the resolved subdomain is always `undefined`. `AccessGuard` then refuses every
route that declares one:

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

There are **69 `@Subdomains(...)` declarations** in the server, including
`user/all`, `user/update`, `user/revoke`, `user/update-role`, `org/update` and
every write in the invite module. All of them 403 today.

**Fix:** send the subdomain as a request header next to `organization`, which is
already how the client passes per-request context, and read it in `AuthGuard`
alongside `timezone`. Deriving it from the URL would mean changing every client
service path. Whichever way it goes, `getSubdomainFromUrl` and its docblock
should stop claiming a path segment that nothing produces.

### 2.2 Every self sign-up is granted full admin, including from the learning app

Same root cause, worse consequence:

```ts
// apps/server/src/modules/user/user.service.ts:111
const ownerRole = subdomain === Subdomain.LEARN ? DefaultRole.STUDENT : DefaultRole.SUPER_ADMIN;
```

With `subdomain` permanently `undefined`, the ternary always takes the
`SUPER_ADMIN` branch. A learner who signs up on the learning app receives
`DEFAULT_PERMISSIONS[SUPER_ADMIN]`, which is `ALL_PERMISSIONS`, in their own org.

Fixing 2.1 fixes this too, but the default should also fail closed: derive the
owner role from an explicit, validated app identifier and reject the request when
it is missing, rather than falling through to the most privileged role.

While here: the support app also reaches this path, so signing up there creates a
personal org with `SUPER_ADMIN`. Decide whether the support app permits self
sign-up at all — it most likely should not.

### 2.3 Revoked users keep full access

`revokeAccess` sets `isInactive: true` (`user.service.ts:250`) and
`restoreAccess` clears it. Nothing reads the field. A grep across `apps` and
`packages` finds it only in the schema, the DTO, those two writes, and a sort key
in `getOrgStaff`.

`AuthGuard.validateAndGetUser` loads the user and never checks it, so a revoked
member continues to authenticate and to carry every permission their role
grants. The guard should reject an inactive membership with the same
`UnauthorizedException` it uses for a missing one.

### 2.4 `removedPermissions` is a dead field on two schemas

Declared on both `User` (`user.schema.ts:70`) and `Org` (`org.schema.ts:24`),
and read nowhere. Authorization consults only the role:

```ts
// apps/server/src/modules/permissions/permission.service.ts
const role = await this.roleModel.findById(roleId).lean<RoleDocument>().exec();
if (!role) return false;
return permissions.some((p) => role.permissions.includes(p));
```

Two fields that look like working per-user and per-org overrides, and silently
are not. Either compute effective permissions —
`role.permissions − user.removedPermissions − org.removedPermissions` — or delete
both fields. Leaving them is the dangerous option: a future reader will assume
revoking a single permission from one member works.

If they are implemented, note that `PermissionService` currently reads the `Role`
document on **every authorized request** with no caching. Adding two more lookups
to that path is worth measuring; the effective set is a good candidate for
caching on the request context, which is already per-request state.

### 2.5 Registration is not idempotent, and is not atomic

`getRegisterPayload` mints a fresh `_id` and a fresh `org` on every call:

```ts
// apps/server/src/utils/util.ts:10
export const getRegisterPayload = (firebaseUser: FirebaseUserDto): RegisterUserDto => {
  return { ...firebaseUser, _id: getObjectId(), org: getObjectId() };
};
```

Two concurrent first requests — a React double-mount in development, or
`initial-login-data` racing another call — both miss the user lookup and both
register. The result is two users, two orgs and eight roles for one Firebase
account. The unique `{ uid, org }` index cannot catch it, because each attempt
invents a different `org`.

There is also no transaction. `registerUser` writes roles, then the org, then the
user; the ordering comment claims a failure never leaves a user pointing at a
half-created org, which is true, but the inverse is not handled — a failure at
the user insert leaves an orphan org and four orphan roles with no owner.

Both point the same way: **move registration out of the guard.** A guard runs for
every route and this one performs a multi-collection write. `initial-login-data`
is already the only route allowed to trigger it, so the handler is the honest
home for it, where it can be keyed on `uid` (so a concurrent second attempt joins
rather than duplicates) and wrapped in a Mongoose session.

### 2.6 A pending invite silently overrides self sign-up

`registerUser` looks up *any* pending invite for the email and joins that org
instead of creating one, with no reference to which app the user signed up from.

So a teacher who was once invited as a `STUDENT` to another org, and later signs
up on the teaching app to create their own, becomes a student of that other org
and gets no org of their own. There is no path back: `org/update` needs
`EDIT_ORG`, which `STUDENT` does not have, and nothing exposes "create an
organization" as an operation.

Condition the invite path on the app the sign-up came from, or surface the
pending invite as a choice ("join Acme, or create your own organization") rather
than resolving it silently.

### 2.7 One person, two Firebase identities

Users are keyed by `uid`. Email/password and Google produce **different UIDs for
the same email address** unless Firebase's one-account-per-email setting is on,
or the providers are explicitly linked. Without that, someone who signs up with
Google and later signs in with email/password becomes a second user with a second
personal org, and neither can see the other's data.

Turn on one-account-per-email in the Firebase console, and treat `email` as the
identity for invite matching (which it already is) while keeping `uid` as the
authentication key.

## 3. What actually blocks "multiple roles later"

The `Role` collection scales fine — it is already per-org with a free-form name
and an explicit permission array. Three other things do not.

### 3.1 A membership holds exactly one role

`User.role` is a single `ObjectId` (`user.schema.ts`), and
`IRequestContext.role` a single string. Multiple roles per membership needs:

- `User.roles: ObjectId[]`, with a migration from the scalar;
- `IRequestContext.roles: string[]` and a `getRoles()` on the context service;
- `PermissionService.hasAnyPermission` unioning permissions across the set.

Mechanical, and cheap while there is one role in the array.

### 3.2 The client cannot see a custom role at all

This is the expensive one. `getPermissionForRole` collapses any role onto one of
the four `DefaultRole` values:

```ts
// apps/server/src/modules/user/user.service.ts:59-68
getPermissionForRole(role: RoleDocument | undefined): DefaultRole {
  if (role?.isAdmin) return DefaultRole.SUPER_ADMIN;
  if (role && (Object.values(DefaultRole) as string[]).includes(role.role)) return role.role as DefaultRole;
  if (role?.permissions?.includes(PermissionItem.STUDENT)) return DefaultRole.STUDENT;
  if (role?.permissions?.includes(PermissionItem.CREATE_COURSE)) return DefaultRole.TEACHER;
  return DefaultRole.ASSISTANT;
}
```

`UserDto.permission` is typed as that enum, and the apps branch on it
everywhere — `isStudentUser` in `user.store.ts`, `getStudents`,
`getCollaborators`, `inviteCollaborator`, menu gating. **A custom role named
"Head of Physics" arrives at the client as `assistant`** and is indistinguishable
from a real assistant.

The fix is to send the effective `PermissionItem[]` with each user and have the
UI branch on permissions rather than on a collapsed role name, keeping the role's
own name for display only. **Do this before adding custom roles, not after** — it
touches every screen that gates on `permission`, and each one changed after
custom roles ship is a screen that was wrong in production first.

### 3.3 Seeded default roles are not marked as such

`Role` protects only `isAdmin`: `RoleService.upsert` and `deleteRole` refuse to
touch the admin role, and everything else is editable. Nothing stops a user
renaming or deleting the seeded Teacher role, which breaks `findByName` lookups
and the `getPermissionForRole` name match above.

Add an `isSystem` (or `isDefault`) flag set during registration, and refuse
renames and deletes on it while still allowing its permissions to be tuned.

Related: `role` is lowercased free text with a unique `{ role, org }` index, so a
custom role named "teacher" collides with the seeded one. That is arguably
correct, but the error surfaced to the user should say so.

## 4. Smaller decisions

- **Every learner sign-up creates an org and four role documents.** For someone
  who only ever joins a teacher's org, that is five throwaway documents and a
  spurious entry in the org switcher. Making it optional is not free, though:
  `BaseSchema.org` is `required: true`, so "a user with no org" is a schema
  change, not a flag.
- **`getInitialLoginData` returns every org for the uid, regardless of app.** The
  proposal's step (d) suggests filtering by role at lookup time; the current
  behaviour of not filtering is right, because the same uid can be a student in
  one org and a teacher in another. But the *response* should then be filtered by
  app, so the teaching app is not handed orgs where the user is only a student.
- **`SUPER_ADMIN` is misnamed.** The role is org-scoped, and "super admin"
  usually reads as platform-level. `ADMIN` or `OWNER` matches the intent. It is a
  stored string in `Role.role`, so a rename needs a data migration alongside the
  enum change.
- **Nothing seeds demo data.** The proposal's "add some demo data" step has no
  implementation anywhere.
- **The client's `permission` header is ignored by the server.** `AuthGuard`
  reads `Authorization`, `organization`, `timezone`, `timezone-offset` and
  `api-key`, never `permission`. That is the correct behaviour — a
  client-declared role would be privilege escalation — but `http.service.ts` sets
  it from `localStorage` and `CLAUDE.md` documents it as meaningful. Drop the
  header, and correct the doc.
- **Org switching is validated.** Worth recording as a non-issue: passing another
  org's id in the `organization` header fails, because
  `getUserByOrgIdAndUid` requires a membership row in that org.

## 5. Suggested order of work

1. Header-based subdomain, and fail closed on a missing one (§2.1, §2.2).
2. Reject inactive memberships in `AuthGuard` (§2.3).
3. Decide `removedPermissions`: implement effective permissions, or delete the
   fields (§2.4).
4. Move registration into the `initial-login-data` handler, keyed on `uid` and
   wrapped in a session (§2.5).
5. Turn on Firebase one-account-per-email (§2.7).
6. Resolve the invite-versus-own-org conflict (§2.6).
7. Send effective permissions to the clients and stop branching on
   `DefaultRole` (§3.2) — the prerequisite for everything below.
8. `User.roles[]`, `isSystem` on `Role`, then custom-role management UI
   (§3.1, §3.3).
