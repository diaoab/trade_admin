import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Plan, Role } from '@/api/types';

export interface Utilisateur {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: Role;
  plan: Plan;
  must_change_password: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  utilisateur: Utilisateur | null;
  setSession: (access: string, refresh: string | undefined, u?: Utilisateur) => void;
  clear: () => void;
}

export const CLE_SESSION = 'trade-admin-auth';

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      utilisateur: null,
      setSession: (accessToken, refreshToken, utilisateur) =>
        set((s) => ({
          accessToken,
          refreshToken: refreshToken ?? s.refreshToken,
          utilisateur: utilisateur ?? s.utilisateur,
        })),
      clear: () => set({ accessToken: null, refreshToken: null, utilisateur: null }),
    }),
    { name: CLE_SESSION }
  )
);

// Synchronisation entre onglets : le jeton de rafraîchissement est à usage unique. Sans
// cela, un onglet garderait un jeton déjà consommé par un autre et serait déconnecté à
// son prochain rafraîchissement ; une déconnexion est aussi répercutée partout.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CLE_SESSION) void useAuth.persist.rehydrate();
  });
}

export const estAdmin = (u: Utilisateur | null) => u?.role === 'admin';
