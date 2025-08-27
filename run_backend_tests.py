#!/usr/bin/env python
"""
Comprehensive backend test runner for the mini project management system.
Runs all backend tests including models, GraphQL, multi-tenancy, and performance tests.
"""
import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner
from django.core.management import execute_from_command_line


def setup_django():
    """Set up Django environment for testing."""
    # Use test-specific settings for better performance
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'test_settings')
    django.setup()


def run_test_suite(test_labels=None, verbosity=2, interactive=False):
    """
    Run the complete backend test suite.
    
    Args:
        test_labels: List of specific test labels to run (optional)
        verbosity: Test output verbosity level (0-3)
        interactive: Whether to run tests interactively
    
    Returns:
        Number of test failures
    """
    setup_django()
    
    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=verbosity, interactive=interactive)
    
    if test_labels is None:
        # Default test suite - all backend tests
        test_labels = [
            'core.test_models',
            'core.test_graphql_integration', 
            'core.test_multi_tenancy',
            'core.tests',  # Existing utility tests
            'projects.tests',  # Existing project tests
            'tasks.tests',  # Existing task tests
            'core.tests_performance',  # Performance tests
        ]
    
    print("=" * 70)
    print("RUNNING COMPREHENSIVE BACKEND TEST SUITE")
    print("=" * 70)
    print(f"Test labels: {', '.join(test_labels)}")
    print(f"Verbosity: {verbosity}")
    print("=" * 70)
    
    failures = test_runner.run_tests(test_labels)
    
    print("=" * 70)
    if failures:
        print(f"TESTS COMPLETED WITH {failures} FAILURES")
    else:
        print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)
    
    return failures


def run_specific_test_category(category):
    """
    Run a specific category of tests.
    
    Args:
        category: Test category ('models', 'graphql', 'multi-tenancy', 'performance', 'all')
    
    Returns:
        Number of test failures
    """
    category_mapping = {
        'models': ['core.test_models'],
        'graphql': ['core.test_graphql_integration'],
        'multi-tenancy': ['core.test_multi_tenancy'],
        'performance': ['core.tests_performance'],
        'existing': ['core.tests', 'projects.tests', 'tasks.tests'],
        'all': None  # Will use default test suite
    }
    
    test_labels = category_mapping.get(category)
    if test_labels is None and category != 'all':
        print(f"Unknown test category: {category}")
        print(f"Available categories: {', '.join(category_mapping.keys())}")
        return 1
    
    return run_test_suite(test_labels)


def run_coverage_analysis():
    """
    Run tests with coverage analysis.
    Requires coverage.py to be installed.
    """
    try:
        import coverage
    except ImportError:
        print("Coverage analysis requires 'coverage' package to be installed.")
        print("Install with: pip install coverage")
        return 1
    
    print("Running tests with coverage analysis...")
    
    # Start coverage
    cov = coverage.Coverage()
    cov.start()
    
    try:
        # Run tests
        failures = run_test_suite(verbosity=1)
        
        # Stop coverage and save
        cov.stop()
        cov.save()
        
        print("\n" + "=" * 70)
        print("COVERAGE REPORT")
        print("=" * 70)
        
        # Generate coverage report
        cov.report(show_missing=True)
        
        # Generate HTML coverage report
        cov.html_report(directory='htmlcov')
        print("\nHTML coverage report generated in 'htmlcov' directory")
        
        return failures
        
    except Exception as e:
        cov.stop()
        print(f"Error during coverage analysis: {e}")
        return 1


def main():
    """Main entry point for the test runner."""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python run_backend_tests.py <command> [options]")
        print("")
        print("Commands:")
        print("  all                    - Run all backend tests")
        print("  models                 - Run model tests only")
        print("  graphql               - Run GraphQL integration tests only")
        print("  multi-tenancy         - Run multi-tenancy tests only")
        print("  performance           - Run performance tests only")
        print("  existing              - Run existing test suite only")
        print("  coverage              - Run all tests with coverage analysis")
        print("")
        print("Examples:")
        print("  python run_backend_tests.py all")
        print("  python run_backend_tests.py models")
        print("  python run_backend_tests.py coverage")
        return 1
    
    command = sys.argv[1]
    
    if command == 'coverage':
        return run_coverage_analysis()
    else:
        return run_specific_test_category(command)


if __name__ == '__main__':
    sys.exit(main())