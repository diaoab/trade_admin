// Formes des objets renvoyés par l'API trade_back (api/services/admin/).

import type { PaginationInfo } from '@/components/ui';

export interface PageApi {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Liste<T> {
  items: T[];
  pagination: PageApi;
}

/** Pagination de l'API → format du composant <Pagination>. */
export const versPagination = (p?: PageApi): PaginationInfo | undefined =>
  p && { totalItems: p.total, totalPages: p.pages, currentPage: p.page, pageSize: p.limit };

export type Role = 'user' | 'admin';
export type Plan = 'free' | 'pro';

export interface Compte {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: Role;
  is_active: boolean;
  /** Admin créé avec un mot de passe provisoire, pas encore changé. */
  must_change_password: boolean;
  plan: Plan;
  effective_plan: Plan;
  pro_until: string | null;
  created_at: string;
  last_login_at: string | null;
  positions: number;
}

export interface PaiementCompte {
  id: number;
  amount: number;
  status: string;
  applied: boolean;
  created_at: string;
}

export interface CompteDetail extends Compte {
  positions_detail: { id: number; symbol: string; quantity: number; buy_price: number; buy_date: string }[];
  payments: PaiementCompte[];
  assistant_questions: number;
}

/** Champs modifiables d'un compte (PATCH /admin/users/:id) ; null efface le champ. */
export interface CompteModif {
  plan?: Plan;
  role?: Role;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}

export interface NouvelAdmin {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

/** Nom affiché d'un compte : prénom et nom, sinon l'e-mail. */
export const nomCompte = (u: Pick<Compte, 'email' | 'first_name' | 'last_name'>) =>
  [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email;

export interface Paiement extends PaiementCompte {
  user_id: number;
  email: string;
}

export interface Stats {
  users: { total: number; pro: number; admins: number; inactive: number; new_7d: number; new_30d: number; active_7d: number };
  signups: { day: string; count: number }[];
  payments: { completed: number; pending: number; revenue_total: number; revenue_30d: number };
  assistant: { today: number; last_7d: number };
  positions: number;
  structures: number;
  model: { name: string | null; trained_at: string | null; roc_auc: number | null; beats_baseline: boolean | null };
}

export interface Structure {
  symbol: string;
  name: string;
  dividends: number;
  rows: number;
  first_date: string | null;
  last_date: string | null;
  error: string | null;
}

export interface FicheModele {
  trained_at: string;
  model: string;
  target_horizon_days: number;
  structures: string[];
  rows_train_val: number;
  rows_test: number;
  cv_roc_auc_mean: number;
  test_scores: Record<string, number>;
  baseline_accuracy: number;
  beats_baseline: boolean;
}

export interface EtatModele {
  metadata: FicheModele | null;
  training: boolean;
}
