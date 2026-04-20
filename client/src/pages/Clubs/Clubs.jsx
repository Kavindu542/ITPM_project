import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, FileText, Home, Users, Users2 } from 'lucide-react';
import { clubService } from '../../services/clubService';

export default function Clubs({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const currentUserId = user?.id || user?._id;
  const roleNorm = String(user?.role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_');
  const canApply = roleNorm === 'student' || roleNorm === 'club_leader';
  const isClubLeader = roleNorm === 'club_leader';
  const [feedLoading, setFeedLoading] = React.useState(false);
  const [hasMembership, setHasMembership] = React.useState(false);
  const [myMeetings, setMyMeetings] = React.useState([]);
  const [publicEvents, setPublicEvents] = React.useState([]);

  const [clubs, setClubs] = React.useState([]);
  const [showApply, setShowApply] = React.useState(false);
  const [applyClub, setApplyClub] = React.useState(null);
  const [applyBusy, setApplyBusy] = React.useState(false);
  const [applyError, setApplyError] = React.useState('');
  const [applySuccess, setApplySuccess] = React.useState('');
  const [applyForm, setApplyForm] = React.useState({
    // School details
    university: 'SLIIT',
    faculty: '',
    department: '',
    studentId: user?.studentId || '',
    semester: String(user?.semester ?? ''),
    year: '',
    // Personal details
    fullName: user?.name || '',
    dob: '',
    phone: '',
    address: '',
    // Contact
    email: user?.email || '',
    alternateEmail: '',
    // Other
    languages: '',
    educationQualifications: '',
    sportsQualifications: '',
    notes: '',
  });

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setFeedLoading(true);
      try {
        const [mm, pe, cl] = await Promise.allSettled([
          clubService.myMeetings(),
          clubService.publicEvents(),
          clubService.listClubs(),
        ]);
        if (cancelled) return;
        const membership = mm.status === 'fulfilled' ? !!mm.value?.hasMembership : false;
        const meetings = mm.status === 'fulfilled' ? (mm.value?.meetings || []) : [];
        const events = pe.status === 'fulfilled' ? (pe.value?.events || []) : [];
        const clubItems = cl.status === 'fulfilled' ? (cl.value?.items || []) : [];
        setHasMembership(membership);
        setMyMeetings(Array.isArray(meetings) ? meetings : []);
        setPublicEvents(Array.isArray(events) ? events : []);
        setClubs(Array.isArray(clubItems) ? clubItems : []);
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!hasMembership && activeTab === 'meetings') {
      setActiveTab('dashboard');
    }
  }, [activeTab, hasMembership]);

  const openApply = (club) => {
    setApplyError('');
    setApplySuccess('');
    setApplyClub(club);
    setApplyForm((prev) => ({
      ...prev,
      studentId: user?.studentId || prev.studentId,
      fullName: user?.name || prev.fullName,
      email: user?.email || prev.email,
      semester: String(user?.semester ?? prev.semester ?? ''),
    }));
    setShowApply(true);
  };

  const closeApply = () => {
    if (applyBusy) return;
    setShowApply(false);
    setApplyClub(null);
    setApplyError('');
    setApplySuccess('');
  };

  const submitApplication = async (e) => {
    e?.preventDefault?.();
    if (!applyClub?.id) return;

    setApplyError('');
    setApplySuccess('');
    setApplyBusy(true);
    try {
      const payload = {
        school: {
          university: applyForm.university,
          faculty: applyForm.faculty,
          department: applyForm.department,
          studentId: applyForm.studentId,
          semester: applyForm.semester,
          year: applyForm.year,
        },
        personal: {
          fullName: applyForm.fullName,
          dob: applyForm.dob || null,
          phone: applyForm.phone,
          address: applyForm.address,
        },
        contact: {
          email: applyForm.email,
          alternateEmail: applyForm.alternateEmail,
        },
        languages: applyForm.languages,
        educationQualifications: applyForm.educationQualifications,
        sportsQualifications: applyForm.sportsQualifications,
        notes: applyForm.notes,
      };

      const res = await clubService.applyToClub(applyClub.id, payload);
      setApplySuccess(res?.message || 'Application submitted');
      setClubs((prev) => prev.map((c) => (String(c.id) === String(applyClub.id) ? { ...c, alreadyApplied: true } : c)));
    } catch (err) {
      setApplyError(err?.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplyBusy(false);
    }
  };

  const menuItems = React.useMemo(() => {
    const items = [
      {
        key: 'dashboard',
        icon: Home,
        label: 'Dashboard',
      },
      {
        key: 'apply',
        icon: FileText,
        label: 'Apply for a Club',
      },
      {
        key: 'events',
        icon: CalendarDays,
        label: 'Events',
      },
    ];

    if (hasMembership) {
      items.splice(2, 0, {
        key: 'meetings',
        icon: Users2,
        label: 'My Club Meetings',
      });
    }

    return items;
  }, [hasMembership]);

  const activeItem = React.useMemo(() => {
    const found = menuItems.find((item) => item.key === activeTab);
    return found || menuItems[0];
  }, [menuItems, activeTab]);

  return (
    <div className="h-[calc(100vh-6rem)] bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans overflow-hidden">
      <div className="relative w-full h-full p-6 lg:pt-0 lg:pb-0 flex flex-col">
        <div className="mt-0 grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)] gap-6 flex-1 h-full min-h-0 overflow-hidden">
          <div className="lg:col-span-1 lg:h-full lg:min-h-0">
            <aside className="h-full">
              {/* Mobile/tablet: list menu */}
              <div className="lg:hidden bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-gray-200">
                  <div className="text-sm font-bold text-gray-900">Menu</div>
                  <div className="text-xs text-gray-500 mt-1">Navigate club features</div>
                </div>
                <div className="p-3 space-y-1">
                  {menuItems.map((item) => {
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveTab(item.key)}
                        className={`w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border transition-colors ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 border-transparent text-white shadow-sm'
                            : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                        <span className={isActive ? 'text-white' : 'text-gray-800'}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Desktop: slim blue icon sidebar */}
              <div className="hidden lg:flex w-30 self-stretch flex-col items-center justify-between rounded-[2rem] bg-blue-600 px-4 py-6 shadow-sm h-full min-h-0">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>

                <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-start gap-3 py-2 overflow-y-auto no-scrollbar">
                  {menuItems.map((item) => {
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveTab(item.key)}
                        className={`w-full flex flex-col items-center rounded-2xl px-3 py-2 transition-colors ${
                          isActive ? 'bg-white text-blue-700' : 'text-white/90 hover:bg-white/10'
                        }`}
                        title={item.label}
                      >
                        <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-white'}`} />
                        <span
                          className={`mt-1 text-[11px] font-semibold text-center leading-tight ${
                            isActive ? 'text-gray-900' : 'text-white'
                          }`}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>

          <div className="lg:col-span-11 h-full min-h-0 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm overflow-y-auto no-scrollbar">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-gray-900">{activeItem?.label || 'Clubs'}</div>
                <div className="text-xs text-gray-500 mt-1">Use the sidebar to switch sections.</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="h-4 w-4 text-gray-700" />
                  <span className="font-medium text-gray-800">Back</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'dashboard' ? (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                  <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-50 rounded-lg">
                        <Users className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">Clubs Dashboard</h1>
                        <p className="text-sm text-gray-500">Events and member updates</p>
                      </div>
                    </div>

                    {isClubLeader ? (
                      <Link
                        to="/leader/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-white text-sm font-semibold text-indigo-700 hover:bg-indigo-50 whitespace-nowrap"
                      >
                        Leader Dashboard
                        <span aria-hidden="true">→</span>
                      </Link>
                    ) : null}
                  </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{hasMembership ? 'Active' : 'None'}</div>
                      <div className="text-sm text-gray-600">Membership Status</div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-lg">
                      <div className="text-3xl font-bold text-emerald-600 mb-1">{Array.isArray(myMeetings) ? myMeetings.length : 0}</div>
                      <div className="text-sm text-gray-600">My Meetings</div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <div className="text-3xl font-bold text-amber-600 mb-1">{Array.isArray(publicEvents) ? publicEvents.length : 0}</div>
                      <div className="text-sm text-gray-600">Public Events</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600 mb-1">{Array.isArray(clubs) ? clubs.length : 0}</div>
                      <div className="text-sm text-gray-600">Available Clubs</div>
                    </div>
                  </div>

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
                          <button
                            type="button"
                            onClick={() => setActiveTab('meetings')}
                            className="text-sm font-semibold text-indigo-700 hover:underline"
                          >
                            View all
                          </button>
                        </div>
                        <div className="p-5">
                          {feedLoading ? (
                            <div className="text-gray-500">Loading…</div>
                          ) : myMeetings.length === 0 ? (
                            <div className="text-gray-500 text-sm">No meetings scheduled.</div>
                          ) : (
                            <ul className="divide-y divide-gray-200">
                              {myMeetings.slice(0, 4).map((m) => (
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
                            <CalendarDays className="h-5 w-5 text-pink-600" />
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-gray-900">Campus Club Events</h2>
                            <p className="text-sm text-gray-500">Public events open to everyone</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('events')}
                          className="text-sm font-semibold text-indigo-700 hover:underline"
                        >
                          View all
                        </button>
                      </div>
                      <div className="p-5">
                        {feedLoading ? (
                          <div className="text-gray-500">Loading…</div>
                        ) : publicEvents.length === 0 ? (
                          <div className="text-gray-500 text-sm">No public events yet.</div>
                        ) : (
                          <ul className="divide-y divide-gray-200">
                            {publicEvents.slice(0, 4).map((e) => (
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
            ) : null}

            {activeTab === 'apply' ? (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Apply for a Club</h1>
                    <p className="text-sm text-gray-500">Choose a club and submit your membership application</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div />
                    {!canApply ? (
                      <div className="text-xs text-gray-500">Only students and club leaders can apply.</div>
                    ) : null}
                  </div>

                  {feedLoading ? (
                    <div className="text-gray-500">Loading…</div>
                  ) : clubs.length === 0 ? (
                    <div className="text-gray-500 text-sm">No active clubs found.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clubs.map((c) => {
                        const isLeaderOfClub = !!(currentUserId && c.leader?.id && String(c.leader.id) === String(currentUserId));
                        const disabled = c.alreadyMember || c.alreadyApplied || !canApply || isLeaderOfClub;
                        const label = isLeaderOfClub
                          ? 'Leader'
                          : c.alreadyMember
                            ? 'Member'
                            : c.alreadyApplied
                              ? 'Applied'
                              : 'Apply';
                        return (
                          <div key={c.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-base font-bold text-gray-900 truncate">{c.name}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Leader: {c.leader?.name || 'Not assigned'}
                                </div>
                                {c.description ? (
                                  <div className="text-sm text-gray-600 mt-2 line-clamp-2">{c.description}</div>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => openApply(c)}
                                className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 disabled:hover:bg-white"
                              >
                                {label}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === 'meetings' && hasMembership ? (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Users2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Club Meetings</h1>
                    <p className="text-sm text-gray-500">Only visible to club members</p>
                  </div>
                </div>
                <div className="p-6">
                  {feedLoading ? (
                    <div className="text-gray-500">Loading…</div>
                  ) : myMeetings.length === 0 ? (
                    <div className="text-gray-500 text-sm">No meetings scheduled.</div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {myMeetings.map((m) => (
                        <li key={m.id} className="py-4">
                          <div className="font-medium text-gray-900">{m.title}</div>
                          <div className="text-xs text-gray-600">
                            {new Date(m.date).toLocaleString()} • {m.venue || 'TBD'} • {m.club?.name || 'Club'}
                          </div>
                          {m.description ? <div className="text-sm text-gray-600 mt-2">{m.description}</div> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === 'events' ? (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                  <div className="p-2 bg-pink-50 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Events</h1>
                    <p className="text-sm text-gray-500">Public events open to everyone</p>
                  </div>
                </div>
                <div className="p-6">
                  {feedLoading ? (
                    <div className="text-gray-500">Loading…</div>
                  ) : publicEvents.length === 0 ? (
                    <div className="text-gray-500 text-sm">No public events yet.</div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {publicEvents.map((e) => (
                        <li key={e.id} className="py-4">
                          <div className="font-medium text-gray-900">{e.name}</div>
                          <div className="text-xs text-gray-600">
                            {new Date(e.date).toLocaleString()} • {e.venue || 'TBD'} • {e.club?.name || 'Club'}
                          </div>
                          {e.description ? <div className="text-sm text-gray-600 mt-2">{e.description}</div> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showApply && applyClub ? (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeApply}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Apply to {applyClub.name}</h3>
                  <p className="text-sm text-gray-500">Fill in your details to apply for membership.</p>
                </div>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={closeApply}
                  disabled={applyBusy}
                >
                  Close
                </button>
              </div>
            </div>

            <form onSubmit={submitApplication} className="p-6 max-h-[75vh] overflow-auto">
              {applyError ? (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {applyError}
                </div>
              ) : null}
              {applySuccess ? (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
                  {applySuccess}
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <div className="text-sm font-bold text-gray-900 mb-2">School Details</div>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-gray-600">University</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={applyForm.university}
                    onChange={(e) => setApplyForm((p) => ({ ...p, university: e.target.value }))}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Faculty</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={applyForm.faculty}
                    onChange={(e) => setApplyForm((p) => ({ ...p, faculty: e.target.value }))}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Department</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={applyForm.department}
                    onChange={(e) => setApplyForm((p) => ({ ...p, department: e.target.value }))}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Student ID</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={applyForm.studentId}
                    onChange={(e) => setApplyForm((p) => ({ ...p, studentId: e.target.value }))}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Semester</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={applyForm.semester}
                    onChange={(e) => setApplyForm((p) => ({ ...p, semester: e.target.value }))}
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Year</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={applyForm.year}
                    onChange={(e) => setApplyForm((p) => ({ ...p, year: e.target.value }))}
                    placeholder="e.g., 2nd year"
                  />
                </label>

                <div className="md:col-span-2 mt-2">
                  <div className="text-sm font-bold text-gray-900 mb-2">Personal Details</div>
                </div>

                <label className="block md:col-span-2">
                  <span className="text-xs font-medium text-gray-600">Full Name</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={applyForm.fullName}
                    onChange={(e) => setApplyForm((p) => ({ ...p, fullName: e.target.value }))}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Date of Birth</span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={applyForm.dob}
                    onChange={(e) => setApplyForm((p) => ({ ...p, dob: e.target.value }))}
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Phone</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={applyForm.phone}
                    onChange={(e) => setApplyForm((p) => ({ ...p, phone: e.target.value }))}
                    required
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-xs font-medium text-gray-600">Address</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={applyForm.address}
                    onChange={(e) => setApplyForm((p) => ({ ...p, address: e.target.value }))}
                  />
                </label>

                <div className="md:col-span-2 mt-2">
                  <div className="text-sm font-bold text-gray-900 mb-2">Contact & Qualifications</div>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Email</span>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={applyForm.email}
                    onChange={(e) => setApplyForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Alternate Email</span>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={applyForm.alternateEmail}
                    onChange={(e) => setApplyForm((p) => ({ ...p, alternateEmail: e.target.value }))}
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-xs font-medium text-gray-600">Languages (comma separated)</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={applyForm.languages}
                    onChange={(e) => setApplyForm((p) => ({ ...p, languages: e.target.value }))}
                    placeholder="English, Sinhala, Tamil"
                    required
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-xs font-medium text-gray-600">Education Qualifications</span>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[90px]"
                    value={applyForm.educationQualifications}
                    onChange={(e) => setApplyForm((p) => ({ ...p, educationQualifications: e.target.value }))}
                    placeholder="e.g., A/L results, diplomas, certificates"
                    required
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-xs font-medium text-gray-600">Sports Qualifications</span>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[90px]"
                    value={applyForm.sportsQualifications}
                    onChange={(e) => setApplyForm((p) => ({ ...p, sportsQualifications: e.target.value }))}
                    placeholder="e.g., teams, awards, achievements"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-xs font-medium text-gray-600">Notes</span>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[90px]"
                    value={applyForm.notes}
                    onChange={(e) => setApplyForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Why do you want to join this club?"
                  />
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeApply}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                  disabled={applyBusy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyBusy}
                  className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-white text-indigo-700 font-semibold hover:bg-indigo-50 disabled:opacity-50"
                >
                  {applyBusy ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      </div>
    </div>
  );
}
