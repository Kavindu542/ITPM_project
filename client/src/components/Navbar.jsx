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

    const isActive = (path) => location.pathname === path;

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${scrolled
            ? 'bg-white/80 dark:bg-slate-900/80 shadow-lg border-gray-200 dark:border-slate-800 h-24'
            : 'bg-white/40 dark:bg-slate-900/40 border-transparent h-28'
            } backdrop-blur-2xl`}>
            <div className="container mx-auto px-6 h-full">
                <div className="flex items-center justify-between h-full">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <img
                            src="/campuscore-logo.png"
                            alt="CampusCore"
                            className="h-16 w-auto relative z-10 group-hover:scale-105 transition-transform duration-300"
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-1">
                        <Link
                            to="/"
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive('/')
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            Home
                        </Link>

                        {/* Modules Dropdown */}
                        <div className="relative group/modules">
                            <button
                                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${modules.some(m => location.pathname.startsWith(m.path))
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
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
                                        className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isActive(m.path)
                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
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
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive(link.path)
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
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
                            onLogout={() => onLoggedOut?.('/admin/signin')}
                            onProfile={onProfile}
                        />

                        {/* Mobile Toggle */}
                        <button
                            className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
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
                <div className="flex flex-col h-full pt-24 px-6 gap-6">
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
