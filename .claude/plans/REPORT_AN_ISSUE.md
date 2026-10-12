# Report an issue — questions, course content, payments, general, contact us

Plan, 2026-10-10. Decisions taken (§7). Phases 1–5 built 2026-10-10, uncommitted; §9 records where the build differs from the plan below.

One ticket system with five entry points in the learning app. Each ticket goes to whoever can act
on it: the teacher's org for content, the platform for money and everything else.

| Category   | Where the learner starts                                          | Who handles it                |
| ---------- | ----------------------------------------------------------------- | ----------------------------- |
| `question` | Report button in the test-paper question toolbar (attempt + review) | Course's org (teaching app)   |
| `content`  | Report button in the lesson toolbar                               | Course's org (teaching app)   |
| `payment`  | "Report a problem" on an order, and on a new My orders list        | Platform (support app)        |
| `general`  | Help centre and account settings ("Something isn't working")      | Platform (support app)        |
| `contact`  | The contact page form                                             | Platform (support app)        |

Platform staff see every ticket, including content ones, so a teacher who never answers can be
chased.

---

## 1. What exists today

- **Contact / help:** `modules/company/Contact.tsx` and `HelpCenter.tsx` are static and use mailto
  links only. Nothing is submitted.
- **Orders:** `order.schema.ts` has `status: open | paid | cancelled | expired`, `razorpayPaymentId`,
  `purchasedBy`, and `org` (the selling org). **There is no refund code and no `refunded` status.**
  `razorpay.service.ts` only creates plans and orders. The terms promise a 7-day refund through
  support. `OrderService.getMyOrders` (`order/my`) exists, but no screen calls it, so a learner
  can't list their orders.
- **Report anchors:**
  - `test-papers/Exam.tsx:157` already has a Bookmark beside the question, with
    `selectedQuestion._id` and `testPaperStore.exam._id` in hand.
  - `CourseModuleContent.tsx:283-297` has the `FrameToolbar` actions (Like, Bookmark, Share, Print),
    with course, module and material/test-paper ids in hand.
- **Template:** `course-comment` is the closest existing shape: a learner thread pinned to
  course/module/material/testPaper, staff replies, `isAnswered`, a needs-reply inbox with a count
  badge, and attachments. The teaching inbox (`modules/discussions/`) is the UI pattern to copy.
- **Email:** `SendGridService` (text/html/dynamic) is registered, but nothing calls it yet.
- **Support app security:** `@Private()` uses an API key that ships in the support bundle, so it is
  **not a security boundary**. Tickets hold learners' names, emails and payment ids. A support inbox
  must therefore use a real check (§4), not `@Private()`.
- **Nothing** like report, ticket or feedback exists yet. The names are free.

---

## 2. Data shape

New server module **`ticket`**. Shared enums go in `packages/shared/src/enums/ticket.enum.ts`:

```ts
enum TicketCategory { QUESTION = 'question', CONTENT = 'content', PAYMENT = 'payment', GENERAL = 'general', CONTACT = 'contact' }
enum TicketStatus   { OPEN = 'open', IN_PROGRESS = 'inProgress', RESOLVED = 'resolved', DISMISSED = 'dismissed' }
enum TicketReason   { // grouped per category by TICKET_REASONS in utils/ticket.util.ts
  // question
  WRONG_ANSWER_KEY, WRONG_SOLUTION, UNCLEAR_QUESTION, TYPO, BROKEN_FIGURE,
  // content
  FACTUAL_ERROR, BROKEN_MEDIA, OUTDATED, INAPPROPRIATE,
  // payment
  PAID_NO_ACCESS, CHARGED_TWICE, REFUND_REQUEST, COUPON_PROBLEM, INVOICE,
  // general / contact
  BUG, ACCOUNT, FEATURE_REQUEST, PARTNERSHIP, OTHER,
}
```

