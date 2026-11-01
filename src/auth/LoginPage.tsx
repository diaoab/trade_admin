import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import logo from '@/logo.svg';
import { api } from '@/api/client';
import { estAdmin, useAuth, type Utilisateur } from './store';
import Icon from '@/components/Icon';
import { ErrorBox } from '@/components/ui';

interface LoginResponse {
  token: string;
  refresh_token: string;
  user: Utilisateur;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { accessToken, setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [erreur, setErreur] = useState<unknown>(null);
  const [envoi, setEnvoi] = useState(false);

  if (accessToken) return <Navigate to="/" replace />;

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password });
      if (!estAdmin(res.user)) {
        // La session ouverte côté API est refermée aussitôt
        await api.post('/auth/logout', { refresh_token: res.refresh_token }).catch(() => undefined);
        throw new Error("Ce compte n'a pas accès à l'administration.");
      }
      setSession(res.token, res.refresh_token, res.user);
      navigate('/', { replace: true });
    } catch (err) {
      setErreur(err);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <header className="login-card-head">
          <div className="login-card-banniere">
            <span className="login-card-logo">
              <img src={logo} alt="" aria-hidden="true" />
            </span>
          </div>
          <h1 id="login-heading" className="login-card-title">Financial AI Advisor</h1>
          <p className="login-card-sub">Administration du service</p>
        </header>

        <form className="login-form" onSubmit={soumettre}>
          <ErrorBox error={erreur} />

          <div className="login-field">
            <label className="login-label" htmlFor="login-email">Email</label>
            <div className="login-input-wrap">
              <Icon name="mail" size={16} />
              <input
                id="login-email"
                className="login-input"
                type="email"
                autoFocus
                autoComplete="username"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-password">Mot de passe</label>
            <div className="login-input-wrap">
              <Icon name="lock" size={16} />
              <input
                id="login-password"
                className="login-input"
                type={passwordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="login-password-toggle"
                type="button"
                aria-label={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                aria-pressed={passwordVisible}
                onClick={() => setPasswordVisible((visible) => !visible)}
              >
                <Icon name={passwordVisible ? 'eye-off' : 'eye'} size={15} />
              </button>
            </div>
          </div>

          <button className="login-submit" disabled={envoi}>
            {envoi ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="login-card-foot">
          Accès réservé aux administrateurs
          <br />© {new Date().getFullYear()} Financial AI Advisor · Administration
        </p>
      </section>
    </main>
  );
}
