export interface PublicConfig {
  environment: "sandbox" | "production";
  apiBaseUrl: string;
  frontendVersion: string;
  stripePublishableKeyConfigured: boolean;
  providers: { stripe: boolean; sandboxBank: boolean };
}

export const PUBLIC_CONFIG: PublicConfig = {
  environment: "sandbox",
  apiBaseUrl: "https://api.securepay.example/v1",
  frontendVersion: "v0.9.0",
  stripePublishableKeyConfigured: true,
  providers: { stripe: true, sandboxBank: true },
};

export const isSandbox = (): boolean => PUBLIC_CONFIG.environment === "sandbox";
