import { type OrderDto } from '@repo/shared/contracts';
import { loadCheckoutScript } from '@hooks/enrollment.hook';
import { useEnrollmentStore, useOrderLookups, useSelectedUser } from '@stores';
import { errorToast, successToast } from '@utils/helpers';
import { useState } from 'react';

/**
 * Paying for an order link: start the checkout, collect through Razorpay when something is owed,
 * and settle. A free order is claimed in one step. Either way the seats land in the enrolment
 * store, so the course opens without another load.
 */
export const useOrderPayment = () => {
  const orderStore = useOrderLookups();
  const selectedUser = useSelectedUser();
  const [isPaying, setIsPaying] = useState(false);

  const finish = (message: string) => {
    successToast({ message });
    // The seats were created server-side; the enrolment store re-reads so the course is open.
    useEnrollmentStore.getState().resetRequests();
    void useEnrollmentStore.getState().loadMyEnrollments();
  };

  const pay = async (order: OrderDto) => {
    setIsPaying(true);
    try {
      const checkout = await orderStore.checkout(order.code);
      const error = orderStore.getError('checkout');
      if (!checkout || error) {
        errorToast({ message: error || 'Could not start the payment. Please try again.' });
        return;
      }
      if (!checkout.payment) {
        finish('Done. Your access is ready.');
        return;
      }
      const isLoaded = await loadCheckoutScript();
      const Razorpay = window.Razorpay;
      if (!isLoaded || !Razorpay) {
        errorToast({ message: 'The payment page could not be loaded. Check your connection and try again.' });
        return;
      }
      const { payment, keyId } = checkout;
      await new Promise<void>((resolve) => {
        const razorpay = new Razorpay({
          key: keyId,
          order_id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          name: order.snapshot.orgName || 'Acadimic',
          description: order.snapshot.planName,
          prefill: { name: selectedUser?.name, email: selectedUser?.email },
          theme: { color: '#3b4fd0' },
          handler: async (response) => {
            const settled = await orderStore.verifyPayment(order.code, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            const verifyError = orderStore.getError('verify');
            if (!settled || verifyError) {
              errorToast({
                message: verifyError || 'Your payment went through but could not be confirmed. Please contact support.',
              });
            } else {
              finish('Payment received. Your access is ready.');
            }
            resolve();
          },
          modal: { ondismiss: () => resolve() },
        });
        razorpay.open();
      });
    } finally {
      setIsPaying(false);
    }
  };

  return { pay, isPaying };
};
