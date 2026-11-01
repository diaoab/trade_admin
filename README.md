# Financial AI Advisor — Administration

Back-office de l'API [trade_back](../trade_back) : comptes, paiements PayDunya,
historiques des titres et modèle. Réservé aux comptes au rôle `admin`.
Même structure que `Yobante-colis-admin`.

## Stack

Vite · React 19 · TypeScript · React Router · TanStack Query · axios · zustand.

## Démarrage

```bash
npm install
cp .env.example .env     # ajuster VITE_API_PROXY_TARGET si l'API n'est pas sur :8000
npm run dev              # http://localhost:5176
```

L'API doit tourner à côté (`../trade_back`, `python -m uvicorn api.main:app`).
Le navigateur appelle `/api/...` ; le serveur Vite relaie vers `/trade/v1/...`
de l'API : aucun CORS à configurer.

Compte local : `python -m api.scripts.seed_dev` dans `trade_back` crée
`admin@example.com` (mot de passe affiché par le script). Pour un compte
existant : `python -m api.scripts.grant_admin <email>`.

## Écrans

| Menu | Fonctions |
|---|---|
| Tableau de bord | Comptes, Pro, connectés, encaissé, questions à l'assistant, inscriptions sur 30 jours, état du modèle |
| Utilisateurs | Liste filtrable (email, offre, rôle) ; fiche : portefeuille, paiements, offrir/retirer Pro, déconnecter tous les appareils, donner/retirer l'accès admin |
| Paiements | Factures PayDunya filtrées par statut |
| Historiques | Titres, étendue de l'historique, retard de la dernière séance, import d'un classeur .xlsx, cours du jour |
| Modèle | Dernier entraînement, scores de test contre la référence naïve, réentraînement |

## Qualité et sécurité

| Commande | Rôle |
|---|---|
| `npm run type-check` | TypeScript strict |
| `npm run lint` | ESLint (règles des hooks React, pas de `any`) |
| `npm test` | Vitest + Testing Library |
| `npm run verify` | Les trois, puis le build de production |

- **CSP** générée au build dans `index.html` (`src/lib/csp.ts`) ; `frame-ancestors`,
  HSTS et `Permissions-Policy` envoyés par Nginx (`deploy/nginx-admin.conf`).
- **Session** synchronisée entre onglets (le jeton de rafraîchissement est à usage unique).
- Les droits réels sont vérifiés par l'API : masquer un bouton ici n'est qu'un confort.

## Déploiement (VPS)

1. Copier `deploy/nginx-admin.conf` dans `/etc/nginx/sites-available/`, remplacer
   `admin.exemple.com`, obtenir le certificat, activer le site.
2. Secrets GitHub : `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `ADMIN_DOMAIN`
   (et `VITE_API_URL` seulement si l'API n'est pas relayée sous `/api`).
3. Chaque push sur `main` dont la CI passe est construit et copié dans
   `/var/www/trade-admin` (`.github/workflows/deploy.yml`).
