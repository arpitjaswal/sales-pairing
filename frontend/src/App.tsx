import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Contexts
import { useAuth } from './contexts/AuthContext';
import { MatchingProvider } from './contexts/MatchingContext';
import InvitationNotification from './components/InvitationNotification';
import FloatingInvitationButton from './components/FloatingInvitationButton';


// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages - Lazy loaded for better performance
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SessionListPage = React.lazy(() => import('./pages/roleplay/SessionListPage'));
const CreateSessionPage = React.lazy(() => import('./pages/roleplay/CreateSessionPage'));
const RoleplaySessionPage = React.lazy(() => import('./pages/roleplay/RoleplaySessionPage'));
const PracticeSessionPage = React.lazy(() => import('./pages/roleplay/PracticeSessionPage'));
const MatchingDashboardPage = React.lazy(() => import('./pages/roleplay/MatchingDashboardPage'));
const LivePracticeSessionPage = React.lazy(() => import('./pages/roleplay/LivePracticeSessionPage'));



// Loading component
const LoadingSpinner = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress size={60} />
  </Box>
);

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <MatchingProvider>
      <InvitationNotification />
      <FloatingInvitationButton />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthLayout>
                <RegisterPage />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <AuthLayout>
                <ForgotPasswordPage />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <AuthLayout>
                <ResetPasswordPage />
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
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
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SessionListPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
                  <Route
            path="/matching"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MatchingDashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice-session/:sessionId"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LivePracticeSessionPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        <Route
          path="/sessions/create"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CreateSessionPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RoleplaySessionPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/:sessionId"
          element={
            <ProtectedRoute>
              <PracticeSessionPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </MatchingProvider>
  );
}

export default App;
