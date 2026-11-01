/** Montant en franc CFA (pas de décimales). */
export const montant = (valeur?: number | string | null) => {
  if (valeur === null || valeur === undefined || valeur === '') return '—';
  return `${Number(valeur).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`;
};

export const nombre = (valeur?: number | null) =>
  valeur === null || valeur === undefined ? '—' : valeur.toLocaleString('fr-FR');

/** Score entre 0 et 1, affiché avec deux décimales (ROC AUC, précision…). */
export const score = (valeur?: number | null) =>
  valeur === null || valeur === undefined ? '—' : valeur.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const date = (valeur?: string | null) =>
  valeur ? new Date(valeur).toLocaleDateString('fr-FR') : '—';

export const dateHeure = (valeur?: string | null) =>
  valeur
    ? new Date(valeur).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

/** Nombre de jours écoulés depuis une date (historique en retard, dernière connexion…). */
export const joursDepuis = (valeur?: string | null) =>
  valeur ? Math.floor((Date.now() - new Date(valeur).getTime()) / 86_400_000) : null;

export const initiales = (email?: string | null) => (email?.[0] ?? 'A').toUpperCase();
