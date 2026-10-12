import { type TicketDto, type TicketInboxQueryDto, type TicketReplyDto } from '@repo/shared/contracts';
import { type TicketStatus } from '@repo/shared/enums';
import { type ITicketReporter } from '@repo/shared/interfaces';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { TicketService } from '../services';

type TicketFetch = 'tickets' | 'moreTickets' | 'ticket' | 'activeCount';

/** The inbox's filters; the cursor is the store's own business. */
export type TicketInboxFilters = Omit<TicketInboxQueryDto, 'before'>;

export interface ITicketState extends IRequestSlice<TicketFetch> {
  filters: TicketInboxFilters | null;
  /** The inbox page's rows, without threads, in the order the server sent them. */
  ticketIds: string[];
  ticketMap: Record<string, TicketDto>;
  reporterMap: Record<string, ITicketReporter>;
  hasMore: boolean;
  /** `updatedAt` of the last row fetched: the next page starts before it. Not read from the map, where a reply moves it. */
  cursor: string | null;
  /** Open question and content reports: the ones waiting on the teacher. */
  activeCount: number;

  getTickets: () => TicketDto[];
  loadInbox: (filters: TicketInboxFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  loadTicket: (id: string) => Promise<void>;
  loadActiveCount: () => Promise<void>;
  reply: (id: string, payload: TicketReplyDto) => Promise<boolean>;
  setStatus: (id: string, status: TicketStatus) => Promise<boolean>;
}

export const useTicketStore = create<ITicketState>()((set, get) => {
  const putTicket = (ticket: TicketDto) => {
    set((state) => ({ ticketMap: { ...state.ticketMap, [ticket._id]: ticket } }));
  };

  /** A write may have changed what is open, so the count on the tab follows it. */
  const putWritten = (ticket: TicketDto) => {
    putTicket(ticket);
    get().loadActiveCount();
  };

  const loadPage = async (filters: TicketInboxFilters, before: string | null) => {
    const result = await TicketService.getInbox({ ...filters, ...(before ? { before } : {}) });
    if (!result?.data) return;
    const { tickets, reporters, hasMore } = result.data;
    set((state) => ({
      ticketIds: [...new Set([...(before ? state.ticketIds : []), ...tickets.map((ticket) => ticket._id)])],
      cursor: tickets.at(-1)?.updatedAt ?? state.cursor,
      ticketMap: {
        ...state.ticketMap,
        ...Object.fromEntries(
          tickets.map((ticket) => [ticket._id, { ...ticket, messages: state.ticketMap[ticket._id]?.messages }]),
        ),
      },
      reporterMap: {
        ...state.reporterMap,
        ...Object.fromEntries(reporters.map((reporter) => [reporter._id, reporter])),
      },
      hasMore,
    }));
  };

  return {
    filters: null,
    ticketIds: [],
    ticketMap: {},
    reporterMap: {},
    hasMore: false,
    cursor: null,
    activeCount: 0,
    ...createRequestSlice(['tickets', 'moreTickets', 'ticket', 'activeCount'], set, get),

    getTickets: () => {
      const { ticketIds, ticketMap } = get();
      return ticketIds.map((id) => ticketMap[id]).filter((ticket): ticket is TicketDto => Boolean(ticket));
    },

    loadInbox: (filters) => {
      set({ filters });
      return get().run('tickets', () => loadPage(filters, null));
    },

    loadMore: () => {
      const { filters, cursor } = get();
      if (!filters || !cursor) return Promise.resolve();
      return get().run('moreTickets', () => loadPage(filters, cursor));
    },

    loadTicket: (id) =>
      get().run('ticket', async () => {
        const result = await TicketService.getById(id);
        if (result?.data) putTicket(result.data);
      }),

    loadActiveCount: () =>
      get().run('activeCount', async () => {
        const result = await TicketService.getActiveCount();
        if (typeof result?.data === 'number') set({ activeCount: result.data });
      }),

    reply: async (id, payload) => {
      const { data } = await TicketService.reply(id, payload).catch(() => ({ data: undefined }));
      if (!data) return false;
      putWritten(data);
      return true;
    },

    setStatus: async (id, status) => {
      const { data } = await TicketService.setStatus(id, status).catch(() => ({ data: undefined }));
      if (!data) return false;
      putWritten(data);
      return true;
    },
  };
});

/** The store's lookups, subscribed to its state. */
export const useTicketLookups = (): ITicketState => useTicketStore(useShallow((state) => state));
