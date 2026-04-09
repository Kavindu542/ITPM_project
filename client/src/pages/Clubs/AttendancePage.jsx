import React from 'react';
import { useParams } from 'react-router-dom';

import { api } from '../../services/api';

export default function AttendancePage() {
  const { meetingId } = useParams();

  const [studentId, setStudentId] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();

    const sid = String(studentId || '').trim();
    if (!sid) {
      setResult({ type: 'error', message: 'Please enter your Student ID.' });
      return;
    }
    if (!meetingId) {
      setResult({ type: 'error', message: 'Missing meetingId in URL.' });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res = await api.post(`/attendance/${meetingId}/mark`, { studentId: sid });
      const msg = res?.data?.message || 'Attendance marked.';
      setResult({ type: 'success', message: msg });
    } catch (err) {
      const status = err?.response?.status;
      const responseData = err?.response?.data;
      const apiMessage =
        responseData?.message
        || (typeof responseData === 'string' ? responseData : null)
        || err?.message;

      if (status === 409) {
        setResult({ type: 'warning', message: apiMessage || 'Attendance already marked.' });
      } else {
        setResult({ type: 'error', message: apiMessage || 'Failed to mark attendance.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Meeting Attendance</h1>
        <p className="text-sm text-gray-600 mt-1">
          Meeting ID: <span className="font-mono">{meetingId || '-'}</span>
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Student ID</label>
            <input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. IT12345678"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gray-900 text-white px-4 py-2 font-semibold disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Mark Attendance'}
          </button>
        </form>

        {result?.message ? (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${
              result.type === 'success'
                ? 'bg-green-50 text-green-800'
                : result.type === 'warning'
                  ? 'bg-yellow-50 text-yellow-800'
                  : 'bg-red-50 text-red-800'
            }`}
          >
            {result.message}
          </div>
        ) : null}

        <div className="mt-6 text-xs text-gray-500">
          Scan the QR code, enter your Student ID, and submit.
        </div>
      </div>
    </div>
  );
}
