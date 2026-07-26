import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../auth";
import { ExerciseProvider } from "../exercise";
import { AppShell } from "../layouts/AppShell";

const LoginPage = lazy(() => import("../modules/auth/pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import("../modules/dashboard/pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const MapWorkspacePage = lazy(() => import("../modules/map/pages/MapWorkspacePage").then((module) => ({ default: module.MapWorkspacePage })));
const PlaceholderPage = lazy(() => import("../modules/placeholder/pages/PlaceholderPage").then((module) => ({ default: module.PlaceholderPage })));

const plannedRoutes = [
  "exercise", "scenario", "msel", "participants", "timeline",
  "orbat", "coa", "opord", "tasks", "control-measures",
  "live-cop", "events", "orders", "logistics", "communications",
  "matrix", "dis", "hla", "rules", "adjudication", "replay",
  "intelligence", "reports", "heatmaps", "aar", "lessons",
  "users", "roles", "settings", "administration",
] as const;

function RouteLoader() {
  return <div className="app-loading">Loading JCWS module...</div>;
}

export function AppRouter() {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoader />;

  if (!user) {
    return (
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <ExerciseProvider>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/workspace" element={<MapWorkspacePage />} />
            {plannedRoutes.map((path) => <Route key={path} path={`/${path}`} element={<PlaceholderPage />} />)}
          </Route>
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ExerciseProvider>
  );
}
