import { type OrderDto, type PlanDto } from '@repo/shared/contracts';
import { type AxiosError } from 'axios';
import { Select } from '@components/app/selects';
import { DateInput, Link, Modal, ModalFooter, TextArea } from '@repo/ui/app';
import { PositionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { ArrowSquareOutIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { useCourseLookups, useOrderLookups } from '@stores';
import { errorToast, handleError } from '@utils/helpers';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { formatAmount, getCouponLabel, getOrderLink, getPlanLabel, isCouponLive } from '../order.utils';
import { OrderLink } from './OrderLink';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IState {
  course: string;
  plan: string;
  coupon: string;
  note: string;
  expiresAt: Date | null;
  isLoading: boolean;
  /** Set once the server has minted the order; the modal then shows the link. */
  created: OrderDto | null;
}

const INITIAL: IState = {
  course: '',
  plan: '',
  coupon: '',
  note: '',
  expiresAt: null,
  isLoading: false,
  created: null,
};

/** What the chosen plan carries, and a reminder that the order keeps its own copy. */
const PlanSummary = ({ plan }: { plan: PlanDto }) => {
  const courseCount = plan.courses?.length ?? 0;
  const meetCount = plan.meets?.length ?? 0;
  return (
    <div className="rounded-lg border border-border bg-muted p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{plan.name}</span>
        <span className="font-mono">
          {plan.amount === 0 ? 'Free' : formatAmount(plan.amount, plan.currency ?? 'INR')}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {courseCount} course{courseCount === 1 ? '' : 's'}
        {meetCount ? ` · ${meetCount} live class${meetCount === 1 ? '' : 'es'}` : ''}. These are copied onto the order,
        so editing the plan later will not change this link.
      </p>
    </div>
  );
};

/** The link, once the order exists. */
const CreatedPanel = ({ order }: { order: OrderDto }) => (
  <div className="flex flex-col gap-4 pb-4">
    <div className="flex items-start gap-3 rounded-lg bg-success/10 p-3 text-sm text-success">
      <CheckCircleIcon weight="fill" className="mt-0.5 w-5 h-5 shrink-0" />
      <div>
        <div className="font-semibold">Order link ready</div>
        <div className="text-xs">
          Share it with the buyer. They sign in, apply any coupon, pay
          {order.total === 0 ? ' nothing' : ` ${formatAmount(order.total, order.currency)}`}, and get access straight
          away.
        </div>
      </div>
    </div>
    <OrderLink code={order.code} />
    <Link
      href={getOrderLink(order.code)}
      target="_blank"
      isSecondary
      rightsection={<ArrowSquareOutIcon weight="bold" className="w-4 h-4" />}
    >
      Preview the order page
    </Link>
  </div>
);

/**
 * Makes an order link for one plan. The plan's contents are copied onto the order when it is
 * created, so what the link promises stays fixed even if the plan is edited or removed later.
 */
export const CreateOrderModal = ({ isOpen, onClose }: IProps) => {
  const courseStore = useCourseLookups();
  const { getCourses, getPlansByCourseId, getPlanById, loadCoursePlans } = courseStore;
  const { getCoupons, createOrder } = useOrderLookups();
  const [state, setState] = useSetState<IState>(INITIAL);
  const plan = getPlanById(state.plan);
  const isLoadingPlans = courseStore.isLoading('plans');

  const courseItems: ISelectItem[] = getCourses().map((course) => ({
    label: course.name,
    value: course._id,
    description: course.isPublished ? undefined : 'Draft',
  }));
  const planItems: ISelectItem[] = getPlansByCourseId(state.course).map((row) => ({
    label: getPlanLabel(row),
    value: row._id,
    description: row.description,
  }));
  const couponItems: ISelectItem[] = getCoupons()
    .filter(isCouponLive)
    .filter((coupon) => !coupon.plans?.length || (state.plan && coupon.plans.includes(state.plan)))
    .map((coupon) => ({ label: `${coupon.code} · ${getCouponLabel(coupon)}`, value: coupon.code }));

  useEffect(() => {
    if (isOpen) setState(INITIAL);
  }, [isOpen]);

  useEffect(() => {
    if (state.course) loadCoursePlans(state.course);
  }, [state.course]);

  const closeModal = () => {
    if (state.isLoading) return;
    onClose();
  };

  const handleCreate = async () => {
    if (!state.plan) {
      errorToast({ message: 'Pick a plan for the order.' });
      return;
    }
    try {
      setState({ isLoading: true });
      const created = await createOrder({
        plan: state.plan,
        note: state.note.trim() || undefined,
        expiresAt: state.expiresAt ? state.expiresAt.toISOString() : undefined,
        coupon: state.coupon || undefined,
      });
      if (created) setState({ created });
    } catch (error) {
      handleError(error as AxiosError);
    } finally {
      setState({ isLoading: false });
    }
  };

  const form = (
    <div className="flex flex-col gap-3 pb-4">
      <Select
        label="Course"
        required
        items={courseItems}
        values={state.course ? [state.course] : []}
        onChange={(values) => setState({ course: values[0]?.value ?? '', plan: '', coupon: '' })}
        isSingleSelect
        isDisabled={state.isLoading}
      />
      <Select
        label="Plan"
        required
        placeholder={isLoadingPlans ? 'Loading plans…' : 'Choose a plan'}
        items={planItems}
        values={state.plan ? [state.plan] : []}
        onChange={(values) => setState({ plan: values[0]?.value ?? '', coupon: '' })}
        isSingleSelect
        isDisabled={state.isLoading || !state.course}
        notFoundComponent={
          <p className="p-3 text-sm text-muted-foreground">
            {state.course ? 'This course has no plan yet. Add one from the course page.' : 'Pick a course first.'}
          </p>
        }
      />
      {plan ? <PlanSummary plan={plan} /> : null}
      <Select
        label="Coupon"
        placeholder="None"
        items={couponItems}
        values={state.coupon ? [state.coupon] : []}
        onChange={(values) => setState({ coupon: values[0]?.value ?? '' })}
        isSingleSelect
        isDisabled={state.isLoading || !state.plan}
        notFoundComponent={<p className="p-3 text-sm text-muted-foreground">No live coupon applies to this plan.</p>}
      />
      <DateInput
        label="Link valid until"
        value={state.expiresAt}
        handleChange={(date) => setState({ expiresAt: date })}
        isDisabled={state.isLoading}
      />
      <TextArea
        label="Note for the buyer"
        placeholder="Shown at the top of the order page — who it is for, or what is included."
        rows={3}
        value={state.note}
        disabled={state.isLoading}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setState({ note: event.target.value })}
      />
    </div>
  );

  return (
    <Modal
      position={PositionType.RIGHT}
      title={state.created ? 'Order created' : 'Create order link'}
      description={
        state.created ? undefined : 'A link that sells one plan. Whoever opens it can pay and take the seats.'
      }
      isOpen={isOpen}
      isLoading={state.isLoading}
      onClose={closeModal}
      component={state.created ? <CreatedPanel order={state.created} /> : form}
      footer={
        state.created ? (
          <ModalFooter saveText="Done" onSave={onClose} onCancel={onClose} hideCancel />
        ) : (
          <ModalFooter
            saveText="Create link"
            cancelText="Cancel"
            onSave={handleCreate}
            onCancel={closeModal}
            isLoading={state.isLoading}
          />
        )
      }
    />
  );
};
