import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks';
import { useContainer } from './contexts/ContainerContext';
import { AuthPage } from './app/auth/AuthPage';
import { DashboardPage } from './app/dashboard/DashboardPage';
import { TrackingRulesPage } from './app/tracking/TrackingRulesPage';
import { LoaderScriptPage } from './app/loader-script/LoaderScriptPage';
import { ItemUploadPage } from './app/item-upload/ItemUploadPage';
import { ReturnMethodPage } from './app/return-method/returnMethodPage';
import { ReturnMethodFormPage } from './app/return-method/ReturnMethodFormPage';
import { SearchInputFormPage } from './app/return-method/SearchInputFormPage';
import { DomainSelectionPage } from './app/domain-selection/DomainSelectionPage';
import { OnboardingPage } from './app/onboarding/OnboardingPage';
import { AdminPage } from './app/admin/AdminPage';
import { MainLayout } from './components/layout/MainLayout';
import { DataCacheProvider } from './contexts/DataCacheContext';
import { ContainerProvider } from './contexts/ContainerContext';
import type { DomainResponse } from './lib/api/types';
import type { Container, DomainType } from './types';

function AppContent() {
  const { user, loading, signin, signout } = useAuth();
  const { container, setContainer, domains, setDomains } = useContainer();
  const [selectedDomainKey, setSelectedDomainKey] = useState<string | null>(
    localStorage.getItem('selectedDomainKey')
  );

  const isAuthenticated = user !== null;

  // Map DomainResponse to Container type
  const mapDomainToContainer = (domain: DomainResponse): Container => {
    const domainTypeMap: Record<number, DomainType> = {
      1: 'Music Streaming',
      2: 'Movies & Video',
      3: 'E-Commerce',
      4: 'News & Media',
      5: 'General',
    };

    return {
      id: domain.Id.toString(),
      uuid: domain.Key,
      name: new URL(domain.Url).hostname,
      url: domain.Url,
      domainType: domainTypeMap[domain.Type] || 'General',
      rules: [],
      outputConfig: {
        displayMethods: [],
      },
    };
  };

  // Update container when selectedDomainKey or domains change
  useEffect(() => {
    if (selectedDomainKey && domains.length > 0) {
      const selectedDomain = domains.find(d => d.Key === selectedDomainKey);
      if (selectedDomain) {
        setContainer(mapDomainToContainer(selectedDomain));
      }
    }
  }, [selectedDomainKey, domains]);

  // Log user info for verification
  useEffect(() => {
    if (user) {
      console.log('User Info:', user);
    }
  }, [user]);

  const handleSelectDomain = (domainKey: string) => {
    setSelectedDomainKey(domainKey);
    localStorage.setItem('selectedDomainKey', domainKey);
  };

  const handleDomainCreated = (newDomain: DomainResponse) => {
    setSelectedDomainKey(newDomain.Key);
    localStorage.setItem('selectedDomainKey', newDomain.Key);
    setDomains([...domains, newDomain]);
    setContainer(mapDomainToContainer(newDomain));
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
              <OnboardingPage onLogout={signout} onDomainCreated={handleDomainCreated} />
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
                userRole={user?.role}
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
                domains={domains}
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
            path="recommendation-display/search-input/create"
            element={
              <SearchInputFormPage
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
            path="recommendation-display/search-input/edit/:id"
            element={
              <SearchInputFormPage
                container={container}
                mode="edit"
              />
            }
          />
          <Route
            path="recommendation-display/search-input/view/:id"
            element={
              <SearchInputFormPage
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
          <Route
            path="admin"
            element={
              <AdminPage />
            }
          />
          <Route path="documentation" />
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
      <ContainerProvider>
        <AppContent />
      </ContainerProvider>
    </DataCacheProvider>
  );
}
