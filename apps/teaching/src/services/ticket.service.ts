import { type TicketDto, type TicketInboxQueryDto, type TicketReplyDto } from '@repo/shared/contracts';
import { type TicketStatus } from '@repo/shared/enums';
import { type ITicketInbox } from '@repo/shared/interfaces';
import { API } from '../enums';
import { callAuthApi } from './http.service';

/** Reports about the organization's courses and sales. Payment ones are read-only here. */
class TicketService {
  getInbox = async (query: TicketInboxQueryDto) => callAuthApi<ITicketInbox<TicketDto>>('ticket/inbox', API.GET, query);

  getActiveCount = async () => callAuthApi<number>('ticket/inbox/count', API.GET);

  getById = async (id: string) => callAuthApi<TicketDto>(`ticket/inbox/${id}`, API.GET);

  reply = async (id: string, payload: TicketReplyDto) =>
    callAuthApi<TicketDto>(`ticket/inbox/${id}/reply`, API.POST, payload);

  setStatus = async (id: string, status: TicketStatus) =>
    callAuthApi<TicketDto>(`ticket/inbox/${id}/status`, API.POST, { status });
}

const instance = new TicketService();
export default instance;
