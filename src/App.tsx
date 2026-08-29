import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute, PublicRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { CustomersPage } from './pages/CustomersPage';
import { BillingPage } from './pages/BillingPage';
import { LedgerPage } from './pages/LedgerPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityLogsPage } from './pages/ActivityLogsPage';
import { EmployeesPage } from './pages/EmployeesPage';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <StoreProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<PublicRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                  </Route>

                  <Route element={<ProtectedRoute />}>
                    <Route path="/admin" element={<MainLayout />}>
                      <Route element={<ProtectedRoute permission="dashboard" />}>
                        <Route index element={<DashboardPage />} />
                      </Route>
                      <Route element={<ProtectedRoute permission="inventory" />}>
                        <Route path="inventory" element={<InventoryPage />} />
                      </Route>
                      <Route element={<ProtectedRoute permission="customers" />}>
                        <Route path="customers" element={<CustomersPage />} />
                      </Route>
                      <Route element={<ProtectedRoute permission="billing" />}>
                        <Route path="billing" element={<BillingPage />} />
                      </Route>
                      <Route element={<ProtectedRoute permission="ledger" />}>
                        <Route path="ledger" element={<LedgerPage />} />
                      </Route>
                      <Route element={<ProtectedRoute permission="reports" />}>
                        <Route path="reports" element={<ReportsPage />} />
                      </Route>
                      <Route element={<ProtectedRoute permission="activityLogs" />}>
                        <Route path="activity-logs" element={<ActivityLogsPage />} />
                      </Route>
                      <Route element={<ProtectedRoute adminOnly />}>
                        <Route path="employees" element={<EmployeesPage />} />
                      </Route>
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
                  </Route>

                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </BrowserRouter>
            </StoreProvider>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
