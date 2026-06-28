import { create } from "zustand";
import { persist } from "zustand/middleware";

type Credentials = {
  email: string;
  password: string;
};

type LoginInput = Credentials;

type AuthState = {
  registeredUser: Credentials | null;
  isAuthenticated: boolean;
  registerAndLogin: (input: Credentials) => { success: true };
  login: (input: LoginInput) => { success: true } | { success: false; error: string };
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      registeredUser: null,
      isAuthenticated: false,
      registerAndLogin: (input) => {
        set({
          registeredUser: {
            email: input.email.trim().toLowerCase(),
            password: input.password,
          },
          isAuthenticated: true,
        });

        return { success: true };
      },
      login: (input) => {
        const registeredUser = get().registeredUser;

        if (!registeredUser) {
          return { success: false, error: "No account has been set up yet." };
        }

        const email = input.email.trim().toLowerCase();

        if (registeredUser.email !== email || registeredUser.password !== input.password) {
          return { success: false, error: "The email or password does not match the saved account." };
        }

        set({ isAuthenticated: true });
        return { success: true };
      },
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: "engintel-auth",
      partialize: (state) => ({
        registeredUser: state.registeredUser,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
