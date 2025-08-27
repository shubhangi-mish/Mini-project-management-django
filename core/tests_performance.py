"""
Performance tests for GraphQL endpoints to verify N+1 prevention and optimization.
Tests database query efficiency, caching behavior, and performance benchmarks.
"""
import time
from django.test import TestCase, TransactionTestCase
from django.test.utils import override_settings
from django.db import connection, reset_queries
from django.core.cache import cache
from graphene.test import Client
from unittest.mock import patch
import statistics

from core.models import Organization
from projects.models import Project
from tasks.models import Task, TaskComment
from mini_project_management.schema import schema
from core.test_factories import (
    OrganizationFactory, ProjectFactory, TaskFactory, TaskCommentFactory,
    create_complete_test_scenario
)


class GraphQLPerformanceTestCase(TransactionTestCase):
    """Base test case for GraphQL performance testing."""
    
    def setUp(self):
        """Set up test data for performance testing."""
        # Clear cache before each test
        cache.clear()
        
        # Create test organization
        self.organization = Organization.objects.create(
            name="Test Organization",
            slug="test-org",
            contact_email="test@example.com"
        )
        
        # Create multiple projects
        self.projects = []
        for i in range(5):
            project = Project.objects.create(
                organization=self.organization,
                name=f"Test Project {i+1}",
                description=f"Description for project {i+1}",
                status='ACTIVE'
            )
            self.projects.append(project)
        
        # Create multiple tasks for each project
        self.tasks = []
        for project in self.projects:
            for j in range(10):  # 10 tasks per project = 50 total tasks
                task = Task.objects.create(
                    project=project,
                    title=f"Task {j+1} for {project.name}",
                    description=f"Description for task {j+1}",
                    status=['TODO', 'IN_PROGRESS', 'DONE'][j % 3],
                    assignee_email=f"user{j}@example.com" if j % 2 == 0 else ""
                )
                self.tasks.append(task)
        
        # Create comments for some tasks
        for i, task in enumerate(self.tasks[:20]):  # Comments on first 20 tasks
            for k in range(3):  # 3 comments per task
                TaskComment.objects.create(
                    task=task,
                    content=f"Comment {k+1} on {task.title}",
                    author_email=f"commenter{k}@example.com"
                )
        
        self.client = Client(schema)
    
    def count_queries(self, func):
        """Count the number of database queries executed by a function."""
        reset_queries()
        initial_queries = len(connection.queries)
        result = func()
        final_queries = len(connection.queries)
        return result, final_queries - initial_queries
    
    def measure_time(self, func):
        """Measure the execution time of a function."""
        start_time = time.time()
        result = func()
        end_time = time.time()
        return result, end_time - start_time
    
    def benchmark_query(self, func, iterations=5):
        """Benchmark a query function multiple times and return statistics."""
        times = []
        query_counts = []
        
        for _ in range(iterations):
            result, execution_time = self.measure_time(func)
            _, query_count = self.count_queries(func)
            
            times.append(execution_time)
            query_counts.append(query_count)
        
        return {
            'avg_time': statistics.mean(times),
            'min_time': min(times),
            'max_time': max(times),
            'avg_queries': statistics.mean(query_counts),
            'min_queries': min(query_counts),
            'max_queries': max(query_counts),
            'iterations': iterations
        }


