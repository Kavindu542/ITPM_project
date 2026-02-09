import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function HostelAdmins() {
  const bgImageUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMCRQyVSlJQ6KJGV8swWe-NB9s5wwNp2_YcQ&s";
  return (
    <div
      className="min-h-screen font-sans flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url('${bgImageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Service selection */}
          <div className="p-8 md:p-10 bg-white/80 backdrop-blur-xl">
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
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
                  to="/admin/hostel/warden/signin"
                >
                  <div className="text-sm font-bold text-gray-900">Warden</div>
                  <div className="mt-1 text-xs text-gray-500">Hostel notices and approvals</div>
                </Link>
                <Link
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
                  to="/admin/hostel/laundry/signin"
                >
                  <div className="text-sm font-bold text-gray-900">Laundry</div>
                  <div className="mt-1 text-xs text-gray-500">Laundry services and updates</div>
                </Link>
                <Link
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
                  to="/admin/hostel/meals-shop/signin"
                >
                  <div className="text-sm font-bold text-gray-900">Meals Shop</div>
                  <div className="mt-1 text-xs text-gray-500">Meals and menu announcements</div>
                </Link>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <Link className="font-semibold text-blue-600 hover:underline" to="/admin/signin">
                Back to modules
              </Link>
            </div>
          </div>

          {/* Right: Gradient Panel */}
          <div className="hidden md:block relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600" />
            <div className="absolute inset-0 opacity-30">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/30" />
              <div className="absolute top-1/3 left-10 h-20 w-20 rounded-full bg-white/25" />
              <div className="absolute bottom-12 left-1/4 h-28 w-28 rounded-full bg-white/20" />
              <div className="absolute bottom-10 right-12 h-24 w-24 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
