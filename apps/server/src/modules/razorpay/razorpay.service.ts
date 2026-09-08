import { Injectable, Logger } from '@nestjs/common';
import { SecretsService } from '../../secrets/secrets.service';
import { Secrets } from '@secrets/secrets';
import Razorpay from 'razorpay';
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpay: Razorpay;

  constructor(private readonly secretsService: SecretsService) {
    const keyId = this.secretsService.get<string>(Secrets.RAZORPAY_API_KEY);
    const keySecret = this.secretsService.get<string>(Secrets.RAZORPAY_SIGNATURE_SECRET);
    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  async createPlan(payload: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    amount: number;
    currency: string;
    name: string;
    description?: string;
  }) {
    return this.razorpay.plans.create({
      period: payload.period,
      interval: payload.interval,
      item: {
        name: payload.name,
        amount: payload.amount * 100,
        currency: payload.currency,
        description: payload.description,
      },
    });
  }

  async createOrder(payload: { amount: number; currency: string; receipt?: string }) {
    return this.razorpay.orders.create({
      amount: payload.amount * 100,
      currency: payload.currency,
      receipt: payload.receipt,
    });
  }

  validateWebhookSignature(body: string, signature: string): boolean {
    const webhookSecret = this.secretsService.getOrThrow<string>(Secrets.RAZORPAY_WEBHOOK_SECRET);
    try {
      return validateWebhookSignature(body, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Webhook signature validation failed', error);
      return false;
    }
  }
}
