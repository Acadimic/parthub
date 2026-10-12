import { SendGridService } from '@modules/sendgrid/sendgrid.service';
import { UserService } from '@modules/user/user.service';
import { Injectable, Logger } from '@nestjs/common';
import { TICKET_CATEGORY_LABELS, TICKET_REASON_LABELS, TICKET_STATUS_LABELS } from '@repo/shared/utils';
import { Secrets } from '@secrets/secrets';
import { SecretsService } from '../../secrets/secrets.service';
import { type TicketDocument } from './ticket.schema';

/**
 * The emails a ticket sends. Platform staff is the account named by `PRIVATE_API_EMAIL`, the service
 * account the support app's private routes run as, so that is where a payment report goes. Sending
 * never blocks or fails the request that caused it: a deployment without SendGrid simply sends nothing.
 */
@Injectable()
export class TicketMailService {
  private readonly logger = new Logger(TicketMailService.name);

  constructor(
    private readonly secretsService: SecretsService,
    private readonly sendGridService: SendGridService,
    private readonly userService: UserService,
  ) {}

  getPlatformStaffEmails(): string[] {
    const email = this.secretsService.get<string>(Secrets.PRIVATE_API_EMAIL)?.trim().toLowerCase();
    return email ? [email] : [];
  }

  notifyPlatformOfPayment(ticket: TicketDocument): void {
    const to = this.getPlatformStaffEmails();
    if (!to.length) return;
    this.send(
      to,
      `[${ticket.code}] Payment report: ${TICKET_REASON_LABELS[ticket.reason]}`,
      [
        `A learner reported a payment problem about "${ticket.targetName}".`,
        `Reason: ${TICKET_REASON_LABELS[ticket.reason]}`,
        '',
        ticket.body,
        '',
        'Open Tickets in the support app to answer it.',
      ].join('\n'),
    );
  }

  notifyReporterOfReply(ticket: TicketDocument): void {
    void this.sendToReporter(
      ticket,
      `[${ticket.code}] There is a reply to your report`,
      [
        `Your ${TICKET_CATEGORY_LABELS[ticket.category].toLowerCase()} report${this.about(ticket)} has a new reply.`,
        '',
        ticket.messages[ticket.messages.length - 1]?.body ?? '',
        '',
        'Sign in and open Account settings → My reports to read it and reply.',
      ].join('\n'),
    );
  }

  notifyReporterOfClose(ticket: TicketDocument): void {
    void this.sendToReporter(
      ticket,
      `[${ticket.code}] Your report is ${TICKET_STATUS_LABELS[ticket.status].toLowerCase()}`,
      [
        `Your ${TICKET_CATEGORY_LABELS[ticket.category].toLowerCase()} report${this.about(ticket)} is now marked ${TICKET_STATUS_LABELS[ticket.status].toLowerCase()}.`,
        '',
        'If something is still wrong, reply to it from Account settings → My reports within two weeks and it reopens.',
      ].join('\n'),
    );
  }

  private about(ticket: TicketDocument): string {
    return ticket.targetName ? ` about "${ticket.targetName}"` : '';
  }

  private async sendToReporter(ticket: TicketDocument, subject: string, text: string): Promise<void> {
    const user = await this.userService.getUserById(String(ticket.createdBy)).catch(() => null);
    if (user?.email) this.send([user.email], subject, text);
  }

  private send(to: string[], subject: string, text: string): void {
    if (!this.secretsService.get<string>(Secrets.SENDGRID_API_KEY)) return;
    this.sendGridService.sendTextEmail({ to, subject, text }).catch((error: unknown) => {
      this.logger.warn(`Ticket email "${subject}" was not sent: ${String(error)}`);
    });
  }
}
