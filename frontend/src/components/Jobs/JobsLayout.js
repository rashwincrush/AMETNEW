import React from 'react';
import { Outlet } from 'react-router-dom';

const JobsLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
};

export default JobsLayout;
