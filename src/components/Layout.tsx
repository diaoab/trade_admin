import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { Loader } from './ui';
import ErrorBoundary from './ErrorBoundary';
import logo from '@/logo.svg';
import { useAuth } from '@/auth/store';
import { api } from '@/api/client';
import { nomCompte } from '@/api/types';
import { ROLES } from '@/lib/labels';
import ChangerMotDePasseModal from '@/auth/ChangerMotDePasseModal';
import { initiales } from '@/lib/format';
import { MOBILE, useMediaQuery } from '@/lib/hooks';

type Page = { to: string; label: string; icon: string; sub: string; section?: string };
type Entree = { section: string } | Page;

const NAV: Entree[] = [
  { section: 'Pilotage' },
  { to: '/', label: 'Tableau de bord', icon: 'layout-dashboard', sub: "Vue d'ensemble du service" },
  { section: 'Comptes' },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: 'users', sub: 'Comptes, offre, rôle et statut' },
  { to: '/paiements', label: 'Paiements', icon: 'credit-card', sub: 'Factures PayDunya' },
  { section: 'Données & modèle' },
  { to: '/historiques', label: 'Historiques', icon: 'database', sub: 'Cours des titres, import et cours du jour' },
  { to: '/modele', label: 'Modèle', icon: 'cpu', sub: 'Dernier entraînement et réentraînement' },
];

