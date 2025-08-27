import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
};

export type CreateProjectInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  name: Scalars['String']['input'];
  organizationSlug: Scalars['String']['input'];
  status: ProjectStatus;
};

export type CreateProjectPayload = {
  __typename: 'CreateProjectPayload';
  errors: Maybe<Array<Scalars['String']['output']>>;
  project: Maybe<ProjectType>;
  success: Scalars['Boolean']['output'];
};

export type CreateTaskCommentInput = {
  authorEmail: Scalars['String']['input'];
  content: Scalars['String']['input'];
  organizationSlug: Scalars['String']['input'];
  taskId: Scalars['ID']['input'];
};

export type CreateTaskCommentPayload = {
  __typename: 'CreateTaskCommentPayload';
  comment: Maybe<TaskCommentType>;
  errors: Maybe<Array<Scalars['String']['output']>>;
  success: Scalars['Boolean']['output'];
};

export type CreateTaskInput = {
  assigneeEmail?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  organizationSlug: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
  status?: InputMaybe<TaskStatus>;
  title: Scalars['String']['input'];
};

export type CreateTaskPayload = {
  __typename: 'CreateTaskPayload';
  errors: Maybe<Array<Scalars['String']['output']>>;
  success: Scalars['Boolean']['output'];
  task: Maybe<TaskType>;
};

export type DeleteProjectInput = {
  id: Scalars['ID']['input'];
  organizationSlug: Scalars['String']['input'];
};

export type DeleteProjectPayload = {
  __typename: 'DeleteProjectPayload';
  deletedProjectId: Maybe<Scalars['ID']['output']>;
  errors: Maybe<Array<Scalars['String']['output']>>;
  success: Scalars['Boolean']['output'];
};

export type DeleteTaskInput = {
  id: Scalars['ID']['input'];
  organizationSlug: Scalars['String']['input'];
};

export type DeleteTaskPayload = {
  __typename: 'DeleteTaskPayload';
  deletedTaskId: Maybe<Scalars['ID']['output']>;
  errors: Maybe<Array<Scalars['String']['output']>>;
  success: Scalars['Boolean']['output'];
};

export type Mutation = {
  __typename: 'Mutation';
  createProject: CreateProjectPayload;
  createTask: CreateTaskPayload;
  createTaskComment: CreateTaskCommentPayload;
  deleteProject: DeleteProjectPayload;
  deleteTask: DeleteTaskPayload;
  updateProject: UpdateProjectPayload;
  updateTask: UpdateTaskPayload;
};


export type MutationCreateProjectArgs = {
  input: CreateProjectInput;
};


export type MutationCreateTaskArgs = {
  input: CreateTaskInput;
};


export type MutationCreateTaskCommentArgs = {
  input: CreateTaskCommentInput;
};


export type MutationDeleteProjectArgs = {
  input: DeleteProjectInput;
};


export type MutationDeleteTaskArgs = {
  input: DeleteTaskInput;
};


export type MutationUpdateProjectArgs = {
  input: UpdateProjectInput;
};


export type MutationUpdateTaskArgs = {
  input: UpdateTaskInput;
};

export type OrganizationStatistics = {
  __typename: 'OrganizationStatistics';
  activeProjects: Scalars['Int']['output'];
  completedProjects: Scalars['Int']['output'];
  completedTasks: Scalars['Int']['output'];
  onHoldProjects: Scalars['Int']['output'];
  organizationId: Scalars['ID']['output'];
  overallCompletionRate: Scalars['Float']['output'];
  projectCompletionRate: Scalars['Float']['output'];
  taskStatusBreakdown: TaskStatusBreakdown;
  totalProjects: Scalars['Int']['output'];
  totalTasks: Scalars['Int']['output'];
};

export type OrganizationType = {
  __typename: 'OrganizationType';
  contactEmail: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ProjectStatistics = {
  __typename: 'ProjectStatistics';
  assignedTasks: Scalars['Int']['output'];
  completedTasks: Scalars['Int']['output'];
  completionRate: Scalars['Float']['output'];
  inProgressTasks: Scalars['Int']['output'];
  overdueTasks: Scalars['Int']['output'];
  projectId: Scalars['ID']['output'];
  taskStatusBreakdown: TaskStatusBreakdown;
  todoTasks: Scalars['Int']['output'];
  totalTasks: Scalars['Int']['output'];
  unassignedTasks: Scalars['Int']['output'];
};

export type ProjectStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ON_HOLD'
  | '%future added value';

export type ProjectType = {
  __typename: 'ProjectType';
  completedTaskCount: Maybe<Scalars['Int']['output']>;
  completionPercentage: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  dueDate: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isOverdue: Maybe<Scalars['Boolean']['output']>;
  name: Scalars['String']['output'];
  organization: OrganizationType;
  statistics: Maybe<ProjectStatistics>;
  status: ProjectStatus;
  taskCount: Maybe<Scalars['Int']['output']>;
  tasks: Maybe<Array<TaskType>>;
  updatedAt: Scalars['DateTime']['output'];
};

export type Query = {
  __typename: 'Query';
  hello: Maybe<Scalars['String']['output']>;
  organizationStatistics: Maybe<OrganizationStatistics>;
  project: Maybe<ProjectType>;
  projectStatistics: Maybe<ProjectStatistics>;
  projects: Array<ProjectType>;
  task: Maybe<TaskType>;
  taskComments: Array<TaskCommentType>;
  tasks: Array<TaskType>;
};


export type QueryOrganizationStatisticsArgs = {
  organizationSlug: Scalars['String']['input'];
};


export type QueryProjectArgs = {
  id: Scalars['ID']['input'];
  organizationSlug: Scalars['String']['input'];
};


export type QueryProjectStatisticsArgs = {
  organizationSlug: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};


export type QueryProjectsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  organizationSlug: Scalars['String']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
};


