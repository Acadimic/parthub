import { type PlanDto } from '@repo/shared/contracts';
import { Button } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { useEnrollment } from '@hooks/enrollment.hook';
import { CheckCircleIcon, LockSimpleOpenIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import { type ICourse } from '@stores';
import { useState } from 'react';

interface IProps {
  course: ICourse;
  plans: PlanDto[];
}

/** "₹1,499" or "$19", in the plan's currency with no decimals unless it has them. */
export const formatAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);

/** "per month", "for 3 months", "one-time". */
const getPeriodLabel = (plan: PlanDto) => {
  if (!plan.period) return 'one-time';
  const interval = plan.interval ?? 1;
  const unit = plan.period.replace(/ly$/, '').replace('dai', 'day');
  return interval === 1 ? `per ${unit}` : `for ${interval} ${unit}s`;
};

const PlanOption = ({ plan, isSelected, onSelect }: { plan: PlanDto; isSelected: boolean; onSelect: () => void }) => {
  const isFree = plan.amount === 0;
  const hasStrike = Boolean(plan.realAmount && plan.realAmount > plan.amount);
  const saving = hasStrike ? Math.round((1 - plan.amount / (plan.realAmount as number)) * 100) : 0;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
        isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40',
      )}
    >
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
          isSelected ? 'border-primary bg-primary' : 'border-input',
        )}
      >
        {isSelected ? <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{plan.name}</span>
          {plan.isRecommended ? (
            <Badge tone="primary" appearance="solid" className="px-1.5 text-xxs">
              Best value
            </Badge>
          ) : null}
          {saving ? (
            <Badge tone="success" className="px-1.5 text-xxs">
              Save {saving}%
            </Badge>
          ) : null}
        </span>
        {plan.description ? <span className="block text-xs text-muted-foreground">{plan.description}</span> : null}
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-mono text-base font-semibold">
          {isFree ? 'Free' : formatAmount(plan.amount, plan.currency ?? 'INR')}
        </span>
        {hasStrike ? (
          <span className="block font-mono text-xs text-muted-foreground line-through">
            {formatAmount(plan.realAmount as number, plan.currency ?? 'INR')}
          </span>
        ) : null}
        <span className="block text-xxs text-muted-foreground">{getPeriodLabel(plan)}</span>
      </span>
    </button>
  );
};

/**
 * The buy box: the plans a course is sold on, one of them chosen, and the button that enrols.
 * A course with no plans, or a chosen plan that costs nothing, enrols for free in one click.
 */
export const CoursePlans = ({ course, plans }: IProps) => {
  const { enroll, isEnrolling } = useEnrollment();
  const sorted = [...plans].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.amount - b.amount);
  const [selectedId, setSelectedId] = useState<string>(
    () => (sorted.find((plan) => plan.isRecommended) ?? sorted[0])?._id ?? '',
  );
  const selected = sorted.find((plan) => plan._id === selectedId) ?? null;
  const isFree = !selected || selected.amount === 0;
  const isPaidCourse = plans.some((plan) => plan.amount > 0);

  return (
    <div className="flex flex-col gap-3">
      {sorted.length ? (
        <div role="radiogroup" aria-label="Plans" className="flex flex-col gap-2">
          {sorted.map((plan) => (
            <PlanOption
              key={plan._id}
              plan={plan}
              isSelected={plan._id === selectedId}
              onSelect={() => setSelectedId(plan._id)}
            />
          ))}
        </div>
      ) : null}
      <Button
        isFull
        className="px-4 py-2.5"
        isLoading={isEnrolling}
        onClick={() => enroll(course, selected)}
        leftsection={
          isFree ? (
            <LockSimpleOpenIcon weight="bold" className="h-5 w-5" />
          ) : (
            <CheckCircleIcon weight="fill" className="h-5 w-5" />
          )
        }
      >
        {isFree ? 'Enrol for free' : `Pay ${formatAmount(selected.amount, selected.currency ?? 'INR')} and enrol`}
      </Button>
      {isPaidCourse ? (
        <p className="flex items-center justify-center gap-1.5 text-xxs text-muted-foreground">
          <ShieldCheckIcon weight="bold" className="h-3.5 w-3.5" />
          Secure payment by Razorpay · 7-day refund, see Terms
        </p>
      ) : (
        <p className="text-center text-xxs text-muted-foreground">No payment needed. Start straight away.</p>
      )}
    </div>
  );
};
