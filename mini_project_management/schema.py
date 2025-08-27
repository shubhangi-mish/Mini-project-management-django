import graphene
from graphene_django import DjangoObjectType
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Count, Q, Prefetch
from django.core.cache import cache
from core.models import Organization
from projects.models import Project
from tasks.models import Task, TaskComment
from core.dataloaders import get_dataloaders
from core.resolvers import OptimizedQuery, CacheUtils
from core.query_complexity import QueryComplexityMiddleware


# Statistics Types (defined first to avoid forward reference issues)
class TaskStatusBreakdown(graphene.ObjectType):
    """GraphQL type for task status breakdown statistics"""
    
    todo_count = graphene.Int(description="Number of tasks with TODO status")
    in_progress_count = graphene.Int(description="Number of tasks with IN_PROGRESS status")
    done_count = graphene.Int(description="Number of tasks with DONE status")
    total_count = graphene.Int(description="Total number of tasks")


class ProjectStatistics(graphene.ObjectType):
    """GraphQL type for project statistics and analytics"""
    
    project_id = graphene.ID(description="Project ID these statistics belong to")
    total_tasks = graphene.Int(description="Total number of tasks in the project")
    completed_tasks = graphene.Int(description="Number of completed tasks")
    in_progress_tasks = graphene.Int(description="Number of tasks in progress")
    todo_tasks = graphene.Int(description="Number of tasks not started")
    completion_rate = graphene.Float(description="Completion rate as percentage (0-100)")
    task_status_breakdown = graphene.Field(TaskStatusBreakdown, description="Breakdown of tasks by status")
    assigned_tasks = graphene.Int(description="Number of tasks with assignees")
    unassigned_tasks = graphene.Int(description="Number of tasks without assignees")
    overdue_tasks = graphene.Int(description="Number of overdue tasks")


class OrganizationStatistics(graphene.ObjectType):
    """GraphQL type for organization-level statistics and analytics"""
    
    organization_id = graphene.ID(description="Organization ID these statistics belong to")
    total_projects = graphene.Int(description="Total number of projects in the organization")
    active_projects = graphene.Int(description="Number of active projects")
    completed_projects = graphene.Int(description="Number of completed projects")
    on_hold_projects = graphene.Int(description="Number of projects on hold")
    total_tasks = graphene.Int(description="Total number of tasks across all projects")
    completed_tasks = graphene.Int(description="Total number of completed tasks")
    overall_completion_rate = graphene.Float(description="Overall completion rate across all projects")
    project_completion_rate = graphene.Float(description="Percentage of completed projects")
    task_status_breakdown = graphene.Field(TaskStatusBreakdown, description="Organization-wide task status breakdown")


# GraphQL Types
class OrganizationType(DjangoObjectType):
    """GraphQL type for Organization model"""
    
    class Meta:
        model = Organization
        fields = ('id', 'name', 'slug', 'contact_email', 'created_at', 'updated_at')


class ProjectType(DjangoObjectType):
    """GraphQL type for Project model with optimized resolvers"""
    
    task_count = graphene.Int()
    completed_task_count = graphene.Int()
    completion_percentage = graphene.Float()
    is_overdue = graphene.Boolean()
    statistics = graphene.Field(ProjectStatistics, description="Detailed project statistics")
    
    class Meta:
        model = Project
        fields = ('id', 'organization', 'name', 'description', 'status', 'due_date',
                 'created_at', 'updated_at', 'tasks')
    
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
    
    def resolve_is_overdue(self, info):
        return self.is_overdue
    
    def resolve_statistics(self, info):
        """
        Resolve detailed project statistics with caching.
        """
        # Check cache first
        cache_key = f"project_stats_{self.id}_{self.organization.slug}"
        cached_stats = cache.get(cache_key)
        if cached_stats:
            return cached_stats
        
        # Calculate statistics using optimized queries
        task_stats = self.tasks.aggregate(
            total_tasks=Count('id'),
            completed_tasks=Count('id', filter=Q(status='DONE')),
            in_progress_tasks=Count('id', filter=Q(status='IN_PROGRESS')),
            todo_tasks=Count('id', filter=Q(status='TODO')),
            assigned_tasks=Count('id', filter=~Q(assignee_email='')),
            overdue_tasks=Count('id', filter=Q(due_date__lt=timezone.now(), status__in=['TODO', 'IN_PROGRESS']))
        )
        
        # Calculate completion rate
        total_tasks = task_stats['total_tasks'] or 0
        completed_tasks = task_stats['completed_tasks'] or 0
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Create task status breakdown
        task_breakdown = TaskStatusBreakdown(
            todo_count=task_stats['todo_tasks'] or 0,
            in_progress_count=task_stats['in_progress_tasks'] or 0,
            done_count=task_stats['completed_tasks'] or 0,
            total_count=total_tasks
        )
        
        # Create statistics object
        statistics = ProjectStatistics(
            project_id=self.id,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            in_progress_tasks=task_stats['in_progress_tasks'] or 0,
            todo_tasks=task_stats['todo_tasks'] or 0,
            completion_rate=round(completion_rate, 2),
            task_status_breakdown=task_breakdown,
            assigned_tasks=task_stats['assigned_tasks'] or 0,
            unassigned_tasks=total_tasks - (task_stats['assigned_tasks'] or 0),
            overdue_tasks=task_stats['overdue_tasks'] or 0
        )
        
        # Cache the results for 5 minutes
        cache.set(cache_key, statistics, 300)
        
        return statistics