export type QueryTaskArgs = {
  id: Scalars['ID']['input'];
  organizationSlug: Scalars['String']['input'];
};


export type QueryTaskCommentsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  organizationSlug: Scalars['String']['input'];
  taskId: Scalars['ID']['input'];
};


export type QueryTasksArgs = {
  assigneeEmail?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  organizationSlug: Scalars['String']['input'];
  projectId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type TaskCommentType = {
  __typename: 'TaskCommentType';
  authorDisplayName: Maybe<Scalars['String']['output']>;
  authorEmail: Scalars['String']['output'];
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  task: TaskType;
  updatedAt: Scalars['DateTime']['output'];
};

export type TaskStatus =
  | 'DONE'
  | 'IN_PROGRESS'
  | 'TODO'
  | '%future added value';

export type TaskStatusBreakdown = {
  __typename: 'TaskStatusBreakdown';
  doneCount: Scalars['Int']['output'];
  inProgressCount: Scalars['Int']['output'];
  todoCount: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export type TaskType = {
  __typename: 'TaskType';
  assigneeEmail: Maybe<Scalars['String']['output']>;
  commentCount: Maybe<Scalars['Int']['output']>;
  comments: Maybe<Array<TaskCommentType>>;
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  dueDate: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  isAssigned: Maybe<Scalars['Boolean']['output']>;
  isOverdue: Maybe<Scalars['Boolean']['output']>;
  project: ProjectType;
  status: TaskStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type UpdateProjectInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  organizationSlug: Scalars['String']['input'];
  status?: InputMaybe<ProjectStatus>;
};

export type UpdateProjectPayload = {
  __typename: 'UpdateProjectPayload';
  errors: Maybe<Array<Scalars['String']['output']>>;
  project: Maybe<ProjectType>;
  success: Scalars['Boolean']['output'];
};

export type UpdateTaskInput = {
  assigneeEmail?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['ID']['input'];
  organizationSlug: Scalars['String']['input'];
  status?: InputMaybe<TaskStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTaskPayload = {
  __typename: 'UpdateTaskPayload';
  errors: Maybe<Array<Scalars['String']['output']>>;
  success: Scalars['Boolean']['output'];
  task: Maybe<TaskType>;
};

export type OrganizationInfoFragment = { __typename: 'OrganizationType', id: string, name: string, slug: string, contactEmail: string };


export type OrganizationInfoFragmentVariables = Exact<{ [key: string]: never; }>;

export type ProjectBasicFragment = { __typename: 'ProjectType', id: string, name: string, description: string | null, status: ProjectStatus, dueDate: any | null, createdAt: any, updatedAt: any, taskCount: number | null, completedTaskCount: number | null, completionPercentage: number | null, isOverdue: boolean | null };


export type ProjectBasicFragmentVariables = Exact<{ [key: string]: never; }>;

export type ProjectWithOrganizationFragment = { __typename: 'ProjectType', id: string, name: string, description: string | null, status: ProjectStatus, dueDate: any | null, createdAt: any, updatedAt: any, taskCount: number | null, completedTaskCount: number | null, completionPercentage: number | null, isOverdue: boolean | null, organization: { __typename: 'OrganizationType', id: string, name: string, slug: string, contactEmail: string } };


export type ProjectWithOrganizationFragmentVariables = Exact<{ [key: string]: never; }>;

export type TaskBasicFragment = { __typename: 'TaskType', id: string, title: string, description: string | null, status: TaskStatus, assigneeEmail: string | null, dueDate: any | null, createdAt: any, updatedAt: any, isOverdue: boolean | null, isAssigned: boolean | null, commentCount: number | null };


export type TaskBasicFragmentVariables = Exact<{ [key: string]: never; }>;

export type TaskWithProjectFragment = { __typename: 'TaskType', id: string, title: string, description: string | null, status: TaskStatus, assigneeEmail: string | null, dueDate: any | null, createdAt: any, updatedAt: any, isOverdue: boolean | null, isAssigned: boolean | null, commentCount: number | null, project: { __typename: 'ProjectType', id: string, name: string, status: ProjectStatus, organization: { __typename: 'OrganizationType', id: string, name: string, slug: string, contactEmail: string } } };


export type TaskWithProjectFragmentVariables = Exact<{ [key: string]: never; }>;

export type TaskCommentBasicFragment = { __typename: 'TaskCommentType', id: string, content: string, authorEmail: string, authorDisplayName: string | null, createdAt: any };


export type TaskCommentBasicFragmentVariables = Exact<{ [key: string]: never; }>;

export type TaskCommentWithTaskFragment = { __typename: 'TaskCommentType', id: string, content: string, authorEmail: string, authorDisplayName: string | null, createdAt: any, task: { __typename: 'TaskType', id: string, title: string, project: { __typename: 'ProjectType', id: string, name: string, organization: { __typename: 'OrganizationType', id: string, slug: string } } } };


export type TaskCommentWithTaskFragmentVariables = Exact<{ [key: string]: never; }>;

export type TaskStatusBreakdownInfoFragment = { __typename: 'TaskStatusBreakdown', todoCount: number, inProgressCount: number, doneCount: number, totalCount: number };


export type TaskStatusBreakdownInfoFragmentVariables = Exact<{ [key: string]: never; }>;

export type ProjectStatisticsInfoFragment = { __typename: 'ProjectStatistics', projectId: string, totalTasks: number, completedTasks: number, inProgressTasks: number, todoTasks: number, completionRate: number, assignedTasks: number, unassignedTasks: number, overdueTasks: number, taskStatusBreakdown: { __typename: 'TaskStatusBreakdown', todoCount: number, inProgressCount: number, doneCount: number, totalCount: number } };


export type ProjectStatisticsInfoFragmentVariables = Exact<{ [key: string]: never; }>;

export type OrganizationStatisticsInfoFragment = { __typename: 'OrganizationStatistics', organizationId: string, totalProjects: number, activeProjects: number, completedProjects: number, onHoldProjects: number, totalTasks: number, completedTasks: number, overallCompletionRate: number, projectCompletionRate: number, taskStatusBreakdown: { __typename: 'TaskStatusBreakdown', todoCount: number, inProgressCount: number, doneCount: number, totalCount: number } };


export type OrganizationStatisticsInfoFragmentVariables = Exact<{ [key: string]: never; }>;

export type CreateProjectMutationVariables = Exact<{
  input: CreateProjectInput;
}>;


export type CreateProjectMutation = { __typename: 'Mutation', createProject: { __typename: 'CreateProjectPayload', success: boolean, errors: Array<string> | null, project: { __typename: 'ProjectType', id: string, name: string, description: string | null, status: ProjectStatus, dueDate: any | null, createdAt: any, updatedAt: any, taskCount: number | null, completedTaskCount: number | null, completionPercentage: number | null, isOverdue: boolean | null, organization: { __typename: 'OrganizationType', id: string, name: string, slug: string } } | null } };

export type UpdateProjectMutationVariables = Exact<{
  input: UpdateProjectInput;
}>;


export type UpdateProjectMutation = { __typename: 'Mutation', updateProject: { __typename: 'UpdateProjectPayload', success: boolean, errors: Array<string> | null, project: { __typename: 'ProjectType', id: string, name: string, description: string | null, status: ProjectStatus, dueDate: any | null, createdAt: any, updatedAt: any, taskCount: number | null, completedTaskCount: number | null, completionPercentage: number | null, isOverdue: boolean | null, organization: { __typename: 'OrganizationType', id: string, name: string, slug: string } } | null } };

export type DeleteProjectMutationVariables = Exact<{
  input: DeleteProjectInput;
}>;


export type DeleteProjectMutation = { __typename: 'Mutation', deleteProject: { __typename: 'DeleteProjectPayload', success: boolean, errors: Array<string> | null, deletedProjectId: string | null } };

export type CreateTaskMutationVariables = Exact<{
  input: CreateTaskInput;
}>;


export type CreateTaskMutation = { __typename: 'Mutation', createTask: { __typename: 'CreateTaskPayload', success: boolean, errors: Array<string> | null, task: { __typename: 'TaskType', id: string, title: string, description: string | null, status: TaskStatus, assigneeEmail: string | null, dueDate: any | null, createdAt: any, updatedAt: any, isOverdue: boolean | null, isAssigned: boolean | null, commentCount: number | null, project: { __typename: 'ProjectType', id: string, name: string, status: ProjectStatus, organization: { __typename: 'OrganizationType', id: string, name: string, slug: string } } } | null } };

export type UpdateTaskMutationVariables = Exact<{
  input: UpdateTaskInput;
}>;


export type UpdateTaskMutation = { __typename: 'Mutation', updateTask: { __typename: 'UpdateTaskPayload', success: boolean, errors: Array<string> | null, task: { __typename: 'TaskType', id: string, title: string, description: string | null, status: TaskStatus, assigneeEmail: string | null, dueDate: any | null, createdAt: any, updatedAt: any, isOverdue: boolean | null, isAssigned: boolean | null, commentCount: number | null, project: { __typename: 'ProjectType', id: string, name: string, status: ProjectStatus, organization: { __typename: 'OrganizationType', id: string, name: string, slug: string } } } | null } };

export type DeleteTaskMutationVariables = Exact<{
  input: DeleteTaskInput;
}>;


export type DeleteTaskMutation = { __typename: 'Mutation', deleteTask: { __typename: 'DeleteTaskPayload', success: boolean, errors: Array<string> | null, deletedTaskId: string | null } };

export type CreateTaskCommentMutationVariables = Exact<{
  input: CreateTaskCommentInput;
}>;


export type CreateTaskCommentMutation = { __typename: 'Mutation', createTaskComment: { __typename: 'CreateTaskCommentPayload', success: boolean, errors: Array<string> | null, comment: { __typename: 'TaskCommentType', id: string, content: string, authorEmail: string, authorDisplayName: string | null, createdAt: any, task: { __typename: 'TaskType', id: string, title: string, project: { __typename: 'ProjectType', id: string, name: string, organization: { __typename: 'OrganizationType', id: string, slug: string } } } } | null } };

export type GetProjectsQueryVariables = Exact<{
  organizationSlug: Scalars['String']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetProjectsQuery = { __typename: 'Query', projects: Array<{ __typename: 'ProjectType', id: string, name: string, description: string | null, status: ProjectStatus, dueDate: any | null, createdAt: any, updatedAt: any, taskCount: number | null, completedTaskCount: number | null, completionPercentage: number | null, isOverdue: boolean | null, organization: { __typename: 'OrganizationType', id: string, name: string, slug: string } }> };

export type GetProjectQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  organizationSlug: Scalars['String']['input'];
}>;


export type GetProjectQuery = { __typename: 'Query', project: { __typename: 'ProjectType', id: string, name: string, description: string | null, status: ProjectStatus, dueDate: any | null, createdAt: any, updatedAt: any, taskCount: number | null, completedTaskCount: number | null, completionPercentage: number | null, isOverdue: boolean | null, organization: { __typename: 'OrganizationType', id: string, name: string, slug: string, contactEmail: string }, tasks: Array<{ __typename: 'TaskType', id: string, title: string, description: string | null, status: TaskStatus, assigneeEmail: string | null, dueDate: any | null, createdAt: any, updatedAt: any, isOverdue: boolean | null, isAssigned: boolean | null, commentCount: number | null }> | null, statistics: { __typename: 'ProjectStatistics', projectId: string, totalTasks: number, completedTasks: number, inProgressTasks: number, todoTasks: number, completionRate: number, assignedTasks: number, unassignedTasks: number, overdueTasks: number, taskStatusBreakdown: { __typename: 'TaskStatusBreakdown', todoCount: number, inProgressCount: number, doneCount: number, totalCount: number } } | null } | null };

export type GetProjectStatisticsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
  organizationSlug: Scalars['String']['input'];
}>;


export type GetProjectStatisticsQuery = { __typename: 'Query', projectStatistics: { __typename: 'ProjectStatistics', projectId: string, totalTasks: number, completedTasks: number, inProgressTasks: number, todoTasks: number, completionRate: number, assignedTasks: number, unassignedTasks: number, overdueTasks: number, taskStatusBreakdown: { __typename: 'TaskStatusBreakdown', todoCount: number, inProgressCount: number, doneCount: number, totalCount: number } } | null };

export type GetOrganizationStatisticsQueryVariables = Exact<{
  organizationSlug: Scalars['String']['input'];
}>;


export type GetOrganizationStatisticsQuery = { __typename: 'Query', organizationStatistics: { __typename: 'OrganizationStatistics', organizationId: string, totalProjects: number, activeProjects: number, completedProjects: number, onHoldProjects: number, totalTasks: number, completedTasks: number, overallCompletionRate: number, projectCompletionRate: number, taskStatusBreakdown: { __typename: 'TaskStatusBreakdown', todoCount: number, inProgressCount: number, doneCount: number, totalCount: number } } | null };

export type GetTasksQueryVariables = Exact<{
  organizationSlug: Scalars['String']['input'];
  projectId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  assigneeEmail?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetTasksQuery = { __typename: 'Query', tasks: Array<{ __typename: 'TaskType', id: string, title: string, description: string | null, status: TaskStatus, assigneeEmail: string | null, dueDate: any | null, createdAt: any, updatedAt: any, isOverdue: boolean | null, isAssigned: boolean | null, commentCount: number | null, project: { __typename: 'ProjectType', id: string, name: string, status: ProjectStatus, organization: { __typename: 'OrganizationType', id: string, name: string, slug: string } } }> };

export type GetTaskQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  organizationSlug: Scalars['String']['input'];
}>;


export type GetTaskQuery = { __typename: 'Query', task: { __typename: 'TaskType', id: string, title: string, description: string | null, status: TaskStatus, assigneeEmail: string | null, dueDate: any | null, createdAt: any, updatedAt: any, isOverdue: boolean | null, isAssigned: boolean | null, commentCount: number | null, project: { __typename: 'ProjectType', id: string, name: string, description: string | null, status: ProjectStatus, dueDate: any | null, organization: { __typename: 'OrganizationType', id: string, name: string, slug: string, contactEmail: string } }, comments: Array<{ __typename: 'TaskCommentType', id: string, content: string, authorEmail: string, authorDisplayName: string | null, createdAt: any }> | null } | null };

export type GetTaskCommentsQueryVariables = Exact<{
  taskId: Scalars['ID']['input'];
  organizationSlug: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetTaskCommentsQuery = { __typename: 'Query', taskComments: Array<{ __typename: 'TaskCommentType', id: string, content: string, authorEmail: string, authorDisplayName: string | null, createdAt: any, task: { __typename: 'TaskType', id: string, title: string, project: { __typename: 'ProjectType', id: string, name: string, organization: { __typename: 'OrganizationType', id: string, slug: string } } } }> };

export const ProjectBasicFragmentDoc = gql`
    fragment ProjectBasic on ProjectType {
  id
  name
  description
  status
  dueDate
  createdAt
  updatedAt
  taskCount
  completedTaskCount
  completionPercentage
  isOverdue
}
    `;
export const OrganizationInfoFragmentDoc = gql`
    fragment OrganizationInfo on OrganizationType {
  id
  name
  slug
  contactEmail
}
    `;
export const ProjectWithOrganizationFragmentDoc = gql`
    fragment ProjectWithOrganization on ProjectType {
  ...ProjectBasic
  organization {
    ...OrganizationInfo
  }
}
    ${ProjectBasicFragmentDoc}
${OrganizationInfoFragmentDoc}`;
export const TaskBasicFragmentDoc = gql`
    fragment TaskBasic on TaskType {
  id
  title
  description
  status
  assigneeEmail
  dueDate
  createdAt
  updatedAt
  isOverdue
  isAssigned
  commentCount
}
    `;
export const TaskWithProjectFragmentDoc = gql`
    fragment TaskWithProject on TaskType {
  ...TaskBasic
  project {
    id
    name
    status
    organization {
      ...OrganizationInfo
    }
  }
}
    ${TaskBasicFragmentDoc}
${OrganizationInfoFragmentDoc}`;
export const TaskCommentBasicFragmentDoc = gql`
    fragment TaskCommentBasic on TaskCommentType {
  id
  content
  authorEmail
  authorDisplayName
  createdAt
}
    `;
export const TaskCommentWithTaskFragmentDoc = gql`
    fragment TaskCommentWithTask on TaskCommentType {
  ...TaskCommentBasic
  task {
    id
    title
    project {
      id
      name
      organization {
        id
        slug
      }
    }
  }
}
    ${TaskCommentBasicFragmentDoc}`;
export const TaskStatusBreakdownInfoFragmentDoc = gql`
    fragment TaskStatusBreakdownInfo on TaskStatusBreakdown {
  todoCount
  inProgressCount
  doneCount
  totalCount
}
    `;
export const ProjectStatisticsInfoFragmentDoc = gql`
    fragment ProjectStatisticsInfo on ProjectStatistics {
  projectId
  totalTasks
  completedTasks
  inProgressTasks
  todoTasks
  completionRate
  assignedTasks
  unassignedTasks
  overdueTasks
  taskStatusBreakdown {
    ...TaskStatusBreakdownInfo
  }
}
    ${TaskStatusBreakdownInfoFragmentDoc}`;
export const OrganizationStatisticsInfoFragmentDoc = gql`
    fragment OrganizationStatisticsInfo on OrganizationStatistics {
  organizationId
  totalProjects
  activeProjects
  completedProjects
  onHoldProjects
  totalTasks
  completedTasks
  overallCompletionRate
  projectCompletionRate
  taskStatusBreakdown {
    ...TaskStatusBreakdownInfo
  }
}
    ${TaskStatusBreakdownInfoFragmentDoc}`;
export const CreateProjectDocument = gql`
    mutation CreateProject($input: CreateProjectInput!) {
  createProject(input: $input) {
    success
    errors
    project {
      id
      name
      description
      status
      dueDate
      createdAt
      updatedAt
      taskCount
      completedTaskCount
      completionPercentage
      isOverdue
      organization {
        id
        name
        slug
      }
    }
  }
}
    `;
export type CreateProjectMutationFn = Apollo.MutationFunction<CreateProjectMutation, CreateProjectMutationVariables>;

/**
 * __useCreateProjectMutation__
 *
 * To run a mutation, you first call `useCreateProjectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateProjectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createProjectMutation, { data, loading, error }] = useCreateProjectMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateProjectMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateProjectMutation, CreateProjectMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateProjectMutation, CreateProjectMutationVariables>(CreateProjectDocument, options);
      }
export type CreateProjectMutationHookResult = ReturnType<typeof useCreateProjectMutation>;
export type CreateProjectMutationResult = Apollo.MutationResult<CreateProjectMutation>;
export type CreateProjectMutationOptions = Apollo.BaseMutationOptions<CreateProjectMutation, CreateProjectMutationVariables>;
export const UpdateProjectDocument = gql`
    mutation UpdateProject($input: UpdateProjectInput!) {
  updateProject(input: $input) {
    success
    errors
    project {
      id
      name
      description
      status
      dueDate
      createdAt
      updatedAt
      taskCount
      completedTaskCount
      completionPercentage
      isOverdue
      organization {
        id
        name
        slug
      }
    }
  }
}
    `;
export type UpdateProjectMutationFn = Apollo.MutationFunction<UpdateProjectMutation, UpdateProjectMutationVariables>;

/**
 * __useUpdateProjectMutation__
 *
 * To run a mutation, you first call `useUpdateProjectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProjectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProjectMutation, { data, loading, error }] = useUpdateProjectMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProjectMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateProjectMutation, UpdateProjectMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateProjectMutation, UpdateProjectMutationVariables>(UpdateProjectDocument, options);
      }
export type UpdateProjectMutationHookResult = ReturnType<typeof useUpdateProjectMutation>;
export type UpdateProjectMutationResult = Apollo.MutationResult<UpdateProjectMutation>;
export type UpdateProjectMutationOptions = Apollo.BaseMutationOptions<UpdateProjectMutation, UpdateProjectMutationVariables>;
export const DeleteProjectDocument = gql`
    mutation DeleteProject($input: DeleteProjectInput!) {
  deleteProject(input: $input) {
    success
    errors
    deletedProjectId
  }
}
    `;
export type DeleteProjectMutationFn = Apollo.MutationFunction<DeleteProjectMutation, DeleteProjectMutationVariables>;

/**
 * __useDeleteProjectMutation__
 *
 * To run a mutation, you first call `useDeleteProjectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteProjectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteProjectMutation, { data, loading, error }] = useDeleteProjectMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteProjectMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteProjectMutation, DeleteProjectMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteProjectMutation, DeleteProjectMutationVariables>(DeleteProjectDocument, options);
      }
export type DeleteProjectMutationHookResult = ReturnType<typeof useDeleteProjectMutation>;
export type DeleteProjectMutationResult = Apollo.MutationResult<DeleteProjectMutation>;
export type DeleteProjectMutationOptions = Apollo.BaseMutationOptions<DeleteProjectMutation, DeleteProjectMutationVariables>;
export const CreateTaskDocument = gql`
    mutation CreateTask($input: CreateTaskInput!) {
  createTask(input: $input) {
    success
    errors
    task {
      id
      title
      description
      status
      assigneeEmail
      dueDate
      createdAt
      updatedAt
      isOverdue
      isAssigned
      commentCount
      project {
        id
        name
        status
        organization {
          id
          name
          slug
        }
      }
    }
  }
}
    `;
export type CreateTaskMutationFn = Apollo.MutationFunction<CreateTaskMutation, CreateTaskMutationVariables>;

/**
 * __useCreateTaskMutation__
 *
 * To run a mutation, you first call `useCreateTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTaskMutation, { data, loading, error }] = useCreateTaskMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateTaskMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateTaskMutation, CreateTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateTaskMutation, CreateTaskMutationVariables>(CreateTaskDocument, options);
      }
export type CreateTaskMutationHookResult = ReturnType<typeof useCreateTaskMutation>;
export type CreateTaskMutationResult = Apollo.MutationResult<CreateTaskMutation>;
export type CreateTaskMutationOptions = Apollo.BaseMutationOptions<CreateTaskMutation, CreateTaskMutationVariables>;
export const UpdateTaskDocument = gql`
    mutation UpdateTask($input: UpdateTaskInput!) {
  updateTask(input: $input) {
    success
    errors
    task {
      id
      title
      description
      status
      assigneeEmail
      dueDate
      createdAt
      updatedAt
      isOverdue
      isAssigned
      commentCount
      project {
        id
        name
        status
        organization {
          id
          name
          slug
        }
      }
    }
  }
}
    `;
export type UpdateTaskMutationFn = Apollo.MutationFunction<UpdateTaskMutation, UpdateTaskMutationVariables>;

/**
 * __useUpdateTaskMutation__
 *
 * To run a mutation, you first call `useUpdateTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTaskMutation, { data, loading, error }] = useUpdateTaskMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateTaskMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateTaskMutation, UpdateTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateTaskMutation, UpdateTaskMutationVariables>(UpdateTaskDocument, options);
      }
export type UpdateTaskMutationHookResult = ReturnType<typeof useUpdateTaskMutation>;
export type UpdateTaskMutationResult = Apollo.MutationResult<UpdateTaskMutation>;
export type UpdateTaskMutationOptions = Apollo.BaseMutationOptions<UpdateTaskMutation, UpdateTaskMutationVariables>;
export const DeleteTaskDocument = gql`
    mutation DeleteTask($input: DeleteTaskInput!) {
  deleteTask(input: $input) {
    success
    errors
    deletedTaskId
  }
}
    `;
export type DeleteTaskMutationFn = Apollo.MutationFunction<DeleteTaskMutation, DeleteTaskMutationVariables>;

/**
 * __useDeleteTaskMutation__
 *
 * To run a mutation, you first call `useDeleteTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteTaskMutation, { data, loading, error }] = useDeleteTaskMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteTaskMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteTaskMutation, DeleteTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteTaskMutation, DeleteTaskMutationVariables>(DeleteTaskDocument, options);
      }
export type DeleteTaskMutationHookResult = ReturnType<typeof useDeleteTaskMutation>;
export type DeleteTaskMutationResult = Apollo.MutationResult<DeleteTaskMutation>;
export type DeleteTaskMutationOptions = Apollo.BaseMutationOptions<DeleteTaskMutation, DeleteTaskMutationVariables>;
export const CreateTaskCommentDocument = gql`
    mutation CreateTaskComment($input: CreateTaskCommentInput!) {
  createTaskComment(input: $input) {
    success
    errors
    comment {
      id
      content
      authorEmail
      authorDisplayName
      createdAt
      task {
        id
        title
        project {
          id
          name
          organization {
            id
            slug
          }
        }
      }
    }
  }
}
    `;
export type CreateTaskCommentMutationFn = Apollo.MutationFunction<CreateTaskCommentMutation, CreateTaskCommentMutationVariables>;

/**
 * __useCreateTaskCommentMutation__
 *
 * To run a mutation, you first call `useCreateTaskCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTaskCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTaskCommentMutation, { data, loading, error }] = useCreateTaskCommentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateTaskCommentMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateTaskCommentMutation, CreateTaskCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateTaskCommentMutation, CreateTaskCommentMutationVariables>(CreateTaskCommentDocument, options);
      }
export type CreateTaskCommentMutationHookResult = ReturnType<typeof useCreateTaskCommentMutation>;
export type CreateTaskCommentMutationResult = Apollo.MutationResult<CreateTaskCommentMutation>;
export type CreateTaskCommentMutationOptions = Apollo.BaseMutationOptions<CreateTaskCommentMutation, CreateTaskCommentMutationVariables>;
export const GetProjectsDocument = gql`
    query GetProjects($organizationSlug: String!, $status: String, $limit: Int = 50, $offset: Int = 0) {
  projects(
    organizationSlug: $organizationSlug
    status: $status
    limit: $limit
    offset: $offset
  ) {
    id
    name
    description
    status
    dueDate
    createdAt
    updatedAt
    taskCount
    completedTaskCount
    completionPercentage
    isOverdue
    organization {
      id
      name
      slug
    }
  }
}
    `;

/**
 * __useGetProjectsQuery__
 *
 * To run a query within a React component, call `useGetProjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjectsQuery({
 *   variables: {
 *      organizationSlug: // value for 'organizationSlug'
 *      status: // value for 'status'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetProjectsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetProjectsQuery, GetProjectsQueryVariables> & ({ variables: GetProjectsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetProjectsQuery, GetProjectsQueryVariables>(GetProjectsDocument, options);
      }
export function useGetProjectsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetProjectsQuery, GetProjectsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetProjectsQuery, GetProjectsQueryVariables>(GetProjectsDocument, options);
        }
export function useGetProjectsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetProjectsQuery, GetProjectsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetProjectsQuery, GetProjectsQueryVariables>(GetProjectsDocument, options);
        }
export type GetProjectsQueryHookResult = ReturnType<typeof useGetProjectsQuery>;
export type GetProjectsLazyQueryHookResult = ReturnType<typeof useGetProjectsLazyQuery>;
export type GetProjectsSuspenseQueryHookResult = ReturnType<typeof useGetProjectsSuspenseQuery>;
export type GetProjectsQueryResult = Apollo.QueryResult<GetProjectsQuery, GetProjectsQueryVariables>;
export const GetProjectDocument = gql`
    query GetProject($id: ID!, $organizationSlug: String!) {
  project(id: $id, organizationSlug: $organizationSlug) {
    id
    name
    description
    status
    dueDate
    createdAt
    updatedAt
    taskCount
    completedTaskCount
    completionPercentage
    isOverdue
    organization {
      id
      name
      slug
      contactEmail
    }
    tasks {
      id
      title
      description
      status
      assigneeEmail
      dueDate
      createdAt
      updatedAt
      isOverdue
      isAssigned
      commentCount
    }
    statistics {
      projectId
      totalTasks
      completedTasks
      inProgressTasks
      todoTasks
      completionRate
      assignedTasks
      unassignedTasks
      overdueTasks
      taskStatusBreakdown {
        todoCount
        inProgressCount
        doneCount
        totalCount
      }
    }
  }
}
    `;

/**
 * __useGetProjectQuery__
 *
 * To run a query within a React component, call `useGetProjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjectQuery({
 *   variables: {
 *      id: // value for 'id'
 *      organizationSlug: // value for 'organizationSlug'
 *   },
 * });
 */
export function useGetProjectQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetProjectQuery, GetProjectQueryVariables> & ({ variables: GetProjectQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, options);
      }
export function useGetProjectLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetProjectQuery, GetProjectQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, options);
        }
export function useGetProjectSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetProjectQuery, GetProjectQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, options);
        }
