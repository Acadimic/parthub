import { type CouponDto } from '@repo/shared/contracts';
import { type AxiosError } from 'axios';
import { CouponType, CurrencyType } from '@repo/shared/enums';
import { Select } from '@components/app/selects';
import { Button, DateInput, Modal, ModalFooter, Switch, TextArea, TextInput } from '@repo/ui/app';
import { PositionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { TrashIcon } from '@phosphor-icons/react';
import { useCourseLookups, useOrderLookups } from '@stores';
import { errorToast, getObjectId, handleError, successToast } from '@utils/helpers';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { getPlanLabel } from '../order.utils';

interface IProps {
  isOpen: boolean;
  /** The coupon being edited, or `undefined` to make a new one. */
  coupon?: CouponDto;
  onClose: () => void;
}

interface IState {
  code: string;
  type: CouponType;
  value: string;
  currency: CurrencyType;
  description: string;
  maxUses: string;
  validFrom: Date | null;
  validTo: Date | null;
  courses: string[];
  plans: string[];
  isActive: boolean;
  isLoading: boolean;
}

const INITIAL: IState = {
  code: '',
  type: CouponType.PERCENT,
  value: '',
  currency: CurrencyType.INR,
  description: '',
  maxUses: '',
  validFrom: null,
  validTo: null,
  courses: [],
  plans: [],
  isActive: true,
  isLoading: false,
};

const TYPE_ITEMS: ISelectItem[] = [
  { label: 'Percent off', value: CouponType.PERCENT, description: 'A share of the price, 0–100' },
  { label: 'Flat amount off', value: CouponType.FLAT, description: 'A fixed sum in one currency' },
];

const CURRENCY_ITEMS: ISelectItem[] = Object.values(CurrencyType).map((currency) => ({
  label: currency,
  value: currency,
}));

const toNumber = (text: string) => {
  const value = Number(text);
  return Number.isFinite(value) ? value : NaN;
};

/** The first thing wrong with the form, or an empty string when it can be saved. */
const findProblem = (code: string, value: number, isPercent: boolean, maxUses: number | undefined) => {
  if (!/^[A-Z0-9-]{3,24}$/.test(code)) return 'A code is 3 to 24 letters, digits or dashes.';
  if (Number.isNaN(value) || value <= 0) {
    return isPercent ? 'Percent off must be between 1 and 100.' : 'Enter the amount off.';
  }
  if (isPercent && value > 100) return 'Percent off must be between 1 and 100.';
  if (maxUses !== undefined && (Number.isNaN(maxUses) || maxUses < 1)) {
    return 'Max uses must be at least 1, or left blank.';
  }
  return '';
};

/** Reads a coupon's fields into the form. */
const fromCoupon = (coupon: CouponDto, coursesOfPlans: string[]): Partial<IState> => ({
  code: coupon.code,
  type: coupon.type,
  value: String(coupon.value),
  currency: coupon.currency ?? CurrencyType.INR,
  description: coupon.description ?? '',
  maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
  validFrom: coupon.validFrom ? new Date(coupon.validFrom) : null,
  validTo: coupon.validTo ? new Date(coupon.validTo) : null,
  courses: coursesOfPlans,
  plans: coupon.plans ?? [],
  isActive: coupon.isActive !== false,
});

/** Creates or edits a coupon; a coupon is removed by saving it as deleted. */
export const UpsertCouponModal = ({ isOpen, coupon, onClose }: IProps) => {
  const courseStore = useCourseLookups();
  const { getCourses, getPlans, getPlansByCourseId, getCourseById, loadCoursePlans } = courseStore;
  const { upsertCoupon } = useOrderLookups();
  const [state, setState] = useSetState<IState>(INITIAL);
  const isPercent = state.type === CouponType.PERCENT;

  const courseItems: ISelectItem[] = getCourses().map((course) => ({ label: course.name, value: course._id }));
  const planItems: ISelectItem[] = state.courses.flatMap((courseId) =>
    getPlansByCourseId(courseId).map((plan) => ({
      label: getPlanLabel(plan),
      value: plan._id,
      group: getCourseById(courseId)?.name,
    })),
  );

  useEffect(() => {
    if (!isOpen) return;
    if (!coupon) {
      setState(INITIAL);
      return;
    }
    // The plan picker is grouped by course, so the courses of the coupon's plans open it up.
    const courses = Array.from(
      new Set((coupon.plans ?? []).flatMap((planId) => getPlans().find((plan) => plan._id === planId)?.courses ?? [])),
    );
    setState({ ...INITIAL, ...fromCoupon(coupon, courses) });
  }, [isOpen, coupon?._id]);

  useEffect(() => {
    state.courses.forEach((courseId) => {
      if (!getPlansByCourseId(courseId).length) loadCoursePlans(courseId);
    });
  }, [state.courses.join(',')]);

  const closeModal = () => {
    if (state.isLoading) return;
    onClose();
  };

  const buildPayload = (): CouponDto | null => {
    const code = state.code.trim().toUpperCase();
    const value = toNumber(state.value);
    const maxUses = state.maxUses.trim() ? toNumber(state.maxUses) : undefined;
    const problem = findProblem(code, value, isPercent, maxUses);
    if (problem) {
      errorToast({ message: problem });
      return null;
    }
    return {
      _id: coupon?._id ?? getObjectId(),
      code,
      type: state.type,
      value,
      currency: isPercent ? undefined : state.currency,
      description: state.description.trim() || undefined,
      maxUses,
      validFrom: state.validFrom ? state.validFrom.toISOString() : undefined,
      validTo: state.validTo ? state.validTo.toISOString() : undefined,
      plans: state.plans.length ? state.plans : undefined,
      isActive: state.isActive,
    };
  };

  const save = async (payload: CouponDto, message: string) => {
    try {
      setState({ isLoading: true });
      const saved = await upsertCoupon(payload);
      if (!saved) return;
      successToast({ message });
      onClose();
    } catch (error) {
      handleError(error as AxiosError);
    } finally {
      setState({ isLoading: false });
    }
  };

  const handleSave = () => {
    const payload = buildPayload();
    if (payload) save(payload, coupon ? 'Coupon updated.' : 'Coupon created.');
  };

  const handleDelete = () => {
    if (!coupon) return;
    save({ ...coupon, _deleted: true }, 'Coupon removed. Orders that already used it keep their price.');
  };

  return (
    <Modal
      position={PositionType.RIGHT}
      title={coupon ? 'Edit coupon' : 'New coupon'}
      description="A code a buyer types on an order page to take something off the price."
      isOpen={isOpen}
      isLoading={state.isLoading}
      onClose={closeModal}
      component={
        <div className="flex flex-col gap-3 pb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="w-full md:w-[50%]">
              <TextInput
                label="Code"
                required
                placeholder="EARLYBIRD"
                value={state.code}
                disabled={state.isLoading || Boolean(coupon)}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setState({ code: event.target.value.toUpperCase() })
                }
              />
            </div>
            <div className="w-full md:w-[50%]">
              <Select
                label="Type"
                required
                items={TYPE_ITEMS}
                values={[state.type]}
                onChange={(values) => setState({ type: (values[0]?.value as CouponType) ?? CouponType.PERCENT })}
                isSingleSelect
                isDisabled={state.isLoading}
                noSort
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="w-full md:w-[50%]">
              <TextInput
                label={isPercent ? 'Percent off' : 'Amount off'}
                required
                type="number"
                min={0}
                max={isPercent ? 100 : undefined}
                value={state.value}
                disabled={state.isLoading}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState({ value: event.target.value })}
              />
            </div>
            <div className="w-full md:w-[50%]">
              {isPercent ? (
                <TextInput
                  label="Max uses"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={state.maxUses}
                  disabled={state.isLoading}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState({ maxUses: event.target.value })}
                />
              ) : (
                <Select
                  label="Currency"
                  required
                  items={CURRENCY_ITEMS}
                  values={[state.currency]}
                  onChange={(values) => setState({ currency: (values[0]?.value as CurrencyType) ?? CurrencyType.INR })}
                  isSingleSelect
                  isDisabled={state.isLoading}
                  noSort
                />
              )}
            </div>
          </div>
          {!isPercent ? (
            <TextInput
              label="Max uses"
              type="number"
              min={1}
              placeholder="Unlimited"
              value={state.maxUses}
              disabled={state.isLoading}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState({ maxUses: event.target.value })}
            />
          ) : null}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="w-full md:w-[50%]">
              <DateInput
                label="Valid from"
                value={state.validFrom}
                handleChange={(date) => setState({ validFrom: date })}
                isDisabled={state.isLoading}
              />
            </div>
            <div className="w-full md:w-[50%]">
              <DateInput
                label="Valid until"
                value={state.validTo}
                handleChange={(date) => setState({ validTo: date })}
                isDisabled={state.isLoading}
              />
            </div>
          </div>
          <Select
            label="Limit to courses"
            placeholder="Any plan of the organization"
            items={courseItems}
            values={state.courses}
            onChange={(values) => {
              const courses = values.map((item) => item.value);
              setState({ courses, plans: state.plans.filter((planId) => planItems.some((p) => p.value === planId)) });
            }}
            isDisabled={state.isLoading}
          />
          {state.courses.length ? (
            <Select
              label="Plans it applies to"
              placeholder="Every plan of the chosen courses"
              items={planItems}
              values={state.plans}
              onChange={(values) => setState({ plans: values.map((item) => item.value) })}
              isDisabled={state.isLoading}
              isGrouped
            />
          ) : null}
          <TextArea
            label="Description"
            placeholder="For your records; the buyer does not see it."
            rows={2}
            value={state.description}
            disabled={state.isLoading}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setState({ description: event.target.value })}
          />
          <Switch
            label="Active"
            checked={state.isActive}
            onCheckedChange={(isActive) => setState({ isActive })}
            disabled={state.isLoading}
          />
          {coupon ? (
            <div className="border-t border-border pt-3">
              <Button
                isSubtle
                className="text-destructive"
                leftsection={<TrashIcon weight="bold" className="w-4 h-4" />}
                onClick={handleDelete}
                disabled={state.isLoading}
              >
                Remove coupon
              </Button>
            </div>
          ) : null}
        </div>
      }
      footer={
        <ModalFooter
          saveText={coupon ? 'Save' : 'Create coupon'}
          cancelText="Cancel"
          onSave={handleSave}
          onCancel={closeModal}
          isLoading={state.isLoading}
        />
      }
    />
  );
};
