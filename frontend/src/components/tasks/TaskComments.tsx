import React, { useState } from 'react';
import { 
  useGetTaskCommentsQuery,
  useCreateTaskCommentMutation,
  GetTaskCommentsDocument,
  type TaskCommentType,
  type CreateTaskCommentInput 
} from '../../graphql/generated/types';
import { useOrganization } from '../../hooks/useOrganization';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface TaskCommentsProps {
  taskId: string;
  className?: string;
}

interface CommentFormProps {
  taskId: string;
  onCommentAdded: (comment: TaskCommentType) => void;
  onCancel?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ taskId, onCommentAdded, onCancel }) => {
  const { currentOrganization } = useOrganization();
  const [content, setContent] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createComment] = useCreateTaskCommentMutation({
    onCompleted: (data) => {
      if (data.createTaskComment.success && data.createTaskComment.comment) {
        onCommentAdded(data.createTaskComment.comment);
        setContent('');
        setAuthorEmail('');
      }
    },
    // Update the cache to include the new comment
    update: (cache, { data }) => {
      if (data?.createTaskComment.success && data.createTaskComment.comment) {
        const existingComments = cache.readQuery({
          query: GetTaskCommentsDocument,
          variables: {
            taskId,
            organizationSlug: currentOrganization?.slug || '',
          },
        });

        if (existingComments) {
          cache.writeQuery({
            query: GetTaskCommentsDocument,
            variables: {
              taskId,
              organizationSlug: currentOrganization?.slug || '',
            },
            data: {
              taskComments: [data.createTaskComment.comment, ...existingComments.taskComments],
            },
          });
        }
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || !authorEmail.trim() || !currentOrganization) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createComment({
        variables: {
          input: {
            taskId,
            content: content.trim(),
            authorEmail: authorEmail.trim(),
            organizationSlug: currentOrganization.slug,
          } as CreateTaskCommentInput,
        },
      });
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = content.trim().length > 0 && authorEmail.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="authorEmail" className="block text-sm font-medium text-gray-700 mb-1">
          Your Email
        </label>
        <input
          type="email"
          id="authorEmail"
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          placeholder="Enter your email address"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Comment
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add your comment..."
          rows={3}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
        />
      </div>

      <div className="flex items-center justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
          Add Comment
        </button>
      </div>
    </form>
  );
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

const formatAuthorDisplay = (email: string, displayName?: string | null): string => {
  if (displayName) {
    return displayName;
  }
  
  // Extract name from email (part before @)
  const namePart = email.split('@')[0];
  // Convert to title case and replace dots/underscores with spaces
  return namePart
    .replace(/[._]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const getAuthorInitials = (email: string, displayName?: string | null): string => {
  const name = displayName || formatAuthorDisplay(email);
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0][0].toUpperCase();
};

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, className = '' }) => {
  const { currentOrganization } = useOrganization();
  const [showCommentForm, setShowCommentForm] = useState(false);

  const { data, loading, error, refetch } = useGetTaskCommentsQuery({
    variables: {
      taskId,
      organizationSlug: currentOrganization?.slug || '',
    },
    skip: !currentOrganization?.slug,
    fetchPolicy: 'cache-and-network',
  });

  const handleCommentAdded = (comment: TaskCommentType) => {
    setShowCommentForm(false);
    // The cache update is handled in the mutation
  };

  if (!currentOrganization) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-gray-500">Please select an organization to view comments.</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage
          message="Failed to load comments. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const comments = data?.taskComments || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Comments ({comments.length})
        </h3>
        {!showCommentForm && (
          <button
            onClick={() => setShowCommentForm(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Comment
          </button>
        )}
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <CommentForm
            taskId={taskId}
            onCommentAdded={handleCommentAdded}
            onCancel={() => setShowCommentForm(false)}
          />
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Be the first to add a comment to this task.
          </p>
          {!showCommentForm && (
            <div className="mt-6">
              <button
                onClick={() => setShowCommentForm(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Comment
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                {/* Author Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {getAuthorInitials(comment.authorEmail, comment.authorDisplayName)}
                    </span>
                  </div>
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {formatAuthorDisplay(comment.authorEmail, comment.authorDisplayName)}
                    </h4>
                    <span className="text-sm text-gray-500">•</span>
                    <time 
                      className="text-sm text-gray-500"
                      dateTime={comment.createdAt}
                      title={new Date(comment.createdAt).toLocaleString()}
                    >
                      {formatTimestamp(comment.createdAt)}
                    </time>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};