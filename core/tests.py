from django.test import TestCase
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from core.models import Organization
from projects.models import Project
from tasks.models import Task, TaskComment
from core.utils import (
    get_organization_statistics,
    get_project_statistics,
    invalidate_project_statistics_cache,
    invalidate_organization_statistics_cache,
    get_cached_project_statistics,
    get_cached_organization_statistics
)


class StatisticsUtilsTestCase(TestCase):
    """Test cases for statistics utility functions."""
    
    def setUp(self):
        """Set up test data."""
        # Clear cache before each test
        cache.clear()
        
        # Create test organization
        self.organization = Organization.objects.create(
            name="Test Organization",
            slug="test-org",
            contact_email="test@example.com"
        )
        
        # Create test projects
        self.active_project = Project.objects.create(
            organization=self.organization,
            name="Active Project",
            description="Test active project",
            status="ACTIVE",
            due_date=timezone.now().date() + timedelta(days=30)
        )
        
        self.completed_project = Project.objects.create(
            organization=self.organization,
            name="Completed Project",
            description="Test completed project",
            status="COMPLETED"
        )
        
        self.on_hold_project = Project.objects.create(
            organization=self.organization,
            name="On Hold Project",
            description="Test on hold project",
            status="ON_HOLD"
        )
        
        # Create test tasks
        self.todo_task = Task.objects.create(
            project=self.active_project,
            title="TODO Task",
            description="Test TODO task",
            status="TODO",
            assignee_email="user1@example.com"
        )
        
        self.in_progress_task = Task.objects.create(
            project=self.active_project,
            title="In Progress Task",
            description="Test in progress task",
            status="IN_PROGRESS",
            assignee_email="user2@example.com"
        )
        
        self.done_task = Task.objects.create(
            project=self.active_project,
            title="Done Task",
            description="Test done task",
            status="DONE",
            assignee_email="user3@example.com"
        )
        
        self.unassigned_task = Task.objects.create(
            project=self.completed_project,
            title="Unassigned Task",
            description="Test unassigned task",
            status="DONE"
        )
        
        # Create overdue task
        self.overdue_task = Task.objects.create(
            project=self.active_project,
            title="Overdue Task",
            description="Test overdue task",
            status="TODO",
            due_date=timezone.now() - timedelta(days=1)
        )
        
        # Create test comments
        self.comment1 = TaskComment.objects.create(
            task=self.todo_task,
            content="Test comment 1",
            author_email="commenter1@example.com"
        )
        
        self.comment2 = TaskComment.objects.create(
            task=self.in_progress_task,
            content="Test comment 2",
            author_email="commenter2@example.com"
        )
    
    def test_get_organization_statistics(self):
        """Test organization statistics calculation."""
        stats = get_organization_statistics(self.organization)
        
        # Test organization info
        self.assertEqual(stats['organization']['name'], "Test Organization")
        self.assertEqual(stats['organization']['slug'], "test-org")
        
        # Test project statistics
        self.assertEqual(stats['projects']['total_projects'], 3)
        self.assertEqual(stats['projects']['active_projects'], 1)
        self.assertEqual(stats['projects']['completed_projects'], 1)
        self.assertEqual(stats['projects']['on_hold_projects'], 1)
        
        # Test task statistics
        self.assertEqual(stats['tasks']['total_tasks'], 5)
        self.assertEqual(stats['tasks']['todo_tasks'], 2)  # todo_task + overdue_task
        self.assertEqual(stats['tasks']['in_progress_tasks'], 1)
        self.assertEqual(stats['tasks']['done_tasks'], 2)  # done_task + unassigned_task
        self.assertEqual(stats['tasks']['assigned_tasks'], 3)  # todo_task, in_progress_task, done_task have assignees
        self.assertEqual(stats['tasks']['unassigned_tasks'], 2)  # overdue_task and unassigned_task
        
        # Test comment statistics
        self.assertEqual(stats['comments']['total_comments'], 2)
        
        # Test completion rates
        expected_project_completion_rate = (1 / 3) * 100  # 1 completed out of 3 total
        expected_task_completion_rate = (2 / 5) * 100     # 2 done out of 5 total
        
        self.assertEqual(stats['completion_rates']['project_completion_rate'], expected_project_completion_rate)
        self.assertEqual(stats['completion_rates']['task_completion_rate'], expected_task_completion_rate)
    
    def test_get_project_statistics(self):
        """Test project statistics calculation."""
        stats = get_project_statistics(self.active_project)
        
        # Test project info
        self.assertEqual(stats['project']['id'], self.active_project.id)
        self.assertEqual(stats['project']['name'], "Active Project")
        self.assertEqual(stats['project']['status'], "ACTIVE")
        
        # Test task statistics for active project (has 4 tasks)
        self.assertEqual(stats['tasks']['total_tasks'], 4)
        self.assertEqual(stats['tasks']['todo_tasks'], 2)  # todo_task + overdue_task
        self.assertEqual(stats['tasks']['in_progress_tasks'], 1)
        self.assertEqual(stats['tasks']['done_tasks'], 1)
        self.assertEqual(stats['tasks']['assigned_tasks'], 3)  # todo_task, in_progress_task, done_task have assignees
        self.assertEqual(stats['tasks']['unassigned_tasks'], 1)  # overdue_task has no assignee
        
        # Test completion rate (1 done out of 4 total = 25%)
        self.assertEqual(stats['completion_rate'], 25.0)
    
    def test_get_project_statistics_with_organization_validation(self):
        """Test project statistics with organization validation."""
        # Valid organization
        stats = get_project_statistics(self.active_project, self.organization)
        self.assertEqual(stats['project']['id'], self.active_project.id)
        
        # Invalid organization
        other_org = Organization.objects.create(
            name="Other Organization",
            slug="other-org",
            contact_email="other@example.com"
        )
        
        with self.assertRaises(Exception):
            get_project_statistics(self.active_project, other_org)
    
    def test_cache_invalidation(self):
        """Test cache invalidation functions."""
        # Set up cache keys
        project_cache_key = f"project_stats_{self.active_project.id}_{self.organization.slug}"
        org_cache_key = f"org_stats_{self.organization.slug}"
        
        # Set some cached data
        cache.set(project_cache_key, {"test": "data"}, 300)
        cache.set(org_cache_key, {"test": "data"}, 300)
        
        # Verify cache is set
        self.assertIsNotNone(cache.get(project_cache_key))
        self.assertIsNotNone(cache.get(org_cache_key))
        
        # Test project cache invalidation
        invalidate_project_statistics_cache(self.active_project.id, self.organization.slug)
        self.assertIsNone(cache.get(project_cache_key))
        
        # Test organization cache invalidation
        invalidate_organization_statistics_cache(self.organization.slug)
        self.assertIsNone(cache.get(org_cache_key))
    
    def test_cached_statistics_functions(self):
        """Test cached statistics retrieval functions."""
        call_count = 0
        
        def mock_calculate_func():
            nonlocal call_count
            call_count += 1
            return {"calculated": True, "call_count": call_count}
        
        # Test project statistics caching
        result1 = get_cached_project_statistics(
            self.active_project.id, 
            self.organization.slug, 
            mock_calculate_func
        )
        result2 = get_cached_project_statistics(
            self.active_project.id, 
            self.organization.slug, 
            mock_calculate_func
        )
        
        # Should only call calculate function once due to caching
        self.assertEqual(call_count, 1)
        self.assertEqual(result1, result2)
        self.assertTrue(result1["calculated"])
        
        # Reset call count for organization test
        call_count = 0
        
        # Test organization statistics caching
        result3 = get_cached_organization_statistics(
            self.organization.slug, 
            mock_calculate_func
        )
        result4 = get_cached_organization_statistics(
            self.organization.slug, 
            mock_calculate_func
        )
        
        # Should only call calculate function once due to caching
        self.assertEqual(call_count, 1)
        self.assertEqual(result3, result4)
        self.assertTrue(result3["calculated"])