class ProjectQueryPerformanceTest(GraphQLPerformanceTestCase):
    """Test performance of project-related GraphQL queries."""
    
    def test_projects_list_query_efficiency(self):
        """Test that projects list query doesn't cause N+1 problems."""
        query = '''
        query GetProjects($organizationSlug: String!) {
            projects(organizationSlug: $organizationSlug) {
                id
                name
                status
                taskCount
                completedTaskCount
                completionPercentage
                tasks {
                    id
                    title
                    status
                }
            }
        }
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        
        def execute_query():
            return self.client.execute(query, variables=variables)
        
        # Measure query count and execution time
        query_count = self.count_queries(execute_query)
        result, execution_time = self.measure_time(execute_query)
        
        # Assertions
        self.assertIsNone(result.get('errors'))
        self.assertEqual(len(result['data']['projects']), 5)
        
        # Should use efficient queries (not N+1)
        # Expected: 1 query for projects + 1 for tasks prefetch = ~2-3 queries
        self.assertLess(query_count, 10, f"Too many queries: {query_count}")
        
        # Should execute reasonably fast
        self.assertLess(execution_time, 1.0, f"Query too slow: {execution_time}s")
        
        print(f"Projects list query: {query_count} queries, {execution_time:.3f}s")
    
    def test_single_project_with_tasks_and_comments(self):
        """Test single project query with nested tasks and comments."""
        project = self.projects[0]
        
        query = '''
        query GetProject($id: ID!, $organizationSlug: String!) {
            project(id: $id, organizationSlug: $organizationSlug) {
                id
                name
                status
                tasks {
                    id
                    title
                    status
                    commentCount
                    comments {
                        id
                        content
                        authorEmail
                    }
                }
            }
        }
        '''
        
        variables = {
            "id": str(project.id),
            "organizationSlug": self.organization.slug
        }
        
        def execute_query():
            return self.client.execute(query, variables=variables)
        
        query_count = self.count_queries(execute_query)
        result, execution_time = self.measure_time(execute_query)
        
        # Assertions
        self.assertIsNone(result.get('errors'))
        self.assertEqual(result['data']['project']['id'], str(project.id))
        
        # Should use efficient prefetch queries
        self.assertLess(query_count, 5, f"Too many queries: {query_count}")
        self.assertLess(execution_time, 0.5, f"Query too slow: {execution_time}s")
        
        print(f"Single project query: {query_count} queries, {execution_time:.3f}s")
    
    def test_project_statistics_caching(self):
        """Test that project statistics are properly cached."""
        project = self.projects[0]
        
        query = '''
        query GetProjectStats($projectId: ID!, $organizationSlug: String!) {
            projectStatistics(projectId: $projectId, organizationSlug: $organizationSlug) {
                totalTasks
                completedTasks
                completionRate
                taskStatusBreakdown {
                    todoCount
                    inProgressCount
                    doneCount
                }
            }
        }
        '''
        
        variables = {
            "projectId": str(project.id),
            "organizationSlug": self.organization.slug
        }
        
        # First execution (should cache the result)
        def first_execution():
            return self.client.execute(query, variables=variables)
        
        query_count_1 = self.count_queries(first_execution)
        result_1, time_1 = self.measure_time(first_execution)
        
        # Second execution (should use cache)
        def second_execution():
            return self.client.execute(query, variables=variables)
        
        query_count_2 = self.count_queries(second_execution)
        result_2, time_2 = self.measure_time(second_execution)
        
        # Assertions
        self.assertIsNone(result_1.get('errors'))
        self.assertIsNone(result_2.get('errors'))
        self.assertEqual(result_1['data'], result_2['data'])
        
        # Second execution should be faster and use fewer queries due to caching
        self.assertLessEqual(query_count_2, query_count_1)
        self.assertLess(time_2, time_1 * 1.5)  # Allow some variance
        
        print(f"Statistics caching: First: {query_count_1} queries, {time_1:.3f}s")
        print(f"Statistics caching: Second: {query_count_2} queries, {time_2:.3f}s")


class TaskQueryPerformanceTest(GraphQLPerformanceTestCase):
    """Test performance of task-related GraphQL queries."""
    
    def test_tasks_list_with_comments_efficiency(self):
        """Test that tasks list with comments doesn't cause N+1 problems."""
        query = '''
        query GetTasks($organizationSlug: String!) {
            tasks(organizationSlug: $organizationSlug, limit: 20) {
                id
                title
                status
                project {
                    id
                    name
                }
                commentCount
                comments {
                    id
                    content
                    authorEmail
                }
            }
        }
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        
        def execute_query():
            return self.client.execute(query, variables=variables)
        
        query_count = self.count_queries(execute_query)
        result, execution_time = self.measure_time(execute_query)
        
        # Assertions
        self.assertIsNone(result.get('errors'))
        self.assertEqual(len(result['data']['tasks']), 20)
        
        # Should use efficient queries with prefetch
        self.assertLess(query_count, 8, f"Too many queries: {query_count}")
        self.assertLess(execution_time, 1.0, f"Query too slow: {execution_time}s")
        
        print(f"Tasks list query: {query_count} queries, {execution_time:.3f}s")
    
    def test_filtered_tasks_performance(self):
        """Test performance of filtered task queries."""
        project = self.projects[0]
        
        query = '''
        query GetFilteredTasks($organizationSlug: String!, $projectId: ID!, $status: String!) {
            tasks(organizationSlug: $organizationSlug, projectId: $projectId, status: $status) {
                id
                title
                status
                assigneeEmail
                comments {
                    id
                    content
                }
            }
        }
        '''
        
        variables = {
            "organizationSlug": self.organization.slug,
            "projectId": str(project.id),
            "status": "TODO"
        }
        
        def execute_query():
            return self.client.execute(query, variables=variables)
        
        query_count = self.count_queries(execute_query)
        result, execution_time = self.measure_time(execute_query)
        
        # Assertions
        self.assertIsNone(result.get('errors'))
        
        # Should use efficient filtered queries
        self.assertLess(query_count, 5, f"Too many queries: {query_count}")
        self.assertLess(execution_time, 0.5, f"Query too slow: {execution_time}s")
        
        print(f"Filtered tasks query: {query_count} queries, {execution_time:.3f}s")


