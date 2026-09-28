import { type CouponDto, type CreateOrderDto, type OrderDto } from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { OrderService } from '../services';

/** The fetches this store tracks. */
type OrderFetch = 'orders' | 'coupons';

export interface IOrderState extends IRequestSlice<OrderFetch> {
  orderMap: Record<string, OrderDto>;
  couponMap: Record<string, CouponDto>;

  getOrderById: (orderId: string) => OrderDto | undefined;
  /** Newest first, which is how the table shows them. */
  getOrders: () => OrderDto[];
  getCouponById: (couponId: string) => CouponDto | undefined;
  getCoupons: () => CouponDto[];

  addOrders: (orders: OrderDto[]) => void;
  addCoupons: (coupons: CouponDto[]) => void;

  /** Mints an order on the server and returns it, so the caller can show the link at once. */
  createOrder: (payload: CreateOrderDto) => Promise<OrderDto | null>;
  upsertCoupon: (payload: CouponDto) => Promise<CouponDto | null>;

  loadOrders: () => Promise<void>;
  loadCoupons: () => Promise<void>;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

const byNewest = (a: { createdAt?: string }, b: { createdAt?: string }) =>
  (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

export const useOrderStore = create<IOrderState>()((set, get) => ({
  orderMap: {},
  couponMap: {},
  ...createRequestSlice(['orders', 'coupons'], set, get),

  getOrderById: (orderId) => (orderId ? get().orderMap[orderId] : undefined),
  getOrders: () => Object.values(get().orderMap).sort(byNewest),
  getCouponById: (couponId) => (couponId ? get().couponMap[couponId] : undefined),
  getCoupons: () => Object.values(get().couponMap).sort(byNewest),

  addOrders: (orders) => {
    set((state) => ({ orderMap: { ...state.orderMap, ...keyById(orders) } }));
  },

  addCoupons: (coupons) => {
    set((state) => ({ couponMap: { ...state.couponMap, ...keyById(coupons) } }));
  },

  createOrder: async (payload) => {
    const result = await OrderService.createOrder(payload);
    if (!result?.data) return null;
    get().addOrders([result.data]);
    return result.data;
  },

  upsertCoupon: async (payload) => {
    const result = await OrderService.upsertCoupon(payload);
    if (!result?.data) return null;
    if (result.data._deleted) {
      set((state) => {
        const { [result.data._id]: removed, ...couponMap } = state.couponMap;
        return removed ? { couponMap } : state;
      });
    } else {
      get().addCoupons([result.data]);
    }
    return result.data;
  },

  loadOrders: () =>
    get().run('orders', async () => {
      const result = await OrderService.getOrders();
      if (result?.data) set({ orderMap: keyById(result.data) });
    }),

  loadCoupons: () =>
    get().run('coupons', async () => {
      const result = await OrderService.getCoupons();
      if (result?.data) set({ couponMap: keyById(result.data) });
    }),

  reset: () => {
    set({ orderMap: {}, couponMap: {} });
    get().resetRequests();
  },
}));

/** The store's lookups, subscribed to its state. */
export const useOrderLookups = (): IOrderState => useOrderStore(useShallow((state) => state));
