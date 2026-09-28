import { type OrderDto } from '@repo/shared/contracts';
import { OrderStatus } from '@repo/shared/enums';
import { Button, Link, RectangleSkeleton } from '@repo/ui/app';
import { Badge, TextInput } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { Band } from '@components/app/sections';
import { BlankState, Container } from '@components/others';
import { useOrderPayment } from '@hooks/order.hook';
import { formatAmount } from '@modules/courses/components/course-preview/CoursePlans';
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  LockSimpleIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  TagIcon,
  VideoCameraIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useOrderLookups, useSelectedUser } from '@stores';
import { getStringFormattedDate } from '@utils/helpers';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

/** "30 days of access", "1 year of access", or "Lifetime access". */
const getTermLabel = (period: string, interval: number) => {
  if (!period) return 'Lifetime access';
  const unit = period.replace(/ly$/, '').replace('dai', 'day');
  const count = interval || 1;
  return `${count} ${unit}${count === 1 ? '' : 's'} of access`;
};

const STATUS_TONE: Record<OrderStatus, 'success' | 'primary' | 'neutral' | 'destructive'> = {
  [OrderStatus.OPEN]: 'primary',
  [OrderStatus.PAID]: 'success',
  [OrderStatus.EXPIRED]: 'neutral',
  [OrderStatus.CANCELLED]: 'destructive',
};

/** Everything the order promises, as the buyer will get it. */
const Includes = ({ order }: { order: OrderDto }) => {
  const { snapshot } = order;
  return (
    <section className="rounded-xl border border-border bg-background p-5">
      <h2 className="text-xs font-semibold uppercase tracking-caps text-muted-foreground">What you get</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {snapshot.courses.map((course) => (
          <li key={course._id} className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpenTextIcon weight="bold" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{course.name}</div>
              <div className="text-xs text-muted-foreground">
                Full course · {getTermLabel(snapshot.period, snapshot.interval)}
              </div>
            </div>
          </li>
        ))}
        {snapshot.meets.map((meet) => (
          <li key={meet._id} className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-2/15 text-chart-2">
              <VideoCameraIcon weight="bold" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{meet.title}</div>
              <div className="text-xs text-muted-foreground">
                Live class{meet.startTime ? ` · ${dayjs(meet.startTime).format('ddd, D MMM · h:mm A')}` : ''}
              </div>
            </div>
          </li>
        ))}
        {!snapshot.courses.length && !snapshot.meets.length ? (
          <li className="text-sm text-muted-foreground">This plan carries no course or class yet.</li>
        ) : null}
      </ul>
      {snapshot.planDescription ? (
        <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">{snapshot.planDescription}</p>
      ) : null}
    </section>
  );
};

/** The coupon box: apply one, or drop the one on the order. */
const CouponBox = ({ order, isSignedIn }: { order: OrderDto; isSignedIn: boolean }) => {
  const { applyCoupon, removeCoupon, isLoading, getError } = useOrderLookups();
  const [code, setCode] = useState('');
  const isBusy = isLoading('coupon');
  const error = getError('coupon');

  if (order.coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/10 px-3 py-2">
        <span className="flex items-center gap-2 text-sm">
          <TagIcon weight="fill" className="h-4 w-4 text-success" />
          <span className="font-mono font-semibold">{order.coupon.code}</span>
          <span className="text-muted-foreground">saves {formatAmount(order.coupon.discount, order.currency)}</span>
        </span>
        {isSignedIn ? (
          <Button
            isSubtle
            aria-label="Remove coupon"
            className="rounded-full p-1.5 text-muted-foreground"
            isLoading={isBusy}
            hideLoadingIcon
            onClick={() => removeCoupon(order.code)}
            leftsection={<XIcon weight="bold" className="h-3.5 w-3.5" />}
          />
        ) : null}
      </div>
    );
  }
  if (!isSignedIn) return null;
  const submit = () => {
    if (code.trim()) applyCoupon(order.code, code.trim());
  };
  // The library Button always renders `type="button"`, so the box submits by click and by Enter.
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <TextInput
          value={code}
          placeholder="Coupon code"
          aria-label="Coupon code"
          inputClassName="uppercase"
          error={Boolean(error)}
          helperText={error || undefined}
          leftSection={<TagIcon weight="bold" className="h-4 w-4 text-muted-foreground" />}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
        />
      </div>
      <Button isSecondary className="px-3 py-2" isLoading={isBusy} disabled={!code.trim()} onClick={submit}>
        Apply
      </Button>
    </div>
  );
};

/** The price, the discount, and what is owed. */
const Totals = ({ order }: { order: OrderDto }) => {
  const hasStrike = order.snapshot.realAmount > order.subtotal;
  return (
    <dl className="flex flex-col gap-1.5 text-sm">
      <div className="flex items-center justify-between">
        <dt className="text-muted-foreground">{order.snapshot.planName}</dt>
        <dd className="flex items-center gap-2 font-mono">
          {hasStrike ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatAmount(order.snapshot.realAmount, order.currency)}
            </span>
          ) : null}
          {formatAmount(order.subtotal, order.currency)}
        </dd>
      </div>
      {order.discount > 0 ? (
        <div className="flex items-center justify-between text-success">
          <dt>Coupon{order.coupon ? ` · ${order.coupon.code}` : ''}</dt>
          <dd className="font-mono">−{formatAmount(order.discount, order.currency)}</dd>
        </div>
      ) : null}
      <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
        <dt>Total</dt>
        <dd className="font-mono">{order.total === 0 ? 'Free' : formatAmount(order.total, order.currency)}</dd>
      </div>
    </dl>
  );
};

