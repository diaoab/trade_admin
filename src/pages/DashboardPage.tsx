import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { Stats } from '@/api/types';
import { Badge, Card, ErrorBox, KV, Loader, Stat } from '@/components/ui';
import { date, dateHeure, montant, nombre, score } from '@/lib/format';

export default function DashboardPage() {
  const navigate = useNavigate();
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => api.get<Stats>('/admin/stats') });

  if (stats.isLoading) return <Loader />;
  if (stats.error) return <ErrorBox error={stats.error} />;
  const s = stats.data!;
  const max = Math.max(1, ...s.signups.map((j) => j.count));

  return (
    <>
      <div className="stats">
        <Stat icon="users" value={nombre(s.users.total)} label="Comptes" hint={`+${s.users.new_7d} cette semaine · +${s.users.new_30d} sur 30 jours`} onClick={() => navigate('/utilisateurs')} />
        <Stat icon="sparkles" ton="vert" value={nombre(s.users.pro)} label="Comptes Pro" hint={`${s.users.total ? Math.round((s.users.pro / s.users.total) * 100) : 0} % des comptes`} onClick={() => navigate('/utilisateurs?plan=pro')} />
        <Stat icon="activity" ton="cyan" value={nombre(s.users.active_7d)} label="Connectés (7 jours)" />
        <Stat icon="coins" ton="orange" value={montant(s.payments.revenue_30d)} label="Encaissé (30 jours)" hint={`${montant(s.payments.revenue_total)} au total`} onClick={() => navigate('/paiements')} />
        <Stat icon="message-circle" ton="violet" value={nombre(s.assistant.today)} label="Questions à l'assistant aujourd'hui" hint={`${nombre(s.assistant.last_7d)} sur 7 jours`} />
        <Stat icon="credit-card" ton="bleu" value={nombre(s.payments.pending)} label="Paiements en attente" hint={`${nombre(s.payments.completed)} payés`} onClick={() => navigate('/paiements?status=pending')} />
      </div>

      <div className="grid grid-main-side">
        <Card title="Inscriptions sur 30 jours">
          <div className="histo" role="img" aria-label={`${s.users.new_30d} inscriptions sur 30 jours`}>
            {s.signups.map((j) => (
              <div key={j.day} className="histo-col" title={`${date(j.day)} : ${j.count}`}>
                <div className="histo-barre" style={{ height: `${(j.count / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="histo-axe small muted">
            <span>{date(s.signups[0]?.day)}</span>
            <span>{date(s.signups[s.signups.length - 1]?.day)}</span>
          </div>
        </Card>

        <Card title="Modèle et données" right={<Link className="small" to="/modele">Détails</Link>}>
          <div className="kv one">
            <KV label="Modèle">{s.model.name ?? 'Non entraîné'}</KV>
            <KV label="Dernier entraînement">{dateHeure(s.model.trained_at)}</KV>
            <KV label="ROC AUC (test)">{score(s.model.roc_auc)}</KV>
            <KV label="Bat la référence naïve">
              {s.model.beats_baseline === null ? '—' : s.model.beats_baseline ? <Badge ton="vert">Oui</Badge> : <Badge ton="orange">Non</Badge>}
            </KV>
            <KV label="Titres suivis"><Link to="/historiques">{s.structures}</Link></KV>
            <KV label="Positions saisies">{nombre(s.positions)}</KV>
          </div>
        </Card>
      </div>
    </>
  );
}