class StatisticsSignalsTestCase(TestCase):
    """Test cases for statistics cache invalidation signals."""
    
    def setUp(self):
        """Set up test data."""
        cache.clear()
        
        self.organization = Organization.objects.create(
            name="Test Organization",
            slug="test-org",
            contact_email="test@example.com"
        )
        
        self.project = Project.objects.create(
            organization=self.organization,
            name="Test Project",
            status="ACTIVE"
        )
    
    def test_project_change_invalidates_cache(self):
        """Test that project changes invalidate relevant caches."""
        # Set up cache
        project_cache_key = f"project_stats_{self.project.id}_{self.organization.slug}"
        org_cache_key = f"org_stats_{self.organization.slug}"
        
        cache.set(project_cache_key, {"test": "data"}, 300)
        cache.set(org_cache_key, {"test": "data"}, 300)
        
        # Modify project (should trigger signal)
        self.project.name = "Updated Project"
        self.project.save()
        
        # Cache should be invalidated
        self.assertIsNone(cache.get(project_cache_key))
        self.assertIsNone(cache.get(org_cache_key))
    
    def test_task_change_invalidates_cache(self):
        """Test that task changes invalidate relevant caches."""
        # Create a task
        task = Task.objects.create(
            project=self.project,
            title="Test Task",
            status="TODO"
        )
        
        # Set up cache
        project_cache_key = f"project_stats_{self.project.id}_{self.organization.slug}"
        org_cache_key = f"org_stats_{self.organization.slug}"
        
        cache.set(project_cache_key, {"test": "data"}, 300)
        cache.set(org_cache_key, {"test": "data"}, 300)
        
        # Modify task (should trigger signal)
        task.status = "DONE"
        task.save()
        
        # Cache should be invalidated
        self.assertIsNone(cache.get(project_cache_key))
        self.assertIsNone(cache.get(org_cache_key))
    
    def test_comment_change_invalidates_project_cache(self):
        """Test that comment changes invalidate project cache."""
        # Create a task and comment
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
        
        # Set up cache
        project_cache_key = f"project_stats_{self.project.id}_{self.organization.slug}"
        cache.set(project_cache_key, {"test": "data"}, 300)
        
        # Modify comment (should trigger signal)
        comment.content = "Updated comment"
        comment.save()
        
        # Project cache should be invalidated
        self.assertIsNone(cache.get(project_cache_key))