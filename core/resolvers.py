"""
Optimized GraphQL resolvers with DataLoader integration and efficient queries.
"""
import graphene
from django.db.models import Prefetch, Count, Q
from django.core.cache import cache
from django.utils import timezone
from core.dataloaders import get_dataloaders
from core.models import Organization
from projects.models import Project
from tasks.models import Task, TaskComment


class OptimizedQuery(graphene.ObjectType):
    """
    Optimized GraphQL queries with DataLoader integration and efficient database access.
    """
    
    # Organization queries
    organizations = graphene.List(
        'mini_project_management.schema.OrganizationType',
        description="Get all organizations (admin only)"
    )
    organization = graphene.Field(
        'mini_project_management.schema.OrganizationType',
        slug=graphene.String(required=True),
        description="Get organization by slug"
    )
    
    # Project queries with optimization
    projects = graphene.List(
        'mini_project_management.schema.ProjectType',
        organization_slug=graphene.String(required=True),
        status=graphene.String(),
        limit=graphene.Int(default_value=50),
        offset=graphene.Int(default_value=0),
        description="Get projects with efficient loading"
    )
    project = graphene.Field(
        'mini_project_management.schema.ProjectType',
        id=graphene.ID(required=True),
        organization_slug=graphene.String(required=True),
        description="Get single project with optimized loading"
    )
    
    # Task queries with optimization
    tasks = graphene.List(
        'mini_project_management.schema.TaskType',
        project_id=graphene.ID(),
        organization_slug=graphene.String(required=True),
        status=graphene.String(),
        assignee_email=graphene.String(),
        limit=graphene.Int(default_value=100),
        offset=graphene.Int(default_value=0),
        description="Get tasks with efficient loading"
    )
    task = graphene.Field(
        'mini_project_management.schema.TaskType',
        id=graphene.ID(required=True),
        organization_slug=graphene.String(required=True),
        description="Get single task with optimized loading"
    )
    
    # Comment queries
    task_comments = graphene.List(
        'mini_project_management.schema.TaskCommentType',
        task_id=graphene.ID(required=True),
        organization_slug=graphene.String(required=True),
        limit=graphene.Int(default_value=50),
        offset=graphene.Int(default_value=0),
        description="Get task comments with efficient loading"
    )
    
    def resolve_organizations(self, info):
        """Resolve organizations with basic optimization."""
        return Organization.objects.all().order_by('name')
    
    def resolve_organization(self, info, slug):
        """Resolve single organization using DataLoader."""
        try:
            return Organization.objects.get(slug=slug)
        except Organization.DoesNotExist:
            raise Exception(f"Organization with slug '{slug}' not found")
    
    def resolve_projects(self, info, organization_slug, status=None, limit=50, offset=0):
        """
        Resolve projects with optimized queries and DataLoader integration.
        """
        try:
            # Validate organization
            organization = Organization.objects.get(slug=organization_slug)
        except Organization.DoesNotExist:
            raise Exception(f"Organization with slug '{organization_slug}' not found")
        
        # Build optimized queryset
        queryset = Project.objects.select_related('organization').filter(
            organization=organization
        ).prefetch_related(
            Prefetch(
                'tasks',
                queryset=Task.objects.select_related('project').only(
                    'id', 'title', 'status', 'assignee_email', 'due_date', 'project_id'
                )
            )
        ).annotate(
            task_count=Count('tasks'),
            completed_task_count=Count('tasks', filter=Q(tasks__status='DONE')),
            in_progress_task_count=Count('tasks', filter=Q(tasks__status='IN_PROGRESS')),
            todo_task_count=Count('tasks', filter=Q(tasks__status='TODO'))
        )
        
        # Apply status filter if provided
        if status:
            queryset = queryset.filter(status=status)
        
        # Apply pagination
        queryset = queryset[offset:offset + limit]
        
        return queryset
    
    def resolve_project(self, info, id, organization_slug):
        """
        Resolve single project with optimized loading using DataLoader.
        """
        try:
            # Validate organization
            organization = Organization.objects.get(slug=organization_slug)
        except Organization.DoesNotExist:
            raise Exception(f"Organization with slug '{organization_slug}' not found")
        
        try:
            # Use optimized query with prefetch
            project = Project.objects.select_related('organization').prefetch_related(
                Prefetch(
                    'tasks',
                    queryset=Task.objects.select_related('project').prefetch_related(
                        Prefetch(
                            'comments',
                            queryset=TaskComment.objects.select_related('task').only(
                                'id', 'content', 'author_email', 'created_at', 'task_id'
                            )
                        )
                    )
                )
            ).get(id=id, organization=organization)
            
            return project
        except Project.DoesNotExist:
            raise Exception(f"Project with ID '{id}' not found in organization '{organization_slug}'")
    
    def resolve_tasks(self, info, organization_slug, project_id=None, status=None, 
                     assignee_email=None, limit=100, offset=0):
        """
        Resolve tasks with optimized queries and filtering.
        """
        try:
            # Validate organization
            organization = Organization.objects.get(slug=organization_slug)
        except Organization.DoesNotExist:
            raise Exception(f"Organization with slug '{organization_slug}' not found")
        
        # Build optimized queryset
        queryset = Task.objects.select_related(
            'project', 'project__organization'
        ).prefetch_related(
            Prefetch(
                'comments',
                queryset=TaskComment.objects.select_related('task').only(
                    'id', 'content', 'author_email', 'created_at', 'task_id'
                )
            )
        ).filter(project__organization=organization).annotate(
            comment_count=Count('comments')
        )
        
        # Apply filters
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if status:
            queryset = queryset.filter(status=status)
        if assignee_email:
            queryset = queryset.filter(assignee_email=assignee_email)
        
        # Apply pagination
        queryset = queryset[offset:offset + limit]
        
        return queryset
    
    def resolve_task(self, info, id, organization_slug):
        """
        Resolve single task with optimized loading using DataLoader.
        """
        try:
            # Validate organization
            organization = Organization.objects.get(slug=organization_slug)
        except Organization.DoesNotExist:
            raise Exception(f"Organization with slug '{organization_slug}' not found")
        
        try:
            # Use optimized query with prefetch
            task = Task.objects.select_related(
                'project', 'project__organization'
            ).prefetch_related(
                Prefetch(
                    'comments',
                    queryset=TaskComment.objects.select_related('task').order_by('created_at')
                )
            ).get(id=id, project__organization=organization)
            
            return task
        except Task.DoesNotExist:
            raise Exception(f"Task with ID '{id}' not found in organization '{organization_slug}'")
    
    def resolve_task_comments(self, info, task_id, organization_slug, limit=50, offset=0):
        """
        Resolve task comments with optimized loading.
        """
        try:
            # Validate organization and task
            organization = Organization.objects.get(slug=organization_slug)
            task = Task.objects.select_related('project').get(
                id=task_id, project__organization=organization
            )
        except Organization.DoesNotExist:
            raise Exception(f"Organization with slug '{organization_slug}' not found")
        except Task.DoesNotExist:
            raise Exception(f"Task with ID '{task_id}' not found in organization '{organization_slug}'")
        
        # Get comments with optimized query
        queryset = TaskComment.objects.select_related(
            'task', 'task__project'
        ).filter(task=task).order_by('created_at')
        
        # Apply pagination
        queryset = queryset[offset:offset + limit]
        
        return queryset


