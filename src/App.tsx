import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader } from './components/ui';
import { useAuth } from './auth/store';
import LoginPage from './auth/LoginPage';
import Layout from './components/Layout';
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UtilisateursPage = lazy(() => import('./pages/users/UtilisateursPage'));
const UtilisateurDetailPage = lazy(() => import('./pages/users/UtilisateurDetailPage'));
const PaiementsPage = lazy(() => import('./pages/finance/PaiementsPage'));
const HistoriquesPage = lazy(() => import('./pages/donnees/HistoriquesPage'));
const ModelePage = lazy(() => import('./pages/donnees/ModelePage'));

function Protege({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.accessToken);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <Protege>
              <Layout />
            </Protege>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="utilisateurs" element={<UtilisateursPage />} />
          <Route path="utilisateurs/:id" element={<UtilisateurDetailPage />} />
          <Route path="paiements" element={<PaiementsPage />} />
          <Route path="historiques" element={<HistoriquesPage />} />
          <Route path="modele" element={<ModelePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
