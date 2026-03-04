import React, { useState, useEffect, useCallback } from 'react';
import {
  DoorOpen, Plus, Search, Edit2, Trash2, X, Save,
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
  Users, Clock, Wifi, Monitor, AirVent, Projector,
  Coffee, Volume2, Lock, Eye, Loader2, RefreshCw,
} from 'lucide-react';
import { studyRoomService } from '../../../services/libraryService';

// ── Sample Data (fallback) ─────────────────────────────────
const INITIAL_ROOMS = [
  { id: 1, _id: '1', name: 'Room A1', floor: '1st Floor', capacity: 6, status: 'Available', amenities: ['Wifi', 'Whiteboard', 'AC'], openTime: '08:00', closeTime: '22:00', description: 'Quiet study room for small groups.' },
  { id: 2, _id: '2', name: 'Room A2', floor: '1st Floor', capacity: 4, status: 'Occupied', amenities: ['Wifi', 'AC'], openTime: '08:00', closeTime: '22:00', description: 'Small group discussion room.' },
  { id: 3, _id: '3', name: 'Room B1', floor: '2nd Floor', capacity: 10, status: 'Available', amenities: ['Wifi', 'Projector', 'AC', 'Whiteboard'], openTime: '08:00', closeTime: '20:00', description: 'Large room for presentations.' },
  { id: 4, _id: '4', name: 'Room B2', floor: '2nd Floor', capacity: 8, status: 'Maintenance', amenities: ['Wifi', 'AC'], openTime: '09:00', closeTime: '21:00', description: 'Under maintenance.' },
  { id: 5, _id: '5', name: 'Room C1', floor: '3rd Floor', capacity: 2, status: 'Available', amenities: ['Wifi'], openTime: '08:00', closeTime: '23:00', description: 'Solo or pair study pod.' },
  { id: 6, _id: '6', name: 'Room C2', floor: '3rd Floor', capacity: 12, status: 'Available', amenities: ['Wifi', 'Projector', 'AC', 'Coffee', 'Whiteboard'], openTime: '08:00', closeTime: '22:00', description: 'Premium conference room.' },
];

const FLOORS = ['All', '1', '2', '3', '4'];
const formatFloor = (n) => {
  const num = Number(n);
  if (isNaN(num)) return n;
  const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th';
  return `${num}${suffix} Floor`;
};
const STATUSES = ['Available', 'Occupied', 'Maintenance'];

