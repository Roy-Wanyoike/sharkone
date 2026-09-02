import { registerCourier } from './index';
import { MockG4SProvider } from './providers/mock-g4s';
import { MockDHLProvider } from './providers/mock-dhl';
import { InternalCourierProvider } from './providers/internal';

export function registerCourierProviders() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Always register internal delivery
  registerCourier(new InternalCourierProvider());

  // Mock providers for development
  if (!isProduction) {
    registerCourier(new MockG4SProvider());
    registerCourier(new MockDHLProvider());
  }

  // TODO: Register real G4S provider in production
  // if (process.env.G4S_API_KEY) {
  //   registerCourier(new G4SProvider({
  //     apiKey: process.env.G4S_API_KEY,
  //     apiUrl: process.env.G4S_API_URL,
  //   }));
  // }

  // TODO: Register real DHL provider in production
  // if (process.env.DHL_API_KEY) {
  //   registerCourier(new DHLProvider({
  //     apiKey: process.env.DHL_API_KEY,
  //     apiUrl: process.env.DHL_API_URL,
  //   }));
  // }
}