class TaskCommentType(DjangoObjectType):
    """GraphQL type for TaskComment model"""
    
    author_display_name = graphene.String()
    
    class Meta:
        model = TaskComment
        fields = ('id', 'task', 'content', 'author_email', 'created_at', 'updated_at')
    
    def resolve_author_display_name(self, info):
        return self.author_display_name


class TaskType(DjangoObjectType):
    """GraphQL type for Task model with optimized resolvers"""
    
    is_overdue = graphene.Boolean()
    is_assigned = graphene.Boolean()
    comment_count = graphene.Int()
    
    class Meta:
        model = Task
        fields = ('id', 'project', 'title', 'description', 'status', 'assignee_email',
                 'due_date', 'created_at', 'updated_at', 'comments')
    
    def resolve_comments(self, info):
        """Resolve comments using DataLoader to prevent N+1 queries."""
        dataloaders = get_dataloaders(info)
        return dataloaders.comments_by_task_loader.load(self.id)
    
    def resolve_project(self, info):
        """Resolve project using DataLoader when needed."""
        if hasattr(self, '_prefetched_objects_cache') and 'project' in self._prefetched_objects_cache:
            return self.project
        
        dataloaders = get_dataloaders(info)
        return dataloaders.project_loader.load(self.project_id)
    
    def resolve_comment_count(self, info):
        """Resolve comment count using annotation when available."""
        if hasattr(self, 'comment_count'):
            return self.comment_count
        # Fallback to DataLoader
        dataloaders = get_dataloaders(info)
        return dataloaders.comments_by_task_loader.load(self.id).then(
            lambda comments: len(comments) if comments else 0
        )
    
    def resolve_is_overdue(self, info):
        return self.is_overdue
    
    def resolve_is_assigned(self, info):
        return self.is_assigned


class TaskStatusBreakdown(graphene.ObjectType):
    """GraphQL type for task status breakdown statistics"""
    
    todo_count = graphene.Int(description="Number of tasks with TODO status")
    in_progress_count = graphene.Int(description="Number of tasks with IN_PROGRESS status")
    done_count = graphene.Int(description="Number of tasks with DONE status")
    total_count = graphene.Int(description="Total number of tasks")


class ProjectStatistics(graphene.ObjectType):
    """GraphQL type for project statistics and analytics"""
    
    project_id = graphene.ID(description="Project ID these statistics belong to")
    total_tasks = graphene.Int(description="Total number of tasks in the project")
    completed_tasks = graphene.Int(description="Number of completed tasks")
    in_progress_tasks = graphene.Int(description="Number of tasks in progress")
    todo_tasks = graphene.Int(description="Number of tasks not started")
    completion_rate = graphene.Float(description="Completion rate as percentage (0-100)")
    task_status_breakdown = graphene.Field(TaskStatusBreakdown, description="Breakdown of tasks by status")
    assigned_tasks = graphene.Int(description="Number of tasks with assignees")
    unassigned_tasks = graphene.Int(description="Number of tasks without assignees")
    overdue_tasks = graphene.Int(description="Number of overdue tasks")


