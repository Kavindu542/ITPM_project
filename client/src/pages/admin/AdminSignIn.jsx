import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import AuthShell from '../../components/AuthShell';

export default function AdminSignIn({ onSignedIn }) {
  return (
    <AuthShell>
      <div>
            <div className="mb-6 flex justify-center">
              <img
                src="/campuscore-logo.png"
                alt="CampusCore"
                className="h-20 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-600">
              <Shield className="h-4 w-4" />
              <span>Admin access</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold text-gray-900 text-center">Choose a module</h1>
            <p className="mt-2 text-center text-sm text-gray-500">Continue to the module admin login</p>

            <div className="mt-8">
              <div className="text-xs font-medium text-gray-600">Modules</div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors shadow-sm"
                  to="/admin/study-material/signin"
                >
                  <div className="text-sm font-bold text-gray-900">Study Material</div>
                  <div className="mt-1 text-xs text-gray-600">Upload and manage resources</div>
                </Link>
                <Link
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors shadow-sm"
                  to="/admin/hostel"
                >
                  <div className="text-sm font-bold text-gray-900">Hostel</div>
                  <div className="mt-1 text-xs text-gray-600">Warden, laundry, meals shop</div>
                </Link>
                <Link
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors shadow-sm"
                  to="/admin/library/signin"
                >
                  <div className="text-sm font-bold text-gray-900">Library</div>
                  <div className="mt-1 text-xs text-gray-600">Books, borrowing, notices</div>
                </Link>
                <Link
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors shadow-sm"
                  to="/admin/club-and-society/signin"
                >
                  <div className="text-sm font-bold text-gray-900">Club and Society</div>
                  <div className="mt-1 text-xs text-gray-600">Events and announcements</div>
                </Link>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 text-sm">
                Student login?{' '}
                <Link className="font-semibold text-slate-700 hover:text-slate-600 hover:underline" to="/signin">
                  Sign in
                </Link>
              </p>
            </div>
      </div>
    </AuthShell>
  );
}
