import paypal from '@paypal/checkout-server-sdk';
import { env } from '../env.js';

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID || 'mock_client_id';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'mock_client_secret';

  return env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

export const paypalClient = new paypal.core.PayPalHttpClient(environment());

export async function createPayPalOrder(amount: number, currency: string = 'AUD') {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
      },
    ],
  });

  const response = await paypalClient.execute(request);
  return response.result;
}

export async function capturePayPalOrder(orderId: string) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});
  const response = await paypalClient.execute(request);
  return response.result;
}
