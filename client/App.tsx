import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, useContainer } from './hooks';
import { AuthPage } from './app/auth/AuthPage';
import { DashboardPage } from './app/dashboard/DashboardPage';
import { TrackingRulesPage } from './app/tracking/TrackingRulesPage';
import { LoaderScriptPage } from './app/loader-script/LoaderScriptPage';
import { ItemUploadPage } from './app/item-upload/ItemUploadPage';
import { ReturnMethodPage } from './app/return-method/returnMethodPage';
import { ReturnMethodFormPage } from './app/return-method/ReturnMethodFormPage';
import { DomainSelectionPage } from './app/domain-selection/DomainSelectionPage';
import { OnboardingPage } from './app/onboarding/OnboardingPage';
import { MainLayout } from './components/layout/MainLayout';
import { DataCacheProvider } from './contexts/DataCacheContext';

function AppContent() {
  const { user, loading, signin, signout } = useAuth();
  const { container, setContainer } = useContainer();
  const [selectedDomainKey, setSelectedDomainKey] = useState<string | null>(
    localStorage.getItem('selectedDomainKey')
  );
  
  const isAuthenticated = user !== null;

  const handleSelectDomain = (domainKey: string) => {
    setSelectedDomainKey(domainKey);
    localStorage.setItem('selectedDomainKey', domainKey);
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/select-domain" replace />
            ) : (
              <AuthPage onLogin={signin} />
            )
          } 
        />

        <Route 
          path="/select-domain" 
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : (
              <DomainSelectionPage 
                onSelectDomain={handleSelectDomain}
                onLogout={signout}
              />
            )
          } 
        />

        <Route 
          path="/onboarding" 
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : (
              <OnboardingPage onLogout={signout} />
            )
          } 
        />

        <Route 
          path="/dashboard/*" 
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : !selectedDomainKey ? (
              <Navigate to="/select-domain" replace />
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
              <ReturnMethodPage 
                container={container} 
                setContainer={setContainer} 
              />
            } 
          />
          <Route 
            path="recommendation-display/create" 
            element={
              <ReturnMethodFormPage 
                container={container} 
                mode="create"
              />
            } 
          />
          <Route 
            path="recommendation-display/edit/:id" 
            element={
              <ReturnMethodFormPage 
                container={container} 
                mode="edit"
              />
            } 
          />
          <Route 
            path="recommendation-display/view/:id" 
            element={
              <ReturnMethodFormPage 
                container={container} 
                mode="view"
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
          <Route 
            path="item-upload" 
            element={
              <ItemUploadPage
                container={container}
              />} 
          />
          <Route path="documentation"/>
        </Route>

        <Route 
          path="*" 
          element={
            <Navigate to={isAuthenticated ? "/select-domain" : "/login"} replace />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <DataCacheProvider>
      <AppContent />
    </DataCacheProvider>
  );
}