Schema `ticket.schema.ts` (extends `BaseSchema`). `org`/`createdBy` are the reporter's, as in
course-comment:

| Field                                        | Notes                                                                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `code`                                       | Short human id (`T-7K2Q9`) to quote in emails and support chats                                                       |
| `category`, `reason`, `status`               | Enums above                                                                                                           |
| `body`                                       | Plain text, ≤ 2000 chars                                                                                              |
| `attachments`                                | `[AttachmentSchema]`, ≤ 3 screenshots, same S3 flow and `isOwnObjectUrl` check as comments                            |
| `course`, `courseModule`, `material`, `testPaper`, `question`, `order` | Target ids, `null` when the category doesn't use them. The server checks them, never trusting the client |
| `handlerOrg`                                 | `course.org` for question/content. `null` = the platform (payment, general, contact). Set by the server               |
| `messages`                                   | Embedded `[{ body, author, isStaff, createdAt }]`, the reply thread. Tickets are short, so no second collection       |
| `context`                                    | Captured at create: app, page URL, user agent, and the paper/lesson name. Survives the target being edited or deleted |
| `resolvedAt`, `resolvedBy`                   | Set when status becomes resolved or dismissed                                                                         |

The shared interface is a **discriminated union on `category`** (`IQuestionTicket` has
`testPaper` + `question`, `IPaymentTicket` has `order`, …). That keeps the client typed without
optional fields (`type-strictly`). The Mongoose schema stays flat with nulls.

Indexes, each partial on `_deleted: false` (see `index-with-mongodb`):

- `{ handlerOrg, status, updatedAt: -1 }`: teacher inbox and count
- `{ category, status, updatedAt: -1 }`: support inbox
- `{ createdBy, createdAt: -1 }`: My reports
- `{ code }` unique

**Duplicates and abuse:** a learner can have only one *open* ticket per (question | material | order).
Reporting the same thing again adds a message to the existing ticket. There is also a cap of 10 new
tickets per user per day, the same shape as the AI tutor quota.

---

## 3. Server routes (`ticket.controller.ts`)

**Learner (`@Subdomains(LEARN)`, new `MANAGE_TICKET` permission added to STUDENT in
`packages/shared/src/utils/constants.ts`):**

- `POST ticket/create`: validates the target per category.
  - question/content: the learner must have access to the course (`enrollmentService.hasAccess` or
    a published free course). The question must belong to the paper, and the paper to the course.
  - payment: `order.purchasedBy === userId`.
  - The server derives `handlerOrg` and `context.names`.
- `GET ticket/my`: slim list.
- `GET ticket/my/:id`: the thread.
- `POST ticket/my/:id/reply`: reopens the ticket if it was resolved less than 14 days ago.

**Teacher (`@Subdomains(TEACH)`, `VIEW_TICKET` / `MANAGE_TICKET`; ADMIN/TEACHER/ASSISTANT already get
`ALL_PERMISSIONS`):**

- `GET ticket/inbox?status=`: `handlerOrg = caller's org`, with names resolved like the discussion
  inbox.
- `GET ticket/inbox/count`: open count, for the sidebar badge.
- `POST ticket/:id/reply` and `POST ticket/:id/status`: only when `handlerOrg === org`.

**Platform staff (`@Subdomains(SUPPORT)`, behind `PlatformStaffGuard`):**

- `GET ticket/support/inbox?category=&status=`, `GET ticket/support/:id`, plus reply and status.
- `POST ticket/support/:id/refund { razorpayRefundId, amount }`: records the refund (§5).

---

## 4. Platform staff: a real gate for the support app

Add a `PlatformStaffGuard` that checks the **Firebase-verified email** against a new
`PLATFORM_STAFF_EMAILS` env list, read through `AppConfigService`. Ticket routes are normal
authenticated routes, **not** `@Private()`. The support app already sends the Bearer token, so the
client needs no change. This is the simplest thing that really is a boundary. A platform-staff role
can replace it later if the list grows.

