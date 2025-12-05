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
  const { user, loading, signin, signout } = useAuth();
  const {
    container,
    setContainer,
    onboardingStep,
    createContainer,
    selectDomainType,
    startOnboarding,
  } = useContainer(user);
  const isAuthenticated = user !== null;
  // Start onboarding when user logs in
  useEffect(() => {
    if (isAuthenticated && onboardingStep === 0 && !container) {
      startOnboarding();
    }
  }, [isAuthenticated]);
  if (loading) return <div>Loading...</div>;
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage onLogin={signin} />
            )
          } 
        />

        <Route 
          path="/onboarding" 
          element={
            !isAuthenticated ? (
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
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : onboardingStep > 0 ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <MainLayout 
                userEmail={user?.username}
                onLogout={signout}
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
                onLogout={signout} 
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
            <Navigate to={!isAuthenticated ? "/login" : onboardingStep > 0 ? "/onboarding" : "/dashboard"} replace />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
