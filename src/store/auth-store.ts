import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthAccount {
  role: string;
  userId: string;
  label: string;
  description: string;
  redirectPath: string;
  storeName?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface AuthStore {
  user: AuthUser | null;
  accounts: AuthAccount[];
  selectedAccount: AuthAccount | null;
  isAuthenticated: boolean;
  setLoginData: (user: AuthUser, accounts: AuthAccount[]) => void;
  selectAccount: (account: AuthAccount) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accounts: [],
      selectedAccount: null,
      isAuthenticated: false,

      setLoginData: (user, accounts) => {
        // If only one account, auto-select it
        const selectedAccount = accounts.length === 1 ? accounts[0] : null;
        set({
          user,
          accounts,
          selectedAccount,
          isAuthenticated: true,
        });
      },

      selectAccount: (account) => {
        set({ selectedAccount: account });
      },

      logout: () => {
        set({
          user: null,
          accounts: [],
          selectedAccount: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'sharkone-auth',
    }
  )
);
