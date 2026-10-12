import { type TicketDto, type TicketReplyDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

/** The signed-in learner's reported issues. */
class TicketService {
  create = async (payload: TicketDto) => callAuthApi<TicketDto>('ticket/create', API.POST, payload);

  getMine = async () => callAuthApi<TicketDto[]>('ticket/my', API.GET);

  getMineById = async (id: string) => callAuthApi<TicketDto>(`ticket/my/${id}`, API.GET);

  getUnreadCount = async () => callAuthApi<number>('ticket/my/unread-count', API.GET);

  reply = async (id: string, payload: TicketReplyDto) =>
    callAuthApi<TicketDto>(`ticket/my/${id}/reply`, API.POST, payload);
}

const instance = new TicketService();
export default instance;
