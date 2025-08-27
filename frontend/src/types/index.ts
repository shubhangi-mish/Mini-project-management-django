// Core domain types for the Mini Project Management System

export interface Organization {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate?: string;
  taskCount: number;
  completedTasks: number;
  createdAt: string;
  updatedAt: string;
  organization: Organization;
  tasks?: Task[];
  taskStatistics?: TaskStatistics;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeEmail: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  project: Project;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  content: string;
  authorEmail: string;
  createdAt: string;
  task: Task;
}

// Enums for status types
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

// Statistics and analytics types
export interface TaskStatistics {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  completionRate: number;
}

export interface ProjectStatistics {
  id: string;
  project: Project;
  taskStatistics: TaskStatistics;
  overdueTasks: number;
  recentActivity: number;
}

// Form input types
export interface CreateProjectInput {
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate?: string;
  organizationSlug: string;
}

export interface UpdateProjectInput {
  id: string;
  name?: string;
  description?: string;
  status?: ProjectStatus;
  dueDate?: string;
  organizationSlug: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  assigneeEmail: string;
  dueDate?: string;
  projectId: string;
  organizationSlug: string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  assigneeEmail?: string;
  dueDate?: string;
  organizationSlug: string;
}

export interface CreateTaskCommentInput {
  content: string;
  authorEmail: string;
  taskId: string;
  organizationSlug: string;
}

// GraphQL response types
export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export interface GraphQLError {
  message: string;
  code?: string;
  path?: string[];
  extensions?: Record<string, unknown>;
}

// Mutation payload types
export interface CreateProjectPayload {
  project?: Project;
  errors?: string[];
  success: boolean;
}

export interface UpdateProjectPayload {
  project?: Project;
  errors?: string[];
  success: boolean;
}

export interface DeleteProjectPayload {
  success: boolean;
  errors?: string[];
}

export interface CreateTaskPayload {
  task?: Task;
  errors?: string[];
  success: boolean;
}

export interface UpdateTaskPayload {
  task?: Task;
  errors?: string[];
  success: boolean;
}

export interface DeleteTaskPayload {
  success: boolean;
  errors?: string[];
}

export interface CreateTaskCommentPayload {
  comment?: TaskComment;
  errors?: string[];
  success: boolean;
}

// UI and component types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface FilterOptions {
  status?: ProjectStatus | TaskStatus;
  assigneeEmail?: string;
  dueDate?: string;
  search?: string;
}

export interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

// Context types
export interface OrganizationContextType {
  currentOrganization?: Organization;
  organizations: Organization[];
  setCurrentOrganization: (org: Organization) => void;
  isLoading: boolean;
  error?: string;
}

// Hook return types
export interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error?: string;
  refetch: () => void;
  createProject: (input: CreateProjectInput) => Promise<Project | null>;
  updateProject: (input: UpdateProjectInput) => Promise<Project | null>;
  deleteProject: (id: string, organizationSlug: string) => Promise<boolean>;
}

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error?: string;
  refetch: () => void;
  createTask: (input: CreateTaskInput) => Promise<Task | null>;
  updateTask: (input: UpdateTaskInput) => Promise<Task | null>;
  deleteTask: (id: string, organizationSlug: string) => Promise<boolean>;
}

export interface UseOrganizationReturn extends OrganizationContextType {
  switchOrganization: (slug: string) => void;
}