export type GetProjectQueryHookResult = ReturnType<typeof useGetProjectQuery>;
export type GetProjectLazyQueryHookResult = ReturnType<typeof useGetProjectLazyQuery>;
export type GetProjectSuspenseQueryHookResult = ReturnType<typeof useGetProjectSuspenseQuery>;
export type GetProjectQueryResult = Apollo.QueryResult<GetProjectQuery, GetProjectQueryVariables>;
export const GetProjectStatisticsDocument = gql`
    query GetProjectStatistics($projectId: ID!, $organizationSlug: String!) {
  projectStatistics(projectId: $projectId, organizationSlug: $organizationSlug) {
    projectId
    totalTasks
    completedTasks
    inProgressTasks
    todoTasks
    completionRate
    assignedTasks
    unassignedTasks
    overdueTasks
    taskStatusBreakdown {
      todoCount
      inProgressCount
      doneCount
      totalCount
    }
  }
}
    `;

/**
 * __useGetProjectStatisticsQuery__
 *
 * To run a query within a React component, call `useGetProjectStatisticsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProjectStatisticsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjectStatisticsQuery({
 *   variables: {
 *      projectId: // value for 'projectId'
 *      organizationSlug: // value for 'organizationSlug'
 *   },
 * });
 */
export function useGetProjectStatisticsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetProjectStatisticsQuery, GetProjectStatisticsQueryVariables> & ({ variables: GetProjectStatisticsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetProjectStatisticsQuery, GetProjectStatisticsQueryVariables>(GetProjectStatisticsDocument, options);
      }
export function useGetProjectStatisticsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetProjectStatisticsQuery, GetProjectStatisticsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetProjectStatisticsQuery, GetProjectStatisticsQueryVariables>(GetProjectStatisticsDocument, options);
        }
