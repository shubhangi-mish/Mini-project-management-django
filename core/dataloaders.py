"""
DataLoader implementations for efficient batch loading and N+1 query prevention.
"""
from collections import defaultdict
from promise import Promise
from promise.dataloader import DataLoader
from django.db.models import Prefetch
from core.models import Organization
from projects.models import Project
from tasks.models import Task, TaskComment


class OrganizationDataLoader(DataLoader):
    """DataLoader for Organization model."""
    
    def batch_load_fn(self, organization_ids):
        """Batch load organizations by IDs."""
        organizations = Organization.objects.filter(id__in=organization_ids)
        organization_map = {org.id: org for org in organizations}
        return Promise.resolve([
            organization_map.get(org_id) for org_id in organization_ids
        ])


class ProjectDataLoader(DataLoader):
    """DataLoader for Project model with optimized queries."""
    
    def batch_load_fn(self, project_ids):
        """Batch load projects by IDs with related data."""
        projects = Project.objects.select_related('organization').filter(
            id__in=project_ids
        )
        project_map = {project.id: project for project in projects}
        return Promise.resolve([
            project_map.get(project_id) for project_id in project_ids
        ])


class ProjectsByOrganizationDataLoader(DataLoader):
    """DataLoader for projects grouped by organization."""
    
    def batch_load_fn(self, organization_ids):
        """Batch load projects grouped by organization IDs."""
        projects = Project.objects.select_related('organization').filter(
            organization_id__in=organization_ids
        ).prefetch_related(
            Prefetch(
                'tasks',
                queryset=Task.objects.select_related('project').prefetch_related('comments')
            )
        )
        
        # Group projects by organization
        projects_by_org = defaultdict(list)
        for project in projects:
            projects_by_org[project.organization_id].append(project)
        
        return Promise.resolve([
            projects_by_org.get(org_id, []) for org_id in organization_ids
        ])


class TaskDataLoader(DataLoader):
    """DataLoader for Task model with optimized queries."""
    
    def batch_load_fn(self, task_ids):
        """Batch load tasks by IDs with related data."""
        tasks = Task.objects.select_related(
            'project', 'project__organization'
        ).prefetch_related('comments').filter(
            id__in=task_ids
        )
        task_map = {task.id: task for task in tasks}
        return Promise.resolve([
            task_map.get(task_id) for task_id in task_ids
        ])


class TasksByProjectDataLoader(DataLoader):
    """DataLoader for tasks grouped by project."""
    
    def batch_load_fn(self, project_ids):
        """Batch load tasks grouped by project IDs."""
        tasks = Task.objects.select_related(
            'project', 'project__organization'
        ).prefetch_related('comments').filter(
            project_id__in=project_ids
        )
        
        # Group tasks by project
        tasks_by_project = defaultdict(list)
        for task in tasks:
            tasks_by_project[task.project_id].append(task)
        
        return Promise.resolve([
            tasks_by_project.get(project_id, []) for project_id in project_ids
        ])


class TaskCommentDataLoader(DataLoader):
    """DataLoader for TaskComment model with optimized queries."""
    
    def batch_load_fn(self, comment_ids):
        """Batch load task comments by IDs with related data."""
        comments = TaskComment.objects.select_related(
            'task', 'task__project', 'task__project__organization'
        ).filter(id__in=comment_ids)
        comment_map = {comment.id: comment for comment in comments}
        return Promise.resolve([
            comment_map.get(comment_id) for comment_id in comment_ids
        ])


class CommentsByTaskDataLoader(DataLoader):
    """DataLoader for comments grouped by task."""
    
    def batch_load_fn(self, task_ids):
        """Batch load comments grouped by task IDs."""
        comments = TaskComment.objects.select_related(
            'task', 'task__project', 'task__project__organization'
        ).filter(task_id__in=task_ids).order_by('created_at')
        
        # Group comments by task
        comments_by_task = defaultdict(list)
        for comment in comments:
            comments_by_task[comment.task_id].append(comment)
        
        return Promise.resolve([
            comments_by_task.get(task_id, []) for task_id in task_ids
        ])


class DataLoaderContext:
    """Context class to hold all DataLoader instances for a GraphQL request."""
    
    def __init__(self):
        self.organization_loader = OrganizationDataLoader()
        self.project_loader = ProjectDataLoader()
        self.projects_by_organization_loader = ProjectsByOrganizationDataLoader()
        self.task_loader = TaskDataLoader()
        self.tasks_by_project_loader = TasksByProjectDataLoader()
        self.comment_loader = TaskCommentDataLoader()
        self.comments_by_task_loader = CommentsByTaskDataLoader()
    
    def clear_all(self):
        """Clear all DataLoader caches."""
        self.organization_loader.clear_all()
        self.project_loader.clear_all()
        self.projects_by_organization_loader.clear_all()
        self.task_loader.clear_all()
        self.tasks_by_project_loader.clear_all()
        self.comment_loader.clear_all()
        self.comments_by_task_loader.clear_all()


def get_dataloaders(info):
    """Get or create DataLoader context for the current GraphQL request."""
    if not hasattr(info.context, 'dataloaders'):
        info.context.dataloaders = DataLoaderContext()
    return info.context.dataloaders