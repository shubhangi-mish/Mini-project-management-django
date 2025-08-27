import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { OrganizationProvider } from '../../contexts/OrganizationContext';

// Mock the responsive hook
jest.mock('../../hooks/useResponsive', () => ({
  useMobileMenu: () => ({
    isOpen: false,
    toggle: jest.fn(),
    open: jest.fn(),
    close: jest.fn(),
  }),
}));

// Mock organization context
const mockOrganization = {
  id: '1',
  name: 'Test Organization',
  slug: 'test-org',
  contactEmail: 'test@example.com',
};

const MockOrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <OrganizationProvider>
    {children}
  </OrganizationProvider>
);

const renderLayout = (title?: string) => {
  return render(
    <BrowserRouter>
      <MockOrganizationProvider>
        <Layout title={title}>
          <div>Test Content</div>
        </Layout>
      </MockOrganizationProvider>
    </BrowserRouter>
  );
};

describe('Layout Mobile Responsiveness', () => {
  beforeEach(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('renders mobile menu button on small screens', () => {
    renderLayout();
    
    const menuButton = screen.queryByLabelText('Toggle navigation menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('displays app title with mobile abbreviation', () => {
    renderLayout();
    
    // Should show abbreviated title on mobile
    expect(screen.getByText('MPM')).toBeInTheDocument();
  });

  it('shows page title in mobile header when provided', () => {
    renderLayout('Test Page');
    
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('applies touch-friendly classes to interactive elements', () => {
    renderLayout();
    
    const menuButton = screen.getByLabelText('Toggle navigation menu');
    expect(menuButton).toHaveClass('min-w-touch', 'min-h-touch');
  });

  it('handles mobile menu toggle', () => {
    const { useMobileMenu } = require('../../hooks/useResponsive');
    const mockToggle = jest.fn();
    
    useMobileMenu.mockReturnValue({
      isOpen: false,
      toggle: mockToggle,
      open: jest.fn(),
      close: jest.fn(),
    });

    renderLayout();
    
    const menuButton = screen.getByLabelText('Toggle navigation menu');
    fireEvent.click(menuButton);
    
    expect(mockToggle).toHaveBeenCalled();
  });

  it('applies responsive padding and margins', () => {
    renderLayout();
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass('px-3', 'sm:px-4', 'lg:px-6', 'xl:px-8');
    expect(main).toHaveClass('py-4', 'sm:py-6', 'lg:py-8');
  });

  it('shows organization selector with responsive width', () => {
    renderLayout();
    
    // Organization selector should have responsive width classes
    const selector = document.querySelector('.w-32.sm\\:w-48.lg\\:w-64');
    expect(selector).toBeInTheDocument();
  });
});

describe('Layout Accessibility', () => {
  it('has proper ARIA attributes for mobile menu', () => {
    renderLayout();
    
    const menuButton = screen.getByLabelText('Toggle navigation menu');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('maintains focus management for keyboard navigation', () => {
    renderLayout();
    
    const menuButton = screen.getByLabelText('Toggle navigation menu');
    expect(menuButton).toHaveClass('focus:outline-none', 'focus:ring-2');
  });

  it('provides semantic navigation structure', () => {
    renderLayout();
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});

describe('Layout Performance', () => {
  it('uses CSS transitions for smooth animations', () => {
    renderLayout();
    
    const mobileMenu = document.querySelector('.transition-all.duration-300');
    expect(mobileMenu).toBeInTheDocument();
  });

  it('applies transform optimizations for animations', () => {
    renderLayout();
    
    const menuIcon = document.querySelector('.transition-transform');
    expect(menuIcon).toBeInTheDocument();
  });
});