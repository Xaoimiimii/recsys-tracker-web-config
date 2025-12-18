import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, useContainer, useDomainSelection } from './hooks';
import { AuthPage } from './app/auth/AuthPage';
import { OnboardingPage } from './app/onboarding/OnboardingPage';
import { DomainSelectionPage } from './app/domain-selection/DomainSelectionPage';
import { DashboardPage } from './app/dashboard/DashboardPage';
import { TrackingRulesPage } from './app/tracking/TrackingRulesPage';
import { RecommendationPage } from './app/recommendation/RecommendationPage';
import { LoaderScriptPage } from './app/loader-script/LoaderScriptPage';
import { ItemUploadPage } from './app/item-upload/ItemUploadPage';
import { ReturnMethodPage } from './app/return-method/returnMethodPage';
import { ReturnMethodFormPage } from './app/return-method/ReturnMethodFormPage';
import { MainLayout } from './components/layout/MainLayout';
import { DataCacheProvider } from './contexts/DataCacheContext';

import { domainApi } from './lib/api';
import { DOMAIN_TYPE_TO_NUMBER } from './lib/constants';
import { DomainType } from './types';

function AppContent() {
  const { user, loading, signin, signout } = useAuth();
  const {
    selectedDomainKey,
    needsOnboarding,
    selectDomain,
    startNewDomainFlow,
    completeOnboarding,
  } = useDomainSelection();
  
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingUrl, setOnboardingUrl] = useState('');
  
  const {
    container,
    setContainer,
    isLoadingDomain,
  } = useContainer(
    user ? { 
      isAuthenticated: true, 
      currentUser: { 
        name: user.name, 
        email: user.username 
      } 
    } : { 
      isAuthenticated: false, 
      currentUser: null 
    }, 
    selectedDomainKey || undefined
  );
  
  const isAuthenticated = user !== null;

  const handleCreateContainer = async (url: string) => {
    setOnboardingUrl(url);
    setOnboardingStep(2);
  };

  const handleSelectDomainType = async (type: DomainType) => {
    if (!user) return;
    
    try {
      // Gọi API tạo domain mới với type number
      const typeNumber = DOMAIN_TYPE_TO_NUMBER[type];
      const newDomain = await domainApi.create({
        ternantId: user.id,
        url: onboardingUrl,
        type: typeNumber,
      });
      
      // Complete onboarding và select domain mới
      completeOnboarding(newDomain.Key);
      setOnboardingStep(0);
    } catch (error) {
      console.error('Failed to create domain:', error);
      alert('Failed to create domain. Please try again.');
    }
  };

  const handleSelectExistingDomain = (domainKey: string) => {
    selectDomain(domainKey);
  };

  const handleCreateNewDomain = () => {
    startNewDomainFlow();
    setOnboardingStep(1);
  };

  if (loading || (selectedDomainKey && isLoadingDomain)) {
    return <div>Loading...</div>;
  }
  
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/domain-selection" replace />
            ) : (
              <AuthPage onLogin={signin} />
            )
          } 
        />

        <Route 
          path="/domain-selection" 
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : needsOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : selectedDomainKey ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <DomainSelectionPage 
                onSelectDomain={handleSelectExistingDomain}
                onCreateNewDomain={handleCreateNewDomain}
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
            ) : !needsOnboarding ? (
              <Navigate to="/domain-selection" replace />
            ) : onboardingStep === 0 ? (
              <Navigate to="/domain-selection" replace />
            ) : (
              <OnboardingPage 
                step={onboardingStep} 
                onCreateContainer={handleCreateContainer} 
                onSelectDomain={handleSelectDomainType}
                onLogout={signout}
              />
            )
          } 
        />

        <Route 
          path="/dashboard/*" 
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : !selectedDomainKey || needsOnboarding ? (
              <Navigate to="/domain-selection" replace />
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
            <Navigate to={
              !isAuthenticated 
                ? "/login" 
                : !selectedDomainKey || needsOnboarding
                  ? "/domain-selection"
                  : "/dashboard"
            } replace />
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
