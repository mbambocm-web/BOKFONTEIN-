export interface PaymentSession {
  id: string;
  url: string;
  amount: number;
}

export class PaymentService {
  async createTopUpSession(amount: number, currency: string = 'ZAR'): Promise<PaymentSession> {
    // PRODUCTION: Call your backend to create a Paystack/Stripe Checkout Session
    console.log(`Creating ${currency} ${amount} session with gateway...`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `pay_${Date.now()}`,
          url: 'https://checkout.paystack.com/mock-session',
          amount
        });
      }, 1500);
    });
  }

  async verifyTransaction(reference: string): Promise<boolean> {
    // PRODUCTION: Verify transaction status via Webhook or API
    return true;
  }
}

export const paymentService = new PaymentService();