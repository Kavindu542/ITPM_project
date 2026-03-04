import React from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

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
import LibraryBooks from './pages/LibrarySystem/LibraryBooks.jsx';
import SearchBooks from './pages/LibrarySystem/SearchBooks.jsx';
import StudyRooms from './pages/LibrarySystem/StudyRooms.jsx';
import Clubs from './pages/Clubs/Clubs.jsx';
import LeaderDashboard from './pages/Leader/LeaderDashboard.jsx';
import AdminSignIn from './pages/admin/AdminSignIn.jsx';
import AdminModuleSignIn from './pages/admin/AdminModuleSignIn.jsx';
import HostelAdmins from './pages/admin/HostelAdmins.jsx';
import HostelTermsAndConditions from './pages/Hostel/TermsAndConditions.jsx';
import AboutUs from './pages/AboutUs.jsx';
import ContactUs from './pages/ContactUs.jsx';
import FAQ from './pages/FAQ.jsx';
import UserLayout from './components/UserLayout.jsx';

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
import LibraryAdminLayout from './pages/admindashboard/LibraryM/LibraryAdminLayout.jsx';
import ClubAndSocietyDashboard from './pages/admindashboard/Club/ClubAndSocietyDashboard.jsx';
import HostelWardenDashboard from './pages/admindashboard/Hostel/warden/HostelWardenDashboard.jsx';
import HostelMealsShopDashboard from './pages/admindashboard/Hostel/mealsShop/HostelMealsShopDashboard.jsx';
import BookManagement from './pages/admindashboard/LibraryM/BookManagement.jsx';
import StudyRoomManagement from './pages/admindashboard/LibraryM/StudyRoomManagement.jsx';
import DigitalResourcesManagement from './pages/admindashboard/LibraryM/DigitalResourcesManagement.jsx';
import ReservationManagement from './pages/admindashboard/LibraryM/ReservationManagement.jsx';

import { authService } from './services/authService';

// ============================================================================
// INLINE COMPONENTS - No separate files needed
// ============================================================================

// RequireAuth Component
function RequireAuth({ user, children }) {
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}

