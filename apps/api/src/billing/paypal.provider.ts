import { RefundStatus } from '@vivah/shared';
import type { Types } from 'mongoose';

export interface PaymentProvider {
  createCheckoutSession(userId: Types.ObjectId, amountCents: number, currency: string, description: string): Promise<{ checkoutUrl: string; sessionId: string }>;
  refundPayment(paymentId: string, amountCents?: number, reason?: string): Promise<{ providerRefundId: string; status: RefundStatus }>;
  captureWebhook(body: unknown, signature?: string): Promise<unknown>;
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

  createCheckoutSession(
    userId: Types.ObjectId,
    _amountCents: number,
    _currency: string,
    _description: string
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    if (!this.isEnabled) {
      return Promise.reject(new Error('PayPal payment provider is currently disabled'));
    }
    return Promise.resolve({
      checkoutUrl: `https://www.sandbox.paypal.com/checkout?user=${userId.toString()}`,
      sessionId: `paypal_mock_session_${Math.random().toString(36).substring(7)}`,
    });
  }

  refundPayment(
    _paymentId: string,
    _amountCents?: number,
    _reason?: string
  ): Promise<{ providerRefundId: string; status: RefundStatus }> {
    if (!this.isEnabled) {
      return Promise.reject(new Error('PayPal payment provider is currently disabled'));
    }
    return Promise.resolve({
      providerRefundId: `paypal_mock_refund_${Math.random().toString(36).substring(7)}`,
      status: RefundStatus.SUCCEEDED,
    });
  }

  captureWebhook(_body: unknown, _signature?: string): Promise<unknown> {
    if (!this.isEnabled) {
      return Promise.reject(new Error('PayPal payment provider is currently disabled'));
    }
    return Promise.resolve({ received: true });
  }
}

export const paypalProvider = new PayPalProvider();