export function useGetProjectStatisticsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetProjectStatisticsQuery, GetProjectStatisticsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetProjectStatisticsQuery, GetProjectStatisticsQueryVariables>(GetProjectStatisticsDocument, options);
        }
export type GetProjectStatisticsQueryHookResult = ReturnType<typeof useGetProjectStatisticsQuery>;
export type GetProjectStatisticsLazyQueryHookResult = ReturnType<typeof useGetProjectStatisticsLazyQuery>;
export type GetProjectStatisticsSuspenseQueryHookResult = ReturnType<typeof useGetProjectStatisticsSuspenseQuery>;
export type GetProjectStatisticsQueryResult = Apollo.QueryResult<GetProjectStatisticsQuery, GetProjectStatisticsQueryVariables>;
export const GetOrganizationStatisticsDocument = gql`
    query GetOrganizationStatistics($organizationSlug: String!) {
  organizationStatistics(organizationSlug: $organizationSlug) {
    organizationId
    totalProjects
    activeProjects
    completedProjects
    onHoldProjects
    totalTasks
    completedTasks
    overallCompletionRate
    projectCompletionRate
    taskStatusBreakdown {
      todoCount
      inProgressCount
      doneCount
      totalCount
    }
  }
}
    `;

/**
 * __useGetOrganizationStatisticsQuery__
 *
 * To run a query within a React component, call `useGetOrganizationStatisticsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOrganizationStatisticsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOrganizationStatisticsQuery({
 *   variables: {
 *      organizationSlug: // value for 'organizationSlug'
 *   },
 * });
 */
export function useGetOrganizationStatisticsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetOrganizationStatisticsQuery, GetOrganizationStatisticsQueryVariables> & ({ variables: GetOrganizationStatisticsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetOrganizationStatisticsQuery, GetOrganizationStatisticsQueryVariables>(GetOrganizationStatisticsDocument, options);
      }
export function useGetOrganizationStatisticsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetOrganizationStatisticsQuery, GetOrganizationStatisticsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetOrganizationStatisticsQuery, GetOrganizationStatisticsQueryVariables>(GetOrganizationStatisticsDocument, options);
        }
export function useGetOrganizationStatisticsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetOrganizationStatisticsQuery, GetOrganizationStatisticsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetOrganizationStatisticsQuery, GetOrganizationStatisticsQueryVariables>(GetOrganizationStatisticsDocument, options);
        }
export type GetOrganizationStatisticsQueryHookResult = ReturnType<typeof useGetOrganizationStatisticsQuery>;
export type GetOrganizationStatisticsLazyQueryHookResult = ReturnType<typeof useGetOrganizationStatisticsLazyQuery>;
export type GetOrganizationStatisticsSuspenseQueryHookResult = ReturnType<typeof useGetOrganizationStatisticsSuspenseQuery>;
export type GetOrganizationStatisticsQueryResult = Apollo.QueryResult<GetOrganizationStatisticsQuery, GetOrganizationStatisticsQueryVariables>;
export const GetTasksDocument = gql`
    query GetTasks($organizationSlug: String!, $projectId: ID, $status: String, $assigneeEmail: String, $limit: Int = 100, $offset: Int = 0) {
  tasks(
    organizationSlug: $organizationSlug
    projectId: $projectId
    status: $status
    assigneeEmail: $assigneeEmail
    limit: $limit
    offset: $offset
  ) {
    id
    title
    description
    status
    assigneeEmail
    dueDate
    createdAt
    updatedAt
    isOverdue
    isAssigned
    commentCount
    project {
      id
      name
      status
      organization {
        id
        name
        slug
      }
    }
  }
}
    `;

