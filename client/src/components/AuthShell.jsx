import React from 'react';
import { Moon, Sun } from 'lucide-react';

export default function AuthShell({ children }) {
  const bgImageUrl =
    'https://img.freepik.com/free-photo/students-studying-street_23-2147860544.jpg?w=1060';

  return (
    <div
      className="min-h-screen font-sans relative overflow-hidden"
      style={{
        backgroundImage: `url('${bgImageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-slate-900/45" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-6">
        {/* Removed dark mode toggle button */}
        <div className="w-full max-w-5xl rounded-3xl border border-white/25 bg-white/10 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="hidden md:block relative min-h-[620px]">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700/60 via-slate-700/55 to-slate-800/70" />
              <div className="absolute inset-0 opacity-35">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/30" />
                <div className="absolute top-1/3 left-10 h-20 w-20 rounded-full bg-white/25" />
                <div className="absolute bottom-12 left-1/4 h-28 w-28 rounded-full bg-white/20" />
                <div className="absolute bottom-10 right-12 h-24 w-24 rounded-full bg-white/20" />
              </div>
              <div className="absolute inset-0 z-10 flex items-center justify-center p-8">
                <div className="w-full max-w-sm rounded-3xl bg-slate-500/20 px-8 py-10 text-center shadow-xl">
                  <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                    CC
                  </div>
                  <div className="text-white text-4xl font-extrabold tracking-tight">CampusCore</div>
                  <div className="mt-2 text-slate-100 text-sm font-medium tracking-wide">Smart Campus Portal</div>
                </div>
              </div>
            </div>

            <div className="bg-white/92 p-8 md:p-10 lg:p-12 border-l border-white/60">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}