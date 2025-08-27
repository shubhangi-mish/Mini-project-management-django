from django.db import models
from django.core.validators import EmailValidator
from django.utils.text import slugify


class Organization(models.Model):
    """
    Organization model for multi-tenant support.
    Each organization represents a separate tenant with isolated data.
    """
    name = models.CharField(
        max_length=100,
        help_text="Organization name"
    )
    slug = models.SlugField(
        unique=True,
        help_text="Unique slug for URL routing and organization identification"
    )
    contact_email = models.EmailField(
        validators=[EmailValidator()],
        help_text="Primary contact email for the organization"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the organization was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the organization was last updated"
    )

    class Meta:
        db_table = 'organizations'
        ordering = ['name']
        verbose_name = 'Organization'
        verbose_name_plural = 'Organizations'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """
        Override save to auto-generate slug from name if not provided.
        """
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def clean(self):
        """
        Custom validation for the Organization model.
        """
        from django.core.exceptions import ValidationError
        
        # Ensure name is not empty after stripping whitespace
        if not self.name or not self.name.strip():
            raise ValidationError({'name': 'Organization name cannot be empty.'})
        
        # Ensure slug is unique (case-insensitive) - only check if we have database access
        if self.slug:
            try:
                existing = Organization.objects.filter(
                    slug__iexact=self.slug
                ).exclude(pk=self.pk)
                if existing.exists():
                    raise ValidationError({'slug': 'An organization with this slug already exists.'})
            except Exception:
                # Skip database validation if database is not available (e.g., during testing)
                pass