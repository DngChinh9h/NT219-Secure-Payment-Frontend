// Service layer: thin wrappers around the in-memory store. When connecting to a
// real backend, replace these implementations with fetch() calls against the
// API base URL exposed by configService. Components should depend on these
// services rather than the store directly.

import { PUBLIC_CONFIG, type PublicConfig } from "../lib/config";

export const configService = {
  async getPublicConfig(): Promise<PublicConfig> {
    return PUBLIC_CONFIG;
  },
};

export const authService = {
  // Token handling would be centralized here. For the demo, the store owns
  // the user object; replace with token-based session retrieval when wiring
  // a real API.
  storageKey: "securepay.token",
  getToken(): string | null {
    return localStorage.getItem(this.storageKey);
  },
  setToken(token: string): void {
    localStorage.setItem(this.storageKey, token);
  },
  clearToken(): void {
    localStorage.removeItem(this.storageKey);
  },
};

// productService, cartService, orderService, paymentService, transactionService,
// receiptService, and adminService are intentionally implemented as thin
// passthroughs over the AppProvider store in this demo. See src/app/lib/store.tsx
// for the underlying operations.
export { useApp as useStoreServices } from "../lib/store";
