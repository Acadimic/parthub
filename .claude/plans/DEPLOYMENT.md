# Deployment: server on GCP Cloud Run from GitHub Actions, apps on Vercel from its Git integration

Written 2026-09-28; the apps moved to Vercel's Git integration on 2026-09-29. The server deploys
from GitHub Actions as a container to Cloud Run, and its secrets live in the `production` GitHub
environment. The three Next.js apps are three Vercel projects connected to the same repo, each
with its own Root Directory: Vercel builds them itself, a push to `main` is a production
deployment, every other branch and PR gets a preview, and the apps' `NEXT_PUBLIC_*` values live
in each project's Vercel env. A staging environment is in the "Later" section.

## 1. What exists today

| Piece                   | State                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Server runtime          | Fastify listens on `process.env.PORT ?? 9000` at `0.0.0.0`; `GET /health` returns 503 until Mongo is up.                                                                                   |
| Server build            | `nest build` → `apps/server/dist`; path aliases are rewritten (no `@modules/*` requires in `dist`).                                                                                        |
| Server env              | Only `NODE_ENV` and `DB_URL` are enforced (`secrets.validator.ts`); `APP_ENV=local` turns on pino-pretty.                                                                                  |
| Shared package          | Every consumer resolves `@repo/shared` through `dist/`, so **`pnpm build:shared` runs first** in every build, Docker and Vercel alike.                                                     |
| Apps                    | Next 16 Pages Router, `transpilePackages: ['@repo/shared','@repo/ui']`; env is `NEXT_PUBLIC_*` only.                                                                                       |
| Data                    | Atlas: `acadimicdev.…` (dev) and `acadimic.…` (prod) clusters. S3 on AWS. Firebase Auth. Razorpay. SendGrid.                                                                               |
| Tooling on this machine | `gcloud` installed, auth expired, project set to `stamurai-android-app`; `vercel` 51.2.1 (60.x current), logged in as `manish97521`, teams: personal + `stamurai`; Docker Desktop present. |
| Repo                    | `github.com/Acadimic/parthub`, private, single branch `main`. No GitHub secrets or environments yet.                                                                                       |

Unused env keys to drop from the templates: `SERVER_BASE_URL`, `FIREBASE_API_KEY` (in the `Secrets`
enum, read nowhere), `SENDGRID_API_KEY_ID`, `APP_WEB_URL` (in `.env.development`, not in the enum),
`NEXT_PUBLIC_NODE_ENV` (in the app `.env`s, read nowhere). `APP_ENV` is read but missing from
`.env.example`.

## 2. Target shape

```
GitHub (Acadimic/parthub, main)
 ├─ ci.yml            PR: install, build:shared, lint, typecheck:ui, build:server, build each app
 └─ deploy-server.yml image → Artifact Registry → Cloud Run  parthhub-api  (api.<domain>)
Vercel Git integration, 3 projects on the same repo
 └─ apps/learning | apps/teaching | apps/support → learn / teach / support.<domain>
Cloud Run ─► Atlas (prod cluster), S3 (AWS), Firebase Admin, SendGrid, Razorpay
```

Trigger rule: a push to `main` deploys production. For the server that is a push touching its
paths, plus `workflow_dispatch` on demand; put a required reviewer on the `production` GitHub
environment if it should wait for an approval. For the apps, Vercel skips a project when nothing
under its root directory or its workspace dependencies changed, and redeploys on demand from the
dashboard. Without a reviewer, merging to `main` is the release.

## 3. Files in the repo (done)