class OptimizedProjectType(graphene.ObjectType):
    """
    Optimized Project type with efficient resolvers.
    """
    
    def resolve_tasks(self, info):
        """Resolve tasks using DataLoader to prevent N+1 queries."""
        dataloaders = get_dataloaders(info)
        return dataloaders.tasks_by_project_loader.load(self.id)
    
    def resolve_task_count(self, info):
        """Resolve task count using annotation when available."""
        if hasattr(self, 'task_count'):
            return self.task_count
        # Fallback to DataLoader if annotation not available
        dataloaders = get_dataloaders(info)
        return dataloaders.tasks_by_project_loader.load(self.id).then(
            lambda tasks: len(tasks) if tasks else 0
        )
    
    def resolve_completed_task_count(self, info):
        """Resolve completed task count using annotation when available."""
        if hasattr(self, 'completed_task_count'):
            return self.completed_task_count
        # Fallback to DataLoader
        dataloaders = get_dataloaders(info)
        return dataloaders.tasks_by_project_loader.load(self.id).then(
            lambda tasks: len([t for t in tasks if t.status == 'DONE']) if tasks else 0
        )
    
    def resolve_completion_percentage(self, info):
        """Resolve completion percentage efficiently."""
        if hasattr(self, 'task_count') and hasattr(self, 'completed_task_count'):
            total = self.task_count or 0
            completed = self.completed_task_count or 0
            return round((completed / total * 100), 2) if total > 0 else 0
        
        # Fallback to DataLoader
        dataloaders = get_dataloaders(info)
        return dataloaders.tasks_by_project_loader.load(self.id).then(
            lambda tasks: self._calculate_completion_percentage(tasks)
        )
    
    def _calculate_completion_percentage(self, tasks):
        """Helper method to calculate completion percentage."""
        if not tasks:
            return 0
        total = len(tasks)
        completed = len([t for t in tasks if t.status == 'DONE'])
        return round((completed / total * 100), 2) if total > 0 else 0


class OptimizedTaskType(graphene.ObjectType):
    """
    Optimized Task type with efficient resolvers.
    """
    
    def resolve_comments(self, info):
        """Resolve comments using DataLoader to prevent N+1 queries."""
        dataloaders = get_dataloaders(info)
        return dataloaders.comments_by_task_loader.load(self.id)
    
    def resolve_comment_count(self, info):
        """Resolve comment count using annotation when available."""
        if hasattr(self, 'comment_count'):
            return self.comment_count
        # Fallback to DataLoader
        dataloaders = get_dataloaders(info)
        return dataloaders.comments_by_task_loader.load(self.id).then(
            lambda comments: len(comments) if comments else 0
        )
    
    def resolve_project(self, info):
        """Resolve project using DataLoader when needed."""
        if hasattr(self, '_prefetched_objects_cache') and 'project' in self._prefetched_objects_cache:
            return self.project
        
        dataloaders = get_dataloaders(info)
        return dataloaders.project_loader.load(self.project_id)


# Cache utilities for expensive operations
class CacheUtils:
    """Utilities for caching expensive GraphQL operations."""
    
    @staticmethod
    def get_or_set_cache(key, callable_func, timeout=300):
        """Get from cache or set if not exists."""
        result = cache.get(key)
        if result is None:
            result = callable_func()
            cache.set(key, result, timeout)
        return result
    
    @staticmethod
    def invalidate_project_cache(project_id, organization_slug):
        """Invalidate all caches related to a project."""
        cache_keys = [
            f"project_stats_{project_id}_{organization_slug}",
            f"project_tasks_{project_id}",
            f"org_stats_{organization_slug}",
        ]
        cache.delete_many(cache_keys)
    
    @staticmethod
    def invalidate_organization_cache(organization_slug):
        """Invalidate all caches related to an organization."""
        # This is a simplified version - in production, you might want
        # to use cache tagging for more efficient invalidation
        cache_key_pattern = f"*{organization_slug}*"
        # Note: Redis supports pattern-based deletion, but Django's default cache doesn't
        # For now, we'll just delete the main org stats cache
        cache.delete(f"org_stats_{organization_slug}")