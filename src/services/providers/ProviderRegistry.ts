import { MarketDataProvider } from '../../types/provider';
import { DemoProvider } from './DemoProvider';
import { ManualImportProvider } from './ManualImportProvider';
import { ExternalProviderAdapter } from './ExternalProviderAdapter';

export class ProviderRegistry {
  private providers: Map<string, MarketDataProvider> = new Map();

  constructor() {
    this.register(new DemoProvider());
    this.register(new ManualImportProvider());
    this.register(new ExternalProviderAdapter());
  }

  register(provider: MarketDataProvider) {
    this.providers.set(provider.id, provider);
  }

  get(providerId: string): MarketDataProvider | undefined {
    return this.providers.get(providerId);
  }

  list(): MarketDataProvider[] {
    return Array.from(this.providers.values());
  }

  getDefaultProvider(): MarketDataProvider {
    return this.get('demo_synthetic_provider') || this.list()[0];
  }
}

export const providerRegistry = new ProviderRegistry();
