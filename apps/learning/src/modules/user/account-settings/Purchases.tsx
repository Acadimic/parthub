import { ReportButton } from '@components/app/report';
import { BlankState } from '@components/others';
import { AccountSettingsType, EnrollmentStatus, OrderStatus, TicketCategory } from '@enums';
import { formatAmount } from '@modules/courses/components/course-preview/CoursePlans';
import { type EnrollmentDto, type OrderDto } from '@repo/shared/contracts';
import { Link, Loader } from '@repo/ui/app';
import { Badge, type BadgeTone } from '@repo/ui/core';
import { useLoadOnce } from '@repo/ui/hooks';
import { getStringFormattedDate } from '@repo/ui/lib';
import { useCourseStore, useEnrollmentStore, useOrderStore, useSelectedUser } from '@stores';
import { capitalize } from '@utils/helpers';
import { type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { SettingsSection } from './SettingsSection';

const ENROLLMENT_TONE: Record<EnrollmentStatus, BadgeTone> = {
  [EnrollmentStatus.PENDING]: 'warning',
  [EnrollmentStatus.ACTIVE]: 'success',
  [EnrollmentStatus.EXPIRED]: 'neutral',
  [EnrollmentStatus.CANCELLED]: 'neutral',
  [EnrollmentStatus.REFUNDED]: 'info',
};

const ORDER_TONE: Record<OrderStatus, BadgeTone> = {
  [OrderStatus.OPEN]: 'warning',
  [OrderStatus.PAID]: 'success',
  [OrderStatus.EXPIRED]: 'neutral',
  [OrderStatus.CANCELLED]: 'neutral',
  [OrderStatus.REFUNDED]: 'info',
};

const REPORT_DESCRIPTION =
  'Charged but no access, charged twice, a refund or an invoice: platform support replies under My Reports.';

interface IRowProps {
  title: ReactNode;
  details: string;
  status: string;
  tone: BadgeTone;
  report: ReactNode;
}

const PurchaseRow = ({ title, details, status, tone, report }: IRowProps) => (
  <li className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5 sm:flex-row sm:items-center">
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate text-sm font-medium text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{details}</span>
    </div>
    <div className="flex items-center gap-2">
      <Badge tone={tone}>{capitalize(status)}</Badge>
      {report}
    </div>
  </li>
);

/** A seat bought on a course page, as one line. */
const EnrollmentRow = ({ enrollment, courseName }: { enrollment: EnrollmentDto; courseName: string }) => (
  <PurchaseRow
    title={courseName}
    details={[
      formatAmount(enrollment.amount, enrollment.currency),
      enrollment.status === EnrollmentStatus.PENDING ? 'payment not completed' : '',
      `from ${getStringFormattedDate(enrollment.startsAt)}`,
    ]
      .filter(Boolean)
      .join(' · ')}
    status={enrollment.status}
    tone={ENROLLMENT_TONE[enrollment.status]}
    report={
      <ReportButton
        isLabelled
        title="Report a payment problem"
        description={REPORT_DESCRIPTION}
        target={{ category: TicketCategory.PAYMENT, enrollment: enrollment._id }}
      />
    }
  />
);

/** A shareable order the learner paid for, as one line. */
const OrderRow = ({ order }: { order: OrderDto }) => (
  <PurchaseRow
    title={<Link href={`/order/${order.code}`}>{order.snapshot.planName}</Link>}
    details={[
      formatAmount(order.total, order.currency),
      order.snapshot.courses.map((course) => course.name).join(', '),
      order.paidAt ? `paid ${getStringFormattedDate(order.paidAt)}` : '',
    ]
      .filter(Boolean)
      .join(' · ')}
    status={order.status}
    tone={ORDER_TONE[order.status]}
    report={
      <ReportButton
        isLabelled
        title="Report a payment problem"
        description={REPORT_DESCRIPTION}
        target={{ category: TicketCategory.PAYMENT, order: order._id }}
      />
    }
  />
);

/**
 * What the learner has paid for. A seat that came from an order is shown once, as the order, since
 * the order holds the payment.
 */
export const Purchases = () => {
  const selectedUser = useSelectedUser();
  const enrollmentRequest = useLoadOnce(useEnrollmentStore, 'enrollments', (state) => state.loadMyEnrollments);
  const orderRequest = useLoadOnce(useOrderStore, 'myOrders', (state) => state.loadMyOrders);
  useLoadOnce(useCourseStore, 'courses', (state) => state.loadCourses);
  const enrollments = useEnrollmentStore(useShallow((state) => state.getPaidSeats()));
  const orders = useOrderStore(useShallow((state) => state.getOrdersBoughtBy(selectedUser?._id ?? '')));
  const courseMap = useCourseStore((state) => state.courseMap);
  const isLoading = enrollmentRequest.isLoading || orderRequest.isLoading;
  const isEmpty = !enrollments.length && !orders.length;

  return (
    <SettingsSection
      title={AccountSettingsType.PURCHASES}
      description="Courses and plans you paid for. Report a problem with any of them here."
    >
      <Loader isLoading={isLoading && isEmpty} />
      {!isLoading && isEmpty ? (
        <BlankState label="No purchases yet" description="Courses and plans you buy will be listed here." />
      ) : null}
      <ul className="flex flex-col gap-2">
        {orders.map((order) => (
          <OrderRow key={order._id} order={order} />
        ))}
        {enrollments.map((enrollment) => (
          <EnrollmentRow
            key={enrollment._id}
            enrollment={enrollment}
            courseName={courseMap[enrollment.course]?.name ?? 'Course'}
          />
        ))}
      </ul>
    </SettingsSection>
  );
};