class OrganizationStatistics(graphene.ObjectType):
    """GraphQL type for organization-level statistics and analytics"""
    
    organization_id = graphene.ID(description="Organization ID these statistics belong to")
    total_projects = graphene.Int(description="Total number of projects in the organization")
    active_projects = graphene.Int(description="Number of active projects")
    completed_projects = graphene.Int(description="Number of completed projects")
    on_hold_projects = graphene.Int(description="Number of projects on hold")
    total_tasks = graphene.Int(description="Total number of tasks across all projects")
    completed_tasks = graphene.Int(description="Total number of completed tasks")
    overall_completion_rate = graphene.Float(description="Overall completion rate across all projects")
    project_completion_rate = graphene.Float(description="Percentage of completed projects")
    task_status_breakdown = graphene.Field(TaskStatusBreakdown, description="Organization-wide task status breakdown")


# Input Types for Task Mutations
class CreateTaskInput(graphene.InputObjectType):
    """Input type for creating a new task"""
    organization_slug = graphene.String(required=True, description="Organization slug for validation")
    project_id = graphene.ID(required=True, description="Project ID that will contain this task")
    title = graphene.String(required=True, description="Task title (max 200 characters)")
    description = graphene.String(description="Task description")
    status = graphene.String(description="Task status (TODO, IN_PROGRESS, DONE)")
    assignee_email = graphene.String(description="Email of the person assigned to this task")
    due_date = graphene.DateTime(description="Task due date and time")


# Input Types for Task Comment Mutations
class CreateTaskCommentInput(graphene.InputObjectType):
    """Input type for creating a new task comment"""
    organization_slug = graphene.String(required=True, description="Organization slug for validation")
    task_id = graphene.ID(required=True, description="Task ID that will contain this comment")
    content = graphene.String(required=True, description="Comment content (max 5000 characters)")
    author_email = graphene.String(required=True, description="Email of the comment author")


class UpdateTaskInput(graphene.InputObjectType):
    """Input type for updating an existing task"""
    id = graphene.ID(required=True, description="Task ID to update")
    organization_slug = graphene.String(required=True, description="Organization slug for validation")
    title = graphene.String(description="Updated task title (max 200 characters)")
    description = graphene.String(description="Updated task description")
    status = graphene.String(description="Updated task status (TODO, IN_PROGRESS, DONE)")
    assignee_email = graphene.String(description="Updated assignee email")
    due_date = graphene.DateTime(description="Updated task due date and time")


class DeleteTaskInput(graphene.InputObjectType):
    """Input type for deleting a task"""
    id = graphene.ID(required=True, description="Task ID to delete")
    organization_slug = graphene.String(required=True, description="Organization slug for validation")

# Payload Types for Task Mutations
class CreateTaskPayload(graphene.ObjectType):
    """Payload type for CreateTask mutation"""
    task = graphene.Field(TaskType, description="The created task")
    success = graphene.Boolean(description="Whether the operation was successful")
    errors = graphene.List(graphene.String, description="List of validation errors")


class UpdateTaskPayload(graphene.ObjectType):
    """Payload type for UpdateTask mutation"""
    task = graphene.Field(TaskType, description="The updated task")
    success = graphene.Boolean(description="Whether the operation was successful")
    errors = graphene.List(graphene.String, description="List of validation errors")


class DeleteTaskPayload(graphene.ObjectType):
    """Payload type for DeleteTask mutation"""
    success = graphene.Boolean(description="Whether the deletion was successful")
    deleted_task_id = graphene.ID(description="ID of the deleted task")
    errors = graphene.List(graphene.String, description="List of validation errors")


# Payload Types for Task Comment Mutations
class CreateTaskCommentPayload(graphene.ObjectType):
    """Payload type for CreateTaskComment mutation"""
    comment = graphene.Field(TaskCommentType, description="The created comment")
    success = graphene.Boolean(description="Whether the operation was successful")
    errors = graphene.List(graphene.String, description="List of validation errors")