/**
 * __useGetTasksQuery__
 *
 * To run a query within a React component, call `useGetTasksQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTasksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTasksQuery({
 *   variables: {
 *      organizationSlug: // value for 'organizationSlug'
 *      projectId: // value for 'projectId'
 *      status: // value for 'status'
 *      assigneeEmail: // value for 'assigneeEmail'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetTasksQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetTasksQuery, GetTasksQueryVariables> & ({ variables: GetTasksQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTasksQuery, GetTasksQueryVariables>(GetTasksDocument, options);
      }
export function useGetTasksLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTasksQuery, GetTasksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTasksQuery, GetTasksQueryVariables>(GetTasksDocument, options);
        }
export function useGetTasksSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTasksQuery, GetTasksQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTasksQuery, GetTasksQueryVariables>(GetTasksDocument, options);
        }
export type GetTasksQueryHookResult = ReturnType<typeof useGetTasksQuery>;
export type GetTasksLazyQueryHookResult = ReturnType<typeof useGetTasksLazyQuery>;
export type GetTasksSuspenseQueryHookResult = ReturnType<typeof useGetTasksSuspenseQuery>;
export type GetTasksQueryResult = Apollo.QueryResult<GetTasksQuery, GetTasksQueryVariables>;
export const GetTaskDocument = gql`
    query GetTask($id: ID!, $organizationSlug: String!) {
  task(id: $id, organizationSlug: $organizationSlug) {
    id
    title
    description
    status
    assigneeEmail
    dueDate
    createdAt
    updatedAt
    isOverdue
    isAssigned
    commentCount
    project {
      id
      name
      description
      status
      dueDate
      organization {
        id
        name
        slug
        contactEmail
      }
    }
    comments {
      id
      content
      authorEmail
      authorDisplayName
      createdAt
    }
  }
}
    `;

/**
 * __useGetTaskQuery__
 *
 * To run a query within a React component, call `useGetTaskQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTaskQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTaskQuery({
 *   variables: {
 *      id: // value for 'id'
 *      organizationSlug: // value for 'organizationSlug'
 *   },
 * });
 */
