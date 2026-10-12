import { DISCUSSION_LIMITS } from './discussion.util';
import { TicketCategory, TicketReason, TicketStatus } from '../enums/ticket.enum';

/** Limits on a ticket, checked by the server and shown by the report dialog. */
export const TICKET_LIMITS = {
  // The report dialog and replies reuse the discussion composer, so its limits are these.
  MAX_BODY_LENGTH: DISCUSSION_LIMITS.MAX_BODY_LENGTH,
  MAX_ATTACHMENTS: DISCUSSION_LIMITS.MAX_ATTACHMENTS,
  /** New tickets one learner may raise in a day. */
  MAX_PER_DAY: 10,
  /** Days after payment a refund may be requested, as the terms promise. */
  REFUND_WINDOW_DAYS: 7,
  /** Days after it was closed that a reporter's reply still reopens a ticket. */
  REOPEN_WINDOW_DAYS: 14,
  PAGE_SIZE: 20,
} as const;

/** The reasons each category offers, in the order the dialog lists them. */
export const TICKET_REASONS: Record<TicketCategory, TicketReason[]> = {
  [TicketCategory.QUESTION]: [
    TicketReason.WRONG_ANSWER_KEY,
    TicketReason.WRONG_SOLUTION,
    TicketReason.UNCLEAR_QUESTION,
    TicketReason.TYPO,
    TicketReason.BROKEN_FIGURE,
    TicketReason.OTHER,
  ],
  [TicketCategory.CONTENT]: [
    TicketReason.FACTUAL_ERROR,
    TicketReason.TYPO,
    TicketReason.BROKEN_MEDIA,
    TicketReason.OUTDATED,
    TicketReason.INAPPROPRIATE,
    TicketReason.OTHER,
  ],
  [TicketCategory.DOUBT]: [
    TicketReason.CONCEPT_UNCLEAR,
    TicketReason.SOLUTION_UNCLEAR,
    TicketReason.NEED_EXAMPLE,
    TicketReason.OTHER,
  ],
  [TicketCategory.PAYMENT]: [
    TicketReason.PAID_NO_ACCESS,
    TicketReason.CHARGED_TWICE,
    TicketReason.REFUND_REQUEST,
    TicketReason.COUPON_PROBLEM,
    TicketReason.INVOICE,
    TicketReason.OTHER,
  ],
  [TicketCategory.GENERAL]: [TicketReason.BUG, TicketReason.ACCOUNT, TicketReason.FEATURE_REQUEST, TicketReason.OTHER],
  [TicketCategory.CONTACT]: [
    TicketReason.ACCOUNT,
    TicketReason.PARTNERSHIP,
    TicketReason.FEATURE_REQUEST,
    TicketReason.OTHER,
  ],
};

export const TICKET_REASON_LABELS: Record<TicketReason, string> = {
  [TicketReason.WRONG_ANSWER_KEY]: 'The marked answer is wrong',
  [TicketReason.WRONG_SOLUTION]: 'The solution is wrong',
  [TicketReason.UNCLEAR_QUESTION]: 'The question is unclear',
  [TicketReason.TYPO]: 'Typo or formatting',
  [TicketReason.BROKEN_FIGURE]: 'A figure or equation does not show',
  [TicketReason.FACTUAL_ERROR]: 'Something is incorrect',
  [TicketReason.BROKEN_MEDIA]: 'A picture, video or file does not load',
  [TicketReason.OUTDATED]: 'Out of date',
  [TicketReason.INAPPROPRIATE]: 'Inappropriate content',
  [TicketReason.CONCEPT_UNCLEAR]: 'I do not understand the idea',
  [TicketReason.SOLUTION_UNCLEAR]: 'I do not follow the answer or solution',
  [TicketReason.NEED_EXAMPLE]: 'I would like another example',
  [TicketReason.PAID_NO_ACCESS]: 'I paid but have no access',
  [TicketReason.CHARGED_TWICE]: 'I was charged twice',
  [TicketReason.REFUND_REQUEST]: 'I want a refund',
  [TicketReason.COUPON_PROBLEM]: 'A coupon did not work',
  [TicketReason.INVOICE]: 'I need an invoice',
  [TicketReason.BUG]: 'Something is not working',
  [TicketReason.ACCOUNT]: 'My account',
  [TicketReason.FEATURE_REQUEST]: 'A suggestion',
  [TicketReason.PARTNERSHIP]: 'Teaching or partnerships',
  [TicketReason.OTHER]: 'Something else',
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.QUESTION]: 'Question',
  [TicketCategory.CONTENT]: 'Course content',
  [TicketCategory.DOUBT]: 'Doubt',
  [TicketCategory.PAYMENT]: 'Payment',
  [TicketCategory.GENERAL]: 'General',
  [TicketCategory.CONTACT]: 'Contact',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: 'Open',
  [TicketStatus.IN_PROGRESS]: 'In progress',
  [TicketStatus.RESOLVED]: 'Resolved',
  [TicketStatus.DISMISSED]: 'Dismissed',
};

export const ACTIVE_TICKET_STATUSES: TicketStatus[] = [TicketStatus.OPEN, TicketStatus.IN_PROGRESS];

export const isActiveTicket = (status: TicketStatus): boolean => ACTIVE_TICKET_STATUSES.includes(status);

/** The categories the course's organization answers; the rest go to the platform. */
export const COURSE_TICKET_CATEGORIES: TicketCategory[] = [
  TicketCategory.QUESTION,
  TicketCategory.CONTENT,
  TicketCategory.DOUBT,
];

export const isCourseTicket = (category: TicketCategory): boolean => COURSE_TICKET_CATEGORIES.includes(category);
