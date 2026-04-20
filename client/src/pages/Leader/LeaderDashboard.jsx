import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CalendarDays, PlusCircle, FileText, LayoutDashboard } from 'lucide-react';
import { clubService } from '../../services/clubService';
import QRCodeGenerator from '../../components/Clubs/QRCodeGenerator.jsx';
import { attendanceService } from '../../services/attendanceService';
import { toast } from '../../lib/toast';
import { confirmDialog } from '../../lib/dialog';

export default function LeaderDashboard({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('dashboard');
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

  const [qrMeetingId, setQrMeetingId] = React.useState(null);

  // New attendance state (resolved)
  const [attendanceOpenMeetingId, setAttendanceOpenMeetingId] = React.useState(null);
  const [attendanceLoadingMeetingId, setAttendanceLoadingMeetingId] = React.useState(null);
  const [attendanceByMeetingId, setAttendanceByMeetingId] = React.useState({});

  const toggleMeetingAttendance = React.useCallback(
    async (meetingId) => {
      if (!meetingId) return;
      if (String(attendanceOpenMeetingId) === String(meetingId)) {
        setAttendanceOpenMeetingId(null);
        return;
      }

      setAttendanceOpenMeetingId(meetingId);
      setAttendanceLoadingMeetingId(meetingId);
      try {
        const data = await attendanceService.leaderGetAttendance({ meetingId });
        const items = Array.isArray(data?.items) ? data.items : [];
        const count = Number.isFinite(Number(data?.count)) ? Number(data.count) : items.length;
        setAttendanceByMeetingId((prev) => ({
          ...prev,
          [String(meetingId)]: { count, items },
        }));
      } catch {
        setAttendanceByMeetingId((prev) => ({
          ...prev,
          [String(meetingId)]: { count: 0, items: [], error: 'Failed to load attendance' },
        }));
      } finally {
        setAttendanceLoadingMeetingId(null);
      }
    },
    [attendanceOpenMeetingId]
  );

  const deleteApplication = async (applicationId) => {
    if (!applicationId) return;
    const ok = await confirmDialog({
      title: 'Delete application',
      message: 'Delete this application?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const res = await clubService.leaderDeleteMembershipApplication(applicationId);
      setApplications((prev) => prev.filter((a) => String(a.id) !== String(applicationId)));
      toast.success(res?.message || 'Application deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete application');
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
      toast.success(res?.message || 'Member added');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add member');
    }
  };

  const createMeeting = async (e) => {
    e?.preventDefault?.();
    if (!meetingForm.title.trim() || !meetingForm.date) {
      toast.error('Title and date are required');
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
        toast.success(res?.message || 'Meeting updated');
      } else {
        const res = await clubService.leaderCreateMeeting(meetingForm);
        const m = res?.meeting;
        if (m) setMeetings((prev) => sortByDateAsc([...prev, m]));
        setShowAddMeeting(false);
        setMeetingForm({ title: '', date: '', venue: '', description: '' });
        toast.success(res?.message || 'Meeting created');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || (meetingModalMode === 'edit' ? 'Failed to update meeting' : 'Failed to create meeting'));
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
    const ok = await confirmDialog({
      title: 'Delete meeting',
      message: 'Delete this meeting?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const res = await clubService.leaderDeleteMeeting(meetingId);
      setMeetings((prev) => prev.filter((m) => String(m.id) !== String(meetingId)));
      toast.success(res?.message || 'Meeting deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete meeting');
    }
  };

  const createEvent = async (e) => {
    e?.preventDefault?.();
    if (!eventForm.name.trim() || !eventForm.date) {
      toast.error('Name and date are required');
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
        toast.success(res?.message || 'Event updated');
      } else {
        const res = await clubService.leaderCreateEvent(eventForm);
        const ev = res?.event;
        if (ev) setEvents((prev) => sortByDateAsc([...prev, ev]));
        setShowAddEvent(false);
        setEventForm({ name: '', date: '', venue: '', type: 'Public' });
        toast.success(res?.message || 'Event created');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || (eventModalMode === 'edit' ? 'Failed to update event' : 'Failed to create event'));
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
    const ok = await confirmDialog({
      title: 'Delete event',
      message: 'Delete this event?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const res = await clubService.leaderDeleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => String(e.id) !== String(eventId)));
      toast.success(res?.message || 'Event deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete event');
    }
  };

  const menuItems = React.useMemo(
    () => [
      { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { key: 'members', icon: Users, label: 'Members' },
      { key: 'meetings', icon: CalendarDays, label: 'Meetings' },
      { key: 'events', icon: PlusCircle, label: 'Events' },
      { key: 'applications', icon: FileText, label: 'Applications' },
    ],
    []
  );

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
                  <div className="text-xs text-gray-500 mt-1">Leader tools</div>
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
                  <LayoutDashboard className="h-6 w-6 text-blue-600" />
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
                <div className="text-sm font-bold text-gray-900">{activeItem?.label || 'Leader Dashboard'}</div>
                <div className="text-xs text-gray-500 mt-1">Welcome, {user?.name || 'Leader'}</div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 text-gray-700" />
                <span className="font-medium text-gray-800">Back</span>
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-gray-600">Loading...</div>
              ) : !club ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">No club assigned</h2>
                  <p className="text-gray-600">You are not a club leader or do not have a club assigned yet.</p>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">{club?.name || 'My Club'}</h2>
                            <p className="text-sm text-gray-500">Manage your club</p>
                          </div>
                          <div className="p-3 rounded-xl bg-indigo-50">
                            <Users className="h-6 w-6 text-indigo-600" />
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="text-2xl font-bold text-gray-900">{members.length}</div>
                            <div className="text-xs text-gray-500">Members</div>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
                            <div className="text-xs text-gray-500">Applications</div>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={openAddMember}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-white text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                          >
                            <PlusCircle className="h-4 w-4" />
                            Add Member
                          </button>
                          <button
                            type="button"
                            onClick={openCreateMeeting}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-white text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            <CalendarDays className="h-4 w-4" />
                            Add Meeting
                          </button>
                          <button
                            type="button"
                            onClick={openCreateEvent}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-pink-200 bg-white text-sm font-semibold text-pink-700 hover:bg-pink-50"
                          >
                            <PlusCircle className="h-4 w-4" />
                            Add Event
                          </button>
                        </div>
                      </div>

                      <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-gray-900">Quick View</div>
                            <div className="text-xs text-gray-500 mt-1">Upcoming meetings & events</div>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 mb-2">Meetings</div>
                            {meetings.length === 0 ? (
                              <div className="text-sm text-gray-500">No meetings scheduled.</div>
                            ) : (
                              <ul className="divide-y divide-gray-200">
                                {meetings.slice(0, 4).map((m) => (
                                  <li key={m.id} className="py-3">
                                    <div className="font-medium text-gray-900 break-words">{m.title}</div>
                                    <div className="text-xs text-gray-600">{new Date(m.date).toLocaleString()} • {m.venue || 'TBD'}</div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 mb-2">Events</div>
                            {events.length === 0 ? (
                              <div className="text-sm text-gray-500">No events yet.</div>
                            ) : (
                              <ul className="divide-y divide-gray-200">
                                {events.slice(0, 4).map((ev) => (
                                  <li key={ev.id} className="py-3">
                                    <div className="font-medium text-gray-900 break-words">{ev.name}</div>
                                    <div className="text-xs text-gray-600">{new Date(ev.date).toLocaleString()} • {ev.venue || 'TBD'}</div>
                                    <div className="text-xs text-gray-500 mt-1">{ev.type}</div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'members' ? (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                      <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-3">
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
                          <p className="text-sm text-gray-500">{club?.name || 'Club'} • Total: {members.length}</p>
                        </div>
                        <button
                          type="button"
                          onClick={openAddMember}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-white text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Member
                        </button>
                      </div>
                      <div className="p-6">
                        {members.length === 0 ? (
                          <div className="text-sm text-gray-500">No members yet.</div>
                        ) : (
                          <ul className="divide-y divide-gray-200">
                            {members.map((m) => (
                              <li key={m.id} className="py-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="font-medium text-gray-900">{m.name}</div>
                                    <div className="text-xs text-gray-500">{m.email}</div>
                                  </div>
                                  <div className="text-xs text-gray-500">{[m.department, m.year].filter(Boolean).join(' ')}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'meetings' ? (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                      <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-3">
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
                          <p className="text-sm text-gray-500">Create and manage meetings</p>
                        </div>
                        <button
                          type="button"
                          onClick={openCreateMeeting}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-white text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          <CalendarDays className="h-4 w-4" />
                          Add Meeting
                        </button>
                      </div>
                      <div className="p-6">
                        {meetings.length === 0 ? (
                          <div className="text-sm text-gray-500">No meetings scheduled.</div>
                        ) : (
                          <ul className="divide-y divide-gray-200">
                            {meetings.map((m) => (
                              <li key={m.id} className="py-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="font-medium text-gray-900 break-words">{m.title}</div>
                                    <div className="text-xs text-gray-600">{new Date(m.date).toLocaleString()} • {m.venue || 'TBD'}</div>
                                    {m.description ? <div className="text-xs text-gray-500 mt-1">{m.description}</div> : null}
                                  </div>
                                  <div className="shrink-0 flex flex-wrap items-center gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setQrMeetingId((prev) => (String(prev) === String(m.id) ? null : m.id))}
                                      className="px-3 py-1.5 rounded-lg border border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                                    >
                                      {String(qrMeetingId) === String(m.id) ? 'Hide QR' : 'Show QR'}
                                    </button>

                                    {/* Single attendance button (resolved) */}
                                    <button
                                      type="button"
                                      onClick={() => toggleMeetingAttendance(m.id)}
                                      className="px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                    >
                                      {String(attendanceOpenMeetingId) === String(m.id) ? 'Hide Attendance' : 'View Attendance'}
                                    </button>

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

                                {String(qrMeetingId) === String(m.id) ? (
                                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <div className="text-xs font-semibold text-gray-700 mb-3">Attendance QR</div>
                                    <QRCodeGenerator meetingId={m.id} size={220} />
                                  </div>
                                ) : null}

                                {String(attendanceOpenMeetingId) === String(m.id) ? (
                                  <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="text-xs font-semibold text-gray-900">Attendance</div>
                                      <div className="text-xs text-gray-500">
                                        {attendanceLoadingMeetingId && String(attendanceLoadingMeetingId) === String(m.id)
                                          ? 'Loading…'
                                          : (() => {
                                              const rec = attendanceByMeetingId[String(m.id)];
                                              const c = Number.isFinite(Number(rec?.count)) ? Number(rec.count) : null;
                                              return c === null ? '' : `Total: ${c}`;
                                            })()}
                                      </div>
                                    </div>

                                    {attendanceLoadingMeetingId && String(attendanceLoadingMeetingId) === String(m.id) ? (
                                      <div className="mt-3 text-sm text-gray-500">Loading attendance…</div>
                                    ) : (() => {
                                        const rec = attendanceByMeetingId[String(m.id)] || { items: [], count: 0 };
                                        if (rec?.error) {
                                          return <div className="mt-3 text-sm text-red-600">{rec.error}</div>;
                                        }
                                        const items = Array.isArray(rec.items) ? rec.items : [];
                                        if (items.length === 0) {
                                          return <div className="mt-3 text-sm text-gray-500">No attendance marked yet.</div>;
                                        }
                                        return (
                                          <ul className="mt-3 divide-y divide-gray-200">
                                            {items.map((a) => (
                                              <li key={a.id} className="py-3">
                                                <div className="flex items-start justify-between gap-3">
                                                  <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900 truncate">
                                                      {a.studentName || a.studentId}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                      {a.studentName ? `ID: ${a.studentId}` : ''}
                                                      {a.studentEmail ? ` • ${a.studentEmail}` : ''}
                                                    </div>
                                                  </div>
                                                  <div className="text-xs text-gray-500 shrink-0">
                                                    {a.markedAt ? new Date(a.markedAt).toLocaleString() : ''}
                                                  </div>
                                                </div>
                                              </li>
                                            ))}
                                          </ul>
                                        );
                                      })()}
                                  </div>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'events' ? (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                      <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-3">
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
                          <p className="text-sm text-gray-500">Create and manage events</p>
                        </div>
                        <button
                          type="button"
                          onClick={openCreateEvent}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-pink-200 bg-white text-sm font-semibold text-pink-700 hover:bg-pink-50"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Event
                        </button>
                      </div>
                      <div className="p-6">
                        {events.length === 0 ? (
                          <div className="text-sm text-gray-500">No events yet.</div>
                        ) : (
                          <ul className="divide-y divide-gray-200">
                            {events.map((ev) => (
                              <li key={ev.id} className="py-4">
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
                  ) : null}

                  {activeTab === 'applications' ? (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                      <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-3">
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">Membership Applications</h1>
                          <p className="text-sm text-gray-500">Applications submitted by students (view-only)</p>
                        </div>
                        <div className="text-xs text-gray-500">Total: {applications.length}</div>
                      </div>
                      <div className="p-6">
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
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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

      {/* Add Member Modal */}
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