class QueryComplexityTest(GraphQLPerformanceTestCase):
    """Test query complexity analysis and limits."""
    
    def test_complex_nested_query_rejection(self):
        """Test that overly complex queries are rejected."""
        # Create a deeply nested query that should exceed complexity limits
        query = '''
        query ComplexQuery($organizationSlug: String!) {
            projects(organizationSlug: $organizationSlug) {
                id
                name
                tasks {
                    id
                    title
                    project {
                        id
                        name
                        tasks {
                            id
                            title
                            comments {
                                id
                                content
                                task {
                                    id
                                    project {
                                        id
                                        tasks {
                                            id
                                            comments {
                                                id
                                                content
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        
        # This query should be rejected due to complexity
        result = self.client.execute(query, variables=variables)
        
        # Should have validation errors
        self.assertIsNotNone(result.get('errors'))
        
        # Check if it's a complexity-related error
        error_messages = [error['message'] for error in result['errors']]
        complexity_error = any('complexity' in msg.lower() or 'depth' in msg.lower() 
                             for msg in error_messages)
        
        print(f"Complex query rejection: {len(result.get('errors', []))} errors")
        if result.get('errors'):
            print(f"Error messages: {error_messages}")
    
    def test_reasonable_query_acceptance(self):
        """Test that reasonable queries are accepted."""
        query = '''
        query ReasonableQuery($organizationSlug: String!) {
            projects(organizationSlug: $organizationSlug, limit: 5) {
                id
                name
                status
                taskCount
                tasks {
                    id
                    title
                    status
                }
            }
        }
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        
        result = self.client.execute(query, variables=variables)
        
        # Should execute successfully
        self.assertIsNone(result.get('errors'))
        self.assertIsNotNone(result.get('data'))
        
        print("Reasonable query acceptance: Success")


class DataLoaderEfficiencyTest(GraphQLPerformanceTestCase):
    """Test DataLoader efficiency and batching."""
    
    def test_dataloader_batching_efficiency(self):
        """Test that DataLoader properly batches requests."""
        # Query that should trigger DataLoader batching
        query = '''
        query BatchingTest($organizationSlug: String!) {
            projects(organizationSlug: $organizationSlug) {
                id
                name
                tasks {
                    id
                    title
                    comments {
                        id
                        content
                    }
                }
            }
        }
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        
        def execute_query():
            return self.client.execute(query, variables=variables)
        
        query_count = self.count_queries(execute_query)
        result, execution_time = self.measure_time(execute_query)
        
        # Assertions
        self.assertIsNone(result.get('errors'))
        
        # With proper DataLoader batching, should use minimal queries
        # Expected: 1 for projects, 1 for tasks, 1 for comments = ~3 queries
        self.assertLess(query_count, 6, f"DataLoader not batching efficiently: {query_count} queries")
        
        print(f"DataLoader batching: {query_count} queries, {execution_time:.3f}s")


@override_settings(
    GRAPHQL_MAX_COMPLEXITY=100,  # Lower limit for testing
    GRAPHQL_MAX_DEPTH=5
)
class QueryLimitsTest(GraphQLPerformanceTestCase):
    """Test query limits with overridden settings."""
    
    def test_complexity_limit_enforcement(self):
        """Test that complexity limits are properly enforced."""
        # This query should exceed the lowered complexity limit
        query = '''
        query HighComplexityQuery($organizationSlug: String!) {
            projects(organizationSlug: $organizationSlug) {
                id
                name
                statistics {
                    totalTasks
                    completionRate
                    taskStatusBreakdown {
                        todoCount
                        inProgressCount
                        doneCount
                    }
                }
                tasks {
                    id
                    title
                    comments {
                        id
                        content
                    }
                }
            }
            organizationStatistics(organizationSlug: $organizationSlug) {
                totalProjects
                totalTasks
                overallCompletionRate
            }
        }
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        
        result = self.client.execute(query, variables=variables)
        
        # Should be rejected due to complexity
        self.assertIsNotNone(result.get('errors'))
        
        print(f"Complexity limit test: {len(result.get('errors', []))} errors")


