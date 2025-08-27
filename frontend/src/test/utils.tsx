import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { BrowserRouter } from 'react-router-dom'
import { OrganizationProvider } from '../contexts/OrganizationContext'
import { mockOrganization } from './mocks'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  mocks?: MockedResponse[]
  addTypename?: boolean
  organization?: typeof mockOrganization
  initialRoute?: string
}

const AllTheProviders = ({ 
  children, 
  mocks = [], 
  addTypename = false,
  organization = mockOrganization,
  initialRoute = '/'
}: {
  children: React.ReactNode
  mocks?: MockedResponse[]
  addTypename?: boolean
  organization?: typeof mockOrganization
  initialRoute?: string
}) => {
  // Set initial route if provided
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute)
  }

  return (
    <MockedProvider mocks={mocks} addTypename={addTypename}>
      <BrowserRouter>
        <OrganizationProvider initialOrganization={organization}>
          {children}
        </OrganizationProvider>
      </BrowserRouter>
    </MockedProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { 
    mocks, 
    addTypename, 
    organization, 
    initialRoute,
    ...renderOptions 
  } = options

  return render(ui, {
    wrapper: (props) => (
      <AllTheProviders 
        {...props} 
        mocks={mocks}
        addTypename={addTypename}
        organization={organization}
        initialRoute={initialRoute}
      />
    ),
    ...renderOptions,
  })
}

// Helper function to wait for Apollo loading to complete
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Helper function to create a mock organization
export const createMockOrganization = (overrides = {}) => ({
  ...mockOrganization,
  ...overrides
})

// Helper function to create form data for testing
export const createFormData = (data: Record<string, any>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, value.toString())
    }
  })
  return formData
}

// Helper function to simulate user typing
export const typeIntoInput = async (
  input: HTMLElement, 
  text: string,
  userEvent: any
) => {
  await userEvent.clear(input)
  await userEvent.type(input, text)
}

// Helper function to check accessibility
export const checkAccessibility = (element: HTMLElement) => {
  // Check for proper ARIA labels
  const interactiveElements = element.querySelectorAll(
    'button, input, select, textarea, [role="button"], [role="link"]'
  )
  
  interactiveElements.forEach(el => {
    const hasLabel = 
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      (el as HTMLInputElement).labels?.length > 0
    
    if (!hasLabel) {
      console.warn('Interactive element missing accessibility label:', el)
    }
  })

  // Check for proper heading hierarchy
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
  let previousLevel = 0
  
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1))
    if (level > previousLevel + 1) {
      console.warn('Heading hierarchy skip detected:', heading)
    }
    previousLevel = level
  })

  return true
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }