import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { versPagination, type Compte, type Liste } from '@/api/types';
import { useAuth } from '@/auth/store';
import ResponsiveTable from '@/components/ResponsiveTable';
import { Card, Chips, Empty, ErrorBox, Loader, Pagination, SearchInput, StatutBadge } from '@/components/ui';
import { date, dateHeure, nombre } from '@/lib/format';
import { useFiltres } from '@/lib/hooks';
import { PLANS, ROLES } from '@/lib/labels';

const OFFRES = [
  { value: '', label: 'Tous' },
  { value: 'pro', label: 'Pro' },
  { value: 'free', label: 'Gratuit' },
];

export default function UtilisateursPage() {
  const navigate = useNavigate();
  const moi = useAuth((s) => s.utilisateur);
  const { filtres, page, set, setPage } = useFiltres({ search: '', plan: '', role: '' });

  const q = useQuery({
    queryKey: ['users', filtres, page],
    queryFn: () => api.get<Liste<Compte>>('/admin/users', { ...filtres, page, limit: 20 }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <div className="toolbar">
        <SearchInput value={filtres.search} onChange={(v) => set('search', v)} placeholder="Email…" />
        <Chips options={OFFRES} value={filtres.plan} onChange={(v) => set('plan', v)} />
        <select className="select" value={filtres.role} onChange={(e) => set('role', e.target.value)}>
          <option value="">Tous les rôles</option>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <ErrorBox error={q.error} />
      <Card flush>
        {q.isLoading ? <Loader /> : !q.data?.items.length ? <Empty>Aucun compte</Empty> : (
          <ResponsiveTable
            lignes={q.data.items}
            cleLigne={(u) => u.id}
            onLigne={(u) => navigate(`/utilisateurs/${u.id}`)}
            colonnes={[
              { cle: 'email', titre: 'Email', cellule: (u) => <><strong>{u.email}</strong>{u.id === moi?.id && <span className="muted small"> (vous)</span>}</> },
              { cle: 'plan', titre: 'Offre', mobile: 'badge', cellule: (u) => <StatutBadge table={PLANS} valeur={u.effective_plan} /> },
              { cle: 'role', titre: 'Rôle', cellule: (u) => <StatutBadge table={ROLES} valeur={u.role} /> },
              { cle: 'positions', titre: 'Positions', className: 'right', priorite: 'basse', cellule: (u) => nombre(u.positions) },
              { cle: 'connexion', titre: 'Dernière connexion', className: 'small muted', cellule: (u) => dateHeure(u.last_login_at) },
              { cle: 'cree', titre: 'Inscrit le', className: 'small muted', priorite: 'basse', cellule: (u) => date(u.created_at) },
            ]}
          />
        )}
        <Pagination info={versPagination(q.data?.pagination)} onPage={setPage} />
      </Card>
    </>
  );
}
