import graphene
from graphene_django import DjangoObjectType
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Count, Q
from django.core.cache import cache
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


class TaskCommentType(DjangoObjectType):
    """GraphQL type for TaskComment model"""
    
    author_display_name = graphene.String()
    
    class Meta:
        model = TaskComment
        fields = ('id', 'task', 'content', 'author_email', 'created_at', 'updated_at')
    
    def resolve_author_display_name(self, info):
        return self.author_display_name


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
schema = graphene.Schema(query=Query, mutation=Mutation)