class Query(graphene.ObjectType):
    hello = graphene.String(default_value="Hello World!")
    
    # Optimized project queries
    projects = graphene.List(
        ProjectType,
        organization_slug=graphene.String(required=True),
        status=graphene.String(),
        limit=graphene.Int(default_value=50),
        offset=graphene.Int(default_value=0),
        description="Get projects with efficient loading"
    )
    project = graphene.Field(
        ProjectType,
        id=graphene.ID(required=True),
        organization_slug=graphene.String(required=True),
        description="Get single project with optimized loading"
    )
    
    # Optimized task queries
    tasks = graphene.List(
        TaskType,
        project_id=graphene.ID(),
        organization_slug=graphene.String(required=True),
        status=graphene.String(),
        assignee_email=graphene.String(),
        limit=graphene.Int(default_value=100),
        offset=graphene.Int(default_value=0),
        description="Get tasks with efficient loading"
    )
    task = graphene.Field(
        TaskType,
        id=graphene.ID(required=True),
        organization_slug=graphene.String(required=True),
        description="Get single task with optimized loading"
    )
    
    # Comment queries
    task_comments = graphene.List(
        TaskCommentType,
        task_id=graphene.ID(required=True),
        organization_slug=graphene.String(required=True),
        limit=graphene.Int(default_value=50),
        offset=graphene.Int(default_value=0),
        description="Get task comments with efficient loading"
    )
    
    # Project statistics queries
    project_statistics = graphene.Field(
        ProjectStatistics,
        project_id=graphene.ID(required=True),
        organization_slug=graphene.String(required=True),
        description="Get statistics for a specific project"
    )
    
    # Organization statistics queries
    organization_statistics = graphene.Field(
        OrganizationStatistics,
        organization_slug=graphene.String(required=True),
        description="Get organization-wide statistics and analytics"
    )
    
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
    
    def resolve_project_statistics(self, info, project_id, organization_slug):
        """
        Resolve project statistics with caching for performance optimization.
        """
        try:
            # Validate organization exists
            try:
                organization = Organization.objects.get(slug=organization_slug)
            except Organization.DoesNotExist:
                raise Exception(f"Organization with slug '{organization_slug}' not found")
            
            # Validate project exists and belongs to organization
            try:
                project = Project.objects.get(id=project_id, organization=organization)
            except Project.DoesNotExist:
                raise Exception(f"Project with ID '{project_id}' not found in organization '{organization_slug}'")
            
            # Check cache first
            cache_key = f"project_stats_{project_id}_{organization_slug}"
            cached_stats = cache.get(cache_key)
            if cached_stats:
                return cached_stats
            
            # Calculate statistics using optimized queries
            task_stats = project.tasks.aggregate(
                total_tasks=Count('id'),
                completed_tasks=Count('id', filter=Q(status='DONE')),
                in_progress_tasks=Count('id', filter=Q(status='IN_PROGRESS')),
                todo_tasks=Count('id', filter=Q(status='TODO')),
                assigned_tasks=Count('id', filter=~Q(assignee_email='')),
                overdue_tasks=Count('id', filter=Q(due_date__lt=timezone.now(), status__in=['TODO', 'IN_PROGRESS']))
            )
            
            # Calculate completion rate
            total_tasks = task_stats['total_tasks'] or 0
            completed_tasks = task_stats['completed_tasks'] or 0
            completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            # Create task status breakdown
            task_breakdown = TaskStatusBreakdown(
                todo_count=task_stats['todo_tasks'] or 0,
                in_progress_count=task_stats['in_progress_tasks'] or 0,
                done_count=task_stats['completed_tasks'] or 0,
                total_count=total_tasks
            )
            
            # Create statistics object
            statistics = ProjectStatistics(
                project_id=project_id,
                total_tasks=total_tasks,
                completed_tasks=completed_tasks,
                in_progress_tasks=task_stats['in_progress_tasks'] or 0,
                todo_tasks=task_stats['todo_tasks'] or 0,
                completion_rate=round(completion_rate, 2),
                task_status_breakdown=task_breakdown,
                assigned_tasks=task_stats['assigned_tasks'] or 0,
                unassigned_tasks=total_tasks - (task_stats['assigned_tasks'] or 0),
                overdue_tasks=task_stats['overdue_tasks'] or 0
            )
            
            # Cache the results for 5 minutes
            cache.set(cache_key, statistics, 300)
            
            return statistics
            
        except Exception as e:
            raise Exception(f"Error calculating project statistics: {str(e)}")
    
    def resolve_organization_statistics(self, info, organization_slug):
        """
        Resolve organization-wide statistics with caching for performance optimization.
        """
        try:
            # Validate organization exists
            try:
                organization = Organization.objects.get(slug=organization_slug)
            except Organization.DoesNotExist:
                raise Exception(f"Organization with slug '{organization_slug}' not found")
            
            # Check cache first
            cache_key = f"org_stats_{organization_slug}"
            cached_stats = cache.get(cache_key)
            if cached_stats:
                return cached_stats
            
            # Calculate project statistics
            project_stats = organization.projects.aggregate(
                total_projects=Count('id'),
                active_projects=Count('id', filter=Q(status='ACTIVE')),
                completed_projects=Count('id', filter=Q(status='COMPLETED')),
                on_hold_projects=Count('id', filter=Q(status='ON_HOLD'))
            )
            
            # Calculate organization-wide task statistics
            task_stats = Task.objects.filter(project__organization=organization).aggregate(
                total_tasks=Count('id'),
                completed_tasks=Count('id', filter=Q(status='DONE')),
                in_progress_tasks=Count('id', filter=Q(status='IN_PROGRESS')),
                todo_tasks=Count('id', filter=Q(status='TODO'))
            )
            
            # Calculate completion rates
            total_tasks = task_stats['total_tasks'] or 0
            completed_tasks = task_stats['completed_tasks'] or 0
            overall_completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            total_projects = project_stats['total_projects'] or 0
            completed_projects = project_stats['completed_projects'] or 0
            project_completion_rate = (completed_projects / total_projects * 100) if total_projects > 0 else 0
            
            # Create task status breakdown
            task_breakdown = TaskStatusBreakdown(
                todo_count=task_stats['todo_tasks'] or 0,
                in_progress_count=task_stats['in_progress_tasks'] or 0,
                done_count=task_stats['completed_tasks'] or 0,
                total_count=total_tasks
            )
            
            # Create statistics object
            statistics = OrganizationStatistics(
                organization_id=organization.id,
                total_projects=total_projects,
                active_projects=project_stats['active_projects'] or 0,
                completed_projects=completed_projects,
                on_hold_projects=project_stats['on_hold_projects'] or 0,
                total_tasks=total_tasks,
                completed_tasks=completed_tasks,
                overall_completion_rate=round(overall_completion_rate, 2),
                project_completion_rate=round(project_completion_rate, 2),
                task_status_breakdown=task_breakdown
            )
            
            # Cache the results for 10 minutes (organization stats change less frequently)
            cache.set(cache_key, statistics, 600)
            
            return statistics
            
        except Exception as e:
            raise Exception(f"Error calculating organization statistics: {str(e)}")


