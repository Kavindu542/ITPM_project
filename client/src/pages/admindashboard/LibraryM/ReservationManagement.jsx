import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Search, Trash2, X,
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
  Clock, User, BookOpen, DoorOpen,
  Eye, RefreshCw, Download, Loader2,
} from 'lucide-react';
import { reservationService } from '../../../services/libraryService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ❌ remove INITIAL_RESERVATIONS constant block completely

const STATUSES = ['All', 'Confirmed', 'Cancelled', 'Completed', 'In Progress', 'Rejected', 'Expired'];

const STATUS_CFG = {
  Pending: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
  Confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-400' },
  Completed: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  Expired: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  'In Progress': { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-400' },
  Cancelled: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{status}
    </span>
  );
}

function TypeBadge({ type }) {
  let bg = 'bg-gray-100 text-gray-600';
  let Icon = Eye;
  if (type === 'Book') { bg = 'bg-indigo-100 text-indigo-600'; Icon = BookOpen; }
  else if (type === 'Study Room') { bg = 'bg-purple-100 text-purple-600'; Icon = DoorOpen; }
  else if (type === 'Seat') { bg = 'bg-emerald-100 text-emerald-600'; Icon = User; }
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${bg}`}>
      <Icon className="h-3 w-3" />{type}
    </span>
  );
}

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


export default function ReservationManagement() {
  const [reservations, setReservations] = useState([]); // changed
  const [usingDummy, setUsingDummy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [deleteId, setDeleteId] = useState(null);
  const [viewRes, setViewRes] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // ── Fetch Reservations ─────────────────────────────────
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (typeFilter !== 'All') params.type = typeFilter;
      if (search) params.search = search;

      const res = await reservationService.getAll(params);
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

  const [activeTab, setActiveTab] = useState('Study Room'); // Changed default to Study Room

  const exportPDF = () => {
    const doc = new jsPDF();
    const title = `${activeTab} Reservations Report`;
    const dateStr = new Date().toLocaleDateString();

    doc.setFontSize(22);
    doc.setTextColor(31, 41, 55); // Slate 800
    doc.text(title, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Slate 400
    doc.text(`Generated on: ${dateStr}`, 14, 30);
    doc.text(`CampusCore Library Management System`, 14, 35);

    const tableData = filtered.map((r) => [
      r.type,
      r.refName || (r.type === 'Seat' ? `Seat ${r.seatNumber}` : (r.studyRoomId?.name || r.studyRoomId?.roomNumber || 'Study Room')),
      r.userName || r.userId?.name || (r.userId?.firstName ? `${r.userId.firstName} ${r.userId.lastName}` : 'N/A'),
      `${new Date(r.reservationDate || r.date).toLocaleDateString()} ${r.startTime ? `(${r.startTime} - ${r.endTime})` : ''}`,
      r.status
    ]);

    doc.autoTable({
      startY: 45,
      head: [['Type', 'Item/Seat', 'Student', 'Date & Time', 'Status']],
      body: tableData,
      headStyles: {
        fillColor: [79, 70, 229], // Indigo 600
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        overflow: 'linebreak'
      },
      columnStyles: {
        4: { fontStyle: 'bold' } // Status bold
      },
      theme: 'grid'
    });

    doc.save(`${activeTab.toLowerCase()}_reservations_report.pdf`);
  };

  // Mark expired reservations
  useEffect(() => {
    let changed = false;
    const updated = reservations.map(r => {
      if (r.status === 'Pending' || r.status === 'Approved') {
        const resDate = new Date(r.date);
        const today = new Date();
        if (resDate < today && resDate.toDateString() !== today.toDateString()) {
          changed = true;
          return { ...r, status: 'Expired' };
        }
      }
      return r;
    });
    if (changed) setReservations(updated);
  }, [reservations]);

  const filtered = reservations.filter(r => {
    let pass = (r.type === activeTab);

    if (pass && statusFilter !== 'All' && r.status !== statusFilter) pass = false;
    if (pass && search) {
      const q = search.toLowerCase();
      pass = [r.userName, String(r.userId), r.refName, r.seatNumber].some(val =>
        val && String(val).toLowerCase().includes(q)
      );
    }
    return pass;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openEdit = (r) => {
    // Librarians can still edit notes etc if needed, but keeping it simple
    setViewRes(r);
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
    const headers = ['ID', 'Type', 'Reference', 'Student ID', 'Student Name', 'Date', 'Start', 'End', 'Status', 'Notes'];
    const rows = filtered.map(r => [r._id || r.id, r.type, r.refName, r.userId, r.userName, r.date, r.startTime, r.endTime, r.status, r.notes]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'reservations.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Reservation Management</h2>
          <p className="text-sm text-gray-500 mt-1">{reservations.length} total reservations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all">
            <Download className="h-4 w-4" /> Export PDF Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: reservations.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Pending', value: reservations.filter(r => r.status === 'Pending').length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Approved', value: reservations.filter(r => r.status === 'Approved').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Completed', value: reservations.filter(r => r.status === 'Completed').length, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 border border-white`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm mb-4 flex gap-2">
        <button
          onClick={() => { setActiveTab('Study Room'); setPage(1); }}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'Study Room' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}>
          Study Room Bookings
        </button>
        <button
          onClick={() => { setActiveTab('Seat'); setPage(1); }}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'Seat' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}>
          Seat Reservations
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by student, ID or item..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white cursor-pointer">
            {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['#', 'Type', 'Item/Seat', 'Student', 'Date & Time', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No reservations found.
                  </td>
                </tr>
              ) : paginated.map((r, idx) => (
                <tr key={r._id || r.id} className="hover:bg-gray-50/50 transition-colors group">

                  {/* # */}
                  <td className="px-4 py-4 text-xs font-bold text-gray-400">
                    {(page - 1) * PER_PAGE + idx + 1}
                  </td>

                  {/* Type */}
                  <td className="px-4 py-4">
                    <TypeBadge type={r.type} />
                  </td>

                  {/* Item / Seat */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${r.type === 'Book' ? 'bg-indigo-50' : r.type === 'Seat' ? 'bg-emerald-50' : 'bg-purple-50'}`}>
                        {r.type === 'Book'
                          ? <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                          : r.type === 'Seat' ? <User className="h-3.5 w-3.5 text-emerald-500" />
                            : <DoorOpen className="h-3.5 w-3.5 text-purple-500" />}
                      </div>
                      <span className="text-sm font-black text-slate-800">
                        {r.refName || (r.type === 'Seat' ? `Seat ${r.seatNumber}` : (r.studyRoomId?.name || r.studyRoomId?.roomNumber || 'Study Room'))}
                      </span>
                    </div>
                  </td>

                  {/* Student */}
                  <td className="px-4 py-4">
                    <div className="text-sm font-black text-slate-800">
                      {r.userName || r.userId?.name || (r.userId?.firstName ? `${r.userId.firstName} ${r.userId.lastName}` : 'Student')}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      {r.userId?.studentId || (typeof r.userId === 'string' ? r.userId : 'ID N/A')}
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      {new Date(r.reservationDate || r.date).toLocaleDateString()}
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
                  className={`w-8 h-8 rounded-xl text-sm font-bold transition-all ${p === page ? 'bg-indigo-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
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
            <div className={`flex items-center gap-3 p-4 rounded-xl ${viewRes.type === 'Book' ? 'bg-indigo-50' : viewRes.type === 'Seat' ? 'bg-emerald-50' : 'bg-purple-50'
              }`}>
              {viewRes.type === 'Book'
                ? <BookOpen className="h-6 w-6 text-indigo-500" />
                : viewRes.type === 'Seat' ? <User className="h-6 w-6 text-emerald-500" /> : <DoorOpen className="h-6 w-6 text-purple-500" />}
              <div>
                <p className="text-xs text-gray-500">{viewRes.type}</p>
                <p className="text-base font-black text-gray-900">{viewRes.refName || (viewRes.seatNumber ? `Seat ${viewRes.seatNumber}` : '')}</p>
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

            {/* Delete button from view modal */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => { setViewRes(null); setDeleteId(viewRes._id || viewRes.id); }}
                className="w-full py-2.5 rounded-xl bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Delete Reservation Record
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
