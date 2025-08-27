import graphene
from graphene_django import DjangoObjectType
from core.models import Organization
from projects.models import Project
from tasks.models import Task, TaskComment


# GraphQL Types
class OrganizationType(DjangoObjectType):
    """GraphQL type for Organization model"""
    
    class Meta:
        model = Organization
        fields = ('id', 'name', 'slug', 'contact_email', 'created_at', 'updated_at')


class ProjectType(DjangoObjectType):
    """GraphQL type for Project model"""
    
    task_count = graphene.Int()
    completed_task_count = graphene.Int()
    completion_percentage = graphene.Float()
    is_overdue = graphene.Boolean()
    
    class Meta:
        model = Project
        fields = ('id', 'organization', 'name', 'description', 'status', 'due_date', 
                 'created_at', 'updated_at', 'tasks')
    
    def resolve_task_count(self, info):
        return self.task_count
    
    def resolve_completed_task_count(self, info):
        return self.completed_task_count
    
    def resolve_completion_percentage(self, info):
        return self.completion_percentage
    
    def resolve_is_overdue(self, info):
        return self.is_overdue


class TaskType(DjangoObjectType):
    """GraphQL type for Task model"""
    
    is_overdue = graphene.Boolean()
    is_assigned = graphene.Boolean()
    comment_count = graphene.Int()
    
    class Meta:
        model = Task
        fields = ('id', 'project', 'title', 'description', 'status', 'assignee_email',
                 'due_date', 'created_at', 'updated_at', 'comments')
    
    def resolve_is_overdue(self, info):
        return self.is_overdue
    
    def resolve_is_assigned(self, info):
        return self.is_assigned
    
    def resolve_comment_count(self, info):
        return self.comment_count


class TaskCommentType(DjangoObjectType):
    """GraphQL type for TaskComment model"""
    
    author_display_name = graphene.String()
    
    class Meta:
        model = TaskComment
        fields = ('id', 'task', 'content', 'author_email', 'created_at', 'updated_at')
    
    def resolve_author_display_name(self, info):
        return self.author_display_name


# Query class with organization-filtered resolvers
class Query(graphene.ObjectType):
    """GraphQL Query class with organization-filtered resolvers"""
    
    # Organization queries
    organizations = graphene.List(OrganizationType)
    organization = graphene.Field(OrganizationType, slug=graphene.String(required=True))
    
    # Project queries (organization-filtered)
    projects = graphene.List(
        ProjectType,
        organization_slug=graphene.String(required=True),
        status=graphene.String()
    )
    project = graphene.Field(
        ProjectType,
        id=graphene.ID(required=True),
        organization_slug=graphene.String(required=True)
    )
    
    # Task queries (organization-filtered)
    tasks = graphene.List(
        TaskType,
        organization_slug=graphene.String(required=True),
        project_id=graphene.ID(),
        status=graphene.String()
    )
    task = graphene.Field(
        TaskType,
        id=graphene.ID(required=True),
        organization_slug=graphene.String(required=True)
    )
    
    # Task comment queries
    task_comments = graphene.List(
        TaskCommentType,
        task_id=graphene.ID(required=True),
        organization_slug=graphene.String(required=True)
    )
    
    def resolve_organizations(self, info):
        """Resolve all organizations"""
        return Organization.objects.all()
    
    def resolve_organization(self, info, slug):
        """Resolve single organization by slug"""
        try:
            return Organization.objects.get(slug=slug)
        except Organization.DoesNotExist:
            return None
    
    def resolve_projects(self, info, organization_slug, status=None):
        """Resolve projects filtered by organization and optionally by status"""
        try:
            organization = Organization.objects.get(slug=organization_slug)
            queryset = Project.objects.filter(organization=organization)
            
            if status:
                queryset = queryset.filter(status=status)
            
            return queryset.select_related('organization').prefetch_related('tasks')
        except Organization.DoesNotExist:
            return []
    
    def resolve_project(self, info, id, organization_slug):
        """Resolve single project by ID with organization validation"""
        try:
            organization = Organization.objects.get(slug=organization_slug)
            return Project.objects.select_related('organization').prefetch_related('tasks').get(
                id=id, 
                organization=organization
            )
        except (Organization.DoesNotExist, Project.DoesNotExist):
            return None
    
    def resolve_tasks(self, info, organization_slug, project_id=None, status=None):
        """Resolve tasks filtered by organization and optionally by project and status"""
        try:
            organization = Organization.objects.get(slug=organization_slug)
            queryset = Task.objects.filter(project__organization=organization)
            
            if project_id:
                queryset = queryset.filter(project_id=project_id)
            
            if status:
                queryset = queryset.filter(status=status)
            
            return queryset.select_related('project', 'project__organization').prefetch_related('comments')
        except Organization.DoesNotExist:
            return []
    
    def resolve_task(self, info, id, organization_slug):
        """Resolve single task by ID with organization validation"""
        try:
            organization = Organization.objects.get(slug=organization_slug)
            return Task.objects.select_related('project', 'project__organization').prefetch_related('comments').get(
                id=id,
                project__organization=organization
            )
        except (Organization.DoesNotExist, Task.DoesNotExist):
            return None
    
    def resolve_task_comments(self, info, task_id, organization_slug):
        """Resolve task comments with organization validation"""
        try:
            organization = Organization.objects.get(slug=organization_slug)
            task = Task.objects.get(id=task_id, project__organization=organization)
            return TaskComment.objects.filter(task=task).select_related('task')
        except (Organization.DoesNotExist, Task.DoesNotExist):
            return []


class Mutation(graphene.ObjectType):
    """GraphQL Mutation class - placeholder for future mutations"""
    
    # Placeholder mutation to avoid empty mutation type error
    hello_mutation = graphene.String(
        name=graphene.String(default_value="World")
    )
    
    def resolve_hello_mutation(self, info, name):
        return f"Hello {name}!"


schema = graphene.Schema(query=Query, mutation=Mutation)