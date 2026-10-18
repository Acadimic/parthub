# Bot protection at the edge

Status: plan only, nothing configured. Written 2026-10-18 alongside the two in-code measures.

## What is already in the code

| Layer               | Where                                                    | What it stops                                                       |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| Content is private  | course service `canOpen`, `getPublicCourseOutline`       | Anonymous callers get the outline only; paid courses need a seat    |
| AI crawlers refused | `apps/learning/src/utils/helpers/site-files.ts` (robots) | GPTBot, ClaudeBot, CCBot, Google-Extended, PerplexityBot and others |
| Per-account limits  | `apps/server/src/guards/rate-limit.guard.ts`             | One account bulk-downloading lessons and quizzes                    |

What they cannot stop: crawlers that ignore robots.txt, and a scraper that spreads across many free
accounts (sign-up accepts any email). The rate limit counts per Cloud Run instance, so up to five
times the limit is possible. Those gaps are what the edge is for.

## Where things run

- **Apps** (learning, teaching, support): Vercel, one project each (`.claude/plans/DEPLOYMENT.md`).
  The browser calls `/api` on the app's own origin, and Next rewrites it to `API_SERVER_URL`, so
  **every API call from a browser passes through Vercel first**.
- **API**: Cloud Run, 1–5 instances, `--allow-unauthenticated`, reachable directly at its
  `run.app` address as well.

## Options, cheapest first

1. **Vercel Firewall → "AI Bots" managed rule (block).** Minutes in the dashboard, no code. Blocks
   known AI crawlers by verified signature at the edge, including ones that ignore robots.txt.
   Applies to the learning app's pages and to `/api` calls made through it.
2. **Vercel Firewall custom rules.** A rate limit on `/api/course/course/module/contents/*`,
   `/api/course/course/modules/contents/*` and `/api/*sections*` per IP, as a second net in front of
   the per-account guard; and "Challenge" on traffic from hosting ASNs (datacenter IPs) to `/api`.
3. **Vercel BotID on sign-up and sign-in.** An invisible check that the caller is a browser, verified
   in the app before the Firebase call. Targets the many-free-accounts gap without asking real
   learners to do anything. Small code change in `apps/learning` (sign-up form + one API check).
4. **Close the direct Cloud Run door.** Today a script can skip Vercel and call the `run.app` address.
   Either require a shared header that only the Vercel rewrite adds (checked in `AuthGuard`), or
   use Cloud Run ingress "internal and Cloud Load Balancing" behind a load balancer.
5. **Cloud Armor in front of Cloud Run** (external HTTPS load balancer). Per-IP rate limiting, bot
   management with reCAPTCHA Enterprise, adaptive protection. Most capable, but a load balancer and
   Armor policy cost roughly USD 20–30 a month before traffic, plus setup. Only worth it if 1–4 are
   not enough.

## Recommendation

Do 1 now (no code). Do 3 and 4 together as the next code change, since a scraper with many accounts
is the remaining realistic threat and the direct Cloud Run address would bypass everything at the
edge. Keep 5 in reserve.

## Decisions still open

- Whether blocking AI _assistant_ fetches (ChatGPT-User, Perplexity-User) is wanted: it keeps course
  pages out of AI-search answers, which is also a source of visitors. robots.txt blocks them today.
- Whether free courses should require a verified email, which was considered and not taken for now.
