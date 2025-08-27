from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator
from projects.models import Project
from core.managers import TaskManager, TaskCommentManager


class Task(models.Model):
    """
    Task model representing individual tasks within a project.
    Tasks can be assigned to team members and have status tracking.
    """
    
    TASK_STATUS_CHOICES = [
        ('TODO', 'To Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('DONE', 'Done'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks',
        help_text="Project that contains this task"
    )
    title = models.CharField(
        max_length=200,
        help_text="Task title"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed description of the task"
    )
    status = models.CharField(
        max_length=20,
        choices=TASK_STATUS_CHOICES,
        default='TODO',
        help_text="Current status of the task"
    )
    assignee_email = models.EmailField(
        blank=True,
        validators=[EmailValidator()],
        help_text="Email of the person assigned to this task"
    )
    due_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Task due date and time"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the task was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the task was last updated"
    )

    # Custom manager
    objects = TaskManager()

    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        # Ensure task titles are unique within a project
        unique_together = ['project', 'title']

    def __str__(self):
        return f"{self.project.name} - {self.title}"

    def clean(self):
        """
        Custom validation for the Task model.
        """
        # Ensure title is not empty after stripping whitespace
        if not self.title or not self.title.strip():
            raise ValidationError({'title': 'Task title cannot be empty.'})
        
        # Validate status choice
        valid_statuses = [choice[0] for choice in self.TASK_STATUS_CHOICES]
        if self.status not in valid_statuses:
            raise ValidationError({'status': f'Status must be one of: {", ".join(valid_statuses)}'})
        
        # Validate assignee_email format if provided
        if self.assignee_email:
            from django.core.validators import validate_email
            try:
                validate_email(self.assignee_email)
            except ValidationError:
                raise ValidationError({'assignee_email': 'Enter a valid email address.'})

    @property
    def is_overdue(self):
        """
        Check if the task is overdue.
        """
        if not self.due_date:
            return False
        
        from django.utils import timezone
        return self.due_date < timezone.now() and self.status != 'DONE'

    @property
    def is_assigned(self):
        """
        Check if the task is assigned to someone.
        """
        return bool(self.assignee_email)

    @property
    def comment_count(self):
        """
        Get the number of comments on this task.
        """
        return self.comments.count()


class TaskComment(models.Model):
    """
    TaskComment model for tracking comments and discussions on tasks.
    Comments provide collaboration and communication features.
    """
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments',
        help_text="Task this comment belongs to"
    )
    content = models.TextField(
        help_text="Comment content"
    )
    author_email = models.EmailField(
        validators=[EmailValidator()],
        help_text="Email of the comment author"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the comment was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the comment was last updated"
    )

    # Custom manager
    objects = TaskCommentManager()

    class Meta:
        db_table = 'task_comments'
        ordering = ['created_at']
        verbose_name = 'Task Comment'
        verbose_name_plural = 'Task Comments'

    def __str__(self):
        return f"Comment by {self.author_email} on {self.task.title}"

    def clean(self):
        """
        Custom validation for the TaskComment model.
        """
        # Ensure content is not empty after stripping whitespace
        if not self.content or not self.content.strip():
            raise ValidationError({'content': 'Comment content cannot be empty.'})
        
        # Validate author_email format
        from django.core.validators import validate_email
        try:
            validate_email(self.author_email)
        except ValidationError:
            raise ValidationError({'author_email': 'Enter a valid email address.'})
        
        # Ensure content is not too long (reasonable limit)
        if len(self.content) > 5000:
            raise ValidationError({'content': 'Comment content cannot exceed 5000 characters.'})

    @property
    def author_display_name(self):
        """
        Get a display-friendly version of the author email.
        """
        return self.author_email.split('@')[0].replace('.', ' ').title()