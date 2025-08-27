"""
GraphQL query complexity analysis and limits to prevent expensive operations.
"""
from graphql import FieldNode, FragmentSpreadNode, InlineFragmentNode
from graphql.execution import ExecutionContext
from graphql.validation import ValidationRule
from graphql.error import GraphQLError
from django.conf import settings


class QueryComplexityAnalyzer:
    """
    Analyzes GraphQL query complexity to prevent expensive operations.
    """
    
    def __init__(self, max_complexity=None, max_depth=None):
        self.max_complexity = max_complexity or getattr(settings, 'GRAPHQL_MAX_COMPLEXITY', 1000)
        self.max_depth = max_depth or getattr(settings, 'GRAPHQL_MAX_DEPTH', 10)
    
    def calculate_complexity(self, query_ast, variables=None):
        """Calculate the complexity score of a GraphQL query."""
        variables = variables or {}
        complexity = 0
        depth = 0
        
        for definition in query_ast.definitions:
            if hasattr(definition, 'selection_set'):
                field_complexity, field_depth = self._analyze_selection_set(
                    definition.selection_set, variables, 0
                )
                complexity += field_complexity
                depth = max(depth, field_depth)
        
        return complexity, depth
    
    def _analyze_selection_set(self, selection_set, variables, current_depth):
        """Analyze a selection set and calculate complexity."""
        complexity = 0
        max_depth = current_depth
        
        for selection in selection_set.selections:
            if isinstance(selection, FieldNode):
                field_complexity, field_depth = self._analyze_field(
                    selection, variables, current_depth + 1
                )
                complexity += field_complexity
                max_depth = max(max_depth, field_depth)
            elif isinstance(selection, (FragmentSpreadNode, InlineFragmentNode)):
                # Handle fragments (simplified for now)
                if hasattr(selection, 'selection_set'):
                    fragment_complexity, fragment_depth = self._analyze_selection_set(
                        selection.selection_set, variables, current_depth
                    )
                    complexity += fragment_complexity
                    max_depth = max(max_depth, fragment_depth)
        
        return complexity, max_depth
    
    def _analyze_field(self, field_node, variables, current_depth):
        """Analyze a single field and calculate its complexity."""
        field_name = field_node.name.value
        complexity = self._get_field_complexity(field_name)
        max_depth = current_depth
        
        # Apply multipliers for list fields with arguments
        if field_node.arguments:
            multiplier = self._calculate_argument_multiplier(field_node.arguments, variables)
            complexity *= multiplier
        
        # Recursively analyze nested fields
        if field_node.selection_set:
            nested_complexity, nested_depth = self._analyze_selection_set(
                field_node.selection_set, variables, current_depth
            )
            complexity += nested_complexity
            max_depth = max(max_depth, nested_depth)
        
        return complexity, max_depth
    
    def _get_field_complexity(self, field_name):
        """Get the base complexity score for a field."""
        # Define complexity scores for different field types
        complexity_map = {
            # Simple scalar fields
            'id': 1,
            'name': 1,
            'title': 1,
            'description': 1,
            'status': 1,
            'email': 1,
            'createdAt': 1,
            'updatedAt': 1,
            'dueDate': 1,
            
            # Relationship fields (more expensive)
            'organization': 2,
            'project': 2,
            'task': 2,
            'projects': 5,
            'tasks': 5,
            'comments': 3,
            
            # Computed fields (expensive)
            'statistics': 10,
            'taskCount': 5,
            'completedTaskCount': 5,
            'completionPercentage': 5,
            'isOverdue': 3,
            'isAssigned': 2,
            'commentCount': 3,
            
            # Analytics fields (very expensive)
            'projectStatistics': 15,
            'organizationStatistics': 20,
            'taskStatusBreakdown': 10,
        }
        
        return complexity_map.get(field_name, 2)  # Default complexity
    
    def _calculate_argument_multiplier(self, arguments, variables):
        """Calculate complexity multiplier based on field arguments."""
        multiplier = 1
        
        for argument in arguments:
            arg_name = argument.name.value
            
            # Handle pagination arguments
            if arg_name in ['first', 'last', 'limit']:
                # Get the actual value from variables or literal
                value = self._get_argument_value(argument, variables)
                if isinstance(value, int):
                    multiplier *= min(value, 100) / 10  # Cap at 100, normalize
            
            # Handle filtering arguments (slightly increase complexity)
            elif arg_name in ['filter', 'where', 'organizationSlug']:
                multiplier *= 1.2
        
        return max(multiplier, 1)  # Ensure multiplier is at least 1
    
    def _get_argument_value(self, argument, variables):
        """Extract the actual value of an argument."""
        if hasattr(argument.value, 'value'):
            return argument.value.value
        elif hasattr(argument.value, 'name') and argument.value.name.value in variables:
            return variables[argument.value.name.value]
        return None


class QueryComplexityValidationRule(ValidationRule):
    """
    GraphQL validation rule to enforce query complexity limits.
    """
    
    def __init__(self, max_complexity=None, max_depth=None):
        super().__init__()
        self.analyzer = QueryComplexityAnalyzer(max_complexity, max_depth)
    
    def enter_document(self, node, *args):
        """Validate query complexity when entering the document."""
        try:
            complexity, depth = self.analyzer.calculate_complexity(node)
            
            if complexity > self.analyzer.max_complexity:
                self.report_error(
                    GraphQLError(
                        f"Query complexity {complexity} exceeds maximum allowed complexity "
                        f"of {self.analyzer.max_complexity}. Please simplify your query.",
                        nodes=[node]
                    )
                )
            
            if depth > self.analyzer.max_depth:
                self.report_error(
                    GraphQLError(
                        f"Query depth {depth} exceeds maximum allowed depth "
                        f"of {self.analyzer.max_depth}. Please reduce nesting.",
                        nodes=[node]
                    )
                )
        
        except Exception as e:
            # Log the error but don't fail the query for complexity analysis errors
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Query complexity analysis failed: {e}")


def create_complexity_validator(max_complexity=None, max_depth=None):
    """Create a query complexity validation rule."""
    return QueryComplexityValidationRule(max_complexity, max_depth)


# Middleware to add complexity analysis to GraphQL execution
class QueryComplexityMiddleware:
    """
    Middleware to analyze and log query complexity.
    """
    
    def __init__(self):
        self.analyzer = QueryComplexityAnalyzer()
    
    def resolve(self, next, root, info, **args):
        """Middleware resolver that logs query complexity."""
        # Only analyze on the root level to avoid multiple calculations
        if not hasattr(info.context, '_complexity_analyzed'):
            try:
                query_ast = info.operation
                complexity, depth = self.analyzer.calculate_complexity(query_ast)
                
                # Log complexity for monitoring
                import logging
                logger = logging.getLogger('graphql.complexity')
                logger.info(f"Query complexity: {complexity}, depth: {depth}")
                
                # Store in context to avoid re-analysis
                info.context._complexity_analyzed = True
                info.context._query_complexity = complexity
                info.context._query_depth = depth
                
            except Exception as e:
                # Don't fail the query if complexity analysis fails
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Query complexity analysis failed: {e}")
        
        return next(root, info, **args)