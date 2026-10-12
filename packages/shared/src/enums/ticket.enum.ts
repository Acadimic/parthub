/** What a learner is reporting; decides which ids a ticket carries and who handles it. */
export enum TicketCategory {
  /** A test-paper question: handled by the organization that owns the course. */
  QUESTION = 'question',
  /** A lesson or other course content: handled by the organization that owns the course. */
  CONTENT = 'content',
  /** A private question about a lesson or test question, answered by the course's organization. */
  DOUBT = 'doubt',
  /** A purchase, a charge or a refund: handled by the platform. */
  PAYMENT = 'payment',
  /** Something in the app that is not working: handled by the platform. */
  GENERAL = 'general',
  /** The contact page: handled by the platform. */
  CONTACT = 'contact',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'inProgress',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

/** Why a ticket was raised. `TICKET_REASONS` lists which reasons each category offers. */
export enum TicketReason {
  WRONG_ANSWER_KEY = 'wrongAnswerKey',
  WRONG_SOLUTION = 'wrongSolution',
  UNCLEAR_QUESTION = 'unclearQuestion',
  TYPO = 'typo',
  BROKEN_FIGURE = 'brokenFigure',
  FACTUAL_ERROR = 'factualError',
  BROKEN_MEDIA = 'brokenMedia',
  OUTDATED = 'outdated',
  INAPPROPRIATE = 'inappropriate',
  CONCEPT_UNCLEAR = 'conceptUnclear',
  SOLUTION_UNCLEAR = 'solutionUnclear',
  NEED_EXAMPLE = 'needExample',
  PAID_NO_ACCESS = 'paidNoAccess',
  CHARGED_TWICE = 'chargedTwice',
  REFUND_REQUEST = 'refundRequest',
  COUPON_PROBLEM = 'couponProblem',
  INVOICE = 'invoice',
  BUG = 'bug',
  ACCOUNT = 'account',
  FEATURE_REQUEST = 'featureRequest',
  PARTNERSHIP = 'partnership',
  OTHER = 'other',
}

/** Which tickets an inbox lists. */
export enum TicketInboxStatus {
  /** Open or in progress: waiting on whoever handles it. */
  ACTIVE = 'active',
  ALL = 'all',
}
