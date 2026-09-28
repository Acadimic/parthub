/** Where a shareable order stands. One order is bought once; the link then shows it as paid. */
export enum OrderStatus {
  OPEN = 'open',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum CouponType {
  /** `value` is a percentage of the subtotal, 0–100. */
  PERCENT = 'percent',
  /** `value` is an amount in the order's currency. */
  FLAT = 'flat',
}
