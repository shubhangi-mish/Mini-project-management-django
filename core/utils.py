"""
Utility functions for organization-scoped queries and operations.
"""
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.db import models
from core.models import Organization


class OrganizationContextError(Exception):
    """Custom exception for organization context errors."""
    pass


def get_organization_by_slug(slug):
    """
    Get organization by slug with proper error handling.
    
    Args:
        slug (str): Organization slug
        
    Returns:
        Organization: The organization instance
        
    Raises:
        OrganizationContextError: If organization not found
    """
    try:
        return Organization.objects.get(slug=slug)
    except Organization.DoesNotExist:
        raise OrganizationContextError(f"Organization with slug '{slug}' does not exist")


def validate_organization_access(request, organization_slug):
    """
    Validate that the request has access to the specified organization.
    
    Args:
        request: Django request object
        organization_slug (str): Organization slug to validate
        
    Returns:
        Organization: The validated organization
        
    Raises:
        OrganizationContextError: If access is denied or organization not found
    """
    current_org = getattr(request, 'organization', None)
    
    if not current_org:
        raise OrganizationContextError("No organization context in request")
    
    if current_org.slug != organization_slug:
        raise OrganizationContextError(f"Access denied to organization '{organization_slug}'")
    
    return current_org


def get_organization_scoped_queryset(model_class, organization):
    """
    Get organization-scoped queryset for any model.
    
    Args:
        model_class: Django model class
        organization: Organization instance
        
    Returns:
        QuerySet: Filtered queryset
    """
    if hasattr(model_class, 'organization'):
        # Direct organization relationship
        return model_class.objects.filter(organization=organization)
    elif hasattr(model_class, 'project'):
        # Organization through project relationship
        return model_class.objects.filter(project__organization=organization)
    elif hasattr(model_class, 'task'):
        # Organization through task->project relationship
        return model_class.objects.filter(task__project__organization=organization)
    else:
        # No organization relationship
        return model_class.objects.all()


def create_organization_scoped_object(model_class, organization, **kwargs):
    """
    Create an object with proper organization context validation.
    
    Args:
        model_class: Django model class
        organization: Organization instance
        **kwargs: Object creation parameters
        
    Returns:
        Model instance: Created object
        
    Raises:
        ValidationError: If organization context is invalid
    """
    if hasattr(model_class, 'organization'):
        kwargs['organization'] = organization
    elif hasattr(model_class, 'project'):
        # Validate project belongs to organization
        project = kwargs.get('project')
        if project and project.organization != organization:
            raise ValidationError(f"Project does not belong to organization {organization.slug}")
    elif hasattr(model_class, 'task'):
        # Validate task's project belongs to organization
        task = kwargs.get('task')
        if task and task.project.organization != organization:
            raise ValidationError(f"Task does not belong to organization {organization.slug}")
    
    return model_class.objects.create(**kwargs)


def get_organization_statistics(organization):
    """
    Get comprehensive statistics for an organization.
    
    Args:
        organization: Organization instance
        
    Returns:
        dict: Statistics dictionary
    """
    from projects.models import Project
    from tasks.models import Task, TaskComment
    
    # Project statistics
    projects = Project.objects.filter(organization=organization)
    project_stats = {
        'total_projects': projects.count(),
        'active_projects': projects.filter(status='ACTIVE').count(),
        'completed_projects': projects.filter(status='COMPLETED').count(),
        'on_hold_projects': projects.filter(status='ON_HOLD').count(),
    }
    
    # Task statistics
    tasks = Task.objects.filter(project__organization=organization)
    task_stats = {
        'total_tasks': tasks.count(),
        'todo_tasks': tasks.filter(status='TODO').count(),
        'in_progress_tasks': tasks.filter(status='IN_PROGRESS').count(),
        'done_tasks': tasks.filter(status='DONE').count(),
        'assigned_tasks': tasks.exclude(assignee_email='').count(),
        'unassigned_tasks': tasks.filter(assignee_email='').count(),
    }
    
    # Comment statistics
    comments = TaskComment.objects.filter(task__project__organization=organization)
    comment_stats = {
        'total_comments': comments.count(),
    }
    
    # Completion rates
    completion_stats = {
        'project_completion_rate': (
            project_stats['completed_projects'] / project_stats['total_projects'] * 100
            if project_stats['total_projects'] > 0 else 0
        ),
        'task_completion_rate': (
            task_stats['done_tasks'] / task_stats['total_tasks'] * 100
            if task_stats['total_tasks'] > 0 else 0
        ),
    }
    
    return {
        'organization': {
            'name': organization.name,
            'slug': organization.slug,
        },
        'projects': project_stats,
        'tasks': task_stats,
        'comments': comment_stats,
        'completion_rates': completion_stats,
    }


