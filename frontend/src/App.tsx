import { ApolloProvider } from '@apollo/client/react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { apolloClient } from './utils/apolloClient';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { OrganizationRoute } from './components/routing/OrganizationRoute';
import { OrganizationSelection } from './components/organization/OrganizationSelection';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Tasks } from './pages/Tasks';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './styles/mobile.css';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Organization selection route */}
        <Route path="/" element={<OrganizationSelection />} />
        
        {/* Organization-scoped routes */}
        <Route path="/org/:organizationSlug" element={
          <OrganizationRoute>
            <Dashboard />
          </OrganizationRoute>
        } />
        
        <Route path="/org/:organizationSlug/projects" element={
          <OrganizationRoute>
            <Projects />
          </OrganizationRoute>
        } />
        
        <Route path="/org/:organizationSlug/tasks" element={
          <OrganizationRoute>
            <Tasks />
          </OrganizationRoute>
        } />
        
        {/* Catch-all redirect to organization selection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to console in development
        console.error('Global error boundary caught:', error, errorInfo);
        
        // In production, you might want to log to an error reporting service
        if (process.env['NODE_ENV'] === 'production') {
          // Example: logErrorToService(error, errorInfo);
        }
      }}
    >
      <ApolloProvider client={apolloClient}>
        <Router>
          <OrganizationProvider>
            <AnimatedRoutes />
          </OrganizationProvider>
        </Router>
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default App;
