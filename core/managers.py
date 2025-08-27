"""
Organization-scoped model managers for multi-tenancy support.
"""
from django.db import models
from django.core.exceptions import ValidationError


class OrganizationScopedManager(models.Manager):
    """
    Base manager that automatically filters queries by organization context.
    """
    
    def get_queryset(self):
        """
        Return queryset filtered by current organization context.
        """
        from core.middleware import get_current_organization
        
        queryset = super().get_queryset()
        organization = get_current_organization()
        
        if organization:
            if hasattr(self.model, 'organization'):
                # Direct organization relationship
                return queryset.filter(organization=organization)
            elif hasattr(self.model, 'project'):
                # Organization through project relationship (for tasks)
                return queryset.filter(project__organization=organization)
            elif hasattr(self.model, 'task'):
                # Organization through task->project relationship (for comments)
                return queryset.filter(task__project__organization=organization)
        
        return queryset
    
    def for_organization(self, organization):
        """
        Explicitly filter queryset by organization.
        """
        if hasattr(self.model, 'organization'):
            return self.filter(organization=organization)
        elif hasattr(self.model, 'project'):
            return self.filter(project__organization=organization)
        elif hasattr(self.model, 'task'):
            return self.filter(task__project__organization=organization)
        
        return self.all()
    
    def create_for_organization(self, organization, **kwargs):
        """
        Create an object with organization context.
        """
        if hasattr(self.model, 'organization'):
            kwargs['organization'] = organization
        elif hasattr(self.model, 'project'):
            # For models with project relationship, ensure project belongs to organization
            project = kwargs.get('project')
            if project and project.organization != organization:
                raise ValidationError(f"Project does not belong to organization {organization.slug}")
        elif hasattr(self.model, 'task'):
            # For models with task relationship, ensure task's project belongs to organization
            task = kwargs.get('task')
            if task and task.project.organization != organization:
                raise ValidationError(f"Task does not belong to organization {organization.slug}")
        
        return self.create(**kwargs)


class OrganizationManager(models.Manager):
    """
    Manager for Organization model with additional utility methods.
    """
    
    def get_by_slug(self, slug):
        """
        Get organization by slug with proper error handling.
        """
        try:
            return self.get(slug=slug)
        except self.model.DoesNotExist:
            raise ValidationError(f"Organization with slug '{slug}' does not exist")
    
    def create_with_slug(self, name, contact_email, slug=None):
        """
        Create organization with auto-generated slug if not provided.
        """
        from django.utils.text import slugify
        
        if not slug:
            slug = slugify(name)
        
        # Ensure slug is unique
        original_slug = slug
        counter = 1
        while self.filter(slug=slug).exists():
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        return self.create(
            name=name,
            slug=slug,
            contact_email=contact_email
        )


class ProjectManager(OrganizationScopedManager):
    """
    Manager for Project model with organization scoping and additional methods.
    """
    
    def active_projects(self):
        """
        Get active projects in current organization context.
        """
        return self.filter(status='ACTIVE')
    
    def completed_projects(self):
        """
        Get completed projects in current organization context.
        """
        return self.filter(status='COMPLETED')
    
    def on_hold_projects(self):
        """
        Get on-hold projects in current organization context.
        """
        return self.filter(status='ON_HOLD')
    
    def overdue_projects(self):
        """
        Get overdue projects in current organization context.
        """
        from django.utils import timezone
        return self.filter(
            due_date__lt=timezone.now().date(),
            status__in=['ACTIVE', 'ON_HOLD']
        )
    
    def with_task_counts(self):
        """
        Annotate projects with task counts.
        """
        return self.annotate(
            total_tasks=models.Count('tasks'),
            completed_tasks=models.Count('tasks', filter=models.Q(tasks__status='DONE')),
            in_progress_tasks=models.Count('tasks', filter=models.Q(tasks__status='IN_PROGRESS')),
            todo_tasks=models.Count('tasks', filter=models.Q(tasks__status='TODO'))
        )


class TaskManager(OrganizationScopedManager):
    """
    Manager for Task model with organization scoping and additional methods.
    """
    
    def todo_tasks(self):
        """
        Get TODO tasks in current organization context.
        """
        return self.filter(status='TODO')
    
    def in_progress_tasks(self):
        """
        Get IN_PROGRESS tasks in current organization context.
        """
        return self.filter(status='IN_PROGRESS')
    
    def done_tasks(self):
        """
        Get DONE tasks in current organization context.
        """
        return self.filter(status='DONE')
    
    def assigned_tasks(self):
        """
        Get assigned tasks in current organization context.
        """
        return self.exclude(assignee_email='')
    
    def unassigned_tasks(self):
        """
        Get unassigned tasks in current organization context.
        """
        return self.filter(assignee_email='')
    
    def overdue_tasks(self):
        """
        Get overdue tasks in current organization context.
        """
        from django.utils import timezone
        return self.filter(
            due_date__lt=timezone.now(),
            status__in=['TODO', 'IN_PROGRESS']
        )
    
    def for_project(self, project):
        """
        Get tasks for a specific project with organization validation.
        """
        from core.middleware import get_current_organization
        
        organization = get_current_organization()
        if organization and project.organization != organization:
            raise ValidationError("Project does not belong to current organization")
        
        return self.filter(project=project)
    
    def assigned_to(self, email):
        """
        Get tasks assigned to a specific email in current organization context.
        """
        return self.filter(assignee_email=email)


class TaskCommentManager(OrganizationScopedManager):
    """
    Manager for TaskComment model with organization scoping and additional methods.
    """
    
    def for_task(self, task):
        """
        Get comments for a specific task with organization validation.
        """
        from core.middleware import get_current_organization
        
        organization = get_current_organization()
        if organization and task.project.organization != organization:
            raise ValidationError("Task does not belong to current organization")
        
        return self.filter(task=task)
    
    def by_author(self, author_email):
        """
        Get comments by a specific author in current organization context.
        """
        return self.filter(author_email=author_email)
    
    def recent_comments(self, days=7):
        """
        Get recent comments within specified days in current organization context.
        """
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=days)
        return self.filter(created_at__gte=cutoff_date)