// Chaque page retient sa section, pour le fil d'Ariane du bandeau (« Comptes › Utilisateurs »)
const PAGES: Page[] = NAV.reduce<{ section?: string; pages: Page[] }>(
  (acc, e) => ('section' in e ? { ...acc, section: e.section } : { ...acc, pages: [...acc.pages, { ...e, section: acc.section }] }),
  { pages: [] }
).pages;

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { utilisateur, refreshToken, clear } = useAuth();
  const [ouvert, setOuvert] = useState(false);
  const [compte, setCompte] = useState(false);
  const [motDePasse, setMotDePasse] = useState(false);
  const zoneCompte = useRef<HTMLDivElement>(null);
  // Le tiroir n'existe que sur mobile : au-delà, le menu est toujours affiché
  const mobile = useMediaQuery(MOBILE);
  const tiroir = ouvert && mobile;
  const burger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);

  // Fermés à chaque changement de page (lien, retour arrière, redirection)
  useEffect(() => {
    setOuvert(false);
    setCompte(false);
  }, [pathname]);

  // Menu du compte : un clic ailleurs ou Échap le referme
  useEffect(() => {
    if (!compte) return;
    const clic = (e: MouseEvent) => !zoneCompte.current?.contains(e.target as Node) && setCompte(false);
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && setCompte(false);
    document.addEventListener('mousedown', clic);
    document.addEventListener('keydown', echap);
    return () => {
      document.removeEventListener('mousedown', clic);
      document.removeEventListener('keydown', echap);
    };
  }, [compte]);

  // Tiroir ouvert : Échap le ferme, la page derrière ne défile plus, le focus
  // entre dans le menu puis revient au bouton à la fermeture
  useEffect(() => {
    if (!tiroir) return;
    const bouton = burger.current;
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false);
    document.addEventListener('keydown', echap);
    document.documentElement.classList.add('tiroir-ouvert');
    menu.current?.querySelector<HTMLElement>('a')?.focus();
    return () => {
      document.removeEventListener('keydown', echap);
      document.documentElement.classList.remove('tiroir-ouvert');
      bouton?.focus();
    };
  }, [tiroir]);

  // Page courante : la plus longue route qui préfixe l'URL (/utilisateurs/12 → Utilisateurs)
  const page =
    PAGES.filter((p) => (p.to === '/' ? pathname === '/' : pathname.startsWith(p.to))).sort(
      (a, b) => b.to.length - a.to.length
    )[0] ?? PAGES[0];

  const deconnexion = async () => {
    try {
      await api.post('/auth/logout', { refresh_token: refreshToken });
    } catch {
      // La session locale est effacée même si l'API ne répond pas
    }
    clear();
    navigate('/login');
  };

  return (
    <div className="app">
      {tiroir && <div className="sb-voile" onClick={() => setOuvert(false)} />}
      <aside id="menu-principal" ref={menu} className={`sb${tiroir ? ' open' : ''}`} aria-label="Menu principal">
        <Link to="/" className="sb-top" title="Financial AI Advisor" onClick={() => setOuvert(false)}>
          <img className="sb-logo" src={logo} alt="Financial AI Advisor" />
          <div>
            <div className="sb-name">
              Financial <span>AI</span>
            </div>
            <div className="sb-sub">Administration</div>
          </div>
        </Link>
        <nav className="nav">
          {NAV.map((e, i) =>
            'section' in e ? (
              <div key={i} className="nav-section">
                {e.section}
              </div>
            ) : (
              <NavLink
                key={e.to}
                to={e.to}
                end={e.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                title={e.label}
                onClick={() => setOuvert(false)}
              >
                <Icon name={e.icon} size={17} />
                <span className="nav-label">{e.label}</span>
              </NavLink>
            )
          )}
        </nav>
      </aside>

      {/* Tiroir ouvert : le reste de la page est inerte (focus piégé dans le menu) */}
      <div className="main" inert={tiroir}>
        <header className="topbar">
          <button ref={burger} className="btn ghost sm burger" onClick={() => setOuvert((o) => !o)} aria-label="Menu"
            aria-expanded={tiroir} aria-controls="menu-principal">
            <Icon name="menu" size={20} />
          </button>
          <nav className="ariane" aria-label="Fil d'Ariane">
            <ol>
              {page.section && (
                <>
                  <li className="ariane-groupe">{page.section}</li>
                  <li className="ariane-groupe ariane-sep" aria-hidden="true">
                    <Icon name="chevron-right" size={14} />
                  </li>
                </>
              )}
              <li className="page-title" aria-current="page" title={page.sub}>
                {page.label}
              </li>
            </ol>
          </nav>
          <div className="topbar-right">
            <div className="compte" ref={zoneCompte}>
              <button
                className={`compte-btn${compte ? ' ouvert' : ''}`}
                onClick={() => setCompte((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={compte}
                title="Mon compte"
              >
                <span className="ava">{initiales(utilisateur?.email)}</span>
                <span className="user-info">
                  <span className="user-name">{utilisateur ? nomCompte(utilisateur) : ''}</span>
                  <span className="user-role">{ROLES[utilisateur?.role ?? '']?.label ?? utilisateur?.role}</span>
                </span>
                <Icon name="chevron-right" size={14} className="compte-chevron" />
              </button>
              {compte && (
                <div className="compte-menu" role="menu">
                  <div className="compte-entete">
                    <span className="ava">{initiales(utilisateur?.email)}</span>
                    <span className="user-info">
                      <span className="user-name">{utilisateur ? nomCompte(utilisateur) : ''}</span>
                      <span className="user-role">{ROLES[utilisateur?.role ?? '']?.label}</span>
                    </span>
                  </div>
                  <button
                    role="menuitem"
                    className="compte-item"
                    onClick={() => {
                      setCompte(false);
                      setMotDePasse(true);
                    }}
                  >
                    <Icon name="lock" size={16} />
                    Changer mon mot de passe
                  </button>
                  <button role="menuitem" className="compte-item danger" onClick={deconnexion}>
                    <Icon name="log-out" size={16} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="content">
          {/* La barre latérale reste affichée pendant le chargement d'une page */}
          <ErrorBoundary cle={pathname}>
            <Suspense fallback={<Loader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
      {motDePasse && <ChangerMotDePasseModal onClose={() => setMotDePasse(false)} />}
    </div>
  );
}
