import { type PlanDto } from '@repo/shared/contracts';
import { Button } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { useEnrollment } from '@hooks/enrollment.hook';
import { CheckCircleIcon, LockSimpleOpenIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import { type ICourse } from '@stores';
import Link from 'next/link';

interface IProps {
  course: ICourse;
  plans: PlanDto[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
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

/** The percentage off the struck-through price, or 0 when the plan shows none. */
const getSaving = (plan: PlanDto) =>
  plan.realAmount && plan.realAmount > plan.amount ? Math.round((1 - plan.amount / plan.realAmount) * 100) : 0;

const PlanOption = ({ plan, isSelected, onSelect }: { plan: PlanDto; isSelected: boolean; onSelect: () => void }) => {
  const isFree = plan.amount === 0;
  const saving = getSaving(plan);
  const hasStrike = saving > 0;
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
        {isFree ? null : <span className="block text-xxs text-muted-foreground">{getPeriodLabel(plan)}</span>}
      </span>
    </button>
  );
};

/** A course sold on one paid plan has nothing to choose, so its price is shown as a line, not a picker. */
const PlanPrice = ({ plan }: { plan: PlanDto }) => {
  const currency = plan.currency ?? 'INR';
  const saving = getSaving(plan);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-2xl font-semibold">{formatAmount(plan.amount, currency)}</span>
        {saving ? (
          <span className="font-mono text-sm text-muted-foreground line-through">
            {formatAmount(plan.realAmount as number, currency)}
          </span>
        ) : null}
        <span className="text-xs text-muted-foreground">{getPeriodLabel(plan)}</span>
        {saving ? (
          <Badge tone="success" className="px-1.5 text-xxs">
            Save {saving}%
          </Badge>
        ) : null}
      </div>
      {plan.description ? <p className="text-xs text-muted-foreground">{plan.description}</p> : null}
    </div>
  );
};

const sortPlans = (plans: PlanDto[]) =>
  [...plans].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.amount - b.amount);

/** The plan chosen before the learner picks one: the recommended plan, else the first. */
export const getDefaultPlanId = (plans: PlanDto[]) => {
  const sorted = sortPlans(plans);
  return (sorted.find((plan) => plan.isRecommended) ?? sorted[0])?._id ?? '';
};

/** Enrols on the chosen plan, or for free when there is none or it costs nothing. */
export const EnrolButton = ({ course, plan }: { course: ICourse; plan: PlanDto | null }) => {
  const { enroll, isEnrolling } = useEnrollment();
  const isFree = !plan || plan.amount === 0;
  return (
    <Button
      isFull
      className="px-4 py-2.5"
      isLoading={isEnrolling}
      onClick={() => enroll(course, plan)}
      leftsection={
        isFree ? (
          <LockSimpleOpenIcon weight="bold" className="h-5 w-5" />
        ) : (
          <CheckCircleIcon weight="fill" className="h-5 w-5" />
        )
      }
    >
      {isFree ? 'Enrol for free' : `Pay ${formatAmount(plan.amount, plan.currency ?? 'INR')} and enrol`}
    </Button>
  );
};

/**
 * The buy box: the plans a course is sold on, one of them chosen, and the button that enrols.
 * A course with no plans, or a chosen plan that costs nothing, enrols for free in one click; a
 * single plan is shown as its price rather than a choice of one.
 */
export const CoursePlans = ({ course, plans, selectedPlanId, onSelectPlan }: IProps) => {
  const sorted = sortPlans(plans);
  const selected = sorted.find((plan) => plan._id === selectedPlanId) ?? null;
  const isPaidCourse = plans.some((plan) => plan.amount > 0);
  const [onlyPlan] = sorted;

  return (
    <div className="flex flex-col gap-3">
      {sorted.length === 1 && onlyPlan.amount > 0 ? <PlanPrice plan={onlyPlan} /> : null}
      {sorted.length > 1 ? (
        <div role="radiogroup" aria-label="Plans" className="flex flex-col gap-2">
          {sorted.map((plan) => (
            <PlanOption
              key={plan._id}
              plan={plan}
              isSelected={plan._id === selectedPlanId}
              onSelect={() => onSelectPlan(plan._id)}
            />
          ))}
        </div>
      ) : null}
      <div data-course-cta>
        <EnrolButton course={course} plan={selected} />
      </div>
      {isPaidCourse ? (
        <p className="flex items-center justify-center gap-1.5 text-xxs text-muted-foreground">
          <ShieldCheckIcon weight="bold" className="h-3.5 w-3.5" />
          <span>
            Secure payment by Razorpay · 7-day refund, see{' '}
            <Link href="/terms#payments" className="text-primary hover:underline">
              Terms
            </Link>
          </span>
        </p>
      ) : (
        <p className="text-center text-xxs text-muted-foreground">No payment needed. Start straight away.</p>
      )}
    </div>
  );
};