// RequireModuleAuth Component
function RequireModuleAuth({ user, moduleKey, redirectTo = '/admin/signin', children }) {
  if (!user || user.module !== moduleKey) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

// UserMenu Component
function UserMenu({ user, onLoggedOut }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
        <p className="text-xs text-gray-500">ID: {user?.studentId}</p>
      </div>
      <img
        src={user?.avatar || 'https://via.placeholder.com/40'}
        alt={user?.name}
        className="w-10 h-10 rounded-full border-2 border-gray-200"
      />
      <button
        onClick={onLoggedOut}
        className="p-2 hover:bg-gray-100 rounded-lg transition"
        title="Logout"
      >
        <LogOut size={18} className="text-gray-600" />
      </button>
    </div>
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [postLogoutRedirect, setPostLogoutRedirect] = React.useState(null);
  const navigate = useNavigate();

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

    const withTimeout = (promise, ms = 6000) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), ms)),
      ]);

    const load = async () => {
      if (!authService.hasSessionHint()) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const me = await withTimeout(authService.me(), 6000);
        if (!cancelled) setUser(me?.user ?? null);
      } catch (_e) {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const requestLogout = React.useCallback(
    async (redirectTo = '/admin/signin') => {
      setPostLogoutRedirect(redirectTo);
      try {
        await authService.logout();
      } catch {
        // Ignore logout API errors; still clear local app state.
      } finally {
        setUser(null);
      }
    },
    []
  );

  React.useEffect(() => {
    if (!postLogoutRedirect) return;
    if (user) return;
    navigate(postLogoutRedirect, { replace: true });
    setPostLogoutRedirect(null);
  }, [navigate, postLogoutRedirect, user]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'sans-serif' }}>
        <div>Loading application...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        element={<UserLayout user={user} onLoggedOut={requestLogout} />}
      >
        {/* Home Route */}
        <Route
          path="/"
          element={
            user?.module ? (
              <Navigate to={adminDashboardForModule(user.module)} replace />
            ) : (
              <RequireAuth user={user}>
                <Home user={user} onLoggedOut={requestLogout} />
              </RequireAuth>
            )
          }
        />

        {/* Materials Routes */}
        <Route
          path="/materials"
          element={
            <RequireAuth user={user}>
              <StudyMaterial user={user} onLoggedOut={requestLogout} />
            </RequireAuth>
          }
        />
        <Route
          path="/materials/:section"
          element={
            <RequireAuth user={user}>
              <StudyMaterial user={user} onLoggedOut={requestLogout} />
            </RequireAuth>
          }
        />
        <Route
          path="/materials/requests"
          element={
            <RequireAuth user={user}>
              <RequestsCenter user={user} onLoggedOut={requestLogout} />
            </RequireAuth>
          }
        />
        <Route
          path="/materials/reviews"
          element={
            <RequireAuth user={user}>
              <ReviewsCenter user={user} onLoggedOut={requestLogout} />
            </RequireAuth>
          }
        />
        <Route
          path="/materials/forum"
          element={
            <RequireAuth user={user}>
              <ForumSupport user={user} onLoggedOut={requestLogout} />
            </RequireAuth>
          }
        />

        {/* Profile Route */}
        <Route
          path="/profile"
          element={
            <RequireAuth user={user}>
              <Profile user={user} onUserUpdated={setUser} onLoggedOut={requestLogout} />
            </RequireAuth>
          }
        />

        {/* Hostel Routes */}
        <Route
          path="/hostel"
          element={
            <RequireAuth user={user}>
              <Hostel user={user} onLoggedOut={requestLogout} />
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

        {/* LIBRARY ROUTES */}
        <Route
          path="/library"
          element={
            <RequireAuth user={user}>
              <LibrarySystem user={user} onLoggedOut={requestLogout} />
            </RequireAuth>
          }
        />
        <Route
          path="/library/books"
          element={
            <RequireAuth user={user}>
              <LibraryBooks user={user} onLoggedOut={requestLogout} />
            </RequireAuth>
          }
        />
        <Route
          path="/library/search"
          element={
            <RequireAuth user={user}>
              <SearchBooks user={user} onLoggedOut={requestLogout} />
            </RequireAuth>
          }
        />
        <Route
          path="/library/study-rooms"
          element={
            <RequireAuth user={user}>
              <StudyRooms user={user} onLoggedOut={requestLogout} />
            </RequireAuth>
          }
        />

        {/* Clubs Route */}
        <Route
          path="/clubs"
          element={
            <RequireAuth user={user}>
              <Clubs user={user} onLoggedOut={requestLogout} />
            </RequireAuth>
          }
        />

        {/* Leader Dashboard */}
        <Route
          path="/leader/dashboard"
          element={
            <RequireAuth user={user}>
              {user?.role === 'club_leader' ? (
                <LeaderDashboard user={user} onLoggedOut={requestLogout} />
              ) : (
                <Navigate to="/" replace />
              )}
            </RequireAuth>
          }
        />

        {/* New Pages */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/faq" element={<FAQ />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin/study-material"
        element={
          <RequireModuleAuth user={user} moduleKey="study-material">
            <StudyMaterialAdminLayout user={user} onLoggedOut={requestLogout} />
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
        path="/admin/library"
        element={
          <RequireModuleAuth user={user} moduleKey="library">
            <LibraryAdminLayout user={user} onLoggedOut={requestLogout} />
          </RequireModuleAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<LibraryDashboard user={user} />} />
        <Route path="books" element={<BookManagement />} />
        <Route path="study-rooms" element={<StudyRoomManagement />} />
        <Route path="digital-resources" element={<DigitalResourcesManagement />} />
        <Route path="reservations" element={<ReservationManagement />} />
      </Route>

      <Route
        path="/admin/club-and-society/dashboard"
        element={
          <RequireModuleAuth user={user} moduleKey="club-and-society">
            <ClubAndSocietyDashboard user={user} onLoggedOut={requestLogout} />
          </RequireModuleAuth>
        }
      />

      <Route
        path="/admin/hostel/warden/dashboard"
        element={
          <RequireModuleAuth user={user} moduleKey="hostel-warden" redirectTo="/admin/hostel">
            <HostelWardenDashboard user={user} onLoggedOut={requestLogout} />
          </RequireModuleAuth>
        }
      />

      <Route
        path="/admin/hostel/meals-shop/dashboard"
        element={
          <RequireModuleAuth user={user} moduleKey="hostel-meals-shop" redirectTo="/admin/hostel">
            <HostelMealsShopDashboard user={user} onLoggedOut={requestLogout} />
          </RequireModuleAuth>
        }
      />

      {/* Admin SignIn Routes */}
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
          user?.module === 'hostel-meals-shop' ? (
            <Navigate to="/admin/hostel/meals-shop/dashboard" replace />
          ) : (
            <AdminModuleSignIn
              title="Meals Shop"
              moduleKey="hostel-meals-shop"
              onSignedIn={(u) => setUser(u)}
              initialEmail={user?.email}
            />
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

      {/* Auth Routes */}
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


      {/* Catch All */}
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