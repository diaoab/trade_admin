import { useState, type FormEvent } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { nomCompte, versPagination, type Compte, type Liste, type NouvelAdmin } from '@/api/types';
import { useAuth } from '@/auth/store';
import Icon from '@/components/Icon';
import ResponsiveTable from '@/components/ResponsiveTable';
import { Card, Chips, Empty, ErrorBox, Field, Loader, Modal, Pagination, SearchInput, StatutBadge, toast } from '@/components/ui';
import { date, dateHeure, nombre } from '@/lib/format';
import { useFiltres, useInvalider } from '@/lib/hooks';
import { PLANS, ROLES, STATUTS_COMPTE } from '@/lib/labels';
import { erreurMotDePasse, REGLE_MDP } from '@/lib/motDePasse';

const OFFRES = [
  { value: '', label: 'Tous' },
  { value: 'pro', label: 'Pro' },
  { value: 'free', label: 'Gratuit' },
];

function NouvelAdminModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const invalider = useInvalider();
  const [champs, setChamps] = useState<Required<NouvelAdmin>>({ email: '', password: '', first_name: '', last_name: '', phone: '' });
  const [erreur, setErreur] = useState<unknown>(null);
  const [envoi, setEnvoi] = useState(false);

  const champ = (cle: keyof NouvelAdmin) => ({
    value: champs[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setChamps((c) => ({ ...c, [cle]: e.target.value })),
  });

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    const invalide = erreurMotDePasse(champs.password);
    if (invalide) return setErreur(new Error(`Mot de passe : ${invalide.toLowerCase()}`));
    setEnvoi(true);
    try {
      const u = await api.post<Compte>('/admin/users/admins', champs);
      toast.success(`Administrateur ${u.email} créé`);
      invalider('users', 'stats');
      navigate(`/utilisateurs/${u.id}`);
    } catch (err) {
      setErreur(err);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Modal
      title="Nouvel administrateur"
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Annuler</button>
          <button className="btn" form="nouvel-admin" disabled={envoi}>{envoi ? 'Création…' : 'Créer'}</button>
        </>
      }
    >
      <form id="nouvel-admin" onSubmit={soumettre}>
        <ErrorBox error={erreur} />
        <Field label="E-mail">
          <input className="input" type="email" autoComplete="off" required {...champ('email')} />
        </Field>
        <Field label="Mot de passe provisoire" hint={`${REGLE_MDP} Il devra le changer à sa première connexion.`}>
          <input className="input" type="text" autoComplete="new-password" required {...champ('password')} />
        </Field>
        <Field label="Prénom">
          <input className="input" {...champ('first_name')} />
        </Field>
        <Field label="Nom">
          <input className="input" {...champ('last_name')} />
        </Field>
        <Field label="Téléphone">
          <input className="input" type="tel" {...champ('phone')} />
        </Field>
      </form>
    </Modal>
  );
}

export default function UtilisateursPage() {
  const navigate = useNavigate();
  const moi = useAuth((s) => s.utilisateur);
  const { filtres, page, set, setPage } = useFiltres({ search: '', plan: '', role: '', status: '' });
  const [creation, setCreation] = useState(false);
  const [export_, setExport] = useState(false);

  const q = useQuery({
    queryKey: ['users', filtres, page],
    queryFn: () => api.get<Liste<Compte>>('/admin/users', { ...filtres, page, limit: 20 }),
    placeholderData: keepPreviousData,
  });

  const exporter = async () => {
    setExport(true);
    try {
      await api.telecharger('/admin/users/export', filtres, 'comptes.csv');
    } catch (e) {
      toast.error(e);
    } finally {
      setExport(false);
    }
  };

  return (
    <>
      <div className="toolbar">
        <SearchInput value={filtres.search} onChange={(v) => set('search', v)} placeholder="Email, nom, téléphone…" />
        <Chips options={OFFRES} value={filtres.plan} onChange={(v) => set('plan', v)} />
        <select className="select" value={filtres.role} onChange={(e) => set('role', e.target.value)}>
          <option value="">Tous les rôles</option>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="select" value={filtres.status} onChange={(e) => set('status', e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUTS_COMPTE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="actions" style={{ marginLeft: 'auto' }}>
          <button className="btn secondary" onClick={exporter} disabled={export_}>
            <Icon name="download" size={15} /> {export_ ? 'Export…' : 'Exporter'}
          </button>
          <button className="btn" onClick={() => setCreation(true)}>
            <Icon name="plus" size={15} /> Administrateur
          </button>
        </div>
      </div>

      <ErrorBox error={q.error} />
      <Card flush>
        {q.isLoading ? <Loader /> : !q.data?.items.length ? <Empty>Aucun compte</Empty> : (
          <ResponsiveTable
            lignes={q.data.items}
            cleLigne={(u) => u.id}
            onLigne={(u) => navigate(`/utilisateurs/${u.id}`)}
            colonnes={[
              {
                cle: 'compte',
                titre: 'Compte',
                cellule: (u) => (
                  <>
                    <strong>{nomCompte(u)}</strong>
                    {u.id === moi?.id && <span className="muted small"> (vous)</span>}
                    {nomCompte(u) !== u.email && <div className="muted small">{u.email}</div>}
                  </>
                ),
              },
              { cle: 'telephone', titre: 'Téléphone', className: 'small', priorite: 'basse', cellule: (u) => u.phone ?? '—' },
              { cle: 'plan', titre: 'Offre', mobile: 'badge', cellule: (u) => <StatutBadge table={PLANS} valeur={u.effective_plan} /> },
              { cle: 'role', titre: 'Rôle', cellule: (u) => <StatutBadge table={ROLES} valeur={u.role} /> },
              { cle: 'statut', titre: 'Statut', cellule: (u) => <StatutBadge table={STATUTS_COMPTE} valeur={u.is_active ? 'active' : 'inactive'} /> },
              { cle: 'positions', titre: 'Positions', className: 'right', priorite: 'basse', cellule: (u) => nombre(u.positions) },
              { cle: 'connexion', titre: 'Dernière connexion', className: 'small muted', cellule: (u) => dateHeure(u.last_login_at) },
              { cle: 'cree', titre: 'Inscrit le', className: 'small muted', priorite: 'basse', cellule: (u) => date(u.created_at) },
            ]}
          />
        )}
        <Pagination info={versPagination(q.data?.pagination)} onPage={setPage} />
      </Card>

      {creation && <NouvelAdminModal onClose={() => setCreation(false)} />}
    </>
  );
}
