import {
  type RecordRefundDto,
  type TicketDto,
  type TicketInboxQueryDto,
  type TicketReplyDto,
} from '@repo/shared/contracts';
import { type TicketStatus } from '@repo/shared/enums';
import { type ITicketInbox } from '@repo/shared/interfaces';
import { API } from '../enums';
import { callAuthApi } from './http.service';

/** Every reported issue, for platform staff. @Private() routes, like the rest of this app's calls. */
class TicketService {
  getInbox = async (query: TicketInboxQueryDto) =>
    callAuthApi<ITicketInbox<TicketDto>>('ticket/support/inbox', API.GET, query);

  getById = async (id: string) => callAuthApi<TicketDto>(`ticket/support/${id}`, API.GET);

  reply = async (id: string, payload: TicketReplyDto) =>
    callAuthApi<TicketDto>(`ticket/support/${id}/reply`, API.POST, payload);

  setStatus = async (id: string, status: TicketStatus) =>
    callAuthApi<TicketDto>(`ticket/support/${id}/status`, API.POST, { status });

  recordRefund = async (id: string, payload: RecordRefundDto) =>
    callAuthApi<TicketDto>(`ticket/support/${id}/refund`, API.POST, payload);
}

const instance = new TicketService();
export default instance;
