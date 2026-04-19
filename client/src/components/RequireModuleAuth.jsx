import React from 'react';
import { Navigate } from 'react-router-dom';

export default function RequireModuleAuth({ user, moduleKey, children }) {
  if (!user) return <Navigate to="/signin" replace />;
  if (!moduleKey) return <Navigate to="/" replace />;
  if (user.module !== moduleKey) return <Navigate to="/" replace />;
  return <>{children}</>;
}
