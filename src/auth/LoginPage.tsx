import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import logo from '@/logo.svg';
import { api } from '@/api/client';
import { estAdmin, useAuth, type Utilisateur } from './store';
import Icon from '@/components/Icon';
import { ErrorBox } from '@/components/ui';
import { erreurMotDePasse } from '@/lib/motDePasse';

interface Session {
  token: string;
  refresh_token: string;
}

interface LoginResponse extends Session {
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
  // Admin créé avec un mot de passe provisoire : il le change avant d'entrer
  const [provisoire, setProvisoire] = useState<LoginResponse | null>(null);
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');

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
      if (res.user.must_change_password) {
        setProvisoire(res);
        return;
      }
      setSession(res.token, res.refresh_token, res.user);
      navigate('/', { replace: true });
    } catch (err) {
      setErreur(err);
    } finally {
      setEnvoi(false);
    }
  };

  const changerMotDePasse = async (e: FormEvent) => {
    e.preventDefault();
    if (!provisoire) return;
    setErreur(null);
    const invalide = erreurMotDePasse(nouveau, confirmation);
    if (invalide) return setErreur(new Error(invalide));
    setEnvoi(true);
    try {
      // La session n'est pas encore enregistrée : le jeton est passé à la main
      const session = await api.put<Session>(
        '/auth/password',
        { current_password: password, new_password: nouveau },
        { headers: { Authorization: `Bearer ${provisoire.token}` } }
      );
      setSession(session.token, session.refresh_token, { ...provisoire.user, must_change_password: false });
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

        {provisoire ? (
          <form className="login-form" onSubmit={changerMotDePasse}>
            <p className="login-card-sub">
              Votre mot de passe est provisoire : choisissez-en un nouveau pour accéder à l'administration.
            </p>
            <ErrorBox error={erreur} />

            <div className="login-field">
              <label className="login-label" htmlFor="login-nouveau">Nouveau mot de passe</label>
              <div className="login-input-wrap">
                <Icon name="lock" size={16} />
                <input
                  id="login-nouveau"
                  className="login-input"
                  type="password"
                  autoFocus
                  autoComplete="new-password"
                  placeholder="8 caractères, une majuscule, un chiffre"
                  value={nouveau}
                  onChange={(e) => setNouveau(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="login-confirmation">Confirmation</label>
              <div className="login-input-wrap">
                <Icon name="lock" size={16} />
                <input
                  id="login-confirmation"
                  className="login-input"
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="login-submit" disabled={envoi}>
              {envoi ? 'Enregistrement…' : 'Changer le mot de passe'}
            </button>
          </form>
        ) : (
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

            <Link className="login-forgot" to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>

            <button className="login-submit" disabled={envoi}>
              {envoi ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        )}

        <p className="login-card-foot">
          Accès réservé aux administrateurs
          <br />© {new Date().getFullYear()} Financial AI Advisor · Administration
        </p>
      </section>
    </main>
  );
}