| File                                  | Role                                                                                                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Dockerfile`, `.dockerignore`         | Multi-stage: pnpm 10.12.1 via corepack, `pnpm install --filter @repo/server...`, build shared then server, prod-only deps in the runtime stage, `node` user, port 8080. |
| `.github/workflows/deploy-server.yml` | Build and push the image (registry cache), write the runtime env as YAML, `gcloud run deploy --env-vars-file`, curl `/health`.                                          |
| `.github/workflows/ci.yml`            | The verify-changes ladder on every PR.                                                                                                                                  |
| `apps/*/vercel.json`                  | `buildCommand: pnpm --filter @repo/shared build && next build`, so Vercel compiles shared before the app.                                                               |

Design notes:

- Each Vercel project's Root Directory is its app (`apps/learning`, …) with "Include files
  outside the root directory" on, so the build sees `packages/*`. Vercel detects the pnpm
  workspace from `pnpm-lock.yaml` and installs from the root; no install command is set.
- `NEXT_PUBLIC_*` values are inlined at build time, so they live in each project's Vercel env and
  a change needs a redeploy before it takes effect.
- Preview deployments get a new host each time, which Firebase Auth does not trust, so sign-in
  fails on a preview until previews have a fixed domain (see "Later").
- The runtime env for Cloud Run is written as a YAML file because `--set-env-vars` splits on
  commas; `--env-vars-file` does not.
- Cloud Run's default startup probe is a TCP check on the port. Nest only starts listening after
  every module has initialised, and `MongooseModule` waits for the connection, so "port open"
  already means "database connected". No HTTP probe is configured.
- The image is tagged with the commit SHA and `latest`. A rollback is
  `gcloud run services update-traffic parthhub-api --to-revisions <previous>=100`, or a dispatch
  of the workflow from an older commit.
- Verified locally on 2026-09-28: the image builds (603 MB) and, run with the dev `.env` and
  `NODE_ENV=production`, answers `/health` in about six seconds.

## 4. One-time setup

### 4.1 GCP (gcloud, run once)

Use a fresh project so nothing shares IAM with `stamurai-android-app`. Region `asia-south1`
(Mumbai) unless the Atlas prod cluster is elsewhere, in which case match it.

```bash
gcloud auth login
gcloud projects create acadimic-parthhub --name="Parthhub"     # then link a billing account
gcloud config set project acadimic-parthhub
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create parthhub --repository-format=docker --location=asia-south1

# Runtime identity for the service: no roles, it needs nothing from GCP.
gcloud iam service-accounts create parthhub-api-runtime

# Deploy identity for GitHub Actions.
gcloud iam service-accounts create github-deployer
P=acadimic-parthhub; SA=github-deployer@$P.iam.gserviceaccount.com
gcloud projects add-iam-policy-binding $P --member=serviceAccount:$SA --role=roles/run.admin
gcloud projects add-iam-policy-binding $P --member=serviceAccount:$SA --role=roles/artifactregistry.writer
gcloud iam service-accounts add-iam-policy-binding parthhub-api-runtime@$P.iam.gserviceaccount.com \
  --member=serviceAccount:$SA --role=roles/iam.serviceAccountUser
gcloud iam service-accounts keys create /tmp/github-deployer.json --iam-account=$SA
gh secret set GCP_SA_KEY < /tmp/github-deployer.json && rm /tmp/github-deployer.json
```

Atlas: Cloud Run has no fixed egress IP, so allow `0.0.0.0/0` on the prod cluster for now with a
dedicated DB user for the service. A static egress IP (VPC connector + Cloud NAT) is in "Later".

### 4.2 Vercel (run once, in the dashboard)

The repo is private and owned by the `Acadimic` organization, which Vercel's Hobby plan does not
deploy from, so the projects live in a Pro team.

1. Add New → Project → Import Git Repository. If `Acadimic/parthub` is not listed, Adjust GitHub
   App Permissions: install the Vercel app on the `Acadimic` organization with that repo.
2. Import the repo three times, once per project:

   | Project             | Root Directory  |
   | ------------------- | --------------- |
   | `parthhub-learning` | `apps/learning` |
   | `parthhub-teaching` | `apps/teaching` |
   | `parthhub-support`  | `apps/support`  |

   Framework preset Next.js; leave the build and install commands at their defaults (`vercel.json`
   supplies the build command).

3. Per project: Settings → General → Node.js Version 24.x; Build and Deployment → keep "Include
   files outside the root directory" on; Git → turn on "Skip deployments when there are no changes
   to the root directory or its dependencies".
4. Per project, Settings → Environment Variables, for Production (and Preview if wanted):

   | Name                                                               | Value                                                                     | Projects |
   | ------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------- |
   | `NEXT_PUBLIC_BASE_URL`                                             | Cloud Run URL after the first server deploy, later `https://api.<domain>` | all      |
   | `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase web config                                                       | all      |
   | `NEXT_PUBLIC_LEARN_URL`                                            | `https://learn.<domain>` (teaching's order links open here)               | teaching |
   | `NEXT_PUBLIC_PRIVATE_API_KEY`                                      | the same value as the server's `PRIVATE_API_KEY`                          | support  |

5. For `parthhub-support` turn on Deployment Protection (Vercel Authentication), because its
   `NEXT_PUBLIC_PRIVATE_API_KEY` is inlined into the bundle and the page itself must not be public.

### 4.3 GitHub: the `production` environment

Create the environment (Settings → Environments → `production`), optionally with a required
reviewer. `deploy-server.yml` reads everything from it; the apps' values are in Vercel (4.2).

| Kind     | Name                                                                                                                                                        | Value                                                                        | Read by |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------- |
| secret   | `GCP_SA_KEY`                                                                                                                                                | the key JSON from 4.1                                                        | server  |
| variable | `GCP_PROJECT_ID`, `GCP_REGION`                                                                                                                              | `acadimic-parthhub`, `asia-south1`                                           | server  |
| variable | `CLOUD_RUN_SERVICE`                                                                                                                                         | `parthhub-api`                                                               | server  |
| variable | `PRIVATE_API_EMAIL`, `AWS_REGION`, `S3_BUCKET_NAME`, `S3_PUBLIC_BUCKET_NAME`, `S3_PREFIX`                                                                   | from the `#PRODUCTION` block of `apps/server/.env.development`               | server  |
| secret   | `DB_URL`                                                                                                                                                    | the `acadimic` cluster, with the service's own DB user                       | server  |
| secret   | `FIREBASE_AUTH_BASE_64`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `SENDGRID_API_KEY`, `RAZORPAY_API_KEY`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_SIGNATURE_SECRET` | live keys                                                                    | server  |
| secret   | `PRIVATE_API_KEY`                                                                                                                                           | one value; the support project's `NEXT_PUBLIC_PRIVATE_API_KEY` must match it | server  |

From the terminal: `gh secret set NAME --env production < file` and
`gh variable set NAME --env production --body value`.

## 5. Code changes before the first deploy

1. Done: `sync-indexes` is `@Private()`. Calling it needs `api-key`, `app`, `timezone` and
   `timezone-offset` headers; the curl is in its docblock.
2. Done: outside `APP_ENV=local` pino emits `severity`, `message` and an ISO `time`, which is what
   Cloud Logging parses.
3. Env hygiene: add `APP_ENV=local` to `.env.example`; delete the unused keys listed in section 1;
   remove the plaintext account password sitting in a comment at the bottom of `apps/support/.env`
   (gitignored, but it should not be on disk either).
4. CORS stays `origin: '*'` for now (no cookies are used); tighten to the three app origins once
   the domains exist.
5. Razorpay dashboard: point the webhook at the Cloud Run URL, with the `RAZORPAY_WEBHOOK_SECRET`
   the environment holds.

## 6. Order of work

1. Commit the files from section 3.
2. GCP setup (4.1); Atlas network access and the DB user.
3. The `production` environment (4.3).
4. Dispatch `Deploy server`. It prints the service URL and checks `/health`.
5. Vercel setup (4.2), with `NEXT_PUBLIC_BASE_URL` set to that URL; importing each project runs
   its first deployment. Add the three `*.vercel.app` production hosts to Firebase Auth →
   Authorized domains. Sign in on each app, upload a file.
6. Domains: Cloud Run domain mapping for `api.<domain>`; add `learn/teach/support.<domain>` to the
   Vercel projects (Settings → Domains, CNAME to `cname.vercel-dns.com`); update
   `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_LEARN_URL`; add the domains to Firebase; point the
   Razorpay webhook at `api.<domain>`. Redeploy the apps so the new values are inlined.
7. Smoke test: sign in on all three, upload a file, run through an order.

From then on a merge to `main` is the release.

## 7. Later

- **Staging environment**: add an `environment` input (`staging` | `production`) to
  `deploy-server.yml` and a second Cloud Run service pointed at the `acadimicdev` cluster; on
  Vercel, give a `staging` branch a fixed domain per project (Settings → Domains → assign to a Git
  branch) with Preview env values pointing at that service, and add those hosts to Firebase.
- **Secret Manager** instead of `--env-vars-file`: `gcloud secrets create …`, grant the runtime SA
  `secretAccessor`, switch the deploy step to `--set-secrets`. GitHub then holds only `GCP_SA_KEY`.
- **Workload Identity Federation** instead of the SA key: `google-github-actions/auth` with
  `workload_identity_provider`, and delete the key.
- **Static egress IP** for Atlas: Serverless VPC Access connector + Cloud NAT, then close
  `0.0.0.0/0` on Atlas.
- Restrict CORS; add Cloud Run alerting on 5xx and an uptime check on `/health`.
