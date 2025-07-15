import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GroupsList from '../components/Groups/GroupsList';
import CreateGroup from '../components/Groups/CreateGroup';
import GroupDetail from '../components/Groups/GroupDetail';

const GroupsPage = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<GroupsList />} />
      <Route
        path="new"
        element={
          user ? (
            <CreateGroup />
          ) : (
            <Navigate to="/login" replace state={{ from: window.location.pathname }} />
          )
        }
      />
      <Route
        path=":id"
        element={
          user ? (
            <GroupDetail />
          ) : (
            <Navigate to="/login" replace state={{ from: window.location.pathname }} />
          )
        }
      />
    </Routes>
  );
};

export default GroupsPage;
