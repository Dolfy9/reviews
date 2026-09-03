import { create } from "zustand";
import { UserDto } from "@product-reviews/shared";

interface AuthState {
  user: UserDto | null;
  setUser: (user: UserDto | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
