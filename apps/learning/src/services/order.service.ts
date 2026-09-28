import { type OrderDto, type VerifyOrderPaymentDto } from '@repo/shared/contracts';
import { type IOrderCheckout } from '@repo/shared/interfaces';
import { API } from '../enums';
import { callAuthApi, callUnAuthApi } from './http.service';

class OrderService {
  /** What an order link shows. Public, so a buyer without an account sees it too. */
  getByCode = async (code: string) => callUnAuthApi<OrderDto>(`order/link/${code}`, API.GET);

  getMyOrders = async () => callAuthApi<OrderDto[]>('order/my', API.GET);

  applyCoupon = async (code: string, coupon: string) =>
    callAuthApi<OrderDto>(`order/link/${code}/coupon`, API.POST, { code: coupon });

  removeCoupon = async (code: string) => callAuthApi<OrderDto>(`order/link/${code}/coupon/remove`, API.POST);

  checkout = async (code: string) => callAuthApi<IOrderCheckout<OrderDto>>(`order/link/${code}/checkout`, API.POST);

  verifyPayment = async (code: string, payload: VerifyOrderPaymentDto) =>
    callAuthApi<OrderDto>(`order/link/${code}/verify`, API.POST, payload);
}

const instance = new OrderService();
export default instance;
