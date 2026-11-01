import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { EtatModele } from '@/api/types';
import Icon from '@/components/Icon';
import { Badge, Card, confirmer, Empty, ErrorBox, KV, Loader } from '@/components/ui';
import { dateHeure, nombre, score } from '@/lib/format';
import { useAction } from '@/lib/hooks';

const SCORES: Record<string, string> = {
  roc_auc: 'ROC AUC',
  balanced_accuracy: 'Accuracy équilibrée',
  accuracy: 'Accuracy',
  precision: 'Précision',
  recall: 'Rappel',
  f1: 'F1',
};

export default function ModelePage() {
  const q = useQuery({
    queryKey: ['model'],
    queryFn: () => api.get<EtatModele>('/admin/model'),
    // Pendant un entraînement, l'état est relu jusqu'à la fin
    refetchInterval: (query) => (query.state.data?.training ? 10_000 : false),
  });

  const reentrainer = useAction(() => api.post('/admin/retrain'), { succes: 'Entraînement lancé', invalider: ['model'] });

  const lancer = async () => {
    if (await confirmer('Réentraîner le modèle ?', { message: 'Quelques minutes, en arrière-plan. Le modèle actuel reste utilisé jusqu’à la fin.', libelleOk: 'Réentraîner' })) {
      reentrainer.mutate();
    }
  };

  if (q.isLoading) return <Loader />;
  if (q.error) return <ErrorBox error={q.error} />;
  const { metadata: m, training } = q.data!;

  return (
    <>
      <div className="toolbar">
        <button className="btn pousser" onClick={lancer} disabled={training || reentrainer.isPending}>
          <Icon name="refresh-cw" size={15} /> {training ? 'Entraînement en cours…' : 'Réentraîner le modèle'}
        </button>
      </div>

      {!m ? <Card><Empty>Aucun modèle entraîné pour l'instant</Empty></Card> : (
        <>
          {!m.beats_baseline && (
            <div className="alert info">
              <Icon name="alert-triangle" size={16} />
              <div>Le modèle ne bat pas la référence naïve sur le jeu de test : il reste affiché à titre indicatif et n'entre pas dans le score.</div>
            </div>
          )}
          <div className="grid grid-2">
            <Card title="Dernier entraînement">
              <div className="kv">
                <KV label="Modèle">{m.model}</KV>
                <KV label="Date">{dateHeure(m.trained_at)}</KV>
                <KV label="Horizon">{m.target_horizon_days} séances</KV>
                <KV label="Titres">{m.structures.join(', ')}</KV>
                <KV label="Lignes (entraînement)">{nombre(m.rows_train_val)}</KV>
                <KV label="Lignes (test)">{nombre(m.rows_test)}</KV>
                <KV label="ROC AUC (validation croisée)">{score(m.cv_roc_auc_mean)}</KV>
                <KV label="Bat la référence naïve">{m.beats_baseline ? <Badge ton="vert">Oui</Badge> : <Badge ton="orange">Non</Badge>}</KV>
              </div>
            </Card>
            <Card title="Scores sur le jeu de test">
              <div className="bars">
                {Object.entries(SCORES).filter(([k]) => k in m.test_scores).map(([k, label]) => (
                  <div key={k} className="bar-row">
                    <span>{label}</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${m.test_scores[k] * 100}%` }} /></div>
                    <span className="right">{score(m.test_scores[k])}</span>
                  </div>
                ))}
                <div className="bar-row">
                  <span>Référence naïve</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${m.baseline_accuracy * 100}%`, opacity: 0.4 }} /></div>
                  <span className="right">{score(m.baseline_accuracy)}</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
