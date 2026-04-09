
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { CustomerShell } from './components/layout/CustomerShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ModuleGuard } from './components/layout/ModuleGuard';
import { PermissionGuard } from './components/layout/PermissionGuard';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { MenuPage } from './features/menu/MenuPage';
import { MenuCategoriesPage } from './features/menu/MenuCategoriesPage';
import { MenuItemsPage } from './features/menu/MenuItemsPage';
import { OrdersListPage } from './features/orders/OrdersListPage';
import { NewOrderPage } from './features/orders/NewOrderPage';
import { OrderDetailPage } from './features/orders/OrderDetailPage';
import { StockItemsPage } from './features/stock/StockItemsPage';
import { StockMovementsPage } from './features/stock/StockMovementsPage';
import { ReportsPage } from './features/profitloss/ReportsPage';
import { EmployeeListPage } from './features/users/EmployeeListPage';
import { ProfilePage } from './features/users/ProfilePage';
import { RegisterPage } from './features/auth/RegisterPage';
import { StorePage } from './features/store/StorePage';
import { QrMenuPage } from './features/menu/QrMenuPage';
import { MenuTemplatePage } from './features/menu/MenuTemplatePage';
import { PublicMenuPage } from './features/public/PublicMenuPage';
import { CheckoutPage } from './features/store/CheckoutPage';
import { PaymentSuccessPage } from './features/store/PaymentSuccessPage';
import { PaymentFailedPage } from './features/store/PaymentFailedPage';
import { TablesPage } from './features/tables/TablesPage';
import { TableDetailPage } from './features/tables/TableDetailPage';
import { MySubscriptionsPage } from './features/store/MySubscriptionsPage';
import { ExpensesPage } from './features/expenses/ExpensesPage';
import { MembershipsPage } from './features/memberships/MembershipsPage';
import { ModuleType, Permissions } from '@stockbite/api-client';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/payment/failed" element={<PaymentFailedPage />} />
      <Route path="/m/:slug" element={<PublicMenuPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <CustomerShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        <Route
          path="menu"
          element={
            <ModuleGuard moduleId={ModuleType.Menu}>
              <MenuPage />
            </ModuleGuard>
          }
        />
        <Route
          path="menu/categories"
          element={
            <ModuleGuard moduleId={ModuleType.Menu}>
              <MenuCategoriesPage />
            </ModuleGuard>
          }
        />
        <Route
          path="menu/items"
          element={
            <ModuleGuard moduleId={ModuleType.Menu}>
              <MenuItemsPage />
            </ModuleGuard>
          }
        />

        <Route
          path="orders"
          element={
            <ModuleGuard moduleId={ModuleType.Orders}>
              <PermissionGuard permission={Permissions.Orders.View}>
                <OrdersListPage />
              </PermissionGuard>
            </ModuleGuard>
          }
        />
        <Route
          path="orders/new"
          element={
            <ModuleGuard moduleId={ModuleType.Orders}>
              <PermissionGuard permission={Permissions.Orders.Create}>
                <NewOrderPage />
              </PermissionGuard>
            </ModuleGuard>
          }
        />
        <Route
          path="orders/:id"
          element={
            <ModuleGuard moduleId={ModuleType.Orders}>
              <PermissionGuard permission={Permissions.Orders.View}>
                <OrderDetailPage />
              </PermissionGuard>
            </ModuleGuard>
          }
        />

        <Route
          path="stock"
          element={
            <ModuleGuard moduleId={ModuleType.Stock}>
              <PermissionGuard permission={Permissions.Stock.View}>
                <StockItemsPage />
              </PermissionGuard>
            </ModuleGuard>
          }
        />
        <Route
          path="stock/movements"
          element={
            <ModuleGuard moduleId={ModuleType.Stock}>
              <PermissionGuard permission={Permissions.Stock.View}>
                <StockMovementsPage />
              </PermissionGuard>
            </ModuleGuard>
          }
        />

        <Route
          path="reports"
          element={
            <ModuleGuard moduleId={ModuleType.ProfitLoss}>
              <PermissionGuard permission={Permissions.ProfitLoss.View}>
                <ReportsPage />
              </PermissionGuard>
            </ModuleGuard>
          }
        />
        <Route
          path="expenses"
          element={
            <ModuleGuard moduleId={ModuleType.ProfitLoss}>
              <ExpensesPage />
            </ModuleGuard>
          }
        />

        <Route
          path="tables"
          element={
            <ModuleGuard moduleId={ModuleType.Tables}>
              <TablesPage />
            </ModuleGuard>
          }
        />
        <Route
          path="tables/:tableId"
          element={
            <ModuleGuard moduleId={ModuleType.Tables}>
              <TableDetailPage />
            </ModuleGuard>
          }
        />

        <Route
          path="memberships"
          element={
            <ModuleGuard moduleId={ModuleType.Memberships}>
              <MembershipsPage />
            </ModuleGuard>
          }
        />

        <Route path="settings/employees" element={<EmployeeListPage />} />
        <Route path="settings/profile" element={<ProfilePage />} />
        <Route path="store" element={<StorePage />} />
        <Route path="menu/qr" element={<QrMenuPage />} />
        <Route
          path="menu/template"
          element={
            <ModuleGuard moduleId={ModuleType.Menu}>
              <MenuTemplatePage />
            </ModuleGuard>
          }
        />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="my-subscriptions" element={<MySubscriptionsPage />} />
        <Route path="payment/success" element={<PaymentSuccessPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
