import React from 'react';
import { Navigate } from 'react-router-dom';

export default function RequireModuleAuth({ user, moduleKey, redirectTo = '/admin/signin', children }) {
  if (!user) return <Navigate to={redirectTo} replace />;
  if (!moduleKey) return <Navigate to={redirectTo} replace />;
  if (user.module !== moduleKey) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}
