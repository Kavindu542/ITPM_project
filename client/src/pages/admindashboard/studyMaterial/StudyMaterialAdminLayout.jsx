import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  MessageSquare,
  MessagesSquare,
  Download,
  FileUp,
  Layers,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';

import AdminLibraryShell, { AdminShellNavLinks } from '../../../components/admin/AdminLibraryShell';
import { authService } from '../../../services/authService';

const navItems = [
  { to: '/admin/study-material/dashboard', end: true, label: 'Dashboard', icon: BarChart3, description: 'Analytics overview' },
  { to: '/admin/study-material/upload-documents', label: 'Upload documents', icon: FileUp, description: 'Add study materials' },
  { to: '/admin/study-material/student-uploads', label: 'Student uploads', icon: Users, description: 'Review submissions' },
  { to: '/admin/study-material/central-upload', label: 'Central upload & materials', icon: Layers, description: 'Bulk & catalog' },
  { to: '/admin/study-material/moderation-queue', label: 'Moderation Queue', icon: ShieldCheck, description: 'Pending review' },
  { to: '/admin/study-material/downloads-history', label: 'Downloads history', icon: Download, description: 'Usage log' },
  { to: '/admin/study-material/requests', label: 'Request management', icon: MessageSquare, description: 'Student requests' },
  { to: '/admin/study-material/reviews', label: 'Review management', icon: Star, description: 'Ratings & feedback' },
  { to: '/admin/study-material/forum', label: 'Forum management', icon: MessagesSquare, description: 'Discussions' },
];

export default function StudyMaterialAdminLayout({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/signin', { replace: true });
  };

  return (
    <AdminLibraryShell
      user={user}
      productSubtitle="Study Material Admin"
      headerTitle="Study Material"
      headerSubtitle="Admin"
      roleLabel="Study material admin"
      onLogout={logout}
      onProfile={() => navigate('/profile')}
      sidebarNav={({ collapsed }) => <AdminShellNavLinks items={navItems} collapsed={collapsed} />}
    >
      <Outlet />
    </AdminLibraryShell>
  );
}