*Superseded (Manish, 2026-10-10): the support ticket routes are `@Private()` like every other route
the support app calls, see §9. The Firebase session still gates the UI.*

---

## 5. Payments and refunds

1. **My orders** (learning, `/account-settings/orders`): a list built on the existing `order/my`.
   Each row links to `/order/[code]`.
2. **Report a payment problem** on `OrderCheckout.tsx`, for paid and open orders. It opens the
   ticket dialog with the order already filled in. The `REFUND_REQUEST` reason shows the 7-day rule
   and is only offered within 7 days of `paidAt`. After that it falls back to `OTHER` and support
   decides.
3. **Phase 1 refund = manual.** Staff refund in the Razorpay dashboard, then record it on the ticket.
   The server then:
   - sets the new `OrderStatus.REFUNDED`, plus `refundedAt` and `razorpayRefundId` on the order;
   - revokes the enrollment the order granted;
   - resolves the ticket.

   This keeps money moves out of code until volume justifies it.
4. **Phase 2 (optional):** a `RazorpayService.refund(paymentId, amount)` call from that same route,
   with a `refund.processed` webhook to confirm it.

Terms §refunds say content refunds are "decided with the publisher". The teacher's org sees payment
tickets for its own orders **read-only** in the teaching inbox, so they can respond, but the platform
owns the decision.

---

## 6. UI

**Learning (`@repo/ui/core` + `build-a-form` shape):**

- `components/app/report/ReportButton.tsx` + `ReportDialog.tsx`: one dialog, configured by
  category. It has a reason select (filtered by `TICKET_REASONS[category]`), a body, optional
  screenshots and a submit. It shows a toast with the ticket code when done.
  - In `Exam.tsx` beside the Bookmark. It works during an attempt too, but the attempt timer keeps
    running, so the dialog stays small.
  - In the `CourseModuleContent` toolbar, next to Share/Print.
- **Contact page:** a form above the existing channel cards (topic → category general/contact).
  Signed-out visitors keep the mailto cards, see §7.
- **Help centre:** "Still stuck? Report a problem" replaces the bare email line.
- **My reports** (`/account-settings/reports`): a list, a thread, a reply box, and status badges.
  Unread staff replies show as a dot on the account menu.

**Teaching:** a `Reports` page next to Discussions (`modules/reports/`), copied from the discussions
inbox layout. It has an open/all filter and a count badge in the sidebar. A question ticket links
straight to the question in the test-paper editor, and a content ticket to the material editor.
Later: an "N open reports" chip on a question in the editor.

**Support:** a `Tickets` page that uses the teaching `DataTable` (filters for category, status and
org), plus a detail drawer with the thread, status, and "Record refund" for payment tickets.

---

## 7. Decisions (Manish, 2026-10-10)

1. **Contact form is for signed-in users only.** Signed-out visitors keep today's mailto cards.
   Every write needs an org, and a public form would need captcha plus a special "no org" path.
2. **The platform decides refunds.** Payment tickets go to the support app, and the selling org sees
   its own orders' tickets read-only (§5).
3. **Two-way thread.** Staff and the learner can message back and forth on a ticket.
4. **Email comes later (phase 5).** The platform gets an email on payment tickets, and the reporter
   gets one on staff reply or resolve. Both use `sendHtmlEmail`.

---

## 8. Phases

1. **Shared + server:** enums, DTOs, union interface, `ticket` module, indexes (applied via
   `sync-indexes`), `PlatformStaffGuard`, `OrderStatus.REFUNDED`.
2. **Learning:** ReportButton/Dialog in Exam and lesson, contact form, My reports, My orders +
   order report.
3. **Teaching:** Reports inbox + sidebar badge + deep links to the editors.
4. **Support:** Tickets table + drawer + record refund (revokes enrollment).
5. **Email notifications** (SendGrid).
6. **Optional:** Razorpay refund API + webhook; report-count chip in the question editor.

