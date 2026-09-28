import { type CouponDto, type PlanDto } from '@repo/shared/contracts';
import { CouponType, OrderStatus } from '@repo/shared/enums';

/** The learning app is where a buyer opens the link; the teaching app only mints it. */
const LEARN_URL = process.env.NEXT_PUBLIC_LEARN_URL ?? 'http://localhost:3000';

export const getOrderLink = (code: string) => `${LEARN_URL}/order/${code}`;

export const formatAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);

/** "Monthly · ₹499" — enough to pick a plan from a list. */
export const getPlanLabel = (plan: PlanDto) => {
  const term = plan.period
    ? `${plan.interval && plan.interval > 1 ? `${plan.interval}× ` : ''}${plan.period}`
    : 'lifetime';
  return `${plan.name} · ${term} · ${plan.amount === 0 ? 'Free' : formatAmount(plan.amount, plan.currency ?? 'INR')}`;
};

/** "20% off" or "₹100 off". */
export const getCouponLabel = (coupon: CouponDto) =>
  coupon.type === CouponType.PERCENT
    ? `${coupon.value}% off`
    : `${formatAmount(coupon.value, coupon.currency ?? 'INR')} off`;

export const ORDER_STATUS_TONE: Record<OrderStatus, 'success' | 'info' | 'neutral' | 'destructive'> = {
  [OrderStatus.OPEN]: 'info',
  [OrderStatus.PAID]: 'success',
  [OrderStatus.EXPIRED]: 'neutral',
  [OrderStatus.CANCELLED]: 'destructive',
};

/** Whether a coupon can be applied today: switched on, inside its window, and not used up. */
export const isCouponLive = (coupon: CouponDto) => {
  if (coupon.isActive === false) return false;
  const now = Date.now();
  if (coupon.validFrom && new Date(coupon.validFrom).getTime() > now) return false;
  if (coupon.validTo && new Date(coupon.validTo).getTime() < now) return false;
  if (coupon.maxUses && (coupon.usedCount ?? 0) >= coupon.maxUses) return false;
  return true;
};
