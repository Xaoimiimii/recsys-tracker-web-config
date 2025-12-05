import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, useContainer } from './hooks';
import { AuthPage } from './app/auth/AuthPage';
import { OnboardingPage } from './app/onboarding/OnboardingPage';
import { DashboardPage } from './app/dashboard/DashboardPage';
import { TrackingRulesPage } from './app/tracking/TrackingRulesPage';
import { RecommendationPage } from './app/recommendation/RecommendationPage';
import { LoaderScriptPage } from './app/loader-script/LoaderScriptPage';
import { MainLayout } from './components/layout/MainLayout';

export default function App() {
  const { user, handleLogin, handleLogout } = useAuth();
  const {
    container,
    setContainer,
    onboardingStep,
    createContainer,
    selectDomainType,
    startOnboarding,
  } = useContainer(user);

  // Start onboarding when user logs in
  useEffect(() => {
    if (user.isAuthenticated && onboardingStep === 0 && !container) {
      startOnboarding();
    }
  }, [user.isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            user.isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage onLogin={handleLogin} />
            )
          } 
        />

        <Route 
          path="/onboarding" 
          element={
            !user.isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : onboardingStep === 0 ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <OnboardingPage 
                step={onboardingStep} 
                onCreateContainer={createContainer} 
                onSelectDomain={selectDomainType} 
              />
            )
          } 
        />

        <Route 
          path="/dashboard/*" 
          element={
            !user.isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : onboardingStep > 0 ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <MainLayout 
                userEmail={user.currentUser?.email}
                onLogout={handleLogout}
              />
            )
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route 
            path="overview" 
            element={
              <DashboardPage 
                user={user} 
                container={container} 
                setContainer={setContainer} 
                onLogout={handleLogout} 
              />
            } 
          />
          <Route 
            path="tracking-rules" 
            element={
              <TrackingRulesPage 
                container={container} 
                setContainer={setContainer} 
              />
            } 
          />
          <Route 
            path="recommendation-display" 
            element={
              <RecommendationPage 
                container={container} 
                setContainer={setContainer} 
              />
            } 
          />
          <Route 
            path="loader-script" 
            element={
              <LoaderScriptPage 
                container={container} 
              />
            } 
          />
          <Route path="documentation"/>
        </Route>

        <Route 
          path="*" 
          element={
            <Navigate to={!user.isAuthenticated ? "/login" : onboardingStep > 0 ? "/onboarding" : "/dashboard"} replace />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
