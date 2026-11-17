import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import logo from '@/logo.svg';
import { api } from '@/api/client';
import { useAuth } from './store';
import Icon from '@/components/Icon';
import { ErrorBox, toast } from '@/components/ui';
import { erreurMotDePasse, REGLE_MDP } from '@/lib/motDePasse';

type Etape = 'email' | 'code' | 'nouveau';

const SOUS_TITRES: Record<Etape, string> = {
  email: 'Recevez un code par e-mail pour choisir un nouveau mot de passe.',
  code: 'Saisissez le code à 6 chiffres reçu par e-mail.',
  nouveau: 'Choisissez votre nouveau mot de passe.',
};

/** Mot de passe oublié : e-mail → code reçu → nouveau mot de passe, puis reconnexion. */
export default function MotDePasseOubliePage() {
  const navigate = useNavigate();
  const accessToken = useAuth((s) => s.accessToken);
  const [etape, setEtape] = useState<Etape>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<unknown>(null);
  const [envoi, setEnvoi] = useState(false);

  if (accessToken) return <Navigate to="/" replace />;

  const appeler = async (fn: () => Promise<void>) => {
    setErreur(null);
    setEnvoi(true);
    try {
      await fn();
    } catch (err) {
      setErreur(err);
    } finally {
      setEnvoi(false);
    }
  };

  // Même réponse que le compte existe ou non : on passe toujours à l'étape du code
  const demanderCode = (e?: FormEvent) => {
    e?.preventDefault();
    return appeler(async () => {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setCode('');
      setEtape('code');
    });
  };

  const verifierCode = (e: FormEvent) => {
    e.preventDefault();
    return appeler(async () => {
      await api.post('/auth/verify-reset-code', { email: email.trim(), code: code.trim() });
      setEtape('nouveau');
    });
  };

  const changer = (e: FormEvent) => {
    e.preventDefault();
    const invalide = erreurMotDePasse(nouveau, confirmation);
    if (invalide) return setErreur(new Error(invalide));
    return appeler(async () => {
      await api.post('/auth/reset-password', { email: email.trim(), code: code.trim(), new_password: nouveau });
      toast.success('Mot de passe modifié : reconnectez-vous.');
      navigate('/login', { replace: true });
    });
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="oubli-heading">
        <header className="login-card-head">
          <div className="login-card-banniere">
            <span className="login-card-logo">
              <img src={logo} alt="" aria-hidden="true" />
            </span>
          </div>
          <h1 id="oubli-heading" className="login-card-title">Mot de passe oublié</h1>
          <p className="login-card-sub">{SOUS_TITRES[etape]}</p>
        </header>

        {etape === 'email' && (
          <form className="login-form" onSubmit={demanderCode}>
            <ErrorBox error={erreur} />
            <div className="login-field">
              <label className="login-label" htmlFor="oubli-email">Email</label>
              <div className="login-input-wrap">
                <Icon name="mail" size={16} />
                <input
                  id="oubli-email"
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
            <button className="login-submit" disabled={envoi}>{envoi ? 'Envoi…' : 'Recevoir un code'}</button>
          </form>
        )}

        {etape === 'code' && (
          <form className="login-form" onSubmit={verifierCode}>
            <ErrorBox error={erreur} />
            <div className="login-field">
              <label className="login-label" htmlFor="oubli-code">Code</label>
              <div className="login-input-wrap">
                <Icon name="lock" size={16} />
                <input
                  id="oubli-code"
                  className="login-input"
                  inputMode="numeric"
                  autoFocus
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <p className="login-aide">Si un compte existe pour {email.trim()}, un code vient d'y être envoyé. Il est valable 15 minutes.</p>
            </div>
            <button className="login-submit" disabled={envoi || code.length !== 6}>{envoi ? 'Vérification…' : 'Continuer'}</button>
            <div className="login-liens">
              <button type="button" className="btn ghost sm" onClick={() => demanderCode()} disabled={envoi}>Renvoyer le code</button>
              <button type="button" className="btn ghost sm" onClick={() => setEtape('email')}>Changer d'e-mail</button>
            </div>
          </form>
        )}

        {etape === 'nouveau' && (
          <form className="login-form" onSubmit={changer}>
            <ErrorBox error={erreur} />
            <div className="login-field">
              <label className="login-label" htmlFor="oubli-nouveau">Nouveau mot de passe</label>
              <div className="login-input-wrap">
                <Icon name="lock" size={16} />
                <input
                  id="oubli-nouveau"
                  className="login-input"
                  type="password"
                  autoFocus
                  autoComplete="new-password"
                  value={nouveau}
                  onChange={(e) => setNouveau(e.target.value)}
                  required
                />
              </div>
              <p className="login-aide">{REGLE_MDP}</p>
            </div>
            <div className="login-field">
              <label className="login-label" htmlFor="oubli-confirmation">Confirmation</label>
              <div className="login-input-wrap">
                <Icon name="lock" size={16} />
                <input
                  id="oubli-confirmation"
                  className="login-input"
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                />
              </div>
            </div>
            <button className="login-submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Changer le mot de passe'}</button>
          </form>
        )}

        <p className="login-card-foot">
          <Link to="/login">Retour à la connexion</Link>
        </p>
      </section>
    </main>
  );
}