/** What a settled order shows: who bought it, and the way in for the buyer. */
const PaidPanel = ({ order, isMine }: { order: OrderDto; isMine: boolean }) => {
  const { courses } = order.snapshot;
  const firstCourse = courses[0];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
        <SealCheckIcon weight="fill" className="h-4 w-4 shrink-0" />
        {isMine ? 'You bought this' : 'Already bought'}
        {order.paidAt ? ` · ${getStringFormattedDate(order.paidAt)}` : ''}
      </div>
      {isMine && firstCourse ? (
        <Link
          href={`/courses/${firstCourse._id}/modules`}
          className="px-4 py-2.5"
          rightsection={<ArrowRightIcon weight="bold" className="h-4 w-4" />}
        >
          Open {courses.length > 1 ? 'your courses' : 'the course'}
        </Link>
      ) : null}
      {isMine && courses.length > 1 ? (
        <ul className="flex flex-col gap-1 text-sm">
          {courses.map((course) => (
            <li key={course._id}>
              <Link href={`/courses/${course._id}/modules`} isSubtle className="px-2 py-1 text-primary">
                {course.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {!isMine ? (
        <p className="text-xs text-muted-foreground">
          Each order link can be bought once. Ask the teacher for a link of your own.
        </p>
      ) : null}
    </div>
  );
};

/** The one button an open order needs: sign in, claim, or pay. */
const PayAction = ({ order, isSignedIn }: { order: OrderDto; isSignedIn: boolean }) => {
  const router = useRouter();
  const { pay, isPaying } = useOrderPayment();
  const isFree = order.total === 0;

  if (!isSignedIn) {
    return (
      <Button
        isFull
        className="px-4 py-2.5"
        onClick={() => router.push({ pathname: '/sign-in', query: { redirectUri: `/order/${order.code}` } })}
        leftsection={<LockSimpleIcon weight="bold" className="h-5 w-5" />}
      >
        Sign in to {isFree ? 'claim' : 'pay'}
      </Button>
    );
  }
  return (
    <Button
      isFull
      className="px-4 py-2.5"
      isLoading={isPaying}
      onClick={() => pay(order)}
      leftsection={<CheckCircleIcon weight="fill" className="h-5 w-5" />}
    >
      {isFree ? 'Claim for free' : `Pay ${formatAmount(order.total, order.currency)}`}
    </Button>
  );
};

/**
 * The page behind an order link. Anyone can read what it offers; paying needs an account, and a
 * visitor is sent to sign in and brought straight back. A paid order shows what was bought and the
 * way into it.
 */
export const OrderCheckout = ({ code }: { code: string }) => {
  const selectedUser = useSelectedUser();
  const { getOrderByCode, loadOrder, isFailed, getError } = useOrderLookups();
  const order = getOrderByCode(code);

  useEffect(() => {
    if (code) loadOrder(code);
  }, [code]);

  if (isFailed('order')) {
    return (
      <Container>
        <BlankState
          className="py-24"
          label="This order link is not valid"
          description={getError('order') || 'Check the link you were sent, or ask for a new one.'}
          action={
            <Link href="/courses" isSecondary>
              Browse courses
            </Link>
          }
        />
      </Container>
    );
  }
  if (!order) {
    return (
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col gap-4 py-10">
          <RectangleSkeleton height={120} />
          <RectangleSkeleton height={260} />
        </div>
      </Container>
    );
  }

  const isPaid = order.status === OrderStatus.PAID;
  const isOpen = order.status === OrderStatus.OPEN;
  const isSignedIn = Boolean(selectedUser);
  const isMine = Boolean(selectedUser && order.purchasedBy === selectedUser._id);

  return (
    <div className="flex flex-col">
      <Band className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
        <div className="mx-auto max-w-3xl py-10 md:py-14">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-caps text-primary">
              {order.snapshot.orgName ? `${order.snapshot.orgName} · ` : ''}Order
            </span>
            <Badge tone={STATUS_TONE[order.status]} appearance="solid" className="capitalize">
              {order.status}
            </Badge>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{order.snapshot.planName}</h1>
          {order.note ? <p className="mt-3 max-w-2xl text-muted-foreground md:text-lg">{order.note}</p> : null}
          {order.expiresAt && isOpen ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarBlankIcon weight="bold" className="h-4 w-4" />
              Offer valid until {getStringFormattedDate(order.expiresAt)}
            </p>
          ) : null}
        </div>
      </Band>
      <Container>
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 py-8 md:grid-cols-[1fr_320px] md:py-12">
          <Includes order={order} />
          <aside className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 md:sticky md:top-20 md:self-start">
            <Totals order={order} />
            {isOpen ? <CouponBox order={order} isSignedIn={isSignedIn} /> : null}
            {isPaid ? <PaidPanel order={order} isMine={isMine} /> : null}
            {isOpen ? <PayAction order={order} isSignedIn={isSignedIn} /> : null}
            {!isOpen && !isPaid ? (
              <p className="text-sm text-muted-foreground">
                This link can no longer be used. Ask the teacher for a fresh one.
              </p>
            ) : null}
            <p
              className={cn(
                'flex items-center justify-center gap-1.5 text-xxs text-muted-foreground',
                !isOpen && 'hidden',
              )}
            >
              <ShieldCheckIcon weight="bold" className="h-3.5 w-3.5" />
              Secure payment by Razorpay · 7-day refund, see Terms
            </p>
          </aside>
        </div>
      </Container>
    </div>
  );
};
