import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    BookOpen,
    Library,
    Building2,
    Users2,
    Info,
    Phone,
    HelpCircle,
    Menu,
    X,
    ChevronDown
} from 'lucide-react';
import UserMenu from './UserMenu';

export default function Navbar({ user, onLoggedOut, onProfile }) {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [modulesOpen, setModulesOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setIsOpen(false);
        setModulesOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'About Us', path: '/about', icon: Info },
        { name: 'Contact Us', path: '/contact', icon: Phone },
        { name: 'FAQ', path: '/faq', icon: HelpCircle },
    ];

    const modules = [
        { name: 'Study Material', path: '/materials', icon: BookOpen },
        { name: 'Library', path: '/library', icon: Library },
        { name: 'Hostel', path: '/hostel', icon: Building2 },
        { name: 'Clubs', path: '/clubs', icon: Users2 },
    ];

    const isExactActive = (path) => location.pathname === path;
    const isPathActive = (basePath) =>
        location.pathname === basePath || location.pathname.startsWith(`${basePath}/`);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-2xl transition-all duration-300 ${scrolled
            ? 'bg-white/80 dark:bg-slate-900/80 border-gray-200/70 dark:border-slate-800/70 h-20'
            : 'bg-white/50 dark:bg-slate-900/50 border-transparent h-18'
            }`}>
            <div className="container mx-auto px-4 sm:px-6 h-full">
                <div className="flex items-center justify-between h-full">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <img
                            src="/campuscore-logo.png"
                            alt="CampusCore"
                            className={`w-auto relative z-10 transition-transform duration-300 group-hover:scale-105 ${scrolled ? 'h-9 sm:h-10' : 'h-10 sm:h-11'}`}
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-1">
                        <Link
                            to="/"
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isExactActive('/')
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                                }`}
                        >
                            Home
                        </Link>

                        {/* Modules Dropdown */}
                        <div className="relative group/modules">
                            <button
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={modulesOpen}
                                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${modules.some(m => isPathActive(m.path))
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                                    }`}
                            >
                                Modules
                                <ChevronDown size={14} className="group-hover/modules:rotate-180 transition-transform" />
                            </button>
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 py-2 opacity-0 invisible group-hover/modules:opacity-100 group-hover/modules:visible transition-all duration-200 transform translate-y-2 group-hover/modules:translate-y-0">
                                {modules.map((m) => (
                                    <Link
                                        key={m.name}
                                        to={m.path}
                                        className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isPathActive(m.path)
                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <m.icon size={18} />
                                        {m.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {navLinks.slice(1).map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isExactActive(link.path)
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* User & Actions */}
                    <div className="flex items-center gap-3">
                        <UserMenu
                            user={user}
                            onLogout={() => onLoggedOut?.('/signin')}
                            onProfile={onProfile}
                        />

                        {/* Mobile Toggle */}
                        <button
                            type="button"
                            aria-label={isOpen ? 'Close menu' : 'Open menu'}
                            className="lg:hidden p-2 rounded-xl border border-gray-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 text-gray-700 dark:text-gray-200"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`lg:hidden fixed inset-0 z-40 bg-white dark:bg-slate-950 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <div className="flex flex-col h-full pt-28 px-6 gap-6">
                    <Link
                        to="/"
                        className="text-2xl font-bold text-gray-900 dark:text-white"
                        onClick={() => setIsOpen(false)}
                    >
                        Home
                    </Link>

                    <div className="flex flex-col gap-4">
                        <button
                            className="flex items-center justify-between text-2xl font-bold text-gray-900 dark:text-white"
                            onClick={() => setModulesOpen(!modulesOpen)}
                            type="button"
                            aria-expanded={modulesOpen}
                        >
                            Modules
                            <ChevronDown className={`transition-transform ${modulesOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {modulesOpen && (
                            <div className="flex flex-col gap-4 pl-4 border-l-2 border-blue-500">
                                {modules.map((m) => (
                                    <Link
                                        key={m.name}
                                        to={m.path}
                                        className="flex items-center gap-3 text-lg text-gray-600 dark:text-gray-400"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <m.icon size={20} />
                                        {m.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {navLinks.slice(1).map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className="text-2xl font-bold text-gray-900 dark:text-white"
                            onClick={() => setIsOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
