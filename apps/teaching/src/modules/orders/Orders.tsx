import { type CouponDto, type OrderDto } from '@repo/shared/contracts';
import { OrderStatus } from '@repo/shared/enums';
import { DataTable } from '@components/app/tables';
import { BlankState } from '@components/others';
import { Button, Tabs } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { type IColumnData } from '@interfaces';
import { LinkSimpleIcon, PencilIcon, PlusIcon, TagIcon } from '@phosphor-icons/react';
import { useCourseLookups, useOrderLookups, useUserLookups } from '@stores';
import { ACTIONS } from '@repo/shared/utils';
import { getStringFormattedDate } from '@utils/helpers';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { CreateOrderModal, OrderLink, UpsertCouponModal } from './components';
import { ORDER_STATUS_TONE, formatAmount, getCouponLabel, isCouponLive } from './order.utils';

interface IState {
  isOpenCreateOrder: boolean;
  isOpenCoupon: boolean;
  editingCouponId: string;
}

const STATUS_ITEMS = Object.values(OrderStatus).map((status) => ({ label: status, value: status }));

/** Every order link the organization has made, newest first. */
const OrdersTab = ({ onCreate }: { onCreate: () => void }) => {
  const orderStore = useOrderLookups();
  const { getUserById } = useUserLookups();
  const orders = orderStore.getOrders();
  const isLoading = orderStore.isLoading('orders') && !orderStore.isLoaded('orders');

  const columns: IColumnData<OrderDto>[] = [
    {
      label: 'Link',
      dataKey: 'code',
      width: 170,
      component: (row) => <OrderLink code={row.code} isCompact />,
    },
    {
      label: 'Plan',
      dataKey: 'snapshot',
      width: 260,
      isSortable: true,
      sortValue: (row) => row.snapshot.planName,
      component: (row) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground">{row.snapshot.planName}</div>
          <div className="truncate text-xs text-muted-foreground">
            {row.snapshot.courses.map((course) => course.name).join(', ') || 'No course'}
          </div>
        </div>
      ),
    },
    {
      label: 'Total',
      dataKey: 'total',
      width: 150,
      isSortable: true,
      component: (row) => (
        <div className="font-mono">
          {row.total === 0 ? 'Free' : formatAmount(row.total, row.currency)}
          {row.coupon ? <div className="text-xs text-success">{row.coupon.code}</div> : null}
        </div>
      ),
    },
    {
      label: 'Status',
      dataKey: 'status',
      width: 120,
      filters: [{ key: 'status', label: 'Status', options: STATUS_ITEMS, getValues: (row) => row.status }],
      component: (row) => (
        <Badge tone={ORDER_STATUS_TONE[row.status]} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      label: 'Buyer',
      dataKey: 'purchasedBy',
      width: 200,
      component: (row) => {
        const buyer = row.purchasedBy ? getUserById(row.purchasedBy) : undefined;
        if (!buyer && !row.purchasedBy) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="min-w-0">
            <div className="truncate">{buyer?.name ?? 'Learner'}</div>
            {row.paidAt ? (
              <div className="text-xs text-muted-foreground">{getStringFormattedDate(row.paidAt)}</div>
            ) : null}
          </div>
        );
      },
    },
    {
      label: 'Created',
      dataKey: 'createdAt',
      width: 130,
      isSortable: true,
      valueFormatter: (row) => (row.createdAt ? getStringFormattedDate(row.createdAt) : ''),
    },
  ];

  return (
    <DataTable
      rows={orders}
      columns={columns}
      isLoading={isLoading}
      emptyState={
        <BlankState
          label="No order links yet"
          description="Create one for a plan and share it. The buyer pays on that page and gets access at once."
          action={
            <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onCreate}>
              Create order link
            </Button>
          }
        />
      }
    />
  );
};

