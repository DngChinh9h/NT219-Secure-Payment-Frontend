import { ApiError, apiClient } from "./apiClient";

export interface PublicConfig {
  stripePublishableKey?: string;
  environment: "sandbox" | "production";
  providers: { stripe: boolean; mock_bank: boolean };
  connected: boolean;
}

const FALLBACK_CONFIG: PublicConfig = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true"
  ? { environment: "sandbox", providers: { stripe: true, mock_bank: true }, connected: false }
  : { environment: "production", providers: { stripe: false, mock_bank: false }, connected: false };

export const configService = {
  async getPublicConfig(): Promise<PublicConfig> {
    try {
      const config = await apiClient.get<Partial<PublicConfig> & { providers?: Record<string, boolean> }>("/api/config/public");
      return {
        stripePublishableKey: config.stripePublishableKey,
        environment: config.environment === "sandbox" ? "sandbox" : "production",
        providers: {
          stripe: config.providers?.stripe ?? false,
          mock_bank: config.providers?.mock_bank ?? false,
        },
        connected: true,
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return FALLBACK_CONFIG;
      throw error;
    }
  },
};
