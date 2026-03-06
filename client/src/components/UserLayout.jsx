import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

export default function UserLayout({ user, onLoggedOut }) {
    const navigate = useNavigate();
    const location = useLocation();

    const hideFooter =
        location.pathname.startsWith('/materials')
        || location.pathname.startsWith('/library')
        || location.pathname.startsWith('/hostel');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col">
            <Navbar
                user={user}
                onLoggedOut={onLoggedOut}
                onProfile={() => navigate('/profile')}
            />
            <main className="relative pt-20 flex-1 min-h-0">
                <Outlet />
            </main>

            {/* Global Footer */}
            {!hideFooter ? (
                <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 py-12">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                            <div className="col-span-1 md:col-span-2">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-[#25f194] rounded-xl flex items-center justify-center text-white shadow-lg">
                                        <span className="font-bold text-xl">C</span>
                                    </div>
                                    <span className="text-xl font-bold dark:text-white">CampusCore</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-6">
                                    The all-in-one campus management system designed to make student life smarter,
                                    easier, and more connected. Experience the future of campus living.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold mb-6 dark:text-white">Modules</h4>
                                <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                                    <li><button onClick={() => navigate('/materials')} className="hover:text-blue-500 transition-colors">Study Material</button></li>
                                    <li><button onClick={() => navigate('/library')} className="hover:text-blue-500 transition-colors">Library</button></li>
                                    <li><button onClick={() => navigate('/hostel')} className="hover:text-blue-500 transition-colors">Hostel</button></li>
                                    <li><button onClick={() => navigate('/clubs')} className="hover:text-blue-500 transition-colors">Clubs</button></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold mb-6 dark:text-white">Support</h4>
                                <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                                    <li><button onClick={() => navigate('/about')} className="hover:text-blue-500 transition-colors">About Us</button></li>
                                    <li><button onClick={() => navigate('/contact')} className="hover:text-blue-500 transition-colors">Contact Us</button></li>
                                    <li><button onClick={() => navigate('/faq')} className="hover:text-blue-500 transition-colors">FAQ</button></li>
                                    <li><button onClick={() => navigate('/privacy')} className="hover:text-blue-500 transition-colors">Privacy Policy</button></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                            <p>© 2026 CampusCore. All rights reserved.</p>
                            <div className="flex gap-6">
                                <a href="#" className="hover:text-blue-500 transition-colors">Twitter</a>
                                <a href="#" className="hover:text-blue-500 transition-colors">LinkedIn</a>
                                <a href="#" className="hover:text-blue-500 transition-colors">Instagram</a>
                            </div>
                        </div>
                    </div>
                </footer>
            ) : null}
        </div>
    );
}