export function useGetTaskQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetTaskQuery, GetTaskQueryVariables> & ({ variables: GetTaskQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTaskQuery, GetTaskQueryVariables>(GetTaskDocument, options);
      }
export function useGetTaskLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTaskQuery, GetTaskQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTaskQuery, GetTaskQueryVariables>(GetTaskDocument, options);
        }
export function useGetTaskSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTaskQuery, GetTaskQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTaskQuery, GetTaskQueryVariables>(GetTaskDocument, options);
        }
export type GetTaskQueryHookResult = ReturnType<typeof useGetTaskQuery>;
export type GetTaskLazyQueryHookResult = ReturnType<typeof useGetTaskLazyQuery>;
export type GetTaskSuspenseQueryHookResult = ReturnType<typeof useGetTaskSuspenseQuery>;
export type GetTaskQueryResult = Apollo.QueryResult<GetTaskQuery, GetTaskQueryVariables>;
export const GetTaskCommentsDocument = gql`
    query GetTaskComments($taskId: ID!, $organizationSlug: String!, $limit: Int = 50, $offset: Int = 0) {
  taskComments(
    taskId: $taskId
    organizationSlug: $organizationSlug
    limit: $limit
    offset: $offset
  ) {
    id
    content
    authorEmail
    authorDisplayName
    createdAt
    task {
      id
      title
      project {
        id
        name
        organization {
          id
          slug
        }
      }
    }
  }
}
    `;

