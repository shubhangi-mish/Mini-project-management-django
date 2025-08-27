"""
Comprehensive tests for multi-tenancy isolation and organization context.
Tests data isolation, access control, and organization-scoped operations.
"""
from django.test import TestCase, RequestFactory
from django.core.exceptions import ValidationError
from unittest.mock import patch, MagicMock

from core.models import Organization
from projects.models import Project
from tasks.models import Task, TaskComment
from core.managers import (
    OrganizationScopedManager, ProjectManager, TaskManager, TaskCommentManager
)
from core.middleware import OrganizationContextMiddleware
from core.test_factories import (
    OrganizationFactory, ProjectFactory, TaskFactory, TaskCommentFactory,
    create_multi_tenant_scenario
)


class OrganizationContextMiddlewareTest(TestCase):
    """Test organization context middleware functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.factory = RequestFactory()
        self.middleware = OrganizationContextMiddleware(lambda request: None)
        self.organization = OrganizationFactory()
    
    def test_middleware_extracts_organization_from_headers(self):
        """Test middleware extracts organization from request headers."""
        request = self.factory.get('/', HTTP_X_ORGANIZATION_SLUG=self.organization.slug)
        
        # Mock the get_response callable
        def mock_get_response(request):
            from core.middleware import get_current_organization
            return get_current_organization()
        
        self.middleware.get_response = mock_get_response
        
        # Process request through middleware
        result = self.middleware(request)
        
        # Should return the organization
        self.assertEqual(result, self.organization)
    
    def test_middleware_handles_invalid_organization(self):
        """Test middleware handles invalid organization gracefully."""
        request = self.factory.get('/', HTTP_X_ORGANIZATION_SLUG='nonexistent-org')
        
        def mock_get_response(request):
            from core.middleware import get_current_organization
            return get_current_organization()
        
        self.middleware.get_response = mock_get_response
        
        # Should not raise exception, should return None
        result = self.middleware(request)
        self.assertIsNone(result)
    
    def test_middleware_handles_missing_organization_header(self):
        """Test middleware handles missing organization header."""
        request = self.factory.get('/')
        
        def mock_get_response(request):
            from core.middleware import get_current_organization
            return get_current_organization()
        
        self.middleware.get_response = mock_get_response
        
        # Should return None when no organization header
        result = self.middleware(request)
        self.assertIsNone(result)


class OrganizationScopedManagerTest(TestCase):
    """Test organization-scoped manager functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.scenarios = create_multi_tenant_scenario()
        self.org1_scenario = self.scenarios[0]
        self.org2_scenario = self.scenarios[1]
        
        self.org1 = self.org1_scenario['organization']
        self.org2 = self.org2_scenario['organization']
        
        self.org1_project = self.org1_scenario['projects']['active']
        self.org2_project = self.org2_scenario['projects']['active']
    
    @patch('core.middleware.get_current_organization')
    def test_project_manager_organization_filtering(self, mock_get_org):
        """Test project manager filters by current organization."""
        # Set current organization to org1
        mock_get_org.return_value = self.org1
        
        # Query all projects
        projects = Project.objects.all()
        
        # Should only return org1 projects
        org_slugs = {p.organization.slug for p in projects}
        self.assertEqual(org_slugs, {self.org1.slug})
        
        # Change to org2
        mock_get_org.return_value = self.org2
        
        # Query all projects again
        projects = Project.objects.all()
        
        # Should only return org2 projects
        org_slugs = {p.organization.slug for p in projects}
        self.assertEqual(org_slugs, {self.org2.slug})
    
    @patch('core.middleware.get_current_organization')
    def test_task_manager_organization_filtering(self, mock_get_org):
        """Test task manager filters by organization through project."""
        # Set current organization to org1
        mock_get_org.return_value = self.org1
        
        # Query all tasks
        tasks = Task.objects.all()
        
        # Should only return tasks from org1 projects
        org_slugs = {t.project.organization.slug for t in tasks}
        self.assertEqual(org_slugs, {self.org1.slug})
        
        # Change to org2
        mock_get_org.return_value = self.org2
        
        # Query all tasks again
        tasks = Task.objects.all()
        
        # Should only return tasks from org2 projects
        org_slugs = {t.project.organization.slug for t in tasks}
        self.assertEqual(org_slugs, {self.org2.slug})
    
    @patch('core.middleware.get_current_organization')
    def test_comment_manager_organization_filtering(self, mock_get_org):
        """Test comment manager filters by organization through task->project."""
        # Set current organization to org1
        mock_get_org.return_value = self.org1
        
        # Query all comments
        comments = TaskComment.objects.all()
        
        # Should only return comments from org1 tasks
        org_slugs = {c.task.project.organization.slug for c in comments}
        self.assertEqual(org_slugs, {self.org1.slug})
        
        # Change to org2
        mock_get_org.return_value = self.org2
        
        # Query all comments again
        comments = TaskComment.objects.all()
        
        # Should only return comments from org2 tasks
        org_slugs = {c.task.project.organization.slug for c in comments}
        self.assertEqual(org_slugs, {self.org2.slug})
    
    def test_for_organization_explicit_filtering(self):
        """Test explicit organization filtering with for_organization method."""
        # Test project manager
        org1_projects = Project.objects.for_organization(self.org1)
        org2_projects = Project.objects.for_organization(self.org2)
        
        # Verify no overlap
        org1_ids = {p.id for p in org1_projects}
        org2_ids = {p.id for p in org2_projects}
        self.assertEqual(len(org1_ids.intersection(org2_ids)), 0)
        
        # Verify correct organization
        for project in org1_projects:
            self.assertEqual(project.organization, self.org1)
        
        for project in org2_projects:
            self.assertEqual(project.organization, self.org2)
        
        # Test task manager
        org1_tasks = Task.objects.for_organization(self.org1)
        org2_tasks = Task.objects.for_organization(self.org2)
        
        # Verify no overlap
        org1_task_ids = {t.id for t in org1_tasks}
        org2_task_ids = {t.id for t in org2_tasks}
        self.assertEqual(len(org1_task_ids.intersection(org2_task_ids)), 0)
        
        # Verify correct organization through project
        for task in org1_tasks:
            self.assertEqual(task.project.organization, self.org1)
        
        for task in org2_tasks:
            self.assertEqual(task.project.organization, self.org2)
    
    def test_create_for_organization_validation(self):
        """Test create_for_organization method with validation."""
        # Test creating project for organization
        project = Project.objects.create_for_organization(
            self.org1,
            name="Test Project",
            status="ACTIVE"
        )
        
        self.assertEqual(project.organization, self.org1)
        
        # Test creating task with valid project
        task = Task.objects.create_for_organization(
            self.org1,
            project=self.org1_project,
            title="Test Task",
            status="TODO"
        )
        
        self.assertEqual(task.project, self.org1_project)
        
        # Test creating task with invalid project (different organization)
        with self.assertRaises(ValidationError):
            Task.objects.create_for_organization(
                self.org1,
                project=self.org2_project,  # Wrong organization
                title="Invalid Task",
                status="TODO"
            )


