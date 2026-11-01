import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Structure } from '@/api/types';
import Icon from '@/components/Icon';
import ResponsiveTable from '@/components/ResponsiveTable';
import { Badge, Card, Empty, ErrorBox, Field, Loader, Modal, toast } from '@/components/ui';
import { date, joursDepuis, nombre } from '@/lib/format';
import { useAction, useInvalider } from '@/lib/hooks';

/** Au-delà, la dernière séance d'un titre est signalée (week-ends et fériés compris). */
const RETARD_JOURS = 5;

function ImportModal({ onClose }: { onClose: () => void }) {
  const invalider = useInvalider();
  const [nom, setNom] = useState('');
  const [fichier, setFichier] = useState<File | null>(null);
  const [erreur, setErreur] = useState<unknown>(null);
  const [envoi, setEnvoi] = useState(false);

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    if (!fichier) return;
    setErreur(null);
    setEnvoi(true);
    try {
      const r = await api.fichier<{ symbol: string; rows_added: number }>('/admin/structures', fichier, { name: nom.trim() });
      toast.success(`${r.symbol} : ${r.rows_added} séance(s) ajoutée(s)`);
      invalider('structures', 'stats');
      onClose();
    } catch (err) {
      setErreur(err);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Modal
      title="Importer un historique"
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Annuler</button>
          <button className="btn" form="import-historique" disabled={envoi || !fichier || !nom.trim()}>
            {envoi ? 'Import…' : 'Importer'}
          </button>
        </>
      }
    >
      <form id="import-historique" onSubmit={soumettre}>
        <ErrorBox error={erreur} />
        <Field label="Nom du titre" hint="Un titre existant est complété ; un nouveau nom crée un titre.">
          <input className="input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="PALM CI" required />
        </Field>
        <Field label="Classeur Excel (.xlsx)" hint="Colonnes Date et Close au minimum (format BRVM).">
          <input
            className="input"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
            required
          />
        </Field>
      </form>
    </Modal>
  );
}

export default function HistoriquesPage() {
  const [importer, setImporter] = useState(false);
  const q = useQuery({ queryKey: ['structures'], queryFn: () => api.get<Structure[]>('/admin/structures') });

  const coursDuJour = useAction(
    (retrain: boolean) => api.post('/admin/refresh', undefined, { retrain }),
    { succes: 'Cours du jour récupérés', invalider: ['structures', 'stats', 'model'] }
  );

  return (
    <>
      <div className="toolbar">
        <button className="btn secondary" onClick={() => coursDuJour.mutate(false)} disabled={coursDuJour.isPending}>
          <Icon name="refresh-cw" size={15} /> {coursDuJour.isPending ? 'Récupération…' : 'Récupérer les cours du jour'}
        </button>
        <button className="btn pousser" onClick={() => setImporter(true)}>
          <Icon name="upload" size={15} /> Importer un historique
        </button>
      </div>

      <ErrorBox error={q.error} />
      <Card flush>
        {q.isLoading ? <Loader /> : !q.data?.length ? <Empty>Aucun historique : importez un classeur .xlsx</Empty> : (
          <ResponsiveTable
            lignes={q.data}
            cleLigne={(s) => s.symbol}
            colonnes={[
              { cle: 'titre', titre: 'Titre', cellule: (s) => <><strong>{s.name}</strong><div className="muted small mono">{s.symbol}</div></> },
              { cle: 'seances', titre: 'Séances', className: 'right', cellule: (s) => nombre(s.rows) },
              { cle: 'debut', titre: 'Depuis', className: 'small muted', priorite: 'basse', cellule: (s) => date(s.first_date) },
              { cle: 'fin', titre: 'Dernière séance', className: 'small', cellule: (s) => date(s.last_date) },
              { cle: 'dividendes', titre: 'Dividendes', className: 'right', priorite: 'basse', cellule: (s) => nombre(s.dividends) },
              {
                cle: 'statut', titre: 'État', cellule: (s) => {
                  if (s.error) return <Badge ton="rouge">Illisible</Badge>;
                  const retard = joursDepuis(s.last_date);
                  return retard !== null && retard > RETARD_JOURS
                    ? <Badge ton="orange">{retard} j de retard</Badge>
                    : <Badge ton="vert">À jour</Badge>;
                },
              },
            ]}
          />
        )}
      </Card>

      {importer && <ImportModal onClose={() => setImporter(false)} />}
    </>
  );
}
