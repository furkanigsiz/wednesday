import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ProjectsPage from './pages/Projects/ProjectsPage';
import TasksPage from './pages/Tasks/TasksPage';
import MainLayout from './components/Layout/MainLayout';
import { SnackbarProvider } from 'notistack';
import { theme } from './theme';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import { NotificationProvider } from './context/NotificationContext';
import CustomerListPage from './pages/CRM/CustomerListPage';
import NewCustomerPage from './pages/CRM/NewCustomerPage';
import EditCustomerPage from './pages/CRM/EditCustomerPage';
import CustomerDetailPage from './pages/CRM/CustomerDetailPage';
import TaskDetailPage from './pages/Tasks/TaskDetailPage';
import { ThemeProvider as MuiThemeProvider } from './context/ThemeContext';

// Protected Route bileşeni
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route bileşeni
const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MuiThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <NotificationProvider>
                <SnackbarProvider maxSnack={3}>
                  <Routes>
                    {/* Public routes */}
                    <Route
                      path="/login"
                      element={
                        <PublicRoute>
                          <LoginPage />
                        </PublicRoute>
                      }
                    />
                    <Route
                      path="/register"
                      element={
                        <PublicRoute>
                          <RegisterPage />
                        </PublicRoute>
                      }
                    />

                    {/* Protected routes */}
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <DashboardPage />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <DashboardPage />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/projects"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <ProjectsPage />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tasks"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <TasksPage />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tasks/:id/details"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <TaskDetailPage />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tasks/:id/edit"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <TaskDetailPage isEditing={true} />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />

                    {/* CRM Routes */}
                    <Route
                      path="/crm/customers"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <CustomerListPage />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/customers/new"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <NewCustomerPage />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/customers/:id"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <CustomerDetailPage />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/crm/customers/:id/edit"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
                            <EditCustomerPage />
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />

                    {/* Catch all route - redirect to dashboard */}
                    <Route
                      path="*"
                      element={<Navigate to="/" replace />}
                    />
                  </Routes>
                </SnackbarProvider>
              </NotificationProvider>
            </BrowserRouter>
          </AuthProvider>
        </MuiThemeProvider>
      </ThemeProvider>
    </LocalizationProvider>
  );
};

export default App;
