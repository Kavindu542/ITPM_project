import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import StudyMaterial from './pages/StudyMaterial/StudyMaterial.jsx';
import Hostel from './pages/Hostel/Hostel.jsx';
import LibrarySystem from './pages/LibrarySystem/LibrarySystem.jsx';
import Clubs from './pages/Clubs/Clubs.jsx';
import AdminSignIn from './pages/admin/AdminSignIn.jsx';
import AdminModuleSignIn from './pages/admin/AdminModuleSignIn.jsx';
import HostelAdmins from './pages/admin/HostelAdmins.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import RequireModuleAuth from './components/RequireModuleAuth.jsx';
import { authService } from './services/authService';

import StudyMaterialDashboard from './pages/admindashboard/StudyMaterialDashboard.jsx';
import LibraryDashboard from './pages/admindashboard/LibraryDashboard.jsx';
import ClubAndSocietyDashboard from './pages/admindashboard/ClubAndSocietyDashboard.jsx';
import HostelWardenDashboard from './pages/admindashboard/HostelWardenDashboard.jsx';

export default function App() {
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
        <div className="card">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/materials"
        element={
          <RequireAuth user={user}>
            <StudyMaterial user={user} onLoggedOut={() => setUser(null)} />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth user={user}>
            <Profile user={user} onUserUpdated={setUser} onLoggedOut={() => setUser(null)} />
          </RequireAuth>
        }
      />
      <Route
        path="/hostel"
        element={
          <RequireAuth user={user}>
            <Hostel user={user} onLoggedOut={() => setUser(null)} />
          </RequireAuth>
        }
      />
      <Route
        path="/library"
        element={
          <RequireAuth user={user}>
            <LibrarySystem user={user} onLoggedOut={() => setUser(null)} />
          </RequireAuth>
        }
      />
      <Route
        path="/clubs"
        element={
          <RequireAuth user={user}>
            <Clubs user={user} onLoggedOut={() => setUser(null)} />
          </RequireAuth>
        }
      />

      <Route
        path="/admin/study-material/dashboard"
        element={
          <RequireModuleAuth user={user} moduleKey="study-material">
            <StudyMaterialDashboard user={user} onLoggedOut={() => setUser(null)} />
          </RequireModuleAuth>
        }
      />
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
            <Navigate to="/admin/hostel" replace />
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
              <Home user={user} onLoggedOut={() => setUser(null)} />
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