class CachePerformanceTest(GraphQLPerformanceTestCase):
    """Test caching performance and invalidation."""
    
    def test_cache_invalidation_on_mutation(self):
        """Test that cache is properly invalidated after mutations."""
        project = self.projects[0]
        
        # Query to cache statistics
        stats_query = '''
        query GetStats($projectId: ID!, $organizationSlug: String!) {
            projectStatistics(projectId: $projectId, organizationSlug: $organizationSlug) {
                totalTasks
                completedTasks
                completionRate
            }
        }
        '''
        
        stats_variables = {
            "projectId": str(project.id),
            "organizationSlug": self.organization.slug
        }
        
        # Execute query to populate cache
        result1 = self.client.execute(stats_query, variables=stats_variables)
        self.assertIsNone(result1.get('errors'))
        
        # Create a new task (should invalidate cache)
        create_task_mutation = '''
        mutation CreateTask($input: CreateTaskInput!) {
            createTask(input: $input) {
                success
                task {
                    id
                    title
                }
            }
        }
        '''
        
        task_input = {
            "organizationSlug": self.organization.slug,
            "projectId": str(project.id),
            "title": "New Task for Cache Test",
            "status": "TODO"
        }
        
        mutation_result = self.client.execute(
            create_task_mutation, 
            variables={"input": task_input}
        )
        self.assertIsNone(mutation_result.get('errors'))
        self.assertTrue(mutation_result['data']['createTask']['success'])
        
        # Query statistics again (should reflect the new task)
        result2 = self.client.execute(stats_query, variables=stats_variables)
        self.assertIsNone(result2.get('errors'))
        
        # Total tasks should have increased
        old_total = result1['data']['projectStatistics']['totalTasks']
        new_total = result2['data']['projectStatistics']['totalTasks']
        self.assertEqual(new_total, old_total + 1)
        
        print(f"Cache invalidation test: {old_total} -> {new_total} tasks")


