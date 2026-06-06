import { RefundStatus } from '@vivah/shared';
import { Types } from 'mongoose';

export interface PaymentProvider {
  createCheckoutSession(userId: Types.ObjectId, amountCents: number, currency: string, description: string): Promise<{ checkoutUrl: string; sessionId: string }>;
  refundPayment(paymentId: string, amountCents?: number, reason?: string): Promise<{ providerRefundId: string; status: RefundStatus }>;
  captureWebhook(body: any, signature?: string): Promise<any>;
}

export class PayPalProvider implements PaymentProvider {
  private clientId: string;
  private clientSecret: string;
  private isEnabled: boolean;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID ?? '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? '';
    this.isEnabled = false; // Disabled by default in configuration
  }

  async createCheckoutSession(
    userId: Types.ObjectId,
    amountCents: number,
    currency: string,
    description: string
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    if (!this.isEnabled) {
      throw new Error('PayPal payment provider is currently disabled');
    }
    return {
      checkoutUrl: `https://www.sandbox.paypal.com/checkout?user=${userId.toString()}`,
      sessionId: `paypal_mock_session_${Math.random().toString(36).substring(7)}`,
    };
  }

  async refundPayment(
    paymentId: string,
    amountCents?: number,
    reason?: string
  ): Promise<{ providerRefundId: string; status: RefundStatus }> {
    if (!this.isEnabled) {
      throw new Error('PayPal payment provider is currently disabled');
    }
    return {
      providerRefundId: `paypal_mock_refund_${Math.random().toString(36).substring(7)}`,
      status: RefundStatus.SUCCEEDED,
    };
  }

  async captureWebhook(body: any, signature?: string): Promise<any> {
    if (!this.isEnabled) {
      throw new Error('PayPal payment provider is currently disabled');
    }
    return { received: true };
  }
}

export const paypalProvider = new PayPalProvider();
