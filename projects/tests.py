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