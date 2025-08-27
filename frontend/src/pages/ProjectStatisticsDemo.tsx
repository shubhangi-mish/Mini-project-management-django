import React from 'react';
import { Layout } from '../components/layout/Layout';
import { ProjectStatisticsDemo } from '../components/projects/ProjectStatisticsDemo';

export const ProjectStatisticsDemoPage: React.FC = () => {
  return (
    <Layout title="Project Statistics Demo">
      <ProjectStatisticsDemo />
    </Layout>
  );
};

export default ProjectStatisticsDemoPage;