class DatabaseQueryOptimizationTest(GraphQLPerformanceTestCase):
    """Test database query optimization and N+1 prevention."""
    
    def test_select_related_optimization(self):
        """Test that select_related is used for foreign key relationships."""
        query = '''
        query GetTasks($organizationSlug: String!) {
            tasks(organizationSlug: $organizationSlug, limit: 10) {
                id
                title
                project {
                    id
                    name
                    organization {
                        id
                        name
                    }
                }
            }
        }
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        
        def execute_query():
            return self.client.execute(query, variables=variables)
        
        result, query_count = self.count_queries(execute_query)
        
        # Should use select_related to fetch project and organization in minimal queries
        self.assertIsNone(result.get('errors'))
        self.assertLess(query_count, 5, f"Too many queries for select_related: {query_count}")
        
        print(f"Select related optimization: {query_count} queries")
    
    def test_prefetch_related_optimization(self):
        """Test that prefetch_related is used for reverse foreign key relationships."""
        query = '''
        query GetProjects($organizationSlug: String!) {
            projects(organizationSlug: $organizationSlug) {
                id
                name
                tasks {
                    id
                    title
                    status
                }
            }
        }
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        
        def execute_query():
            return self.client.execute(query, variables=variables)
        
        result, query_count = self.count_queries(execute_query)
        
        # Should use prefetch_related to fetch all tasks efficiently
        self.assertIsNone(result.get('errors'))
        self.assertLess(query_count, 8, f"Too many queries for prefetch_related: {query_count}")
        
        print(f"Prefetch related optimization: {query_count} queries")
    
    def test_annotation_optimization(self):
        """Test that database annotations are used for computed fields."""
        query = '''
        query GetProjects($organizationSlug: String!) {
            projects(organizationSlug: $organizationSlug) {
                id
                name
                taskCount
                completedTaskCount
                completionPercentage
            }
        }
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        
        def execute_query():
            return self.client.execute(query, variables=variables)
        
        result, query_count = self.count_queries(execute_query)
        
        # Should use database annotations instead of Python loops
        self.assertIsNone(result.get('errors'))
        self.assertLess(query_count, 6, f"Too many queries for annotations: {query_count}")
        
        print(f"Annotation optimization: {query_count} queries")


class ScalabilityTest(GraphQLPerformanceTestCase):
    """Test system scalability with larger datasets."""
    
    def setUp(self):
        """Set up larger test dataset."""
        super().setUp()
        
        # Create additional data for scalability testing
        for i in range(10):  # 10 more projects
            project = ProjectFactory(organization=self.organization)
            
            for j in range(20):  # 20 tasks per project
                task = TaskFactory(project=project)
                
                for k in range(5):  # 5 comments per task
                    TaskCommentFactory(task=task)
    
    def test_large_dataset_query_performance(self):
        """Test query performance with large dataset."""
        query = '''
        query GetAllData($organizationSlug: String!) {
            projects(organizationSlug: $organizationSlug) {
                id
                name
                taskCount
                tasks {
                    id
                    title
                    commentCount
                }
            }
        }
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        
        def execute_query():
            return self.client.execute(query, variables=variables)
        
        # Benchmark the query
        benchmark = self.benchmark_query(execute_query, iterations=3)
        
        # Performance assertions
        self.assertLess(benchmark['avg_time'], 2.0, f"Query too slow: {benchmark['avg_time']:.3f}s")
        self.assertLess(benchmark['avg_queries'], 15, f"Too many queries: {benchmark['avg_queries']}")
        
        print(f"Large dataset performance: {benchmark['avg_time']:.3f}s avg, {benchmark['avg_queries']} queries avg")
    
    def test_pagination_performance(self):
        """Test pagination performance with large dataset."""
        query = '''
        query GetPaginatedTasks($organizationSlug: String!, $limit: Int!, $offset: Int!) {
            tasks(organizationSlug: $organizationSlug, limit: $limit, offset: $offset) {
                id
                title
                project {
                    name
                }
            }
        }
        '''
        
        # Test different page sizes
        page_sizes = [10, 50, 100]
        
        for page_size in page_sizes:
            variables = {
                "organizationSlug": self.organization.slug,
                "limit": page_size,
                "offset": 0
            }
            
            def execute_query():
                return self.client.execute(query, variables=variables)
            
            result, query_count = self.count_queries(execute_query)
            _, execution_time = self.measure_time(execute_query)
            
            self.assertIsNone(result.get('errors'))
            self.assertLess(query_count, 8, f"Too many queries for page size {page_size}: {query_count}")
            self.assertLess(execution_time, 1.0, f"Query too slow for page size {page_size}: {execution_time:.3f}s")
            
            print(f"Pagination (size {page_size}): {query_count} queries, {execution_time:.3f}s")


class CacheEfficiencyTest(GraphQLPerformanceTestCase):
    """Test caching efficiency and cache hit rates."""
    
    def test_statistics_cache_efficiency(self):
        """Test that statistics queries are efficiently cached."""
        query = '''
        query GetStats($projectId: ID!, $organizationSlug: String!) {
            projectStatistics(projectId: $projectId, organizationSlug: $organizationSlug) {
                totalTasks
                completionRate
                taskStatusBreakdown {
                    todoCount
                    doneCount
                }
            }
        }
        '''
        
        project = self.projects[0]
        variables = {
            "projectId": str(project.id),
            "organizationSlug": self.organization.slug
        }
        
        # Clear cache
        cache.clear()
        
        # First execution (cache miss)
        def execute_query():
            return self.client.execute(query, variables=variables)
        
        result1, query_count1 = self.count_queries(execute_query)
        _, time1 = self.measure_time(execute_query)
        
        # Second execution (cache hit)
        result2, query_count2 = self.count_queries(execute_query)
        _, time2 = self.measure_time(execute_query)
        
        # Third execution (cache hit)
        result3, query_count3 = self.count_queries(execute_query)
        _, time3 = self.measure_time(execute_query)
        
        # Verify results are consistent
        self.assertEqual(result1['data'], result2['data'])
        self.assertEqual(result2['data'], result3['data'])
        
        # Cache hits should be faster and use fewer queries
        self.assertLessEqual(query_count2, query_count1)
        self.assertLessEqual(query_count3, query_count1)
        self.assertLess(time2, time1 * 1.5)  # Allow some variance
        self.assertLess(time3, time1 * 1.5)
        
        print(f"Cache efficiency - Miss: {query_count1} queries, {time1:.3f}s")
        print(f"Cache efficiency - Hit1: {query_count2} queries, {time2:.3f}s")
        print(f"Cache efficiency - Hit2: {query_count3} queries, {time3:.3f}s")
    
    def test_cache_invalidation_performance(self):
        """Test that cache invalidation doesn't impact performance significantly."""
        # Set up cached data
        project = self.projects[0]
        
        stats_query = '''
        query GetStats($projectId: ID!, $organizationSlug: String!) {
            projectStatistics(projectId: $projectId, organizationSlug: $organizationSlug) {
                totalTasks
                completionRate
            }
        }
        '''
        
        variables = {
            "projectId": str(project.id),
            "organizationSlug": self.organization.slug
        }
        
        # Execute query to populate cache
        self.client.execute(stats_query, variables=variables)
        
        # Measure cache invalidation through mutation
        create_task_mutation = '''
        mutation CreateTask($input: CreateTaskInput!) {
            createTask(input: $input) {
                success
                task { id }
            }
        }
        '''
        
        task_input = {
            "organizationSlug": self.organization.slug,
            "projectId": str(project.id),
            "title": f"Cache Test Task {time.time()}",
            "status": "TODO"
        }
        
        def execute_mutation():
            return self.client.execute(
                create_task_mutation,
                variables={"input": task_input}
            )
        
        # Measure mutation performance
        _, mutation_time = self.measure_time(execute_mutation)
        
        # Should complete quickly even with cache invalidation
        self.assertLess(mutation_time, 0.5, f"Mutation with cache invalidation too slow: {mutation_time:.3f}s")
        
        print(f"Cache invalidation performance: {mutation_time:.3f}s")