class DataIsolationTest(TestCase):
    """Test data isolation between organizations."""
    
    def setUp(self):
        """Set up multi-tenant test scenario."""
        self.scenarios = create_multi_tenant_scenario()
        self.org1_scenario = self.scenarios[0]
        self.org2_scenario = self.scenarios[1]
        self.org3_scenario = self.scenarios[2]
        
        self.organizations = [
            self.org1_scenario['organization'],
            self.org2_scenario['organization'],
            self.org3_scenario['organization']
        ]
    
    def test_project_data_isolation(self):
        """Test that projects are isolated by organization."""
        for i, org in enumerate(self.organizations):
            org_projects = Project.objects.for_organization(org)
            
            # Verify all projects belong to this organization
            for project in org_projects:
                self.assertEqual(project.organization, org)
            
            # Verify no projects from other organizations
            other_orgs = [o for j, o in enumerate(self.organizations) if j != i]
            for other_org in other_orgs:
                other_projects = Project.objects.for_organization(other_org)
                org_project_ids = {p.id for p in org_projects}
                other_project_ids = {p.id for p in other_projects}
                
                # No overlap should exist
                self.assertEqual(len(org_project_ids.intersection(other_project_ids)), 0)
    
    def test_task_data_isolation(self):
        """Test that tasks are isolated by organization through projects."""
        for i, org in enumerate(self.organizations):
            org_tasks = Task.objects.for_organization(org)
            
            # Verify all tasks belong to projects in this organization
            for task in org_tasks:
                self.assertEqual(task.project.organization, org)
            
            # Verify no tasks from other organizations
            other_orgs = [o for j, o in enumerate(self.organizations) if j != i]
            for other_org in other_orgs:
                other_tasks = Task.objects.for_organization(other_org)
                org_task_ids = {t.id for t in org_tasks}
                other_task_ids = {t.id for t in other_tasks}
                
                # No overlap should exist
                self.assertEqual(len(org_task_ids.intersection(other_task_ids)), 0)
    
    def test_comment_data_isolation(self):
        """Test that comments are isolated by organization through tasks->projects."""
        for i, org in enumerate(self.organizations):
            org_comments = TaskComment.objects.for_organization(org)
            
            # Verify all comments belong to tasks in projects in this organization
            for comment in org_comments:
                self.assertEqual(comment.task.project.organization, org)
            
            # Verify no comments from other organizations
            other_orgs = [o for j, o in enumerate(self.organizations) if j != i]
            for other_org in other_orgs:
                other_comments = TaskComment.objects.for_organization(other_org)
                org_comment_ids = {c.id for c in org_comments}
                other_comment_ids = {c.id for c in other_comments}
                
                # No overlap should exist
                self.assertEqual(len(org_comment_ids.intersection(other_comment_ids)), 0)
    
    def test_cross_organization_relationship_prevention(self):
        """Test that cross-organization relationships are prevented."""
        org1 = self.organizations[0]
        org2 = self.organizations[1]
        
        org1_project = Project.objects.for_organization(org1).first()
        org2_project = Project.objects.for_organization(org2).first()
        
        # Try to create task in org1 project but validate against org2
        with self.assertRaises(ValidationError):
            Task.objects.create_for_organization(
                org2,  # Wrong organization
                project=org1_project,
                title="Cross-org task",
                status="TODO"
            )
        
        # Try to create comment on org1 task but validate against org2
        org1_task = Task.objects.for_organization(org1).first()
        
        with self.assertRaises(ValidationError):
            TaskComment.objects.create_for_organization(
                org2,  # Wrong organization
                task=org1_task,
                content="Cross-org comment",
                author_email="test@example.com"
            )