const AMENITY_LIST = [
  { key: 'Wifi', icon: Wifi, label: 'Wi-Fi', color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'AC', icon: AirVent, label: 'AC', color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { key: 'Projector', icon: Projector, label: 'Projector', color: 'text-purple-500', bg: 'bg-purple-50' },
  { key: 'Whiteboard', icon: Monitor, label: 'Whiteboard', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { key: 'Coffee', icon: Coffee, label: 'Coffee', color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'Soundproof', icon: Volume2, label: 'Soundproof', color: 'text-green-500', bg: 'bg-green-50' },
  { key: 'Lockable', icon: Lock, label: 'Lockable', color: 'text-red-500', bg: 'bg-red-50' },
];

const EMPTY_FORM = {
  roomNumber: '', name: '', floor: 1, building: 'Main Library', capacity: 4,
  status: 'Available', amenities: [],
  openTime: '08:00', closeTime: '22:00', description: '',
};

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Available: 'bg-emerald-100 text-emerald-700',
    Occupied: 'bg-amber-100 text-amber-700',
    Maintenance: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}

// ── Amenity Chips ──────────────────────────────────────────
function AmenityChips({ amenities }) {
  return (
    <div className="flex flex-wrap gap-1">
      {(amenities || []).map(a => {
        const meta = AMENITY_LIST.find(x => x.key === a);
        if (!meta) return null;
        const Icon = meta.icon;
        return (
          <span key={a} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.color}`}>
            <Icon className="h-2.5 w-2.5" />{meta.label}
          </span>
        );
      })}
    </div>
  );
}

// ── API Banner ─────────────────────────────────────────────
function ApiBanner({ usingDummy, loading, onRetry }) {
  if (loading || !usingDummy) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium">Showing demo data — backend not connected</span>
      <button onClick={onRetry} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg text-xs font-bold">
        <RefreshCw className="h-3 w-3" /> Retry
      </button>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-4`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── Room Form ──────────────────────────────────────────────
function RoomForm({ form, setForm, onSave, onCancel, isEdit, saving }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.roomNumber.trim()) e.roomNumber = 'Room number is required';
    if (!form.name.trim()) e.name = 'Room name is required';
    if (form.capacity < 1) e.capacity = 'Capacity must be at least 1';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave();
  };

  const toggleAmenity = (key) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter(a => a !== key)
        : [...f.amenities, key],
    }));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Room Number</label>
          <input
            value={form.roomNumber}
            onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
            placeholder="e.g. A1"
            className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${errors.roomNumber ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
              }`}
          />
          {errors.roomNumber && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.roomNumber}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Room Name</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Quiet Focus Room"
            className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
              }`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Building</label>
          <input
            value={form.building}
            onChange={e => setForm(f => ({ ...f, building: e.target.value }))}
            placeholder="e.g. Main Library"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Floor</label>
          <input type="number" min={0} value={form.floor}
            onChange={e => setForm(f => ({ ...f, floor: Number(e.target.value) }))}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Capacity</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="number" min={1} value={form.capacity}
              onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${errors.capacity ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                }`}
            />
          </div>
          {errors.capacity && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.capacity}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Open Time</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="time" value={form.openTime} onChange={e => setForm(f => ({ ...f, openTime: e.target.value }))}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Close Time</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="time" value={form.closeTime} onChange={e => setForm(f => ({ ...f, closeTime: e.target.value }))}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Amenities</label>
        <div className="grid grid-cols-4 gap-2">
          {AMENITY_LIST.map(({ key, icon: Icon, label, color, bg }) => {
            const selected = form.amenities.includes(key);
            return (
              <button key={key} type="button" onClick={() => toggleAmenity(key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-[11px] font-bold transition-all ${selected ? `${bg} ${color} border-current scale-105 shadow-sm` : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-200'
                  }`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Description</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={3} placeholder="Brief description..."
          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 resize-none" />
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-semibold hover:from-indigo-700 hover:to-indigo-600 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : isEdit ? 'Update Room' : 'Add Room'}
        </button>
      </div>
    </div>
  );
}

