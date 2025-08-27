from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
import graphene
from graphene.test import Client
from core.models import Organization
from projects.models import Project
from tasks.models import Task, TaskComment
from mini_project_management.schema import schema


class ProjectMutationTestCase(TestCase):
    """Test cases for project GraphQL mutations"""
    
    def setUp(self):
        """Set up test data"""
        self.client = Client(schema)
        
        # Create test organizations
        self.org1 = Organization.objects.create(
            name="Test Organization 1",
            slug="test-org-1",
            contact_email="contact@testorg1.com"
        )
        
        self.org2 = Organization.objects.create(
            name="Test Organization 2", 
            slug="test-org-2",
            contact_email="contact@testorg2.com"
        )
        
        # Create test project
        self.project = Project.objects.create(
            organization=self.org1,
            name="Test Project",
            description="Test project description",
            status="ACTIVE"
        )
    
    def test_create_project_success(self):
        """Test successful project creation"""
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
                "organizationSlug": "test-org-1",
                "name": "New Test Project",
                "description": "A new test project",
                "status": "ACTIVE",
                "dueDate": str(date.today() + timedelta(days=30))
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createProject']
        self.assertTrue(data['success'])
        self.assertEqual(len(data['errors']), 0)
        self.assertEqual(data['project']['name'], "New Test Project")
        self.assertEqual(data['project']['status'], "ACTIVE")
        self.assertEqual(data['project']['organization']['slug'], "test-org-1")
    
    def test_create_project_invalid_organization(self):
        """Test project creation with invalid organization"""
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
                "organizationSlug": "nonexistent-org",
                "name": "Test Project"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createProject']
        self.assertFalse(data['success'])
        self.assertIn("Organization with slug 'nonexistent-org' not found", data['errors'])
        self.assertIsNone(data['project'])
    
    def test_create_project_empty_name(self):
        """Test project creation with empty name"""
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
                "organizationSlug": "test-org-1",
                "name": ""
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createProject']
        self.assertFalse(data['success'])
        self.assertIn("Project name is required and cannot be empty", data['errors'])
    
    def test_create_project_duplicate_name(self):
        """Test project creation with duplicate name in same organization"""
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
                "organizationSlug": "test-org-1",
                "name": "Test Project"  # This name already exists
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createProject']
        self.assertFalse(data['success'])
        self.assertIn("A project with name 'Test Project' already exists", data['errors'][0])
    
    def test_update_project_success(self):
        """Test successful project update"""
        mutation = '''
            mutation UpdateProject($input: UpdateProjectInput!) {
                updateProject(input: $input) {
                    success
                    errors
                    project {
                        id
                        name
                        description
                        status
                    }
                }
            }
        '''
        
        variables = {
            "input": {
                "id": str(self.project.id),
                "organizationSlug": "test-org-1",
                "name": "Updated Test Project",
                "description": "Updated description",
                "status": "ON_HOLD"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['updateProject']
        self.assertTrue(data['success'])
        self.assertEqual(len(data['errors']), 0)
        self.assertEqual(data['project']['name'], "Updated Test Project")
        self.assertEqual(data['project']['status'], "ON_HOLD")
    
    def test_update_project_invalid_organization(self):
        """Test project update with invalid organization"""
        mutation = '''
            mutation UpdateProject($input: UpdateProjectInput!) {
                updateProject(input: $input) {
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
                "id": str(self.project.id),
                "organizationSlug": "nonexistent-org",
                "name": "Updated Name"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['updateProject']
        self.assertFalse(data['success'])
        self.assertIn("Organization with slug 'nonexistent-org' not found", data['errors'])
    
    def test_update_project_wrong_organization(self):
        """Test project update with wrong organization context"""
        mutation = '''
            mutation UpdateProject($input: UpdateProjectInput!) {
                updateProject(input: $input) {
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
                "id": str(self.project.id),
                "organizationSlug": "test-org-2",  # Project belongs to test-org-1
                "name": "Updated Name"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['updateProject']
        self.assertFalse(data['success'])
        self.assertIn("not found in organization 'test-org-2'", data['errors'][0])
    
    def test_delete_project_success(self):
        """Test successful project deletion"""
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
                "organizationSlug": "test-org-1"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['deleteProject']
        self.assertTrue(data['success'])
        self.assertEqual(len(data['errors']), 0)
        self.assertEqual(data['deletedProjectId'], str(self.project.id))
        
        # Verify project is actually deleted
        self.assertFalse(Project.objects.filter(id=self.project.id).exists())
    
    def test_delete_project_with_cascade(self):
        """Test project deletion with cascade handling for tasks and comments"""
        # Create task and comment for the project
        task = Task.objects.create(
            project=self.project,
            title="Test Task",
            status="TODO"
        )
        
        comment = TaskComment.objects.create(
            task=task,
            content="Test comment",
            author_email="test@example.com"
        )
        
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
                "organizationSlug": "test-org-1"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['deleteProject']
        self.assertTrue(data['success'])
        
        # Verify cascade deletion
        self.assertFalse(Project.objects.filter(id=self.project.id).exists())
        self.assertFalse(Task.objects.filter(id=task.id).exists())
        self.assertFalse(TaskComment.objects.filter(id=comment.id).exists())
    
    def test_delete_project_invalid_organization(self):
        """Test project deletion with invalid organization"""
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
                "organizationSlug": "nonexistent-org"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['deleteProject']
        self.assertFalse(data['success'])
        self.assertIn("Organization with slug 'nonexistent-org' not found", data['errors'])
        self.assertIsNone(data['deletedProjectId'])


class ProjectStatisticsTestCase(TestCase):
    """Test cases for project statistics GraphQL queries"""
    
    def setUp(self):
        """Set up test data for statistics testing"""
        self.client = Client(schema)
        
        # Create test organization
        self.organization = Organization.objects.create(
            name="Statistics Test Organization",
            slug="stats-test-org",
            contact_email="stats@testorg.com"
        )
        
        # Create test projects with different statuses
        self.active_project = Project.objects.create(
            organization=self.organization,
            name="Active Project",
            description="Active project for testing",
            status="ACTIVE",
            due_date=timezone.now().date() + timedelta(days=30)
        )
        
        self.completed_project = Project.objects.create(
            organization=self.organization,
            name="Completed Project",
            description="Completed project for testing",
            status="COMPLETED"
        )
        
        self.on_hold_project = Project.objects.create(
            organization=self.organization,
            name="On Hold Project",
            description="On hold project for testing",
            status="ON_HOLD"
        )
        
        # Create tasks with different statuses for active project
        self.todo_task1 = Task.objects.create(
            project=self.active_project,
            title="TODO Task 1",
            status="TODO",
            assignee_email="user1@example.com"
        )
        
        self.todo_task2 = Task.objects.create(
            project=self.active_project,
            title="TODO Task 2",
            status="TODO"
        )
        
        self.in_progress_task = Task.objects.create(
            project=self.active_project,
            title="In Progress Task",
            status="IN_PROGRESS",
            assignee_email="user2@example.com"
        )
        
        self.done_task1 = Task.objects.create(
            project=self.active_project,
            title="Done Task 1",
            status="DONE",
            assignee_email="user3@example.com"
        )
        
        self.done_task2 = Task.objects.create(
            project=self.active_project,
            title="Done Task 2",
            status="DONE",
            assignee_email="user4@example.com"
        )
        
        # Create overdue task
        self.overdue_task = Task.objects.create(
            project=self.active_project,
            title="Overdue Task",
            status="TODO",
            due_date=timezone.now() - timedelta(days=1),
            assignee_email="user5@example.com"
        )
        
        # Create tasks for completed project
        self.completed_project_task = Task.objects.create(
            project=self.completed_project,
            title="Completed Project Task",
            status="DONE"
        )
        
        # Create comments
        self.comment1 = TaskComment.objects.create(
            task=self.todo_task1,
            content="Comment on TODO task",
            author_email="commenter1@example.com"
        )
        
        self.comment2 = TaskComment.objects.create(
            task=self.in_progress_task,
            content="Comment on in progress task",
            author_email="commenter2@example.com"
        )
    
    def test_project_statistics_query(self):
        """Test project statistics GraphQL query"""
        query = '''
            query ProjectStatistics($projectId: ID!, $organizationSlug: String!) {
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
            "organizationSlug": "stats-test-org"
        }
        
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['projectStatistics']
        
        # Verify basic statistics
        self.assertEqual(data['projectId'], str(self.active_project.id))
        self.assertEqual(data['totalTasks'], 6)  # 6 tasks in active project
        self.assertEqual(data['completedTasks'], 2)  # 2 DONE tasks
        self.assertEqual(data['inProgressTasks'], 1)  # 1 IN_PROGRESS task
        self.assertEqual(data['todoTasks'], 3)  # 3 TODO tasks (including overdue)
        self.assertEqual(data['assignedTasks'], 5)  # 5 tasks with assignees
        self.assertEqual(data['unassignedTasks'], 1)  # 1 task without assignee
        self.assertEqual(data['overdueTasks'], 1)  # 1 overdue task
        
        # Verify completion rate (2 done out of 6 total = 33.33%)
        expected_completion_rate = round((2 / 6) * 100, 2)
        self.assertEqual(data['completionRate'], expected_completion_rate)
        
        # Verify task status breakdown
        breakdown = data['taskStatusBreakdown']
        self.assertEqual(breakdown['todoCount'], 3)
        self.assertEqual(breakdown['inProgressCount'], 1)
        self.assertEqual(breakdown['doneCount'], 2)
        self.assertEqual(breakdown['totalCount'], 6)
    
    def test_organization_statistics_query(self):
        """Test organization statistics GraphQL query"""
        query = '''
            query OrganizationStatistics($organizationSlug: String!) {
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
        
        variables = {
            "organizationSlug": "stats-test-org"
        }
        
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['organizationStatistics']
        
        # Verify organization statistics
        self.assertEqual(data['organizationId'], str(self.organization.id))
        self.assertEqual(data['totalProjects'], 3)
        self.assertEqual(data['activeProjects'], 1)
        self.assertEqual(data['completedProjects'], 1)
        self.assertEqual(data['onHoldProjects'], 1)
        
        # Verify task statistics (6 tasks in active project + 1 in completed project = 7 total)
        self.assertEqual(data['totalTasks'], 7)
        self.assertEqual(data['completedTasks'], 3)  # 2 from active + 1 from completed
        
        # Verify completion rates
        expected_overall_completion_rate = round((3 / 7) * 100, 2)  # 3 done out of 7 total
        expected_project_completion_rate = round((1 / 3) * 100, 2)  # 1 completed out of 3 total
        
        self.assertEqual(data['overallCompletionRate'], expected_overall_completion_rate)
        self.assertEqual(data['projectCompletionRate'], expected_project_completion_rate)
        
        # Verify task status breakdown
        breakdown = data['taskStatusBreakdown']
        self.assertEqual(breakdown['todoCount'], 3)  # 3 TODO tasks (all from active project)
        self.assertEqual(breakdown['inProgressCount'], 1)  # 1 IN_PROGRESS task
        self.assertEqual(breakdown['doneCount'], 3)  # 3 DONE tasks (2 from active + 1 from completed)
        self.assertEqual(breakdown['totalCount'], 7)
    
    def test_project_statistics_invalid_organization(self):
        """Test project statistics query with invalid organization"""
        query = '''
            query ProjectStatistics($projectId: ID!, $organizationSlug: String!) {
                projectStatistics(projectId: $projectId, organizationSlug: $organizationSlug) {
                    projectId
                }
            }
        '''
        
        variables = {
            "projectId": str(self.active_project.id),
            "organizationSlug": "nonexistent-org"
        }
        
        result = self.client.execute(query, variables=variables)
        
        # Should return GraphQL error
        self.assertIsNotNone(result.get('errors'))
        self.assertIn("Organization with slug 'nonexistent-org' not found", str(result['errors'][0]))
    
    def test_project_statistics_invalid_project(self):
        """Test project statistics query with invalid project"""
        query = '''
            query ProjectStatistics($projectId: ID!, $organizationSlug: String!) {
                projectStatistics(projectId: $projectId, organizationSlug: $organizationSlug) {
                    projectId
                }
            }
        '''
        
        variables = {
            "projectId": "999999",  # Non-existent project ID
            "organizationSlug": "stats-test-org"
        }
        
        result = self.client.execute(query, variables=variables)
        
        # Should return GraphQL error
        self.assertIsNotNone(result.get('errors'))
        self.assertIn("Project with ID '999999' not found", str(result['errors'][0]))
    
    def test_organization_statistics_invalid_organization(self):
        """Test organization statistics query with invalid organization"""
        query = '''
            query OrganizationStatistics($organizationSlug: String!) {
                organizationStatistics(organizationSlug: $organizationSlug) {
                    organizationId
                }
            }
        '''
        
        variables = {
            "organizationSlug": "nonexistent-org"
        }
        
        result = self.client.execute(query, variables=variables)
        
        # Should return GraphQL error
        self.assertIsNotNone(result.get('errors'))
        self.assertIn("Organization with slug 'nonexistent-org' not found", str(result['errors'][0]))
    
    def test_project_type_statistics_field(self):
        """Test statistics field on ProjectType"""
        query = '''
            query {
                # This would need to be implemented in a projects query
                # For now, we'll test the resolver directly
            }
        '''
        
        # Test the resolver directly since we don't have a projects query yet
        from mini_project_management.schema import ProjectType
        
        # Create a mock info object
        class MockInfo:
            pass
        
        # Call the resolver method correctly - it's a bound method that expects the project as self
        statistics = ProjectType.resolve_statistics(self.active_project, MockInfo())
        
        # Verify statistics are returned
        self.assertEqual(str(statistics.project_id), str(self.active_project.id))
        self.assertEqual(statistics.total_tasks, 6)
        self.assertEqual(statistics.completed_tasks, 2)
        self.assertEqual(statistics.completion_rate, round((2 / 6) * 100, 2))
    
    def test_statistics_caching(self):
        """Test that statistics are properly cached"""
        from django.core.cache import cache
        
        # Clear cache
        cache.clear()
        
        query = '''
            query ProjectStatistics($projectId: ID!, $organizationSlug: String!) {
                projectStatistics(projectId: $projectId, organizationSlug: $organizationSlug) {
                    totalTasks
                    completionRate
                }
            }
        '''
        
        variables = {
            "projectId": str(self.active_project.id),
            "organizationSlug": "stats-test-org"
        }
        
        # First query should calculate and cache
        result1 = self.client.execute(query, variables=variables)
        self.assertIsNone(result1.get('errors'))
        
        # Verify cache is set
        cache_key = f"project_stats_{self.active_project.id}_stats-test-org"
        cached_data = cache.get(cache_key)
        self.assertIsNotNone(cached_data)
        
        # Second query should use cache
        result2 = self.client.execute(query, variables=variables)
        self.assertIsNone(result2.get('errors'))
        
        # Results should be identical
        self.assertEqual(result1['data'], result2['data'])
    
    def test_cache_invalidation_on_task_change(self):
        """Test that cache is invalidated when tasks change"""
        from django.core.cache import cache
        
        # Clear cache and make initial query
        cache.clear()
        
        query = '''
            query ProjectStatistics($projectId: ID!, $organizationSlug: String!) {
                projectStatistics(projectId: $projectId, organizationSlug: $organizationSlug) {
                    completedTasks
                    completionRate
                }
            }
        '''
        
        variables = {
            "projectId": str(self.active_project.id),
            "organizationSlug": "stats-test-org"
        }
        
        # Initial query
        result1 = self.client.execute(query, variables=variables)
        initial_completed = result1['data']['projectStatistics']['completedTasks']
        
        # Verify cache is set
        cache_key = f"project_stats_{self.active_project.id}_stats-test-org"
        self.assertIsNotNone(cache.get(cache_key))
        
        # Change a task status (should invalidate cache)
        self.todo_task1.status = 'DONE'
        self.todo_task1.save()
        
        # Cache should be invalidated
        self.assertIsNone(cache.get(cache_key))
        
        # New query should reflect the change
        result2 = self.client.execute(query, variables=variables)
        new_completed = result2['data']['projectStatistics']['completedTasks']
        
        # Should have one more completed task
        self.assertEqual(new_completed, initial_completed + 1)