/** The organization's coupons, with what each takes off and whether it can be used today. */
const CouponsTab = ({ onCreate, onEdit }: { onCreate: () => void; onEdit: (coupon: CouponDto) => void }) => {
  const orderStore = useOrderLookups();
  const coupons = orderStore.getCoupons();
  const isLoading = orderStore.isLoading('coupons') && !orderStore.isLoaded('coupons');

  const columns: IColumnData<CouponDto>[] = [
    {
      label: 'Code',
      dataKey: 'code',
      width: 180,
      isSortable: true,
      component: (row) => (
        <div className="min-w-0">
          <div className="font-mono font-semibold text-foreground">{row.code}</div>
          {row.description ? <div className="truncate text-xs text-muted-foreground">{row.description}</div> : null}
        </div>
      ),
    },
    { label: 'Discount', dataKey: 'value', width: 140, isSortable: true, valueFormatter: getCouponLabel },
    {
      label: 'Uses',
      dataKey: 'usedCount',
      width: 110,
      isSortable: true,
      valueFormatter: (row) => (
        <span className="font-mono">
          {row.usedCount ?? 0}
          {row.maxUses ? ` / ${row.maxUses}` : ''}
        </span>
      ),
    },
    {
      label: 'Valid',
      dataKey: 'validTo',
      width: 200,
      valueFormatter: (row) => {
        if (!row.validFrom && !row.validTo) return 'Always';
        const from = row.validFrom ? getStringFormattedDate(row.validFrom) : '…';
        const to = row.validTo ? getStringFormattedDate(row.validTo) : '…';
        return `${from} – ${to}`;
      },
    },
    {
      label: 'Applies to',
      dataKey: 'plans',
      width: 140,
      valueFormatter: (row) =>
        row.plans?.length ? `${row.plans.length} plan${row.plans.length === 1 ? '' : 's'}` : 'Any plan',
    },
    {
      label: 'State',
      dataKey: 'isActive',
      width: 110,
      component: (row) =>
        isCouponLive(row) ? (
          <Badge tone="success" withDot>
            Live
          </Badge>
        ) : (
          <Badge tone="neutral">{row.isActive === false ? 'Off' : 'Not usable'}</Badge>
        ),
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      width: 90,
      menuItems: [
        { label: 'Edit', onClick: (row) => row && onEdit(row), icon: <PencilIcon weight="bold" className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <DataTable
      rows={coupons}
      columns={columns}
      isLoading={isLoading}
      emptyState={
        <BlankState
          label="No coupons yet"
          description="A coupon takes a percentage or a fixed sum off an order. Buyers type it on the order page."
          action={
            <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onCreate}>
              New coupon
            </Button>
          }
        />
      }
    />
  );
};

export const Orders = () => {
  const { loadOrders, loadCoupons, getCouponById, getOrders, getCoupons } = useOrderLookups();
  const { loadCourses, isLoaded } = useCourseLookups();
  const [state, setState] = useSetState<IState>({ isOpenCreateOrder: false, isOpenCoupon: false, editingCouponId: '' });
  const paidCount = getOrders().filter((order) => order.status === OrderStatus.PAID).length;
  const liveCoupons = getCoupons().filter(isCouponLive).length;

  useEffect(() => {
    loadOrders();
    loadCoupons();
    if (!isLoaded('courses')) loadCourses();
  }, []);

  const openCreateOrder = () => setState({ isOpenCreateOrder: true });
  const openCoupon = (coupon?: CouponDto) => setState({ isOpenCoupon: true, editingCouponId: coupon?._id ?? '' });

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {getOrders().length} order link{getOrders().length === 1 ? '' : 's'} · {paidCount} paid · {liveCoupons} live
            coupon{liveCoupons === 1 ? '' : 's'}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <Button
              isSecondary
              leftsection={<TagIcon weight="bold" className="w-4 h-4" />}
              onClick={() => openCoupon()}
            >
              New <span className="hidden sm:inline">coupon</span>
            </Button>
            <Button leftsection={<LinkSimpleIcon weight="bold" className="w-4 h-4" />} onClick={openCreateOrder}>
              Create <span className="hidden sm:inline">order link</span>
            </Button>
          </div>
        </div>
        <Tabs
          tabs={[
            { label: 'Orders', component: <OrdersTab onCreate={openCreateOrder} /> },
            { label: 'Coupons', component: <CouponsTab onCreate={() => openCoupon()} onEdit={openCoupon} /> },
          ]}
        />
      </div>
      <CreateOrderModal isOpen={state.isOpenCreateOrder} onClose={() => setState({ isOpenCreateOrder: false })} />
      <UpsertCouponModal
        isOpen={state.isOpenCoupon}
        coupon={getCouponById(state.editingCouponId)}
        onClose={() => setState({ isOpenCoupon: false, editingCouponId: '' })}
      />
    </>
  );
};
