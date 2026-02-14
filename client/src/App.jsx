import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import StudyMaterial from './pages/StudyMaterial/StudyMaterial.jsx';
import RequestsCenter from './pages/StudyMaterial/RequestsCenter.jsx';
import ReviewsCenter from './pages/StudyMaterial/ReviewsCenter.jsx';
import ForumSupport from './pages/StudyMaterial/ForumSupport.jsx';
import Hostel from './pages/Hostel/Hostel.jsx';
import LibrarySystem from './pages/LibrarySystem/LibrarySystem.jsx';
import Clubs from './pages/Clubs/Clubs.jsx';
import AdminSignIn from './pages/admin/AdminSignIn.jsx';
import AdminModuleSignIn from './pages/admin/AdminModuleSignIn.jsx';
import HostelAdmins from './pages/admin/HostelAdmins.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import RequireModuleAuth from './components/RequireModuleAuth.jsx';
import { authService } from './services/authService';

import StudyMaterialAdminLayout from './pages/admindashboard/studyMaterial/StudyMaterialAdminLayout.jsx';
import StudyMaterialAdminDashboardPage from './pages/admindashboard/studyMaterial/DashboardPage.jsx';
import StudyMaterialAdminUploadDocumentsPage from './pages/admindashboard/studyMaterial/UploadDocumentsPage.jsx';
import StudyMaterialAdminCentralUploadPage from './pages/admindashboard/studyMaterial/CentralUploadAndMaterialsPage.jsx';
import StudyMaterialAdminModerationQueuePage from './pages/admindashboard/studyMaterial/ModerationQueuePage.jsx';
import StudyMaterialAdminDownloadsHistoryPage from './pages/admindashboard/studyMaterial/DownloadsHistoryPage.jsx';
import StudyMaterialAdminStudentUploadsPage from './pages/admindashboard/studyMaterial/StudentUploadsPage.jsx';
import RequestsManagementPage from './pages/admindashboard/studyMaterial/RequestsManagementPage.jsx';
import ReviewsManagementPage from './pages/admindashboard/studyMaterial/ReviewsManagementPage.jsx';
import ForumManagementPage from './pages/admindashboard/studyMaterial/ForumManagementPage.jsx';
import LibraryDashboard from './pages/admindashboard/LibraryM/LibraryDashboard.jsx';
import ClubAndSocietyDashboard from './pages/admindashboard/Club/ClubAndSocietyDashboard.jsx';
import HostelWardenDashboard from './pages/admindashboard/Hostel/HostelWardenDashboard.jsx';
import HostelTermsAndConditions from './pages/Hostel/TermsAndConditions.jsx';