Each phase is verified with `verify-changes`. Phases 2–4 are also checked end to end in the browser
with the dev learner account and the dev teacher.

---

## 9. As built (2026-10-10)

Where the code differs from the plan above:

- **Two payment paths, not one.** A course bought on its page is an `Enrollment` with its own
  Razorpay payment; a shareable order is an `Order` that grants one seat per course. A payment ticket
  names an `enrollment` or an `order`. Recording a refund marks the enrollment (or the order and
  every seat it granted) `refunded`, which ends access because only active seats count.
  `EnrollmentStatus.REFUNDED`, `OrderStatus.REFUNDED`, and `refundedAt`, `razorpayRefundId`,
  `refundAmount` on both.
- **`ownerOrg`, not `handlerOrg`.** It is set for payment tickets too (the selling org), which is
  how the teacher sees them read-only. The staff check on a write decides who may answer.
- **Flat DTO, no discriminated union.** `TicketDto` has nullable target ids; the server checks them
  per category in `TicketTargetService`. The union added types without catching anything the server
  check does not.
- **Support routes are `@Private()`**, not signed-in routes behind a staff check (Manish,
  2026-10-10): the support app reaches every endpoint machine-to-machine with the shared API key, and
  the ticket routes follow. `AuthGuard` runs them as the `PRIVATE_API_EMAIL` service account, so
  staff replies, status changes and refunds are stamped with that account, and its organization is
  what a reply's attachments are checked against. The same account is where a payment report is
  emailed. The support app sends no organization header for these, as for its other calls.
- **Indexes are not partial** (only `code` is), following `index-with-mongodb`: reads filter
  `_deleted: { $ne: true }`, which a partial index cannot serve. Apply with `GET sync-indexes`.
  Four indexes: owner inbox, platform inbox by category, platform inbox without a category
  (`{ status, _deleted, updatedAt }`), and the reporter's list.
- **The server places the item in the course.** A reported lesson or paper must sit in one of the
  course's modules (`CourseService.findModuleHolding`), and `courseModule` is that module, never
  the id the client sent. A seat an order granted is reported as the order, so a refund acts on
  the whole order. A list row carries no `messages` at all, which is how a client knows the thread
  is still to be fetched. A reply may be files alone; a report body may not be blank.
- **Attachments: up to 5**, because the dialog and replies reuse the discussion `CommentComposer`.
- **Learning:** "My orders" became **Purchases** (`/account-settings/purchases`): paid seats plus
  paid orders. **My Reports** is `/account-settings/reports`; unread replies show as a count on the
  account menu item rather than a dot. The general report is the "Report a problem" button on My
  Reports; the contact page has a "Send us a message" card (signed-in only).
- **Teaching:** Reports sits under Manage with the open count on its tab, not a sidebar badge. Links
  open the test paper or the course; there is no deep link to one question or material yet.
- **Support:** Tickets is a list + thread like the teaching inbox, not a `DataTable` + drawer.
- **Email (phase 5)** is plain text through `sendTextEmail`, from `TicketMailService`, and sends
  nothing when `SENDGRID_API_KEY` or `PRIVATE_API_EMAIL` is unset.
- **Not built:** phase 6 (Razorpay refund API + webhook, report-count chip in the question editor).
- **Doubts (added 2026-10-10, Manish).** `TicketCategory.DOUBT`: a private question to the course
  team about a lesson, a test or one question (reasons: idea unclear, solution unclear, another
  example, other). It routes like a content or question ticket (`COURSE_TICKET_CATEGORIES`), counts
  in the teacher's open total, and never folds into another open ticket. Learners get a speech-bubble
  button beside the flag in the lesson toolbar and on a question, the latter only on practice papers
  and in result review so nobody is helped mid-exam. The teaching page is now "Doubts & Reports".
  Course Discussions stay as the public place for doubts.