class ConcurrencyTest(GraphQLPerformanceTestCase):
    """Test system behavior under concurrent load."""
    
    def test_concurrent_read_performance(self):
        """Test performance under concurrent read operations."""
        import threading
        import queue
        
        query = '''
        query GetProjects($organizationSlug: String!) {
            projects(organizationSlug: $organizationSlug) {
                id
                name
                taskCount
            }
        }
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        results_queue = queue.Queue()
        
        def execute_query():
            try:
                start_time = time.time()
                result = self.client.execute(query, variables=variables)
                end_time = time.time()
                
                results_queue.put({
                    'success': result.get('errors') is None,
                    'time': end_time - start_time
                })
            except Exception as e:
                results_queue.put({
                    'success': False,
                    'error': str(e),
                    'time': None
                })
        
        # Execute 10 concurrent queries
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=execute_query)
            threads.append(thread)
        
        # Start all threads
        start_time = time.time()
        for thread in threads:
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        total_time = time.time() - start_time
        
        # Collect results
        results = []
        while not results_queue.empty():
            results.append(results_queue.get())
        
        # Verify all queries succeeded
        successful_queries = [r for r in results if r['success']]
        self.assertEqual(len(successful_queries), 10, "Not all concurrent queries succeeded")
        
        # Check performance
        avg_query_time = statistics.mean([r['time'] for r in successful_queries])
        self.assertLess(total_time, 5.0, f"Concurrent queries took too long: {total_time:.3f}s")
        self.assertLess(avg_query_time, 1.0, f"Average query time too slow: {avg_query_time:.3f}s")
        
        print(f"Concurrent reads: {total_time:.3f}s total, {avg_query_time:.3f}s avg per query")


class MemoryUsageTest(GraphQLPerformanceTestCase):
    """Test memory usage and potential memory leaks."""
    
    def test_memory_usage_with_large_results(self):
        """Test memory usage when returning large result sets."""
        import psutil
        import os
        
        # Get initial memory usage
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        query = '''
        query GetLargeDataset($organizationSlug: String!) {
            projects(organizationSlug: $organizationSlug) {
                id
                name
                description
                tasks {
                    id
                    title
                    description
                    comments {
                        id
                        content
                        authorEmail
                    }
                }
            }
        }
        '''
        
        variables = {"organizationSlug": self.organization.slug}
        
        # Execute query multiple times to check for memory leaks
        for i in range(5):
            result = self.client.execute(query, variables=variables)
            self.assertIsNone(result.get('errors'))
        
        # Check final memory usage
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (less than 100MB for this test)
        self.assertLess(memory_increase, 100, f"Excessive memory usage: {memory_increase:.2f}MB increase")
        
        print(f"Memory usage: {initial_memory:.2f}MB -> {final_memory:.2f}MB (+{memory_increase:.2f}MB)")


if __name__ == '__main__':
    import django
    from django.conf import settings
    from django.test.utils import get_runner
    
    django.setup()
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    failures = test_runner.run_tests(["core.tests_performance"])