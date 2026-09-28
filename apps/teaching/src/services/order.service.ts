import { type CouponDto, type CreateOrderDto, type OrderDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class OrderService {
  createOrder = async (payload: CreateOrderDto) => callAuthApi<OrderDto>('order/create', API.POST, payload);

  getOrders = async () => callAuthApi<OrderDto[]>('order/all', API.GET);

  getCoupons = async () => callAuthApi<CouponDto[]>('order/coupons', API.GET);

  upsertCoupon = async (payload: CouponDto) => callAuthApi<CouponDto>('order/coupon/upsert', API.POST, payload);
}

const instance = new OrderService();
export default instance;
