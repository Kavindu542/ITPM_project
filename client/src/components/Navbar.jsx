import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Info, Phone, HelpCircle, Menu, X } from 'lucide-react';

const NAV_LINKS = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/about', label: 'About Us', icon: Info },
    { to: '/contact', label: 'Contact Us', icon: Phone },
    { to: '/faq', label: 'FAQ', icon: HelpCircle },
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = React.useState(false);

    return (
        <>
            {/* ─── Desktop Nav ─────────────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-1">
                {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            `relative inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group
                             ${isActive
                                ? 'text-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm shadow-blue-100 border border-blue-100'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600' : ''}`} />
                                {label}
                                {/* Active underline dot */}
                                {isActive && (
                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-500" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* ─── Mobile Toggle ───────────────────────────────────── */}
            <button
                className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
            >
                {mobileOpen
                    ? <X className="h-5 w-5 text-gray-700" />
                    : <Menu className="h-5 w-5 text-gray-700" />}
            </button>

            {/* ─── Mobile Drawer ───────────────────────────────────── */}
            <div
                className={`absolute top-full left-0 right-0 md:hidden z-40 transition-all duration-300 ease-in-out overflow-hidden
                    ${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                style={{ backdropFilter: 'blur(24px)' }}
            >
                <div className="bg-white/98 border-b border-gray-200 shadow-xl">
                    <nav className="px-4 py-3 flex flex-col gap-1">
                        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === '/'}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                                     ${isActive
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <Icon className="h-3.5 w-3.5" />
                                        </span>
                                        {label}
                                        {isActive && (
                                            <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>
        </>
    );
}
