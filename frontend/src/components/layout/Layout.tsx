import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useOrganizationContext } from '../../contexts/OrganizationContext';
import { OrganizationSelector } from '../organization/OrganizationSelector';
import { useMobileMenu } from '../../hooks/useResponsive';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { currentOrganization, error } = useOrganizationContext();
  const location = useLocation();
  const mobileMenu = useMobileMenu();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Mobile menu button and title */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile menu button */}
              {currentOrganization && (
                <button
                  onClick={mobileMenu.toggle}
                  className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 min-w-touch min-h-touch"
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenu.isOpen}
                >
                  <svg
                    className={`h-5 w-5 transition-transform duration-200 ${mobileMenu.isOpen ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={mobileMenu.isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                    />
                  </svg>
                </button>
              )}
              
              {/* App title - responsive */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  <span className="hidden sm:inline">
                    {import.meta.env['VITE_APP_NAME'] || 'Mini Project Management'}
                  </span>
                  <span className="sm:hidden">MPM</span>
                </h1>
                {title && (
                  <>
                    <span className="hidden sm:inline text-gray-400">/</span>
                    <span className="hidden sm:inline text-sm lg:text-lg text-gray-600 truncate max-w-32 lg:max-w-none">
                      {title}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {/* Desktop controls */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <OrganizationSelector 
                className="w-32 sm:w-48 lg:w-64" 
                showLabel={false}
              />
              <div className="hidden sm:block text-xs lg:text-sm text-gray-500">
                v{import.meta.env['VITE_APP_VERSION'] || '1.0.0'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Organization context error banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm text-red-700">
                <strong>Organization Error:</strong> {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current organization info - mobile optimized */}
      {currentOrganization && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-blue-700 min-w-0">
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="truncate">
                  <span className="hidden sm:inline">Working in: </span>
                  <strong>{currentOrganization.name}</strong>
                </span>
              </div>
              <div className="text-xs text-blue-600 truncate ml-2 max-w-32 sm:max-w-none">
                {currentOrganization.contactEmail}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation - responsive with mobile menu */}
      {currentOrganization && (
        <>
          {/* Desktop Navigation */}
          <nav className="hidden md:block bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-8">
                <Link
                  to={`/org/${currentOrganization.slug}`}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    location.pathname === `/org/${currentOrganization.slug}`
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to={`/org/${currentOrganization.slug}/projects`}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    location.pathname === `/org/${currentOrganization.slug}/projects`
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Projects
                </Link>
                <Link
                  to={`/org/${currentOrganization.slug}/tasks`}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    location.pathname === `/org/${currentOrganization.slug}/tasks`
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Tasks
                </Link>
              </div>
            </div>
          </nav>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden bg-white border-b border-gray-200 transition-all duration-300 ease-in-out ${
            mobileMenu.isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
            <div className="px-4 py-2 space-y-1">
              <Link
                to={`/org/${currentOrganization.slug}`}
                onClick={mobileMenu.close}
                className={`block px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 min-h-touch ${
                  location.pathname === `/org/${currentOrganization.slug}`
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to={`/org/${currentOrganization.slug}/projects`}
                onClick={mobileMenu.close}
                className={`block px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 min-h-touch ${
                  location.pathname === `/org/${currentOrganization.slug}/projects`
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Projects
              </Link>
              <Link
                to={`/org/${currentOrganization.slug}/tasks`}
                onClick={mobileMenu.close}
                className={`block px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 min-h-touch ${
                  location.pathname === `/org/${currentOrganization.slug}/tasks`
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Tasks
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Mobile page title */}
      {title && currentOrganization && (
        <div className="md:hidden bg-gray-50 border-b border-gray-200 px-4 py-2">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
};