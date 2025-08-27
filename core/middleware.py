"""
Multi-tenancy middleware for organization context extraction and validation.
"""
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.core.exceptions import ObjectDoesNotExist
from core.models import Organization

logger = logging.getLogger(__name__)


class OrganizationContextMiddleware(MiddlewareMixin):
    """
    Middleware to extract and validate organization context from requests.
    
    This middleware:
    1. Extracts organization slug from request headers or URL parameters
    2. Validates organization existence and access
    3. Injects organization context into the request object
    4. Provides organization-scoped access control
    """
    
    # Header name for organization context
    ORGANIZATION_HEADER = 'HTTP_X_ORGANIZATION_SLUG'
    
    # URL parameter name for organization context
    ORGANIZATION_PARAM = 'organization_slug'
    
    # Paths that don't require organization context
    EXEMPT_PATHS = [
        '/admin/',
        '/graphql/',  # GraphQL will handle organization context internally
        '/static/',
        '/media/',
        '/health/',
    ]
    
    def process_request(self, request):
        """
        Process incoming request to extract and validate organization context.
        """
        # Skip organization context for exempt paths
        if self._is_exempt_path(request.path):
            request.organization = None
            return None
        
        # Extract organization slug from request
        organization_slug = self._extract_organization_slug(request)
        
        if not organization_slug:
            # For GraphQL and API endpoints, organization context is optional
            # It will be validated at the resolver level
            request.organization = None
            return None
        
        # Validate and set organization context
        try:
            organization = self._get_organization(organization_slug)
            request.organization = organization
            
            # Log organization context for debugging
            logger.debug(f"Organization context set: {organization.slug}")
            
        except ObjectDoesNotExist:
            logger.warning(f"Invalid organization slug: {organization_slug}")
            return JsonResponse({
                'error': 'Invalid organization',
                'message': f'Organization "{organization_slug}" not found'
            }, status=404)
        except Exception as e:
            logger.error(f"Error setting organization context: {str(e)}")
            return JsonResponse({
                'error': 'Organization context error',
                'message': 'Unable to validate organization context'
            }, status=500)
        
        return None
    
    def _is_exempt_path(self, path):
        """
        Check if the request path is exempt from organization context requirements.
        """
        return any(path.startswith(exempt_path) for exempt_path in self.EXEMPT_PATHS)
    
    def _extract_organization_slug(self, request):
        """
        Extract organization slug from request headers or parameters.
        
        Priority order:
        1. HTTP header (X-Organization-Slug)
        2. URL parameter (organization_slug)
        3. POST/PUT body parameter (organization_slug)
        """
        # Try header first
        organization_slug = request.META.get(self.ORGANIZATION_HEADER)
        if organization_slug:
            return organization_slug.strip()
        
        # Try URL parameter
        organization_slug = request.GET.get(self.ORGANIZATION_PARAM)
        if organization_slug:
            return organization_slug.strip()
        
        # Try POST/PUT body parameter
        if hasattr(request, 'POST') and request.POST:
            organization_slug = request.POST.get(self.ORGANIZATION_PARAM)
            if organization_slug:
                return organization_slug.strip()
        
        return None
    
    def _get_organization(self, organization_slug):
        """
        Retrieve organization by slug with caching.
        """
        try:
            # Use select_related for potential future user relationships
            organization = Organization.objects.select_related().get(
                slug=organization_slug
            )
            return organization
        except Organization.DoesNotExist:
            raise ObjectDoesNotExist(f"Organization with slug '{organization_slug}' does not exist")


class OrganizationAccessControlMixin:
    """
    Mixin to provide organization-based access control for views and resolvers.
    """
    
    def get_organization_from_request(self, request):
        """
        Get organization from request context.
        """
        return getattr(request, 'organization', None)
    
    def require_organization_context(self, request):
        """
        Ensure organization context is present in the request.
        Raises ValueError if organization context is missing.
        """
        organization = self.get_organization_from_request(request)
        if not organization:
            raise ValueError("Organization context is required for this operation")
        return organization
    
    def validate_organization_access(self, request, organization_slug):
        """
        Validate that the request has access to the specified organization.
        """
        current_org = self.get_organization_from_request(request)
        
        if not current_org:
            raise ValueError("No organization context in request")
        
        if current_org.slug != organization_slug:
            raise ValueError(f"Access denied to organization '{organization_slug}'")
        
        return current_org


def get_current_organization():
    """
    Utility function to get current organization from thread-local storage.
    This is useful for model managers and other contexts where request is not available.
    """
    import threading
    return getattr(threading.current_thread(), 'organization', None)


def set_current_organization(organization):
    """
    Utility function to set current organization in thread-local storage.
    """
    import threading
    threading.current_thread().organization = organization


class ThreadLocalOrganizationMiddleware(MiddlewareMixin):
    """
    Middleware to store organization context in thread-local storage.
    This allows model managers to access organization context without passing it explicitly.
    """
    
    def process_request(self, request):
        """
        Store organization context in thread-local storage.
        """
        organization = getattr(request, 'organization', None)
        set_current_organization(organization)
        return None
    
    def process_response(self, request, response):
        """
        Clean up thread-local storage after request processing.
        """
        set_current_organization(None)
        return response
    
    def process_exception(self, request, exception):
        """
        Clean up thread-local storage in case of exceptions.
        """
        set_current_organization(None)
        return None