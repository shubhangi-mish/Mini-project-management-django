from django.db import models
from django.core.exceptions import ValidationError
from core.models import Organization
from core.managers import ProjectManager


class Project(models.Model):
    """
    Project model representing a project within an organization.
    Projects contain tasks and are isolated by organization.
    """
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('ON_HOLD', 'On Hold'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='projects',
        help_text="Organization that owns this project"
    )
    name = models.CharField(
        max_length=200,
        help_text="Project name"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed description of the project"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE',
        help_text="Current status of the project"
    )
    due_date = models.DateField(
        null=True,
        blank=True,
        help_text="Project due date"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the project was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the project was last updated"
    )

    # Custom manager
    objects = ProjectManager()

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
        # Ensure project names are unique within an organization
        unique_together = ['organization', 'name']

    def __str__(self):
        return f"{self.organization.name} - {self.name}"

    def clean(self):
        """
        Custom validation for the Project model.
        """
        # Ensure name is not empty after stripping whitespace
        if not self.name or not self.name.strip():
            raise ValidationError({'name': 'Project name cannot be empty.'})
        
        # Validate status choice
        valid_statuses = [choice[0] for choice in self.STATUS_CHOICES]
        if self.status not in valid_statuses:
            raise ValidationError({'status': f'Status must be one of: {", ".join(valid_statuses)}'})
        
        # Validate due_date is not in the past for new projects
        if self.due_date:
            from django.utils import timezone
            if not self.pk and self.due_date < timezone.now().date():
                raise ValidationError({'due_date': 'Due date cannot be in the past for new projects.'})

    @property
    def is_overdue(self):
        """
        Check if the project is overdue.
        """
        if not self.due_date:
            return False
        
        from django.utils import timezone
        return self.due_date < timezone.now().date() and self.status != 'COMPLETED'

    @property
    def task_count(self):
        """
        Get the total number of tasks in this project.
        """
        return self.tasks.count()

    @property
    def completed_task_count(self):
        """
        Get the number of completed tasks in this project.
        """
        return self.tasks.filter(status='DONE').count()

    @property
    def completion_percentage(self):
        """
        Calculate the completion percentage of the project based on tasks.
        """
        total_tasks = self.task_count
        if total_tasks == 0:
            return 0
        return round((self.completed_task_count / total_tasks) * 100, 2)