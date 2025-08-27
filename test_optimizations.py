#!/usr/bin/env python
"""
Test script to verify GraphQL optimizations are working correctly.
"""
import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mini_project_management.settings")
    django.setup()
    
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    
    # Run performance tests
    print("Running GraphQL optimization and performance tests...")
    print("=" * 60)
    
    test_labels = [
        "core.tests_performance.ProjectQueryPerformanceTest",
        "core.tests_performance.TaskQueryPerformanceTest", 
        "core.tests_performance.QueryComplexityTest",
        "core.tests_performance.DataLoaderEfficiencyTest",
        "core.tests_performance.CachePerformanceTest"
    ]
    
    failures = test_runner.run_tests(test_labels, verbosity=2)
    
    if failures:
        print(f"\n{failures} test(s) failed!")
        sys.exit(1)
    else:
        print("\nAll optimization tests passed!")
        sys.exit(0)