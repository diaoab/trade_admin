import { useState, type FormEvent } from 'react';
import { api } from '@/api/client';
import { useAuth } from './store';
import { ErrorBox, Field, Modal, toast } from '@/components/ui';
import { erreurMotDePasse, REGLE_MDP } from '@/lib/motDePasse';

/**
 * Changement de son propre mot de passe. L'API ferme toutes les sessions et en
 * rend une nouvelle pour cet appareil : les autres appareils sont déconnectés.
 */
export default function ChangerMotDePasseModal({ onClose }: { onClose: () => void }) {
  const setSession = useAuth((s) => s.setSession);
  const [actuel, setActuel] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<unknown>(null);
  const [envoi, setEnvoi] = useState(false);

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    const invalide = erreurMotDePasse(nouveau, confirmation);
    if (invalide) return setErreur(new Error(invalide));
    setEnvoi(true);
    try {
      const session = await api.put<{ token: string; refresh_token: string }>('/auth/password', {
        current_password: actuel,
        new_password: nouveau,
      });
      setSession(session.token, session.refresh_token);
      toast.success('Mot de passe modifié : vos autres appareils sont déconnectés.');
      onClose();
    } catch (err) {
      setErreur(err);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Modal
      title="Changer mon mot de passe"
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Annuler</button>
          <button className="btn" form="changer-mdp" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
        </>
      }
    >
      <form id="changer-mdp" onSubmit={soumettre}>
        <ErrorBox error={erreur} />
        <Field label="Mot de passe actuel">
          <input className="input" type="password" autoComplete="current-password" required value={actuel} onChange={(e) => setActuel(e.target.value)} />
        </Field>
        <Field label="Nouveau mot de passe" hint={REGLE_MDP}>
          <input className="input" type="password" autoComplete="new-password" required value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
        </Field>
        <Field label="Confirmation">
          <input className="input" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
