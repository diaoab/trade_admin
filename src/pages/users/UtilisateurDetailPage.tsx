import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import { nomCompte, type CompteDetail, type CompteModif, type Plan, type Role } from '@/api/types';
import { useAuth } from '@/auth/store';
import Icon from '@/components/Icon';
import ResponsiveTable from '@/components/ResponsiveTable';
import { Badge, Card, confirmer, Empty, ErrorBox, Field, KV, Loader, Modal, StatutBadge } from '@/components/ui';
import { date, dateHeure, montant, nombre } from '@/lib/format';
import { useAction } from '@/lib/hooks';
import { PLANS, ROLES, STATUTS_COMPTE, STATUTS_PAIEMENT } from '@/lib/labels';

/** Prénom, nom et téléphone ; un champ vidé est effacé côté API. */
function IdentiteModal({ compte, onClose }: { compte: CompteDetail; onClose: () => void }) {
  const [champs, setChamps] = useState({
    first_name: compte.first_name ?? '',
    last_name: compte.last_name ?? '',
    phone: compte.phone ?? '',
  });
  const enregistrer = useAction((corps: CompteModif) => api.patch(`/admin/users/${compte.id}`, corps), {
    succes: 'Compte mis à jour',
    invalider: ['users'],
  });

  const champ = (cle: keyof typeof champs) => ({
    value: champs[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setChamps((c) => ({ ...c, [cle]: e.target.value })),
  });

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    const corps = Object.fromEntries(Object.entries(champs).map(([k, v]) => [k, v.trim() || null]));
    enregistrer.mutate(corps, { onSuccess: onClose });
  };

  return (
    <Modal
      title="Modifier l'identité"
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Annuler</button>
          <button className="btn" form="identite" disabled={enregistrer.isPending}>
            {enregistrer.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </>
      }
    >
      <form id="identite" onSubmit={soumettre}>
        <Field label="Prénom"><input className="input" maxLength={100} {...champ('first_name')} /></Field>
        <Field label="Nom"><input className="input" maxLength={100} {...champ('last_name')} /></Field>
        <Field label="Téléphone"><input className="input" type="tel" maxLength={30} {...champ('phone')} /></Field>
      </form>
    </Modal>
  );
}

export default function UtilisateurDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [edition, setEdition] = useState(false);
  const moi = useAuth((s) => s.utilisateur);
  const q = useQuery({ queryKey: ['users', 'detail', id], queryFn: () => api.get<CompteDetail>(`/admin/users/${id}`) });

  const modifier = useAction(
    (corps: { plan?: Plan; role?: Role }) => api.patch(`/admin/users/${id}`, corps),
    { succes: 'Compte mis à jour', invalider: ['users', 'stats'] }
  );
  const deconnecter = useAction(() => api.post(`/admin/users/${id}/revoke-sessions`), { succes: 'Sessions fermées' });
  const changerStatut = useAction(
    (actif: boolean) => api.post(`/admin/users/${id}/${actif ? 'activate' : 'deactivate'}`),
    { succes: 'Statut du compte mis à jour', invalider: ['users', 'stats'] }
  );
  const supprimer = useAction(() => api.delete(`/admin/users/${id}`), {
    succes: 'Compte supprimé',
    invalider: ['users', 'stats', 'payments'],
  });

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

  const basculerStatut = async () => {
    const question = u.is_active ? `Désactiver le compte de ${u.email} ?` : `Réactiver le compte de ${u.email} ?`;
    const message = u.is_active ? 'Il est déconnecté de tous ses appareils et ne peut plus se connecter.' : undefined;
    if (await confirmer(question, { message, danger: u.is_active, libelleOk: u.is_active ? 'Désactiver' : 'Réactiver' })) {
      changerStatut.mutate(!u.is_active);
    }
  };

  const supprimerCompte = async () => {
    if (
      await confirmer(`Supprimer définitivement le compte de ${u.email} ?`, {
        message: 'Ses positions, paiements et sessions sont supprimés. Cette action est irréversible.',
        libelleOk: 'Supprimer',
        danger: true,
      })
    ) {
      supprimer.mutate(undefined, { onSuccess: () => navigate('/utilisateurs', { replace: true }) });
    }
  };

  return (
    <>
      <div className="toolbar">
        <Link to="/utilisateurs" className="btn ghost sm"><Icon name="arrow-left" size={15} /> Utilisateurs</Link>
      </div>

      <div className="grid grid-main-side">
        <Card
          title={nomCompte(u)}
          right={<button className="btn ghost sm" onClick={() => setEdition(true)}><Icon name="pencil" size={14} /> Modifier</button>}
        >
          <div className="kv">
            <KV label="E-mail">{u.email}</KV>
            <KV label="Prénom">{u.first_name ?? '—'}</KV>
            <KV label="Nom">{u.last_name ?? '—'}</KV>
            <KV label="Téléphone">{u.phone ?? '—'}</KV>
            <KV label="Statut">
              <StatutBadge table={STATUTS_COMPTE} valeur={u.is_active ? 'active' : 'inactive'} />
              {u.must_change_password && <> <Badge ton="orange">Mot de passe provisoire</Badge></>}
            </KV>
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
            {!soiMeme && (
              <button className={`btn${u.is_active ? ' danger' : ' secondary'}`} onClick={basculerStatut} disabled={changerStatut.isPending}>
                <Icon name={u.is_active ? 'ban' : 'check-circle'} size={15} /> {u.is_active ? 'Désactiver le compte' : 'Réactiver le compte'}
              </button>
            )}
            {!soiMeme && (
              <button className="btn danger" onClick={supprimerCompte} disabled={supprimer.isPending}>
                <Icon name="trash" size={15} /> Supprimer le compte
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

      {edition && <IdentiteModal compte={u} onClose={() => setEdition(false)} />}
    </>
  );
}