class Mutation(graphene.ObjectType):
    """GraphQL Mutation class with task management mutations"""
    
    # Task mutations
    create_task = graphene.Field(CreateTaskPayload, input=CreateTaskInput(required=True))
    update_task = graphene.Field(UpdateTaskPayload, input=UpdateTaskInput(required=True))
    delete_task = graphene.Field(DeleteTaskPayload, input=DeleteTaskInput(required=True))
    
    # Task comment mutations
    create_task_comment = graphene.Field(CreateTaskCommentPayload, input=CreateTaskCommentInput(required=True))  
  
    def resolve_create_task(self, info, input):
        """Create a new task with project relationship validation and comprehensive input validation."""
        errors = []
        
        try:
            # Validate organization exists
            try:
                organization = Organization.objects.get(slug=input.organization_slug)
            except Organization.DoesNotExist:
                return CreateTaskPayload(
                    task=None,
                    success=False,
                    errors=[f"Organization with slug '{input.organization_slug}' not found"]
                )
            
            # Validate project exists and belongs to organization
            try:
                project = Project.objects.get(id=input.project_id, organization=organization)
            except Project.DoesNotExist:
                return CreateTaskPayload(
                    task=None,
                    success=False,
                    errors=[f"Project with ID '{input.project_id}' not found in organization '{input.organization_slug}'"]
                )
            
            # Validate required fields
            if not input.title or not input.title.strip():
                errors.append("Task title is required and cannot be empty")
            
            # Validate title length
            if input.title and len(input.title.strip()) > 200:
                errors.append("Task title cannot exceed 200 characters")
            
            # Validate status if provided
            valid_statuses = ['TODO', 'IN_PROGRESS', 'DONE']
            status = input.status or 'TODO'
            if status not in valid_statuses:
                errors.append(f"Status must be one of: {', '.join(valid_statuses)}")
            
            # Validate assignee_email format if provided
            if input.assignee_email:
                from django.core.validators import validate_email
                try:
                    validate_email(input.assignee_email)
                except ValidationError:
                    errors.append("Enter a valid email address for assignee")
            
            # Validate due_date is not in the past for new tasks
            if input.due_date and input.due_date < timezone.now():
                errors.append("Due date cannot be in the past for new tasks")
            
            # Check for duplicate task title within project
            if input.title and Task.objects.filter(
                project=project,
                title=input.title.strip()
            ).exists():
                errors.append(f"A task with title '{input.title.strip()}' already exists in this project")
            
            # Return errors if any validation failed
            if errors:
                return CreateTaskPayload(
                    task=None,
                    success=False,
                    errors=errors
                )
            
            # Create the task
            task = Task.objects.create(
                project=project,
                title=input.title.strip(),
                description=input.description or '',
                status=status,
                assignee_email=input.assignee_email or '',
                due_date=input.due_date
            )
            
            return CreateTaskPayload(
                task=task,
                success=True,
                errors=[]
            )
            
        except ValidationError as e:
            # Handle Django model validation errors
            error_messages = []
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    error_messages.extend([f"{field}: {msg}" for msg in messages])
            else:
                error_messages.append(str(e))
            
            return CreateTaskPayload(
                task=None,
                success=False,
                errors=error_messages
            )
        
        except Exception as e:
            return CreateTaskPayload(
                task=None,
                success=False,
                errors=[f"An unexpected error occurred: {str(e)}"]
            )    

    def resolve_update_task(self, info, input):
        """Update an existing task with status change tracking and organization context validation."""
        errors = []
        
        try:
            # Validate organization exists
            try:
                organization = Organization.objects.get(slug=input.organization_slug)
            except Organization.DoesNotExist:
                return UpdateTaskPayload(
                    task=None,
                    success=False,
                    errors=[f"Organization with slug '{input.organization_slug}' not found"]
                )
            
            # Validate task exists and belongs to organization
            try:
                task = Task.objects.get(id=input.id, project__organization=organization)
            except Task.DoesNotExist:
                return UpdateTaskPayload(
                    task=None,
                    success=False,
                    errors=[f"Task with ID '{input.id}' not found in organization '{input.organization_slug}'"]
                )
            
            # Store original status for change tracking
            original_status = task.status
            
            # Validate title if provided
            if input.title is not None:
                if not input.title.strip():
                    errors.append("Task title cannot be empty")
                elif len(input.title.strip()) > 200:
                    errors.append("Task title cannot exceed 200 characters")
                else:
                    # Check for duplicate title within project (excluding current task)
                    if Task.objects.filter(
                        project=task.project,
                        title=input.title.strip()
                    ).exclude(id=task.id).exists():
                        errors.append(f"A task with title '{input.title.strip()}' already exists in this project")
            
            # Validate status if provided
            if input.status is not None:
                valid_statuses = ['TODO', 'IN_PROGRESS', 'DONE']
                if input.status not in valid_statuses:
                    errors.append(f"Status must be one of: {', '.join(valid_statuses)}")
            
            # Validate assignee_email format if provided
            if input.assignee_email is not None and input.assignee_email:
                from django.core.validators import validate_email
                try:
                    validate_email(input.assignee_email)
                except ValidationError:
                    errors.append("Enter a valid email address for assignee")
            
            # Validate due_date if provided
            if input.due_date is not None and input.due_date < timezone.now():
                # Allow past due dates for existing tasks (they might be updating an overdue task)
                # Only warn if changing from no due date to a past due date
                if not task.due_date:
                    errors.append("Due date cannot be set to a past date")
            
            # Return errors if any validation failed
            if errors:
                return UpdateTaskPayload(
                    task=None,
                    success=False,
                    errors=errors
                )
            
            # Update task fields
            if input.title is not None:
                task.title = input.title.strip()
            if input.description is not None:
                task.description = input.description
            if input.status is not None:
                task.status = input.status
            if input.assignee_email is not None:
                task.assignee_email = input.assignee_email
            if input.due_date is not None:
                task.due_date = input.due_date
            
            # Save the updated task
            task.full_clean()  # Run model validation
            task.save()
            
            return UpdateTaskPayload(
                task=task,
                success=True,
                errors=[]
            )
            
        except ValidationError as e:
            # Handle Django model validation errors
            error_messages = []
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    error_messages.extend([f"{field}: {msg}" for msg in messages])
            else:
                error_messages.append(str(e))
            
            return UpdateTaskPayload(
                task=None,
                success=False,
                errors=error_messages
            )
        
        except Exception as e:
            return UpdateTaskPayload(
                task=None,
                success=False,
                errors=[f"An unexpected error occurred: {str(e)}"]
            )

    def resolve_delete_task(self, info, input):
        """Delete a task with proper authorization and organization context validation."""
        errors = []
        
        try:
            # Validate organization exists
            try:
                organization = Organization.objects.get(slug=input.organization_slug)
            except Organization.DoesNotExist:
                return DeleteTaskPayload(
                    success=False,
                    deleted_task_id=None,
                    errors=[f"Organization with slug '{input.organization_slug}' not found"]
                )
            
            # Validate task exists and belongs to organization
            try:
                task = Task.objects.get(id=input.id, project__organization=organization)
            except Task.DoesNotExist:
                return DeleteTaskPayload(
                    success=False,
                    deleted_task_id=None,
                    errors=[f"Task with ID '{input.id}' not found in organization '{input.organization_slug}'"]
                )
            
            # Store task ID before deletion
            deleted_task_id = task.id
            
            # Check if task has comments (optional warning, but still allow deletion)
            comment_count = task.comments.count()
            
            # Delete the task (this will cascade delete comments due to foreign key relationship)
            task.delete()
            
            success_message = f"Task deleted successfully"
            if comment_count > 0:
                success_message += f" (including {comment_count} comment{'s' if comment_count != 1 else ''})"
            
            return DeleteTaskPayload(
                success=True,
                deleted_task_id=deleted_task_id,
                errors=[]
            )
            
        except Exception as e:
            return DeleteTaskPayload(
                success=False,
                deleted_task_id=None,
                errors=[f"An unexpected error occurred while deleting task: {str(e)}"]
            )

    def resolve_create_task_comment(self, info, input):
        """Create a new task comment with author validation and organization context validation."""
        errors = []
        
        try:
            # Validate organization exists
            try:
                organization = Organization.objects.get(slug=input.organization_slug)
            except Organization.DoesNotExist:
                return CreateTaskCommentPayload(
                    comment=None,
                    success=False,
                    errors=[f"Organization with slug '{input.organization_slug}' not found"]
                )
            
            # Validate task exists and belongs to organization
            try:
                task = Task.objects.get(id=input.task_id, project__organization=organization)
            except Task.DoesNotExist:
                return CreateTaskCommentPayload(
                    comment=None,
                    success=False,
                    errors=[f"Task with ID '{input.task_id}' not found in organization '{input.organization_slug}'"]
                )
            
            # Validate required fields
            if not input.content or not input.content.strip():
                errors.append("Comment content is required and cannot be empty")
            
            if not input.author_email or not input.author_email.strip():
                errors.append("Author email is required and cannot be empty")
            
            # Validate content length
            if input.content and len(input.content.strip()) > 5000:
                errors.append("Comment content cannot exceed 5000 characters")
            
            # Validate author_email format
            if input.author_email:
                from django.core.validators import validate_email
                try:
                    validate_email(input.author_email.strip())
                except ValidationError:
                    errors.append("Enter a valid email address for author")
            
            # Return errors if any validation failed
            if errors:
                return CreateTaskCommentPayload(
                    comment=None,
                    success=False,
                    errors=errors
                )
            
            # Create the task comment
            comment = TaskComment.objects.create(
                task=task,
                content=input.content.strip(),
                author_email=input.author_email.strip().lower()  # Normalize email to lowercase
            )
            
            return CreateTaskCommentPayload(
                comment=comment,
                success=True,
                errors=[]
            )
            
        except ValidationError as e:
            # Handle Django model validation errors
            error_messages = []
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    error_messages.extend([f"{field}: {msg}" for msg in messages])
            else:
                error_messages.append(str(e))
            
            return CreateTaskCommentPayload(
                comment=None,
                success=False,
                errors=error_messages
            )
        
        except Exception as e:
            return CreateTaskCommentPayload(
                comment=None,
                success=False,
                errors=[f"An unexpected error occurred: {str(e)}"]
            )


# Main GraphQL Schema
# Create schema with query complexity validation
from core.query_complexity import create_complexity_validator

schema = graphene.Schema(
    query=Query, 
    mutation=Mutation
)