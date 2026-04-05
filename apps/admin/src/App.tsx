
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { AdminShell } from './components/layout/AdminShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { TenantListPage } from './features/tenants/TenantListPage';
import { TenantDetailPage } from './features/tenants/TenantDetailPage';
import { AdminUserListPage } from './features/users/AdminUserListPage';
import { PackagesPage } from './features/packages/PackagesPage';
import { SubscriptionsPage } from './features/subscriptions/SubscriptionsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tenants" element={<TenantListPage />} />
        <Route path="tenants/:id" element={<TenantDetailPage />} />
        <Route path="users" element={<AdminUserListPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
