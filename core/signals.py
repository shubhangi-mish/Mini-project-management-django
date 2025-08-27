"""
Django signals for cache invalidation and statistics updates.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from projects.models import Project
from tasks.models import Task, TaskComment
from core.utils import (
    invalidate_project_statistics_cache,
    invalidate_organization_statistics_cache,
    invalidate_all_statistics_cache
)


@receiver(post_save, sender=Project)
@receiver(post_delete, sender=Project)
def invalidate_project_cache_on_project_change(sender, instance, **kwargs):
    """
    Invalidate project and organization statistics cache when project changes.
    """
    organization_slug = instance.organization.slug
    
    # Invalidate project-specific cache
    invalidate_project_statistics_cache(instance.id, organization_slug)
    
    # Invalidate organization-wide cache
    invalidate_organization_statistics_cache(organization_slug)


@receiver(post_save, sender=Task)
@receiver(post_delete, sender=Task)
def invalidate_cache_on_task_change(sender, instance, **kwargs):
    """
    Invalidate project and organization statistics cache when task changes.
    """
    project = instance.project
    organization_slug = project.organization.slug
    
    # Invalidate project-specific cache
    invalidate_project_statistics_cache(project.id, organization_slug)
    
    # Invalidate organization-wide cache
    invalidate_organization_statistics_cache(organization_slug)


@receiver(post_save, sender=TaskComment)
@receiver(post_delete, sender=TaskComment)
def invalidate_cache_on_comment_change(sender, instance, **kwargs):
    """
    Invalidate project statistics cache when task comments change.
    Note: Comments don't affect organization-wide task statistics,
    but they might affect project-level comment counts if we add that feature.
    """
    task = instance.task
    project = task.project
    organization_slug = project.organization.slug
    
    # Invalidate project-specific cache (in case we add comment statistics)
    invalidate_project_statistics_cache(project.id, organization_slug)