// ── Room Card ──────────────────────────────────────────────
function RoomCard({ room, onEdit, onDelete, onView }) {
  const statusColor = {
    Available: 'from-emerald-400 to-emerald-500',
    Occupied: 'from-amber-400 to-amber-500',
    Maintenance: 'from-red-400 to-red-500',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${statusColor[room.status]}`} />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl"><DoorOpen className="h-5 w-5 text-indigo-600" /></div>
            <div>
              <div className="text-sm font-black text-gray-900">{room.name}</div>
              <div className="text-xs text-gray-400">{formatFloor(room.floor)}</div>
            </div>
          </div>
          <StatusBadge status={room.status} />
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-bold text-gray-700">{room.capacity}</span> seats
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span>{room.openTime} – {room.closeTime}</span>
          </div>
        </div>
        <AmenityChips amenities={room.amenities} />
        {room.description && <p className="text-xs text-gray-400 line-clamp-2">{room.description}</p>}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
          <button onClick={() => onView(room)} className="flex-1 py-2 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 text-xs font-bold flex items-center justify-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> View
          </button>
          <button onClick={() => onEdit(room)} className="flex-1 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center gap-1.5">
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={() => onDelete(room._id || room.id)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────
export default function StudyRoomManagement() {
  const [rooms, setRooms] = useState([]); // keep empty by default
  const [usingDummy, setUsingDummy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const [viewRoom, setViewRoom] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const PER_PAGE = 6;
  const [errorMsg, setErrorMsg] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch Rooms ────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await studyRoomService.getAll();
      const rawData = res?.data?.data || res?.data || [];
      // Map backend fields to frontend display fields
      const mapped = (Array.isArray(rawData) ? rawData : []).map(r => ({
        ...r,
        id: r._id || r.id,
        // Keep floor as a number
        floor: r.floor != null ? Number(r.floor) : 1,
        status: r.isActive === false ? 'Maintenance' : (r.status || 'Available'),
        amenities: r.facilities || r.amenities || [],
        openTime: r.operatingHours?.monday?.start || '08:00',
        closeTime: r.operatingHours?.monday?.end || '22:00',
      }));
      setRooms(mapped);
      setUsingDummy(false);
    } catch (err) {
      setRooms(INITIAL_ROOMS);
      setUsingDummy(true);
      setErrorMsg(err?.response?.data?.message || 'Failed to load study rooms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // ── Filter ─────────────────────────────────────────────
  const filtered = rooms.filter(r => {
    const matchSearch = r.name?.toLowerCase().includes(search.toLowerCase()) ||
      formatFloor(r.floor).toLowerCase().includes(search.toLowerCase());
    const matchFloor = floorFilter === 'All' || String(r.floor) === floorFilter;
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchFloor && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => { setEditRoom(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (room) => {
    setEditRoom(room);
    setForm({
      roomNumber: room.roomNumber || '',
      name: room.name || '',
      floor: room.floor ?? 1,
      building: room.building || 'Main Library',
      capacity: room.capacity || 4,
      status: room.status || 'Available',
      amenities: room.amenities || room.facilities || [],
      openTime: room.openTime || '08:00',
      closeTime: room.closeTime || '22:00',
      description: room.description || '',
    });
    setShowModal(true);
  };

  // ── Save ───────────────────────────────────────────────
  const handleSave = async () => {
    if (usingDummy) {
      if (editRoom) {
        setRooms(rs => rs.map(r =>
          (r._id === editRoom._id || r.id === editRoom.id) ? { ...r, ...form } : r
        ));
        showToast('Room updated! (demo mode)');
      } else {
        setRooms(rs => [{ ...form, id: Date.now(), _id: String(Date.now()) }, ...rs]);
        showToast('Room added! (demo mode)');
      }
      setShowModal(false);
      return;
    }

    try {
      setSaving(true);
      // Map frontend form fields to backend model fields
      const payload = {
        roomNumber: form.roomNumber,
        name: form.name,
        floor: Number(form.floor),
        building: form.building || 'Main Library',
        capacity: Number(form.capacity),
        facilities: form.amenities,
        description: form.description,
        isActive: form.status === 'Available',
        operatingHours: {
          monday: { start: form.openTime, end: form.closeTime },
          tuesday: { start: form.openTime, end: form.closeTime },
          wednesday: { start: form.openTime, end: form.closeTime },
          thursday: { start: form.openTime, end: form.closeTime },
          friday: { start: form.openTime, end: form.closeTime },
          saturday: { start: form.openTime, end: form.closeTime },
          sunday: { start: form.openTime, end: form.closeTime },
        }
      };
      if (editRoom) {
        await studyRoomService.update(editRoom._id, payload);
        showToast('Room updated successfully! ✅');
      } else {
        await studyRoomService.create(payload);
        showToast('Room added successfully! ✅');
      }
      setShowModal(false);
      fetchRooms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────
  const handleDelete = async () => {
    if (usingDummy) {
      setRooms(rs => rs.filter(r => r._id !== deleteId && r.id !== deleteId));
      setDeleteId(null);
      showToast('Room deleted. (demo mode)', 'error');
      return;
    }
    try {
      setDeleting(true);
      await studyRoomService.delete(deleteId);
      setDeleteId(null);
      showToast('Room deleted.', 'error');
      fetchRooms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">

      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Study Room Management</h2>
          <p className="text-sm text-gray-500 mt-1">{rooms.length} rooms total</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-sm hover:from-indigo-700 hover:to-indigo-600 transition-all hover:scale-105">
          <Plus className="h-4 w-4" /> Add Room
        </button>
      </div>

      <ApiBanner usingDummy={usingDummy} loading={loading} onRetry={fetchRooms} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Rooms', value: rooms.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Available', value: rooms.filter(r => r.status === 'Available').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Occupied', value: rooms.filter(r => r.status === 'Occupied').length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Maintenance', value: rooms.filter(r => r.status === 'Maintenance').length, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 border border-white`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search rooms..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </div>
          <select value={floorFilter} onChange={e => { setFloorFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white cursor-pointer">
            <option value="All">All Floors</option>
            {FLOORS.filter(f => f !== 'All').map(f => <option key={f} value={f}>{formatFloor(f)}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white cursor-pointer">
            <option value="All">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {['grid', 'table'].map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${viewMode === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          <span className="ml-3 text-sm text-gray-400 font-medium">Loading rooms...</span>
        </div>
      )}

      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-gray-400 text-sm">No rooms found.</div>
          ) : paginated.map(room => (
            <RoomCard key={room._id || room.id} room={room} onEdit={openEdit} onDelete={setDeleteId} onView={setViewRoom} />
          ))}
        </div>
      )}

      {!loading && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Room', 'Floor', 'Capacity', 'Hours', 'Amenities', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">No rooms found.</td></tr>
                ) : paginated.map(room => (
                  <tr key={room._id || room.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl"><DoorOpen className="h-4 w-4 text-indigo-600" /></div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{room.name}</div>
                          <div className="text-xs text-gray-400 line-clamp-1">{room.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{formatFloor(room.floor)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-sm font-bold text-gray-700">{room.capacity}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">{room.openTime} – {room.closeTime}</td>
                    <td className="px-5 py-4"><AmenityChips amenities={room.amenities} /></td>
                    <td className="px-5 py-4"><StatusBadge status={room.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewRoom(room)} className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => openEdit(room)} className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteId(room._id || room.id)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm">
          <span className="text-xs text-gray-500">Showing {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="h-4 w-4 text-gray-600" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-xl text-sm font-bold transition-all ${p === page ? 'bg-indigo-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="h-4 w-4 text-gray-600" /></button>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editRoom ? `Edit — ${editRoom.name}` : 'Add New Room'} onClose={() => setShowModal(false)} wide>
          <RoomForm form={form} setForm={setForm} onSave={handleSave} onCancel={() => setShowModal(false)} isEdit={!!editRoom} saving={saving} />
        </Modal>
      )}

      {viewRoom && (
        <Modal title={viewRoom.name} onClose={() => setViewRoom(null)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">{formatFloor(viewRoom.floor)}</p>
                <p className="text-lg font-black text-gray-900">{viewRoom.name}</p>
              </div>
              <StatusBadge status={viewRoom.status} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 rounded-xl p-3 flex items-center gap-3">
                <Users className="h-5 w-5 text-indigo-500" />
                <div><div className="text-xs text-gray-500">Capacity</div><div className="text-sm font-black text-gray-900">{viewRoom.capacity} seats</div></div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-3">
                <Clock className="h-5 w-5 text-emerald-500" />
                <div><div className="text-xs text-gray-500">Hours</div><div className="text-sm font-black text-gray-900">{viewRoom.openTime} – {viewRoom.closeTime}</div></div>
              </div>
            </div>
            {viewRoom.description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-700">{viewRoom.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amenities</p>
              <AmenityChips amenities={viewRoom.amenities} />
            </div>
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => { setViewRoom(null); openEdit(viewRoom); }} className="flex-1 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-bold hover:bg-indigo-100 flex items-center justify-center gap-2">
                <Edit2 className="h-4 w-4" /> Edit Room
              </button>
              <button onClick={() => { setViewRoom(null); setDeleteId(viewRoom._id || viewRoom.id); }} className="py-2.5 px-4 rounded-xl bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete Room" onClose={() => setDeleteId(null)}>
          <div className="text-center space-y-4">
            <div className="mx-auto h-14 w-14 bg-red-100 rounded-2xl flex items-center justify-center"><Trash2 className="h-7 w-7 text-red-500" /></div>
            <div>
              <p className="text-sm font-bold text-gray-900">Are you sure?</p>
              <p className="text-xs text-gray-500 mt-1">This will permanently delete <strong>{rooms.find(r => r._id === deleteId || r.id === deleteId)?.name}</strong>.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