/**
 * __useGetTaskCommentsQuery__
 *
 * To run a query within a React component, call `useGetTaskCommentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTaskCommentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTaskCommentsQuery({
 *   variables: {
 *      taskId: // value for 'taskId'
 *      organizationSlug: // value for 'organizationSlug'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetTaskCommentsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetTaskCommentsQuery, GetTaskCommentsQueryVariables> & ({ variables: GetTaskCommentsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTaskCommentsQuery, GetTaskCommentsQueryVariables>(GetTaskCommentsDocument, options);
      }
export function useGetTaskCommentsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTaskCommentsQuery, GetTaskCommentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTaskCommentsQuery, GetTaskCommentsQueryVariables>(GetTaskCommentsDocument, options);
        }
export function useGetTaskCommentsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTaskCommentsQuery, GetTaskCommentsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTaskCommentsQuery, GetTaskCommentsQueryVariables>(GetTaskCommentsDocument, options);
        }
export type GetTaskCommentsQueryHookResult = ReturnType<typeof useGetTaskCommentsQuery>;
export type GetTaskCommentsLazyQueryHookResult = ReturnType<typeof useGetTaskCommentsLazyQuery>;
export type GetTaskCommentsSuspenseQueryHookResult = ReturnType<typeof useGetTaskCommentsSuspenseQuery>;
export type GetTaskCommentsQueryResult = Apollo.QueryResult<GetTaskCommentsQuery, GetTaskCommentsQueryVariables>;