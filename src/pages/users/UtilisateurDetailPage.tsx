import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import type { CompteDetail, Plan, Role } from '@/api/types';
import { useAuth } from '@/auth/store';
import Icon from '@/components/Icon';
import ResponsiveTable from '@/components/ResponsiveTable';
import { Card, confirmer, Empty, ErrorBox, KV, Loader, StatutBadge } from '@/components/ui';
import { date, dateHeure, montant, nombre } from '@/lib/format';
import { useAction } from '@/lib/hooks';
import { PLANS, ROLES, STATUTS_PAIEMENT } from '@/lib/labels';

export default function UtilisateurDetailPage() {
  const { id } = useParams();
  const moi = useAuth((s) => s.utilisateur);
  const q = useQuery({ queryKey: ['users', 'detail', id], queryFn: () => api.get<CompteDetail>(`/admin/users/${id}`) });

  const modifier = useAction(
    (corps: { plan?: Plan; role?: Role }) => api.patch(`/admin/users/${id}`, corps),
    { succes: 'Compte mis à jour', invalider: ['users', 'stats'] }
  );
  const deconnecter = useAction(() => api.post(`/admin/users/${id}/revoke-sessions`), { succes: 'Sessions fermées' });

  if (q.isLoading) return <Loader />;
  if (q.error) return <ErrorBox error={q.error} />;
  const u = q.data!;
  const soiMeme = u.id === moi?.id;

  const changerOffre = async () => {
    const plan: Plan = u.plan === 'pro' ? 'free' : 'pro';
    const question = plan === 'pro' ? `Offrir l'offre Pro à ${u.email} ?` : `Retirer l'offre Pro offerte à ${u.email} ?`;
    if (await confirmer(question, { message: "L'offre payée via PayDunya n'est pas modifiée." })) modifier.mutate({ plan });
  };

  const changerRole = async () => {
    const role: Role = u.role === 'admin' ? 'user' : 'admin';
    const question = role === 'admin' ? `Donner l'accès au back-office à ${u.email} ?` : `Retirer l'accès au back-office à ${u.email} ?`;
    if (await confirmer(question, { danger: true, libelleOk: role === 'admin' ? 'Donner' : 'Retirer' })) modifier.mutate({ role });
  };

  const fermerSessions = async () => {
    if (await confirmer(`Déconnecter ${u.email} de tous ses appareils ?`, { message: 'Il devra se reconnecter avec son mot de passe.', libelleOk: 'Déconnecter', danger: true })) deconnecter.mutate();
  };

  return (
    <>
      <div className="toolbar">
        <Link to="/utilisateurs" className="btn ghost sm"><Icon name="arrow-left" size={15} /> Utilisateurs</Link>
      </div>

      <div className="grid grid-main-side">
        <Card title={u.email}>
          <div className="kv">
            <KV label="Offre en vigueur"><StatutBadge table={PLANS} valeur={u.effective_plan} /></KV>
            <KV label="Offre attribuée"><StatutBadge table={PLANS} valeur={u.plan} /></KV>
            <KV label="Pro payé jusqu'au">{date(u.pro_until)}</KV>
            <KV label="Rôle"><StatutBadge table={ROLES} valeur={u.role} /></KV>
            <KV label="Inscrit le">{dateHeure(u.created_at)}</KV>
            <KV label="Dernière connexion">{dateHeure(u.last_login_at)}</KV>
            <KV label="Questions à l'assistant">{nombre(u.assistant_questions)}</KV>
            <KV label="Positions">{nombre(u.positions)}</KV>
          </div>
        </Card>

        <Card title="Actions">
          <div className="actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <button className="btn secondary" onClick={changerOffre} disabled={modifier.isPending}>
              <Icon name="sparkles" size={15} /> {u.plan === 'pro' ? "Retirer l'offre Pro offerte" : "Offrir l'offre Pro"}
            </button>
            <button className="btn secondary" onClick={fermerSessions} disabled={deconnecter.isPending}>
              <Icon name="log-out" size={15} /> Déconnecter tous ses appareils
            </button>
            {!soiMeme && (
              <button className={`btn${u.role === 'admin' ? ' danger' : ' secondary'}`} onClick={changerRole} disabled={modifier.isPending}>
                <Icon name="lock" size={15} /> {u.role === 'admin' ? "Retirer l'accès admin" : "Donner l'accès admin"}
              </button>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-2">
        <Card title="Portefeuille" flush>
          {!u.positions_detail.length ? <Empty>Aucune position</Empty> : (
            <ResponsiveTable
              lignes={u.positions_detail}
              cleLigne={(p) => p.id}
              colonnes={[
                { cle: 'titre', titre: 'Titre', className: 'mono', cellule: (p) => p.symbol },
                { cle: 'quantite', titre: 'Quantité', className: 'right', cellule: (p) => nombre(p.quantity) },
                { cle: 'prix', titre: "Prix d'achat", className: 'right', cellule: (p) => montant(p.buy_price) },
                { cle: 'date', titre: "Date d'achat", className: 'small muted', cellule: (p) => date(p.buy_date) },
              ]}
            />
          )}
        </Card>

        <Card title="Paiements" flush>
          {!u.payments.length ? <Empty>Aucun paiement</Empty> : (
            <ResponsiveTable
              lignes={u.payments}
              cleLigne={(p) => p.id}
              colonnes={[
                { cle: 'date', titre: 'Date', className: 'small', cellule: (p) => dateHeure(p.created_at) },
                { cle: 'montant', titre: 'Montant', className: 'right', cellule: (p) => montant(p.amount) },
                { cle: 'statut', titre: 'Statut', cellule: (p) => <StatutBadge table={STATUTS_PAIEMENT} valeur={p.status} /> },
              ]}
            />
          )}
        </Card>
      </div>
    </>
  );
}
