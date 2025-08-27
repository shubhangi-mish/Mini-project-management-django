from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
import graphene
from graphene.test import Client
from core.models import Organization
from projects.models import Project
from tasks.models import Task, TaskComment
from mini_project_management.schema import schema


class TaskMutationTestCase(TestCase):
    """Test cases for task GraphQL mutations"""
    
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
        
        # Create test projects
        self.project1 = Project.objects.create(
            organization=self.org1,
            name="Test Project 1",
            description="Test project description",
            status="ACTIVE"
        )
        
        self.project2 = Project.objects.create(
            organization=self.org2,
            name="Test Project 2",
            description="Test project description",
            status="ACTIVE"
        )
        
        # Create test task
        self.task = Task.objects.create(
            project=self.project1,
            title="Test Task",
            description="Test task description",
            status="TODO",
            assignee_email="test@example.com"
        )
    
    def test_create_task_success(self):
        """Test successful task creation"""
        mutation = '''
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
                        project {
                            id
                            name
                        }
                    }
                }
            }
        '''
        
        future_date = timezone.now() + timedelta(days=7)
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "projectId": str(self.project1.id),
                "title": "New Test Task",
                "description": "A new test task",
                "status": "TODO",
                "assigneeEmail": "newassignee@example.com",
                "dueDate": future_date.isoformat()
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTask']
        self.assertTrue(data['success'])
        self.assertEqual(len(data['errors']), 0)
        self.assertEqual(data['task']['title'], "New Test Task")
        self.assertEqual(data['task']['status'], "TODO")
        self.assertEqual(data['task']['assigneeEmail'], "newassignee@example.com")
        self.assertEqual(data['task']['project']['id'], str(self.project1.id))
    
    def test_create_task_invalid_organization(self):
        """Test task creation with invalid organization"""
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
                "organizationSlug": "nonexistent-org",
                "projectId": str(self.project1.id),
                "title": "Test Task"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTask']
        self.assertFalse(data['success'])
        self.assertIn("Organization with slug 'nonexistent-org' not found", data['errors'])
        self.assertIsNone(data['task'])
    
    def test_create_task_invalid_project(self):
        """Test task creation with invalid project"""
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
                "organizationSlug": "test-org-1",
                "projectId": "999999",  # Non-existent project ID
                "title": "Test Task"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTask']
        self.assertFalse(data['success'])
        self.assertIn("Project with ID '999999' not found", data['errors'][0])
        self.assertIsNone(data['task'])
    
    def test_create_task_wrong_organization_project(self):
        """Test task creation with project from different organization"""
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
                "organizationSlug": "test-org-1",
                "projectId": str(self.project2.id),  # Project belongs to org2
                "title": "Test Task"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTask']
        self.assertFalse(data['success'])
        self.assertIn("not found in organization 'test-org-1'", data['errors'][0])
    
    def test_create_task_empty_title(self):
        """Test task creation with empty title"""
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
                "organizationSlug": "test-org-1",
                "projectId": str(self.project1.id),
                "title": ""
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTask']
        self.assertFalse(data['success'])
        self.assertIn("Task title is required and cannot be empty", data['errors'])
    
    def test_create_task_duplicate_title(self):
        """Test task creation with duplicate title in same project"""
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
                "organizationSlug": "test-org-1",
                "projectId": str(self.project1.id),
                "title": "Test Task"  # This title already exists
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTask']
        self.assertFalse(data['success'])
        self.assertIn("A task with title 'Test Task' already exists", data['errors'][0])
    
    def test_create_task_invalid_email(self):
        """Test task creation with invalid assignee email"""
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
                "organizationSlug": "test-org-1",
                "projectId": str(self.project1.id),
                "title": "New Task",
                "assigneeEmail": "invalid-email"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTask']
        self.assertFalse(data['success'])
        self.assertIn("Enter a valid email address for assignee", data['errors'])
    
    def test_create_task_past_due_date(self):
        """Test task creation with past due date"""
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
        
        past_date = timezone.now() - timedelta(days=1)
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "projectId": str(self.project1.id),
                "title": "New Task",
                "dueDate": past_date.isoformat()
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTask']
        self.assertFalse(data['success'])
        self.assertIn("Due date cannot be in the past for new tasks", data['errors'])
    
    def test_update_task_success(self):
        """Test successful task update"""
        mutation = '''
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
                    }
                }
            }
        '''
        
        variables = {
            "input": {
                "id": str(self.task.id),
                "organizationSlug": "test-org-1",
                "title": "Updated Test Task",
                "description": "Updated description",
                "status": "IN_PROGRESS",
                "assigneeEmail": "updated@example.com"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['updateTask']
        self.assertTrue(data['success'])
        self.assertEqual(len(data['errors']), 0)
        self.assertEqual(data['task']['title'], "Updated Test Task")
        self.assertEqual(data['task']['status'], "IN_PROGRESS")
        self.assertEqual(data['task']['assigneeEmail'], "updated@example.com")
    
    def test_update_task_status_change_tracking(self):
        """Test task update with status change tracking"""
        # Update task status from TODO to IN_PROGRESS
        mutation = '''
            mutation UpdateTask($input: UpdateTaskInput!) {
                updateTask(input: $input) {
                    success
                    errors
                    task {
                        id
                        status
                    }
                }
            }
        '''
        
        variables = {
            "input": {
                "id": str(self.task.id),
                "organizationSlug": "test-org-1",
                "status": "DONE"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['updateTask']
        self.assertTrue(data['success'])
        self.assertEqual(data['task']['status'], "DONE")
        
        # Verify the task was actually updated in the database
        updated_task = Task.objects.get(id=self.task.id)
        self.assertEqual(updated_task.status, "DONE")
    
    def test_update_task_invalid_organization(self):
        """Test task update with invalid organization"""
        mutation = '''
            mutation UpdateTask($input: UpdateTaskInput!) {
                updateTask(input: $input) {
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
                "id": str(self.task.id),
                "organizationSlug": "nonexistent-org",
                "title": "Updated Title"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['updateTask']
        self.assertFalse(data['success'])
        self.assertIn("Organization with slug 'nonexistent-org' not found", data['errors'])
    
    def test_update_task_wrong_organization(self):
        """Test task update with wrong organization context"""
        mutation = '''
            mutation UpdateTask($input: UpdateTaskInput!) {
                updateTask(input: $input) {
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
                "id": str(self.task.id),
                "organizationSlug": "test-org-2",  # Task belongs to test-org-1
                "title": "Updated Title"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['updateTask']
        self.assertFalse(data['success'])
        self.assertIn("not found in organization 'test-org-2'", data['errors'][0])
    
    def test_update_task_assignment_functionality(self):
        """Test task assignment functionality in update mutation"""
        mutation = '''
            mutation UpdateTask($input: UpdateTaskInput!) {
                updateTask(input: $input) {
                    success
                    errors
                    task {
                        id
                        assigneeEmail
                        isAssigned
                    }
                }
            }
        '''
        
        # Test assigning task to new user
        variables = {
            "input": {
                "id": str(self.task.id),
                "organizationSlug": "test-org-1",
                "assigneeEmail": "newassignee@example.com"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['updateTask']
        self.assertTrue(data['success'])
        self.assertEqual(data['task']['assigneeEmail'], "newassignee@example.com")
        self.assertTrue(data['task']['isAssigned'])
        
        # Test unassigning task (empty email)
        variables = {
            "input": {
                "id": str(self.task.id),
                "organizationSlug": "test-org-1",
                "assigneeEmail": ""
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['updateTask']
        self.assertTrue(data['success'])
        self.assertEqual(data['task']['assigneeEmail'], "")
        self.assertFalse(data['task']['isAssigned'])
    
    def test_update_task_invalid_email(self):
        """Test task update with invalid assignee email"""
        mutation = '''
            mutation UpdateTask($input: UpdateTaskInput!) {
                updateTask(input: $input) {
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
                "id": str(self.task.id),
                "organizationSlug": "test-org-1",
                "assigneeEmail": "invalid-email"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['updateTask']
        self.assertFalse(data['success'])
        self.assertIn("Enter a valid email address for assignee", data['errors'])
    
    def test_delete_task_success(self):
        """Test successful task deletion"""
        mutation = '''
            mutation DeleteTask($input: DeleteTaskInput!) {
                deleteTask(input: $input) {
                    success
                    errors
                    deletedTaskId
                }
            }
        '''
        
        variables = {
            "input": {
                "id": str(self.task.id),
                "organizationSlug": "test-org-1"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['deleteTask']
        self.assertTrue(data['success'])
        self.assertEqual(len(data['errors']), 0)
        self.assertEqual(data['deletedTaskId'], str(self.task.id))
        
        # Verify task is actually deleted
        self.assertFalse(Task.objects.filter(id=self.task.id).exists())
    
    def test_delete_task_with_cascade(self):
        """Test task deletion with cascade handling for comments"""
        # Create comment for the task
        comment = TaskComment.objects.create(
            task=self.task,
            content="Test comment",
            author_email="test@example.com"
        )
        
        mutation = '''
            mutation DeleteTask($input: DeleteTaskInput!) {
                deleteTask(input: $input) {
                    success
                    errors
                    deletedTaskId
                }
            }
        '''
        
        variables = {
            "input": {
                "id": str(self.task.id),
                "organizationSlug": "test-org-1"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['deleteTask']
        self.assertTrue(data['success'])
        
        # Verify cascade deletion
        self.assertFalse(Task.objects.filter(id=self.task.id).exists())
        self.assertFalse(TaskComment.objects.filter(id=comment.id).exists())
    
    def test_delete_task_invalid_organization(self):
        """Test task deletion with invalid organization"""
        mutation = '''
            mutation DeleteTask($input: DeleteTaskInput!) {
                deleteTask(input: $input) {
                    success
                    errors
                    deletedTaskId
                }
            }
        '''
        
        variables = {
            "input": {
                "id": str(self.task.id),
                "organizationSlug": "nonexistent-org"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['deleteTask']
        self.assertFalse(data['success'])
        self.assertIn("Organization with slug 'nonexistent-org' not found", data['errors'])
        self.assertIsNone(data['deletedTaskId'])
    
    def test_delete_task_proper_authorization(self):
        """Test task deletion with proper authorization (organization context)"""
        mutation = '''
            mutation DeleteTask($input: DeleteTaskInput!) {
                deleteTask(input: $input) {
                    success
                    errors
                    deletedTaskId
                }
            }
        '''
        
        variables = {
            "input": {
                "id": str(self.task.id),
                "organizationSlug": "test-org-2"  # Task belongs to test-org-1
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['deleteTask']
        self.assertFalse(data['success'])
        self.assertIn("not found in organization 'test-org-2'", data['errors'][0])
        
        # Verify task still exists
        self.assertTrue(Task.objects.filter(id=self.task.id).exists())
    
    def test_comprehensive_input_validation(self):
        """Test comprehensive input validation for all task fields"""
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
        
        # Test title too long
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "projectId": str(self.project1.id),
                "title": "x" * 201  # Exceeds 200 character limit
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTask']
        self.assertFalse(data['success'])
        self.assertIn("Task title cannot exceed 200 characters", data['errors'])
        
        # Test invalid status
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "projectId": str(self.project1.id),
                "title": "Valid Title",
                "status": "INVALID_STATUS"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTask']
        self.assertFalse(data['success'])
        self.assertIn("Status must be one of: TODO, IN_PROGRESS, DONE", data['errors'])


class TaskCommentMutationTestCase(TestCase):
    """Test cases for task comment GraphQL mutations"""
    
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
        
        # Create test projects
        self.project1 = Project.objects.create(
            organization=self.org1,
            name="Test Project 1",
            description="Test project description",
            status="ACTIVE"
        )
        
        self.project2 = Project.objects.create(
            organization=self.org2,
            name="Test Project 2",
            description="Test project description",
            status="ACTIVE"
        )
        
        # Create test tasks
        self.task1 = Task.objects.create(
            project=self.project1,
            title="Test Task 1",
            description="Test task description",
            status="TODO",
            assignee_email="test@example.com"
        )
        
        self.task2 = Task.objects.create(
            project=self.project2,
            title="Test Task 2",
            description="Test task description",
            status="TODO",
            assignee_email="test@example.com"
        )
    
    def test_create_task_comment_success(self):
        """Test successful task comment creation"""
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
                        createdAt
                        task {
                            id
                            title
                        }
                    }
                }
            }
        '''
        
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "taskId": str(self.task1.id),
                "content": "This is a test comment with detailed feedback about the task progress.",
                "authorEmail": "author@example.com"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTaskComment']
        self.assertTrue(data['success'])
        self.assertEqual(len(data['errors']), 0)
        self.assertEqual(data['comment']['content'], "This is a test comment with detailed feedback about the task progress.")
        self.assertEqual(data['comment']['authorEmail'], "author@example.com")
        self.assertEqual(data['comment']['task']['id'], str(self.task1.id))
        self.assertIsNotNone(data['comment']['createdAt'])
        self.assertIsNotNone(data['comment']['authorDisplayName'])
    
    def test_create_task_comment_author_validation(self):
        """Test task comment creation with author email validation"""
        mutation = '''
            mutation CreateTaskComment($input: CreateTaskCommentInput!) {
                createTaskComment(input: $input) {
                    success
                    errors
                    comment {
                        id
                    }
                }
            }
        '''
        
        # Test with invalid email format
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "taskId": str(self.task1.id),
                "content": "Test comment",
                "authorEmail": "invalid-email-format"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTaskComment']
        self.assertFalse(data['success'])
        self.assertIn("Enter a valid email address for author", data['errors'])
        self.assertIsNone(data['comment'])
    
    def test_create_task_comment_empty_author_email(self):
        """Test task comment creation with empty author email"""
        mutation = '''
            mutation CreateTaskComment($input: CreateTaskCommentInput!) {
                createTaskComment(input: $input) {
                    success
                    errors
                    comment {
                        id
                    }
                }
            }
        '''
        
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "taskId": str(self.task1.id),
                "content": "Test comment",
                "authorEmail": ""
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTaskComment']
        self.assertFalse(data['success'])
        self.assertIn("Author email is required and cannot be empty", data['errors'])
        self.assertIsNone(data['comment'])
    
    def test_create_task_comment_empty_content(self):
        """Test task comment creation with empty content"""
        mutation = '''
            mutation CreateTaskComment($input: CreateTaskCommentInput!) {
                createTaskComment(input: $input) {
                    success
                    errors
                    comment {
                        id
                    }
                }
            }
        '''
        
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "taskId": str(self.task1.id),
                "content": "",
                "authorEmail": "author@example.com"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTaskComment']
        self.assertFalse(data['success'])
        self.assertIn("Comment content is required and cannot be empty", data['errors'])
        self.assertIsNone(data['comment'])
    
    def test_create_task_comment_whitespace_only_content(self):
        """Test task comment creation with whitespace-only content"""
        mutation = '''
            mutation CreateTaskComment($input: CreateTaskCommentInput!) {
                createTaskComment(input: $input) {
                    success
                    errors
                    comment {
                        id
                    }
                }
            }
        '''
        
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "taskId": str(self.task1.id),
                "content": "   \n\t   ",  # Only whitespace
                "authorEmail": "author@example.com"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTaskComment']
        self.assertFalse(data['success'])
        self.assertIn("Comment content is required and cannot be empty", data['errors'])
        self.assertIsNone(data['comment'])
    
    def test_create_task_comment_content_length_validation(self):
        """Test task comment creation with content length validation"""
        mutation = '''
            mutation CreateTaskComment($input: CreateTaskCommentInput!) {
                createTaskComment(input: $input) {
                    success
                    errors
                    comment {
                        id
                    }
                }
            }
        '''
        
        # Test with content exceeding 5000 characters
        long_content = "x" * 5001
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "taskId": str(self.task1.id),
                "content": long_content,
                "authorEmail": "author@example.com"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTaskComment']
        self.assertFalse(data['success'])
        self.assertIn("Comment content cannot exceed 5000 characters", data['errors'])
        self.assertIsNone(data['comment'])
    
    def test_create_task_comment_invalid_organization(self):
        """Test task comment creation with invalid organization"""
        mutation = '''
            mutation CreateTaskComment($input: CreateTaskCommentInput!) {
                createTaskComment(input: $input) {
                    success
                    errors
                    comment {
                        id
                    }
                }
            }
        '''
        
        variables = {
            "input": {
                "organizationSlug": "nonexistent-org",
                "taskId": str(self.task1.id),
                "content": "Test comment",
                "authorEmail": "author@example.com"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTaskComment']
        self.assertFalse(data['success'])
        self.assertIn("Organization with slug 'nonexistent-org' not found", data['errors'])
        self.assertIsNone(data['comment'])
    
    def test_create_task_comment_invalid_task(self):
        """Test task comment creation with invalid task ID"""
        mutation = '''
            mutation CreateTaskComment($input: CreateTaskCommentInput!) {
                createTaskComment(input: $input) {
                    success
                    errors
                    comment {
                        id
                    }
                }
            }
        '''
        
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "taskId": "999999",  # Non-existent task ID
                "content": "Test comment",
                "authorEmail": "author@example.com"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTaskComment']
        self.assertFalse(data['success'])
        self.assertIn("Task with ID '999999' not found", data['errors'][0])
        self.assertIsNone(data['comment'])
    
    def test_create_task_comment_wrong_organization_task(self):
        """Test task comment creation with task from different organization"""
        mutation = '''
            mutation CreateTaskComment($input: CreateTaskCommentInput!) {
                createTaskComment(input: $input) {
                    success
                    errors
                    comment {
                        id
                    }
                }
            }
        '''
        
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "taskId": str(self.task2.id),  # Task belongs to org2
                "content": "Test comment",
                "authorEmail": "author@example.com"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTaskComment']
        self.assertFalse(data['success'])
        self.assertIn("not found in organization 'test-org-1'", data['errors'][0])
        self.assertIsNone(data['comment'])
    
    def test_create_task_comment_email_normalization(self):
        """Test task comment creation with email normalization (lowercase)"""
        mutation = '''
            mutation CreateTaskComment($input: CreateTaskCommentInput!) {
                createTaskComment(input: $input) {
                    success
                    errors
                    comment {
                        id
                        authorEmail
                    }
                }
            }
        '''
        
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "taskId": str(self.task1.id),
                "content": "Test comment",
                "authorEmail": "AUTHOR@EXAMPLE.COM"  # Uppercase email
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTaskComment']
        self.assertTrue(data['success'])
        # Email should be normalized to lowercase
        self.assertEqual(data['comment']['authorEmail'], "author@example.com")
    
    def test_create_task_comment_proper_timestamp_handling(self):
        """Test task comment creation with proper timestamp handling"""
        mutation = '''
            mutation CreateTaskComment($input: CreateTaskCommentInput!) {
                createTaskComment(input: $input) {
                    success
                    errors
                    comment {
                        id
                        createdAt
                    }
                }
            }
        '''
        
        before_creation = timezone.now()
        
        variables = {
            "input": {
                "organizationSlug": "test-org-1",
                "taskId": str(self.task1.id),
                "content": "Test comment for timestamp validation",
                "authorEmail": "author@example.com"
            }
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        after_creation = timezone.now()
        
        self.assertIsNone(result.get('errors'))
        data = result['data']['createTaskComment']
        self.assertTrue(data['success'])
        
        # Parse the returned timestamp
        from datetime import datetime
        created_at = datetime.fromisoformat(data['comment']['createdAt'].replace('Z', '+00:00'))
        
        # Verify timestamp is within reasonable range (allow some tolerance for test execution time)
        self.assertGreaterEqual(created_at, before_creation.replace(microsecond=0))
        self.assertLessEqual(created_at, after_creation + timedelta(seconds=1))
    
    def test_task_comment_list_resolver(self):
        """Test comment list resolver in Task GraphQL type"""
        # Create multiple comments for the task
        comment1 = TaskComment.objects.create(
            task=self.task1,
            content="First comment",
            author_email="author1@example.com"
        )
        
        comment2 = TaskComment.objects.create(
            task=self.task1,
            content="Second comment",
            author_email="author2@example.com"
        )
        
        query = '''
            query GetTaskWithComments($taskId: ID!) {
                # Note: This would require a task query resolver to be implemented
                # For now, we'll test the comment creation and verify through database
            }
        '''
        
        # Verify comments are properly associated with the task
        task_comments = TaskComment.objects.filter(task=self.task1).order_by('created_at')
        self.assertEqual(task_comments.count(), 2)
        self.assertEqual(task_comments[0].content, "First comment")
        self.assertEqual(task_comments[1].content, "Second comment")
        
        # Verify comment count property
        self.assertEqual(self.task1.comment_count, 2)
    
    def test_task_comment_author_display_name(self):
        """Test comment author display name property"""
        comment = TaskComment.objects.create(
            task=self.task1,
            content="Test comment",
            author_email="john.doe@example.com"
        )
        
        # Test author display name generation
        self.assertEqual(comment.author_display_name, "John Doe")
        
        # Test with different email format
        comment2 = TaskComment.objects.create(
            task=self.task1,
            content="Another comment",
            author_email="jane_smith@company.com"
        )
        
        self.assertEqual(comment2.author_display_name, "Jane_Smith")
    
    def test_task_comment_model_validation(self):
        """Test TaskComment model validation"""
        # Test empty content validation
        with self.assertRaises(ValidationError):
            comment = TaskComment(
                task=self.task1,
                content="",
                author_email="test@example.com"
            )
            comment.full_clean()
        
        # Test invalid email validation
        with self.assertRaises(ValidationError):
            comment = TaskComment(
                task=self.task1,
                content="Test content",
                author_email="invalid-email"
            )
            comment.full_clean()
        
        # Test content length validation
        with self.assertRaises(ValidationError):
            comment = TaskComment(
                task=self.task1,
                content="x" * 5001,  # Exceeds 5000 character limit
                author_email="test@example.com"
            )
            comment.full_clean()
    
    def test_task_comment_string_representation(self):
        """Test TaskComment string representation"""
        comment = TaskComment.objects.create(
            task=self.task1,
            content="Test comment for string representation",
            author_email="test@example.com"
        )
        
        expected_str = f"Comment by test@example.com on {self.task1.title}"
        self.assertEqual(str(comment), expected_str)
    
    def test_task_comment_cascade_deletion(self):
        """Test that comments are deleted when task is deleted"""
        # Create comments for the task
        comment1 = TaskComment.objects.create(
            task=self.task1,
            content="First comment",
            author_email="author1@example.com"
        )
        
        comment2 = TaskComment.objects.create(
            task=self.task1,
            content="Second comment",
            author_email="author2@example.com"
        )
        
        # Verify comments exist
        self.assertEqual(TaskComment.objects.filter(task=self.task1).count(), 2)
        
        # Delete the task
        task_id = self.task1.id
        self.task1.delete()
        
        # Verify comments are cascade deleted
        self.assertEqual(TaskComment.objects.filter(task_id=task_id).count(), 0)
    
    def test_multiple_comments_chronological_order(self):
        """Test that comments are retrieved in chronological order"""
        import time
        
        # Create comments with slight time delays
        comment1 = TaskComment.objects.create(
            task=self.task1,
            content="First comment",
            author_email="author1@example.com"
        )
        
        time.sleep(0.01)  # Small delay to ensure different timestamps
        
        comment2 = TaskComment.objects.create(
            task=self.task1,
            content="Second comment",
            author_email="author2@example.com"
        )
        
        time.sleep(0.01)
        
        comment3 = TaskComment.objects.create(
            task=self.task1,
            content="Third comment",
            author_email="author3@example.com"
        )
        
        # Retrieve comments in chronological order
        comments = TaskComment.objects.filter(task=self.task1).order_by('created_at')
        
        self.assertEqual(comments[0].content, "First comment")
        self.assertEqual(comments[1].content, "Second comment")
        self.assertEqual(comments[2].content, "Third comment")
        
        # Verify timestamps are in ascending order
        self.assertLess(comments[0].created_at, comments[1].created_at)
        self.assertLess(comments[1].created_at, comments[2].created_at)