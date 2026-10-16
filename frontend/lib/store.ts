import { create } from "zustand";
import type { User } from "./api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("candidatia_token", token);
      localStorage.setItem("candidatia_user", JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true });
  },

  setUser: (user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("candidatia_user", JSON.stringify(user));
    }
    set({ user });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("candidatia_token");
      localStorage.removeItem("candidatia_user");
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("candidatia_token");
    const userStr = localStorage.getItem("candidatia_user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isAuthenticated: true });
      } catch {
        // ignore
      }
    }
  },
}));