/** Who raised a ticket. `email` is served to platform staff only; a teacher's inbox gets null. */
export interface ITicketReporter {
  _id: string;
  name: string;
  email: string | null;
}

/** One page of an inbox, newest activity first, with the reporters of every ticket on it. */
export interface ITicketInbox<TTicket = unknown> {
  tickets: TTicket[];
  reporters: ITicketReporter[];
  hasMore: boolean;
}