export default function App() {
  const [theme, setTheme] = React.useState(() => {
    if (typeof window === 'undefined') return 'light';

    const stored = window.localStorage.getItem('campuscore-theme');
    if (stored === 'light' || stored === 'dark') return stored;

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const adminDashboardForModule = React.useCallback((moduleKey) => {
    const map = {
      'study-material': '/admin/study-material/dashboard',
      library: '/admin/library/dashboard',
      'club-and-society': '/admin/club-and-society/dashboard',
      'hostel-warden': '/admin/hostel/warden/dashboard',
      'hostel-laundry': '/admin/hostel/laundry/dashboard',
      'hostel-meals-shop': '/admin/hostel/meals-shop/dashboard',
    };
    return map[moduleKey] || '/admin/signin';
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    window.localStorage.setItem('campuscore-theme', theme);
  }, [theme]);

  const toggleTheme = React.useCallback(() => {
    setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'));
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!authService.hasSessionHint()) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const me = await authService.me();
        if (!cancelled) setUser(me?.user ?? null);
      } catch (e) {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="appLoadingWrap">
          <div role="status" aria-live="polite" aria-busy="true">
            <div className="appSpinner" aria-hidden="true" />
            <span className="sr-only">Loading…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/materials"
        element={
          <RequireAuth user={user}>
            <StudyMaterial
              user={user}
              onLoggedOut={() => setUser(null)}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </RequireAuth>
        }
      />
      <Route
        path="/materials/:section"
        element={
          <RequireAuth user={user}>
            <StudyMaterial
              user={user}
              onLoggedOut={() => setUser(null)}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </RequireAuth>
        }
      />
      <Route
        path="/materials/requests"
        element={
          <RequireAuth user={user}>
            <RequestsCenter
              user={user}
              onLoggedOut={() => setUser(null)}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </RequireAuth>
        }
      />
      <Route
        path="/materials/reviews"
        element={
          <RequireAuth user={user}>
            <ReviewsCenter
              user={user}
              onLoggedOut={() => setUser(null)}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </RequireAuth>
        }
      />
      <Route
        path="/materials/forum"
        element={
          <RequireAuth user={user}>
            <ForumSupport
              user={user}
              onLoggedOut={() => setUser(null)}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth user={user}>
            <Profile
              user={user}
              onUserUpdated={setUser}
              onLoggedOut={() => setUser(null)}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </RequireAuth>
        }
      />
      <Route
        path="/hostel"
        element={
          <RequireAuth user={user}>
            <Hostel
              user={user}
              onLoggedOut={() => setUser(null)}
            />
          </RequireAuth>
        }
      />
      <Route
        path="/hostel/terms"
        element={
          <RequireAuth user={user}>
            <HostelTermsAndConditions />
          </RequireAuth>
        }
      />
      <Route
        path="/library"
        element={
          <RequireAuth user={user}>
            <LibrarySystem
              user={user}
              onLoggedOut={() => setUser(null)}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </RequireAuth>
        }
      />
      <Route
        path="/clubs"
        element={
          <RequireAuth user={user}>
            <Clubs
              user={user}
              onLoggedOut={() => setUser(null)}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </RequireAuth>
        }
      />

      <Route
        path="/admin/study-material"
        element={
          <RequireModuleAuth user={user} moduleKey="study-material">
            <StudyMaterialAdminLayout user={user} onLoggedOut={() => setUser(null)} />
          </RequireModuleAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudyMaterialAdminDashboardPage />} />
        <Route path="upload-documents" element={<StudyMaterialAdminUploadDocumentsPage />} />
        <Route path="student-uploads" element={<StudyMaterialAdminStudentUploadsPage />} />
        <Route path="central-upload" element={<StudyMaterialAdminCentralUploadPage />} />
        <Route path="moderation-queue" element={<StudyMaterialAdminModerationQueuePage />} />
        <Route path="downloads-history" element={<StudyMaterialAdminDownloadsHistoryPage />} />
        <Route path="requests" element={<RequestsManagementPage />} />
        <Route path="reviews" element={<ReviewsManagementPage />} />
        <Route path="forum" element={<ForumManagementPage />} />
      </Route>
      <Route
        path="/admin/library/dashboard"
        element={
          <RequireModuleAuth user={user} moduleKey="library">
            <LibraryDashboard user={user} onLoggedOut={() => setUser(null)} />
          </RequireModuleAuth>
        }
      />
      <Route
        path="/admin/club-and-society/dashboard"
        element={
          <RequireModuleAuth user={user} moduleKey="club-and-society">
            <ClubAndSocietyDashboard user={user} onLoggedOut={() => setUser(null)} />
          </RequireModuleAuth>
        }
      />
      <Route
        path="/admin/hostel/warden/dashboard"
        element={
          <RequireModuleAuth user={user} moduleKey="hostel-warden" redirectTo="/admin/hostel">
            <HostelWardenDashboard user={user} onLoggedOut={() => setUser(null)} />
          </RequireModuleAuth>
        }
      />

      <Route path="/admin" element={<Navigate to="/admin/signin" replace />} />
      <Route path="/admin/login" element={<Navigate to="/admin/signin" replace />} />
      <Route
        path="/admin/study-material/signin"
        element={
          user ? (
            <Navigate to="/admin/signin" replace />
          ) : (
            <AdminModuleSignIn title="Study Material" moduleKey="study-material" onSignedIn={(u) => setUser(u)} />
          )
        }
      />
      <Route
        path="/admin/hostel/signin"
        element={<Navigate to="/admin/hostel" replace />}
      />
      <Route path="/admin/hostel" element={<HostelAdmins />} />
      <Route
        path="/admin/hostel/warden/signin"
        element={
          user ? (
            <Navigate to="/admin/hostel/warden/dashboard" replace />
          ) : (
            <AdminModuleSignIn title="Warden" moduleKey="hostel-warden" onSignedIn={(u) => setUser(u)} />
          )
        }
      />
      <Route
        path="/admin/hostel/laundry/signin"
        element={
          user ? (
            <Navigate to="/admin/hostel" replace />
          ) : (
            <AdminModuleSignIn title="Laundry" moduleKey="hostel-laundry" onSignedIn={(u) => setUser(u)} />
          )
        }
      />
      <Route
        path="/admin/hostel/meals-shop/signin"
        element={
          user ? (
            <Navigate to="/admin/hostel" replace />
          ) : (
            <AdminModuleSignIn title="Meals Shop" moduleKey="hostel-meals-shop" onSignedIn={(u) => setUser(u)} />
          )
        }
      />
      <Route
        path="/admin/library/signin"
        element={
          user ? (
            <Navigate to="/admin/signin" replace />
          ) : (
            <AdminModuleSignIn title="Library" moduleKey="library" onSignedIn={(u) => setUser(u)} />
          )
        }
      />
      <Route
        path="/admin/club-and-society/signin"
        element={
          user ? (
            <Navigate to="/admin/signin" replace />
          ) : (
            <AdminModuleSignIn title="Club and Society" moduleKey="club-and-society" onSignedIn={(u) => setUser(u)} />
          )
        }
      />
      <Route
        path="/admin/signin"
        element={
          user ? (
            user.module ? (
              <Navigate to={adminDashboardForModule(user.module)} replace />
            ) : (
              <Navigate to="/" replace />
            )
          ) : (
            <AdminSignIn onSignedIn={(u) => setUser(u)} />
          )
        }
      />
      <Route
        path="/signin"
        element={user ? <Navigate to="/" replace /> : <SignIn onSignedIn={(u) => setUser(u)} />}
      />
      <Route
        path="/forgot-password"
        element={user ? <Navigate to="/" replace /> : <ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={user ? <Navigate to="/" replace /> : <ResetPassword />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" replace /> : <SignUp onSignedIn={(u) => setUser(u)} />}
      />
      <Route
        path="/"
        element={
          user?.module ? (
            <Navigate to={adminDashboardForModule(user.module)} replace />
          ) : (
            <RequireAuth user={user}>
              <Home
                user={user}
                onLoggedOut={() => setUser(null)}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            </RequireAuth>
          )
        }
      />
      <Route
        path="*"
        element={
          <Navigate
            to={user ? (user.module ? adminDashboardForModule(user.module) : '/') : '/signin'}
            replace
          />
        }
      />
    </Routes>
  );
}
