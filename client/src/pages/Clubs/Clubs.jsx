import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Users2 } from 'lucide-react';
import { authService } from '../../services/authService';
import UserMenu from '../../components/UserMenu';
import { clubService } from '../../services/clubService';

export default function Clubs({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [feedLoading, setFeedLoading] = React.useState(false);
  const [hasMembership, setHasMembership] = React.useState(false);
  const [myMeetings, setMyMeetings] = React.useState([]);
  const [publicEvents, setPublicEvents] = React.useState([]);

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/signin', { replace: true });
  };

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setFeedLoading(true);
      try {
        const [mm, pe] = await Promise.allSettled([
          clubService.myMeetings(),
          clubService.publicEvents(),
        ]);
        if (cancelled) return;
        const membership = mm.status === 'fulfilled' ? !!mm.value?.hasMembership : false;
        const meetings = mm.status === 'fulfilled' ? (mm.value?.meetings || []) : [];
        const events = pe.status === 'fulfilled' ? (pe.value?.events || []) : [];
        setHasMembership(membership);
        setMyMeetings(Array.isArray(meetings) ? meetings : []);
        setPublicEvents(Array.isArray(events) ? events : []);
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
              <span className="font-medium text-gray-800">Back</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'club_leader' ? (
              <button
                type="button"
                onClick={() => navigate('/leader/dashboard')}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 bg-white text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Leader Dashboard
                <span aria-hidden="true">→</span>
              </button>
            ) : null}
            <UserMenu
              user={user}
              onProfile={() => navigate('/profile')}
              onLogout={logout}
              theme="light"
              idLabel="ID"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center gap-3">
            <div className="p-2 bg-pink-50 rounded-lg">
              <Users className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clubs Dashboard</h1>
              <p className="text-sm text-gray-500">Events and member updates</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hasMembership ? (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Users2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900">My Club Meetings</h2>
                        <p className="text-sm text-gray-500">Only visible to club members</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    {feedLoading ? (
                      <div className="text-gray-500">Loading…</div>
                    ) : myMeetings.length === 0 ? (
                      <div className="text-gray-500 text-sm">No meetings scheduled.</div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {myMeetings.slice(0, 6).map((m) => (
                          <li key={m.id} className="py-3">
                            <div className="font-medium text-gray-900">{m.title}</div>
                            <div className="text-xs text-gray-600">
                              {new Date(m.date).toLocaleString()} • {m.venue || 'TBD'} • {m.club?.name || 'Club'}
                            </div>
                            {m.description ? <div className="text-xs text-gray-500 mt-1">{m.description}</div> : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-50 rounded-lg">
                      <Users2 className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Campus Club Events</h2>
                      <p className="text-sm text-gray-500">Public events open to everyone</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  {feedLoading ? (
                    <div className="text-gray-500">Loading…</div>
                  ) : publicEvents.length === 0 ? (
                    <div className="text-gray-500 text-sm">No public events yet.</div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {publicEvents.slice(0, 6).map((e) => (
                        <li key={e.id} className="py-3">
                          <div className="font-medium text-gray-900">{e.name}</div>
                          <div className="text-xs text-gray-600">
                            {new Date(e.date).toLocaleString()} • {e.venue || 'TBD'} • {e.club?.name || 'Club'}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
