import React from 'react';
import { LogOut, Settings, User } from 'lucide-react';

export default function UserMenu({
  user,
  onLogout,
  onProfile,
  onSettings,
  theme = 'light',
  idLabel = 'ID',
}) {
  const name = user?.name || 'User';
  const idValue = user?.studentId || user?.employeeId || user?.id || user?.email || '';
  const avatarUrl = user?.avatarUrl || '';
  const [avatarBroken, setAvatarBroken] = React.useState(false);

  const nameClass = 'text-gray-900';
  const idClass = 'text-gray-500';
  const menuClass = 'absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50';
  const itemClass = 'w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2';
  const logoutClass = 'w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2';

  return (
    <div className="relative group">
      <button type="button" className="flex items-center gap-3 text-left">
        <div className="text-right hidden sm:block">
          <p className={`text-sm font-medium ${nameClass}`}>{name}</p>
          {idValue ? (
            <p className={`text-xs ${idClass}`}>{idLabel}: {idValue}</p>
          ) : (
            <p className={`text-xs ${idClass}`}> </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-[#25f194] flex items-center justify-center text-white font-semibold cursor-pointer overflow-hidden">
          {avatarUrl && !avatarBroken ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="h-full w-full object-cover"
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            String(name).charAt(0).toUpperCase()
          )}
        </div>
      </button>

      <div className={menuClass}>
        {onProfile ? (
          <button
            type="button"
            className={itemClass}
            onClick={onProfile}
          >
            <User className="h-4 w-4" />
            Profile
          </button>
        ) : null}
        {onSettings ? (
          <button
            type="button"
            className={itemClass}
            onClick={onSettings}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        ) : null}
        <button
          type="button"
          className={logoutClass}
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