class OrganizationManagerTest(TestCase):
    """Test organization manager functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.organization = OrganizationFactory()
    
    def test_get_by_slug_success(self):
        """Test successful organization retrieval by slug."""
        org = Organization.objects.get_by_slug(self.organization.slug)
        self.assertEqual(org, self.organization)
    
    def test_get_by_slug_not_found(self):
        """Test organization retrieval with non-existent slug."""
        with self.assertRaises(ValidationError) as context:
            Organization.objects.get_by_slug('nonexistent-slug')
        
        self.assertIn('nonexistent-slug', str(context.exception))
    
    def test_create_with_slug_auto_generation(self):
        """Test organization creation with auto-generated slug."""
        org = Organization.objects.create_with_slug(
            name="Test Organization",
            contact_email="test@example.com"
        )
        
        self.assertEqual(org.slug, "test-organization")
        self.assertEqual(org.name, "Test Organization")
        self.assertEqual(org.contact_email, "test@example.com")
    
    def test_create_with_slug_explicit_slug(self):
        """Test organization creation with explicit slug."""
        org = Organization.objects.create_with_slug(
            name="Test Organization",
            contact_email="test@example.com",
            slug="custom-slug"
        )
        
        self.assertEqual(org.slug, "custom-slug")
    
    def test_create_with_slug_uniqueness_handling(self):
        """Test that create_with_slug handles slug uniqueness."""
        # Create first organization
        org1 = Organization.objects.create_with_slug(
            name="Test Organization",
            contact_email="test1@example.com"
        )
        
        # Create second organization with same name
        org2 = Organization.objects.create_with_slug(
            name="Test Organization",
            contact_email="test2@example.com"
        )
        
        # Slugs should be different
        self.assertNotEqual(org1.slug, org2.slug)
        self.assertEqual(org1.slug, "test-organization")
        self.assertTrue(org2.slug.startswith("test-organization-"))


class ProjectManagerTest(TestCase):
    """Test project manager functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.organization = OrganizationFactory()
        
        # Create projects with different statuses
        self.active_project = ProjectFactory(organization=self.organization, status='ACTIVE')
        self.completed_project = ProjectFactory(organization=self.organization, status='COMPLETED')
        self.on_hold_project = ProjectFactory(organization=self.organization, status='ON_HOLD')
        
        # Create overdue project
        from django.utils import timezone
        from datetime import timedelta
        past_date = timezone.now().date() - timedelta(days=1)
        self.overdue_project = ProjectFactory(organization=self.organization)
        self.overdue_project.status = 'ACTIVE'
        self.overdue_project.due_date = past_date
        self.overdue_project.save()
    
    @patch('core.middleware.get_current_organization')
    def test_project_status_filtering_methods(self, mock_get_org):
        """Test project manager status filtering methods."""
        mock_get_org.return_value = self.organization
        
        # Test active projects
        active_projects = Project.objects.active_projects()
        active_ids = {p.id for p in active_projects}
        expected_ids = {self.active_project.id, self.overdue_project.id}
        self.assertEqual(active_ids, expected_ids)
        
        # Test completed projects
        completed_projects = Project.objects.completed_projects()
        completed_ids = {p.id for p in completed_projects}
        self.assertEqual(completed_ids, {self.completed_project.id})
        
        # Test on-hold projects
        on_hold_projects = Project.objects.on_hold_projects()
        on_hold_ids = {p.id for p in on_hold_projects}
        self.assertEqual(on_hold_ids, {self.on_hold_project.id})
        
        # Test overdue projects
        overdue_projects = Project.objects.overdue_projects()
        overdue_ids = {p.id for p in overdue_projects}
        self.assertEqual(overdue_ids, {self.overdue_project.id})
    
    @patch('core.middleware.get_current_organization')
    def test_project_with_task_counts_annotation(self, mock_get_org):
        """Test project manager task count annotations."""
        mock_get_org.return_value = self.organization
        
        # Add tasks to active project
        TaskFactory(project=self.active_project, status='TODO')
        TaskFactory(project=self.active_project, status='IN_PROGRESS')
        TaskFactory(project=self.active_project, status='DONE')
        TaskFactory(project=self.active_project, status='DONE')
        
        # Query with task counts
        projects = Project.objects.with_task_counts()
        active_project_data = projects.get(id=self.active_project.id)
        
        self.assertEqual(active_project_data.total_tasks, 4)
        self.assertEqual(active_project_data.completed_tasks, 2)
        self.assertEqual(active_project_data.in_progress_tasks, 1)
        self.assertEqual(active_project_data.todo_tasks, 1)


