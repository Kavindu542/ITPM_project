import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import AuthShell from '../../components/AuthShell';

export default function HostelAdmins() {
  return (
    <AuthShell>
      <div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-500">
              <Shield className="h-4 w-4" />
              <span>Hostel admin</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold text-gray-900 text-center">Choose a service</h1>
            <p className="mt-2 text-center text-sm text-gray-500">Select the service you manage to continue</p>

            <div className="mt-8">
              <div className="text-xs font-medium text-gray-500">Services</div>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <Link
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors shadow-sm"
                  to="/admin/hostel/warden/signin"
                >
                  <div className="text-sm font-bold text-gray-900">Warden</div>
                  <div className="mt-1 text-xs text-gray-500">Hostel notices and approvals</div>
                </Link>
                <Link
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors shadow-sm"
                  to="/admin/hostel/laundry/signin"
                >
                  <div className="text-sm font-bold text-gray-900">Laundry</div>
                  <div className="mt-1 text-xs text-gray-500">Laundry services and updates</div>
                </Link>
                <Link
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors shadow-sm"
                  to="/admin/hostel/meals-shop/signin"
                >
                  <div className="text-sm font-bold text-gray-900">Meals Shop</div>
                  <div className="mt-1 text-xs text-gray-500">Meals and menu announcements</div>
                </Link>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <Link className="font-semibold text-slate-700 hover:text-slate-600 hover:underline" to="/admin/signin">
                Back to modules
              </Link>
            </div>
      </div>
    </AuthShell>
  );
}
