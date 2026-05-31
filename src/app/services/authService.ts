import type { User } from "../lib/types";
import { apiClient, authStorage } from "./apiClient";

interface AuthResponse {
  token: string;
  user: { id: string; email: string; role: "customer" | "admin" };
}

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  address: string;
  citizenId: string;
}

function withProfile(user: AuthResponse["user"], profile?: Partial<User>): User {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: profile?.fullName || user.email.split("@")[0],
    address: profile?.address,
    citizenId: profile?.citizenId,
  };
}

function saveSession(token: string, user: User) {
  localStorage.setItem(authStorage.TOKEN_KEY, token);
  localStorage.setItem(authStorage.USER_KEY, JSON.stringify(user));
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const result = await apiClient.post<AuthResponse>("/api/auth/login", { email, password });
    const user = withProfile(result.user);
    saveSession(result.token, user);
    return user;
  },

  async register(input: RegisterInput): Promise<User> {
    const result = await apiClient.post<AuthResponse>("/api/auth/register", {
      email: input.email,
      password: input.password,
      fullName: input.fullName,
      address: input.address,
      cccdNumber: input.citizenId,
    });
    const user = withProfile(result.user, input);
    saveSession(result.token, user);
    return user;
  },

  getToken(): string | null {
    return localStorage.getItem(authStorage.TOKEN_KEY);
  },

  getStoredUser(): User | null {
    const raw = localStorage.getItem(authStorage.USER_KEY);
    if (!raw || !this.getToken()) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      this.logout();
      return null;
    }
  },

  logout() {
    authStorage.clearStoredSession();
  },
};
