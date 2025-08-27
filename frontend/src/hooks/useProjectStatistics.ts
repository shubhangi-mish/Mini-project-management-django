import { useGetProjectStatisticsQuery } from '../graphql/generated/types';
import { getRequiredOrganizationSlug } from '../utils/organizationContext';

/**
 * Hook for fetching project statistics with organization context
 */
export const useProjectStatistics = (projectId: string, options?: {
  pollInterval?: number;
  skip?: boolean;
}) => {
  const organizationSlug = getRequiredOrganizationSlug();
  
  const { data, loading, error, refetch } = useGetProjectStatisticsQuery({
    variables: {
      projectId,
      organizationSlug,
    },
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    pollInterval: options?.pollInterval || 30000, // Default 30 seconds for real-time updates
    skip: options?.skip || !projectId,
  });

  return {
    statistics: data?.projectStatistics,
    loading,
    error,
    refetch,
  };
};

export default useProjectStatistics;