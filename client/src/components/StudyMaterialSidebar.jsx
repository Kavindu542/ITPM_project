import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  FolderOpen,
  Heart,
  MessageSquare,
  MessagesSquare,
  Star,
  UploadCloud,
} from 'lucide-react';

const items = [
  { to: '/materials/all', label: 'All materials', Icon: FolderOpen },
  { to: '/materials/favs', label: 'Favourites', Icon: Heart },
  { to: '/materials/history', label: 'History', Icon: Clock },
  { to: '/materials/contribute', label: 'Contribute', Icon: UploadCloud },
  { to: '/materials/requests', label: 'Missing resource requests', Icon: MessageSquare },
  { to: '/materials/reviews', label: 'Ratings & reviews', Icon: Star },
  { to: '/materials/forum', label: 'Academic support forum', Icon: MessagesSquare },
];

export default function StudyMaterialSidebar({ user }) {
  return (
    <aside className="h-full">
      {/* Mobile/tablet: keep a readable list menu */}
      <div className="lg:hidden bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <div className="text-sm font-bold text-gray-900">Menu</div>
          <div className="text-xs text-gray-500 mt-1">
            {user?.semester ? `Your semester: ${user.semester}` : 'Set your semester in Profile for access rules.'}
          </div>
        </div>
        <div className="p-3 space-y-1">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-[#25f194] to-blue-600 border-transparent text-white shadow-sm'
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                  <span className={isActive ? 'text-white' : 'text-gray-800'}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Desktop: slim blue icon sidebar like image 1 */}
      <div className="hidden lg:flex w-30 self-stretch flex-col items-center justify-between rounded-[2rem] bg-blue-600 px-4 py-6 shadow-sm h-full min-h-0">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0">
          <BookOpen className="h-6 w-6 text-blue-600" />
        </div>

        <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-start gap-3 py-2 overflow-y-auto no-scrollbar">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `w-full flex flex-col items-center rounded-2xl px-3 py-2 transition-colors ${
                  isActive ? 'bg-white text-blue-700' : 'text-white/90 hover:bg-white/10'
                }`
              }
              title={label}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-white'}`} />
                  <span className={`mt-1 text-[11px] font-semibold text-center leading-tight ${isActive ? 'text-gray-900' : 'text-white'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
}
