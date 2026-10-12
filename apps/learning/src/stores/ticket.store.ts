import { type TicketDto, type TicketReplyDto } from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { TicketService } from '../services';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

type TicketFetch = 'tickets' | 'ticket' | 'unread';

export interface ITicketState extends IRequestSlice<TicketFetch> {
  /** The learner's tickets by id. A list row has no thread; opening one replaces it with the full ticket. */
  ticketMap: Record<string, TicketDto>;
  /** Tickets with a staff reply the learner has not opened. */
  unreadCount: number;

  getTickets: () => TicketDto[];
  getTicketById: (id: string) => TicketDto | undefined;
  addTickets: (tickets: TicketDto[]) => void;

  loadMyTickets: () => Promise<void>;
  loadTicket: (id: string) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  /** Raises a ticket; resolves to the saved one, or null when the server refused it (it toasts why). */
  createTicket: (payload: TicketDto) => Promise<TicketDto | null>;
  reply: (id: string, payload: TicketReplyDto) => Promise<boolean>;
  reset: () => void;
}

/** A staff reply the learner has not opened. ISO strings compare in time order, and '' sorts first. */
const isUnread = (ticket: TicketDto) => (ticket.lastStaffReplyAt ?? '') > (ticket.reporterSeenAt ?? '');

export const useTicketStore = create<ITicketState>()((set, get) => ({
  ticketMap: {},
  unreadCount: 0,
  ...createRequestSlice(['tickets', 'ticket', 'unread'], set, get),

  getTickets: () => Object.values(get().ticketMap).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),

  getTicketById: (id) => get().ticketMap[id],

  addTickets: (tickets) => {
    set((state) => ({
      // A list row carries no thread, so it must not wipe one an open ticket already loaded.
      ticketMap: {
        ...state.ticketMap,
        ...Object.fromEntries(
          tickets.map((ticket) => [
            ticket._id,
            { ...ticket, messages: ticket.messages ?? state.ticketMap[ticket._id]?.messages },
          ]),
        ),
      },
    }));
  },

  loadMyTickets: () =>
    get().run('tickets', async () => {
      const result = await TicketService.getMine();
      if (result?.data) get().addTickets(result.data);
    }),

  loadTicket: (id) =>
    get().run('ticket', async () => {
      const result = await TicketService.getMineById(id);
      if (!result?.data) return;
      get().addTickets([result.data]);
      await get().loadUnreadCount();
    }),

  loadUnreadCount: () =>
    get().run('unread', async () => {
      const result = await TicketService.getUnreadCount();
      if (typeof result?.data === 'number') set({ unreadCount: result.data });
    }),

  createTicket: async (payload) => {
    const { data } = await TicketService.create(payload).catch(() => ({ data: undefined }));
    if (!data) return null;
    get().addTickets([data]);
    return data;
  },

  reply: async (id, payload) => {
    const { data } = await TicketService.reply(id, payload).catch(() => ({ data: undefined }));
    if (!data) return false;
    get().addTickets([data]);
    return true;
  },

  reset: () => {
    set({ ticketMap: {}, unreadCount: 0 });
    get().resetRequests();
  },
}));

export { isUnread as isUnreadTicket };

/** The store's lookups, subscribed to its state. */
export const useTicketLookups = (): ITicketState => useTicketStore(useShallow((state) => state));
