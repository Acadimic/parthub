/**
 * What an order promises, copied from the plan when the order is made. The plan can be edited or
 * deleted afterwards without touching a single order, paid or not: the buyer gets what they saw.
 */
export interface IOrderSnapshot {
  planId: string;
  planName: string;
  planDescription: string;
  amount: number;
  realAmount: number;
  currency: string;
  /** The plan's period and interval, which set how long the seats run; empty for open-ended access. */
  period: string;
  interval: number;
  courses: { _id: string; name: string }[];
  meets: { _id: string; title: string; startTime: string }[];
  /** Who sells it, for the public page. */
  orgName: string;
}

/** The coupon as it was applied, so a later edit to the coupon does not change a paid total. */
export interface IOrderCoupon {
  code: string;
  type: string;
  value: number;
  /** What it took off, in the order's currency. */
  discount: number;
}

export interface IOrderCheckout<TOrder = unknown> {
  order: TOrder;
  /** The Razorpay order to collect on, or null when nothing is owed and access was granted. */
  payment: { id: string; amount: number; currency: string } | null;
  keyId: string;
}