def get_project_statistics(project, organization=None):
    """
    Get statistics for a specific project with organization validation.
    
    Args:
        project: Project instance
        organization: Optional organization for validation
        
    Returns:
        dict: Project statistics
        
    Raises:
        ValidationError: If project doesn't belong to organization
    """
    if organization and project.organization != organization:
        raise ValidationError(f"Project does not belong to organization {organization.slug}")
    
    tasks = project.tasks.all()
    
    return {
        'project': {
            'id': project.id,
            'name': project.name,
            'status': project.status,
        },
        'tasks': {
            'total_tasks': tasks.count(),
            'todo_tasks': tasks.filter(status='TODO').count(),
            'in_progress_tasks': tasks.filter(status='IN_PROGRESS').count(),
            'done_tasks': tasks.filter(status='DONE').count(),
            'assigned_tasks': tasks.exclude(assignee_email='').count(),
            'unassigned_tasks': tasks.filter(assignee_email='').count(),
        },
        'completion_rate': project.completion_percentage,
    }


def bulk_update_organization_context(queryset, organization):
    """
    Bulk update objects to ensure they belong to the correct organization.
    
    Args:
        queryset: QuerySet to update
        organization: Target organization
        
    Returns:
        int: Number of updated objects
    """
    if hasattr(queryset.model, 'organization'):
        return queryset.update(organization=organization)
    else:
        # For models without direct organization relationship,
        # we can't bulk update organization context
        raise ValidationError(f"Model {queryset.model.__name__} doesn't have direct organization relationship")


def filter_by_organization_context(queryset, organization):
    """
    Filter any queryset by organization context.
    
    Args:
        queryset: QuerySet to filter
        organization: Organization to filter by
        
    Returns:
        QuerySet: Filtered queryset
    """
    model = queryset.model
    
    if hasattr(model, 'organization'):
        return queryset.filter(organization=organization)
    elif hasattr(model, 'project'):
        return queryset.filter(project__organization=organization)
    elif hasattr(model, 'task'):
        return queryset.filter(task__project__organization=organization)
    else:
        # No organization relationship, return original queryset
        return queryset


def validate_organization_ownership(obj, organization):
    """
    Validate that an object belongs to the specified organization.
    
    Args:
        obj: Model instance to validate
        organization: Organization to validate against
        
    Returns:
        bool: True if object belongs to organization
        
    Raises:
        ValidationError: If object doesn't belong to organization
    """
    if hasattr(obj, 'organization'):
        if obj.organization != organization:
            raise ValidationError(f"{obj.__class__.__name__} does not belong to organization {organization.slug}")
    elif hasattr(obj, 'project'):
        if obj.project.organization != organization:
            raise ValidationError(f"{obj.__class__.__name__} does not belong to organization {organization.slug}")
    elif hasattr(obj, 'task'):
        if obj.task.project.organization != organization:
            raise ValidationError(f"{obj.__class__.__name__} does not belong to organization {organization.slug}")
    else:
        # No organization relationship, assume valid
        pass
    
    return True


class OrganizationContextDecorator:
    """
    Decorator to ensure organization context is available in functions.
    """
    
    def __init__(self, require_organization=True):
        self.require_organization = require_organization
    
    def __call__(self, func):
        def wrapper(*args, **kwargs):
            from core.middleware import get_current_organization
            
            organization = get_current_organization()
            
            if self.require_organization and not organization:
                raise OrganizationContextError("Organization context is required")
            
            # Inject organization as first argument if not already present
            if organization and 'organization' not in kwargs:
                kwargs['organization'] = organization
            
            return func(*args, **kwargs)
        
        return wrapper


# Decorator instances for common use cases
require_organization_context = OrganizationContextDecorator(require_organization=True)
optional_organization_context = OrganizationContextDecorator(require_organization=False)