"""
Comprehensive integration tests for GraphQL queries and mutations.
Tests the complete GraphQL API functionality including organization context.
"""
from django.test import TestCase
from graphene.test import Client
from django.core.cache import cache

from mini_project_management.schema import schema
from core.test_factories import (
    OrganizationFactory, ProjectFactory, TaskFactory, TaskCommentFactory,
    create_complete_test_scenario, create_multi_tenant_scenario
)


class GraphQLQueryIntegrationTest(TestCase):
    """Integration tests for GraphQL queries."""
    
    def setUp(self):
        """Set up test data and GraphQL client."""
        self.client = Client(schema)
        cache.clear()
        
        # Create test scenario
        self.scenario = create_complete_test_scenario()
        self.organization = self.scenario['organization']
        self.active_project = self.scenario['projects']['active']
        self.completed_project = self.scenario['projects']['completed']
    
    def test_projects_query_with_organization_filtering(self):
        """Test projects query with proper organization filtering."""
        query = '''
        query GetProjects($organizationSlug: String!) {
            projects(organizationSlug: $organizationSlug) {
                id
                name
                status
                organization {
                    slug
                }
                taskCount
                completedTaskCount
                completionPercentage
            }
        }
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        projects = result['data']['projects']
        
        # Should return all projects for the organization
        self.assertEqual(len(projects), 3)  # active, completed, on_hold
        
        # Verify organization filtering
        for project in projects:
            self.assertEqual(project['organization']['slug'], self.organization.slug)
        
        # Verify task counts are calculated
        active_project_data = next(
            p for p in projects if p['id'] == str(self.active_project.id)
        )
        self.assertGreater(active_project_data['taskCount'], 0)
        self.assertGreaterEqual(active_project_data['completedTaskCount'], 0)
        self.assertIsInstance(active_project_data['completionPercentage'], (int, float))
    
    def test_single_project_query_with_tasks(self):
        """Test single project query with nested tasks."""
        query = '''
        query GetProject($id: ID!, $organizationSlug: String!) {
            project(id: $id, organizationSlug: $organizationSlug) {
                id
                name
                status
                tasks {
                    id
                    title
                    status
                    assigneeEmail
                    isAssigned
                    commentCount
                }
            }
        }
        '''
        
        variables = {
            "id": str(self.active_project.id),
            "organizationSlug": self.organization.slug
        }
        
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        project = result['data']['project']
        
        self.assertEqual(project['id'], str(self.active_project.id))
        self.assertGreater(len(project['tasks']), 0)
        
        # Verify task data
        for task in project['tasks']:
            self.assertIsNotNone(task['id'])
            self.assertIsNotNone(task['title'])
            self.assertIn(task['status'], ['TODO', 'IN_PROGRESS', 'DONE'])
            self.assertIsInstance(task['isAssigned'], bool)
            self.assertIsInstance(task['commentCount'], int)
    
    def test_tasks_query_with_filtering(self):
        """Test tasks query with various filtering options."""
        query = '''
        query GetTasks($organizationSlug: String!, $projectId: ID, $status: String) {
            tasks(organizationSlug: $organizationSlug, projectId: $projectId, status: $status) {
                id
                title
                status
                project {
                    id
                    name
                }
                comments {
                    id
                    content
                    authorEmail
                }
            }
        }
        '''
        
        # Test filtering by project
        variables = {
            "organizationSlug": self.organization.slug,
            "projectId": str(self.active_project.id)
        }
        
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        tasks = result['data']['tasks']
        
        # All tasks should belong to the specified project
        for task in tasks:
            self.assertEqual(task['project']['id'], str(self.active_project.id))
        
        # Test filtering by status
        variables = {
            "organizationSlug": self.organization.slug,
            "status": "DONE"
        }
        
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        tasks = result['data']['tasks']
        
        # All tasks should have DONE status
        for task in tasks:
            self.assertEqual(task['status'], 'DONE')
    
    def test_project_statistics_query(self):
        """Test project statistics query."""
        query = '''
        query GetProjectStats($projectId: ID!, $organizationSlug: String!) {
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
        '''
        
        variables = {
            "projectId": str(self.active_project.id),
            "organizationSlug": self.organization.slug
        }
        
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        stats = result['data']['projectStatistics']
        
        # Verify statistics structure
        self.assertEqual(stats['projectId'], str(self.active_project.id))
        self.assertIsInstance(stats['totalTasks'], int)
        self.assertIsInstance(stats['completedTasks'], int)
        self.assertIsInstance(stats['completionRate'], (int, float))
        
        # Verify breakdown totals match
        breakdown = stats['taskStatusBreakdown']
        total_from_breakdown = (
            breakdown['todoCount'] + 
            breakdown['inProgressCount'] + 
            breakdown['doneCount']
        )
        self.assertEqual(total_from_breakdown, breakdown['totalCount'])
        self.assertEqual(breakdown['totalCount'], stats['totalTasks'])
    
    def test_organization_statistics_query(self):
        """Test organization statistics query."""
        query = '''
        query GetOrgStats($organizationSlug: String!) {
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
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        stats = result['data']['organizationStatistics']
        
        # Verify statistics structure
        self.assertEqual(stats['organizationId'], str(self.organization.id))
        self.assertEqual(stats['totalProjects'], 3)  # active, completed, on_hold
        self.assertEqual(stats['activeProjects'], 1)
        self.assertEqual(stats['completedProjects'], 1)
        self.assertEqual(stats['onHoldProjects'], 1)
        
        # Verify task statistics
        self.assertGreater(stats['totalTasks'], 0)
        self.assertGreaterEqual(stats['completedTasks'], 0)
        self.assertIsInstance(stats['overallCompletionRate'], (int, float))
        self.assertIsInstance(stats['projectCompletionRate'], (int, float))


class GraphQLMutationIntegrationTest(TestCase):
    """Integration tests for GraphQL mutations."""
    
    def setUp(self):
        """Set up test data and GraphQL client."""
        self.client = Client(schema)
        cache.clear()
        
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        self.task = TaskFactory(project=self.project)
    
    def test_create_project_mutation_integration(self):
        """Test complete project creation workflow."""
        mutation = '''
        mutation CreateProject($input: CreateProjectInput!) {
            createProject(input: $input) {
                success
                errors
                project {
                    id
                    name
                    description
                    status
                    organization {
                        slug
                    }
                }
            }
        }
        '''
        
        variables = {
            "input": {
                "organizationSlug": self.organization.slug,
                "name": "Integration Test Project",
                "description": "A project created through integration testing",
                "status": "ACTIVE"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createProject']
        
        self.assertTrue(data['success'])
        self.assertEqual(len(data['errors']), 0)
        
        project = data['project']
        self.assertIsNotNone(project['id'])
        self.assertEqual(project['name'], "Integration Test Project")
        self.assertEqual(project['status'], "ACTIVE")
        self.assertEqual(project['organization']['slug'], self.organization.slug)
        
        # Verify project was actually created in database
        from projects.models import Project
        db_project = Project.objects.get(id=project['id'])
        self.assertEqual(db_project.name, "Integration Test Project")
        self.assertEqual(db_project.organization, self.organization)
    
    def test_update_project_mutation_integration(self):
        """Test complete project update workflow."""
        mutation = '''
        mutation UpdateProject($input: UpdateProjectInput!) {
            updateProject(input: $input) {
                success
                errors
                project {
                    id
                    name
                    status
                    description
                }
            }
        }
        '''
        
        variables = {
            "input": {
                "id": str(self.project.id),
                "organizationSlug": self.organization.slug,
                "name": "Updated Project Name",
                "status": "ON_HOLD",
                "description": "Updated description"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['updateProject']
        
        self.assertTrue(data['success'])
        self.assertEqual(len(data['errors']), 0)
        
        project = data['project']
        self.assertEqual(project['name'], "Updated Project Name")
        self.assertEqual(project['status'], "ON_HOLD")
        self.assertEqual(project['description'], "Updated description")
        
        # Verify project was actually updated in database
        self.project.refresh_from_db()
        self.assertEqual(self.project.name, "Updated Project Name")
        self.assertEqual(self.project.status, "ON_HOLD")
    
    def test_create_task_mutation_integration(self):
        """Test complete task creation workflow."""
        mutation = '''
        mutation CreateTask($input: CreateTaskInput!) {
            createTask(input: $input) {
                success
                errors
                task {
                    id
                    title
                    status
                    assigneeEmail
                    project {
                        id
                    }
                }
            }
        }
        '''
        
        variables = {
            "input": {
                "organizationSlug": self.organization.slug,
                "projectId": str(self.project.id),
                "title": "Integration Test Task",
                "description": "A task created through integration testing",
                "status": "TODO",
                "assigneeEmail": "test@example.com"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTask']
        
        self.assertTrue(data['success'])
        self.assertEqual(len(data['errors']), 0)
        
        task = data['task']
        self.assertIsNotNone(task['id'])
        self.assertEqual(task['title'], "Integration Test Task")
        self.assertEqual(task['status'], "TODO")
        self.assertEqual(task['assigneeEmail'], "test@example.com")
        self.assertEqual(task['project']['id'], str(self.project.id))
        
        # Verify task was actually created in database
        from tasks.models import Task
        db_task = Task.objects.get(id=task['id'])
        self.assertEqual(db_task.title, "Integration Test Task")
        self.assertEqual(db_task.project, self.project)
    
    def test_create_task_comment_mutation_integration(self):
        """Test complete task comment creation workflow."""
        mutation = '''
        mutation CreateTaskComment($input: CreateTaskCommentInput!) {
            createTaskComment(input: $input) {
                success
                errors
                comment {
                    id
                    content
                    authorEmail
                    authorDisplayName
                    task {
                        id
                    }
                }
            }
        }
        '''
        
        variables = {
            "input": {
                "organizationSlug": self.organization.slug,
                "taskId": str(self.task.id),
                "content": "This is an integration test comment with detailed feedback.",
                "authorEmail": "commenter@example.com"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTaskComment']
        
        self.assertTrue(data['success'])
        self.assertEqual(len(data['errors']), 0)
        
        comment = data['comment']
        self.assertIsNotNone(comment['id'])
        self.assertEqual(comment['content'], "This is an integration test comment with detailed feedback.")
        self.assertEqual(comment['authorEmail'], "commenter@example.com")
        self.assertEqual(comment['task']['id'], str(self.task.id))
        self.assertIsNotNone(comment['authorDisplayName'])
        
        # Verify comment was actually created in database
        from tasks.models import TaskComment
        db_comment = TaskComment.objects.get(id=comment['id'])
        self.assertEqual(db_comment.content, "This is an integration test comment with detailed feedback.")
        self.assertEqual(db_comment.task, self.task)
    
    def test_delete_project_with_cascade_integration(self):
        """Test project deletion with cascade handling."""
        # Create tasks and comments for the project
        task1 = TaskFactory(project=self.project)
        task2 = TaskFactory(project=self.project)
        comment1 = TaskCommentFactory(task=task1)
        comment2 = TaskCommentFactory(task=task2)
        
        mutation = '''
        mutation DeleteProject($input: DeleteProjectInput!) {
            deleteProject(input: $input) {
                success
                errors
                deletedProjectId
            }
        }
        '''
        
        variables = {
            "input": {
                "id": str(self.project.id),
                "organizationSlug": self.organization.slug
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['deleteProject']
        
        self.assertTrue(data['success'])
        self.assertEqual(data['deletedProjectId'], str(self.project.id))
        
        # Verify cascade deletion in database
        from projects.models import Project
        from tasks.models import Task, TaskComment
        
        self.assertFalse(Project.objects.filter(id=self.project.id).exists())
        self.assertFalse(Task.objects.filter(id=task1.id).exists())
        self.assertFalse(Task.objects.filter(id=task2.id).exists())
        self.assertFalse(TaskComment.objects.filter(id=comment1.id).exists())
        self.assertFalse(TaskComment.objects.filter(id=comment2.id).exists())


class GraphQLMultiTenancyIntegrationTest(TestCase):
    """Integration tests for multi-tenancy isolation."""
    
    def setUp(self):
        """Set up multi-tenant test scenario."""
        self.client = Client(schema)
        cache.clear()
        
        # Create multiple organizations with data
        self.scenarios = create_multi_tenant_scenario()
        self.org1_scenario = self.scenarios[0]
        self.org2_scenario = self.scenarios[1]
        
        self.org1 = self.org1_scenario['organization']
        self.org2 = self.org2_scenario['organization']
    
    def test_organization_data_isolation_in_queries(self):
        """Test that queries properly isolate data by organization."""
        query = '''
        query GetProjects($organizationSlug: String!) {
            projects(organizationSlug: $organizationSlug) {
                id
                name
                organization {
                    slug
                }
            }
        }
        '''
        
        # Query org1 projects
        result1 = self.client.execute(query, variables={"organizationSlug": self.org1.slug})
        self.assertIsNone(result1.get('errors'))
        org1_projects = result1['data']['projects']
        
        # Query org2 projects
        result2 = self.client.execute(query, variables={"organizationSlug": self.org2.slug})
        self.assertIsNone(result2.get('errors'))
        org2_projects = result2['data']['projects']
        
        # Verify no overlap in project IDs
        org1_project_ids = {p['id'] for p in org1_projects}
        org2_project_ids = {p['id'] for p in org2_projects}
        
        self.assertEqual(len(org1_project_ids.intersection(org2_project_ids)), 0)
        
        # Verify all projects belong to correct organization
        for project in org1_projects:
            self.assertEqual(project['organization']['slug'], self.org1.slug)
        
        for project in org2_projects:
            self.assertEqual(project['organization']['slug'], self.org2.slug)
    
    def test_cross_organization_access_prevention(self):
        """Test that cross-organization access is prevented."""
        # Try to access org1 project using org2 context
        org1_project = self.org1_scenario['projects']['active']
        
        query = '''
        query GetProject($id: ID!, $organizationSlug: String!) {
            project(id: $id, organizationSlug: $organizationSlug) {
                id
                name
            }
        }
        '''
        
        variables = {
            "id": str(org1_project.id),
            "organizationSlug": self.org2.slug  # Wrong organization
        }
        
        result = self.client.execute(query, variables=variables)
        
        # Should return error or null
        self.assertTrue(
            result.get('errors') is not None or 
            result['data']['project'] is None
        )
    
    def test_mutation_organization_context_validation(self):
        """Test that mutations validate organization context."""
        # Try to create task in org1 project using org2 context
        org1_project = self.org1_scenario['projects']['active']
        
        mutation = '''
        mutation CreateTask($input: CreateTaskInput!) {
            createTask(input: $input) {
                success
                errors
                task {
                    id
                }
            }
        }
        '''
        
        variables = {
            "input": {
                "organizationSlug": self.org2.slug,  # Wrong organization
                "projectId": str(org1_project.id),
                "title": "Cross-org task attempt"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTask']
        
        # Should fail with validation error
        self.assertFalse(data['success'])
        self.assertGreater(len(data['errors']), 0)
        self.assertIsNone(data['task'])


class GraphQLErrorHandlingIntegrationTest(TestCase):
    """Integration tests for GraphQL error handling."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client(schema)
        self.organization = OrganizationFactory()
    
    def test_invalid_organization_error_handling(self):
        """Test error handling for invalid organization."""
        query = '''
        query GetProjects($organizationSlug: String!) {
            projects(organizationSlug: $organizationSlug) {
                id
                name
            }
        }
        '''
        
        variables = {"organizationSlug": "nonexistent-org"}
        result = self.client.execute(query, variables=variables)
        
        # Should return GraphQL error
        self.assertIsNotNone(result.get('errors'))
        error_message = str(result['errors'][0])
        self.assertIn("nonexistent-org", error_message)
    
    def test_invalid_input_validation_error_handling(self):
        """Test error handling for invalid input validation."""
        mutation = '''
        mutation CreateProject($input: CreateProjectInput!) {
            createProject(input: $input) {
                success
                errors
                project {
                    id
                }
            }
        }
        '''
        
        variables = {
            "input": {
                "organizationSlug": self.organization.slug,
                "name": "",  # Invalid empty name
                "status": "INVALID_STATUS"  # Invalid status
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))  # No GraphQL errors
        data = result['data']['createProject']
        
        # Should have validation errors
        self.assertFalse(data['success'])
        self.assertGreater(len(data['errors']), 0)
        self.assertIsNone(data['project'])
        
        # Check specific error messages
        error_messages = ' '.join(data['errors'])
        self.assertIn("name", error_messages.lower())
    
    def test_not_found_error_handling(self):
        """Test error handling for not found resources."""
        query = '''
        query GetProject($id: ID!, $organizationSlug: String!) {
            project(id: $id, organizationSlug: $organizationSlug) {
                id
                name
            }
        }
        '''
        
        variables = {
            "id": "999999",  # Non-existent ID
            "organizationSlug": self.organization.slug
        }
        
        result = self.client.execute(query, variables=variables)
        
        # Should return GraphQL error
        self.assertIsNotNone(result.get('errors'))
        error_message = str(result['errors'][0])
        self.assertIn("999999", error_message)