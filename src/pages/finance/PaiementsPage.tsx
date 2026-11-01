import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { versPagination, type Liste, type Paiement } from '@/api/types';
import ResponsiveTable from '@/components/ResponsiveTable';
import { Card, Chips, Empty, ErrorBox, Loader, Pagination, StatutBadge } from '@/components/ui';
import { dateHeure, montant } from '@/lib/format';
import { useFiltres } from '@/lib/hooks';
import { STATUTS_PAIEMENT } from '@/lib/labels';

const FILTRES = [
  { value: '', label: 'Tous' },
  ...Object.entries(STATUTS_PAIEMENT).map(([value, s]) => ({ value, label: s.label })),
];

export default function PaiementsPage() {
  const { filtres, page, set, setPage } = useFiltres({ status: '' });

  const q = useQuery({
    queryKey: ['payments', filtres, page],
    queryFn: () => api.get<Liste<Paiement>>('/admin/payments', { ...filtres, page, limit: 20 }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <div className="toolbar">
        <Chips options={FILTRES} value={filtres.status} onChange={(v) => set('status', v)} />
      </div>

      <ErrorBox error={q.error} />
      <Card flush>
        {q.isLoading ? <Loader /> : !q.data?.items.length ? <Empty>Aucun paiement</Empty> : (
          <ResponsiveTable
            lignes={q.data.items}
            cleLigne={(p) => p.id}
            colonnes={[
              { cle: 'compte', titre: 'Compte', cellule: (p) => <Link to={`/utilisateurs/${p.user_id}`}>{p.email}</Link> },
              { cle: 'montant', titre: 'Montant', className: 'right', cellule: (p) => montant(p.amount) },
              { cle: 'statut', titre: 'Statut', cellule: (p) => <StatutBadge table={STATUTS_PAIEMENT} valeur={p.status} /> },
              { cle: 'applique', titre: 'Pro prolongé', className: 'small', priorite: 'basse', cellule: (p) => (p.applied ? 'Oui' : 'Non') },
              { cle: 'date', titre: 'Date', className: 'small muted', cellule: (p) => dateHeure(p.created_at) },
            ]}
          />
        )}
        <Pagination info={versPagination(q.data?.pagination)} onPage={setPage} />
      </Card>
    </>
  );
}
