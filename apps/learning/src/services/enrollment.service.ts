import { type EnrollCourseDto, type EnrollmentDto, type VerifyEnrollmentPaymentDto } from '@repo/shared/contracts';
import { type IEnrollmentCheckout } from '@repo/shared/interfaces';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class EnrollmentService {
  /** The signed-in learner's seats, across every course. */
  getMyEnrollments = async () => callAuthApi<EnrollmentDto[]>('enrollment/my', API.GET);

  /** Starts a seat: active at once when free, pending with a payment order when priced. */
  checkout = async (payload: EnrollCourseDto) =>
    callAuthApi<IEnrollmentCheckout<EnrollmentDto>>('enrollment/checkout', API.POST, payload);

  /** Settles a pending seat with what the Razorpay checkout handed back. */
  verifyPayment = async (payload: VerifyEnrollmentPaymentDto) =>
    callAuthApi<EnrollmentDto>('enrollment/verify', API.POST, payload);
}

const instance = new EnrollmentService();
export default instance;
