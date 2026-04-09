import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';

export default function AttendanceScan({ user }) {
  const { meetingId } = useParams();
  const [status, setStatus] = React.useState('idle'); // idle | loading | success | duplicate | error
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!meetingId) {
        setStatus('error');
        setMessage('Missing meeting id.');
        return;
      }

      setStatus('loading');
      setMessage('Marking your attendance…');

      try {
        const res = await attendanceService.markAttendance(meetingId);
        if (cancelled) return;
        setStatus('success');
        setMessage(res?.message || 'Attendance marked successfully.');
      } catch (err) {
        if (cancelled) return;
        const code = err?.response?.status;
        const apiMsg = err?.response?.data?.message;

        if (code === 409) {
          setStatus('duplicate');
          setMessage(apiMsg || 'Attendance already marked.');
          return;
        }

        setStatus('error');
        setMessage(apiMsg || 'Failed to mark attendance.');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  const icon =
    status === 'success' || status === 'duplicate' ? (
      <CheckCircle2 className="h-10 w-10 text-emerald-600" />
    ) : status === 'error' ? (
      <AlertTriangle className="h-10 w-10 text-red-600" />
    ) : (
      <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
    );

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {icon}
            <div className="min-w-0">
              <div className="text-xl font-extrabold text-gray-900">Attendance</div>
              <div className="text-xs text-gray-500 break-all">Meeting: {String(meetingId || '')}</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              status === 'success' || status === 'duplicate'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : status === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-indigo-200 bg-indigo-50 text-indigo-800'
            }`}
          >
            {message}
          </div>

          <div className="mt-4 text-xs text-gray-600">
            Logged in as: <span className="font-semibold text-gray-900">{user?.name || 'User'}</span>
            {user?.studentId ? <span className="text-gray-500"> • {user.studentId}</span> : null}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Go to Home
            </Link>
            <Link
              to="/clubs"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Clubs
            </Link>
          </div>

          {status === 'error' ? (
            <div className="mt-4 text-xs text-gray-500">
              If you scanned this QR and got an error, confirm you’re signed in with your student account and the meeting still exists.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
