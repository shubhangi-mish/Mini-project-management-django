# Mini Project Management - Frontend

A modern React frontend application built with TypeScript for the Mini Project Management system.

## 🚀 Tech Stack

- **React 19** - Modern React with functional components and hooks
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **Apollo Client** - GraphQL client for data fetching
- **React Router** - Client-side routing

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── common/         # Shared components (Layout, LoadingSpinner, etc.)
│   ├── projects/       # Project-related components
│   └── tasks/          # Task-related components
├── hooks/              # Custom React hooks
├── graphql/            # GraphQL queries and mutations
│   ├── queries/        # GraphQL queries
│   ├── mutations/      # GraphQL mutations
│   └── generated/      # Generated TypeScript types
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and configurations
└── assets/             # Static assets
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- npm 8+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update the `.env` file with your GraphQL endpoint:
```env
VITE_GRAPHQL_ENDPOINT=http://localhost:8000/graphql/
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

## 🔧 Configuration

### TypeScript

The project uses strict TypeScript configuration with:
- Strict type checking enabled
- Path mapping for cleaner imports (`@/components/*`, `@/types/*`, etc.)
- Additional strict checks for better code quality

### ESLint

Configured with:
- TypeScript ESLint rules
- React hooks rules
- Custom rules for code quality

### TailwindCSS

Configured with:
- Forms plugin for better form styling
- Typography plugin for content styling
- Custom configuration in `tailwind.config.js`

## 🌐 GraphQL Integration

The application uses Apollo Client for GraphQL integration:

- **Client Configuration**: `src/utils/apolloClient.ts`
- **Error Handling**: Global error handling for GraphQL and network errors
- **Caching**: Optimized cache policies for efficient data management
- **Organization Context**: Automatic organization slug injection in headers

## 📝 Type Definitions

Comprehensive TypeScript interfaces are defined in `src/types/index.ts`:

- Core domain types (Project, Task, TaskComment, Organization)
- GraphQL response types
- Form input types
- Hook return types
- UI component types

## 🎨 Styling

The application uses TailwindCSS for styling:

- Utility-first approach
- Responsive design with mobile-first breakpoints
- Custom color scheme and typography
- Component-based styling patterns

## 🔗 API Integration

The frontend is designed to work with the Django GraphQL backend:

- Organization-based multi-tenancy
- Real-time updates with Apollo Client cache
- Optimistic updates for better UX
- Error handling and retry logic

## 📱 Features

### Planned Components

- **Project Management**: List, create, edit, and delete projects
- **Task Board**: Kanban-style task management
- **Task Comments**: Collaborative task discussions
- **Statistics Dashboard**: Project analytics and insights
- **Responsive Design**: Mobile-friendly interface

### Planned Hooks

- `useProjects` - Project data management
- `useTasks` - Task data management  
- `useOrganization` - Organization context management

## 🚀 Getting Started

1. Start the development server:
```bash
npm run dev
```

2. Open your browser to `http://localhost:5173`

3. The application will show a welcome screen confirming the setup is complete

## 🔄 Next Steps

This setup provides the foundation for the Mini Project Management frontend. The next tasks in the implementation plan will add:

1. Apollo Client configuration and GraphQL code generation
2. Organization context and routing
3. Project dashboard and list components
4. Task board and management interface
5. Real-time updates and optimizations

## 📋 Requirements Covered

This setup addresses the following requirements:

- **7.1**: Responsive project dashboard foundation
- **8.1**: Task board interface structure  
- **9.1**: Real-time data synchronization setup with Apollo Client

## 🤝 Contributing

When adding new components or features:

1. Follow the established directory structure
2. Use TypeScript for all new files
3. Follow the ESLint configuration
4. Add proper type definitions
5. Use TailwindCSS for styling
6. Test components thoroughly

## 📄 License

This project is part of the Mini Project Management system.