import { registerProvider } from './index';
import { MockMpesaProvider } from './providers/mock-mpesa';
import { MockStripeProvider } from './providers/mock-stripe';

export function registerPaymentProviders() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Mock providers for development
  if (!isProduction) {
    registerProvider('MOCK_MPESA', new MockMpesaProvider());
    registerProvider('MOCK_STRIPE', new MockStripeProvider());
  }

  // TODO: Register real providers in production
  // if (process.env.MPESA_CONSUMER_KEY) {
  //   registerProvider('DARAJA', new DarajaProvider({
  //     consumerKey: process.env.MPESA_CONSUMER_KEY,
  //     consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  //     passKey: process.env.MPESA_PASSKEY,
  //     businessShortCode: process.env.MPESA_BUSINESS_SHORTCODE,
  //   }));
  // }
}
