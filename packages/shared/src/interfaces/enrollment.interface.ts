/**
 * What `POST enrollment/checkout` answers. A free seat is active on arrival and carries no order;
 * a paid one is pending and carries the Razorpay order the client's checkout must collect on.
 */
export interface IEnrollmentOrder {
  id: string;
  /** In the currency's minor unit, as Razorpay counts it. */
  amount: number;
  currency: string;
}

export interface IEnrollmentCheckout<TEnrollment = unknown> {
  enrollment: TEnrollment;
  order: IEnrollmentOrder | null;
  /** The publishable key the checkout is opened with; empty when payments are not configured. */
  keyId: string;
}
