import { type OrderDto, type VerifyOrderPaymentDto } from '@repo/shared/contracts';
import { type IOrderCheckout } from '@repo/shared/interfaces';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { OrderService } from '../services';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

/** The fetches this store tracks: the link itself, the coupon, and the two halves of paying. */
type OrderFetch = 'order' | 'coupon' | 'checkout' | 'verify';

export interface IOrderState extends IRequestSlice<OrderFetch> {
  /** Orders by their link code — the page only ever holds the one it is showing. */
  orderMap: Record<string, OrderDto>;

  getOrderByCode: (code: string) => OrderDto | undefined;
  addOrders: (orders: OrderDto[]) => void;

  loadOrder: (code: string) => Promise<void>;
  applyCoupon: (code: string, coupon: string) => Promise<void>;
  removeCoupon: (code: string) => Promise<void>;
  checkout: (code: string) => Promise<IOrderCheckout<OrderDto> | null>;
  verifyPayment: (code: string, payload: VerifyOrderPaymentDto) => Promise<OrderDto | null>;
  reset: () => void;
}

const keyByCode = (rows: OrderDto[]): Record<string, OrderDto> =>
  rows.reduce<Record<string, OrderDto>>((map, row) => {
    map[row.code] = row;
    return map;
  }, {});

export const useOrderStore = create<IOrderState>()((set, get) => ({
  orderMap: {},
  ...createRequestSlice(['order', 'coupon', 'checkout', 'verify'], set, get),

  getOrderByCode: (code) => get().orderMap[code],

  addOrders: (orders) => {
    set((state) => ({ orderMap: { ...state.orderMap, ...keyByCode(orders) } }));
  },

  loadOrder: (code) =>
    get().run('order', async () => {
      const result = await OrderService.getByCode(code);
      if (result?.data) get().addOrders([result.data]);
    }),

  applyCoupon: (code, coupon) =>
    get().run('coupon', async () => {
      const result = await OrderService.applyCoupon(code, coupon);
      if (result?.data) get().addOrders([result.data]);
    }),

  removeCoupon: (code) =>
    get().run('coupon', async () => {
      const result = await OrderService.removeCoupon(code);
      if (result?.data) get().addOrders([result.data]);
    }),

  checkout: async (code) => {
    let checkout: IOrderCheckout<OrderDto> | null = null;
    await get().run('checkout', async () => {
      const result = await OrderService.checkout(code);
      if (!result?.data) return;
      checkout = result.data;
      get().addOrders([result.data.order]);
    });
    return checkout;
  },

  verifyPayment: async (code, payload) => {
    let order: OrderDto | null = null;
    await get().run('verify', async () => {
      const result = await OrderService.verifyPayment(code, payload);
      if (!result?.data) return;
      order = result.data;
      get().addOrders([result.data]);
    });
    return order;
  },

  reset: () => {
    set({ orderMap: {} });
    get().resetRequests();
  },
}));

/** The store's lookups, subscribed to its state. */
export const useOrderLookups = (): IOrderState => useOrderStore(useShallow((state) => state));
