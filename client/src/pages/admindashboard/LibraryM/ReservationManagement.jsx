import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Plus, Search, Edit2, Trash2, X, Save,
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
  Clock, User, BookOpen, DoorOpen,
  Eye, Check, XCircle, RefreshCw, Download, Loader2,
} from 'lucide-react';
import { reservationService } from '../../../services/libraryService';

// ❌ remove INITIAL_RESERVATIONS constant block completely

const STATUSES  = ['All', 'Pending', 'Approved', 'Rejected', 'Completed'];
const RES_TYPES = ['All', 'Book', 'Study Room'];
const BOOKS     = ['Clean Code','Atomic Habits','The Pragmatic Programmer','Design Patterns','React in Action','System Design Interview','Introduction to Algorithms'];
const ROOMS     = ['Room A1','Room A2','Room B1','Room B2','Room C1','Room C2'];

const EMPTY_FORM = {
  type:'Book', refName:BOOKS[0], userId:'', userName:'',
  date:'', startTime:'', endTime:'',
  status:'Pending', notes:'',
};

const STATUS_CFG = {
  Pending:   { bg:'bg-amber-100',   text:'text-amber-700',  dot:'bg-amber-400'   },
  Approved:  { bg:'bg-emerald-100', text:'text-emerald-700',dot:'bg-emerald-400' },
  Rejected:  { bg:'bg-red-100',     text:'text-red-600',    dot:'bg-red-400'     },
  Completed: { bg:'bg-blue-100',    text:'text-blue-700',   dot:'bg-blue-400'    },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || {};
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{status}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${type==='Book'?'bg-indigo-100 text-indigo-600':'bg-purple-100 text-purple-600'}`}>
      {type==='Book'?<BookOpen className="h-3 w-3"/>:<DoorOpen className="h-3 w-3"/>}{type}
    </span>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide?'max-w-2xl':'max-w-md'} bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-4`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ReservationForm({ form, setForm, onSave, onCancel, isEdit, saving }) {
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!form.userId.trim())   e.userId   = 'Student ID is required';
    if (!form.userName.trim()) e.userName = 'Student name is required';
    if (!form.date)            e.date     = 'Date is required';
    if (form.type==='Study Room') {
      if (!form.startTime) e.startTime = 'Start time required';
      if (!form.endTime)   e.endTime   = 'End time required';
    }
    return e;
  };
  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave();
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Reservation Type</label>
        <div className="flex gap-3">
          {['Book','Study Room'].map(t=>(
            <button key={t} type="button"
              onClick={()=>setForm(f=>({...f,type:t,refName:t==='Book'?BOOKS[0]:ROOMS[0],startTime:'',endTime:''}))}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                form.type===t?(t==='Book'?'bg-indigo-500 text-white border-indigo-500':'bg-purple-500 text-white border-purple-500'):'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}>
              {t==='Book'?<BookOpen className="h-4 w-4"/>:<DoorOpen className="h-4 w-4"/>}{t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">{form.type==='Book'?'Book':'Study Room'}</label>
        <select value={form.refName} onChange={e=>setForm(f=>({...f,refName:e.target.value}))}
          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white">
          {(form.type==='Book'?BOOKS:ROOMS).map(n=><option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Student ID</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={form.userId} onChange={e=>setForm(f=>({...f,userId:e.target.value}))} placeholder="e.g. STU001"
              className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${errors.userId?'border-red-400 bg-red-50':'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`} />
          </div>
          {errors.userId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.userId}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Student Name</label>
          <input value={form.userName} onChange={e=>setForm(f=>({...f,userName:e.target.value}))} placeholder="Full name"
            className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${errors.userName?'border-red-400 bg-red-50':'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`} />
          {errors.userName && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.userName}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Reservation Date</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
            className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${errors.date?'border-red-400 bg-red-50':'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`} />
        </div>
        {errors.date && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.date}</p>}
      </div>

      {form.type==='Study Room' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Start Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))}
                className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${errors.startTime?'border-red-400 bg-red-50':'border-gray-200 focus:border-indigo-400'}`} />
            </div>
            {errors.startTime && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.startTime}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">End Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))}
                className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${errors.endTime?'border-red-400 bg-red-50':'border-gray-200 focus:border-indigo-400'}`} />
            </div>
            {errors.endTime && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{errors.endTime}</p>}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Status</label>
        <div className="grid grid-cols-2 gap-2">
          {['Pending','Approved','Rejected','Completed'].map(s=>{
            const cfg = STATUS_CFG[s];
            return (
              <button key={s} type="button" onClick={()=>setForm(f=>({...f,status:s}))}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-xl border-2 text-sm font-bold transition-all ${form.status===s?`${cfg.bg} ${cfg.text} border-current`:'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                <span className={`h-2 w-2 rounded-full ${form.status===s?cfg.dot:'bg-gray-300'}`} />{s}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Notes (optional)</label>
        <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} placeholder="Additional notes..."
          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 resize-none" />
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-semibold hover:from-indigo-700 hover:to-indigo-600 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60">
          {saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}
          {saving?'Saving...':isEdit?'Update Reservation':'Add Reservation'}
        </button>
      </div>
    </div>
  );
}

export default function ReservationManagement() {
  const [reservations, setReservations] = useState([]); // changed
  const [usingDummy, setUsingDummy] = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter,   setTypeFilter]   = useState('All');
  const [showModal,    setShowModal]    = useState(false);
  const [editRes,      setEditRes]      = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [deleteId,     setDeleteId]     = useState(null);
  const [viewRes,      setViewRes]      = useState(null);
  const [toast,        setToast]        = useState(null);
  const [page,         setPage]         = useState(1);
  const PER_PAGE = 8;

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  // ── Fetch Reservations ─────────────────────────────────
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (typeFilter   !== 'All') params.type   = typeFilter;
      if (search)                 params.search  = search;

      const res  = await reservationService.getAll(params);
      const data = res?.data?.data?.reservations || res?.data?.data || res?.data || [];
      setReservations(Array.isArray(data) ? data : []);
      setUsingDummy(false);
    } catch (err) {
      setReservations([]); // still empty, but allow local add
      setUsingDummy(true);
      showToast(err?.response?.data?.message || 'Failed to load reservations', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  // ── Quick status update ────────────────────────────────
  const quickStatus = async (id, status) => {
    if (usingDummy) {
      setReservations(rs => rs.map(r => (r.id === id || r._id === id) ? { ...r, status } : r));
      showToast(`Reservation ${status.toLowerCase()}! (demo mode)`);
      return;
    }
    try {
      await reservationService.updateStatus(id, status);
      showToast(`Reservation ${status.toLowerCase()}! ✅`);
      fetchReservations();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const filtered = reservations; // changed (no demo-only filter path)

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const openAdd  = () => { setEditRes(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (r) => {
    setEditRes(r);
    setForm({
      type:      r.type      || 'Book',
      refName:   r.refName   || BOOKS[0],
      userId:    r.userId    || '',
      userName:  r.userName  || '',
      date:      r.date      || '',
      startTime: r.startTime || '',
      endTime:   r.endTime   || '',
      status:    r.status    || 'Pending',
      notes:     r.notes     || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (usingDummy) {
      setSaving(true);
      if (editRes) {
        setReservations(rs => rs.map(r => (r.id === editRes.id || r._id === editRes._id) ? { ...r, ...form } : r));
        showToast('Reservation updated! (demo mode)');
      } else {
        const newItem = { id: Date.now(), ...form };
        setReservations(rs => [newItem, ...rs]);
        showToast('Reservation added! (demo mode)');
      }
      setShowModal(false);
      setSaving(false);
      return;
    }
    try {
      setSaving(true);
      if (editRes) {
        await reservationService.update(editRes._id || editRes.id, form);
        showToast('Reservation updated! ✅');
      } else {
        await reservationService.create(form);
        showToast('Reservation added! ✅');
      }
      setShowModal(false);
      fetchReservations();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (usingDummy) {
      setDeleting(true);
      setReservations(rs => rs.filter(r => (r.id !== deleteId && r._id !== deleteId)));
      setDeleteId(null);
      showToast('Reservation deleted. (demo mode)', 'error');
      setDeleting(false);
      return;
    }
    try {
      setDeleting(true);
      await reservationService.delete(deleteId);
      setDeleteId(null);
      showToast('Reservation deleted.', 'error');
      fetchReservations();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    const headers = ['ID','Type','Reference','Student ID','Student Name','Date','Start','End','Status','Notes'];
    const rows = filtered.map(r => [r._id||r.id, r.type, r.refName, r.userId, r.userName, r.date, r.startTime, r.endTime, r.status, r.notes]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download='reservations.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${toast.type==='success'?'bg-emerald-500':'bg-red-500'}`}>
          {toast.type==='success'?<CheckCircle className="h-4 w-4"/>:<AlertCircle className="h-4 w-4"/>}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Reservation Management</h2>
          <p className="text-sm text-gray-500 mt-1">{reservations.length} total reservations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 shadow-sm">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-sm hover:from-indigo-700 hover:to-indigo-600 transition-all hover:scale-105">
            <Plus className="h-4 w-4" /> Add Reservation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total',     value:reservations.length,                                        color:'text-indigo-600',  bg:'bg-indigo-50'  },
          { label:'Pending',   value:reservations.filter(r=>r.status==='Pending').length,         color:'text-amber-600',   bg:'bg-amber-50'   },
          { label:'Approved',  value:reservations.filter(r=>r.status==='Approved').length,        color:'text-emerald-600', bg:'bg-emerald-50' },
          { label:'Completed', value:reservations.filter(r=>r.status==='Completed').length,       color:'text-blue-600',    bg:'bg-blue-50'    },
        ].map((s,i)=>(
          <div key={i} className={`${s.bg} rounded-2xl p-4 border border-white`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by student, ID or item..." value={search}
              onChange={e=>{setSearch(e.target.value);setPage(1);}}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </div>
          <select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1);}}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white cursor-pointer">
            {RES_TYPES.map(t=><option key={t} value={t}>{t==='All'?'All Types':t}</option>)}
          </select>
          <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white cursor-pointer">
            {STATUSES.map(s=><option key={s} value={s}>{s==='All'?'All Status' :s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['#', 'Type', 'Item', 'Student', 'Date & Time', 'Status', 'Quick Actions', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No reservations found.
                  </td>
                </tr>
              ) : paginated.map((r, idx) => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">

                  {/* # */}
                  <td className="px-4 py-4 text-xs font-bold text-gray-400">
                    {(page - 1) * PER_PAGE + idx + 1}
                  </td>

                  {/* Type */}
                  <td className="px-4 py-4">
                    <TypeBadge type={r.type} />
                  </td>

                  {/* Item */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${r.type === 'Book' ? 'bg-indigo-50' : 'bg-purple-50'}`}>
                        {r.type === 'Book'
                          ? <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                          : <DoorOpen className="h-3.5 w-3.5 text-purple-500" />}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{r.refName}</span>
                    </div>
                  </td>

                  {/* Student */}
                  <td className="px-4 py-4">
                    <div className="text-sm font-bold text-gray-900">{r.userName}</div>
                    <div className="text-xs text-gray-400 font-mono">{r.userId}</div>
                  </td>

                  {/* Date & Time */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      {r.date}
                    </div>
                    {r.startTime && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {r.startTime} – {r.endTime}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <StatusBadge status={r.status} />
                  </td>

                  {/* Quick Actions */}
                  <td className="px-4 py-4">
                    {r.status === 'Pending' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => quickStatus(r.id, 'Approved')}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition-colors"
                          title="Approve"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </button>
                        <button
                          onClick={() => quickStatus(r.id, 'Rejected')}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[11px] font-bold transition-colors"
                          title="Reject"
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    )}
                    {r.status === 'Approved' && (
                      <button
                        onClick={() => quickStatus(r.id, 'Completed')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" /> Complete
                      </button>
                    )}
                    {(r.status === 'Rejected' || r.status === 'Completed') && (
                      <span className="text-xs text-gray-300 italic">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setViewRes(r)}
                        className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(r)}
                        className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(r.id)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Showing {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-xl text-sm font-bold transition-all ${
                    p === page ? 'bg-indigo-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <Modal
          title={editRes ? `Edit — ${editRes.refName}` : 'Add New Reservation'}
          onClose={() => setShowModal(false)}
          wide
        >
          <ReservationForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={() => setShowModal(false)}
            isEdit={!!editRes}
            saving={saving}
          />
        </Modal>
      )}

      {/* ── View Modal ── */}
      {viewRes && (
        <Modal title="Reservation Details" onClose={() => setViewRes(null)}>
          <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <TypeBadge type={viewRes.type} />
              <StatusBadge status={viewRes.status} />
            </div>

            {/* Item */}
            <div className={`flex items-center gap-3 p-4 rounded-xl ${
              viewRes.type === 'Book' ? 'bg-indigo-50' : 'bg-purple-50'
            }`}>
              {viewRes.type === 'Book'
                ? <BookOpen className="h-6 w-6 text-indigo-500" />
                : <DoorOpen className="h-6 w-6 text-purple-500" />}
              <div>
                <p className="text-xs text-gray-500">{viewRes.type}</p>
                <p className="text-base font-black text-gray-900">{viewRes.refName}</p>
              </div>
            </div>

            {/* Student */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Student Name</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{viewRes.userName}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Student ID</p>
                <p className="text-sm font-bold font-mono text-gray-900 mt-0.5">{viewRes.userId}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 rounded-xl p-3 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-bold text-gray-900">{viewRes.date}</p>
                </div>
              </div>
              {viewRes.startTime && (
                <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-xs text-gray-500">Time Slot</p>
                    <p className="text-sm font-bold text-gray-900">{viewRes.startTime} – {viewRes.endTime}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {viewRes.notes && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-700">{viewRes.notes}</p>
              </div>
            )}

            {/* Quick action from view modal */}
            {viewRes.status === 'Pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => { quickStatus(viewRes.id, 'Approved'); setViewRes(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button
                  onClick={() => { quickStatus(viewRes.id, 'Rejected'); setViewRes(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </div>
            )}

            {/* Edit / Delete */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => { setViewRes(null); openEdit(viewRes); }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 className="h-4 w-4" /> Edit
              </button>
              <button
                onClick={() => { setViewRes(null); setDeleteId(viewRes.id); }}
                className="py-2.5 px-4 rounded-xl bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {deleteId && (
        <Modal title="Delete Reservation" onClose={() => setDeleteId(null)}>
          <div className="text-center space-y-4">
            <div className="mx-auto h-14 w-14 bg-red-100 rounded-2xl flex items-center justify-center">
              <Trash2 className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Are you sure?</p>
              <p className="text-xs text-gray-500 mt-1">
                This will permanently delete the reservation for{' '}
                <strong>{reservations.find(r => r.id === deleteId)?.userName}</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
