import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CalendarDays, PlusCircle } from 'lucide-react';
import { clubService } from '../../services/clubService';

export default function LeaderDashboard({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [club, setClub] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [applications, setApplications] = React.useState([]);
  const [applicationsLoading, setApplicationsLoading] = React.useState(false);
  const [showAddMember, setShowAddMember] = React.useState(false);
  const [eligible, setEligible] = React.useState([]);
  const [eligibleLoading, setEligibleLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [selectedStudentId, setSelectedStudentId] = React.useState('');
  const [meetings, setMeetings] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [showAddMeeting, setShowAddMeeting] = React.useState(false);
  const [meetingModalMode, setMeetingModalMode] = React.useState('create');
  const [editingMeetingId, setEditingMeetingId] = React.useState(null);
  const [meetingForm, setMeetingForm] = React.useState({ title: '', date: '', venue: '', description: '' });
  const [showAddEvent, setShowAddEvent] = React.useState(false);
  const [eventModalMode, setEventModalMode] = React.useState('create');
  const [editingEventId, setEditingEventId] = React.useState(null);
  const [eventForm, setEventForm] = React.useState({ name: '', date: '', venue: '', type: 'Public' });

  const deleteApplication = async (applicationId) => {
    if (!applicationId) return;
    const ok = window.confirm('Delete this application?');
    if (!ok) return;
    try {
      const res = await clubService.leaderDeleteMembershipApplication(applicationId);
      setApplications((prev) => prev.filter((a) => String(a.id) !== String(applicationId)));
      alert(res?.message || 'Application deleted');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete application');
    }
  };

  const toDateTimeLocalValue = React.useCallback((value) => {
    if (!value) return '';
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return '';
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }, []);

  const sortByDateAsc = React.useCallback((list) => {
    return [...(Array.isArray(list) ? list : [])].sort((a, b) => {
      const ad = new Date(a?.date).getTime();
      const bd = new Date(b?.date).getTime();
      return (Number.isFinite(ad) ? ad : 0) - (Number.isFinite(bd) ? bd : 0);
    });
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await clubService.leaderGetMyClub();
        if (cancelled) return;
        const c = data?.club || null;
        setClub(c);
        setMembers(Array.isArray(c?.members) ? c.members : []);
        try {
          const m = await clubService.leaderListMeetings();
          setMeetings(Array.isArray(m?.meetings) ? m.meetings : []);
        } catch { setMeetings([]); }
        try {
          const e = await clubService.leaderListEvents();
          setEvents(Array.isArray(e?.events) ? e.events : []);
        } catch { setEvents([]); }

        setApplicationsLoading(true);
        try {
          const a = await clubService.leaderListMembershipApplications();
          setApplications(Array.isArray(a?.items) ? a.items : []);
        } catch {
          setApplications([]);
        } finally {
          setApplicationsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setClub(null);
          setMembers([]);
          setApplications([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openAddMember = async () => {
    setShowAddMember(true);
    setEligibleLoading(true);
    setEligible([]);
    setSelectedStudentId('');
    setSearch('');
    try {
      const data = await clubService.leaderEligibleStudents();
      const list = Array.isArray(data?.students) ? data.students : [];
      setEligible(list);
    } catch {
      setEligible([]);
    } finally {
      setEligibleLoading(false);
    }
  };

  const addMember = async (e) => {
    e?.preventDefault?.();
    if (!selectedStudentId) return;
    try {
      const res = await clubService.leaderAddMember(selectedStudentId);
      const m = res?.member;
      if (m) {
        setMembers((prev) => {
          if (prev.some((x) => String(x.id) === String(m.id))) return prev;
          return [...prev, m];
        });
      }
      setShowAddMember(false);
      setSelectedStudentId('');
      setSearch('');
      alert(res?.message || 'Member added');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to add member');
    }
  };

  const createMeeting = async (e) => {
    e?.preventDefault?.();
    if (!meetingForm.title.trim() || !meetingForm.date) {
      alert('Title and date are required');
      return;
    }
    try {
      if (meetingModalMode === 'edit') {
        const res = await clubService.leaderUpdateMeeting(editingMeetingId, meetingForm);
        const m = res?.meeting;
        if (m) {
          setMeetings((prev) => sortByDateAsc(prev.map((x) => (String(x.id) === String(m.id) ? m : x))));
        }
        setShowAddMeeting(false);
        setMeetingModalMode('create');
        setEditingMeetingId(null);
        setMeetingForm({ title: '', date: '', venue: '', description: '' });
        alert(res?.message || 'Meeting updated');
      } else {
        const res = await clubService.leaderCreateMeeting(meetingForm);
        const m = res?.meeting;
        if (m) setMeetings((prev) => sortByDateAsc([...prev, m]));
        setShowAddMeeting(false);
        setMeetingForm({ title: '', date: '', venue: '', description: '' });
        alert(res?.message || 'Meeting created');
      }
    } catch (err) {
      alert(err?.response?.data?.message || (meetingModalMode === 'edit' ? 'Failed to update meeting' : 'Failed to create meeting'));
    }
  };

  const openCreateMeeting = () => {
    setMeetingModalMode('create');
    setEditingMeetingId(null);
    setMeetingForm({ title: '', date: '', venue: '', description: '' });
    setShowAddMeeting(true);
  };

  const openEditMeeting = (m) => {
    setMeetingModalMode('edit');
    setEditingMeetingId(m?.id);
    setMeetingForm({
      title: m?.title || '',
      date: toDateTimeLocalValue(m?.date),
      venue: m?.venue || '',
      description: m?.description || '',
    });
    setShowAddMeeting(true);
  };

  const deleteMeeting = async (meetingId) => {
    if (!meetingId) return;
    const ok = window.confirm('Delete this meeting?');
    if (!ok) return;
    try {
      const res = await clubService.leaderDeleteMeeting(meetingId);
      setMeetings((prev) => prev.filter((m) => String(m.id) !== String(meetingId)));
      alert(res?.message || 'Meeting deleted');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete meeting');
    }
  };

  const createEvent = async (e) => {
    e?.preventDefault?.();
    if (!eventForm.name.trim() || !eventForm.date) {
      alert('Name and date are required');
      return;
    }
    try {
      if (eventModalMode === 'edit') {
        const res = await clubService.leaderUpdateEvent(editingEventId, eventForm);
        const ev = res?.event;
        if (ev) {
          setEvents((prev) => sortByDateAsc(prev.map((x) => (String(x.id) === String(ev.id) ? ev : x))));
        }
        setShowAddEvent(false);
        setEventModalMode('create');
        setEditingEventId(null);
        setEventForm({ name: '', date: '', venue: '', type: 'Public' });
        alert(res?.message || 'Event updated');
      } else {
        const res = await clubService.leaderCreateEvent(eventForm);
        const ev = res?.event;
        if (ev) setEvents((prev) => sortByDateAsc([...prev, ev]));
        setShowAddEvent(false);
        setEventForm({ name: '', date: '', venue: '', type: 'Public' });
        alert(res?.message || 'Event created');
      }
    } catch (err) {
      alert(err?.response?.data?.message || (eventModalMode === 'edit' ? 'Failed to update event' : 'Failed to create event'));
    }
  };

  const openCreateEvent = () => {
    setEventModalMode('create');
    setEditingEventId(null);
    setEventForm({ name: '', date: '', venue: '', type: 'Public' });
    setShowAddEvent(true);
  };

  const openEditEvent = (ev) => {
    setEventModalMode('edit');
    setEditingEventId(ev?.id);
    setEventForm({
      name: ev?.name || '',
      date: toDateTimeLocalValue(ev?.date),
      venue: ev?.venue || '',
      type: ev?.type || 'Public',
    });
    setShowAddEvent(true);
  };

  const deleteEvent = async (eventId) => {
    if (!eventId) return;
    const ok = window.confirm('Delete this event?');
    if (!ok) return;
    try {
      const res = await clubService.leaderDeleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => String(e.id) !== String(eventId)));
      alert(res?.message || 'Event deleted');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete event');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-[#25f194]">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-white/10 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>
            <div className="rounded-2xl bg-white px-3 py-2 shadow-sm ml-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <div className="text-sm font-bold text-gray-900">CampusCore</div>
                  <div className="text-xs font-medium text-gray-500">Leader</div>
                </div>
              </div>
            </div>
            <div className="text-white">
              <div className="text-sm font-semibold">Leader Dashboard</div>
              <div className="text-xs text-white/80">Welcome, {user?.name}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-white/90">Loading...</div>
        ) : !club ? (
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No club assigned</h2>
            <p className="text-gray-600">You are not a club leader or do not have a club assigned yet.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{club?.name || 'My Club'}</h2>
                <p className="text-sm text-gray-500">Manage your members and events</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Members ({members.length})</h3>
                <button
                  type="button"
                  onClick={openAddMember}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Member
                </button>
              </div>
              <ul className="mt-3 divide-y divide-gray-200">
                {members.length === 0 ? (
                  <li className="py-3 text-sm text-gray-500">No members yet.</li>
                ) : (
                  members.map((m) => (
                    <li key={m.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{m.name}</div>
                          <div className="text-xs text-gray-500">{m.email}</div>
                        </div>
                        <div className="text-xs text-gray-500">{[m.department, m.year].filter(Boolean).join(' ')}</div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Meetings & Events</h2>
                <p className="text-sm text-gray-500">Create and manage your club schedule</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openCreateMeeting}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-white text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  <CalendarDays className="h-4 w-4" />
                  Add Meeting
                </button>
                <button
                  type="button"
                  onClick={openCreateEvent}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-pink-200 bg-white text-sm font-semibold text-pink-700 hover:bg-pink-50"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Event
                </button>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Upcoming Meetings</h3>
                {meetings.length === 0 ? (
                  <div className="text-sm text-gray-500">No meetings scheduled.</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {meetings.map((m) => (
                      <li key={m.id} className="py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 break-words">{m.title}</div>
                            <div className="text-xs text-gray-600">{new Date(m.date).toLocaleString()} • {m.venue || 'TBD'}</div>
                            {m.description ? <div className="text-xs text-gray-500 mt-1">{m.description}</div> : null}
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditMeeting(m)}
                              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMeeting(m.id)}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Club Events</h3>
                {events.length === 0 ? (
                  <div className="text-sm text-gray-500">No events yet.</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {events.map((ev) => (
                      <li key={ev.id} className="py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 break-words">{ev.name}</div>
                            <div className="text-xs text-gray-600">{new Date(ev.date).toLocaleString()} • {ev.venue || 'TBD'}</div>
                            <div className="text-xs text-gray-500 mt-1">{ev.type}</div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditEvent(ev)}
                              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteEvent(ev.id)}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl md:col-span-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Membership Applications</h2>
                <p className="text-sm text-gray-500">Applications submitted by students (view-only)</p>
              </div>
              <div className="text-xs text-gray-500">Total: {applications.length}</div>
            </div>

            <div className="mt-4">
              {applicationsLoading ? (
                <div className="text-sm text-gray-500">Loading…</div>
              ) : applications.length === 0 ? (
                <div className="text-sm text-gray-500">No applications yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {applications.map((a) => (
                    <div key={a.id} className="rounded-2xl border border-gray-200 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">{a.applicant?.name || a.personal?.fullName || 'Applicant'}</div>
                          <div className="text-xs text-gray-500">{a.applicant?.email || a.contact?.email || ''}</div>
                          <div className="text-xs text-gray-500">
                            {(a.applicant?.studentId || a.school?.studentId || '') ? `ID: ${a.applicant?.studentId || a.school?.studentId}` : ''}
                            {a.createdAt ? ` • ${new Date(a.createdAt).toLocaleString()}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-gray-700 space-y-2">
                        <div>
                          <div className="font-semibold text-gray-900">School</div>
                          <div className="text-gray-700">
                            {[a.school?.university, a.school?.faculty, a.school?.department].filter(Boolean).join(' • ') || '—'}
                          </div>
                          <div className="text-gray-500">
                            {[a.school?.year ? `Year: ${a.school.year}` : null, a.school?.semester ? `Semester: ${a.school.semester}` : null]
                              .filter(Boolean)
                              .join(' • ') || ''}
                          </div>
                        </div>

                        <div>
                          <div className="font-semibold text-gray-900">Personal</div>
                          <div className="text-gray-700">
                            {[a.personal?.phone ? `Phone: ${a.personal.phone}` : null, a.personal?.address ? `Address: ${a.personal.address}` : null]
                              .filter(Boolean)
                              .join(' • ') || '—'}
                          </div>
                        </div>

                        <div>
                          <div className="font-semibold text-gray-900">Languages</div>
                          <div className="text-gray-700">
                            {Array.isArray(a.languages) && a.languages.length
                              ? a.languages.map((l) => l?.name).filter(Boolean).join(', ')
                              : '—'}
                          </div>
                        </div>

                        <div>
                          <div className="font-semibold text-gray-900">Education Qualifications</div>
                          <div className="text-gray-700 whitespace-pre-wrap">{a.educationQualifications || '—'}</div>
                        </div>

                        <div>
                          <div className="font-semibold text-gray-900">Sports Qualifications</div>
                          <div className="text-gray-700 whitespace-pre-wrap">{a.sportsQualifications || '—'}</div>
                        </div>

                        {a.notes ? (
                          <div>
                            <div className="font-semibold text-gray-900">Notes</div>
                            <div className="text-gray-700 whitespace-pre-wrap">{a.notes}</div>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => deleteApplication(a.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </main>

      {/* Add Meeting Modal */}
      {showAddMeeting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{meetingModalMode === 'edit' ? 'Edit Meeting' : 'Add Meeting'}</h3>
            </div>
            <form onSubmit={createMeeting} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Weekly Standup"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={meetingForm.date}
                  onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input
                  type="text"
                  value={meetingForm.venue}
                  onChange={(e) => setMeetingForm({ ...meetingForm, venue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Room A101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional details"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMeeting(false);
                    setMeetingModalMode('create');
                    setEditingMeetingId(null);
                    setMeetingForm({ title: '', date: '', venue: '', description: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {meetingModalMode === 'edit' ? 'Save Changes' : 'Add Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{eventModalMode === 'edit' ? 'Edit Event' : 'Add Event'}</h3>
            </div>
            <form onSubmit={createEvent} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Annual Showcase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input
                  type="text"
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Main Hall"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Public">Public (visible to all)</option>
                  <option value="Members-only">Members-only (visible to club members)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddEvent(false);
                    setEventModalMode('create');
                    setEditingEventId(null);
                    setEventForm({ name: '', date: '', venue: '', type: 'Public' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
                >
                  {eventModalMode === 'edit' ? 'Save Changes' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add Member to {club?.name || 'Club'}</h3>
            </div>
            <form onSubmit={addMember} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, department, year"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                <div className="relative">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={eligibleLoading}
                  >
                    <option value="">
                      {eligibleLoading ? 'Loading students...' : eligible.length ? '-- Select a student --' : 'No students available'}
                    </option>
                    {eligible
                      .filter((s) => {
                        const q = search.trim().toLowerCase();
                        if (!q) return true;
                        const label = `${s.name} ${s.email} ${s.department || ''} ${s.year || ''}`.toLowerCase();
                        return label.includes(q);
                      })
                      .map((s) => {
                        const meta = [s.email, [s.department, s.year].filter(Boolean).join(' ')].filter(Boolean).join(' - ');
                        return (
                          <option key={s.id} value={s.id}>
                            {s.name}{meta ? ` (${meta})` : ''}
                          </option>
                        );
                      })}
                  </select>
                  {eligibleLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg text-sm text-gray-600">
                      Loading…
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{eligible.length} students available</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudentId || eligibleLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
