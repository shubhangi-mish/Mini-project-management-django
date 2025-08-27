"""
Test-specific Django settings for comprehensive backend testing.
Optimizes settings for test performance and reliability.
"""
from mini_project_management.settings import *

# Test database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',  # Use in-memory database for faster tests
        'OPTIONS': {
            'timeout': 20,
        }
    }
}

# Disable migrations for faster test setup
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Test-specific settings
DEBUG = False
TESTING = True

# Disable logging during tests to reduce noise
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'root': {
        'handlers': ['null'],
    },
}

# Cache configuration for testing
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'test-cache',
    }
}

# Password hashers - use faster hasher for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Email backend for testing
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# GraphQL test settings
GRAPHQL_MAX_COMPLEXITY = 1000  # Higher limit for testing
GRAPHQL_MAX_DEPTH = 10
GRAPHQL_ENABLE_INTROSPECTION = True

# Test-specific middleware (remove any production-only middleware)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'core.middleware.OrganizationContextMiddleware',
]

# Static files (not needed for tests)
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Security settings (relaxed for testing)
SECRET_KEY = 'test-secret-key-not-for-production'
ALLOWED_HOSTS = ['*']

# Test runner configuration
TEST_RUNNER = 'django.test.runner.DiscoverRunner'

# Factory Boy settings
FACTORY_FOR_DJANGO_MODELS = True