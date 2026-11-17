import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuth } from '@/auth/store';

/** Préfixe des appels : /api en même origine (relayé vers /trade/v1), ou l'URL publique de l'API. */
export const API_URL = import.meta.env.VITE_API_URL || '/api';

/** Erreur normalisée renvoyée par tous les appels : message lisible + code HTTP. */
export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

const http = axios.create({ baseURL: API_URL });

http.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Un seul rafraîchissement à la fois : les requêtes qui échouent en 401 pendant
// qu'il est en cours attendent son résultat au lieu d'en lancer chacune un.
let refreshEnCours: Promise<string> | null = null;

const rafraichir = async (): Promise<string> => {
  const { refreshToken, setSession } = useAuth.getState();
  if (!refreshToken) throw new Error('Session absente');
  const res = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });
  const data = res.data?.data;
  setSession(data.token, data.refresh_token);
  return data.token;
};

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    // Les routes /auth/ ne rafraîchissent pas la session, sauf le changement de mot de passe,
    // qui exige un jeton valide (un 401 y signale sinon un mot de passe actuel incorrect)
    const estAuth = original?.url?.startsWith('/auth/') && original.url !== '/auth/password';

    if (error.response?.status === 401 && original && !original._retry && !estAuth) {
      original._retry = true;
      const jetonUtilise = useAuth.getState().accessToken;
      try {
        refreshEnCours ??= rafraichir().finally(() => (refreshEnCours = null));
        const token = await refreshEnCours;
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return http(original);
      } catch {
        // Un autre onglet a peut-être rafraîchi la session au même moment (le jeton de
        // rafraîchissement ne sert qu'une fois) : on relit la session avant de déconnecter.
        await useAuth.persist.rehydrate();
        const jetonActuel = useAuth.getState().accessToken;
        if (jetonActuel && jetonActuel !== jetonUtilise) {
          original.headers = { ...original.headers, Authorization: `Bearer ${jetonActuel}` };
          return http(original);
        }
        useAuth.getState().clear();
        window.location.assign('/login');
      }
    }

    let corps = error.response?.data as { message?: string; details?: string[] } | undefined;
    // Réponse attendue en fichier (export) : l'erreur JSON arrive elle aussi sous forme de Blob
    if (corps instanceof Blob) corps = await corps.text().then((t) => JSON.parse(t)).catch(() => undefined);

    let message = corps?.message || error.message || 'Erreur inattendue';
    if (corps?.details?.length) message += ` : ${corps.details.join(' · ')}`;
    if (!error.response) message = "Impossible de joindre l'API. Le backend est-il démarré ?";
    if (error.response?.status === 429) message = 'Trop de requêtes : patientez quelques minutes.';
    return Promise.reject(new ApiError(message, error.response?.status));
  }
);

/** L'API répond { success, message, data } : on ne renvoie que `data`. */
export const api = {
  get: async <T>(url: string, params?: Record<string, unknown>) =>
    (await http.get(url, { params: nettoyer(params) })).data.data as T,
  post: async <T>(url: string, body?: unknown, params?: Record<string, unknown>) =>
    (await http.post(url, body, { params: nettoyer(params) })).data.data as T,
  put: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    (await http.put(url, body, config)).data.data as T,
  patch: async <T>(url: string, body?: unknown) => (await http.patch(url, body)).data.data as T,
  delete: async <T>(url: string) => (await http.delete(url)).data.data as T,
  /** Fichier renvoyé par l'API (export CSV) : téléchargé sous le nom donné par Content-Disposition. */
  telecharger: async (url: string, params?: Record<string, unknown>, nomParDefaut = 'export') => {
    const res = await http.get<Blob>(url, { params: nettoyer(params), responseType: 'blob' });
    const disposition = String(res.headers['content-disposition'] ?? '');
    const nom = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? nomParDefaut;
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(res.data);
    lien.download = nom;
    lien.click();
    URL.revokeObjectURL(lien.href);
  },
  /** Corps brut (classeur .xlsx) : l'API lit le fichier tel quel. */
  fichier: async <T>(url: string, fichier: File, params?: Record<string, unknown>) =>
    (
      await http.post(url, fichier, {
        params: nettoyer(params),
        headers: { 'Content-Type': 'application/octet-stream' },
      })
    ).data.data as T,
};

/** Retire les filtres vides pour ne pas envoyer `?plan=` à l'API. */
function nettoyer(params?: Record<string, unknown>) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
}
