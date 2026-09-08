import { Injectable, Logger } from '@nestjs/common';
// A default import, not `import * as`: TypeScript 6 forces esModuleInterop on, and its
// __importStar helper copies only own enumerable properties — @sendgrid/mail exposes
// setApiKey and send on the prototype, so a namespace import loses them at runtime.
import sgMail from '@sendgrid/mail';
import { SecretsService } from '../../secrets/secrets.service';
import { Secrets } from '@secrets/secrets';
import { SendGridDynamicEmailDto, SendGridHtmlEmailDto, SendGridTextEmailDto } from './sendgrid.dto';

const DOMAIN = 'acadimic.com';
const FROM_EMAIL = `noreply@${DOMAIN}`;
const REPLY_TO = 'acadimic.app@gmail.com';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);

  constructor(private readonly secretsService: SecretsService) {
    const apiKey = this.secretsService.get<string>(Secrets.SENDGRID_API_KEY);
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  async sendDynamicEmail(payload: SendGridDynamicEmailDto): Promise<void> {
    try {
      await sgMail.send({
        to: payload.to,
        from: FROM_EMAIL,
        replyTo: REPLY_TO,
        templateId: payload.templateId,
        dynamicTemplateData: payload.dynamicTemplateData,
      });
    } catch (error) {
      this.logger.error('Failed to send dynamic email', error);
      throw error;
    }
  }

  async sendTextEmail(payload: SendGridTextEmailDto): Promise<void> {
    try {
      await sgMail.send({
        to: payload.to,
        from: FROM_EMAIL,
        replyTo: REPLY_TO,
        subject: payload.subject,
        text: payload.text,
      });
    } catch (error) {
      this.logger.error('Failed to send text email', error);
      throw error;
    }
  }

  async sendHtmlEmail(payload: SendGridHtmlEmailDto): Promise<void> {
    try {
      await sgMail.send({
        to: payload.to,
        from: FROM_EMAIL,
        replyTo: REPLY_TO,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
    } catch (error) {
      this.logger.error('Failed to send HTML email', error);
      throw error;
    }
  }
}
