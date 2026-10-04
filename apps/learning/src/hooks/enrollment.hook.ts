import { type PlanDto } from '@repo/shared/contracts';
import { useCourse } from '@hooks/course.hook';
import { type ICourse, useEnrollmentLookups, useSelectedUser } from '@stores';
import { errorToast, successToast } from '@utils/helpers';
import { useState } from 'react';

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

/** Loads Razorpay's checkout once; later calls resolve at once. */
export const loadCheckoutScript = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/**
 * Enrolling, end to end: start the seat, and if it carries a price, collect it through Razorpay's
 * checkout and settle the seat with what comes back. Free seats open the course straight away.
 */
export const useEnrollment = () => {
  const enrollmentStore = useEnrollmentLookups();
  const selectedUser = useSelectedUser();
  const { openCourse, pushToSignIn } = useCourse();
  const [isEnrolling, setIsEnrolling] = useState(false);

  const finish = (courseId: string, message: string) => {
    successToast({ message });
    openCourse(courseId);
  };

  const enroll = async (course: ICourse, plan: PlanDto | null) => {
    // A seat belongs to an account, so a visitor signs in first and comes back to choose again.
    if (!selectedUser) {
      pushToSignIn(`/courses/${course._id}/preview`);
      return;
    }
    setIsEnrolling(true);
    try {
      const checkout = await enrollmentStore.checkout(course._id, plan?._id);
      const error = enrollmentStore.getError('checkout');
      if (!checkout || error) {
        errorToast({ message: error || 'Could not start your enrolment. Please try again.' });
        return;
      }
      if (!checkout.order) {
        finish(course._id, `You are enrolled in ${course.name}.`);
        return;
      }
      const isLoaded = await loadCheckoutScript();
      const Razorpay = window.Razorpay;
      if (!isLoaded || !Razorpay) {
        errorToast({ message: 'The payment page could not be loaded. Check your connection and try again.' });
        return;
      }
      const { order, enrollment, keyId } = checkout;
      await new Promise<void>((resolve) => {
        const razorpay = new Razorpay({
          key: keyId,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          name: 'Acadimic',
          description: plan ? `${course.name} · ${plan.name}` : course.name,
          prefill: { name: selectedUser?.name, email: selectedUser?.email },
          theme: { color: '#3b4fd0' },
          handler: async (response) => {
            const settled = await enrollmentStore.verifyPayment({
              enrollment: enrollment._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            const verifyError = enrollmentStore.getError('verify');
            if (!settled || verifyError) {
              errorToast({
                message: verifyError || 'Your payment went through but could not be confirmed. Please contact support.',
              });
            } else {
              finish(course._id, `Payment received. You are enrolled in ${course.name}.`);
            }
            resolve();
          },
          modal: { ondismiss: () => resolve() },
        });
        razorpay.open();
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  return { enroll, isEnrolling };
};
