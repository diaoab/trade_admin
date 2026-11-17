// Règle de l'API pour le mot de passe d'un administrateur (api/services/auth_service.py).

export const LONGUEUR_MIN = 8;

export const REGLE_MDP = `Au moins ${LONGUEUR_MIN} caractères, dont une majuscule et un chiffre.`;

/** Message d'erreur à afficher, ou null si le mot de passe convient. */
export function erreurMotDePasse(nouveau: string, confirmation?: string): string | null {
  if (nouveau.length < LONGUEUR_MIN || !/[A-Z]/.test(nouveau) || !/\d/.test(nouveau)) return REGLE_MDP;
  if (confirmation !== undefined && nouveau !== confirmation) return 'Les deux mots de passe ne correspondent pas.';
  return null;
}
