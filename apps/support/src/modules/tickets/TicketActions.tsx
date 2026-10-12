import { type TicketDto } from '@repo/shared/contracts';
import { OrderStatus, TicketCategory, TicketStatus } from '@repo/shared/enums';
import { isActiveTicket } from '@repo/shared/utils';
import { Button, TextInput } from '@repo/ui/app';
import { useTicketStore } from '@stores';
import { errorToast, successToast } from '@utils/helpers';
import { useState } from 'react';
import { useSetState } from 'react-use';

/** Move a ticket along: in progress, resolved, dismissed, or back open. */
export const StatusActions = ({ ticket }: { ticket: TicketDto }) => {
  const [isSaving, setIsSaving] = useState(false);
  const setStatus = async (status: TicketStatus) => {
    setIsSaving(true);
    await useTicketStore.getState().setStatus(ticket._id, status);
    setIsSaving(false);
  };
  if (ticket.status && !isActiveTicket(ticket.status)) {
    return (
      <Button isSecondary text="Reopen" isLoading={isSaving} onClick={() => setStatus(TicketStatus.IN_PROGRESS)} />
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button text="Mark resolved" isLoading={isSaving} onClick={() => setStatus(TicketStatus.RESOLVED)} />
      {ticket.status === TicketStatus.OPEN ? (
        <Button
          isSecondary
          text="Mark in progress"
          disabled={isSaving}
          onClick={() => setStatus(TicketStatus.IN_PROGRESS)}
        />
      ) : null}
      <Button isSubtle text="Dismiss" disabled={isSaving} onClick={() => setStatus(TicketStatus.DISMISSED)} />
    </div>
  );
};

interface IRefundState {
  razorpayRefundId: string;
  amount: string;
  isLoading: boolean;
}

/**
 * Records a refund already made in the Razorpay dashboard. The server ends the seats the payment
 * bought and resolves the ticket, so this asks for confirmation through the button label.
 */
export const RefundForm = ({ ticket }: { ticket: TicketDto }) => {
  const [state, setState] = useSetState<IRefundState>({ razorpayRefundId: '', amount: '', isLoading: false });
  if (ticket.category !== TicketCategory.PAYMENT || ticket.status === TicketStatus.RESOLVED) return null;

  const save = async () => {
    const amount = Number(state.amount);
    if (!state.razorpayRefundId.trim().startsWith('rfnd_')) {
      errorToast({ message: 'Paste the Razorpay refund id, which starts with rfnd_.' });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      errorToast({ message: 'Enter the amount refunded.' });
      return;
    }
    setState({ isLoading: true });
    const isSaved = await useTicketStore
      .getState()
      .recordRefund(ticket._id, { razorpayRefundId: state.razorpayRefundId.trim(), amount });
    setState({ isLoading: false });
    if (isSaved) successToast({ message: `Refund recorded. The purchase is marked ${OrderStatus.REFUNDED}.` });
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-sm font-semibold">Record a refund</p>
      <p className="text-xs text-muted-foreground">
        Refund the payment in the Razorpay dashboard first, then record it here. This ends the learner&apos;s access to
        what the payment bought, tells them on the thread and resolves the ticket.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <TextInput
          label="Razorpay refund id"
          placeholder="rfnd_…"
          value={state.razorpayRefundId}
          disabled={state.isLoading}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState({ razorpayRefundId: event.target.value })}
        />
        <TextInput
          label="Amount refunded"
          type="number"
          placeholder="499"
          value={state.amount}
          disabled={state.isLoading}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState({ amount: event.target.value })}
        />
      </div>
      <Button className="self-start" text="Record refund and end access" isLoading={state.isLoading} onClick={save} />
    </div>
  );
};
