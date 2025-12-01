import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Container, UserState, TrackingRule, DomainType } from './types';
import { DOMAIN_PRESETS } from './lib/constants';
import { generateUUID } from './lib/utils';

import { AuthPage } from './app/auth/AuthPage';
import { OnboardingPage } from './app/onboarding/OnboardingPage';
import { DashboardPage } from './app/dashboard/DashboardPage';
import { TrackingRulesPage } from './app/tracking/TrackingRulesPage';
import { RecommendationPage } from './app/recommendation/RecommendationPage';
import { LoaderScriptPage } from './app/loader-script/LoaderScriptPage';
import { MainLayout } from './components/layout/MainLayout';

export default function App() {
  // --- Global State ---
  const [user, setUser] = useState<UserState>({ isAuthenticated: false, currentUser: null });
  const [container, setContainer] = useState<Container | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // --- Auth Handlers (Mock) ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ isAuthenticated: true, currentUser: { name: 'Demo User', email: 'user@example.com' } });
    setOnboardingStep(1);
  };

  // --- Container Handlers ---
  const createContainer = (url: string) => {
    const newContainer: Container = {
      id: generateUUID(),
      uuid: generateUUID(),
      name: new URL(url).hostname,
      url: url,
      domainType: 'general',
      rules: [],
      outputConfig: { displayMethods: [] }
    };
    setContainer(newContainer);
    setOnboardingStep(2);
  };

  const selectDomainType = (type: DomainType) => {
    if (!container) return;
    
    // Apply presets
    const presets = DOMAIN_PRESETS[type].map(p => ({
        id: generateUUID(),
        name: p.name!,
        trigger: p.trigger!,
        selector: p.selector!,
        extraction: [
            { field: 'itemId', method: 'static', value: '{{auto_detect}}' },
            { field: 'event', method: 'static', value: p.name?.toLowerCase().replace(' ', '_') },
            { field: 'category', method: 'static', value: type },
            { field: 'userId', method: 'js_variable', value: 'window.USER_ID' },
        ]
    } as TrackingRule));

    setContainer({ ...container, domainType: type, rules: presets });
    setOnboardingStep(0);
  };

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
                onLogout={() => setUser({ isAuthenticated: false, currentUser: null })}
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
                onLogout={() => setUser({ isAuthenticated: false, currentUser: null })} 
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
