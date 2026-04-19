import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import AdminLibraryShell, { AdminShellNavLinks } from '../../../components/admin/AdminLibraryShell';
import {
  LayoutDashboard,
  BookOpen,
  Monitor,
  DoorOpen,
  CalendarCheck,
} from 'lucide-react';

const navItems = [
  {
    to: '/admin/library/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'Overview & stats',
  },
  {
    to: '/admin/library/books',
    icon: BookOpen,
    label: 'Books',
    description: 'Manage books',
  },
  {
    to: '/admin/library/digital-resources',
    icon: Monitor,
    label: 'Digital Resources',
    description: 'Manage resources',
  },
  {
    to: '/admin/library/study-rooms',
    icon: DoorOpen,
    label: 'Study Rooms',
    description: 'Manage rooms',
  },
  {
    to: '/admin/library/reservations',
    icon: CalendarCheck,
    label: 'Reservations',
    description: 'View all bookings',
  },
];

export default function LibraryAdminLayout({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/signin', { replace: true });
  };

  return (
    <AdminLibraryShell
      user={user}
      productSubtitle="Library Admin"
      headerTitle="Library Management"
      headerSubtitle="Manage books, rooms & resources"
      roleLabel="Librarian"
      onLogout={logout}
      onProfile={() => navigate('/profile')}
      sidebarNav={({ collapsed }) => <AdminShellNavLinks items={navItems} collapsed={collapsed} />}
    >
      <Outlet />
    </AdminLibraryShell>
  );
}
