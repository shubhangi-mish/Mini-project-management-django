"""
Test factories for creating consistent test data across all test cases.
Uses factory_boy for generating test objects with realistic data.
"""
import factory
from factory.django import DjangoModelFactory
from factory import Faker, SubFactory, LazyAttribute
from django.utils import timezone
from datetime import timedelta
import random

from core.models import Organization
from projects.models import Project
from tasks.models import Task, TaskComment


class OrganizationFactory(DjangoModelFactory):
    """Factory for creating Organization test instances."""
    
    class Meta:
        model = Organization
    
    name = Faker('company')
    slug = LazyAttribute(lambda obj: f"{obj.name.lower().replace(' ', '-')}-{random.randint(1000, 9999)}")
    contact_email = Faker('company_email')


class ProjectFactory(DjangoModelFactory):
    """Factory for creating Project test instances."""
    
    class Meta:
        model = Project
    
    organization = SubFactory(OrganizationFactory)
    name = Faker('catch_phrase')
    description = Faker('text', max_nb_chars=500)
    status = factory.Iterator(['ACTIVE', 'COMPLETED', 'ON_HOLD'])
    due_date = factory.LazyFunction(
        lambda: timezone.now().date() + timedelta(days=random.randint(1, 90))
    )


class ActiveProjectFactory(ProjectFactory):
    """Factory for creating active projects."""
    status = 'ACTIVE'


class CompletedProjectFactory(ProjectFactory):
    """Factory for creating completed projects."""
    status = 'COMPLETED'


class TaskFactory(DjangoModelFactory):
    """Factory for creating Task test instances."""
    
    class Meta:
        model = Task
    
    project = SubFactory(ProjectFactory)
    title = Faker('sentence', nb_words=4)
    description = Faker('text', max_nb_chars=1000)
    status = factory.Iterator(['TODO', 'IN_PROGRESS', 'DONE'])
    assignee_email = factory.Maybe(
        'is_assigned',
        yes_declaration=Faker('email'),
        no_declaration=''
    )
    due_date = factory.Maybe(
        'has_due_date',
        yes_declaration=factory.LazyFunction(
            lambda: timezone.now() + timedelta(days=random.randint(1, 30))
        ),
        no_declaration=None
    )
    
    class Params:
        is_assigned = False
        has_due_date = False


class TodoTaskFactory(TaskFactory):
    """Factory for creating TODO tasks."""
    status = 'TODO'


class InProgressTaskFactory(TaskFactory):
    """Factory for creating IN_PROGRESS tasks."""
    status = 'IN_PROGRESS'


class DoneTaskFactory(TaskFactory):
    """Factory for creating DONE tasks."""
    status = 'DONE'


class AssignedTaskFactory(TaskFactory):
    """Factory for creating assigned tasks."""
    is_assigned = True


class OverdueTaskFactory(TaskFactory):
    """Factory for creating overdue tasks."""
    status = factory.Iterator(['TODO', 'IN_PROGRESS'])
    due_date = factory.LazyFunction(
        lambda: timezone.now() - timedelta(days=random.randint(1, 10))
    )


class TaskCommentFactory(DjangoModelFactory):
    """Factory for creating TaskComment test instances."""
    
    class Meta:
        model = TaskComment
    
    task = SubFactory(TaskFactory)
    content = Faker('text', max_nb_chars=2000)
    author_email = Faker('email')


# Utility functions for creating test scenarios

def create_organization_with_projects(num_projects=3):
    """Create an organization with multiple projects."""
    organization = OrganizationFactory()
    projects = []
    
    for i in range(num_projects):
        project = ProjectFactory(organization=organization)
        projects.append(project)
    
    return organization, projects


def create_project_with_tasks(num_tasks=5, organization=None):
    """Create a project with multiple tasks."""
    if organization:
        project = ProjectFactory(organization=organization)
    else:
        project = ProjectFactory()
    
    tasks = []
    for i in range(num_tasks):
        # Mix of different task types
        if i % 3 == 0:
            task = TodoTaskFactory(project=project)
        elif i % 3 == 1:
            task = InProgressTaskFactory(project=project)
        else:
            task = DoneTaskFactory(project=project)
        
        tasks.append(task)
    
    return project, tasks


def create_task_with_comments(num_comments=3, project=None):
    """Create a task with multiple comments."""
    if project:
        task = TaskFactory(project=project)
    else:
        task = TaskFactory()
    
    comments = []
    for i in range(num_comments):
        comment = TaskCommentFactory(task=task)
        comments.append(comment)
    
    return task, comments


def create_complete_test_scenario():
    """
    Create a complete test scenario with organization, projects, tasks, and comments.
    Returns a dictionary with all created objects.
    """
    # Create organization
    organization = OrganizationFactory()
    
    # Create projects with different statuses
    active_project = ActiveProjectFactory(organization=organization)
    completed_project = CompletedProjectFactory(organization=organization)
    on_hold_project = ProjectFactory(organization=organization, status='ON_HOLD')
    
    # Create tasks for active project
    active_tasks = []
    for i in range(10):
        if i < 3:
            task = TodoTaskFactory(project=active_project, is_assigned=True)
        elif i < 6:
            task = InProgressTaskFactory(project=active_project, is_assigned=True)
        else:
            task = DoneTaskFactory(project=active_project, is_assigned=True)
        
        active_tasks.append(task)
    
    # Create tasks for completed project
    completed_tasks = []
    for i in range(5):
        task = DoneTaskFactory(project=completed_project)
        completed_tasks.append(task)
    
    # Create some overdue tasks
    overdue_tasks = []
    for i in range(2):
        task = OverdueTaskFactory(project=active_project)
        overdue_tasks.append(task)
    
    # Create comments for some tasks
    comments = []
    for task in active_tasks[:5]:  # Add comments to first 5 tasks
        for j in range(2):
            comment = TaskCommentFactory(task=task)
            comments.append(comment)
    
    return {
        'organization': organization,
        'projects': {
            'active': active_project,
            'completed': completed_project,
            'on_hold': on_hold_project
        },
        'tasks': {
            'active': active_tasks,
            'completed': completed_tasks,
            'overdue': overdue_tasks
        },
        'comments': comments
    }


def create_multi_tenant_scenario():
    """
    Create a multi-tenant test scenario with multiple organizations.
    Returns a list of organization scenarios.
    """
    scenarios = []
    
    for i in range(3):  # Create 3 organizations
        scenario = create_complete_test_scenario()
        scenarios.append(scenario)
    
    return scenarios