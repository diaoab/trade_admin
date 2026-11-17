// Libellés et couleurs des valeurs renvoyées par l'API.

export type Ton = 'gris' | 'bleu' | 'vert' | 'orange' | 'rouge' | 'violet' | 'cyan';

export const ROLES: Record<string, { label: string; ton: Ton }> = {
  user: { label: 'Utilisateur', ton: 'gris' },
  admin: { label: 'Administrateur', ton: 'violet' },
};

export const PLANS: Record<string, { label: string; ton: Ton }> = {
  free: { label: 'Gratuit', ton: 'gris' },
  pro: { label: 'Pro', ton: 'vert' },
};

export const STATUTS_COMPTE: Record<string, { label: string; ton: Ton }> = {
  active: { label: 'Actif', ton: 'vert' },
  inactive: { label: 'Désactivé', ton: 'rouge' },
};

/** Statuts des factures PayDunya. */
export const STATUTS_PAIEMENT: Record<string, { label: string; ton: Ton }> = {
  pending: { label: 'En attente', ton: 'orange' },
  completed: { label: 'Payé', ton: 'vert' },
  cancelled: { label: 'Annulé', ton: 'gris' },
  failed: { label: 'Échoué', ton: 'rouge' },
};