class TaskManagerTest(TestCase):
    """Test task manager functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.organization = OrganizationFactory()
        self.project = ProjectFactory(organization=self.organization)
        
        # Create tasks with different statuses and assignments
        self.todo_task = TaskFactory(project=self.project, status='TODO', assignee_email='user1@example.com')
        self.in_progress_task = TaskFactory(project=self.project, status='IN_PROGRESS', assignee_email='user2@example.com')
        self.done_task = TaskFactory(project=self.project, status='DONE', assignee_email='user3@example.com')
        self.unassigned_task = TaskFactory(project=self.project, status='TODO', assignee_email='')
        
        # Create overdue task
        from django.utils import timezone
        from datetime import timedelta
        past_date = timezone.now() - timedelta(hours=1)
        self.overdue_task = TaskFactory(project=self.project)
        self.overdue_task.status = 'TODO'
        self.overdue_task.due_date = past_date
        self.overdue_task.save()
    
    @patch('core.middleware.get_current_organization')
    def test_task_status_filtering_methods(self, mock_get_org):
        """Test task manager status filtering methods."""
        mock_get_org.return_value = self.organization
        
        # Test TODO tasks
        todo_tasks = Task.objects.todo_tasks()
        todo_ids = {t.id for t in todo_tasks}
        expected_ids = {self.todo_task.id, self.unassigned_task.id, self.overdue_task.id}
        self.assertEqual(todo_ids, expected_ids)
        
        # Test IN_PROGRESS tasks
        in_progress_tasks = Task.objects.in_progress_tasks()
        in_progress_ids = {t.id for t in in_progress_tasks}
        self.assertEqual(in_progress_ids, {self.in_progress_task.id})
        
        # Test DONE tasks
        done_tasks = Task.objects.done_tasks()
        done_ids = {t.id for t in done_tasks}
        self.assertEqual(done_ids, {self.done_task.id})
    
    @patch('core.middleware.get_current_organization')
    def test_task_assignment_filtering_methods(self, mock_get_org):
        """Test task manager assignment filtering methods."""
        mock_get_org.return_value = self.organization
        
        # Test assigned tasks
        assigned_tasks = Task.objects.assigned_tasks()
        assigned_ids = {t.id for t in assigned_tasks}
        expected_ids = {self.todo_task.id, self.in_progress_task.id, self.done_task.id}
        self.assertEqual(assigned_ids, expected_ids)
        
        # Test unassigned tasks
        unassigned_tasks = Task.objects.unassigned_tasks()
        unassigned_ids = {t.id for t in unassigned_tasks}
        expected_ids = {self.unassigned_task.id, self.overdue_task.id}
        self.assertEqual(unassigned_ids, expected_ids)
        
        # Test overdue tasks
        overdue_tasks = Task.objects.overdue_tasks()
        overdue_ids = {t.id for t in overdue_tasks}
        self.assertEqual(overdue_ids, {self.overdue_task.id})
        
        # Test assigned_to filtering
        user1_tasks = Task.objects.assigned_to('user1@example.com')
        user1_ids = {t.id for t in user1_tasks}
        self.assertEqual(user1_ids, {self.todo_task.id})
    
    @patch('core.middleware.get_current_organization')
    def test_task_for_project_validation(self, mock_get_org):
        """Test task manager for_project method with validation."""
        mock_get_org.return_value = self.organization
        
        # Valid project
        project_tasks = Task.objects.for_project(self.project)
        all_task_ids = {
            self.todo_task.id, self.in_progress_task.id, 
            self.done_task.id, self.unassigned_task.id, self.overdue_task.id
        }
        project_task_ids = {t.id for t in project_tasks}
        self.assertEqual(project_task_ids, all_task_ids)
        
        # Invalid project (different organization)
        other_org = OrganizationFactory()
        other_project = ProjectFactory(organization=other_org)
        
        with self.assertRaises(ValidationError):
            Task.objects.for_project(other_project)