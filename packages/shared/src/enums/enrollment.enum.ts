/** Where a learner's seat in a course stands. */
export enum EnrollmentStatus {
  /** A paid seat waiting on its payment; holds no access. */
  PENDING = 'pending',
  ACTIVE = 'active',
  /** A period plan whose term has run out; renewing makes a new row. */
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}
