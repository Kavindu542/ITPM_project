import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import UserMenu from '../UserMenu';

/** Library-style sidebar item using local state (tabs). Matches NavLink active look (light blue). */
export function AdminSidebarNavButton({
  active,
  onClick,
  icon: Icon,
  label,
  description,
  collapsed,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
        active
          ? 'border border-blue-100 bg-blue-50 text-blue-800 shadow-sm'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <Icon
        className={`h-5 w-5 shrink-0 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
      />
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <div>{label}</div>
            {description ? (
              <div className="truncate text-[11px] font-normal text-gray-400">{description}</div>
            ) : null}
          </div>
          {active ? <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" /> : null}
        </>
      )}
    </button>
  );
}

/** Same styling as nav buttons, for react-router Link (e.g. back to hostel hub). */
export function AdminSidebarNavLinkItem({ to, end, icon: Icon, label, description, collapsed }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 no-underline ${
          isActive
            ? 'border border-blue-100 bg-blue-50 text-blue-800 shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`h-5 w-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
          />
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div>{label}</div>
                {description ? (
                  <div className="truncate text-[11px] font-normal text-gray-400">{description}</div>
                ) : null}
              </div>
              {isActive ? <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" /> : null}
            </>
          )}
        </>
      )}
    </NavLink>
  );
}

/**
 * Shared Library admin layout: white collapsible sidebar, logo, Menu section,
 * blue active states, top header + UserMenu, grey main area.
 */
export default function AdminLibraryShell({
  user,
  headerTitle,
  headerSubtitle,
  onLogout,
  onProfile,
  sidebarNav,
  children,
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 font-sans">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative flex h-screen min-h-0 overflow-hidden">
        <aside
          className={`${collapsed ? 'w-20' : 'w-64'} shrink-0 transition-all duration-300 ease-in-out`}
        >
          <div className="flex h-full min-h-0 flex-col border-r border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-4 sm:px-4 sm:py-5">
              <div className={`flex min-w-0 flex-1 items-center ${collapsed ? 'w-full justify-center' : ''}`}>
                <img
                  src="/campuscore-logo.png"
                  alt="CampusCore"
                  className={`shrink-0 object-contain object-left ${
                    collapsed
                      ? 'mx-auto h-10 max-w-[3.25rem]'
                      : 'h-14 w-auto max-w-[min(100%,11.75rem)] sm:h-16'
                  }`}
                />
              </div>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
            </div>

            {collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="mx-auto mt-2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {!collapsed && (
                <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Menu
                </p>
              )}
              {typeof sidebarNav === 'function' ? sidebarNav({ collapsed }) : sidebarNav}
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-50 shrink-0 border-b border-gray-200 bg-white">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900">{headerTitle}</h1>
                  <p className="text-xs text-gray-500">{headerSubtitle}</p>
                </div>
                <UserMenu
                  user={user}
                  onProfile={onProfile}
                  onLogout={onLogout}
                  theme="light"
                  idLabel="ID"
                />
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

/** Renders a vertical list of NavLinks with Library-style active (blue pill). */
export function AdminShellNavLinks({ items, collapsed }) {
  return items.map((item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            isActive
              ? 'border border-blue-100 bg-blue-50 text-blue-800 shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          } ${collapsed ? 'justify-center' : ''}`
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              className={`h-5 w-5 shrink-0 ${
                isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              }`}
            />
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className={isActive ? 'text-blue-900' : ''}>{item.label}</div>
                  {item.description ? (
                    <div className="truncate text-[11px] font-normal text-gray-400">{item.description}</div>
                  ) : null}
                </div>
                {isActive ? <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" /> : null}
              </>
            )}
          </>
        )}
      </NavLink>
    );
  });
}
