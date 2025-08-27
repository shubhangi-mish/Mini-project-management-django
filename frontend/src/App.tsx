import { ApolloProvider } from '@apollo/client/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { apolloClient } from './utils/apolloClient';
import { ApolloTest } from './components/common/ApolloTest';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {import.meta.env['VITE_APP_NAME'] || 'Mini Project Management'}
                </h1>
                <div className="text-sm text-gray-500">
                  v{import.meta.env['VITE_APP_VERSION'] || '1.0.0'}
                </div>
              </div>
            </div>
          </header>
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Mini Project Management
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                A modern project management system built with React, TypeScript, and GraphQL
              </p>
              
              <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Project Setup Complete ✅
                </h3>
                <ul className="text-left space-y-2 text-sm text-gray-600">
                  <li>✅ React with TypeScript</li>
                  <li>✅ TailwindCSS for styling</li>
                  <li>✅ Apollo Client for GraphQL</li>
                  <li>✅ React Router for navigation</li>
                  <li>✅ Project structure organized</li>
                  <li>✅ TypeScript interfaces defined</li>
                  <li>✅ GraphQL code generation configured</li>
                  <li>✅ Organization context management</li>
                </ul>
              </div>
              
              {/* Apollo Client Test Component */}
              <div className="max-w-4xl mx-auto">
                <ApolloTest />
              </div>
            </div>
          </main>
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;
