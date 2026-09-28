import { type EnrollmentDto, type VerifyEnrollmentPaymentDto } from '@repo/shared/contracts';
import { EnrollmentStatus } from '@repo/shared/enums';
import { type IEnrollmentCheckout } from '@repo/shared/interfaces';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { EnrollmentService } from '../services';
import { onceInFlight } from '../utils/helpers';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

/** The fetches this store tracks. `checkout` and `verify` are the two halves of paying. */
type EnrollmentFetch = 'enrollments' | 'checkout' | 'verify';

export interface IEnrollmentState extends IRequestSlice<EnrollmentFetch> {
  enrollmentMap: Record<string, EnrollmentDto>;

  getEnrollments: () => EnrollmentDto[];
  /** The seat that grants access to a course right now, if any. A run-out term does not count. */
  getActiveEnrollment: (courseId: string) => EnrollmentDto | undefined;
  isEnrolled: (courseId: string) => boolean;

  addEnrollments: (enrollments: EnrollmentDto[]) => void;

  loadMyEnrollments: () => Promise<void>;
  /** Starts a seat and returns what the checkout needs; the seat is in the store either way. */
  checkout: (courseId: string, planId: string | undefined) => Promise<IEnrollmentCheckout<EnrollmentDto> | null>;
  verifyPayment: (payload: VerifyEnrollmentPaymentDto) => Promise<EnrollmentDto | null>;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

const isCurrent = (enrollment: EnrollmentDto) =>
  enrollment.status === EnrollmentStatus.ACTIVE &&
  !enrollment._deleted &&
  (!enrollment.endsAt || new Date(enrollment.endsAt).getTime() > Date.now());

export const useEnrollmentStore = create<IEnrollmentState>()((set, get) => ({
  enrollmentMap: {},
  ...createRequestSlice(['enrollments', 'checkout', 'verify'], set, get),

  getEnrollments: () => Object.values(get().enrollmentMap),

  getActiveEnrollment: (courseId) =>
    get()
      .getEnrollments()
      .find((enrollment) => enrollment.course === courseId && isCurrent(enrollment)),

  isEnrolled: (courseId) => Boolean(get().getActiveEnrollment(courseId)),

  addEnrollments: (enrollments) => {
    set((state) => ({ enrollmentMap: { ...state.enrollmentMap, ...keyById(enrollments) } }));
  },

  loadMyEnrollments: () =>
    onceInFlight('enrollments', () =>
      get().run('enrollments', async () => {
        const result = await EnrollmentService.getMyEnrollments();
        if (result?.data) get().addEnrollments(result.data);
      }),
    ),

  checkout: async (courseId, planId) => {
    let checkout: IEnrollmentCheckout<EnrollmentDto> | null = null;
    await get().run('checkout', async () => {
      const result = await EnrollmentService.checkout({ course: courseId, plan: planId });
      if (!result?.data) return;
      checkout = result.data;
      get().addEnrollments([result.data.enrollment]);
    });
    return checkout;
  },

  verifyPayment: async (payload) => {
    let enrollment: EnrollmentDto | null = null;
    await get().run('verify', async () => {
      const result = await EnrollmentService.verifyPayment(payload);
      if (!result?.data) return;
      enrollment = result.data;
      get().addEnrollments([result.data]);
    });
    return enrollment;
  },

  reset: () => {
    set({ enrollmentMap: {} });
    get().resetRequests();
  },
}));

/** The store's lookups, subscribed to its state. */
export const useEnrollmentLookups = (): IEnrollmentState => useEnrollmentStore(useShallow((state) => state));
